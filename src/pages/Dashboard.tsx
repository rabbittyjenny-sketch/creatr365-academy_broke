import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { isCurrentUserAdmin } from '@/lib/admin';
import { useDarkPage } from '@/hooks/useDarkPage';
import { Star, ExternalLink, BookOpen, CheckCircle2, Circle, Download, FileText, Loader2, ShieldCheck, LayoutGrid, GraduationCap, FolderOpen, Award, UserCog, Package } from 'lucide-react';
import { tierLabel } from '@/lib/courseTag';
import { DownloadConsentDialog } from '@/components/DownloadConsentDialog';
import { ToolboxDownloadConsentDialog } from '@/components/ToolboxDownloadConsentDialog';
import { useToast } from '@/hooks/use-toast';
import { REG_STATUS_TH, type RegistrationStatus } from '@/lib/events';
import { missingProfileFields, type ProfileIdentity } from '@/lib/profileFields';

const LMS_URL = 'https://6course-quiz.vercel.app';

interface CourseRow {
  id: string; slug: string; tag: string; title: string; subtitle: string;
  color: string; learning_type: string; level: string | null;
}
interface EnrollmentRow { id: string; course_id: string; status: string }
interface ModuleRow {
  id: string; course_id: string; code: string; name: string;
  duration_label: string | null; has_quiz: boolean; sort_order: number;
}
interface ProgressRow { module_id: string; status: string; score: number | null }
interface ResourceRow {
  id: string; course_id: string; resource_type: string; title: string;
  file_path: string; file_name: string | null;
}

// A Toolbox Premium file this user bought (toolbox_purchases status = paid).
// Shown in "เอกสาร" next to course materials — the Toolbox page only sells.
interface PremiumFileRow {
  purchase_id: string; asset_id: string; title: string;
  file_path: string; file_name: string | null; file_type: string | null;
}
interface CompletionRecordRow {
  id: string; course_id: string; record_code: string; issued_at: string;
  diagnostic_attempts: { score_pct: number } | null;
}
interface AssignmentRow {
  id: string; course_id: string; status: string; score: number | null;
  note: string | null; created_at: string; review_note: string | null;
}

const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'รอตรวจ', submitted: 'รอตรวจ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ',
};

const LEVEL_NAMES = ['STARTER', 'DEVELOPING', 'COMPETENT', 'PROFICIENT', 'MASTER'];

// Label shown per resource_type. Anything not listed here (a new type an
// admin adds later, e.g. "worksheet" already covered, or "cheatsheet")
// still renders — it just falls back to a generic "เอกสารประกอบการเรียน"
// label with the type name, so new kinds show up with zero code changes.
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  manual: 'คู่มือการเรียน',
  worksheet: 'Worksheet',
};
const resourceLabel = (type: string) => RESOURCE_TYPE_LABELS[type] || `เอกสารประกอบการเรียน (${type})`;

type SectionKey = 'overview' | 'courses' | 'resources' | 'certificates';
const SECTION_KEYS: SectionKey[] = ['overview', 'courses', 'resources', 'certificates'];

async function ensureStudentId(email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('ensure_master_student_account', { _email: email });
  if (error) { console.error('ensure_master_student_account failed', error); return null; }
  return typeof data === 'string' && data.trim() ? data.trim() : null;
}

