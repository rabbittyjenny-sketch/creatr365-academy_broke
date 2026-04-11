import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { colorMap } from '@/data/courseData';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';

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
  is_active: boolean;
  learning_type: string;
  max_slots: number | null;
}

const LEARNING_LABELS: Record<string, string> = {
  offline: 'Offline', online: 'Online', hybrid: 'Hybrid',
};

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCourses((data as unknown as CourseRow[]) || []));
  }, []);

  return (
    <>
      <SEOHead title="หลักสูตรทั้งหมด - iDEAS365" description="หลักสูตรครอบคลุมทุกระดับ สร้างโฮสต์มืออาชีพระดับโลก" />
      <CourseNavbar />

      <section className="pt-28 pb-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">หลักสูตรทั้งหมด</h1>
          <p className="text-muted-foreground text-lg mb-12">ครอบคลุมทุกระดับ</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const colors = colorMap[course.color as keyof typeof colorMap] || colorMap.blue;
              return (
                <Link key={course.id} to={`/course/${course.slug}`} className="group" style={{ '--hover-accent': colors.hex } as React.CSSProperties}>
                  <div className="reveal-slide rounded-2xl border border-border bg-card h-full transition-all duration-500 hover:shadow-2xl hover:border-transparent">
                    <div className={`h-2 rounded-t-2xl ${colors.bg}`} />
                    <div className="p-6 relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium tracking-widest uppercase ${colors.text}`}>{course.tag}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{LEARNING_LABELS[course.learning_type] || course.learning_type}</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-1 accent-hover-text">{course.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{course.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{course.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{course.duration}</span>
                      </div>
                    </div>
                    <div className={`reveal-content ${colors.bg} rounded-b-2xl p-6 z-20`}>
                      <p className="text-white text-xl font-bold mb-2">{course.price}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {course.features.map((f, i) => (
                          <span key={i} className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">{f}</span>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm text-white font-medium">
                        สมัครเรียน <ArrowRight className="w-3 h-3" />
                      </span>
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

export default Courses;
