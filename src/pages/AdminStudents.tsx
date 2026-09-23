import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Per-student audit view — search by Master Key (student_id) or email, see
 * when they registered, what they bought (price paid / discount applied),
 * lesson-completion % per course (expandable to each lesson's own quiz
 * score), every resource/toolbox download, and the end-of-course Diagnostic
 * Quiz score — all in one place so a refund/"I paid but got nothing"
 * dispute, or a "did the exam scoring actually work" check, can be done
 * without digging through separate admin pages or trusting the student's
 * own screenshot of their Dashboard.
 *
 * Sources (all read-only here):
 * - course_enrollments / purchase_events — what was bought, and every step
 *   of every checkout attempt (started, cancelled, expired, paid, …).
 * - module_progress — latest state per lesson (what unlocks the next one).
 * - quiz_attempts — EVERY quiz submission incl. failed Knowledge Checks and
 *   the pre-test baseline (module_progress only keeps the latest).
 * - lms_lesson_state — video watched / number of times opened, pre-test done.
 * - diagnostic_attempts / completion_records — end-of-course result and
 *   whether the Completion Record was actually issued.
 * - assignments — submitted work and its review status.
 * quiz_attempts and purchase_events only exist from 2026-09-23 on; older
 * activity appears in the other sources only.
 */

interface AccountMatch {
  student_id: string;
  email: string | null;
  line_user_id: string;
  registered_at: string;
  is_active: boolean;
}

interface EnrollmentDetail {
  id: string;
  course_id: string;
  course_title: string;
  status: string;
  amount_paid: number | null;
  created_at: string;
  promo_code: string | null;
  discount_type: string | null;
  discount_value: number | null;
}

interface ModuleProgressDetail {
  module_id: string;
  code: string;
  name: string;
  status: string;
  score: number | null;
  completed_at: string | null;
}

interface DiagnosticAttemptDetail {
  attempt_number: number;
  score_pct: number;
  accepted: boolean;
  created_at: string;
}

interface QuizAttemptDetail {
  id: string;
  quiz_type: string;
  lesson_code: string | null;
  score_pct: number | null;
  correct: number | null;
  total: number | null;
  passed: boolean | null;
  created_at: string;
}

interface LessonStateDetail { video_watched: boolean; video_view_count: number; pretest_done: boolean }

interface CompletionRecordDetail { record_code: string; issued_at: string }

interface AssignmentDetail { id: string; status: string; score: number | null; rubric_id: string | null; created_at: string }

interface CourseProgress {
  course_id: string;
  course_title: string;
  total_modules: number;
  completed_modules: number;
  modules: ModuleProgressDetail[];
  diagnosticAttempts: DiagnosticAttemptDetail[];
  quizAttempts: QuizAttemptDetail[];
  lessonState: Record<string, LessonStateDetail>;
  pretestDone: boolean;
  record: CompletionRecordDetail | null;
  assignments: AssignmentDetail[];
}

