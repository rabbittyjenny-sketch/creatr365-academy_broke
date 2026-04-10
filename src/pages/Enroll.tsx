import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { courses, colorMap } from '@/data/courseData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const Enroll: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const course = courses.find(c => c.id === id);

  if (!course) {
    return (
      <>
        <CourseNavbar />
        <div className="pt-28 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">ไม่พบหลักสูตร</h1>
          <Link to="/courses" className="text-google-blue hover:underline">กลับไปดูหลักสูตรทั้งหมด</Link>
        </div>
      </>
    );
  }

  const colors = colorMap[course.color];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    // For now, register via event_registrations (reusing existing table)
    // In production, you'd create a course_registrations table
    toast({
      title: 'สมัครสำเร็จ!',
      description: `คุณสมัครหลักสูตร ${course.title} เรียบร้อยแล้ว`,
    });

    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <>
      <SEOHead title={`สมัครเรียน ${course.title} - iDEAS365`} description={`สมัครเรียนหลักสูตร ${course.title}`} />
      <CourseNavbar />

      <section className="pt-28 pb-16 px-4 bg-background min-h-screen">
        <div className="max-w-lg mx-auto">
          <Link to={`/course/${course.id}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> กลับไปรายละเอียดหลักสูตร
          </Link>

          <div className={`h-2 rounded-t-2xl ${colors.bg}`} />
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-8">
            <span className={`text-xs tracking-widest uppercase ${colors.text} font-medium`}>{course.tag}</span>
            <h1 className="text-2xl font-bold mt-1 mb-1">{course.title}</h1>
            <p className="text-muted-foreground text-sm mb-6">{course.subtitle} · {course.duration}</p>
            <p className={`text-2xl font-bold ${colors.text} mb-8`}>{course.price}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="0XX-XXX-XXXX"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 ${colors.bg} text-white rounded-full font-medium hover:opacity-90 transition-all disabled:opacity-50`}
              >
                {loading ? 'กำลังสมัคร...' : 'ยืนยันสมัครเรียน'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Enroll;
