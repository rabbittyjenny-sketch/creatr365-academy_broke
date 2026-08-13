import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Check, Play, Award, Star, ChevronDown, ArrowRight, BookOpen } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface CourseRow { id:string; slug:string; tag:string; title:string; subtitle:string; color:string; learning_type:string; level:string|null; cover_image_url?:string|null }
interface ModuleRow { id:string; course_id:string; code:string; name:string; summary:string; vod_url:string|null; sort_order:number; has_quiz:boolean; has_assignment:boolean }
interface ProgressRow { module_id:string; status:'unlocked'|'completed' }
interface EnrollmentRow { id:string; course_id:string; status:string }

const COLOR_HEX: Record<string,string> = { blue:'#4285F4', green:'#34A853', yellow:'#D4A843', red:'#CC0033', black:'#888' };
const COLOR_CYCLE = ['blue','green','yellow','red'] as const;
const LEVEL_NAMES = ['STARTER','DEVELOPING','COMPETENT','PROFICIENT','MASTER'];
const LEVEL_COLORS: Record<string,string> = { GUEST:'#555', STARTER:'#4285F4', DEVELOPING:'#34A853', COMPETENT:'#D4A843', PROFICIENT:'#CC0033', MASTER:'#9B59B6' };

/* ─── Module Modal (keeps existing logic, dark restyled) ─── */
function ModuleModal({ course, mod, onClose, onUploaded }:{
  course:CourseRow; mod:ModuleRow; onClose:()=>void; onUploaded:()=>void;
}) {
  const [tab, setTab] = useState<'learn'|'quiz'|'submit'>('learn');
  const [file, setFile] = useState<File|null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const hex = COLOR_HEX[course.color] || '#D4A843';

  const tabs = [
    { id:'learn', label:'📺 เนื้อหา' },
    ...(mod.has_quiz ? [{ id:'quiz', label:'📝 Quiz' } as const] : []),
    ...(mod.has_assignment ? [{ id:'submit', label:'🎥 ส่งงาน' } as const] : []),
  ];

  const submit = async () => {
    if (!file) return;
    setBusy(true); setMsg(null);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const path = `assignments/${user.id}/${mod.id}-${Date.now()}-${file.name}`;
    const { error:upErr } = await supabase.storage.from('course-media').upload(path, file);
    if (upErr) { setMsg(upErr.message); setBusy(false); return; }
    const { data:pub } = supabase.storage.from('course-media').getPublicUrl(path);
    const { error:insErr } = await supabase.from('assignments').insert({
      user_id:user.id, course_id:mod.course_id, module_id:mod.id,
      video_url:pub.publicUrl, note, status:'pending',
    });
    setBusy(false);
    if (insErr) setMsg(insErr.message);
    else { setMsg('ส่งงานสำเร็จ — ทีมงานจะตรวจภายใน 24 ชม.'); onUploaded(); }
  };

  const ytEmbed = mod.vod_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[#111] border rounded-3xl overflow-hidden" style={{ borderColor: hex+'30' }} onClick={e=>e.stopPropagation()}>
        {/* Modal header */}
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold tracking-widest mb-0.5" style={{ color:hex+'80' }}>
                {course.title} · {mod.code}
              </p>
              <h3 className="text-base font-bold text-white">{mod.name}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all text-lg leading-none">
              ×
            </button>
          </div>
          {tabs.length > 1 && (
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-1">
              {tabs.map(t => (
                <button key={t.id} onClick={()=>setTab(t.id as typeof tab)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${tab===t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 pt-4">
          {tab==='learn' && (
            mod.vod_url ? (
              ytEmbed ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe src={`https://www.youtube.com/embed/${ytEmbed[1]}`} className="w-full h-full" allowFullScreen />
                </div>
              ) : (
                <video src={mod.vod_url} controls className="w-full rounded-xl bg-black" />
              )
            ) : (
              <div className="aspect-video rounded-xl flex items-center justify-center bg-white/5 text-xs text-white/30 border border-white/8">
                VOD จะปรากฏเมื่อทีมงานอัปโหลด
              </div>
            )
          )}
          {tab==='quiz' && (
            <div className="p-6 rounded-xl bg-white/5 text-center text-sm text-white/40 border border-white/8">
              📝 Quiz กำลังเตรียมระบบ — เร็ว ๆ นี้
            </div>
          )}
          {tab==='submit' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-white/10 bg-white/3">
                <p className="text-white/60 text-xs mb-2 font-medium">อัปโหลดวิดีโอผลงาน</p>
                <input type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0]||null)} className="text-xs text-white/50 w-full" />
              </div>
              <textarea placeholder="หมายเหตุ (ถ้ามี)" value={note} onChange={e=>setNote(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-white/10 bg-white/3 text-white/70 placeholder-white/20 focus:outline-none focus:border-white/25 resize-none" rows={2}/>
              <button disabled={!file||busy} onClick={submit}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30 transition-opacity hover:opacity-90"
                style={{ background: hex }}>
                {busy ? 'กำลังส่ง...' : 'อัปโหลดและส่งงาน'}
              </button>
              {msg && <p className="text-xs text-center text-white/40">{msg}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────── */
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const load = async () => {
    const { data:{ session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate('/auth'); return; }
    setUser({ id:session.user.id, email:session.user.email });
    const [{ data:prof },{ data:cs },{ data:ms },{ data:pr },{ data:en }] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('courses').select('id,slug,tag,title,subtitle,color,learning_type,level,cover_image_url').eq('is_active',true).order('sort_order'),
      supabase.from('course_modules').select('*').order('sort_order'),
      supabase.from('module_progress').select('module_id,status').eq('user_id', session.user.id),
      supabase.from('course_enrollments').select('id,course_id,status').eq('user_id', session.user.id),
    ]);
    setProfile(prof||null);
    setCourses((cs as any)||[]);
    setModules((ms as any)||[]);
    setProgress((pr as any)||[]);
    setEnrollments((en as any)||[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const enrolledIds = useMemo(()=>new Set(enrollments.filter(e=>['paid','free'].includes(e.status)).map(e=>e.course_id)),[enrollments]);
  const progMap = useMemo(()=>{ const m:Record<string,'unlocked'|'completed'>={};progress.forEach(p=>m[p.module_id]=p.status);return m; },[progress]);

  if (!user) return null;

  const courseList = courses.map((c,idx) => {
    const accent = COLOR_CYCLE[idx%4];
    const hex = COLOR_HEX[accent];
    const enrolled = enrolledIds.has(c.id);
    const mods = modules.filter(m=>m.course_id===c.id);
    const enriched = mods.map((m,i) => {
      let status:'completed'|'unlocked'|'locked' = 'locked';
      if (enrolled) {
        const p = progMap[m.id];
        if (p==='completed') status='completed';
        else if (p==='unlocked'||i===0) status='unlocked';
      }
      return { ...m, _status:status };
    });
    return { course:c, accent, hex, enrolled, modules:enriched };
  });

  const enrolledCourses = courseList.filter(x=>x.enrolled);
  const completedModules = enrolledCourses.reduce((s,x)=>s+x.modules.filter(m=>m._status==='completed').length,0);
  const totalModules = enrolledCourses.reduce((s,x)=>s+x.modules.length,0);
  const completedCourses = enrolledCourses.filter(x=>x.modules.length>0&&x.modules.every(m=>m._status==='completed'));
  const certCount = completedCourses.length;
  const highestIdx = Math.max(0,...completedCourses.map(x=>Math.max(0,LEVEL_NAMES.indexOf((x.course.level||'STARTER').toUpperCase()))));
  const currentLevel = enrolledCourses.length===0?'GUEST':(certCount>0?LEVEL_NAMES[highestIdx]:'STARTER');
  const levelColor = LEVEL_COLORS[currentLevel] || '#888';
  const displayName = profile?.display_name||user.email?.split('@')[0]||'Creator';
  const keyId = `ID365-${user.id.slice(0,6).toUpperCase()}`;

  return (
    <>
      <SEOHead title="Student Portal — CREATR365" description="หน้านักเรียน CREATR365" />
      <CourseNavbar />

      <main className="bg-[#080808] min-h-screen pt-20 pb-24">

        {/* ── Hero / User Banner ─────────────────────── */}
        <div className="relative overflow-hidden border-b border-white/5" style={{ background:'linear-gradient(135deg,#0D0D0D,#080808)' }}>
          {/* Glow */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background:levelColor }} />

          <div className="relative max-w-3xl mx-auto px-6 py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                  style={{ background:levelColor+'20', border:`2px solid ${levelColor}40`, color:levelColor }}>
                  {displayName.slice(0,1).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[9px] font-black"
                  style={{ background:levelColor, color:'#000' }}>
                  {currentLevel.slice(0,3)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-xs mb-1">สวัสดีค่ะ 👋 ยินดีต้อนรับกลับมา</p>
                <h1 className="text-2xl font-bold text-white leading-tight">{displayName}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-white/40">
                    {keyId}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:levelColor }}>
                    <Star className="w-3 h-3 fill-current" />
                    Creator Level: {currentLevel}
                  </span>
                </div>
              </div>

              <Link to="/courses"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 border border-white/12 hover:border-white/25 hover:text-white transition-all">
                <BookOpen className="w-3.5 h-3.5" /> ดูหลักสูตร
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats Bar ───────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'คอร์สที่เรียน', value:enrolledCourses.length, sub:'หลักสูตร', color:'#4285F4' },
              { label:'บทเรียนที่ผ่าน', value:`${completedModules}`, sub:`จากทั้งหมด ${totalModules} บท`, color:'#34A853' },
              { label:'ใบ Certificate', value:certCount, sub:'ที่ได้รับ', color:'#D4A843' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-[#111] p-4 text-center">
                <p className="text-3xl font-black mb-0.5" style={{ color:s.color }}>{s.value as any}</p>
                <p className="text-white/60 text-xs font-medium">{s.label}</p>
                <p className="text-white/25 text-[10px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3 mt-6">
              {[1,2].map(n => <div key={n} className="h-24 rounded-2xl bg-white/3 animate-pulse" />)}
            </div>
          )}

          {/* ── Course List ───────────────────────────── */}
          {!loading && (
            <div className="mt-8">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-4">คอร์สของฉัน</h2>

              {enrolledCourses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <BookOpen className="w-8 h-8 text-white/15 mx-auto mb-3" />
                  <p className="text-white/40 text-sm mb-1">ยังไม่มีคอร์สที่ลงทะเบียน</p>
                  <p className="text-white/25 text-xs mb-5">เลือกหลักสูตรที่เหมาะกับคุณและเริ่มต้น Creator Journey</p>
                  <Link to="/courses"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background:'linear-gradient(135deg,#CC0033,#990022)' }}>
                    ดูหลักสูตรทั้งหมด <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map(x => {
                    const total = x.modules.length;
                    const done = x.modules.filter(m=>m._status==='completed').length;
                    const pct = total ? Math.round(done/total*100) : 0;
                    const isOpen = openCourse === x.course.id;
                    const isComplete = pct===100;
                    const nextMod = x.modules.find(m=>m._status==='unlocked');

                    return (
                      <div key={x.course.id} className="rounded-2xl border overflow-hidden transition-all"
                        style={{ borderColor: isOpen ? x.hex+'40' : 'rgba(255,255,255,0.08)', background:'#111' }}>

                        {/* Course header */}
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Cover or initial */}
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                              style={{ background:`${x.hex}15`, border:`1px solid ${x.hex}25` }}>
                              {x.course.cover_image_url ? (
                                <img src={x.course.cover_image_url} alt={x.course.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-base font-black" style={{ color:x.hex }}>
                                  {x.course.title.slice(0,1)}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color:x.hex+'80' }}>{x.course.tag}</span>
                                {isComplete && (
                                  <span className="text-[10px] font-semibold text-[#34A853] flex items-center gap-1">
                                    <Check className="w-3 h-3" /> จบแล้ว
                                  </span>
                                )}
                              </div>
                              <p className="text-white font-semibold text-sm leading-tight">{x.course.title}</p>
                              <p className="text-white/35 text-xs mt-0.5 line-clamp-1">{x.course.subtitle}</p>

                              {/* Progress */}
                              {total > 0 && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-[10px] mb-1.5">
                                    <span className="text-white/35">{done}/{total} บทเรียน</span>
                                    <span className="font-semibold" style={{ color:x.hex }}>{pct}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:x.hex }} />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {nextMod && !isComplete && (
                                <button
                                  onClick={() => setSelected({ course:x.course, mod:nextMod })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black transition-opacity hover:opacity-90"
                                  style={{ background:x.hex }}>
                                  <Play className="w-3 h-3" /> ต่อเลย
                                </button>
                              )}
                              <button
                                onClick={() => setOpenCourse(isOpen?null:x.course.id)}
                                className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">
                                บทเรียน
                                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen?'rotate-180':''}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Module list (expanded) */}
                        {isOpen && (
                          <div className="border-t px-3 py-2 space-y-0.5" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                            {x.modules.map(m => {
                              const locked = m._status==='locked';
                              const dn = m._status==='completed';
                              return (
                                <button key={m.id} disabled={locked}
                                  onClick={() => setSelected({ course:x.course, mod:m })}
                                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${locked?'opacity-35 cursor-not-allowed':'hover:bg-white/5'}`}>
                                  {/* Status icon */}
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                    style={{
                                      background: dn ? x.hex+'20' : locked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                                      border: `1px solid ${dn ? x.hex+'50' : 'rgba(255,255,255,0.1)'}`,
                                    }}>
                                    {dn ? (
                                      <Check className="w-4 h-4" style={{ color:x.hex }} />
                                    ) : locked ? (
                                      <Lock className="w-3.5 h-3.5 text-white/20" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 text-white/60" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${dn?'text-white/70':locked?'text-white/25':'text-white/80'}`}>
                                      {m.code} — {m.name}
                                    </p>
                                    {(m.has_quiz||m.has_assignment) && (
                                      <div className="flex gap-2 mt-0.5 text-[10px] text-white/25">
                                        {m.has_quiz && <span>📝 Quiz</span>}
                                        {m.has_assignment && <span>🎥 ส่งงาน</span>}
                                      </div>
                                    )}
                                  </div>

                                  <span className="text-[10px] flex-shrink-0 font-medium"
                                    style={{ color: dn?x.hex:locked?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.35)' }}>
                                    {dn?'✓ ผ่าน':locked?'ล็อค':'เปิด'}
                                  </span>
                                </button>
                              );
                            })}

                            {/* Certificate banner */}
                            {isComplete && (
                              <div className="flex items-center gap-3 p-3 rounded-xl mt-1"
                                style={{ background:`${x.hex}10`, border:`1px solid ${x.hex}30` }}>
                                <Award className="w-4 h-4 flex-shrink-0" style={{ color:x.hex }} />
                                <div>
                                  <p className="text-xs font-semibold text-white/80">🎉 ยินดีด้วย! จบคอร์สนี้แล้ว</p>
                                  <p className="text-[10px] text-white/35 mt-0.5">Certificate พร้อมให้ดาวน์โหลด</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Explore more */}
                  <Link to="/courses"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-dashed border-white/10 text-white/30 text-sm hover:border-white/20 hover:text-white/50 transition-all">
                    <ArrowRight className="w-4 h-4" /> สำรวจหลักสูตรเพิ่มเติม
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <ModuleModal course={selected.course} mod={selected.mod}
          onClose={() => setSelected(null)} onUploaded={load} />
      )}
    </>
  );
};

export default Dashboard;
