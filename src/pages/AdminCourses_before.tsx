import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, GripVertical, Ticket, Upload, ArrowUp, ArrowDown } from 'lucide-react';

interface CourseRow {
  id: string;
  slug: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  price: string;
  features: string[];
  color: string;
  sort_order: number;
  is_active: boolean;
  learning_type: string;
  max_slots: number | null;
  stripe_price_id: string | null;
  status: string;
  level: string | null;
  target_audience: string | null;
  format_label: string | null;
  intro_video_url: string | null;
  cover_image_url: string | null;
  gallery_image_urls: string[];
  kpi_notes: Array<{ label: string; value: string; note?: string }>;
  deliverables: string[];
  outcome_goal: string | null;
  bloom_level: string | null;
}

interface ModuleRow {
  id: string;
  course_id: string;
  code: string;
  name: string;
  summary: string;
  duration_label: string;
  vod_url: string | null;
  has_quiz: boolean;
  has_assignment: boolean;
  sort_order: number;
  phase: 'pre' | 'main' | 'post';
  is_test: boolean;
}

const PHASE_OPTIONS = [
  { value: 'pre',  label: 'Pre-Test (ก่อนเรียน)' },
  { value: 'main', label: 'เนื้อหาหลัก' },
  { value: 'post', label: 'Post-Test (หลังเรียน)' },
];

interface PromoCode {
  id: string;
  course_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
}

const COLOR_OPTIONS = [
  { value: 'blue', label: 'น้ำเงิน', hex: '#4285F4' },
  { value: 'red', label: 'แดง', hex: '#CC0033' },
  { value: 'yellow', label: 'Gold', hex: '#FFD700' },
  { value: 'green', label: 'เขียว', hex: '#34A853' },
  { value: 'black', label: 'ดำ', hex: '#1A1A1A' },
];

const LEARNING_TYPES = [
  { value: 'offline', label: 'Offline (เรียนในห้อง)' },
  { value: 'online', label: 'Online (E-Learning)' },
  { value: 'hybrid', label: 'Hybrid (ผสมผสาน)' },
];

const STATUS_OPTIONS = [
  { value: 'now_open',    label: 'Now Open',    badge: 'bg-google-green text-white' },
  { value: 'coming_soon', label: 'Coming Soon', badge: 'bg-google-yellow text-foreground' },
  { value: 'new_update',  label: 'New Update',  badge: 'bg-google-blue text-white' },
  { value: 'none',        label: 'ไม่แสดง',       badge: 'bg-muted text-muted-foreground' },
];

const LEVEL_OPTIONS = ['STARTER', 'DEVELOPING', 'COMPETENT', 'PROFICIENT', 'MASTER'];

const emptyCourse = (sort: number): CourseRow => ({
  id: '', slug: '', tag: '', title: '', subtitle: '', description: '',
  duration: '', price: '', features: [], color: 'blue',
  sort_order: sort, is_active: true,
  learning_type: 'offline', max_slots: null, stripe_price_id: null,
  status: 'now_open',
  level: null, target_audience: null, format_label: null,
  intro_video_url: null, cover_image_url: null, gallery_image_urls: [],
  kpi_notes: [], deliverables: [], outcome_goal: null, bloom_level: null,
});

