import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Star, ExternalLink, BookOpen, CheckCircle2, Circle, Download, FileText, Loader2 } from 'lucide-react';

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

const LEVEL_NAMES = ['STARTER', 'DEVELOPING', 'COMPETENT', 'PROFICIENT', 'MASTER'];
const CURRENT_COURSE_SLUGS = new Set(['magnet','foundation','signal','stage','brand-host-architect']);

// Label shown per resource_type. Anything not listed here (a new type an
// admin adds later, e.g. "worksheet" already covered, or "cheatsheet")
// still renders — it just falls back to a generic "เอกสารประกอบการเรียน"
// label with the type name, so new kinds show up with zero code changes.
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  manual: 'คู่มือการเรียน',
  worksheet: 'Worksheet',
};
const resourceLabel = (type: string) => RESOURCE_TYPE_LABELS[type] || `เอกสารประกอบการเรียน (${type})`;

async function ensureStudentId(email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('ensure_master_student_account', { _email: email });
  if (error) { console.error('ensure_master_student_account failed', error); return null; }
  return typeof data === 'string' && data.trim() ? data.trim() : null;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ display_name?: string; line_user_id?: string } | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [openCourse, setOpenCourse] = useState<string | null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate('/auth'); return; }
    const u = { id: session.user.id, email: session.user.email };
    setUser(u);

    const [{ data: prof }, { data: cs }, { data: en }] = await Promise.all([
      supabase.from('profiles').select('display_name,line_user_id').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('courses').select('id,slug,tag,title,subtitle,color,learning_type,level').eq('is_active', true).order('sort_order'),
      supabase.from('course_enrollments').select('id,course_id,status').eq('user_id', session.user.id),
    ]);

    setProfile(prof || null);
    setCourses(((cs as any) || []).filter((c: CourseRow) => CURRENT_COURSE_SLUGS.has(c.slug)));
    const enRows: EnrollmentRow[] = (en as any) || [];
    setEnrollments(enRows);

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
      const [{ data: mods }, { data: prog }, { data: res }] = await Promise.all([
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
      ]);
      setModules((mods as any) || []);
      setProgress((prog as any) || []);
      setResources((res as any) || []);
    }
  };

  // Study materials (คู่มือ/worksheet) live in a private bucket — download
  // via a short-lived signed URL requested on click, not a stored public URL.
  const handleDownloadResource = async (r: ResourceRow) => {
    setDownloadingId(r.id);
    try {
      const { data, error } = await supabase.storage
        .from('course-resources')
        .createSignedUrl(r.file_path, 60);
      if (error || !data?.signedUrl) {
        console.error('createSignedUrl failed', error);
        alert('ดาวน์โหลดไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingId(null);
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

  const statsData = useMemo(() => {
    const completedCourses = enrollments.filter(e => {
      const mods = modulesByCourse.get(e.course_id) || [];
      return mods.length > 0 && mods.every(m => completedModuleIds.has(m.id));
    }).length;

    const quizScores = progress.filter(p => p.score != null).map(p => p.score!);
    const avgScore = quizScores.length
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

    return [
      { label: 'คอร์สที่เรียนอยู่', value: enrolledCourses.length, accent: 'red' },
      { label: 'Quiz ผ่านแล้ว', value: progress.filter(p => (p.score ?? 0) >= 70).length, accent: 'red' },
      { label: 'คะแนนเฉลี่ย', value: avgScore ? `${avgScore}%` : '-', accent: 'red' },
      { label: 'ใบประกาศ', value: completedCourses, accent: 'red' },
    ];
  }, [enrollments, enrolledCourses.length, modulesByCourse, completedModuleIds, progress]);

  if (!user) return null;
  if (!studentId) return (<><CourseNavbar /><main className="max-w-2xl mx-auto px-4 py-24"><h1 className="text-xl font-bold">ยังไม่พบ Master Key ของบัญชีนี้</h1><p className="text-sm text-muted-foreground mt-2">กรุณาสมัคร/เชื่อมบัญชีให้เรียบร้อยก่อนเริ่มเรียน</p><Link to="/register" className="inline-block mt-5 underline">ไปหน้าสมัครสมาชิก</Link></main></>);

  const keyId = studentId;
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'นักเรียน';
  const currentLevel = enrolledCourses.length === 0 ? 'GUEST' : LEVEL_NAMES[0];

  return (
    <>
      <SEOHead title="Student Portal - Creatr365" description="หน้านักเรียน Creatr365" />
      <CourseNavbar />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pt-24 pb-24">
        {/* Header */}
        <div>
          <p className="text-xs text-muted-foreground">สวัสดีค่ะ 👋</p>
          <h1 className="text-2xl font-bold" data-accent="red">{displayName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-mono bg-muted border border-border px-2 py-0.5 rounded-md">{keyId}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-current" />
              <span>{currentLevel}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statsData.map(stat => (
            <div key={stat.label} className="card-water border border-border bg-card p-4" data-accent={stat.accent}>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">คอร์สของฉัน</h2>

          {enrolledCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
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
                const returnTo = `${window.location.origin}/register?master_key=${encodeURIComponent(keyId)}`;
                const lmsUrl = `${LMS_URL}?kid=${encodeURIComponent(keyId)}&course=${encodeURIComponent(c.slug)}&returnTo=${encodeURIComponent(returnTo)}`;

                return (
                  <div key={c.id} className="card-water border border-border bg-card overflow-hidden" data-accent={accent}>
                    {/* Course header */}
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0 text-sm">
                          {c.title.slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{c.tag}</span>
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
                        <a
                          href={lmsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-accent={accent}
                          className="btn-brand text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 flex-shrink-0"
                        >
                          เข้าเรียน <ExternalLink className="w-3 h-3" />
                        </a>
                        {total > 0 && (
                          <button
                            onClick={() => setOpenCourse(isOpen ? null : c.id)}
                            className="btn-brand btn-brand--outline text-xs px-3 py-2 rounded-lg border-border"
                          >
                            {isOpen ? 'ซ่อนบทเรียน' : 'ดูบทเรียน'}
                          </button>
                        )}
                      </div>

                      {/* เอกสารประกอบการเรียน — mapped to this course, extensible to worksheets etc. */}
                      {(resourcesByCourse.get(c.id) || []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(resourcesByCourse.get(c.id) || []).map(r => (
                            <button
                              key={r.id}
                              onClick={() => handleDownloadResource(r)}
                              disabled={downloadingId === r.id}
                              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                            >
                              {downloadingId === r.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Download className="w-3 h-3" />}
                              <FileText className="w-3 h-3" />
                              {r.title || resourceLabel(r.resource_type)}
                            </button>
                          ))}
                        </div>
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
          )}
        </div>

        {/* LMS info */}
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground/70">วิธีเข้าระบบ LMS</p>
          <p>กด <span className="font-semibold">เข้าเรียน</span> — ระบบจะนำ Master Key ของคุณ (<span className="font-mono">{keyId}</span>) เข้าสู่ LMS โดยอัตโนมัติ</p>
          <p>หากต้องการเข้าด้วยตัวเอง: ไปที่ <span className="font-mono">6course-quiz.vercel.app</span> แล้วใส่ Master Key ด้านบน</p>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
