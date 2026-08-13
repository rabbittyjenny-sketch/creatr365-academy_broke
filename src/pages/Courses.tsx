import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Monitor, Users, Layers } from 'lucide-react';

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
  status: string;
  level: string | null;
  format_label: string | null;
  cover_image_url: string | null;
}

const LEARNING_META: Record<string, { label: string; Icon: typeof Monitor }> = {
  offline: { label: 'Offline', Icon: Users },
  online:  { label: 'Online',  Icon: Monitor },
  hybrid:  { label: 'Hybrid',  Icon: Layers },
};

const STATUS_META: Record<string, { label: string } | null> = {
  now_open:    { label: 'NOW OPEN' },
  coming_soon: { label: 'COMING SOON' },
  new_update:  { label: 'NEW UPDATE' },
  none: null,
};

const ACCENT_CYCLE = ['blue', 'red', 'yellow', 'green'] as const;

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
      <SEOHead title="หลักสูตรทั้งหมด - Creatr365" description="หลักสูตรครอบคลุมทุกระดับ สร้างโฮสต์มืออาชีพระดับโลก" />
      <CourseNavbar />

      <section className="pt-28 pb-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" data-accent="red">
            หลักสูตรทั้งหมด
          </h1>
          <p className="text-muted-foreground text-lg mb-12" data-accent="blue">
            ครอบคลุมทุกระดับ
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, idx) => {
              const learning = LEARNING_META[course.learning_type] || LEARNING_META.offline;
              const status = STATUS_META[course.status as keyof typeof STATUS_META];
              const LearnIcon = learning.Icon;
              const accent = ACCENT_CYCLE[idx % 4];
              return (
                <Link key={course.id} to={`/course/${course.slug}`} className="group">
                  <div className="card-water border border-border bg-card h-full flex flex-col" data-accent={accent}>
                    {course.cover_image_url && (
                      <img src={course.cover_image_url} alt={course.title} className="w-full aspect-video object-cover border-b border-border" />
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {status && (
                          <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-foreground/5 text-foreground/70">
                            {status.label}
                          </span>
                        )}
                        {course.level && (
                          <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full border border-border text-foreground/70">
                            {course.level}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">{course.tag}</span>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-foreground/5 text-foreground/70">
                          <LearnIcon className="w-3 h-3" /> {learning.label}
                        </span>
                      </div>
                      <h3 className="card-water-title text-2xl font-bold mb-1" data-accent={accent}>{course.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4" data-accent={accent}>{course.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{course.description}</p>
                      <div className="pt-4 mt-auto border-t border-border flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{course.format_label || course.duration}</span>
                        {course.price?.trim() && <span className="font-bold text-foreground">{course.price}</span>}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-sm font-medium text-foreground/80">
                        <span data-accent={accent}>สมัครเรียน</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                      </div>
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
