import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { LiveNotePlayerDialog, type PlayableClip, type RelatedCourse } from './LiveNotePlayerDialog';
import { parseYouTubeId, youTubeThumb } from '@/lib/youtube';
import { goToLogin } from '@/lib/authRedirect';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';

// Same value as the `section.notes` Tailwind token; needed as a raw value for
// the CSS variables that drive the site-wide hover rules.
const NOTES_ACCENT = '#4A7FB5';

interface NoteRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  duration_label: string | null;
  related_course_id: string | null;
}

/**
 * Live Notes — full-length knowledge clips, shown under the course catalog
 * on /courses. Not courses: one clip, no lessons, no quiz.
 *
 * Deep link: /courses?note=<slug>&src=<platform>
 *  - signed in  → scrolls here and opens the clip
 *  - signed out → /auth (email or LINE), then straight back to the clip
 * The open clip lives in the URL (?note=), so the phone's back button closes
 * the player instead of leaving the page — matters inside the LINE browser.
 */
export const LiveNotesSection: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const sectionRef = useRef<HTMLElement>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [courses, setCourses] = useState<Record<string, RelatedCourse>>({});
  const [loaded, setLoaded] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const scrolledFor = useRef<string | null>(null);

  const noteSlug = params.get('note');
  const source = params.get('src');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('articles')
        .select('id,slug,title,summary,body,cover_image_url,video_url,duration_label,related_course_id')
        .eq('kind', 'live_note')
        .eq('is_active', true)
        .order('sort_order');
      const rows = ((data as unknown as NoteRow[]) || []).filter(n => parseYouTubeId(n.video_url));
      setNotes(rows);

      const ids = Array.from(new Set(rows.map(r => r.related_course_id).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: cs } = await supabase
          .from('courses')
          .select('id,slug,title,subtitle,cover_image_url,is_active')
          .in('id', ids);
        const map: Record<string, RelatedCourse> = {};
        for (const c of (cs as unknown as (RelatedCourse & { id: string; is_active: boolean })[]) || []) {
          if (c.is_active) map[c.id] = { slug: c.slug, title: c.title, subtitle: c.subtitle, cover_image_url: c.cover_image_url };
        }
        setCourses(map);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!api) return;
    const sync = () => { setCanPrev(api.canScrollPrev()); setCanNext(api.canScrollNext()); };
    sync();
    api.on('select', sync);
    api.on('reInit', sync);
    return () => { api.off('select', sync); api.off('reInit', sync); };
  }, [api]);

  const linkFor = useCallback((slug: string) => {
    const q = new URLSearchParams({ note: slug });
    if (source) q.set('src', source);
    return `/courses?${q.toString()}`;
  }, [source]);

  // Deep link: scroll here once, then open or send to login.
  useEffect(() => {
    if (!loaded || !noteSlug || signedIn === null) return;
    const idx = notes.findIndex(n => n.slug === noteSlug);
    if (scrolledFor.current !== noteSlug) {
      scrolledFor.current = noteSlug;
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (idx >= 0) api?.scrollTo(idx);
    }
    if (idx < 0) return; // unknown or unpublished note: just land on the section
    if (!signedIn) goToLogin(navigate, linkFor(noteSlug));
  }, [loaded, noteSlug, signedIn, notes, api, navigate, linkFor]);

  const openNote = (n: NoteRow) => {
    if (!signedIn) { goToLogin(navigate, linkFor(n.slug)); return; }
    const next = new URLSearchParams(params);
    next.set('note', n.slug);
    setParams(next); // push: back button closes the player
  };

  const closeNote = () => {
    const next = new URLSearchParams(params);
    next.delete('note');
    next.delete('src');
    setParams(next, { replace: true });
  };

  const active: PlayableClip | null = useMemo(() => {
    if (!signedIn || !noteSlug) return null;
    const n = notes.find(x => x.slug === noteSlug);
    if (!n) return null;
    return { ...n, related_course: n.related_course_id ? courses[n.related_course_id] ?? null : null };
  }, [signedIn, noteSlug, notes, courses]);

  if (loaded && notes.length === 0) return null;

  return (
    // One accent for the whole block (site pattern from Explore/Discover/AiLab:
    // `section-accent` + --hover-accent/--section-accent), so headings, hover
    // text, the sharp-card top line and buttons all use the same color instead
    // of the site-wide red default mixing with blue labels.
    <section
      ref={sectionRef}
      id="live-notes"
      className="section-accent pb-24 bg-background scroll-mt-24"
      style={{ '--hover-accent': NOTES_ACCENT, '--section-accent': NOTES_ACCENT } as React.CSSProperties}
      aria-labelledby="live-notes-title"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="border-t border-border pt-12 mb-6 flex items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 id="live-notes-title" className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Live Notes</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              คลิปความรู้ฉบับเต็มจากโพสต์ที่คุณเห็นบนโซเชียล ดูจบได้ในคลิปเดียว ไม่มีบทเรียนต่อเนื่องหรือแบบทดสอบ
              ถ้าอยากเรียนแบบเป็นระบบ เลือกหลักสูตรด้านบน
            </p>
          </div>
          <div className="hidden sm:flex gap-2 shrink-0">
            <button
              onClick={() => api?.scrollPrev()}
              disabled={!canPrev}
              aria-label="คลิปก่อนหน้า"
              className="sharp-btn w-10 h-10 grid place-items-center border border-border disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => api?.scrollNext()}
              disabled={!canNext}
              aria-label="คลิปถัดไป"
              className="sharp-btn w-10 h-10 grid place-items-center border border-border disabled:opacity-30"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Bleeds to the right edge of the screen so the last card is cut off:
          the visual cue that the row scrolls, as on the Webflow reference. */}
      <div style={{ paddingLeft: 'max(1rem, calc((100vw - 72rem) / 2 + 1rem))' }}>
        {!loaded ? (
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="shrink-0 w-[80%] sm:w-[44%] lg:w-[30%] aspect-[16/10] bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <Carousel setApi={setApi} opts={{ align: 'start', containScroll: 'trimSnaps', dragFree: true }}>
            {/* py-3: room for the sharp-card hover lift + hard shadow inside the clipped carousel viewport */}
            <CarouselContent className="pr-4 py-3">
              {notes.map(n => {
                const vid = parseYouTubeId(n.video_url)!;
                const course = n.related_course_id ? courses[n.related_course_id] : undefined;
                return (
                  <CarouselItem key={n.id} className="basis-[80%] sm:basis-[44%] lg:basis-[30%] xl:basis-[27%]">
                    <button
                      onClick={() => openNote(n)}
                      className="group sharp-card sharp-tile flex flex-col w-full h-full text-left border border-border bg-card overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-section-notes"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        <img
                          src={n.cover_image_url || youTubeThumb(vid)}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute left-3 bottom-3 w-10 h-10 grid place-items-center bg-section-notes text-[#0D0D0D]">
                          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                        </span>
                        {n.duration_label && (
                          <span className="absolute right-3 bottom-3 text-[11px] font-semibold px-2 py-1 bg-black/70 text-white">
                            {n.duration_label}
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-base leading-snug line-clamp-2">{n.title}</h3>
                        {n.summary && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.summary}</p>}
                        {course && (
                          <p className="mt-2 text-[11px] text-muted-foreground">ต่อยอดได้ในหลักสูตร {course.title}</p>
                        )}
                        <p className="mt-auto pt-3 text-xs font-semibold text-section-notes">
                          {signedIn ? 'ดูคลิปฉบับเต็ม' : 'เข้าสู่ระบบเพื่อดูฟรี'}
                        </p>
                      </div>
                    </button>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        )}
      </div>

      <LiveNotePlayerDialog clip={active} onClose={closeNote} label="Live Notes" track source={source} />
    </section>
  );
};
