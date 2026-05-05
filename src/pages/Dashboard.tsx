import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Check, Play, Award, Star, Pencil } from 'lucide-react';

// ── TYPES ────────────────────────────────────────────────────────────
interface CourseRow {
  id: string;
  slug: string;
  tag: string;
  title: string;
  subtitle: string;
  color: string;
  learning_type: string;
  features: string[];
}

interface EnrollmentRow {
  id: string;
  course_id: string;
  status: string; // pending | paid | free
}

type ModuleStatus = 'completed' | 'unlocked' | 'locked';
interface ModuleItem {
  module_id: string;
  code: string;
  name: string;
  status: ModuleStatus;
  has_quiz: boolean;
  has_assignment: boolean;
}

const ACCENT_HEX: Record<string, string> = {
  blue: '#4285F4', red: '#CC0033', yellow: '#FFD700', green: '#34A853', black: '#1A1A1A',
};
const COLOR_CYCLE = ['blue', 'green', 'yellow', 'red'] as const;

const LEVEL_LABELS = ['', 'Rookie', 'Competent', 'Professional', 'Master', 'Legend'];

// derive simple module list from course features (until real modules table exists)
function buildModules(course: CourseRow, enrolled: boolean): ModuleItem[] {
  return (course.features || []).map((feat, i) => ({
    module_id: `${course.id}-${i}`,
    code: `${course.title.split(' ')[0].slice(0, 1)}${i + 1}`,
    name: feat,
    status: enrolled ? (i === 0 ? 'unlocked' : 'locked') : 'locked',
    has_quiz: true,
    has_assignment: i % 2 === 1,
  }));
}