const AdminCourses = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const [deliverablesText, setDeliverablesText] = useState('');
  const [kpiText, setKpiText] = useState('');
  const [subTab, setSubTab] = useState<'info' | 'media' | 'modules' | 'pricing'>('info');
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [tab, setTab] = useState<'courses' | 'promos'>('courses');
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoCode> | null>(null);
  const [isNewPromo, setIsNewPromo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { checkAuthAndLoad(); }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }
    const { data: roles } = await supabase
      .from('user_roles').select('role')
      .eq('user_id', session.user.id).eq('role', 'admin').single();
    if (!roles) { toast({ title: 'ไม่มีสิทธิ์เข้าถึง', variant: 'destructive' }); navigate('/'); return; }
    setLoading(false);
    fetchCourses();
    fetchPromos();
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('sort_order');
    setCourses((data as unknown as CourseRow[]) || []);
  };

  const fetchPromos = async () => {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setPromos((data as unknown as PromoCode[]) || []);
  };

  const fetchModules = async (courseId: string) => {
    if (!courseId) { setModules([]); return; }
    const { data } = await supabase.from('course_modules').select('*').eq('course_id', courseId).order('sort_order');
    setModules((data as unknown as ModuleRow[]) || []);
  };

  const startEdit = (course: CourseRow) => {
    const c: CourseRow = {
      ...course,
      gallery_image_urls: course.gallery_image_urls || [],
      kpi_notes: course.kpi_notes || [],
      deliverables: course.deliverables || [],
      features: course.features || [],
    };
    setEditingCourse(c);
    setFeaturesText(c.features.join('\n'));
    setDeliverablesText(c.deliverables.join('\n'));
    setKpiText(c.kpi_notes.map(k => `${k.label}|${k.value}${k.note ? '|' + k.note : ''}`).join('\n'));
    setIsNew(false);
    setSubTab('info');
    fetchModules(course.id);
  };

  const startNew = () => {
    setEditingCourse(emptyCourse(courses.length + 1));
    setFeaturesText('');
    setDeliverablesText('');
    setKpiText('');
    setModules([]);
    setIsNew(true);
    setSubTab('info');
  };

  const parseKpi = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const [label, value, note] = line.split('|').map(s => s?.trim() || '');
    return { label, value, note };
  });

  const handleSave = async () => {
    if (!editingCourse) return;
    const features = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const deliverables = deliverablesText.split('\n').map(f => f.trim()).filter(Boolean);
    const kpi_notes = parseKpi(kpiText);
    const payload = {
      slug: editingCourse.slug, tag: editingCourse.tag, title: editingCourse.title,
      subtitle: editingCourse.subtitle, description: editingCourse.description,
      duration: editingCourse.duration, price: editingCourse.price, features,
      color: editingCourse.color, sort_order: editingCourse.sort_order,
      is_active: editingCourse.is_active, learning_type: editingCourse.learning_type,
      max_slots: editingCourse.max_slots, stripe_price_id: editingCourse.stripe_price_id,
      status: editingCourse.status || 'now_open',
      level: editingCourse.level, target_audience: editingCourse.target_audience,
      format_label: editingCourse.format_label, intro_video_url: editingCourse.intro_video_url,
      cover_image_url: editingCourse.cover_image_url,
      gallery_image_urls: editingCourse.gallery_image_urls || [],
      kpi_notes, deliverables,
      outcome_goal: editingCourse.outcome_goal, bloom_level: editingCourse.bloom_level,
    };
    if (!payload.slug || !payload.title) {
      toast({ title: 'กรุณากรอก Slug และ Title', variant: 'destructive' }); return;
    }
    let error;
    if (isNew) {
      ({ error } = await supabase.from('courses').insert(payload as any));
    } else {
      ({ error } = await supabase.from('courses').update(payload as any).eq('id', editingCourse.id));
    }
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'บันทึกสำเร็จ' }); setEditingCourse(null); fetchCourses(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบหลักสูตรนี้?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'ลบสำเร็จ' }); fetchCourses(); }
  };

  // Media upload
  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('course-media').upload(path, file, { upsert: false });
      if (error) { toast({ title: 'Upload error', description: error.message, variant: 'destructive' }); return null; }
      const { data } = supabase.storage.from('course-media').getPublicUrl(path);
      return data.publicUrl;
    } finally { setUploading(false); }
  };

  const onUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingCourse) return;
    const url = await uploadFile(f, 'covers');
    if (url) setEditingCourse({ ...editingCourse, cover_image_url: url });
  };

  const onUploadIntro = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingCourse) return;
    const url = await uploadFile(f, 'intros');
    if (url) setEditingCourse({ ...editingCourse, intro_video_url: url });
  };

  const onUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || !editingCourse) return;
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const u = await uploadFile(f, 'gallery'); if (u) urls.push(u);
    }
    setEditingCourse({ ...editingCourse, gallery_image_urls: [...(editingCourse.gallery_image_urls || []), ...urls] });
  };

  const removeGallery = (url: string) => {
    if (!editingCourse) return;
    setEditingCourse({ ...editingCourse, gallery_image_urls: editingCourse.gallery_image_urls.filter(u => u !== url) });
  };

  // Modules
  const addModule = async () => {
    if (!editingCourse?.id) { toast({ title: 'กรุณาบันทึกหลักสูตรก่อนเพิ่มโมดูล', variant: 'destructive' }); return; }
    const next = modules.length + 1;
    const { error } = await supabase.from('course_modules').insert({
      course_id: editingCourse.id, code: `M${String(next).padStart(2, '0')}`,
      name: 'โมดูลใหม่', sort_order: next,
    } as any);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else fetchModules(editingCourse.id);
  };

  const updateModule = async (m: ModuleRow, patch: Partial<ModuleRow>) => {
    setModules(modules.map(x => x.id === m.id ? { ...x, ...patch } : x));
  };

  const saveModule = async (m: ModuleRow) => {
    const { error } = await supabase.from('course_modules').update({
      code: m.code, name: m.name, summary: m.summary, duration_label: m.duration_label,
      vod_url: m.vod_url, has_quiz: m.has_quiz, has_assignment: m.has_assignment,
      sort_order: m.sort_order, phase: m.phase, is_test: m.is_test,
    } as any).eq('id', m.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'บันทึกโมดูลแล้ว' });
  };

  const deleteModule = async (id: string) => {
    if (!confirm('ลบโมดูลนี้?')) return;
    const { error } = await supabase.from('course_modules').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else if (editingCourse) fetchModules(editingCourse.id);
  };

  const moveModule = async (m: ModuleRow, dir: -1 | 1) => {
    const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(x => x.id === m.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    await supabase.from('course_modules').update({ sort_order: swapWith.sort_order } as any).eq('id', m.id);
    await supabase.from('course_modules').update({ sort_order: m.sort_order } as any).eq('id', swapWith.id);
    if (editingCourse) fetchModules(editingCourse.id);
  };

  // Promo handlers
  const startNewPromo = () => {
    setEditingPromo({ code: '', course_id: '', discount_type: 'percent', discount_value: 0, max_uses: 1, is_active: true });
    setIsNewPromo(true);
  };

  const handleSavePromo = async () => {
    if (!editingPromo) return;
    if (!editingPromo.code || !editingPromo.course_id) {
      toast({ title: 'กรุณากรอกรหัสและเลือกหลักสูตร', variant: 'destructive' }); return;
    }
    const payload = {
      code: editingPromo.code!.toUpperCase(),
      course_id: editingPromo.course_id,
      discount_type: editingPromo.discount_type || 'percent',
      discount_value: editingPromo.discount_value || 0,
      max_uses: editingPromo.max_uses || 1,
      is_active: editingPromo.is_active ?? true,
    };
    let error;
    if (isNewPromo) {
      ({ error } = await supabase.from('promo_codes').insert(payload as any));
    } else {
      ({ error } = await supabase.from('promo_codes').update(payload as any).eq('id', editingPromo.id));
    }
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'บันทึกโปรโมชั่นสำเร็จ' }); setEditingPromo(null); fetchPromos(); }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('ต้องการลบโปรโมชั่นนี้?')) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'ลบสำเร็จ' }); fetchPromos(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const ec = editingCourse;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <SEOHead title="จัดการหลักสูตร - Admin" description="Admin course management" />
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> หน้าหลัก
            </Button>
            <h1 className="text-2xl font-bold">จัดการหลักสูตร</h1>
          </div>
          <Button onClick={() => supabase.auth.signOut().then(() => navigate('/auth'))} variant="outline" size="sm">ออกจากระบบ</Button>
        </div>

        {/* Admin navigation */}
        <div className="flex gap-1 flex-wrap mb-6 border-b pb-4">
          <Button variant="default" size="sm">หลักสูตร (นี่คือ)</Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/assignments')}>รายการงานส่ง</Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/payments')}>การชำระเงิน</Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>Event CMS</Button>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant={tab === 'courses' ? 'default' : 'outline'} size="sm" onClick={() => setTab('courses')}>หลักสูตร</Button>
          <Button variant={tab === 'promos' ? 'default' : 'outline'} size="sm" onClick={() => setTab('promos')}>
            <Ticket className="w-4 h-4 mr-1" /> โปรโมชั่น / ส่วนลด
          </Button>
        </div>

        {tab === 'courses' && (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={startNew} size="sm"><Plus className="w-4 h-4 mr-1" /> เพิ่มหลักสูตร</Button>
            </div>

            {ec && (
              <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">{isNew ? 'เพิ่มหลักสูตรใหม่' : `แก้ไข: ${ec.title}`}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setEditingCourse(null)}><X className="w-4 h-4" /></Button>
                </div>

                {/* Sub tabs */}
                <div className="flex gap-1 border-b">
                  {([
                    ['info', 'ข้อมูลหลัก'],
                    ['media', 'สื่อ (Cover/Intro/Gallery)'],
                    ['modules', 'โมดูล'],
                    ['pricing', 'ราคา & Stripe'],
                  ] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setSubTab(k)}
                      className={`px-4 py-2 text-sm border-b-2 -mb-px ${subTab === k ? 'border-foreground font-semibold' : 'border-transparent text-muted-foreground'}`}>
                      {l}
                    </button>
                  ))}
                </div>

                {subTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-1">Slug (URL)</label>
                        <Input value={ec.slug} onChange={e => setEditingCourse({ ...ec, slug: e.target.value })} placeholder="signal" />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Tag (Code)</label>
                        <Input value={ec.tag} onChange={e => setEditingCourse({ ...ec, tag: e.target.value })} placeholder="SIGNAL" />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">ชื่อหลักสูตร</label>
                        <Input value={ec.title} onChange={e => setEditingCourse({ ...ec, title: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">ชื่อรอง</label>
                        <Input value={ec.subtitle} onChange={e => setEditingCourse({ ...ec, subtitle: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Level</label>
                        <select value={ec.level || ''} onChange={e => setEditingCourse({ ...ec, level: e.target.value || null })}
                          className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                          <option value="">— ไม่ระบุ —</option>
                          {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">รูปแบบ (Format)</label>
                        <Input value={ec.format_label || ''} onChange={e => setEditingCourse({ ...ec, format_label: e.target.value || null })} placeholder="VOD Self-paced / Onsite 1 วัน" />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">ระยะเวลา</label>
                        <Input value={ec.duration} onChange={e => setEditingCourse({ ...ec, duration: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">ประเภทการเรียน</label>
                        <select value={ec.learning_type} onChange={e => setEditingCourse({ ...ec, learning_type: e.target.value })}
                          className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                          {LEARNING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Bloom Level (Pre → Post)</label>
                        <Input value={ec.bloom_level || ''} onChange={e => setEditingCourse({ ...ec, bloom_level: e.target.value || null })} placeholder="Remember → Apply/Analyze" />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">สี (accent on hover)</label>
                        <div className="flex gap-2">
                          {COLOR_OPTIONS.map(c => (
                            <button key={c.value} onClick={() => setEditingCourse({ ...ec, color: c.value })}
                              className={`w-8 h-8 rounded-full border-2 ${ec.color === c.value ? 'border-gray-900 scale-110' : 'border-gray-200'} transition-all`}
                              style={{ backgroundColor: c.hex }} title={c.label} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">ลำดับ</label>
                        <Input type="number" value={ec.sort_order} onChange={e => setEditingCourse({ ...ec, sort_order: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">สถานะป้าย</label>
                        <select value={ec.status || 'now_open'} onChange={e => setEditingCourse({ ...ec, status: e.target.value })}
                          className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1">เป้าหมาย (Outcome Goal)</label>
                      <Textarea value={ec.outcome_goal || ''} onChange={e => setEditingCourse({ ...ec, outcome_goal: e.target.value || null })} rows={2} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">กลุ่มผู้เรียน (Target audience)</label>
                      <Textarea value={ec.target_audience || ''} onChange={e => setEditingCourse({ ...ec, target_audience: e.target.value || null })} rows={2} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">รายละเอียด</label>
                      <Textarea value={ec.description} onChange={e => setEditingCourse({ ...ec, description: e.target.value })} rows={3} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">จุดเด่น (บรรทัดละ 1)</label>
                      <Textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={4} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">สิ่งที่ผู้เรียนจะได้รับ — Deliverables (บรรทัดละ 1)</label>
                      <Textarea value={deliverablesText} onChange={e => setDeliverablesText(e.target.value)} rows={4} placeholder="Certificate of Completion&#10;Templates pack&#10;Replay 30 วัน" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">KPI (บรรทัดละ 1, รูปแบบ: <code>label|value|note</code>)</label>
                      <Textarea value={kpiText} onChange={e => setKpiText(e.target.value)} rows={4}
                        placeholder="Watch Time|≥ 70%|ค่ามาตรฐาน&#10;NPS|≥ 8/10|จากผู้เรียน&#10;Pass criteria|80%" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={ec.is_active} onChange={e => setEditingCourse({ ...ec, is_active: e.target.checked })} />
                      เปิดใช้งาน
                    </label>
                  </div>
                )}

                {subTab === 'media' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium block mb-2">Cover Image</label>
                      {ec.cover_image_url && (
                        <img src={ec.cover_image_url} alt="cover" className="w-full max-w-md rounded-md border mb-2" />
                      )}
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={onUploadCover} disabled={uploading} className="max-w-sm" />
                        {ec.cover_image_url && <Button variant="ghost" size="sm" onClick={() => setEditingCourse({ ...ec, cover_image_url: null })}>ลบรูป</Button>}
                      </div>
                      <Input className="mt-2 max-w-md" placeholder="หรือวาง URL ตรงนี้" value={ec.cover_image_url || ''} onChange={e => setEditingCourse({ ...ec, cover_image_url: e.target.value || null })} />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">Intro Video (URL หรืออัปโหลด)</label>
                      {ec.intro_video_url && (
                        <video src={ec.intro_video_url} controls className="w-full max-w-md rounded-md border mb-2" />
                      )}
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="video/*" onChange={onUploadIntro} disabled={uploading} className="max-w-sm" />
                        {ec.intro_video_url && <Button variant="ghost" size="sm" onClick={() => setEditingCourse({ ...ec, intro_video_url: null })}>ลบ</Button>}
                      </div>
                      <Input className="mt-2 max-w-md" placeholder="https://...mp4 หรือ YouTube URL" value={ec.intro_video_url || ''} onChange={e => setEditingCourse({ ...ec, intro_video_url: e.target.value || null })} />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">Gallery</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                        {(ec.gallery_image_urls || []).map(url => (
                          <div key={url} className="relative group">
                            <img src={url} alt="gallery" className="w-full h-24 object-cover rounded-md border" />
                            <button onClick={() => removeGallery(url)}
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Input type="file" accept="image/*" multiple onChange={onUploadGallery} disabled={uploading} className="max-w-sm" />
                    </div>

                    {uploading && <p className="text-sm text-muted-foreground"><Upload className="w-4 h-4 inline mr-1" /> กำลังอัปโหลด...</p>}
                  </div>
                )}

                {subTab === 'modules' && (
                  <div className="space-y-3">
                    {!ec.id && (
                      <p className="text-sm text-amber-600">บันทึกหลักสูตรก่อน แล้วค่อยมาเพิ่มโมดูลค่ะ</p>
                    )}
                    {ec.id && (
                      <>
                        <div className="flex justify-end">
                          <Button size="sm" onClick={addModule}><Plus className="w-4 h-4 mr-1" /> เพิ่มโมดูล</Button>
                        </div>
                        {modules.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">ยังไม่มีโมดูล</p>}
                        {modules.map(m => (
                          <div key={m.id} className="border rounded-md p-3 space-y-2 bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">#{m.sort_order}</span>
                              <Input className="w-24" value={m.code} onChange={e => updateModule(m, { code: e.target.value })} placeholder="M01" />
                              <Input value={m.name} onChange={e => updateModule(m, { name: e.target.value })} placeholder="ชื่อโมดูล" />
                              <Input className="w-32" value={m.duration_label || ''} onChange={e => updateModule(m, { duration_label: e.target.value })} placeholder="20 นาที" />
                              <Button variant="ghost" size="sm" onClick={() => moveModule(m, -1)}><ArrowUp className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => moveModule(m, 1)}><ArrowDown className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteModule(m.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                            <Textarea rows={2} value={m.summary || ''} onChange={e => updateModule(m, { summary: e.target.value })} placeholder="สรุปสั้นๆ" />
                            <Input value={m.vod_url || ''} onChange={e => updateModule(m, { vod_url: e.target.value || null })} placeholder="VOD URL (YouTube / mp4)" />
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Phase:</span>
                                <select
                                  value={m.phase || 'main'}
                                  onChange={e => updateModule(m, { phase: e.target.value as ModuleRow['phase'] })}
                                  className="border rounded px-2 py-1 text-xs bg-white"
                                >
                                  {PHASE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                              </div>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={m.is_test || false} onChange={e => updateModule(m, { is_test: e.target.checked })} />
                                <span className="text-xs">เป็นแบบทดสอบ</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={m.has_quiz} onChange={e => updateModule(m, { has_quiz: e.target.checked })} /> มี Quiz
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={m.has_assignment} onChange={e => updateModule(m, { has_assignment: e.target.checked })} /> มีงานส่ง
                              </label>
                              <Button size="sm" variant="outline" className="ml-auto" onClick={() => saveModule(m)}>
                                <Save className="w-3 h-3 mr-1" /> บันทึกโมดูล
                              </Button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {subTab === 'pricing' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">ราคา (เว้นว่าง = ไม่แสดง)</label>
                      <Input value={ec.price} onChange={e => setEditingCourse({ ...ec, price: e.target.value })} placeholder="฿9,900" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Stripe Price ID</label>
                      <Input value={ec.stripe_price_id ?? ''} onChange={e => setEditingCourse({ ...ec, stripe_price_id: e.target.value || null })} placeholder="price_xxx" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">จำนวนที่เปิดรับ (ว่าง = ไม่จำกัด)</label>
                      <Input type="number" value={ec.max_slots ?? ''} onChange={e => setEditingCourse({ ...ec, max_slots: e.target.value ? parseInt(e.target.value) : null })} placeholder="ไม่จำกัด" />
                    </div>
                  </div>
                )}

                <Button onClick={handleSave} className="w-full"><Save className="w-4 h-4 mr-1" /> บันทึกหลักสูตร</Button>
              </div>
            )}

            <div className="space-y-2">
              {courses.map(course => {
                const statusMeta = STATUS_OPTIONS.find(s => s.value === (course.status || 'now_open'));
                return (
                  <div key={course.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === course.color)?.hex }} />
                      <div>
                        <p className="font-medium text-sm">
                          {course.title}
                          {course.level && <span className="ml-2 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-900 text-white">{course.level}</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.tag} · {course.price || '—'} · {LEARNING_TYPES.find(t => t.value === course.learning_type)?.label || course.learning_type}
                          {course.max_slots && ` · ${course.max_slots} คน`}
                        </p>
                      </div>
                      {statusMeta && statusMeta.value !== 'none' && (
                        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${statusMeta.badge}`}>
                          {statusMeta.label.toUpperCase()}
                        </span>
                      )}
                      {!course.is_active && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">ปิดใช้งาน</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(course)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(course.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                );
              })}
              {courses.length === 0 && <p className="text-center text-gray-400 py-8">ยังไม่มีหลักสูตร</p>}
            </div>
          </>
        )}

        {tab === 'promos' && (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={startNewPromo} size="sm"><Plus className="w-4 h-4 mr-1" /> เพิ่มโปรโมชั่น</Button>
            </div>

            {editingPromo && (
              <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">{isNewPromo ? 'เพิ่มโปรโมชั่นใหม่' : 'แก้ไขโปรโมชั่น'}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPromo(null)}><X className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">รหัสโปรโมชั่น</label>
                    <Input value={editingPromo.code || ''} onChange={e => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })} placeholder="EARLYBIRD" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">หลักสูตร</label>
                    <select value={editingPromo.course_id || ''} onChange={e => setEditingPromo({ ...editingPromo, course_id: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">เลือกหลักสูตร</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ประเภทส่วนลด</label>
                    <select value={editingPromo.discount_type || 'percent'} onChange={e => setEditingPromo({ ...editingPromo, discount_type: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option value="percent">ลด % (เปอร์เซ็นต์)</option>
                      <option value="amount">ลดเป็นบาท</option>
                      <option value="free">ฟรี</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      {editingPromo.discount_type === 'percent' ? 'เปอร์เซ็นต์ลด' : editingPromo.discount_type === 'amount' ? 'จำนวนเงินลด (บาท)' : 'ไม่ต้องกรอก (ฟรี)'}
                    </label>
                    <Input type="number" disabled={editingPromo.discount_type === 'free'}
                      value={editingPromo.discount_value || 0}
                      onChange={e => setEditingPromo({ ...editingPromo, discount_value: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ใช้ได้สูงสุด (คน)</label>
                    <Input type="number" value={editingPromo.max_uses || 1} onChange={e => setEditingPromo({ ...editingPromo, max_uses: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editingPromo.is_active ?? true} onChange={e => setEditingPromo({ ...editingPromo, is_active: e.target.checked })} />
                  เปิดใช้งาน
                </label>
                <Button onClick={handleSavePromo} className="w-full"><Save className="w-4 h-4 mr-1" /> บันทึก</Button>
              </div>
            )}

            <div className="space-y-2">
              {promos.map(p => {
                const courseName = courses.find(c => c.id === p.course_id)?.title || '-';
                return (
                  <div key={p.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm font-mono">{p.code}</p>
                      <p className="text-xs text-gray-500">
                        {courseName} · {p.discount_type === 'free' ? 'ฟรี' : p.discount_type === 'percent' ? `ลด ${p.discount_value}%` : `ลด ฿${p.discount_value}`}
                        {' '}· ใช้แล้ว {p.used_count}/{p.max_uses}
                        {!p.is_active && ' · ปิดใช้งาน'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingPromo(p); setIsNewPromo(false); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePromo(p.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                );
              })}
              {promos.length === 0 && <p className="text-center text-gray-400 py-8">ยังไม่มีโปรโมชั่น</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;