const Dashboard: React.FC = () => {
  useDarkPage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<({ display_name?: string; line_user_id?: string } & ProfileIdentity) | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [completionRecords, setCompletionRecords] = useState<CompletionRecordRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Resource IDs this user has already consented to before — lets repeat
  // downloads of the same file skip the consent dialog (still logged every time).
  const [consentedResourceIds, setConsentedResourceIds] = useState<Set<string>>(new Set());
  const [pendingResource, setPendingResource] = useState<ResourceRow | null>(null);
  const [premiumFiles, setPremiumFiles] = useState<PremiumFileRow[]>([]);
  // Upcoming events this learner asked to join (requested/confirmed). The
  // full page with meeting links is /my-events; this is the entry point.
  const [myEvents, setMyEvents] = useState<{ status: RegistrationStatus; id: string; title: string; date: string; time: string }[]>([]);
  const [consentedToolboxIds, setConsentedToolboxIds] = useState<Set<string>>(new Set());
  const [pendingPremium, setPendingPremium] = useState<PremiumFileRow | null>(null);
  const [justBoughtAssetId, setJustBoughtAssetId] = useState<string | null>(null);
  const [openCourse, setOpenCourse] = useState<string | null>(null);
  // Which course's "เข้าเรียน" button is currently fetching a handoff token
  const [enteringLmsSlug, setEnteringLmsSlug] = useState<string | null>(null);
  // ?section=resources deep-links a tab (used by the Toolbox Premium checkout return).
  const [section, setSection] = useState<SectionKey>(() => {
    const q = new URLSearchParams(window.location.search).get('section') as SectionKey | null;
    return q && SECTION_KEYS.includes(q) ? q : 'overview';
  });
  // Separate from the student dashboard below — an admin gets a link out to
  // the dedicated Admin Console (its own layout/routes), never a second
  // copy of admin controls rendered here.
  const [isAdmin, setIsAdmin] = useState(false);
  // Distinct from "studentId is null" — without this, the "ยังไม่พบ Master
  // Key" message flashed on every visit during the gap between session
  // resolving (user set) and the Master Key lookup finishing (studentId
  // still null), even for students who do have one.
  const [loading, setLoading] = useState(true);

  const loadPremiumFiles = async (uid: string) => {
    const [{ data: buys }, { data: tbLogs }] = await Promise.all([
      supabase.from('toolbox_purchases')
        .select('id,asset_id,paid_at,toolbox_assets(title,file_path,file_name,file_type)')
        .eq('user_id', uid).eq('status', 'paid').order('paid_at', { ascending: false }),
      supabase.from('toolbox_downloads').select('asset_id').eq('user_id', uid).eq('consented', true),
    ]);
    type BuyRow = { id: string; asset_id: string; toolbox_assets: { title: string; file_path: string; file_name: string | null; file_type: string | null } | null };
    setPremiumFiles(((buys as unknown as BuyRow[]) || [])
      .filter(b => b.toolbox_assets)
      .map(b => ({
        purchase_id: b.id, asset_id: b.asset_id, title: b.toolbox_assets!.title,
        file_path: b.toolbox_assets!.file_path, file_name: b.toolbox_assets!.file_name, file_type: b.toolbox_assets!.file_type,
      })));
    setConsentedToolboxIds(new Set(((tbLogs as { asset_id: string }[] | null) || []).map(l => l.asset_id)));
  };

  // Back from Stripe (toolbox-checkout success_url): confirm the payment —
  // the webhook usually got there first; verify covers a late one — then
  // show the file in "เอกสาร".
  useEffect(() => {
    const purchaseId = searchParams.get('toolbox_purchase');
    if (!purchaseId || !user) return;
    (async () => {
      let paid = false;
      for (let attempt = 0; attempt < 4 && !paid; attempt++) {
        const { data } = await supabase.functions.invoke('toolbox-checkout', { body: { action: 'verify', purchaseId } });
        paid = data?.status === 'paid';
        if (!paid) await new Promise(r => setTimeout(r, 2000));
      }
      await loadPremiumFiles(user.id);
      if (paid) {
        const { data: row } = await supabase.from('toolbox_purchases').select('asset_id').eq('id', purchaseId).maybeSingle();
        setJustBoughtAssetId(row?.asset_id ?? null);
        toast({ title: 'ชำระเงินสำเร็จ', description: 'ไฟล์อยู่ในเมนู "เอกสาร" แล้ว ดาวน์โหลดได้ทุกเมื่อ' });
      } else {
        toast({ title: 'กำลังยืนยันการชำระเงิน', description: 'ไฟล์จะขึ้นในเมนู "เอกสาร" ภายใน 1-2 นาที ถ้ายังไม่ขึ้นให้รีเฟรชหรือติดต่อทีมงาน' });
      }
      setSection('resources');
      const next = new URLSearchParams(searchParams);
      next.delete('toolbox_purchase');
      setSearchParams(next, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate('/auth'); return; }
    const u = { id: session.user.id, email: session.user.email };
    setUser(u);
    isCurrentUserAdmin(session.user.id).then(setIsAdmin);

    const [{ data: prof }, { data: cs }, { data: en }] = await Promise.all([
      supabase.from('profiles').select('line_user_id,display_name,first_name_th,last_name_th,first_name_en,last_name_en,gender,age_range,occupation,province').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('courses').select('id,slug,tag,title,subtitle,color,learning_type,level').eq('is_active', true).order('sort_order'),
      supabase.from('course_enrollments').select('id,course_id,status').eq('user_id', session.user.id),
    ]);

    setProfile(prof || null);
    setCourses((cs as any) || []);
    const enRows: EnrollmentRow[] = (en as any) || [];
    setEnrollments(enRows);
    loadPremiumFiles(session.user.id);
    supabase.from('event_registrations')
      .select('status, events (id, title, date, time, target_date)')
      .eq('user_id', session.user.id)
      .in('status', ['requested', 'confirmed'])
      .then(({ data }) => {
        type R = { status: RegistrationStatus; events: { id: string; title: string; date: string; time: string; target_date: string } | null };
        const now = Date.now();
        setMyEvents(((data as unknown as R[]) || [])
          .filter(r => r.events && new Date(r.events.target_date).getTime() > now - 3600_000)
          .map(r => ({ status: r.status, id: r.events!.id, title: r.events!.title, date: r.events!.date, time: r.events!.time })));
      });

    // Resolve the one shared Master Key. Never synthesize a second key in the browser.
    let sid: string | null = null;
    if ((prof as any)?.line_user_id) {
      const { data: acct } = await supabase.from('user_accounts').select('student_id').eq('line_user_id', (prof as any).line_user_id).maybeSingle();
      sid = (acct as any)?.student_id ?? null;
    }
    if (!sid && u.email) {
      const { data: acct } = await supabase.from('user_accounts').select('student_id').eq('email', u.email.toLowerCase()).maybeSingle();
      sid = (acct as any)?.student_id ?? null;
    }
    if (!sid && u.email) sid = await ensureStudentId(u.email);
    setStudentId(sid);

    // Fetch modules and progress for enrolled courses
    const activeIds = enRows
      .filter(e => ['paid', 'free', 'active'].includes(e.status))
      .map(e => e.course_id);

    if (activeIds.length > 0) {
      const [{ data: mods }, { data: prog }, { data: res }, { data: logs }, { data: records }, { data: subs }] = await Promise.all([
        supabase.from('course_modules').select('id,course_id,code,name,duration_label,has_quiz,sort_order')
          .in('course_id', activeIds).order('sort_order'),
        supabase.from('module_progress')
              .select('module_id, status, score, completed_at')
              .eq('user_id', session.user.id),
        // RLS already limits this to active resources for courses this user
        // is actually enrolled in — no extra filtering needed client-side.
        supabase.from('course_resources')
              .select('id,course_id,resource_type,title,file_path,file_name')
              .in('course_id', activeIds).order('sort_order'),
        supabase.from('resource_download_logs')
              .select('resource_id')
              .eq('user_id', session.user.id)
              .eq('consented', true),
        // Issued by issue_completion_record (server-side, via save-score)
        // the first time this user's diagnostic quiz completes for a
        // course after every module is marked "completed" — see the
        // mandatory_gate_completion_records migration.
        supabase.from('completion_records')
              .select('id,course_id,record_code,issued_at,diagnostic_attempts(score_pct)')
              .eq('user_id', session.user.id),
        // Submitted from the LMS's "ส่งงาน" card (course-level work like a
        // Hook script/video link), reviewed manually by the team in
        // AdminAssignments.tsx — status starts "pending" until graded.
        supabase.from('assignments')
              .select('id,course_id,status,score,note,created_at,review_note')
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false }),
      ]);
      setModules((mods as any) || []);
      setProgress((prog as any) || []);
      setResources((res as any) || []);
      const logRows = (logs as { resource_id: string }[] | null) || [];
      setConsentedResourceIds(new Set(logRows.map(l => l.resource_id)));
      setCompletionRecords((records as unknown as CompletionRecordRow[]) || []);
      setAssignments((subs as unknown as AssignmentRow[]) || []);
    }
    setLoading(false);
  };

  // Study materials (คู่มือ/worksheet) live in a private bucket — download
  // via a short-lived signed URL requested on click, not a stored public URL.
  // Every download is logged to resource_download_logs (audit trail for
  // refund/exchange disputes); first download of a given resource requires
  // explicit consent via DownloadConsentDialog, later ones skip the dialog
  // but are still logged.
  const downloadResource = async (r: ResourceRow) => {
    if (!user) return;
    setDownloadingId(r.id);
    try {
      // `download` + same-tab navigation instead of window.open: a new tab
      // opened after an await is blocked in the LINE in-app browser and iOS.
      const { data, error } = await supabase.storage
        .from('course-resources')
        .createSignedUrl(r.file_path, 60, { download: r.file_name || true });
      if (error || !data?.signedUrl) {
        console.error('createSignedUrl failed', error);
        alert('ดาวน์โหลดไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }

      const { error: logError } = await supabase.from('resource_download_logs').insert({
        user_id: user.id,
        course_id: r.course_id,
        resource_id: r.id,
        consented: true,
      });
      if (logError) console.error('resource_download_logs insert failed', logError);
      else setConsentedResourceIds(prev => new Set(prev).add(r.id));
      window.location.assign(data.signedUrl);
    } finally {
      setDownloadingId(null);
    }
  };

  // Toolbox Premium files — same flow as course materials above: signed URL
  // on click (the toolbox-files storage policy only signs it for a buyer),
  // consent once, every download logged (toolbox_downloads; demographics are
  // filled by the database).
  const downloadPremium = async (f: PremiumFileRow) => {
    if (!user) return;
    setDownloadingId(f.purchase_id);
    try {
      const { data, error } = await supabase.storage
        .from('toolbox-files')
        .createSignedUrl(f.file_path, 60, { download: f.file_name || true });
      if (error || !data?.signedUrl) {
        console.error('createSignedUrl failed', error);
        alert('ดาวน์โหลดไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      const { error: logError } = await supabase.from('toolbox_downloads').insert({
        asset_id: f.asset_id, user_id: user.id, student_id: studentId, consented: true,
      });
      if (logError) console.error('toolbox_downloads insert failed', logError);
      else setConsentedToolboxIds(prev => new Set(prev).add(f.asset_id));
      await supabase.rpc('increment_toolbox_download', { _asset_id: f.asset_id });
      window.location.assign(data.signedUrl);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadPremium = (f: PremiumFileRow) => {
    if (consentedToolboxIds.has(f.asset_id)) downloadPremium(f);
    else setPendingPremium(f);
  };

  const handleDownloadResource = (r: ResourceRow) => {
    if (consentedResourceIds.has(r.id)) {
      downloadResource(r);
    } else {
      setPendingResource(r);
    }
  };

  // Sends the student into the LMS (a separate app/origin) without ever
  // putting their Master Key in the URL. create-lms-handoff resolves the
  // key server-side from this session and returns a 60-second, single-use
  // token instead — same short-lived-handoff pattern as the signed URLs
  // used for resource downloads above, just for a cross-app redirect
  // instead of a Storage object. Replaces the old `?kid=<masterKey>` link.
  const enterLms = async (courseSlug: string) => {
    if (!user) return;
    setEnteringLmsSlug(courseSlug);
    try {
      const { data, error } = await supabase.functions.invoke('create-lms-handoff', {
        body: { course_slug: courseSlug },
      });
      if (error || !data?.token) {
        console.error('create-lms-handoff failed', error);
        alert('เข้าเรียนไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      const returnTo = `${window.location.origin}/register?master_key=${encodeURIComponent(studentId || '')}`;
      const dashboardUrl = `${window.location.origin}/dashboard`;
      const lmsUrl = `${LMS_URL}?token=${encodeURIComponent(data.token)}&returnTo=${encodeURIComponent(returnTo)}&dashboardUrl=${encodeURIComponent(dashboardUrl)}`;
      window.open(lmsUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setEnteringLmsSlug(null);
    }
  };

  useEffect(() => {
    load();
    // reload progress เมื่อกลับจาก LMS (tab กลับมา focus)
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line
  }, []);

  const enrolledIds = useMemo(() =>
    new Set(enrollments.filter(e => ['paid', 'free', 'active'].includes(e.status)).map(e => e.course_id)),
    [enrollments],
  );

  const completedModuleIds = useMemo(() =>
    new Set(progress.filter(p => p.status === 'completed').map(p => p.module_id)),
    [progress],
  );

  const modulesByCourse = useMemo(() => {
    const map = new Map<string, ModuleRow[]>();
    for (const m of modules) {
      if (!map.has(m.course_id)) map.set(m.course_id, []);
      map.get(m.course_id)!.push(m);
    }
    return map;
  }, [modules]);

  const resourcesByCourse = useMemo(() => {
    const map = new Map<string, ResourceRow[]>();
    for (const r of resources) {
      if (!map.has(r.course_id)) map.set(r.course_id, []);
      map.get(r.course_id)!.push(r);
    }
    return map;
  }, [resources]);

  const enrolledCourses = useMemo(() => courses
    .filter(c => enrolledIds.has(c.id))
    .map((c) => ({ course: c, accent: 'red' as const })),
    [courses, enrolledIds],
  );

  const totalResourceCount = resources.length + premiumFiles.length;

  // Courses where every module is completed — backs both the "ใบบันทึกการเรียนจบ"
  // stat tile and the completion-records section's list. Per the Completion
  // Record Framework doc §3.2, words like "ใบประกาศ" / "certificate" /
  // "ได้รับการรับรอง" / a level name (STARTER..MASTER) must never appear on
  // anything a learner can present externally — those are reserved for the
  // future, separate, paid Certification exam (Phase 2). This menu is no
  // longer flagged "เร็วๆ นี้": issue_completion_record() has been issuing
  // real records since the mandatory_gate_completion_records migration; the
  // only thing actually missing was learners being told about it.
  const completedCoursesList = useMemo(() =>
    enrolledCourses.filter(({ course: c }) => {
      const mods = modulesByCourse.get(c.id) || [];
      return mods.length > 0 && mods.every(m => completedModuleIds.has(m.id));
    }),
    [enrolledCourses, modulesByCourse, completedModuleIds],
  );

  const statsData = useMemo(() => {
    const quizScores = progress.filter(p => p.score != null).map(p => p.score!);
    const avgScore = quizScores.length
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

    return [
      { label: 'คอร์สที่เรียนอยู่', value: enrolledCourses.length, accent: 'red' },
      { label: 'Quiz ผ่านแล้ว', value: progress.filter(p => (p.score ?? 0) >= 70).length, accent: 'red' },
      { label: 'คะแนนเฉลี่ย', value: avgScore ? `${avgScore}%` : '-', accent: 'red' },
      { label: 'ใบบันทึกการเรียนจบ', value: completedCoursesList.length, accent: 'red' },
    ];
  }, [enrolledCourses.length, progress, completedCoursesList.length]);

  const NAV_ITEMS: { key: SectionKey; label: string; Icon: typeof LayoutGrid; count?: number; comingSoon?: boolean }[] = [
    { key: 'overview', label: 'ภาพรวม', Icon: LayoutGrid },
    { key: 'courses', label: 'คอร์สของฉัน', Icon: GraduationCap, count: enrolledCourses.length },
    { key: 'resources', label: 'เอกสาร', Icon: FolderOpen, count: totalResourceCount },
    // comingSoon removed: the mechanism behind this tab is live (see above).
    { key: 'certificates', label: 'ใบบันทึกการเรียนจบ', Icon: Award },
  ];

  if (loading || !user) {
    return (
      <>
        <CourseNavbar />
        <main className="max-w-2xl mx-auto px-4 py-24 flex justify-center">
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        </main>
      </>
    );
  }
  if (!studentId) return (<><CourseNavbar /><main className="max-w-2xl mx-auto px-4 py-24"><h1 className="text-xl font-bold">ยังไม่พบ Master Key ของบัญชีนี้</h1><p className="text-sm text-muted-foreground mt-2">กรุณาสมัคร/เชื่อมบัญชีให้เรียบร้อยก่อนเริ่มเรียน</p><Link to="/register" className="inline-block mt-5 underline">ไปหน้าสมัครสมาชิก</Link></main></>);

  const keyId = studentId;
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'นักเรียน';
  const currentLevel = enrolledCourses.length === 0 ? 'GUEST' : LEVEL_NAMES[0];

  return (
    <>
      <SEOHead title="Student Portal - Creatr365" description="หน้านักเรียน Creatr365" />
      <CourseNavbar />

      <main className="max-w-5xl mx-auto px-4 py-6 pt-24 pb-24">
        {/* Identity header — always visible, not part of the switchable sections below */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">สวัสดีค่ะ 👋</p>
              <h1 className="text-2xl font-bold" data-accent="red">{displayName}</h1>
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-border bg-muted hover-shift"
                title="บัญชีนี้มีสิทธิ์ Admin — ไปที่ Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Console
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-mono bg-muted border border-border px-2 py-0.5 rounded-md">{keyId}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-current" />
              <span>{currentLevel}</span>
            </div>
          </div>
        </div>

        {/* Left nav / right content — same click-left-see-right pattern as the
            Admin console (AdminLayout), rebuilt for this page's own narrower,
            non-fixed layout (Admin's Sidebar component is viewport-fixed and
            assumes it owns the whole page; this page already has its own
            CourseNavbar/Footer in normal flow, so a plain sticky flex column
            fits here without overlapping them). Stacks as a horizontal strip
            above the content on mobile instead of a sidebar. */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:w-52 md:flex-shrink-0 md:sticky md:top-24 md:self-start border-b md:border-b-0 border-border pb-2 md:pb-0">
            {NAV_ITEMS.map(({ key, label, Icon, count, comingSoon }) => {
              const active = section === key;
              return (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-left whitespace-nowrap transition-colors border-l-2 flex-shrink-0 ${
                    active
                      ? 'border-l-foreground bg-muted text-foreground'
                      : 'border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {typeof count === 'number' && count > 0 && (
                    <span className="text-[10px] text-muted-foreground">({count})</span>
                  )}
                  {comingSoon && (
                    <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 bg-muted text-muted-foreground/70">
                      เร็วๆ นี้
                    </span>
                  )}
                </button>
              );
            })}
            {/* Not a `section` — this one navigates away to its own route
                (/profile) instead of switching the panel on the right, but
                stays a peer in the same nav list rather than a stray button
                elsewhere on the page. */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-left whitespace-nowrap transition-colors border-l-2 flex-shrink-0 border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <UserCog className="w-4 h-4 flex-shrink-0" />
              โปรไฟล์
            </Link>
          </nav>

          <div className="flex-1 min-w-0">
            {section === 'overview' && (
              <div className="space-y-6">
                {myEvents.length > 0 && (
                  <div className="sharp-card border border-border bg-card p-4" data-accent="red">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm font-bold">กิจกรรมของฉัน</p>
                      <Link to="/my-events" className="text-xs underline hover-shift">ดูทั้งหมด / ลิงก์เข้าร่วม</Link>
                    </div>
                    <ul className="space-y-2">
                      {myEvents.map(ev => (
                        <li key={ev.id}>
                          <Link to={`/event/${ev.id}`} className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate">{ev.title}</span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {[ev.date, ev.time].filter(Boolean).join(' ')} · {REG_STATUS_TH[ev.status]}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Profile completion — names are needed for certificates,
                    the rest feeds statistics silently (see lib/profileFields). */}
                {profile && missingProfileFields(profile).length > 0 && (
                  <Link
                    to="/profile"
                    className="sharp-card block border border-border bg-card p-4"
                    data-accent="red"
                  >
                    <p className="text-sm font-bold">กรอกโปรไฟล์ให้ครบ</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ยังขาด: {missingProfileFields(profile).join(', ')} — ชื่อจริงไทยและอังกฤษใช้ออกใบประกาศเมื่อเรียนจบหลักสูตร
                    </p>
                  </Link>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {statsData.map(stat => (
                    <div key={stat.label} className="sharp-card border border-border bg-card p-4" data-accent={stat.accent}>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground/70">วิธีเข้าระบบ LMS</p>
                  <p>กด <span className="font-semibold">เข้าเรียน</span> — ระบบจะออกตั๋วเข้าห้องเรียนแบบใช้ครั้งเดียว (หมดอายุใน 60 วินาที) เพื่อพาเข้าสู่ LMS โดยอัตโนมัติ โดยไม่ต้องแชร์ Master Key (<span className="font-mono">{keyId}</span>) ของคุณผ่านลิงก์</p>
                  <p>หากต้องการเข้าด้วยตัวเอง: ไปที่ <span className="font-mono">6course-quiz.vercel.app</span> แล้วใส่ Master Key ด้านบน</p>
                </div>
              </div>
            )}

            {section === 'courses' && (
              enrolledCourses.length === 0 ? (
                <div className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  ยังไม่มีคอร์สที่ลงทะเบียน —{' '}
                  <Link to="/courses" className="underline hover-shift" data-accent="red">เลือกคอร์ส</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map(({ course: c, accent }) => {
                    const courseMods = modulesByCourse.get(c.id) || [];
                    const total = courseMods.length;
                    const done = courseMods.filter(m => completedModuleIds.has(m.id)).length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const isOpen = openCourse === c.id;

                    return (
                      <div key={c.id} className="sharp-card border border-border bg-card overflow-hidden" data-accent={accent}>
                        {/* Course header */}
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0 text-sm">
                              {c.title.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{tierLabel(c.tag)}</span>
                                {c.level && <span className="text-[10px] text-muted-foreground">· {c.level}</span>}
                              </div>
                              <p className="text-sm font-semibold hover-shift" data-accent={accent}>{c.title}</p>
                              <p className="text-xs text-muted-foreground">{c.subtitle}</p>
                              {total > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-1">{done}/{total} บทเรียน</p>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          {total > 0 && (
                            <div className="mt-3">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, background: 'var(--color-foreground)' }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">{pct}% สำเร็จ</p>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="mt-4 flex items-center gap-2">
                            <button
                              onClick={() => enterLms(c.slug)}
                              disabled={enteringLmsSlug === c.slug}
                              data-accent={accent}
                              className="btn-brand text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                            >
                              {enteringLmsSlug === c.slug
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <>เข้าเรียน <ExternalLink className="w-3 h-3" /></>}
                            </button>
                            {total > 0 && (
                              <button
                                onClick={() => setOpenCourse(isOpen ? null : c.id)}
                                className="btn-brand btn-brand--outline text-xs px-3 py-2 border-border"
                              >
                                {isOpen ? 'ซ่อนบทเรียน' : 'ดูบทเรียน'}
                              </button>
                            )}
                          </div>

                          {/* Resource files for this course live in the dedicated
                              "เอกสาร" section (one place for every enrolled course's
                              files, instead of duplicated buttons on every card) —
                              this is just a discoverability hint, not a duplicate. */}
                          {(resourcesByCourse.get(c.id) || []).length > 0 && (
                            <button
                              onClick={() => setSection('resources')}
                              className="mt-3 text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                            >
                              <FolderOpen className="w-3 h-3" />
                              มีเอกสาร {resourcesByCourse.get(c.id)!.length} ไฟล์ — ดูที่ "เอกสาร"
                            </button>
                          )}
                        </div>

                        {/* Lesson list (collapsible) */}
                        {isOpen && total > 0 && (
                          <div className="border-t border-border px-3 py-2 space-y-0.5">
                            {courseMods.map((mod, i) => {
                              const isDone = completedModuleIds.has(mod.id);
                              const moduleProgress = progress.find(p => p.module_id === mod.id);
                              return (
                                <div key={mod.id} className="flex items-center gap-3 p-3 rounded-lg">
                                  <div className="flex-shrink-0">
                                    {isDone
                                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      : <Circle className="w-5 h-5 text-muted-foreground/40" />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{i + 1}. {mod.name}</p>
                                    <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                      {mod.duration_label && <span>{mod.duration_label}</span>}
                                      {mod.has_quiz && <span>· Quiz</span>}
                                      {mod.has_quiz && moduleProgress?.score != null && (
                                        <span className={`font-bold ${moduleProgress.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                                          {moduleProgress.score}% {moduleProgress.score >= 70 ? 'ผ่าน' : 'ยังไม่ผ่าน'}
                                        </span>
                                      )}
                                      {mod.has_quiz && moduleProgress?.score == null && moduleProgress?.status === 'unlocked' && (
                                        <span>ยังไม่ได้ทำ</span>
                                      )}
                                      {(!moduleProgress || moduleProgress.status === 'not_started') && (
                                        <span>ล็อก</span>
                                      )}
                                    </div>
                                  </div>
                                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {section === 'resources' && (
              enrolledCourses.length === 0 && premiumFiles.length === 0 ? (
                <div className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  ยังไม่มีคอร์สที่ลงทะเบียน —{' '}
                  <Link to="/courses" className="underline hover-shift" data-accent="red">เลือกคอร์ส</Link>
                </div>
              ) : totalResourceCount === 0 ? (
                <div className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  ยังไม่มีเอกสารสำหรับคอร์สที่ลงทะเบียนอยู่
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map(({ course: c }) => {
                    const courseResources = resourcesByCourse.get(c.id) || [];
                    if (courseResources.length === 0) return null;
                    return (
                      <div key={c.id} className="sharp-card border border-border bg-card p-4">
                        <p className="text-xs font-semibold text-foreground mb-3">{c.title}</p>
                        <div className="flex flex-wrap gap-2">
                          {courseResources.map(r => (
                            <button
                              key={r.id}
                              onClick={() => handleDownloadResource(r)}
                              disabled={downloadingId === r.id}
                              className="sharp-btn flex items-center gap-1.5 text-[11px] px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                            >
                              {downloadingId === r.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Download className="w-3 h-3" />}
                              <FileText className="w-3 h-3" />
                              {r.title || resourceLabel(r.resource_type)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {premiumFiles.length > 0 && (
                    <div className="sharp-card border border-border bg-card p-4">
                      <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                        Toolbox Premium ที่ซื้อแล้ว
                      </p>
                      <p className="text-[11px] text-muted-foreground mb-3">ดาวน์โหลดซ้ำได้ทุกเมื่อจากที่นี่</p>
                      <div className="flex flex-wrap gap-2">
                        {premiumFiles.map(f => (
                          <button
                            key={f.purchase_id}
                            onClick={() => handleDownloadPremium(f)}
                            disabled={downloadingId === f.purchase_id}
                            className={`sharp-btn flex items-center gap-1.5 text-[11px] px-3 py-1.5 border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50 ${
                              justBoughtAssetId === f.asset_id ? 'border-foreground text-foreground' : 'border-border'}`}
                          >
                            {downloadingId === f.purchase_id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Download className="w-3 h-3" />}
                            <FileText className="w-3 h-3" />
                            {f.title}
                            {f.file_type && <span className="text-[9px] font-bold uppercase opacity-60">{f.file_type}</span>}
                            {justBoughtAssetId === f.asset_id && (
                              <span className="text-[9px] font-bold px-1 bg-foreground text-background">ใหม่</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {section === 'certificates' && (
              <div>
                {enrolledCourses.length === 0 ? (
                  <div className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    ยังไม่มีคอร์สที่ลงทะเบียน —{' '}
                    <Link to="/courses" className="underline hover-shift" data-accent="red">เลือกคอร์ส</Link>
                  </div>
                ) : completedCoursesList.length === 0 ? (
                  <div className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    ยังไม่มีคอร์สที่เรียนจบครบทุกบทเรียน — เรียนให้ครบเพื่อปลดล็อกใบประกาศ
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedCoursesList.map(({ course: c }) => {
                      const record = completionRecords.find(r => r.course_id === c.id);
                      return (
                        <div key={c.id} className="sharp-card border border-border bg-card p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{tierLabel(c.tag)}</p>
                              <p className="text-sm font-semibold truncate">{c.title}</p>
                            </div>
                            <span className={`flex-shrink-0 text-[10px] font-bold tracking-wider px-2.5 py-1 ${record ? 'bg-[#34A853]/15 text-[#34A853]' : 'bg-muted text-muted-foreground'}`}>
                              {record ? 'ออกแล้ว' : 'รอออกใบสรุป'}
                            </span>
                          </div>
                          {record ? (
                            <div className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-1">
                              <p>Record of Learning Completion — ผ่านเนื้อหาบังคับครบถ้วน</p>
                              {record.diagnostic_attempts && (
                                <p>ผลคะแนนแบบประเมินทักษะ (Diagnostic Assessment): <span className="font-semibold text-foreground">{record.diagnostic_attempts.score_pct}%</span></p>
                              )}
                              <p>ออกเมื่อ {new Date(record.issued_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} · รหัสอ้างอิง <span className="font-mono">{record.record_code}</span></p>
                              <p className="italic pt-1">เอกสารนี้เป็นบันทึกการสำเร็จการเรียนรู้ ไม่ใช่การรับรองมาตรฐานวิชาชีพ</p>
                            </div>
                          ) : (
                            <p className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                              เรียนจบครบทุกบทเรียนแล้ว — ทำแบบประเมินวินิจฉัยท้ายคอร์สแล้วกด "ยืนยันรับผล" ในห้องเรียน ระบบจะออกใบบันทึกการเรียนจบให้ทันที
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {assignments.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3">งานที่ส่งตรวจ</p>
                    <div className="space-y-2">
                      {assignments.map(a => {
                        const c = courses.find(cc => cc.id === a.course_id);
                        return (
                          <div key={a.id} className="sharp-card border border-border bg-card p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{c?.title || 'คอร์ส'}</p>
                              {a.note && <p className="text-xs text-muted-foreground truncate">{a.note}</p>}
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                ส่งเมื่อ {new Date(a.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                              {a.review_note && (
                                <p className="text-xs mt-1.5 border-l-2 border-border pl-2 whitespace-pre-line">
                                  <span className="font-semibold">ความเห็นจากผู้ตรวจ:</span> {a.review_note}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 inline-block ${
                                a.status === 'approved' ? 'bg-[#34A853]/15 text-[#34A853]' :
                                a.status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {ASSIGNMENT_STATUS_LABEL[a.status] || a.status}
                              </span>
                              {a.score !== null && <p className="text-xs font-semibold mt-1">{a.score}/100</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-4">
                  บันทึกนี้ยืนยันว่าเรียนจบและผ่านเนื้อหาบังคับครบถ้วน ไม่ใช่ใบรับรองมาตรฐานวิชาชีพ — การรับรองมาตรฐาน (Certification) แยกต่างหากยังไม่เปิดใช้งาน
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <ToolboxDownloadConsentDialog
        open={pendingPremium !== null}
        assetTitle={pendingPremium?.title || ''}
        isPremium
        onConfirm={() => {
          const f = pendingPremium;
          setPendingPremium(null);
          if (f) downloadPremium(f);
        }}
        onCancel={() => setPendingPremium(null)}
      />

      <DownloadConsentDialog
        open={pendingResource !== null}
        resourceTitle={pendingResource ? (pendingResource.title || resourceLabel(pendingResource.resource_type)) : ''}
        onConfirm={() => {
          const r = pendingResource;
          setPendingResource(null);
          if (r) downloadResource(r);
        }}
        onCancel={() => setPendingResource(null)}
      />
    </>
  );
};

export default Dashboard;
