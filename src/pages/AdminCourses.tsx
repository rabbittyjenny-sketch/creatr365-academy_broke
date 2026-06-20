import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, ArrowUp, ArrowDown, Ticket, Eye, EyeOff, ExternalLink } from 'lucide-react';

/* ─── Types ────────────────────────────────────────────── */
interface CourseRow {
  id:string; slug:string; tag:string; title:string; subtitle:string; description:string;
  duration:string; price:string; features:string[]; color:string; sort_order:number;
  is_active:boolean; learning_type:string; max_slots:number|null; stripe_price_id:string|null;
  status:string; level:string|null; target_audience:string|null; format_label:string|null;
  intro_video_url:string|null; cover_image_url:string|null; gallery_image_urls:string[];
  kpi_notes:Array<{label:string;value:string;note?:string}>; deliverables:string[];
  outcome_goal:string|null; bloom_level:string|null;
}
interface ModuleRow {
  id:string; course_id:string; code:string; name:string; summary:string;
  duration_label:string; vod_url:string|null; has_quiz:boolean; has_assignment:boolean; sort_order:number;
}
interface PromoCode {
  id:string; course_id:string; code:string; discount_type:string;
  discount_value:number; max_uses:number; used_count:number; is_active:boolean;
}

/* ─── Constants ────────────────────────────────────────── */
const COLOR_OPTIONS = [
  { value:'blue',  hex:'#4285F4' }, { value:'red',    hex:'#CC0033' },
  { value:'yellow',hex:'#C49A1A' }, { value:'green',  hex:'#34A853' },
  { value:'black', hex:'#888888' },
];
const LEARNING_TYPES = [
  { value:'offline', label:'Offline (Onsite)' },
  { value:'online',  label:'Online (VOD)' },
  { value:'hybrid',  label:'Hybrid' },
];
const STATUS_OPTIONS = [
  { value:'now_open',    label:'Now Open ●' },
  { value:'coming_soon', label:'Coming Soon' },
  { value:'draft',       label:'Draft (Hidden)' },
  { value:'archived',    label:'Archived' },
];
const LEVEL_OPTIONS = ['STARTER','DEVELOPING','COMPETENT','PROFICIENT','MASTER'];

const emptyCourse = (sort:number): CourseRow => ({
  id:'', slug:'', tag:'', title:'', subtitle:'', description:'',
  duration:'', price:'', features:[], color:'red',
  sort_order:sort, is_active:true, learning_type:'online', max_slots:null,
  stripe_price_id:null, status:'now_open', level:null, target_audience:null,
  format_label:null, intro_video_url:null, cover_image_url:null,
  gallery_image_urls:[], kpi_notes:[], deliverables:[], outcome_goal:null, bloom_level:null,
});

/* ─── Shared input styles ──────────────────────────────── */
const inp = "w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 placeholder-white/15 transition-colors";
const lbl = "text-[11px] font-semibold text-white/35 uppercase tracking-wider block mb-1.5";

const Field:React.FC<{ label:string; children:React.ReactNode; half?:boolean }> = ({label,children,half}) => (
  <div className={half ? '' : ''}>
    <label className={lbl}>{label}</label>
    {children}
  </div>
);

