import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Star, BookOpen, ExternalLink } from 'lucide-react';

// ============================================================
// ข้อมูลบทเรียนจาก 6course-quiz repo (ตรงกับ COURSES ใน LMS)
// ============================================================
const LMS_URL = 'https://6course-quiz.vercel.app';

interface Lesson { id: string; name: string; dur: string; hasVideo: boolean; isOnsite: boolean }

const LMS_LESSONS: Record<string, Lesson[]> = {
  'micro-express': [
    { id:'M01', name:'Why Hook คือทุกอย่าง',          dur:'8 นาที',   hasVideo:true,  isOnsite:false },
    { id:'M02', name:'30-Sec Hook Formula ชั้นที่ 1', dur:'10 นาที',  hasVideo:true,  isOnsite:false },
    { id:'M03', name:'Formula ชั้นที่ 2-3',            dur:'12 นาที',  hasVideo:true,  isOnsite:false },
    { id:'M04', name:'Host คือใคร? 5 ประเภท',         dur:'8 นาที',   hasVideo:true,  isOnsite:false },
    { id:'M05', name:'Live Commerce 101',               dur:'10 นาที',  hasVideo:true,  isOnsite:false },
  ],
  'signal': [
    { id:'S01', name:'Hook Architecture',   dur:'60 นาที',  hasVideo:true,  isOnsite:false },
    { id:'S02', name:'S-O-R + PAD Theory',  dur:'90 นาที',  hasVideo:true,  isOnsite:false },
    { id:'S03', name:'Vocal Dynamics',       dur:'60 นาที',  hasVideo:true,  isOnsite:false },
    { id:'S04', name:'Camera Mastery',       dur:'60 นาที',  hasVideo:true,  isOnsite:false },
    { id:'S05', name:'Trust Architecture',   dur:'60 นาที',  hasVideo:true,  isOnsite:false },
    { id:'S06', name:'Narrative Selling',    dur:'60 นาที',  hasVideo:true,  isOnsite:false },
  ],
  'matrix': [
    { id:'MT01', name:'Algorithm Intel',        dur:'60 นาที',  hasVideo:true,  isOnsite:false },
    { id:'MT02', name:'FOMO System',             dur:'60 นาที',  hasVideo:true,  isOnsite:false },
    { id:'MT03', name:'Dashboard Analytics',     dur:'90 นาที',  hasVideo:true,  isOnsite:false },
    { id:'MT04', name:'Reporting & GMV',         dur:'60 นาที',  hasVideo:true,  isOnsite:false },
    { id:'MT05', name:'AI Tools',                dur:'60 นาที',  hasVideo:true,  isOnsite:false },
    { id:'MT06', name:'Compliance (PDPA/ETDA)',  dur:'30 นาที',  hasVideo:true,  isOnsite:false },
  ],
  'stage': [
    { id:'S1', name:'Vocal Engine Lab',      dur:'09:00–10:30', hasVideo:false, isOnsite:true },
    { id:'S2', name:'Camera Presence',       dur:'10:30–11:30', hasVideo:false, isOnsite:true },
    { id:'S3', name:'Hook Factory',          dur:'11:30–12:00', hasVideo:false, isOnsite:true },
    { id:'S4', name:'Narrative Performance', dur:'13:00–14:30', hasVideo:false, isOnsite:true },
    { id:'S5', name:'Crisis Improv Lab',     dur:'14:30–16:30', hasVideo:false, isOnsite:true },
    { id:'S6', name:'Test Live + Debrief',   dur:'16:30–17:00', hasVideo:false, isOnsite:true },
  ],
  'blueprint': [
    { id:'B1', name:'5 Hidden Souls',             dur:'วัน 1 · 09:00–11:30', hasVideo:false, isOnsite:true },
    { id:'B2', name:'Brand CI Architecture',       dur:'วัน 1 · 12:30–14:30', hasVideo:false, isOnsite:true },
    { id:'B3', name:'Personal Branding + EPK',     dur:'วัน 1 · 14:30–16:30', hasVideo:false, isOnsite:true },
    { id:'B5', name:'Multi-Camera Production',     dur:'วัน 2 · 09:00–11:00', hasVideo:false, isOnsite:true },
    { id:'B6', name:'Team Production System',      dur:'วัน 2 · 11:00–12:30', hasVideo:false, isOnsite:true },
    { id:'B7', name:'Live Simulation + EPK Build', dur:'วัน 2 · 13:30–16:00', hasVideo:false, isOnsite:true },
  ],
  'frontier': [
    { id:'F1', name:'P&L Mastery',               dur:'วัน 1 · 09:00–11:30', hasVideo:false, isOnsite:true },
    { id:'F2', name:'Advanced Analytics',         dur:'วัน 1 · 12:30–14:00', hasVideo:false, isOnsite:true },
    { id:'F3', name:'Smart Lazy Strategy',        dur:'วัน 1 · 14:00–15:30', hasVideo:false, isOnsite:true },
    { id:'F5', name:'Global Market Intelligence', dur:'วัน 2 · 09:00–11:00', hasVideo:false, isOnsite:true },
    { id:'F6', name:'IMC & Digital Marketing',    dur:'วัน 2 · 11:00–12:30', hasVideo:false, isOnsite:true },
    { id:'F7', name:'Global Pitch Simulation',    dur:'วัน 2 · 13:30–16:00', hasVideo:false, isOnsite:true },
  ],
};

