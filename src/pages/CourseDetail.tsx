import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { AuthSheet } from '@/components/AuthSheet';
import { colorMap, kpiData } from '@/data/courseData';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Check, ArrowRight } from 'lucide-react';

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
}

const CourseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [course, setCourse] = useState<CourseRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('slug', id)
      .single()
      .then(({ data }) => {
        setCourse(data as unknown as CourseRow | null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        <CourseNavbar />
        <div className="pt-28 px-4 text-center"><p>กำลังโหลด...</p></div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <CourseNavbar />
        <div className="pt-28 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">ไม่พบหลักสูตร</h1>
          <Link to="/courses" className="text-primary hover:underline">กลับไปดูหลักสูตรทั้งหมด</Link>
        </div>
      </>
    );
  }

  const colors = colorMap[course.color as keyof typeof colorMap] || colorMap.blue;

  const handleEnroll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setIsAuthOpen(true);
      return;
    }
    navigate(`/enroll/${course.slug}`);
  };

  return (
    <>
      <SEOHead title={`${course.title} - iDEAS365`} description={course.description} />
      <CourseNavbar />

      <section className={`${colors.bg} text-white pt-28 pb-20 px-4`}>
        <div className="max-w-4xl mx-auto">
          <Link to="/courses" className="sweep-hover inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> หลักสูตรทั้งหมด
          </Link>
          <span className="block text-xs tracking-widest uppercase text-white/60 mb-2">{course.tag}</span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3 opacity-0 animate-fade-in">{course.title}</h1>
          <p className="text-xl md:text-2xl text-white/80 mb-6 opacity-0 animate-fade-in [animation-delay:200ms]">{course.subtitle}</p>
          <div className="flex flex-wrap gap-4 items-center opacity-0 animate-fade-in [animation-delay:400ms]">
            <span className="text-white/60 text-sm">{course.duration}</span>
            <span className="text-2xl font-bold">{course.price}</span>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 passing-underline-wrapper"><span className={`passing-underline ${colors.border}`}>รายละเอียดหลักสูตร</span></h2>
            <p className="text-muted-foreground leading-relaxed mb-8">{course.description}</p>
            
            <h3 className="text-lg font-bold mb-4">สิ่งที่จะได้เรียนรู้</h3>
            <ul className="space-y-3">
              {course.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 group feature-item">
                  <div className={`w-6 h-6 rounded-full ${colors.bgLight} flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:scale-110`}>
                    <Check className={`w-3 h-3 ${colors.text} transition-colors duration-300`} />
                  </div>
                  <span className={`text-foreground bracket-hover ${colors.border}`}>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-12">
              <h3 className="text-lg font-bold mb-6">ตัวชี้วัดความสำเร็จ (KPI)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kpiData.slice(0, 6).map((kpi, i) => (
                  <div key={i} className="kpi-card group rounded-xl border border-border p-4 transition-all duration-500 hover:shadow-lg hover:border-transparent relative overflow-hidden">
                    <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />
                    <div className="relative z-10">
                      <p className={`text-2xl font-bold ${colors.text} mb-1 transition-colors duration-500 group-hover:text-white`}>{kpi.value}</p>
                      <p className="text-xs text-muted-foreground transition-colors duration-500 group-hover:text-white/80">{kpi.metric}</p>
                      <p className="text-xs text-muted-foreground/0 group-hover:text-white/60 transition-all duration-500 mt-2 translate-y-2 group-hover:translate-y-0">{kpi.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className={`rounded-2xl border ${colors.border}/30 p-6 bg-card hover:border-transparent hover:shadow-xl transition-all duration-500 group relative overflow-hidden`}>
                <div className={`absolute inset-0 ${colors.bgLight} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                <div className="relative z-10">
                  <p className={`text-3xl font-bold ${colors.text} mb-2`}>{course.price}</p>
                  <p className="text-sm text-muted-foreground mb-6">{course.duration}</p>
                  <button 
                    onClick={handleEnroll}
                    className={`w-full py-3 ${colors.bg} text-white rounded-full font-medium hover:opacity-90 transition-all inline-flex items-center justify-center gap-2 btn-slide`}
                  >
                    สมัครเรียน <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-6 bg-card">
                <h4 className="font-bold mb-3 text-sm">ผลลัพธ์ที่คาดหวัง</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className={`bracket-hover ${colors.border}`}>• Conversion Rate +150-400%</li>
                  <li className={`bracket-hover ${colors.border}`}>• อัตราคืนสินค้า ลด 40%</li>
                  <li className={`bracket-hover ${colors.border}`}>• Portfolio ระดับโลก</li>
                  <li className={`bracket-hover ${colors.border}`}>• ใบรับรอง iDEAS365</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

export default CourseDetail;