/* ─── Main component ───────────────────────────────────── */
const AdminCourses = () => {
  const [loading,       setLoading]       = useState(true);
  const [courses,       setCourses]       = useState<CourseRow[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseRow|null>(null);
  const [isNew,         setIsNew]         = useState(false);
  const [featuresText,  setFeaturesText]  = useState('');
  const [deliverablesText, setDeliverablesText] = useState('');
  const [kpiText,       setKpiText]       = useState('');
  const [subTab,        setSubTab]        = useState<'info'|'media'|'modules'|'pricing'>('info');
  const [modules,       setModules]       = useState<ModuleRow[]>([]);
  const [tab,           setTab]           = useState<'courses'|'promos'>('courses');
  const [promos,        setPromos]        = useState<PromoCode[]>([]);
  const [editingPromo,  setEditingPromo]  = useState<Partial<PromoCode>|null>(null);
  const [isNewPromo,    setIsNewPromo]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    loadData();
    return () => document.documentElement.classList.remove('dark');
  }, []);

  // Auth + admin role are enforced centrally by <RequireAdmin> in App.tsx.
  // This page only loads data — no redundant per-page guard (avoids double-guard redirects).
  const loadData = async () => {
    setLoading(false); fetchCourses(); fetchPromos();
  };

  const fetchCourses  = async () => { const { data } = await supabase.from('courses').select('*').order('sort_order'); setCourses((data as unknown as CourseRow[])||[]); };
  const fetchPromos   = async () => { const { data } = await supabase.from('promo_codes').select('*').order('created_at',{ ascending:false }); setPromos((data as unknown as PromoCode[])||[]); };
  const fetchModules  = async (cid:string) => { if (!cid) { setModules([]); return; } const { data } = await supabase.from('course_modules').select('*').eq('course_id',cid).order('sort_order'); setModules((data as unknown as ModuleRow[])||[]); };

  const startEdit = (c:CourseRow) => {
    const course = { ...c, gallery_image_urls:c.gallery_image_urls||[], kpi_notes:c.kpi_notes||[], deliverables:c.deliverables||[], features:c.features||[] };
    setEditingCourse(course);
    setFeaturesText(course.features.join('\n'));
    setDeliverablesText(course.deliverables.join('\n'));
    setKpiText(course.kpi_notes.map(k=>`${k.label}|${k.value}${k.note?'|'+k.note:''}`).join('\n'));
    setIsNew(false); setSubTab('info'); fetchModules(c.id);
  };

  const startNew = () => {
    setEditingCourse(emptyCourse(courses.length+1));
    setFeaturesText(''); setDeliverablesText(''); setKpiText('');
    setModules([]); setIsNew(true); setSubTab('info');
  };

  const parseKpi = (text:string) => text.split('\n').map(l=>l.trim()).filter(Boolean).map(line => {
    const [label,value,note] = line.split('|').map(s=>s?.trim()||''); return { label,value,note };
  });

  const handleSave = async () => {
    if (!editingCourse) return;
    const payload = {
      slug:editingCourse.slug, tag:editingCourse.tag, title:editingCourse.title,
      subtitle:editingCourse.subtitle, description:editingCourse.description,
      duration:editingCourse.duration, price:editingCourse.price,
      features:featuresText.split('\n').map(f=>f.trim()).filter(Boolean),
      color:editingCourse.color, sort_order:editingCourse.sort_order,
      is_active:editingCourse.is_active, learning_type:editingCourse.learning_type,
      max_slots:editingCourse.max_slots, stripe_price_id:editingCourse.stripe_price_id,
      status:editingCourse.status||'now_open', level:editingCourse.level,
      target_audience:editingCourse.target_audience, format_label:editingCourse.format_label,
      intro_video_url:editingCourse.intro_video_url, cover_image_url:editingCourse.cover_image_url,
      gallery_image_urls:editingCourse.gallery_image_urls||[],
      kpi_notes:parseKpi(kpiText),
      deliverables:deliverablesText.split('\n').map(f=>f.trim()).filter(Boolean),
      outcome_goal:editingCourse.outcome_goal, bloom_level:editingCourse.bloom_level,
    };
    if (!payload.slug || !payload.title) { toast({ title:'กรุณากรอก Slug และ Title', variant:'destructive' }); return; }
    let error;
    if (isNew) ({ error } = await supabase.from('courses').insert(payload as any));
    else       ({ error } = await supabase.from('courses').update(payload as any).eq('id',editingCourse.id));
    if (error) toast({ title:'Error', description:error.message, variant:'destructive' });
    else { toast({ title:'บันทึกสำเร็จ ✓' }); setEditingCourse(null); fetchCourses(); }
  };

  const handleDelete = async (id:string) => {
    if (!confirm('ต้องการลบหลักสูตรนี้?')) return;
    const { error } = await supabase.from('courses').delete().eq('id',id);
    if (error) toast({ title:'Error', description:error.message, variant:'destructive' });
    else { toast({ title:'ลบสำเร็จ' }); fetchCourses(); }
  };

  const uploadFile = async (file:File, prefix:string):Promise<string|null> => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error } = await supabase.storage.from('course-media').upload(path,file,{ upsert:false });
      if (error) { toast({ title:'Upload error', description:error.message, variant:'destructive' }); return null; }
      return supabase.storage.from('course-media').getPublicUrl(path).data.publicUrl;
    } finally { setUploading(false); }
  };

  const onUploadCover   = async (e:React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f||!editingCourse)return; const url=await uploadFile(f,'covers'); if(url) setEditingCourse({...editingCourse,cover_image_url:url}); };
  const onUploadIntro   = async (e:React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f||!editingCourse)return; const url=await uploadFile(f,'intros'); if(url) setEditingCourse({...editingCourse,intro_video_url:url}); };
  const onUploadGallery = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const files=e.target.files; if(!files||!editingCourse)return;
    const urls:string[]=[]; for(const f of Array.from(files)){const u=await uploadFile(f,'gallery');if(u)urls.push(u);}
    setEditingCourse({...editingCourse,gallery_image_urls:[...(editingCourse.gallery_image_urls||[]),...urls]});
  };
  const removeGallery = (url:string) => { if(!editingCourse)return; setEditingCourse({...editingCourse,gallery_image_urls:editingCourse.gallery_image_urls.filter(u=>u!==url)}); };

  /* Module handlers */
  const addModule = async () => {
    if (!editingCourse?.id) { toast({ title:'บันทึกหลักสูตรก่อนเพิ่มโมดูล', variant:'destructive' }); return; }
    const next = modules.length+1;
    const { error } = await supabase.from('course_modules').insert({ course_id:editingCourse.id, code:`M${String(next).padStart(2,'0')}`, name:'โมดูลใหม่', sort_order:next } as any);
    if (error) toast({ title:'Error', description:error.message, variant:'destructive' });
    else fetchModules(editingCourse.id);
  };
  const updateModule = (m:ModuleRow, patch:Partial<ModuleRow>) => setModules(modules.map(x=>x.id===m.id?{...x,...patch}:x));
  const saveModule   = async (m:ModuleRow) => {
    const { error } = await supabase.from('course_modules').update({ code:m.code, name:m.name, summary:m.summary, duration_label:m.duration_label, vod_url:m.vod_url, has_quiz:m.has_quiz, has_assignment:m.has_assignment, sort_order:m.sort_order } as any).eq('id',m.id);
    if (error) toast({ title:'Error', description:error.message, variant:'destructive' });
    else toast({ title:'บันทึกโมดูล ✓' });
  };
  const deleteModule = async (id:string) => {
    if (!confirm('ลบโมดูลนี้?')) return;
    const { error } = await supabase.from('course_modules').delete().eq('id',id);
    if (error) toast({ title:'Error', description:error.message, variant:'destructive' });
    else if (editingCourse) fetchModules(editingCourse.id);
  };
  const moveModule = async (m:ModuleRow, dir:-1|1) => {
    const sorted = [...modules].sort((a,b)=>a.sort_order-b.sort_order);
    const idx = sorted.findIndex(x=>x.id===m.id); const sw = sorted[idx+dir]; if(!sw)return;
    await supabase.from('course_modules').update({ sort_order:sw.sort_order } as any).eq('id',m.id);
    await supabase.from('course_modules').update({ sort_order:m.sort_order } as any).eq('id',sw.id);
    if (editingCourse) fetchModules(editingCourse.id);
  };

  /* Promo handlers */
  const startNewPromo   = () => { setEditingPromo({ code:'', course_id:'', discount_type:'percent', discount_value:0, max_uses:1, is_active:true }); setIsNewPromo(true); };
  const handleSavePromo = async () => {
    if (!editingPromo || !editingPromo.code || !editingPromo.course_id) { toast({ title:'กรุณากรอกรหัสและเลือกหลักสูตร', variant:'destructive' }); return; }
    const payload = { code:editingPromo.code!.toUpperCase(), course_id:editingPromo.course_id!, discount_type:editingPromo.discount_type||'percent', discount_value:editingPromo.discount_value||0, max_uses:editingPromo.max_uses||1, is_active:editingPromo.is_active??true };
    let error;
    if (isNewPromo) ({ error } = await supabase.from('promo_codes').insert(payload as any));
    else ({ error } = await supabase.from('promo_codes').update(payload as any).eq('id',editingPromo.id));
    if (error) toast({ title:'Error', description:error.message, variant:'destructive' });
    else { toast({ title:'บันทึกโปรโมชั่น ✓' }); setEditingPromo(null); fetchPromos(); }
  };
  const handleDeletePromo = async (id:string) => {
    if (!confirm('ต้องการลบโปรโมชั่นนี้?')) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id',id);
    if (error) toast({ title:'Error', description:error.message, variant:'destructive' });
    else { toast({ title:'ลบสำเร็จ' }); fetchPromos(); }
  };

  if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" /></div>;

  const ec = editingCourse;
  const colorHex = COLOR_OPTIONS.find(c=>c.value===ec?.color)?.hex || '#888';

  /* ─── RENDER ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <SEOHead title="Admin — จัดการหลักสูตร · CREATR365" description="Course management admin" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-white/30 hover:text-white/60 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-widest">Admin Panel</p>
            <h1 className="text-base font-black text-white tracking-tight">CREATR365</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/articles" className="text-xs text-white/30 hover:text-white/60 transition-colors hidden sm:block">บทความ</Link>
          <Link to="/admin/payments" className="text-xs text-white/30 hover:text-white/60 transition-colors hidden sm:block">การชำระเงิน</Link>
          <Link to="/admin/assignments" className="text-xs text-white/30 hover:text-white/60 transition-colors hidden sm:block">งานที่ส่ง</Link>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/auth'))}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/12 text-white/30 hover:text-white/60 hover:border-white/25 transition-all">
            ออกจากระบบ
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 p-1 rounded-xl w-fit mb-8">
          {[['courses','📚 หลักสูตร'],['promos','🎟️ โปรโมชั่น']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k as any)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab===k ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ══ COURSES TAB ══════════════════════════════════ */}
        {tab === 'courses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white/30 text-xs uppercase tracking-widest">{courses.length} หลักสูตร</p>
              <button onClick={startNew}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all"
                style={{ background:'#CC0033' }}>
                <Plus className="w-4 h-4" /> เพิ่มหลักสูตร
              </button>
            </div>

            {/* Course list */}
            <div className="rounded-2xl border border-white/8 overflow-hidden">
              {courses.length === 0 ? (
                <div className="py-16 text-center text-white/20 text-sm">ยังไม่มีหลักสูตร</div>
              ) : courses.map(c => {
                const hex = COLOR_OPTIONS.find(x=>x.value===c.color)?.hex||'#888';
                return (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 bg-[#0D0D0D] hover:bg-[#131313] transition-colors group">
                    {/* Color dot */}
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:hex }} />
                    {/* Cover thumb */}
                    {c.cover_image_url ? (
                      <img src={c.cover_image_url} alt="" className="w-12 h-8 object-cover rounded-md opacity-70 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-8 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] font-black" style={{ background:hex+'15', color:hex }}>{c.tag?.slice(0,2)||'?'}</div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm truncate">{c.title}</p>
                        {!c.is_active && <span className="text-[9px] px-1.5 py-0.5 bg-white/8 text-white/30 rounded">Hidden</span>}
                        <span className="text-[9px] px-1.5 py-0.5 border border-white/10 text-white/30 rounded uppercase">{c.status}</span>
                      </div>
                      <p className="text-white/25 text-xs mt-0.5 font-mono">/course/{c.slug}</p>
                    </div>
                    <p className="text-white/50 text-sm font-semibold flex-shrink-0 hidden sm:block">{c.price}</p>
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a href={`/course/${c.slug}`} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg text-white/20 hover:text-white/50 transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={()=>startEdit(c)} className="p-2 rounded-lg text-white/20 hover:text-[#D4A843] transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={()=>handleDelete(c.id)} className="p-2 rounded-lg text-white/20 hover:text-[#CC0033] transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ PROMOS TAB ═══════════════════════════════════ */}
        {tab === 'promos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white/30 text-xs uppercase tracking-widest">{promos.length} โปรโมชั่น</p>
              <button onClick={startNewPromo}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background:'#CC0033' }}>
                <Plus className="w-4 h-4" /> เพิ่มโปรโมชั่น
              </button>
            </div>

            {editingPromo && (
              <div className="rounded-2xl border border-white/10 bg-[#111] p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-semibold">{isNewPromo?'โปรโมชั่นใหม่':'แก้ไขโปรโมชั่น'}</h3>
                  <button onClick={()=>setEditingPromo(null)}><X className="w-4 h-4 text-white/30" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="รหัสส่วนลด">
                    <input className={inp} value={editingPromo.code||''} onChange={e=>setEditingPromo({...editingPromo,code:e.target.value.toUpperCase()})} placeholder="EARLYBIRD50" />
                  </Field>
                  <Field label="หลักสูตร">
                    <select className={inp} value={editingPromo.course_id||''} onChange={e=>setEditingPromo({...editingPromo,course_id:e.target.value})}>
                      <option value="">— เลือกหลักสูตร —</option>
                      {courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </Field>
                  <Field label="ประเภทส่วนลด">
                    <select className={inp} value={editingPromo.discount_type||'percent'} onChange={e=>setEditingPromo({...editingPromo,discount_type:e.target.value})}>
                      <option value="percent">เปอร์เซ็นต์ (%)</option>
                      <option value="fixed">จำนวนเงิน (฿)</option>
                    </select>
                  </Field>
                  <Field label="มูลค่าส่วนลด">
                    <input type="number" className={inp} value={editingPromo.discount_value||0} onChange={e=>setEditingPromo({...editingPromo,discount_value:parseFloat(e.target.value)||0})} />
                  </Field>
                  <Field label="จำนวนสิทธิ์สูงสุด">
                    <input type="number" className={inp} value={editingPromo.max_uses||1} onChange={e=>setEditingPromo({...editingPromo,max_uses:parseInt(e.target.value)||1})} />
                  </Field>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={()=>setEditingPromo({...editingPromo,is_active:!editingPromo.is_active})}
                    className={`relative w-10 h-5 rounded-full transition-colors ${editingPromo.is_active?'bg-[#34A853]':'bg-white/15'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editingPromo.is_active?'translate-x-5':'translate-x-0.5'}`} />
                  </div>
                  <span className="text-white/50 text-sm">เปิดใช้งาน</span>
                </label>
                <button onClick={handleSavePromo}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
                  style={{ background:'#CC0033' }}>
                  <Save className="w-4 h-4" /> บันทึก
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-white/8 overflow-hidden">
              {promos.length === 0 ? (
                <div className="py-12 text-center text-white/20 text-sm">ยังไม่มีโปรโมชั่น</div>
              ) : promos.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 bg-[#0D0D0D]">
                  <code className="text-[#D4A843] font-black text-sm tracking-wider flex-shrink-0">{p.code}</code>
                  <div className="flex-1 text-white/40 text-xs">{courses.find(c=>c.id===p.course_id)?.title||'—'}</div>
                  <span className="text-white/60 text-sm font-semibold">{p.discount_value}{p.discount_type==='percent'?'%':'฿'} off</span>
                  <span className="text-white/25 text-xs">{p.used_count}/{p.max_uses} ใช้แล้ว</span>
                  <span className={`text-[10px] font-bold ${p.is_active?'text-[#34A853]':'text-white/20'}`}>{p.is_active?'●':'○'}</span>
                  <div className="flex gap-1">
                    <button onClick={()=>{setEditingPromo(p);setIsNewPromo(false);}} className="p-1.5 text-white/25 hover:text-[#D4A843] transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={()=>handleDeletePromo(p.id)} className="p-1.5 text-white/25 hover:text-[#CC0033] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ COURSE EDITOR OVERLAY ════════════════════════ */}
      {ec && (
        <div className="fixed inset-0 z-50 flex" style={{ background:'rgba(0,0,0,0.85)' }}>
          <div className="ml-auto w-full max-w-3xl bg-[#0D0D0D] border-l border-white/8 flex flex-col h-full overflow-hidden">

            {/* Editor header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: colorHex }} />
                <h2 className="text-white font-semibold text-sm">{isNew ? '+ หลักสูตรใหม่' : ec.title || 'แก้ไขหลักสูตร'}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all"
                  style={{ background:'#CC0033' }}>
                  <Save className="w-3.5 h-3.5" /> บันทึก
                </button>
                <button onClick={()=>setEditingCourse(null)} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-tabs — Teachable/Kajabi style */}
            <div className="flex border-b border-white/8 flex-shrink-0 px-6">
              {[['info','ข้อมูล'],['media','สื่อ'],['modules','โมดูล'],['pricing','ราคา & Stripe']].map(([k,l])=>(
                <button key={k} onClick={()=>setSubTab(k as any)}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-px transition-all ${subTab===k?'border-[#CC0033] text-white':'border-transparent text-white/30 hover:text-white/55'}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Editor body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

              {/* ── INFO TAB ─────────────────────────────── */}
              {subTab === 'info' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Slug (URL) *">
                      <input className={inp} value={ec.slug} onChange={e=>setEditingCourse({...ec,slug:e.target.value})} placeholder="signal" />
                    </Field>
                    <Field label="Tag / Code">
                      <input className={inp} value={ec.tag} onChange={e=>setEditingCourse({...ec,tag:e.target.value})} placeholder="SIGNAL" />
                    </Field>
                    <Field label="ชื่อหลักสูตร *">
                      <input className={inp} value={ec.title} onChange={e=>setEditingCourse({...ec,title:e.target.value})} placeholder="The Conversion Host..." />
                    </Field>
                    <Field label="Subtitle">
                      <input className={inp} value={ec.subtitle} onChange={e=>setEditingCourse({...ec,subtitle:e.target.value})} />
                    </Field>
                    <Field label="Level">
                      <select className={inp} value={ec.level||''} onChange={e=>setEditingCourse({...ec,level:e.target.value||null})}>
                        <option value="">— ไม่ระบุ —</option>
                        {LEVEL_OPTIONS.map(l=><option key={l} value={l}>{l}</option>)}
                      </select>
                    </Field>
                    <Field label="Format Label">
                      <input className={inp} value={ec.format_label||''} onChange={e=>setEditingCourse({...ec,format_label:e.target.value||null})} placeholder="VOD Self-paced" />
                    </Field>
                    <Field label="ระยะเวลา">
                      <input className={inp} value={ec.duration} onChange={e=>setEditingCourse({...ec,duration:e.target.value})} placeholder="7 ชั่วโมง" />
                    </Field>
                    <Field label="ประเภทการเรียน">
                      <select className={inp} value={ec.learning_type} onChange={e=>setEditingCourse({...ec,learning_type:e.target.value})}>
                        {LEARNING_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </Field>
                    <Field label="สถานะ">
                      <select className={inp} value={ec.status||'now_open'} onChange={e=>setEditingCourse({...ec,status:e.target.value})}>
                        {STATUS_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field>
                    <Field label="ลำดับ">
                      <input type="number" className={inp} value={ec.sort_order} onChange={e=>setEditingCourse({...ec,sort_order:parseInt(e.target.value)||0})} />
                    </Field>
                    <Field label="จำนวนที่นั่งสูงสุด">
                      <input type="number" className={inp} value={ec.max_slots||''} onChange={e=>setEditingCourse({...ec,max_slots:parseInt(e.target.value)||null})} placeholder="ว่างคือไม่จำกัด" />
                    </Field>
                    <Field label="Bloom Level">
                      <input className={inp} value={ec.bloom_level||''} onChange={e=>setEditingCourse({...ec,bloom_level:e.target.value||null})} placeholder="Remember → Apply" />
                    </Field>
                  </div>

                  {/* Color picker */}
                  <div>
                    <label className={lbl}>สี Accent</label>
                    <div className="flex gap-3">
                      {COLOR_OPTIONS.map(c=>(
                        <button key={c.value} onClick={()=>setEditingCourse({...ec,color:c.value})}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${ec.color===c.value?'scale-125':'border-transparent opacity-50'}`}
                          style={{ background:c.hex, borderColor:ec.color===c.value?c.hex:'transparent' }} />
                      ))}
                    </div>
                  </div>

                  <Field label="คำอธิบายหลักสูตร">
                    <textarea className={`${inp} resize-y`} rows={3} value={ec.description} onChange={e=>setEditingCourse({...ec,description:e.target.value})} />
                  </Field>
                  <Field label="Outcome Goal">
                    <textarea className={`${inp} resize-none`} rows={2} value={ec.outcome_goal||''} onChange={e=>setEditingCourse({...ec,outcome_goal:e.target.value||null})} />
                  </Field>
                  <Field label="Target Audience">
                    <textarea className={`${inp} resize-none`} rows={2} value={ec.target_audience||''} onChange={e=>setEditingCourse({...ec,target_audience:e.target.value||null})} />
                  </Field>
                  <Field label="จุดเด่น (บรรทัดละ 1 รายการ)">
                    <textarea className={`${inp} font-mono resize-y`} rows={4} value={featuresText} onChange={e=>setFeaturesText(e.target.value)} placeholder={"สร้าง Hook ที่หยุดคนดู\nเพิ่ม Watch Time 30%+"} />
                  </Field>
                  <Field label="Deliverables / สิ่งที่ผู้เรียนได้รับ (บรรทัดละ 1)">
                    <textarea className={`${inp} font-mono resize-y`} rows={4} value={deliverablesText} onChange={e=>setDeliverablesText(e.target.value)} placeholder={"Certificate of Completion\nHook Template Sheet\nKPI Dashboard"} />
                  </Field>
                  <Field label="KPI Notes (รูปแบบ: label|value|note — บรรทัดละ 1)">
                    <textarea className={`${inp} font-mono resize-y`} rows={3} value={kpiText} onChange={e=>setKpiText(e.target.value)} placeholder={"Watch Time|≥70%|ค่ามาตรฐาน\nNPS|≥8/10"} />
                  </Field>

                  {/* Active toggle */}
                  <label className="flex items-center gap-3 cursor-pointer py-2">
                    <div onClick={()=>setEditingCourse({...ec,is_active:!ec.is_active})}
                      className={`relative w-10 h-5 rounded-full transition-colors ${ec.is_active?'bg-[#34A853]':'bg-white/15'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${ec.is_active?'translate-x-5':'translate-x-0.5'}`} />
                    </div>
                    <span className="text-white/50 text-sm">{ec.is_active?'เผยแพร่แล้ว (Active)':'ซ่อนอยู่ (Hidden)'}</span>
                  </label>
                </>
              )}

              {/* ── MEDIA TAB ────────────────────────────── */}
              {subTab === 'media' && (
                <div className="space-y-6">
                  <div>
                    <label className={lbl}>Cover Image URL</label>
                    <input className={`${inp} mb-2`} value={ec.cover_image_url||''} onChange={e=>setEditingCourse({...ec,cover_image_url:e.target.value||null})} placeholder="https://" />
                    {ec.cover_image_url && <img src={ec.cover_image_url} alt="" className="w-full h-40 object-cover rounded-xl opacity-70 mb-2" />}
                    <label className="flex items-center gap-2 text-xs text-white/30 cursor-pointer mt-2">
                      <span className="px-3 py-1.5 border border-white/15 rounded-lg hover:border-white/30 transition-colors">อัปโหลดไฟล์</span>
                      <input type="file" accept="image/*" className="hidden" onChange={onUploadCover} />
                      {uploading && <span className="text-white/30">กำลังอัปโหลด...</span>}
                    </label>
                  </div>

                  <div>
                    <label className={lbl}>Intro Video URL</label>
                    <input className={`${inp} mb-2`} value={ec.intro_video_url||''} onChange={e=>setEditingCourse({...ec,intro_video_url:e.target.value||null})} placeholder="https://youtube.com/..." />
                    <label className="flex items-center gap-2 text-xs text-white/30 cursor-pointer">
                      <span className="px-3 py-1.5 border border-white/15 rounded-lg hover:border-white/30 transition-colors">อัปโหลดวิดีโอ</span>
                      <input type="file" accept="video/*" className="hidden" onChange={onUploadIntro} />
                    </label>
                  </div>

                  <div>
                    <label className={lbl}>Gallery Images</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {(ec.gallery_image_urls||[]).map(url=>(
                        <div key={url} className="relative group">
                          <img src={url} alt="" className="w-full h-20 object-cover rounded-lg opacity-70" />
                          <button onClick={()=>removeGallery(url)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#CC0033] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-white/30 cursor-pointer">
                      <span className="px-3 py-1.5 border border-white/15 rounded-lg hover:border-white/30 transition-colors">+ เพิ่มรูป Gallery</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={onUploadGallery} />
                    </label>
                  </div>
                </div>
              )}

              {/* ── MODULES TAB (Curriculum Builder) ─────── */}
              {subTab === 'modules' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-semibold text-sm">Curriculum</p>
                      <p className="text-white/25 text-xs mt-0.5">{modules.length} โมดูล · แก้ไขและบันทึกแต่ละโมดูลแยกกัน</p>
                    </div>
                    <button onClick={addModule}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all">
                      <Plus className="w-3.5 h-3.5" /> เพิ่มโมดูล
                    </button>
                  </div>

                  {modules.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl text-white/20 text-sm">
                      ยังไม่มีโมดูล — กด "+ เพิ่มโมดูล" เพื่อเริ่ม
                    </div>
                  ) : modules.sort((a,b)=>a.sort_order-b.sort_order).map((m, idx) => (
                    <div key={m.id} className="border border-white/8 rounded-xl bg-[#111] overflow-hidden">
                      {/* Module header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={()=>moveModule(m,-1)} disabled={idx===0} className="p-0.5 text-white/20 hover:text-white/50 disabled:opacity-0 transition-all"><ArrowUp className="w-3 h-3" /></button>
                          <button onClick={()=>moveModule(m,1)} disabled={idx===modules.length-1} className="p-0.5 text-white/20 hover:text-white/50 disabled:opacity-0 transition-all"><ArrowDown className="w-3 h-3" /></button>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-black text-white/40">{String(idx+1).padStart(2,'0')}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input className="bg-transparent text-white text-sm font-semibold focus:outline-none placeholder-white/20 border-b border-transparent focus:border-white/20 pb-0.5 transition-colors"
                            value={m.code} onChange={e=>updateModule(m,{code:e.target.value})} placeholder="M01" />
                          <input className="bg-transparent text-white/70 text-sm focus:outline-none placeholder-white/20 border-b border-transparent focus:border-white/20 pb-0.5 transition-colors"
                            value={m.name} onChange={e=>updateModule(m,{name:e.target.value})} placeholder="ชื่อโมดูล" />
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={()=>saveModule(m)} className="p-1.5 text-white/30 hover:text-[#34A853] transition-colors" title="บันทึก"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={()=>deleteModule(m.id)} className="p-1.5 text-white/30 hover:text-[#CC0033] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* Module detail */}
                      <div className="px-4 py-3 space-y-2">
                        <textarea className={`${inp} resize-none text-xs`} rows={2}
                          value={m.summary} onChange={e=>updateModule(m,{summary:e.target.value})}
                          placeholder="สรุปเนื้อหาโมดูลนี้..." />
                        <div className="grid grid-cols-2 gap-2">
                          <input className={`${inp} text-xs`} value={m.vod_url||''} onChange={e=>updateModule(m,{vod_url:e.target.value||null})} placeholder="VOD URL (YouTube/Storage)" />
                          <input className={`${inp} text-xs`} value={m.duration_label||''} onChange={e=>updateModule(m,{duration_label:e.target.value})} placeholder="45 นาที" />
                        </div>
                        <div className="flex gap-4">
                          {[['has_quiz','📝 มี Quiz'],['has_assignment','🎥 มีงานส่ง']].map(([k,l])=>(
                            <label key={k} className="flex items-center gap-2 cursor-pointer text-xs text-white/40">
                              <div onClick={()=>updateModule(m,{[k]:!m[k as keyof ModuleRow]} as any)}
                                className={`w-8 h-4 rounded-full transition-colors ${(m as any)[k]?'bg-[#34A853]':'bg-white/10'} relative`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${(m as any)[k]?'translate-x-4':'translate-x-0.5'}`} />
                              </div>
                              {l}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── PRICING TAB ──────────────────────────── */}
              {subTab === 'pricing' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="ราคาปกติ">
                      <input className={inp} value={ec.price} onChange={e=>setEditingCourse({...ec,price:e.target.value})} placeholder="3,990.-" />
                    </Field>
                    <Field label="Stripe Price ID">
                      <input className={`${inp} font-mono text-xs`} value={ec.stripe_price_id||''} onChange={e=>setEditingCourse({...ec,stripe_price_id:e.target.value||null})} placeholder="price_xxx" />
                    </Field>
                  </div>

                  <div className="p-4 rounded-xl border border-white/8 bg-white/2">
                    <p className="text-white/30 text-xs mb-3">💡 Promo codes สำหรับหลักสูตรนี้</p>
                    {promos.filter(p=>p.course_id===ec.id).length === 0 ? (
                      <p className="text-white/20 text-xs">ยังไม่มีโปรโมชั่น — ไปที่แท็บ "โปรโมชั่น" เพื่อเพิ่ม</p>
                    ) : promos.filter(p=>p.course_id===ec.id).map(p=>(
                      <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <code className="text-[#D4A843] font-bold text-xs">{p.code}</code>
                        <span className="text-white/40 text-xs">{p.discount_value}{p.discount_type==='percent'?'%':'฿'} off</span>
                        <span className="text-white/20 text-xs">{p.used_count}/{p.max_uses}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer save */}
            <div className="border-t border-white/8 px-6 py-4 flex justify-between items-center flex-shrink-0 bg-[#0D0D0D]">
              <p className="text-white/20 text-xs">{isNew?'สร้างหลักสูตรใหม่':'แก้ไข: '+(ec.title||'—')}</p>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background:'#CC0033' }}>
                <Save className="w-4 h-4" /> บันทึกหลักสูตร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