interface PurchaseEventDetail {
  id: string;
  event: string;
  course_title: string | null;
  amount_final: number | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

interface DownloadEvent {
  id: string;
  kind: 'resource' | 'toolbox';
  title: string;
  course_title: string | null;
  at: string;
}

interface StudentDetail {
  studentId: string;
  registeredAt: string | null;
  displayName: string | null;
  userIds: string[];
  enrollments: EnrollmentDetail[];
  progress: CourseProgress[];
  downloads: DownloadEvent[];
  purchaseEvents: PurchaseEventDetail[];
}

const money = (n: number | null) => (n == null ? '-' : `${n.toLocaleString('th-TH')} ฿`);
const dateTh = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

const STATUS_LABEL: Record<string, string> = {
  paid: 'ซื้อแล้ว', free: 'คอร์สฟรี', active: 'ใช้งานอยู่', pending: 'รอชำระเงิน', abandoned: 'ไม่ได้ชำระ/ยกเลิก',
};

const QUIZ_TYPE_LABEL: Record<string, string> = {
  pretest: 'Pre-test', knowledge_check: 'Knowledge Check', diagnostic: 'Diagnostic', no_quiz: 'บทไม่มีข้อสอบ',
};

const PURCHASE_EVENT_LABEL: Record<string, string> = {
  checkout_started: 'กดซื้อ', already_enrolled: 'มีสิทธิ์อยู่แล้ว (ถูกปฏิเสธ)', course_full: 'คอร์สเต็ม (ถูกปฏิเสธ)',
  promo_applied: 'ใช้โค้ดส่วนลด', promo_rejected: 'โค้ดส่วนลดใช้ไม่ได้', free_enrolled: 'ได้สิทธิ์ฟรี',
  pending_replaced: 'รายการเดิมที่ค้างถูกปิด', pending_created: 'สร้างรายการรอชำระ', stripe_session_created: 'ไปหน้าชำระเงิน Stripe',
  checkout_cancelled: 'กดยกเลิกที่ Stripe', checkout_expired: 'หมดเวลาชำระ', payment_verified: 'ยืนยันชำระแล้ว (ตอนกลับเว็บ)',
  webhook_paid: 'Stripe แจ้งชำระแล้ว', error: 'เกิดข้อผิดพลาด',
};

// PostgREST .or() filter syntax uses , ( ) as separators — strip them so a
// pasted value can't break (or widen) the search filter.
const cleanQuery = (q: string) => q.replace(/[,()*%\\]/g, ' ').trim();

const AdminStudents: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<AccountMatch[]>([]);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId); else next.add(courseId);
      return next;
    });
  };

  const search = async (raw: string = query) => {
    const q = cleanQuery(raw);
    if (!q) return;
    setSearching(true);
    setError(null);
    setDetail(null);
    const { data, error: err } = await supabase
      .from('user_accounts')
      .select('student_id,email,line_user_id,registered_at,is_active')
      .or(`student_id.ilike.%${q}%,email.ilike.%${q}%`)
      .order('registered_at', { ascending: false })
      .limit(25);
    setSearching(false);
    if (err) { setError('ค้นหาไม่สำเร็จ: ' + err.message); return; }
    const rows = (data as AccountMatch[]) || [];
    setMatches(rows);
    // Exactly one distinct Master Key matched — load it straight away.
    const distinctIds = new Set(rows.map(r => r.student_id));
    if (rows.length > 0 && distinctIds.size === 1) {
      loadStudent(rows[0].student_id);
    }
  };

  const loadStudent = async (studentId: string) => {
    setLoadingDetail(true);
    setError(null);
    setExpandedCourses(new Set());
    try {
      // 1. Every identity (web + LINE) linked under this Master Key.
      const { data: accounts, error: acctErr } = await supabase
        .from('user_accounts')
        .select('line_user_id, registered_at')
        .eq('student_id', studentId)
        .eq('is_active', true);
      if (acctErr) throw acctErr;

      const userIds = new Set<string>();
      const lineUserIds: string[] = [];
      let earliestRegistered: string | null = null;
      (accounts || []).forEach((a: { line_user_id: string; registered_at: string }) => {
        if (!earliestRegistered || a.registered_at < earliestRegistered) earliestRegistered = a.registered_at;
        if (a.line_user_id.startsWith('web:')) userIds.add(a.line_user_id.replace('web:', ''));
        else lineUserIds.push(a.line_user_id);
      });

      let displayName: string | null = null;
      if (lineUserIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('user_id, display_name').in('line_user_id', lineUserIds);
        (profs || []).forEach((p: { user_id: string; display_name: string | null }) => {
          userIds.add(p.user_id);
          if (!displayName && p.display_name) displayName = p.display_name;
        });
      }
      if (!displayName && userIds.size > 0) {
        const { data: p } = await supabase.from('profiles').select('display_name').in('user_id', [...userIds]).not('display_name', 'is', null).limit(1).maybeSingle();
        displayName = p?.display_name ?? null;
      }

      const ids = [...userIds];
      if (ids.length === 0) {
        setDetail({ studentId, registeredAt: earliestRegistered, displayName, userIds: [], enrollments: [], progress: [], downloads: [], purchaseEvents: [] });
        return;
      }

      // 2. Everything tied to those identities, in parallel.
      const [{ data: enRows }, { data: resLogs }, { data: tbLogs }, { data: purchaseRows }] = await Promise.all([
        supabase.from('course_enrollments')
          .select('id,course_id,status,amount_paid,created_at,promo_code_id,courses(title),promo_codes(code,discount_type,discount_value)')
          .in('user_id', ids).order('created_at', { ascending: false }),
        supabase.from('resource_download_logs')
          .select('id,downloaded_at,course_resources(title),courses(title)')
          .in('user_id', ids).order('downloaded_at', { ascending: false }),
        supabase.from('toolbox_downloads')
          .select('id,downloaded_at,toolbox_assets(title)')
          .in('user_id', ids).order('downloaded_at', { ascending: false }),
        supabase.from('purchase_events')
          .select('id,event,amount_final,detail,created_at,courses(title)')
          .in('user_id', ids).order('created_at', { ascending: false }).limit(200),
      ]);

      type EnrollmentRow = {
        id: string; course_id: string; status: string; amount_paid: number | null; created_at: string;
        courses: { title: string } | null;
        promo_codes: { code: string; discount_type: string; discount_value: number } | null;
      };
      const enrollments: EnrollmentDetail[] = ((enRows as EnrollmentRow[] | null) || []).map((e) => ({
        id: e.id,
        course_id: e.course_id,
        course_title: e.courses?.title || '-',
        status: e.status,
        amount_paid: e.amount_paid,
        created_at: e.created_at,
        promo_code: e.promo_codes?.code ?? null,
        discount_type: e.promo_codes?.discount_type ?? null,
        discount_value: e.promo_codes?.discount_value ?? null,
      }));

      // 3. Lesson-by-lesson completion + score per enrolled course, plus the
      // end-of-course Diagnostic Quiz attempts — the two things needed to
      // actually audit "did scoring/pass-fail work for this student", not
      // just a rolled-up percentage.
      const courseIds = [...new Set(enrollments.map(e => e.course_id))];
      let progress: CourseProgress[] = [];
      if (courseIds.length > 0) {
        const [{ data: mods }, { data: prog }, { data: diag }, { data: attempts }, { data: lessonRows }, { data: recs }, { data: subs }, { data: courseRows }] = await Promise.all([
          supabase.from('course_modules').select('id,course_id,code,name,sort_order').in('course_id', courseIds),
          supabase.from('module_progress').select('module_id,status,score,completed_at').in('user_id', ids),
          supabase.from('diagnostic_attempts').select('course_id,attempt_number,score_pct,accepted,created_at').in('user_id', ids).in('course_id', courseIds),
          supabase.from('quiz_attempts').select('id,course_id,quiz_type,lesson_code,score_pct,correct,total,passed,created_at').eq('student_id', studentId).order('created_at', { ascending: false }),
          supabase.from('lms_lesson_state').select('course_slug,lesson_code,video_watched,video_view_count,pretest_done').eq('student_id', studentId),
          supabase.from('completion_records').select('course_id,record_code,issued_at').in('user_id', ids),
          supabase.from('assignments').select('id,course_id,status,score,rubric_id,created_at').in('user_id', ids).order('created_at', { ascending: false }),
          supabase.from('courses').select('id,slug').in('id', courseIds),
        ]);

        const slugToCourseId = new Map<string, string>(((courseRows as { id: string; slug: string }[] | null) || []).map(c => [c.slug, c.id]));
        type LessonRow = LessonStateDetail & { course_slug: string; lesson_code: string };
        const lessonByCourse = new Map<string, Record<string, LessonStateDetail>>();
        const pretestByCourse = new Set<string>();
        ((lessonRows as LessonRow[] | null) || []).forEach(r => {
          const cid = slugToCourseId.get(r.course_slug);
          if (!cid) return;
          if (r.pretest_done) pretestByCourse.add(cid);
          if (!lessonByCourse.has(cid)) lessonByCourse.set(cid, {});
          lessonByCourse.get(cid)![r.lesson_code] = r;
        });
        type AttemptRow = QuizAttemptDetail & { course_id: string | null };
        const attemptsByCourse = new Map<string, QuizAttemptDetail[]>();
        ((attempts as AttemptRow[] | null) || []).forEach(a => {
          if (!a.course_id) return;
          if (!attemptsByCourse.has(a.course_id)) attemptsByCourse.set(a.course_id, []);
          attemptsByCourse.get(a.course_id)!.push(a);
        });
        const recordByCourse = new Map<string, CompletionRecordDetail>(
          ((recs as (CompletionRecordDetail & { course_id: string })[] | null) || []).map(r => [r.course_id, r]),
        );
        const subsByCourse = new Map<string, AssignmentDetail[]>();
        ((subs as (AssignmentDetail & { course_id: string })[] | null) || []).forEach(a => {
          if (!subsByCourse.has(a.course_id)) subsByCourse.set(a.course_id, []);
          subsByCourse.get(a.course_id)!.push(a);
        });

        type ModuleRow = { id: string; course_id: string; code: string; name: string; sort_order: number };
        const modsByCourse = new Map<string, ModuleRow[]>();
        (mods as ModuleRow[] | null || []).forEach((m) => {
          if (!modsByCourse.has(m.course_id)) modsByCourse.set(m.course_id, []);
          modsByCourse.get(m.course_id)!.push(m);
        });

        type ProgRow = { module_id: string; status: string; score: number | null; completed_at: string | null };
        const progByModule = new Map<string, ProgRow>();
        ((prog as ProgRow[] | null) || []).forEach(p => {
          // If both linked identities somehow have a row for the same
          // module, "completed" always wins as the more correct answer.
          const existing = progByModule.get(p.module_id);
          if (!existing || (existing.status !== 'completed' && p.status === 'completed')) {
            progByModule.set(p.module_id, p);
          }
        });

        type DiagRow = { course_id: string; attempt_number: number; score_pct: number; accepted: boolean; created_at: string };
        const diagByCourse = new Map<string, DiagRow[]>();
        ((diag as DiagRow[] | null) || []).forEach(d => {
          if (!diagByCourse.has(d.course_id)) diagByCourse.set(d.course_id, []);
          diagByCourse.get(d.course_id)!.push(d);
        });

        progress = enrollments
          .filter((e, i) => enrollments.findIndex(x => x.course_id === e.course_id) === i)
          .map(e => {
            const courseModules = (modsByCourse.get(e.course_id) || []).slice().sort((a, b) => a.sort_order - b.sort_order);
            const modules: ModuleProgressDetail[] = courseModules.map(m => {
              const p = progByModule.get(m.id);
              return {
                module_id: m.id,
                code: m.code,
                name: m.name,
                status: p?.status ?? 'not_started',
                score: p?.score ?? null,
                completed_at: p?.completed_at ?? null,
              };
            });
            const diagnosticAttempts = (diagByCourse.get(e.course_id) || []).sort((a, b) => a.attempt_number - b.attempt_number);
            return {
              course_id: e.course_id,
              course_title: e.course_title,
              total_modules: modules.length,
              completed_modules: modules.filter(m => m.status === 'completed').length,
              modules,
              diagnosticAttempts,
              quizAttempts: attemptsByCourse.get(e.course_id) || [],
              lessonState: lessonByCourse.get(e.course_id) || {},
              pretestDone: pretestByCourse.has(e.course_id),
              record: recordByCourse.get(e.course_id) ?? null,
              assignments: subsByCourse.get(e.course_id) || [],
            };
          });
      }

      type ResourceLogRow = { id: string; downloaded_at: string; course_resources: { title: string } | null; courses: { title: string } | null };
      type ToolboxLogRow = { id: string; downloaded_at: string; toolbox_assets: { title: string } | null };
      const downloads: DownloadEvent[] = [
        ...((resLogs as ResourceLogRow[] | null) || []).map((r) => ({
          id: r.id, kind: 'resource' as const, title: r.course_resources?.title || 'เอกสาร',
          course_title: r.courses?.title ?? null, at: r.downloaded_at,
        })),
        ...((tbLogs as ToolboxLogRow[] | null) || []).map((t) => ({
          id: t.id, kind: 'toolbox' as const, title: t.toolbox_assets?.title || 'ไฟล์ Toolbox',
          course_title: null, at: t.downloaded_at,
        })),
      ].sort((a, b) => b.at.localeCompare(a.at));

      type PurchaseRow = { id: string; event: string; amount_final: number | null; detail: Record<string, unknown> | null; created_at: string; courses: { title: string } | null };
      const purchaseEvents: PurchaseEventDetail[] = ((purchaseRows as PurchaseRow[] | null) || []).map(p => ({
        id: p.id, event: p.event, amount_final: p.amount_final, detail: p.detail, created_at: p.created_at,
        course_title: p.courses?.title ?? null,
      }));

      setDetail({ studentId, registeredAt: earliestRegistered, displayName, userIds: ids, enrollments, progress, downloads, purchaseEvents });
    } catch (e) {
      setError('โหลดข้อมูลไม่สำเร็จ: ' + (e instanceof Error ? e.message : 'unknown'));
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) search(q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Three separate logs, each newest-first — kept apart rather than merged
  // into one feed. When an admin is checking a specific complaint ("paid but
  // got nothing" vs. "downloaded then wants a refund"), they go straight to
  // the one log that answers it instead of scanning a mixed list for it.
  const purchaseLog = React.useMemo(() =>
    [...(detail?.enrollments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [detail]);
  const resourceLog = React.useMemo(() =>
    (detail?.downloads ?? []).filter(d => d.kind === 'resource').sort((a, b) => b.at.localeCompare(a.at)),
    [detail]);
  const toolboxLog = React.useMemo(() =>
    (detail?.downloads ?? []).filter(d => d.kind === 'toolbox').sort((a, b) => b.at.localeCompare(a.at)),
    [detail]);

  const totalPaid = detail?.enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0) ?? 0;

  return (
    <AdminLayout title="ตรวจสอบกิจกรรมนักเรียน" eyebrow="Student Audit" onSignOut={() => fullSignOut().then(() => navigate('/auth'))}>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') search(); }}
            placeholder="ค้นหาด้วย Master Key (student_id) หรืออีเมล"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          <Button onClick={() => search()} disabled={searching || !query.trim()}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {matches.length > 1 && (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {matches.map(m => (
              <button
                key={m.student_id + m.line_user_id}
                onClick={() => loadStudent(m.student_id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm border-b border-white/5 last:border-0 hover:bg-white/5"
              >
                <span className="font-mono text-[#D4A843]">{m.student_id}</span>
                <span className="text-white/60">{m.email || '-'}</span>
                <span className="text-white/40 text-xs">{dateTh(m.registered_at)}</span>
              </button>
            ))}
          </div>
        )}

        {loadingDetail && (
          <div className="flex items-center gap-2 text-white/50 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลด...</div>
        )}

        {detail && !loadingDetail && (
          <>
            <div className="rounded-md border border-white/10 flex flex-wrap divide-x divide-y divide-white/10 sm:divide-y-0">
              <div className="px-3 py-2 flex-1 min-w-[150px]">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Master Key</p>
                <p className="font-mono text-sm text-[#D4A843]">{detail.studentId}</p>
                {detail.displayName && <p className="text-xs text-white/40">{detail.displayName}</p>}
              </div>
              <div className="px-3 py-2 flex-1 min-w-[150px]">
                <p className="text-[10px] uppercase tracking-wider text-white/40">สมัครสมาชิกเมื่อ</p>
                <p className="text-sm font-mono">{detail.registeredAt ? dateTh(detail.registeredAt) : 'UNKNOWN'}</p>
              </div>
              <div className="px-3 py-2 flex-1 min-w-[110px]">
                <p className="text-[10px] uppercase tracking-wider text-white/40">คอร์สที่ได้รับสิทธิ์</p>
                <p className="text-sm font-mono">{detail.enrollments.length}</p>
              </div>
              <div className="px-3 py-2 flex-1 min-w-[110px]">
                <p className="text-[10px] uppercase tracking-wider text-white/40">ยอดชำระรวม</p>
                <p className="text-sm font-mono">{money(totalPaid)}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">คอร์สและความคืบหน้า</h2>
              {detail.progress.length === 0 ? (
                <p className="text-sm text-white/40">ยังไม่มีคอร์สที่ได้รับสิทธิ์</p>
              ) : (
                <div className="rounded-md border border-white/10 divide-y divide-white/5">
                  {detail.progress.map(p => {
                    const pct = p.total_modules > 0 ? Math.round((p.completed_modules / p.total_modules) * 100) : 0;
                    const isOpen = expandedCourses.has(p.course_id);
                    return (
                      <div key={p.course_id}>
                        <button
                          onClick={() => toggleCourse(p.course_id)}
                          className="w-full px-3 py-2 flex items-center justify-between gap-3 text-sm hover:bg-white/5 text-left"
                        >
                          <span className="flex items-center gap-1.5">
                            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
                            {p.course_title}
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${p.record ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                              {p.record ? 'ออกใบแล้ว' : 'ยังไม่ออกใบ'}
                            </span>
                            <span className="text-white/50 text-xs font-mono">
                              {p.total_modules > 0 ? `${p.completed_modules}/${p.total_modules} บท (${pct}%)` : 'ไม่มีบทเรียน'}
                            </span>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="bg-black/20 px-3 py-2 space-y-2">
                            {p.modules.length === 0 ? (
                              <p className="text-xs text-white/30">ยังไม่มีบทเรียนตั้งค่าไว้ในคอร์สนี้</p>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-[10px] text-white/40">
                                  Pre-test: {p.pretestDone ? 'ทำแล้ว' : 'ยังไม่ทำ / ไม่มีข้อมูล'}
                                  {p.record && <> · ใบบันทึกการเรียนจบ <span className="font-mono">{p.record.record_code}</span> ออกเมื่อ {dateTh(p.record.issued_at)}</>}
                                </p>
                                {p.modules.map(m => (
                                  <div key={m.module_id} className="flex items-center gap-3 text-xs">
                                    <span className="flex-1 min-w-0 truncate text-white/70">{m.name}</span>
                                    <span className="shrink-0 font-mono text-white/30 w-16 truncate">{m.code}</span>
                                    <span className="shrink-0 font-mono text-white/40 w-24 text-right" title="ดูคลิปจบแล้ว / จำนวนครั้งที่เปิดดู">
                                      {p.lessonState[m.code]
                                        ? `${p.lessonState[m.code].video_watched ? 'ดูจบ' : 'ยังไม่จบ'} · ${p.lessonState[m.code].video_view_count}×`
                                        : '-'}
                                    </span>
                                    <span className={`shrink-0 font-mono w-24 text-center ${m.status === 'completed' ? 'text-emerald-400' : m.status === 'in_progress' ? 'text-amber-400' : 'text-white/30'}`}>
                                      {m.status === 'completed' ? 'ผ่านแล้ว' : m.status === 'in_progress' ? 'กำลังเรียน' : 'ยังไม่เริ่ม'}
                                    </span>
                                    <span className="shrink-0 font-mono text-white/50 w-14 text-right">{m.score != null ? `${m.score}%` : '-'}</span>
                                    <span className="shrink-0 font-mono text-white/30 w-32 text-right">{m.completed_at ? dateTh(m.completed_at) : '-'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {p.quizAttempts.length > 0 && (
                              <div className="pt-1.5 mt-1.5 border-t border-white/10 space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-white/30">ประวัติการทำแบบทดสอบทุกครั้ง (ใหม่สุดก่อน)</p>
                                {p.quizAttempts.map(a => (
                                  <div key={a.id} className="flex items-center gap-3 text-xs">
                                    <span className="w-28 shrink-0 text-white/60">{QUIZ_TYPE_LABEL[a.quiz_type] || a.quiz_type}</span>
                                    <span className="w-16 shrink-0 font-mono text-white/30 truncate">{a.lesson_code || '-'}</span>
                                    <span className="w-14 shrink-0 font-mono text-white/70 text-right">{a.score_pct != null ? `${a.score_pct}%` : '-'}</span>
                                    <span className="w-14 shrink-0 font-mono text-white/40 text-right">{a.total ? `${a.correct}/${a.total}` : ''}</span>
                                    <span className={`w-16 shrink-0 text-center ${a.passed === false ? 'text-red-400' : 'text-white/40'}`}>
                                      {a.quiz_type === 'knowledge_check' ? (a.passed ? 'ผ่าน' : 'ไม่ผ่าน') : ''}
                                    </span>
                                    <span className="font-mono text-white/30 ml-auto">{dateTh(a.created_at)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {p.assignments.length > 0 && (
                              <div className="pt-1.5 mt-1.5 border-t border-white/10 space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-white/30">งานที่ส่ง</p>
                                {p.assignments.map(a => (
                                  <div key={a.id} className="flex items-center gap-3 text-xs">
                                    <span className="font-mono text-white/40">{a.rubric_id || '-'}</span>
                                    <span className="text-white/60">{a.status === 'pending' ? 'รอตรวจ' : a.status === 'approved' ? 'อนุมัติแล้ว' : a.status === 'rejected' ? 'ให้แก้ไข' : a.status}</span>
                                    <span className="font-mono text-white/70">{a.score != null ? a.score : ''}</span>
                                    <span className="font-mono text-white/30 ml-auto">{dateTh(a.created_at)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {p.diagnosticAttempts.length > 0 && (
                              <div className="pt-1.5 mt-1.5 border-t border-white/10 space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-white/30">Diagnostic Quiz (ไม่มีตก/ผ่าน — snapshot ทักษะ)</p>
                                {p.diagnosticAttempts.map(d => (
                                  <div key={d.attempt_number} className="flex items-center gap-3 text-xs">
                                    <span className="text-white/50">ครั้งที่ {d.attempt_number}{d.accepted ? '' : ' (ไม่ถูกใช้คำนวณ)'}</span>
                                    <span className="font-mono text-white/70">{d.score_pct}%</span>
                                    <span className="font-mono text-white/30 ml-auto">{dateTh(d.created_at)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-white/30 mt-1">
                * "ดูจบ · n×" = ดูคลิปจบแล้วหรือยัง และจำนวนครั้งที่เปิดดู (จาก lms_lesson_state) · ประวัติการทำแบบทดสอบทุกครั้งเริ่มบันทึก 23 ก.ย. 2569
              </p>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">ประวัติการซื้อคอร์ส</h2>
              {purchaseLog.length === 0 ? (
                <p className="text-sm text-white/40">ไม่มีประวัติการซื้อ</p>
              ) : (
                <div className="rounded-md border border-white/10 divide-y divide-white/5">
                  {purchaseLog.map(e => (
                    <div key={e.id} className="px-3 py-2 flex items-center gap-3 text-sm">
                      <span className="flex-1 min-w-0 truncate">{e.course_title}</span>
                      <span className="shrink-0 text-[10px] font-mono uppercase text-white/40">{STATUS_LABEL[e.status] || e.status}</span>
                      <span className="shrink-0 font-mono text-xs w-20 text-right">{money(e.amount_paid)}</span>
                      {e.promo_code && (
                        <span className="shrink-0 font-mono text-[10px] text-white/40">
                          {e.promo_code}{e.discount_value ? ` -${e.discount_value}${e.discount_type === 'percent' ? '%' : '฿'}` : ''}
                        </span>
                      )}
                      <span className="shrink-0 font-mono text-xs text-white/50 w-36 text-right">{dateTh(e.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">บันทึกขั้นตอนการซื้อทุกครั้ง</h2>
              {detail.purchaseEvents.length === 0 ? (
                <p className="text-sm text-white/40">ยังไม่มีบันทึก (เริ่มบันทึก 23 ก.ย. 2569 — การซื้อก่อนหน้านั้นดูได้จาก "ประวัติการซื้อคอร์ส" ด้านบน)</p>
              ) : (
                <div className="rounded-md border border-white/10 divide-y divide-white/5">
                  {detail.purchaseEvents.map(ev => (
                    <div key={ev.id} className="px-3 py-2 flex items-center gap-3 text-sm">
                      <span className={`shrink-0 w-44 text-xs ${ev.event === 'error' || ev.event.endsWith('rejected') ? 'text-red-400' : ev.event === 'webhook_paid' || ev.event === 'payment_verified' || ev.event === 'free_enrolled' ? 'text-emerald-400' : 'text-white/70'}`}>
                        {PURCHASE_EVENT_LABEL[ev.event] || ev.event}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-white/60">{ev.course_title || '-'}</span>
                      <span className="shrink-0 font-mono text-xs w-20 text-right">{ev.amount_final != null ? money(ev.amount_final) : ''}</span>
                      <span className="shrink-0 font-mono text-[10px] text-white/30 max-w-[25%] truncate" title={ev.detail ? JSON.stringify(ev.detail) : ''}>
                        {ev.detail && Object.keys(ev.detail).length > 0 ? JSON.stringify(ev.detail) : ''}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-white/50 w-36 text-right">{dateTh(ev.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">ประวัติการดาวน์โหลดเอกสารคอร์ส</h2>
              {resourceLog.length === 0 ? (
                <p className="text-sm text-white/40">ไม่มีประวัติการดาวน์โหลด — ใช้ตรวจข้อพิพาทคืนเงิน (ถ้าดาวน์โหลดแล้ว แปลว่าได้รับเนื้อหาแล้ว)</p>
              ) : (
                <div className="rounded-md border border-white/10 divide-y divide-white/5">
                  {resourceLog.map(d => (
                    <div key={d.id} className="px-3 py-2 flex items-center gap-3 text-sm">
                      <span className="flex-1 min-w-0 truncate">{d.title}</span>
                      <span className="shrink-0 text-xs text-white/40 truncate max-w-[35%]">{d.course_title}</span>
                      <span className="shrink-0 font-mono text-xs text-white/50 w-36 text-right">{dateTh(d.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">ประวัติการดาวน์โหลด Toolbox (ฟรี)</h2>
              {toolboxLog.length === 0 ? (
                <p className="text-sm text-white/40">ไม่มีประวัติการดาวน์โหลด</p>
              ) : (
                <div className="rounded-md border border-white/10 divide-y divide-white/5">
                  {toolboxLog.map(d => (
                    <div key={d.id} className="px-3 py-2 flex items-center gap-3 text-sm">
                      <span className="flex-1 min-w-0 truncate">{d.title}</span>
                      <span className="shrink-0 font-mono text-xs text-white/50 w-36 text-right">{dateTh(d.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStudents;
