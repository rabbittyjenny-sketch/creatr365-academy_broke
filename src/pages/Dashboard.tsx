import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Check, Play, Award, Star } from 'lucide-react';

interface CourseRow {
  id: string; slug: string; tag: string; title: string; subtitle: string;
  color: string; learning_type: string; level: string | null;
}
interface ModuleRow {
  id: string; course_id: string; code: string; name: string;
  summary: string; vod_url: string | null; sort_order: number;
  has_quiz: boolean; has_assignment: boolean;
}
interface ProgressRow { module_id: string; status: 'unlocked' | 'completed' }
interface EnrollmentRow { id: string; course_id: string; status: string }

const COLOR_CYCLE = ['blue', 'green', 'yellow', 'red'] as const;
const LEVEL_NAMES = ['STARTER', 'DEVELOPING', 'COMPETENT', 'PROFICIENT', 'MASTER'];

function ModuleModal({ course, mod, onClose, onUploaded }:{
  course: CourseRow; mod: ModuleRow; onClose: () => void; onUploaded: () => void;
}) {
  const [tab, setTab] = useState<'learn'|'quiz'|'submit'>('learn');
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const tabs = [
    { id:'learn', label:'เนื้อหา' },
    ...(mod.has_quiz ? [{ id:'quiz', label:'Quiz' } as const] : []),
    ...(mod.has_assignment ? [{ id:'submit', label:'ส่งงาน' } as const] : []),
  ];

  const submit = async () => {
    if (!file) return;
    setBusy(true); setMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const path = `assignments/${user.id}/${mod.id}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('course-media').upload(path, file);
    if (upErr) { setMsg(upErr.message); setBusy(false); return; }
    const { data: pub } = supabase.storage.from('course-media').getPublicUrl(path);
    const { error: insErr } = await supabase.from('assignments').insert({
      user_id: user.id, course_id: mod.course_id, module_id: mod.id,
      video_url: pub.publicUrl, note, status: 'pending',
    });
    setBusy(false);
    if (insErr) setMsg(insErr.message);
    else { setMsg('ส่งงานสำเร็จ — ทีมงานจะตรวจภายใน 24 ชม.'); onUploaded(); }
  };

  const ytEmbed = mod.vod_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground">{course.title} · {mod.code}</p>
              <h3 className="text-base font-bold">{mod.name}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg">×</button>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as typeof tab)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium ${tab===t.id?'bg-background shadow-sm':'text-muted-foreground'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab==='learn' && (
            mod.vod_url ? (
              ytEmbed ? (
                <div className="aspect-video rounded-xl overflow-hidden">
                  <iframe src={`https://www.youtube.com/embed/${ytEmbed[1]}`} className="w-full h-full" allowFullScreen />
                </div>
              ) : (
                <video src={mod.vod_url} controls className="w-full rounded-xl bg-foreground" />
              )
            ) : (
              <div className="aspect-video rounded-xl flex items-center justify-center bg-muted text-xs text-muted-foreground">VOD จะปรากฏเมื่อทีมงานอัปโหลด</div>
            )
          )}
          {tab==='quiz' && (
            <div className="p-4 rounded-xl bg-muted text-center text-xs text-muted-foreground">
              📝 Quiz กำลังเตรียมระบบ — เร็ว ๆ นี้
            </div>
          )}
          {tab==='submit' && (
            <div className="space-y-3">
              <input type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0]||null)} className="text-xs w-full" />
              <textarea placeholder="หมายเหตุ (ถ้ามี)" value={note} onChange={e=>setNote(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-border bg-background" rows={2}/>
              <button disabled={!file||busy} onClick={submit}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-foreground text-background disabled:opacity-40">
                {busy?'กำลังส่ง...':'อัปโหลดและส่งงาน'}
              </button>
              {msg && <p className="text-xs text-muted-foreground text-center">{msg}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{id:string;email?:string}|null>(null);
  const [profile, setProfile] = useState<{display_name?:string}|null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [openCourse, setOpenCourse] = useState<string|null>(null);
  const [selected, setSelected] = useState<{course:CourseRow;mod:ModuleRow}|null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate('/auth'); return; }
    setUser({ id: session.user.id, email: session.user.email });
    const [{ data: prof }, { data: cs }, { data: ms }, { data: pr }, { data: en }] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('courses').select('id,slug,tag,title,subtitle,color,learning_type,level').eq('is_active', true).order('sort_order'),
      supabase.from('course_modules').select('*').order('sort_order'),
      supabase.from('module_progress').select('module_id,status').eq('user_id', session.user.id),
      supabase.from('course_enrollments').select('id,course_id,status').eq('user_id', session.user.id),
    ]);
    setProfile(prof||null);
    setCourses((cs as any)||[]);
    setModules((ms as any)||[]);
    setProgress((pr as any)||[]);
    setEnrollments((en as any)||[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const enrolledIds = useMemo(()=>new Set(enrollments.filter(e=>['paid','free'].includes(e.status)).map(e=>e.course_id)),[enrollments]);
  const progMap = useMemo(()=>{ const m: Record<string,'unlocked'|'completed'> = {}; progress.forEach(p=>m[p.module_id]=p.status); return m; },[progress]);

  if (!user) return null;

  const courseList = courses.map((c, idx) => {
    const accent = COLOR_CYCLE[idx % 4];
    const enrolled = enrolledIds.has(c.id);
    const mods = modules.filter(m => m.course_id === c.id);
    const enriched = mods.map((m, i) => {
      let status: 'completed'|'unlocked'|'locked' = 'locked';
      if (enrolled) {
        const p = progMap[m.id];
        if (p === 'completed') status = 'completed';
        else if (p === 'unlocked' || i === 0) status = 'unlocked';
      }
      return { ...m, _status: status };
    });
    return { course: c, accent, enrolled, modules: enriched };
  });

  const enrolledCourses = courseList.filter(x=>x.enrolled);
  const lockedCourses = courseList.filter(x=>!x.enrolled);
  const completedModules = enrolledCourses.reduce((s,x)=>s+x.modules.filter(m=>m._status==='completed').length,0);
  const totalModules = enrolledCourses.reduce((s,x)=>s+x.modules.length,0);
  const completedCourses = enrolledCourses.filter(x=>x.modules.length>0 && x.modules.every(m=>m._status==='completed'));
  const certCount = completedCourses.length;
  const highestLevelIdx = Math.max(0, ...completedCourses.map(x => Math.max(0, LEVEL_NAMES.indexOf((x.course.level||'STARTER').toUpperCase()))));
  const currentLevel = enrolledCourses.length === 0 ? 'GUEST' : (certCount > 0 ? LEVEL_NAMES[highestLevelIdx] : 'STARTER');
  const keyId = `ID365-${user.id.slice(0,6).toUpperCase()}`;
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'นักเรียน';

  return (
    <>
      <SEOHead title="Student Portal - Creatr365" description="หน้านักเรียน Creatr365" />
      <CourseNavbar />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pt-24 pb-24">
        <div>
          <p className="text-xs text-muted-foreground">สวัสดีค่ะ 👋</p>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-mono bg-muted border border-border px-2 py-0.5 rounded-md">{keyId}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-current" />
              <span>{currentLevel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'คอร์สที่เรียน', value:enrolledCourses.length, accent:'blue' },
            { label:'บทที่ผ่าน', value:`${completedModules}/${totalModules}`, accent:'green' },
            { label:'ใบประกาศ', value:certCount, accent:'yellow' },
          ].map(s=>(
            <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="text-xl font-black hover-shift" data-accent={s.accent}>{s.value as any}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">คอร์สของฉัน</h2>
          {enrolledCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              ยังไม่มีคอร์สที่ลงทะเบียน — <Link to="/courses" className="underline hover-shift" data-accent="blue">เลือกคอร์ส</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map(x => {
                const total = x.modules.length;
                const done = x.modules.filter(m=>m._status==='completed').length;
                const pct = total ? Math.round(done/total*100) : 0;
                const isOpen = openCourse === x.course.id;
                return (
                  <div key={x.course.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                        {x.course.title.slice(0,1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{x.course.tag}</span>
                          {x.course.level && <span className="text-[10px] text-muted-foreground">· {x.course.level}</span>}
                        </div>
                        <p className="text-sm font-semibold hover-shift" data-accent={x.accent}>{x.course.title}</p>
                        <p className="text-xs text-muted-foreground">{x.course.subtitle}</p>
                        {total>0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                              <span>{done}/{total} บท</span><span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-foreground transition-all duration-500" style={{width:`${pct}%`}} />
                            </div>
                          </div>
                        )}
                      </div>
                      <button onClick={()=>setOpenCourse(isOpen?null:x.course.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted">
                        {isOpen?'ซ่อน':'เปิด'}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="border-t border-border px-3 py-2 space-y-0.5">
                        {x.modules.map(m=>{
                          const locked = m._status==='locked';
                          const dn = m._status==='completed';
                          return (
                            <button key={m.id} disabled={locked} onClick={()=>setSelected({course:x.course, mod:m})}
                              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl ${locked?'opacity-40 cursor-not-allowed':'hover:bg-muted'}`}>
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${dn?'bg-foreground text-background border-foreground':'border-border'}`}>
                                {dn ? <Check className="w-4 h-4"/> : locked ? <Lock className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{m.code} — {m.name}</p>
                                <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                  {m.has_quiz && <span>📝 Quiz</span>}
                                  {m.has_assignment && <span>🎥 ส่งงาน</span>}
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground hover-shift" data-accent={x.accent}>
                                {dn?'ผ่าน':locked?'ล็อค':'เปิด'}
                              </span>
                            </button>
                          );
                        })}
                        {pct===100 && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border">
                            <Award className="w-4 h-4"/>
                            <span className="text-xs font-medium">Certificate ของคุณพร้อมแล้ว</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {lockedCourses.length>0 && (
          <div>
            <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">คอร์สที่ยังไม่ได้ลงทะเบียน</h2>
            <div className="space-y-2">
              {lockedCourses.map(x=>(
                <Link key={x.course.id} to={`/course/${x.course.slug}`}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-muted">
                  <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-sm">
                    {x.course.title.slice(0,1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{x.course.tag}{x.course.level?` · ${x.course.level}`:''}</p>
                    <p className="text-sm font-semibold truncate hover-shift" data-accent={x.accent}>{x.course.title}</p>
                  </div>
                  <Lock className="w-4 h-4 text-muted-foreground"/>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {selected && (
        <ModuleModal course={selected.course} mod={selected.mod}
          onClose={()=>setSelected(null)} onUploaded={load}/>
      )}
    </>
  );
};

export default Dashboard;
