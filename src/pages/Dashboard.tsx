import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { courses, colorMap } from '@/data/courseData';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Trophy, Clock, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      setProfile(data);
    };
    checkAuth();
  }, [navigate]);

  if (!user) return null;

  // Mock enrolled courses for demo
  const enrolledCourses = courses.slice(0, 2);
  const recommendedCourses = courses.slice(2, 5);

  const stats = [
    { icon: BookOpen, label: 'หลักสูตรที่ลงทะเบียน', value: '2', color: 'blue' as const },
    { icon: Clock, label: 'ชั่วโมงเรียนรวม', value: '32', color: 'yellow' as const },
    { icon: Trophy, label: 'ใบรับรอง', value: '1', color: 'green' as const },
    { icon: TrendingUp, label: 'ความก้าวหน้า', value: '65%', color: 'red' as const },
  ];

  return (
    <>
      <SEOHead title="Dashboard - iDEAS365" description="ติดตามความก้าวหน้าของคุณ" />
      <CourseNavbar />

      <section className="pt-28 pb-16 px-4 bg-background min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            สวัสดีค่ะ, {profile?.display_name || user.email?.split('@')[0]}
          </h1>
          <p className="text-muted-foreground mb-10">ยินดีต้อนรับกลับมา! นี่คือความก้าวหน้าของคุณ</p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {stats.map((stat, i) => {
              const colors = colorMap[stat.color];
              return (
                <div key={i} className="reveal-slide group rounded-2xl border border-border bg-card p-5 transition-all duration-500 hover:shadow-xl hover:border-transparent">
                  <div className={`w-10 h-10 rounded-xl ${colors.bgLight} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
                    <stat.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <div className={`reveal-content ${colors.bg} rounded-b-2xl p-3 z-20`}>
                    <p className="text-xs text-white">คลิกเพื่อดูรายละเอียด</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enrolled courses */}
          <h2 className="text-xl font-bold mb-4">หลักสูตรของคุณ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {enrolledCourses.map((course) => {
              const colors = colorMap[course.color];
              return (
                <Link key={course.id} to={`/course/${course.id}`} className="group">
                  <div className="reveal-slide rounded-2xl border border-border bg-card overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-transparent">
                    <div className={`h-2 ${colors.bg}`} />
                    <div className="p-6 relative z-10">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-xs font-medium tracking-widest uppercase ${colors.text}`}>{course.tag}</span>
                          <h3 className="text-lg font-bold mt-1">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{course.subtitle}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-full ${colors.bgLight} flex items-center justify-center`}>
                          <span className={`text-sm font-bold ${colors.text}`}>65%</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${colors.bg} rounded-full transition-all duration-1000`} style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div className={`reveal-content ${colors.bg} rounded-b-2xl p-4 z-20`}>
                      <p className="text-sm text-white font-medium">เข้าเรียนต่อ →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Recommended */}
          <h2 className="text-xl font-bold mb-4">หลักสูตรแนะนำ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => {
              const colors = colorMap[course.color];
              return (
                <Link key={course.id} to={`/course/${course.id}`} className="group">
                  <div className="reveal-slide rounded-2xl border border-border bg-card p-5 transition-all duration-500 hover:shadow-lg hover:border-transparent">
                    <span className={`text-xs font-medium tracking-widest uppercase ${colors.text}`}>{course.tag}</span>
                    <h3 className="text-base font-bold mt-1 mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.subtitle}</p>
                    <div className={`reveal-content ${colors.bg} rounded-b-2xl p-3 z-20`}>
                      <p className="text-sm text-white font-bold">{course.price}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
