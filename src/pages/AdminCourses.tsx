import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, GripVertical, Ticket } from 'lucide-react';

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
}

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

const AdminCourses = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const [tab, setTab] = useState<'courses' | 'promos'>('courses');
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoCode> | null>(null);
  const [isNewPromo, setIsNewPromo] = useState(false);
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

  const startEdit = (course: CourseRow) => {
    setEditingCourse({ ...course });
    setFeaturesText(course.features.join('\n'));
    setIsNew(false);
  };

  const startNew = () => {
    setEditingCourse({
      id: '', slug: '', tag: '', title: '', subtitle: '', description: '',
      duration: '', price: '', features: [], color: 'blue',
      sort_order: courses.length + 1, is_active: true,
      learning_type: 'offline', max_slots: null, stripe_price_id: null,
      status: 'now_open',
    });
    setFeaturesText('');
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editingCourse) return;
    const features = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const payload = {
      slug: editingCourse.slug, tag: editingCourse.tag, title: editingCourse.title,
      subtitle: editingCourse.subtitle, description: editingCourse.description,
      duration: editingCourse.duration, price: editingCourse.price, features,
      color: editingCourse.color, sort_order: editingCourse.sort_order,
      is_active: editingCourse.is_active, learning_type: editingCourse.learning_type,
      max_slots: editingCourse.max_slots, stripe_price_id: editingCourse.stripe_price_id,
      status: editingCourse.status || 'now_open',
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <SEOHead title="จัดการหลักสูตร - Admin" description="Admin course management" />
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> กลับหน้าหลัก
            </Button>
            <h1 className="text-2xl font-bold">จัดการหลักสูตร</h1>
          </div>
          <Button onClick={() => supabase.auth.signOut().then(() => navigate('/auth'))} variant="outline" size="sm">ออกจากระบบ</Button>
        </div>

        {/* Tabs */}
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

            {editingCourse && (
              <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">{isNew ? 'เพิ่มหลักสูตรใหม่' : 'แก้ไขหลักสูตร'}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setEditingCourse(null)}><X className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Slug (URL)</label>
                    <Input value={editingCourse.slug} onChange={e => setEditingCourse({...editingCourse, slug: e.target.value})} placeholder="masterclass-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Tag</label>
                    <Input value={editingCourse.tag} onChange={e => setEditingCourse({...editingCourse, tag: e.target.value})} placeholder="SIGNATURE" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ชื่อหลักสูตร</label>
                    <Input value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ชื่อรอง</label>
                    <Input value={editingCourse.subtitle} onChange={e => setEditingCourse({...editingCourse, subtitle: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ระยะเวลา</label>
                    <Input value={editingCourse.duration} onChange={e => setEditingCourse({...editingCourse, duration: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ราคา</label>
                    <Input value={editingCourse.price} onChange={e => setEditingCourse({...editingCourse, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ประเภทการเรียน</label>
                    <select value={editingCourse.learning_type} onChange={e => setEditingCourse({...editingCourse, learning_type: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      {LEARNING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">จำนวนที่เปิดรับ (ว่างไว้ = ไม่จำกัด)</label>
                    <Input type="number" value={editingCourse.max_slots ?? ''} onChange={e => setEditingCourse({...editingCourse, max_slots: e.target.value ? parseInt(e.target.value) : null})} placeholder="ไม่จำกัด" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">สี</label>
                    <div className="flex gap-2">
                      {COLOR_OPTIONS.map(c => (
                        <button key={c.value} onClick={() => setEditingCourse({...editingCourse, color: c.value})}
                          className={`w-8 h-8 rounded-full border-2 ${editingCourse.color === c.value ? 'border-gray-900 scale-110' : 'border-gray-200'} transition-all`}
                          style={{ backgroundColor: c.hex }} title={c.label} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ลำดับ</label>
                    <Input type="number" value={editingCourse.sort_order} onChange={e => setEditingCourse({...editingCourse, sort_order: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Stripe Price ID (ถ้ามี)</label>
                    <Input value={editingCourse.stripe_price_id ?? ''} onChange={e => setEditingCourse({...editingCourse, stripe_price_id: e.target.value || null})} placeholder="price_xxx" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">รายละเอียด</label>
                  <Textarea value={editingCourse.description} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">จุดเด่น (บรรทัดละ 1 รายการ)</label>
                  <Textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={4} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editingCourse.is_active} onChange={e => setEditingCourse({...editingCourse, is_active: e.target.checked})} />
                  เปิดใช้งาน
                </label>
                <Button onClick={handleSave} className="w-full"><Save className="w-4 h-4 mr-1" /> บันทึก</Button>
              </div>
            )}

            <div className="space-y-2">
              {courses.map(course => (
                <div key={course.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === course.color)?.hex }} />
                    <div>
                      <p className="font-medium text-sm">{course.title}</p>
                      <p className="text-xs text-gray-500">
                        {course.tag} · {course.price} · {LEARNING_TYPES.find(t => t.value === course.learning_type)?.label || course.learning_type}
                        {course.max_slots && ` · เปิดรับ ${course.max_slots} คน`}
                      </p>
                    </div>
                    {!course.is_active && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">ปิดใช้งาน</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(course)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(course.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
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
                    <Input value={editingPromo.code || ''} onChange={e => setEditingPromo({...editingPromo, code: e.target.value.toUpperCase()})} placeholder="EARLYBIRD" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">หลักสูตร</label>
                    <select value={editingPromo.course_id || ''} onChange={e => setEditingPromo({...editingPromo, course_id: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">เลือกหลักสูตร</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ประเภทส่วนลด</label>
                    <select value={editingPromo.discount_type || 'percent'} onChange={e => setEditingPromo({...editingPromo, discount_type: e.target.value})}
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
                      onChange={e => setEditingPromo({...editingPromo, discount_value: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">ใช้ได้สูงสุด (คน)</label>
                    <Input type="number" value={editingPromo.max_uses || 1} onChange={e => setEditingPromo({...editingPromo, max_uses: parseInt(e.target.value) || 1})} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editingPromo.is_active ?? true} onChange={e => setEditingPromo({...editingPromo, is_active: e.target.checked})} />
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
