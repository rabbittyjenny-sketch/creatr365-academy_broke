import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, GripVertical } from 'lucide-react';

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
}

const COLOR_OPTIONS = [
  { value: 'blue', label: 'น้ำเงิน', hex: '#4285F4' },
  { value: 'red', label: 'แดง', hex: '#EA4335' },
  { value: 'yellow', label: 'เหลือง', hex: '#FBBC04' },
  { value: 'green', label: 'เขียว', hex: '#34A853' },
  { value: 'black', label: 'ดำ', hex: '#1A1A1A' },
];

const AdminCourses = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      toast({ title: 'ไม่มีสิทธิ์เข้าถึง', variant: 'destructive' });
      navigate('/');
      return;
    }
    setLoading(false);
    fetchCourses();
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('sort_order');
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setCourses((data as unknown as CourseRow[]) || []);
    }
  };

  const startEdit = (course: CourseRow) => {
    setEditingCourse({ ...course });
    setFeaturesText(course.features.join('\n'));
    setIsNew(false);
  };

  const startNew = () => {
    setEditingCourse({
      id: '',
      slug: '',
      tag: '',
      title: '',
      subtitle: '',
      description: '',
      duration: '',
      price: '',
      features: [],
      color: 'blue',
      sort_order: courses.length + 1,
      is_active: true,
    });
    setFeaturesText('');
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editingCourse) return;

    const features = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const payload = {
      slug: editingCourse.slug,
      tag: editingCourse.tag,
      title: editingCourse.title,
      subtitle: editingCourse.subtitle,
      description: editingCourse.description,
      duration: editingCourse.duration,
      price: editingCourse.price,
      features,
      color: editingCourse.color,
      sort_order: editingCourse.sort_order,
      is_active: editingCourse.is_active,
    };

    if (!payload.slug || !payload.title) {
      toast({ title: 'กรุณากรอก Slug และ Title', variant: 'destructive' });
      return;
    }

    let error;
    if (isNew) {
      ({ error } = await supabase.from('courses').insert(payload as any));
    } else {
      ({ error } = await supabase.from('courses').update(payload as any).eq('id', editingCourse.id));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'บันทึกสำเร็จ' });
      setEditingCourse(null);
      fetchCourses();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบหลักสูตรนี้?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบสำเร็จ' });
      fetchCourses();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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
          <div className="flex gap-2">
            <Button onClick={startNew} size="sm">
              <Plus className="w-4 h-4 mr-1" /> เพิ่มหลักสูตร
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">ออกจากระบบ</Button>
          </div>
        </div>

        {/* Editing Form */}
        {editingCourse && (
          <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{isNew ? 'เพิ่มหลักสูตรใหม่' : 'แก้ไขหลักสูตร'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingCourse(null)}>
                <X className="w-4 h-4" />
              </Button>
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
                <Input value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} placeholder="MASTERCLASS I" />
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
                <label className="text-sm font-medium block mb-1">สี</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setEditingCourse({...editingCourse, color: c.value})}
                      className={`w-8 h-8 rounded-full border-2 ${editingCourse.color === c.value ? 'border-gray-900 scale-110' : 'border-gray-200'} transition-all`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">ลำดับ</label>
                <Input type="number" value={editingCourse.sort_order} onChange={e => setEditingCourse({...editingCourse, sort_order: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">รายละเอียด</label>
              <Textarea value={editingCourse.description} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} rows={3} />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">จุดเด่น (บรรทัดละ 1 รายการ)</label>
              <Textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={4} placeholder="S-O-R Framework&#10;PAD Theory&#10;FOMO Ladder" />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editingCourse.is_active} onChange={e => setEditingCourse({...editingCourse, is_active: e.target.checked})} />
                เปิดใช้งาน
              </label>
            </div>

            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-1" /> บันทึก
            </Button>
          </div>
        )}

        {/* Course List */}
        <div className="space-y-2">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === course.color)?.hex }}
                />
                <div>
                  <p className="font-medium text-sm">{course.title}</p>
                  <p className="text-xs text-gray-500">{course.tag} · {course.price} · {course.slug}</p>
                </div>
                {!course.is_active && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">ปิดใช้งาน</span>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(course)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(course.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="text-center text-gray-400 py-8">ยังไม่มีหลักสูตร</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCourses;
