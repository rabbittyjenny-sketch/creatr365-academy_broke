import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * What this page does NOT show, because the system does not track it:
 * a per-lesson "number of times opened" count. module_progress only has a
 * status (not_started/in_progress/completed) and a completion timestamp —
 * no view/open counter exists anywhere in this codebase today.
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

interface CourseProgress {
  course_id: string;
  course_title: string;
  total_modules: number;
  completed_modules: number;
  modules: ModuleProgressDetail[];
  diagnosticAttempts: DiagnosticAttemptDetail[];
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
}

const money = (n: number | null) => (n == null ? '-' : `${n.toLocaleString('th-TH')} ฿`);
// Characters that change the meaning of a PostgREST .or() filter string.
const orSafe = (q: string) => q.replace(/[,()*\\]/g, ' ').trim();
const dateTh = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

const STATUS_LABEL: Record<string, string> = { paid: 'ซื้อแล้ว', free: 'คอร์สฟรี', active: 'ใช้งานอยู่', pending: 'ค้างชำระ (ยังไม่จ่าย)', abandoned: 'ยกเลิก/ไม่ชำระ' };

const AdminStudents: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
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

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    setDetail(null);
    const { data, error: err } = await supabase
      .from('user_accounts')
      .select('student_id,email,line_user_id,registered_at,is_active')
      .or(`student_id.ilike.%${orSafe(q)}%,email.ilike.%${orSafe(q)}%`)
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
        setDetail({ studentId, registeredAt: earliestRegistered, displayName, userIds: [], enrollments: [], progress: [], downloads: [] });
        return;
      }

      // 2. Everything tied to those identities, in parallel.
      const [{ data: enRows }, { data: resLogs }, { data: tbLogs }] = await Promise.all([
        supabase.from('course_enrollments')
          .select('id,course_id,status,amount_paid,created_at,promo_code_id,courses(title),promo_codes(code,discount_type,discount_value)')
          .in('user_id', ids).order('created_at', { ascending: false }),
        supabase.from('resource_download_logs')
          .select('id,downloaded_at,course_resources(title),courses(title)')
          .in('user_id', ids).order('downloaded_at', { ascending: false }),
        supabase.from('toolbox_downloads')
          .select('id,downloaded_at,toolbox_assets(title)')
          .in('user_id', ids).order('downloaded_at', { ascending: false }),
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
        const [{ data: mods }, { data: prog }, { data: diag }] = await Promise.all([
          supabase.from('course_modules').select('id,course_id,code,name,sort_order').in('course_id', courseIds),
          supabase.from('module_progress').select('module_id,status,score,completed_at').in('user_id', ids),
          supabase.from('diagnostic_attempts').select('course_id,attempt_number,score_pct,accepted,created_at').in('user_id', ids).in('course_id', courseIds),
        ]);

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

      setDetail({ studentId, registeredAt: earliestRegistered, displayName, userIds: ids, enrollments, progress, downloads });
    } catch (e) {
      setError('โหลดข้อมูลไม่สำเร็จ: ' + (e instanceof Error ? e.message : 'unknown'));
    } finally {
      setLoadingDetail(false);
    }
  };

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

  // Only completed payments — a "pending" row is an abandoned checkout.
  const totalPaid = detail?.enrollments.filter(e => e.status === 'paid').reduce((sum, e) => sum + (Number(e.amount_paid) || 0), 0) ?? 0;

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
          <Button onClick={search} disabled={searching || !query.trim()}>
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
                          <span className="text-white/50 text-xs font-mono shrink-0">
                            {p.total_modules > 0 ? `${p.completed_modules}/${p.total_modules} บท (${pct}%)` : 'ไม่มีบทเรียน'}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="bg-black/20 px-3 py-2 space-y-2">
                            {p.modules.length === 0 ? (
                              <p className="text-xs text-white/30">ยังไม่มีบทเรียนตั้งค่าไว้ในคอร์สนี้</p>
                            ) : (
                              <div className="space-y-1">
                                {p.modules.map(m => (
                                  <div key={m.module_id} className="flex items-center gap-3 text-xs">
                                    <span className="flex-1 min-w-0 truncate text-white/70">{m.name}</span>
                                    <span className="shrink-0 font-mono text-white/30 w-16 truncate">{m.code}</span>
                                    <span className={`shrink-0 font-mono w-24 text-center ${m.status === 'completed' ? 'text-emerald-400' : m.status === 'in_progress' ? 'text-amber-400' : 'text-white/30'}`}>
                                      {m.status === 'completed' ? 'ผ่านแล้ว' : m.status === 'in_progress' ? 'กำลังเรียน' : 'ยังไม่เริ่ม'}
                                    </span>
                                    <span className="shrink-0 font-mono text-white/50 w-14 text-right">{m.score != null ? `${m.score}%` : '-'}</span>
                                    <span className="shrink-0 font-mono text-white/30 w-32 text-right">{m.completed_at ? dateTh(m.completed_at) : '-'}</span>
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
                * ระบบยังไม่มีการนับ "จำนวนครั้งที่เปิดดู" ต่อบทเรียน มีเฉพาะสถานะเรียนจบ/ยังไม่จบ
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
                          {e.promo_code}{e.discount_type === 'free' ? ' ฟรี 100%' : e.discount_value ? ` -${e.discount_value}${e.discount_type === 'percent' ? '%' : '฿'}` : ''}
                        </span>
                      )}
                      <span className="shrink-0 font-mono text-xs text-white/50 w-36 text-right">{dateTh(e.created_at)}</span>
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
