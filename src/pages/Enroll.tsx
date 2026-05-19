import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { colorMap } from '@/data/courseData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

interface CourseRow {
  id: string;
  slug: string;
  tag: string;
  title: string;
  subtitle: string;
  duration: string;
  price: string;
  color: string;
  learning_type: string;
  max_slots: number | null;
}

const LEARNING_LABELS: Record<string, string> = {
  offline: 'เรียนในห้องเรียน (Offline)',
  online: 'เรียนออนไลน์ (Online)',
  hybrid: 'ผสมผสาน (Hybrid)',
};

const Enroll: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<CourseRow | null>(null);
  const [isFull, setIsFull] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') !== 'true') return;
    setPaymentSuccess(true);
    const enrollmentId = searchParams.get('enrollment_id');
    if (!enrollmentId) { setTimeout(() => navigate('/dashboard'), 2000); return; }

    setVerifying(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        await supabase.functions.invoke('verify-payment', {
          body: { enrollmentId },
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
      } catch {}
      setVerifying(false);
      setTimeout(() => navigate('/dashboard'), 1500);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadCourse = async () => {
      const { data } = await supabase.from('courses').select('*').eq('slug', id).single();
      const c = data as unknown as CourseRow | null;
      setCourse(c);

      if (c?.max_slots) {
        const { count } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', c.id)
          .in('status', ['paid', 'free']);
        if ((count || 0) >= c.max_slots) setIsFull(true);
      }
    };
    loadCourse();
  }, [id]);

  if (paymentSuccess) {
    return (
      <>
        <CourseNavbar />
        <div className="pt-28 pb-16 px-4 bg-background min-h-screen flex items-center justify-center">
          <div className="max-w-md text-center">
            {verifying ? (
              <Loader2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin" />
            ) : (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold mb-2">{verifying ? 'กำลังยืนยันการชำระเงิน...' : 'ชำระเงินสำเร็จ!'}</h1>
            <p className="text-muted-foreground mb-6">
              {verifying ? 'รอสักครู่ กำลังเปิดคอร์สของคุณ' : 'กำลังพาไปหน้า Dashboard...'}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <CourseNavbar />
        <div className="pt-28 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">ไม่พบหลักสูตร</h1>
          <Link to="/courses" data-accent="green" className="nav-link text-primary">กลับไปดูหลักสูตรทั้งหมด</Link>
        </div>
      </>
    );
  }

  const colors = colorMap[course.color as keyof typeof colorMap] || colorMap.blue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Refresh session first to ensure token is valid (critical for LIFF magic-link sessions)
    await supabase.auth.getSession();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { navigate('/auth'); return; }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { courseId: course.id, fullName, phone, email: email.trim() || null, promoCode: promoCode || null },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        let msg = error.message;
        try { const b = await (error as any).context?.json?.(); if (b?.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      if (data?.free) {
        toast({ title: 'สมัครสำเร็จ!', description: 'คุณได้รับสิทธิ์เรียนฟรี' });
        navigate('/dashboard');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <>
      <SEOHead title={`สมัครเรียน ${course.title} - Creatr365`} description={`สมัครเรียนหลักสูตร ${course.title}`} />
      <CourseNavbar />

      <section className="pt-28 pb-16 px-4 bg-background min-h-screen">
        <div className="max-w-lg mx-auto">
          <Link to={`/course/${course.slug}`} data-accent="green" className="inline-flex items-center gap-1 text-muted-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> กลับไปรายละเอียดหลักสูตร
          </Link>

          <div className={`h-2 rounded-t-2xl ${colors.bg}`} />
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-8">
            <span className={`text-xs tracking-widest uppercase ${colors.text} font-medium`}>{course.tag}</span>
            <h1 className="text-2xl font-bold mt-1 mb-1" data-accent="green">{course.title}</h1>
            <p className="text-muted-foreground text-sm mb-2" data-accent="green">{course.subtitle} · {course.duration}</p>
            <p className="text-xs text-muted-foreground mb-4">{LEARNING_LABELS[course.learning_type] || course.learning_type}</p>
            {course.price?.trim() && <p className={`text-2xl font-bold ${colors.text} mb-6`}>{course.price}</p>}

            {isFull ? (
              <div className="text-center py-8">
                <p className="text-lg font-bold text-red-500 mb-2">เต็มแล้ว</p>
                <p className="text-sm text-muted-foreground">หลักสูตรนี้รับสมัครเต็มจำนวนแล้ว</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">ชื่อ-นามสกุล</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" placeholder="กรอกชื่อ-นามสกุล" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    อีเมล <span className="text-muted-foreground font-normal text-xs">(สำหรับรับใบเสร็จ)</span>
                  </label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">เบอร์โทรศัพท์</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" placeholder="0XX-XXX-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">รหัสส่วนลด (ถ้ามี)</label>
                  <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono" placeholder="EARLYBIRD" />
                </div>
                <button type="submit" disabled={loading}
                  data-accent="green"
                  className="btn-brand w-full py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังดำเนินการ...</> : 'ยืนยันสมัครเรียน'}
                </button>

                <div className="text-xs text-muted-foreground text-center space-y-1 mt-4">
                  <p>การชำระเงินผ่านระบบ Stripe ที่ปลอดภัยตามมาตรฐาน PCI DSS</p>
                  <p>หากมีปัญหาในการชำระเงิน กรุณาติดต่อ hello@creatr365.com</p>
                  <p>สามารถขอคืนเงินได้ภายใน 7 วัน ตาม พ.ร.บ.คุ้มครองผู้บริโภค</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Enroll;
