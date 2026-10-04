import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useDarkPage } from '@/hooks/useDarkPage';
import { ArrowRight, Monitor, Users, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { tierLabel } from '@/lib/courseTag';
import { LiveNotesSection } from '@/components/live-notes/LiveNotesSection';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';

// 6 = two full rows of the 3-column desktop grid. The page number lives in
// the URL (?page=2) so back/forward and shared links land on the same page.
const PAGE_SIZE = 6;

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
  outcome_goal: string | null;
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

// Status badges shown over the cover image — availability only ("is this
// course open for enrollment right now"), never pricing. "free" is a valid
// admin status value (CourseDetail.tsx still reads it to compute
// isFreeCourse) but deliberately has no badge here: whether a course is
// free is already communicated by the price row below, and mixing the two
// concepts in one badge is exactly what looked cluttered/inconsistent.
const STATUS_META: Record<string, { label: string; className: string } | null> = {
  now_open:     { label: 'NOW OPEN',     className: 'bg-success/10 text-success' },
  free:         null,
  new_update:   { label: 'NEW UPDATE',   className: 'bg-foreground/5 text-foreground/70' },
  coming_soon:  { label: 'COMING SOON',  className: 'bg-foreground/5 text-foreground/70' },
  fully_booked: { label: 'FULLY BOOKED', className: 'bg-destructive/10 text-destructive' },
  draft: null,
  archived: null,
  none: null,
};

const Courses: React.FC = () => {
  useDarkPage();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [params, setParams] = useSearchParams();
  const gridTopRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, parseInt(params.get('page') || '1', 10) || 1));
  const pagedCourses = courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (n: number) => {
    const next = new URLSearchParams(params);
    if (n <= 1) next.delete('page'); else next.set('page', String(n));
    setParams(next);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Shows every course an admin has published (is_active = true) — that flag
  // is the one and only publish switch. There used to also be a hardcoded
  // 5-slug allowlist here that silently hid every other course regardless of
  // is_active/price, with nothing in the Admin UI to explain why a saved,
  // priced, "published" course still never showed up here. Removed.
  useEffect(() => {
  supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .then(({ data }) => {
      setCourses((data as unknown as CourseRow[]) || []);
    });
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

          {/* Fluid auto-fill grid (not fixed column-count breakpoints) so this
              keeps working cleanly whether there are 5 courses or 50 — each
              card claims at least 280px and the row just wraps more of them
              as the viewport grows, the same pattern most catalog-style
              sites (Coursera, Udemy) use for exactly this reason. */}
          <div ref={gridTopRef} className="scroll-mt-28 grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {pagedCourses.map((course) => {
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
                  <div className="sharp-card border border-border bg-card h-full flex flex-col overflow-hidden" data-accent={accent}>

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
                      {/* Availability status only — free/paid lives in the price row below, never here. */}
                      {status && (
                        <span className={`absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2.5 py-1 backdrop-blur-sm ${status.className}`}>
                          {status.label}
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-1.5">
                        {tierLabel(course.tag)}
                      </span>

                      <h3 className="text-xl font-bold leading-snug mb-3 line-clamp-2 min-h-[3.5rem]">
                        {course.title}
                      </h3>

                      {/* Type only — no duration/VOD blurb on the right, just
                          the learning-type label, left-aligned */}
                      <div className="flex items-center text-xs text-muted-foreground pb-3 mb-3 border-b border-border">
                        <span className="inline-flex items-center gap-1.5">
                          <LearnIcon className="w-3.5 h-3.5 flex-shrink-0" /> {learning.label}
                        </span>
                      </div>

                      {/* Goal excerpt — same field/content as the "เป้าหมาย" text on the detail
                          page (course.outcome_goal), just without that label, so every card uses
                          one consistent source instead of target_audience (which was overflowing). */}
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem] mb-4 flex-1">
                        {course.outcome_goal || ''}
                      </p>

                      <div className="mt-auto pt-4 border-t border-border flex items-end justify-between gap-3">
                        <div className="flex flex-col leading-tight">
                          {isFree ? (
                            <span className="text-sm font-bold text-foreground">FREE</span>
                          ) : hasPromo ? (
                            <>
                              <span className="w-fit text-[9px] font-bold tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 mb-1">
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

          {pageCount > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    size="default"
                    href={`?page=${Math.max(1, page - 1)}`}
                    aria-label="หน้าก่อนหน้า"
                    aria-disabled={page === 1}
                    className={`rounded-none gap-1 pl-2.5 ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}
                    onClick={e => { e.preventDefault(); if (page > 1) goToPage(page - 1); }}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" /> ก่อนหน้า
                  </PaginationLink>
                </PaginationItem>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      href={`?page=${n}`}
                      isActive={n === page}
                      aria-label={`หน้า ${n}`}
                      className="rounded-none"
                      onClick={e => { e.preventDefault(); goToPage(n); }}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationLink
                    size="default"
                    href={`?page=${Math.min(pageCount, page + 1)}`}
                    aria-label="หน้าถัดไป"
                    aria-disabled={page === pageCount}
                    className={`rounded-none gap-1 pr-2.5 ${page === pageCount ? 'pointer-events-none opacity-40' : ''}`}
                    onClick={e => { e.preventDefault(); if (page < pageCount) goToPage(page + 1); }}
                  >
                    ถัดไป <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </section>
      <LiveNotesSection />
      <Footer />
    </>
  );
};

export default Courses;