// ── MODULE MODAL ─────────────────────────────────────────────────────
function ModuleModal({
  course, mod, keyId, onClose,
}: { course: CourseRow & { _accentHex: string }; mod: ModuleItem; keyId: string; onClose: () => void }) {
  const [tab, setTab] = useState<'learn' | 'quiz' | 'submit'>('learn');
  const tabs = [
    { id: 'learn', label: 'เนื้อหา' },
    ...(mod.has_quiz ? [{ id: 'quiz', label: 'ทำ Quiz' }] : []),
    ...(mod.has_assignment ? [{ id: 'submit', label: 'ส่งงาน' }] : []),
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest mb-0.5 text-muted-foreground">
                {course.title} · {mod.code}
              </p>
              <h3 className="text-base font-bold hover-shift" data-accent="blue">{mod.name}</h3>
            </div>
            <button onClick={onClose} aria-label="ปิด"
              className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/70 transition-colors text-lg leading-none">
              ×
            </button>
          </div>

          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
                  tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === 'learn' && (
            <div className="space-y-3">
              <div className="aspect-video rounded-xl flex flex-col items-center justify-center gap-3 bg-muted border border-border">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Play className="w-5 h-5" />
                </div>
                <p className="text-xs text-muted-foreground">VOD จะปรากฏที่นี่เมื่อทีมงานอัปโหลด</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                ดูเนื้อหาให้ครบแล้วทำ Quiz เพื่อปลดล็อคบทถัดไปค่ะ
              </p>
            </div>
          )}

          {tab === 'quiz' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-muted border border-border text-center space-y-2">
                <p className="text-2xl">📝</p>
                <p className="text-sm font-semibold">Quiz {mod.code}</p>
                <p className="text-xs text-muted-foreground">ต้องได้ ≥ 80% เพื่อผ่านบทนี้</p>
                <a
                  href={`https://tally.so/r/REPLACE_ME?key_id=${encodeURIComponent(keyId)}&module=${encodeURIComponent(mod.code)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-foreground text-background hover:opacity-90 transition-all">
                  <Pencil className="w-4 h-4" /> เริ่มทำ Quiz
                </a>
              </div>
            </div>
          )}

          {tab === 'submit' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-muted border border-border text-center space-y-2">
                <p className="text-2xl">🎥</p>
                <p className="text-sm font-semibold">ส่งงานวิดีโอ {mod.code}</p>
                <p className="text-xs text-muted-foreground">ทีมงานจะตรวจและแจ้งผลภายใน 24 ชม.</p>
                <a
                  href={`https://tally.so/r/REPLACE_ME?key_id=${encodeURIComponent(keyId)}&module=${encodeURIComponent(mod.code)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-foreground text-background hover:opacity-90 transition-all">
                  📤 อัปโหลดวิดีโอ
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODULE ROW ───────────────────────────────────────────────────────
function ModuleRow({ mod, accent, onAction }: { mod: ModuleItem; accent: string; onAction: (m: ModuleItem) => void }) {
  const isLocked = mod.status === 'locked';
  const isDone = mod.status === 'completed';

  return (
    <button
      type="button" disabled={isLocked} onClick={() => onAction(mod)}
      className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${
        isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted'
      }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
        isDone ? 'bg-foreground text-background border-foreground' : 'border-border'
      }`}>
        {isDone ? <Check className="w-4 h-4" /> : isLocked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
          {mod.code} — {mod.name}
        </p>
        <div className="flex gap-1.5 mt-0.5">
          {mod.has_quiz && <span className="text-[10px] text-muted-foreground">📝 Quiz</span>}
          {mod.has_assignment && <span className="text-[10px] text-muted-foreground">🎥 ส่งงาน</span>}
        </div>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border border-border text-muted-foreground hover-shift" data-accent={accent}>
        {isDone ? 'ผ่านแล้ว' : isLocked ? 'ล็อค' : 'เปิดแล้ว'}
      </span>
    </button>
  );
}

// ── COURSE CARD ──────────────────────────────────────────────────────
function CourseCard({
  course, modules, enrolled, accent, onSelectModule,
}: {
  course: CourseRow; modules: ModuleItem[]; enrolled: boolean; accent: string;
  onSelectModule: (course: CourseRow, mod: ModuleItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const completed = modules.filter((m) => m.status === 'completed').length;
  const total = modules.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-foreground text-background">
          {course.title.slice(0, 1)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{course.tag}</span>
            <span className="text-[10px] text-muted-foreground">{course.learning_type === 'online' ? 'VOD' : course.learning_type === 'hybrid' ? 'Hybrid' : 'Onsite'}</span>
          </div>
          <p className="text-sm font-semibold leading-snug hover-shift" data-accent={accent}>{course.title}</p>
          <p className="text-xs text-muted-foreground">{course.subtitle}</p>

          {enrolled && total > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{completed}/{total} บท</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-foreground transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>

        {enrolled ? (
          <button onClick={() => setOpen((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 border border-border hover:bg-muted transition-all">
            {open ? 'ซ่อน' : 'เปิด'}
          </button>
        ) : (
          <Link to={`/course/${course.slug}`}
            className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 border border-border text-muted-foreground hover:bg-muted transition-all">
            ดูรายละเอียด
          </Link>
        )}
      </div>

      {open && enrolled && (
        <div className="border-t border-border px-3 py-2 space-y-0.5">
          {modules.map((mod) => (
            <ModuleRow key={mod.module_id} mod={mod} accent={accent} onAction={(m) => onSelectModule(course, m)} />
          ))}
          {pct === 100 && (
            <div className="flex items-center gap-2 p-3 mt-1 rounded-xl bg-muted border border-border">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">Certificate ของคุณพร้อมแล้ว</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ display_name?: string } | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [view, setView] = useState<'home' | 'profile'>('home');
  const [selected, setSelected] = useState<{ course: CourseRow; mod: ModuleItem } | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { navigate('/auth'); return; }
      if (!mounted) return;
      setUser({ id: session.user.id, email: session.user.email });

      const [{ data: prof }, { data: courseRows }, { data: enrRows }] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('user_id', session.user.id).maybeSingle(),
        supabase.from('courses').select('id,slug,tag,title,subtitle,color,learning_type,features').eq('is_active', true).order('sort_order'),
        supabase.from('course_enrollments').select('id,course_id,status').eq('user_id', session.user.id),
      ]);
      if (!mounted) return;
      setProfile(prof || null);
      setCourses((courseRows as unknown as CourseRow[]) || []);
      setEnrollments((enrRows as unknown as EnrollmentRow[]) || []);
    });
    return () => { mounted = false; };
  }, [navigate]);

  const enrolledIds = useMemo(
    () => new Set(enrollments.filter((e) => ['paid', 'free'].includes(e.status)).map((e) => e.course_id)),
    [enrollments]
  );

  const enrichedCourses = useMemo(
    () => courses.map((c, i) => ({
      course: c,
      enrolled: enrolledIds.has(c.id),
      accent: COLOR_CYCLE[i % COLOR_CYCLE.length],
      modules: buildModules(c, enrolledIds.has(c.id)),
    })),
    [courses, enrolledIds]
  );

  if (!user) return null;

  const enrolledList = enrichedCourses.filter((x) => x.enrolled);
  const lockedList = enrichedCourses.filter((x) => !x.enrolled);
  const totalCompleted = enrolledList.reduce((acc, x) => acc + x.modules.filter((m) => m.status === 'completed').length, 0);
  const totalModules = enrolledList.reduce((acc, x) => acc + x.modules.length, 0);
  const certCount = enrolledList.filter((x) => x.modules.length > 0 && x.modules.every((m) => m.status === 'completed')).length;
  const hostLevel = Math.min(5, Math.max(1, enrolledList.length + certCount));
  const keyId = `ID365-${user.id.slice(0, 6).toUpperCase()}`;
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'นักเรียน';

  return (
    <>
      <SEOHead title="Student Portal - Creatr365" description="หน้านักเรียน Creatr365 — ดูคอร์ส บทเรียน Quiz และ Certificate" />
      <CourseNavbar />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pt-24 pb-24">
        {view === 'home' && (
          <>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">สวัสดีค่ะ 👋</p>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-mono bg-muted border border-border px-2 py-0.5 rounded-md">{keyId}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3" style={{ opacity: i < hostLevel ? 1 : 0.2, fill: i < hostLevel ? 'currentColor' : 'none' }} />
                  ))}
                  <span className="ml-1">Level {hostLevel} — {LEVEL_LABELS[hostLevel]}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'คอร์สที่เรียน', value: enrolledList.length, accent: 'blue' as const },
                { label: 'บทที่ผ่าน', value: `${totalCompleted}/${totalModules}`, accent: 'green' as const },
                { label: 'ใบประกาศ', value: certCount, accent: 'yellow' as const },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
                  <p className="text-xl font-black hover-shift" data-accent={s.accent}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">คอร์สของฉัน</h2>
              {enrolledList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  ยังไม่มีคอร์สที่ลงทะเบียน — <Link to="/courses" className="underline hover-shift" data-accent="blue">เลือกคอร์ส</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledList.map((x) => (
                    <CourseCard key={x.course.id} course={x.course} modules={x.modules} enrolled accent={x.accent}
                      onSelectModule={(c, m) => setSelected({ course: c, mod: m })} />
                  ))}
                </div>
              )}
            </div>

            {lockedList.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">คอร์สที่ยังไม่ได้ลงทะเบียน</h2>
                <div className="space-y-2">
                  {lockedList.map((x) => (
                    <Link key={x.course.id} to={`/course/${x.course.slug}`}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-muted border border-border">
                        {x.course.title.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold tracking-widest text-muted-foreground">{x.course.tag}</p>
                        <p className="text-sm font-semibold truncate hover-shift" data-accent={x.accent}>{x.course.title}</p>
                      </div>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {view === 'profile' && (
          <>
            <button onClick={() => setView('home')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← กลับ</button>

            <div className="p-5 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center text-2xl font-black">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{displayName}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{keyId}</p>
                  <p className="text-xs text-muted-foreground mt-1">Level {hostLevel} · {LEVEL_LABELS[hostLevel]}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">ใบประกาศนียบัตร</p>
              {certCount === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  ยังไม่มีใบประกาศ — ผ่านครบทุกบทเพื่อรับได้เลยค่ะ 🎓
                </div>
              ) : (
                enrolledList
                  .filter((x) => x.modules.length > 0 && x.modules.every((m) => m.status === 'completed'))
                  .map((x) => (
                    <div key={x.course.id} className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3 mb-2">
                      <Award className="w-5 h-5" />
                      <div>
                        <p className="text-xs font-bold hover-shift" data-accent={x.accent}>{x.course.title}</p>
                        <p className="text-xs text-muted-foreground">Creatr365 Certificate</p>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">Learning Path แนะนำ</p>
              {[
                { path: 'Path A', label: 'Psychology Specialist', courses: 'SIGNAL → STAGE' },
                { path: 'Path B', label: 'Data & AI Specialist', courses: 'MATRIX → FRONTIER' },
                { path: 'Path C', label: 'Brand Identity Builder', courses: 'SIGNAL → STAGE → BLUEPRINT' },
                { path: 'Path D', label: 'Full Professional', courses: 'ทั้ง 5 คอร์ส' },
              ].map((p) => (
                <div key={p.path} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card mb-2">
                  <span className="text-xs font-bold text-muted-foreground w-12 flex-shrink-0 pt-0.5">{p.path}</span>
                  <div>
                    <p className="text-xs font-semibold">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.courses}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-background/90 backdrop-blur-xl border-t border-border z-30">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-around">
          {([
            { id: 'home', label: 'หน้าหลัก', icon: '⊞' },
            { id: 'profile', label: 'โปรไฟล์', icon: '◎' },
          ] as const).map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`flex flex-col items-center gap-1 transition-all ${view === n.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="text-xl leading-none">{n.icon}</span>
              <span className="text-xs">{n.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {selected && (
        <ModuleModal
          course={{ ...selected.course, _accentHex: ACCENT_HEX[selected.course.color] || ACCENT_HEX.blue }}
          mod={selected.mod} keyId={keyId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};

export default Dashboard;
