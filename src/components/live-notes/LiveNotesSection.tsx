import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClipCarousel } from '@/components/clips/ClipCarousel';
import { rotatingAccent } from '@/lib/accentPalette';
import { LiveNotePlayerDialog, type PlayableClip, type RelatedCourse } from './LiveNotePlayerDialog';
import { parseYouTubeId } from '@/lib/youtube';
import { goToLogin } from '@/lib/authRedirect';

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
    }
    if (idx < 0) return; // unknown or unpublished note: just land on the section
    if (!signedIn) goToLogin(navigate, linkFor(noteSlug));
  }, [loaded, noteSlug, signedIn, notes, navigate, linkFor]);

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

  const activeIndex = noteSlug ? notes.findIndex(x => x.slug === noteSlug) : -1;
  const active: PlayableClip | null = useMemo(() => {
    if (!signedIn || activeIndex < 0) return null;
    const n = notes[activeIndex];
    return { ...n, related_course: n.related_course_id ? courses[n.related_course_id] ?? null : null };
  }, [signedIn, activeIndex, notes, courses]);

  if (loaded && notes.length === 0) return null;

  return (
    // The section itself follows the /courses page color (site default red,
    // like the course cards above). Only the cards rotate through System B —
    // the one place the owner allows cycling colors (README §41.4).
    <section ref={sectionRef} id="live-notes" className="pb-24 pt-12 bg-background scroll-mt-24" aria-labelledby="live-notes-title">
      <div className="max-w-6xl mx-auto px-4"><div className="border-t border-border mb-12" /></div>
      <ClipCarousel
        bleed
        loading={!loaded}
        items={notes.map(n => ({
          ...n,
          footnote: n.related_course_id && courses[n.related_course_id]
            ? `ต่อยอดได้ในหลักสูตร ${courses[n.related_course_id].title}` : null,
        }))}
        accentFor={rotatingAccent}
        onOpen={openNote}
        ctaLabel={signedIn ? 'ดูคลิปฉบับเต็ม' : 'เข้าสู่ระบบเพื่อดูฟรี'}
        header={
          <div className="max-w-xl">
            <h2 id="live-notes-title" className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Live Notes</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              คลิปความรู้ฉบับเต็มจากโพสต์ที่คุณเห็นบนโซเชียล ดูจบได้ในคลิปเดียว ไม่มีบทเรียนต่อเนื่องหรือแบบทดสอบ
              ถ้าอยากเรียนแบบเป็นระบบ เลือกหลักสูตรด้านบน
            </p>
          </div>
        }
      />

      <LiveNotePlayerDialog
        clip={active}
        onClose={closeNote}
        label="Live Notes"
        accent={activeIndex >= 0 ? rotatingAccent(activeIndex) : undefined}
        track
        source={source}
      />
    </section>
  );
};