interface CourseRow {
  id: string; slug: string; tag: string; title: string; subtitle: string;
  color: string; learning_type: string; level: string | null;
}
interface EnrollmentRow { id: string; course_id: string; status: string }

const COLOR_CYCLE = ['blue', 'green', 'yellow', 'red'] as const;
const LEVEL_NAMES = ['STARTER', 'DEVELOPING', 'COMPETENT', 'PROFICIENT', 'MASTER'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{id:string;email?:string}|null>(null);
  const [profile, setProfile] = useState<{display_name?:string;line_user_id?:string}|null>(null);
  const [studentId, setStudentId] = useState<string|null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [openCourse, setOpenCourse] = useState<string|null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate('/auth'); return; }
    setUser({ id: session.user.id, email: session.user.email });

    const [{ data: prof }, { data: cs }, { data: en }] = await Promise.all([
      supabase.from('profiles').select('display_name,line_user_id').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('courses').select('id,slug,tag,title,subtitle,color,learning_type,level').eq('is_active', true).order('sort_order'),
      supabase.from('course_enrollments').select('id,course_id,status').eq('user_id', session.user.id),
    ]);

    setProfile(prof || null);
    setCourses((cs as any) || []);
    setEnrollments((en as any) || []);

    if ((prof as any)?.line_user_id) {
      const { data: acct } = await supabase
        .from('user_accounts')
        .select('student_id')
        .eq('line_user_id', (prof as any).line_user_id)
        .maybeSingle();
      if ((acct as any)?.student_id) setStudentId((acct as any).student_id);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const enrolledIds = useMemo(() =>
    new Set(enrollments.filter(e => ['paid','free','active'].includes(e.status)).map(e => e.course_id)),
    [enrollments]
  );

  if (!user) return null;

  const enrolledCourses = courses
    .filter(c => enrolledIds.has(c.id))
    .map((c, idx) => ({ course: c, accent: COLOR_CYCLE[idx % 4] }));

  const keyId = studentId || `ID365-${user.id.slice(0,6).toUpperCase()}`;
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'นักเรียน';

  const completedCount = 0;
  const certCount = 0;
  const currentLevel = enrolledCourses.length === 0 ? 'GUEST' : LEVEL_NAMES[0];

  return (
    <>
      <SEOHead title="Student Portal - Creatr365" description="หน้านักเรียน Creatr365" />
      <CourseNavbar />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pt-24 pb-24">
        {/* Header */}
        <div>
          <p className="text-xs text-muted-foreground">สวัสดีค่ะ 👋</p>
          <h1 className="text-2xl font-bold" data-accent="green">{displayName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-mono bg-muted border border-border px-2 py-0.5 rounded-md">{keyId}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-current" />
              <span>{currentLevel}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'คอร์สที่เรียน', value: enrolledCourses.length, accent:'blue' },
            { label:'บทที่ผ่าน',     value: completedCount,          accent:'green' },
            { label:'ใบประกาศ',     value: certCount,               accent:'yellow' },
          ].map(s => (
            <div key={s.label} className="card-water bg-card border border-border p-3 text-center" data-accent={s.accent}>
              <p className="text-xl font-black hover-shift" data-accent={s.accent}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">คอร์สของฉัน</h2>

          {enrolledCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              ยังไม่มีคอร์สที่ลงทะเบียน — <Link to="/courses" className="underline hover-shift" data-accent="blue">เลือกคอร์ส</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map(({ course: c, accent }) => {
                const lessons = LMS_LESSONS[c.slug] || [];
                const total = lessons.length;
                const isOpen = openCourse === c.id;

                return (
                  <div key={c.id} className="card-water border border-border bg-card overflow-hidden" data-accent={accent}>
                    {/* Course header */}
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0 text-sm">
                        {c.title.slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{c.tag}</span>
                          {c.level && <span className="text-[10px] text-muted-foreground">· {c.level}</span>}
                        </div>
                        <p className="text-sm font-semibold hover-shift" data-accent={accent}>{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.subtitle}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{total} บทเรียน</p>
                      </div>
                      <button
                        onClick={() => setOpenCourse(isOpen ? null : c.id)}
                        data-accent={accent}
                        className="btn-brand btn-brand--outline text-xs px-3 py-1.5 rounded-lg border-border flex-shrink-0"
                      >
                        {isOpen ? 'ซ่อน' : 'ดูบทเรียน'}
                      </button>
                    </div>

                    {/* Lesson list */}
                    {isOpen && (
                      <div className="border-t border-border">
                        {/* LMS entry button */}
                        <div className="px-4 py-3 bg-muted/40 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">เรียนผ่านระบบ LMS — ใช้ Key ID เข้า</span>
                          <a
                            href={LMS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-accent={accent}
                            className="btn-brand text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            เข้าเรียน <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Lesson rows */}
                        <div className="px-3 py-2 space-y-0.5">
                          {lessons.map((lesson, i) => (
                            <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg">
                              <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{lesson.name}</p>
                                <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                  <span>{lesson.dur}</span>
                                  {lesson.hasVideo && <span>· 🎬 วิดีโอ + Quiz</span>}
                                  {lesson.isOnsite && <span>· 🏛 Onsite</span>}
                                </div>
                              </div>
                              <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Dashboard;
