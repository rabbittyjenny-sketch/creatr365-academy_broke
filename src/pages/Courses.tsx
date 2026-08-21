import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Monitor, Users, Layers, Clock } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface CourseRow {
  id: string;
  slug: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  price: string;
  promo_price: string | null;
  features: string[];
  color: string;
  is_active: boolean;
  learning_type: string;
  max_slots: number | null;
  status: string;
  level: string | null;
  target_audience: string | null;
  format_label: string | null;
  cover_image_url: string | null;
}

// Type badges. Add new learning_type values here (e.g. a future 'free' vs
// paid split lives in price/status, not here — this map is purely about
// *where* the course happens: online / onsite / hybrid).
const LEARNING_META: Record<string, { label: string; Icon: typeof Monitor }> = {
  offline: { label: 'Onsite',  Icon: Users },
  online:  { label: 'Online',  Icon: Monitor },
  hybrid:  { label: 'Hybrid',  Icon: Layers },
};

// Status badges shown over the cover image. Add new status values here —
// anything not listed (e.g. draft/archived) simply renders no badge.
const STATUS_META: Record<string, { label: string; className: string } | null> = {
  now_open:     { label: 'NOW OPEN',     className: 'bg-success/10 text-success' },
  new_update:   { label: 'NEW UPDATE',   className: 'bg-foreground/5 text-foreground/70' },
  coming_soon:  { label: 'COMING SOON',  className: 'bg-foreground/5 text-foreground/70' },
  fully_booked: { label: 'FULLY BOOKED', className: 'bg-destructive/10 text-destructive' },
  draft: null,
  archived: null,
  none: null,
};

const CURRENT_COURSE_SLUGS = new Set(['magnet','foundation','signal','stage','brand-host-architect']);

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCourses((((data as unknown as CourseRow[]) || []).filter(c => CURRENT_COURSE_SLUGS.has(c.slug))));
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
          <p className="text-muted-foreground text-lg mb-12" data-accent="red">
            ครอบคลุมทุกระดับ
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const learning = LEARNING_META[course.learning_type] || LEARNING_META.offline;
              const status = STATUS_META[course.status as keyof typeof STATUS_META];
              const LearnIcon = learning.Icon;
              const accent = 'red' as const;

              // Price: supports empty/0 -> "free", an optional promo_price
              // tag next to the regular price, or a plain price string.
              // Falls back to "contact us" instead of rendering nothing,
              // so future course types without a price set never look broken.
              const priceRaw = course.price?.trim() || '';
              const promoRaw = course.promo_price?.trim() || '';
              const isFree = !priceRaw || priceRaw === '0' || priceRaw.toLowerCase() === 'free' || priceRaw === 'ฟรี';
              const hasPromo = !isFree && !!promoRaw && promoRaw !== priceRaw;

              return (
                <Link key={course.id} to={`/course/${course.slug}`} className="group block h-full">
                  <div className="card-water border border-border bg-card h-full flex flex-col overflow-hidden" data-accent={accent}>

                    {/* Cover image — always rendered at a fixed ratio (even
                        without an image yet) so every card stays the same
                        size regardless of which courses have media uploaded. */}
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
                      {course.cover_image_url ? (
                        <img
                          src={course.cover_image_url}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/25 text-sm font-bold tracking-widest uppercase">
                          {course.title}
                        </div>
                      )}
                      {status && (
                        <span className={`absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm ${status.className}`}>
                          {status.label}
                        </span>
                      )}
                      {course.level && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-sm border border-border text-foreground/70">
                          {course.level}
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-1.5">
                        {course.tag}
                      </span>

                      <h3
                        className="card-water-title text-xl font-bold leading-snug mb-3 line-clamp-2 min-h-[3.5rem]"
                        data-accent={accent}
                      >
                        {course.title}
                      </h3>

                      {/* Type + duration — balanced two-column meta row */}
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground pb-3 mb-3 border-b border-border">
                        <span className="inline-flex items-center gap-1.5">
                          <LearnIcon className="w-3.5 h-3.5 flex-shrink-0" /> {learning.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-right">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" /> {course.format_label || course.duration}
                        </span>
                      </div>

                      {/* Who it's for — shown as plain content, no heading */}
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem] mb-4 flex-1">
                        {course.target_audience || ''}
                      </p>

                      <div className="mt-auto pt-4 border-t border-border flex items-end justify-between gap-3">
                        <div className="flex flex-col leading-tight">
                          {isFree ? (
                            <span className="text-sm font-bold text-success">ฟรี</span>
                          ) : hasPromo ? (
                            <>
                              <span className="w-fit text-[9px] font-bold tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded mb-1">
                                โปรโมชั่น
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-base font-bold text-foreground">{promoRaw}</span>
                                <span className="text-[11px] text-muted-foreground line-through">{priceRaw}</span>
                              </div>
                            </>
                          ) : priceRaw ? (
                            <span className="text-base font-bold text-foreground">{priceRaw}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">ติดต่อสอบถาม</span>
                          )}
                        </div>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/80 whitespace-nowrap group-hover:gap-1.5 transition-all"
                          data-accent={accent}
                        >
                          ดูรายละเอียด
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Courses;
