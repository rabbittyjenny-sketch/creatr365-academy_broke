import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { loadYouTubeApi, parseYouTubeId, isYouTubeShorts, type YTPlayer } from '@/lib/youtube';
import { accentVars, COMMUNITY_CLIPS_ACCENT, type Accent } from '@/lib/accentPalette';
import { ArrowRight, RotateCcw } from 'lucide-react';

export interface RelatedCourse {
  slug: string;
  title: string;
  subtitle?: string | null;
  cover_image_url?: string | null;
}

export interface PlayableClip {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body?: string | null;
  video_url: string | null;
  duration_label?: string | null;
  related_course?: RelatedCourse | null;
}

interface Props {
  clip: PlayableClip | null;
  onClose: () => void;
  /** Label in the top strip, e.g. "Live Notes" or "คลิปกิจกรรม". */
  label: string;
  /** Log viewing to content_views (Live Notes only). */
  track?: boolean;
  /** Promo source from the link (?src=tiktok) — stored with the view. */
  source?: string | null;
  /** Color of the card that opened this clip; the dialog keeps it. */
  accent?: Accent;
}

const MILESTONES = [25, 50, 75, 90, 100];

const newSessionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

/**
 * Plays a YouTube clip inside the site (youtube-nocookie host, playsinline
 * so iOS and the LINE in-app browser don't force fullscreen). When `track`
 * is on, the first play and each progress milestone are sent to
 * log_live_note_view() — the database attaches the viewer's profile
 * demographics itself. If the IFrame API is blocked, falls back to a plain
 * embed so the clip still plays (just without progress logging).
 */
export const LiveNotePlayerDialog: React.FC<Props> = ({ clip, onClose, label, track = false, source = null, accent = COMMUNITY_CLIPS_ACCENT }) => {
  // Callback-ref state (not useRef): the dialog content mounts through a
  // portal one render later, and the player must be created after that.
  const [mountEl, setMountEl] = useState<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef<string>('');
  const sentRef = useRef<Set<number>>(new Set());
  const startedRef = useRef(false);
  const [ended, setEnded] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const videoId = parseYouTubeId(clip?.video_url);

  useEffect(() => {
    if (!clip || !videoId || !mountEl) return;
    let cancelled = false;
    sessionRef.current = newSessionId();
    sentRef.current = new Set();
    startedRef.current = false;
    setEnded(false);
    setFallback(false);

    const log = (pct: number) => {
      if (!track) return;
      supabase.rpc('log_live_note_view', {
        _article_id: clip.id,
        _view_session: sessionRef.current,
        _progress_pct: Math.round(pct),
        _source: source,
      }).then(({ error }) => { if (error) console.warn('log_live_note_view', error.message); });
    };

    const checkProgress = () => {
      const p = playerRef.current;
      if (!p) return;
      const dur = p.getDuration();
      if (!dur) return;
      const pct = (p.getCurrentTime() / dur) * 100;
      const reached = MILESTONES.filter(m => pct >= m && !sentRef.current.has(m));
      if (reached.length) {
        reached.forEach(m => sentRef.current.add(m));
        log(Math.max(...reached));
      }
    };

    loadYouTubeApi()
      .then(YT => {
        if (cancelled) return;
        const el = document.createElement('div');
        mountEl.innerHTML = '';
        mountEl.appendChild(el);
        playerRef.current = new YT.Player(el, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, autoplay: 1 },
          events: {
            onStateChange: (e: { data: number }) => {
              if (e.data === YT.PlayerState.PLAYING) {
                if (!startedRef.current) { startedRef.current = true; log(0); }
                if (timerRef.current == null) timerRef.current = window.setInterval(checkProgress, 5000);
              } else {
                if (timerRef.current != null) { clearInterval(timerRef.current); timerRef.current = null; }
                if (e.data === YT.PlayerState.PAUSED) checkProgress();
              }
              if (e.data === YT.PlayerState.ENDED) {
                if (!sentRef.current.has(100)) { sentRef.current.add(100); log(100); }
                setEnded(true);
              }
            },
          },
        });
      })
      .catch(() => { if (!cancelled) setFallback(true); });

    return () => {
      cancelled = true;
      if (timerRef.current != null) { clearInterval(timerRef.current); timerRef.current = null; }
      try { playerRef.current?.destroy(); } catch { /* already gone */ }
      playerRef.current = null;
    };
  }, [clip, videoId, track, source, replayKey, mountEl]);

  const course = clip?.related_course ?? null;
  // Shorts are 9:16: a 16:9 frame would pillarbox them into a thin strip, so
  // vertical clips get a tall player beside the text (stacked on phones).
  const vertical = isYouTubeShorts(clip?.video_url);
  const ctaStyle = { background: accent.fill, color: accent.on };

  return (
    <Dialog open={!!clip} onOpenChange={o => { if (!o) onClose(); }}>
      {/* Portals render outside the app's .site-hover-scope, but global h1-h6
          hover still applies — section-accent keeps the title's hover line
          the same color as everything else here. */}
      <DialogContent
        className={`section-accent ${vertical ? 'max-w-3xl' : 'max-w-4xl'} w-[calc(100vw-1rem)] sm:w-[calc(100vw-3rem)] p-0 gap-0 overflow-hidden rounded-none sm:rounded-none border-border border-t-4 bg-card max-h-[94vh] overflow-y-auto`}
        style={{ ...accentVars(accent), borderTopColor: accent.fill }}
      >
        <div className="h-11 px-4 flex items-center border-b border-border">
          <span className="text-xs font-semibold" style={{ color: accent.text }}>{label}</span>
        </div>

        <div className={vertical ? 'md:flex md:items-start' : ''}>
        <div className={`relative bg-black ${vertical ? 'aspect-[9/16] w-full max-w-[min(100%,calc(78vh*9/16))] mx-auto md:mx-0 md:w-[min(360px,calc(78vh*9/16))] md:shrink-0' : 'aspect-video'}`}>
          {!videoId ? (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/60 px-6 text-center">
              ลิงก์วิดีโอของคลิปนี้ไม่ถูกต้อง แจ้งทีมงานให้ตรวจสอบได้
            </div>
          ) : fallback ? (
            <iframe
              title={clip?.title}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&autoplay=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div ref={setMountEl} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full" />
          )}

          {ended && (
            <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-5">
              <div className="w-full max-w-md text-white">
                <p className="text-sm text-white/60 mb-3">ดูจบแล้ว</p>
                {course ? (
                  <>
                    <p className="text-lg font-bold leading-snug mb-1">อยากเรียนเรื่องนี้ให้ลึกและเป็นระบบ</p>
                    <p className="text-sm text-white/70 mb-4">หลักสูตร {course.title} มีบทเรียนต่อเนื่องและแบบทดสอบวัดผล</p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/course/${course.slug}`}
                        onClick={onClose}
                        className="sharp-btn inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold"
                        style={ctaStyle}
                      >
                        ดูหลักสูตร <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <button
                        onClick={() => setReplayKey(k => k + 1)}
                        className="sharp-btn inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-white/30 text-white"
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" /> ดูอีกครั้ง
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setReplayKey(k => k + 1)}
                    className="sharp-btn inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-white/30 text-white"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" /> ดูอีกครั้ง
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-4 min-w-0 md:flex-1">
          <div>
            <DialogTitle className="text-xl font-bold leading-snug">{clip?.title}</DialogTitle>
            {clip?.duration_label && (
              <p className="text-xs text-muted-foreground mt-1">ความยาว {clip.duration_label}</p>
            )}
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {clip?.summary}
          </DialogDescription>
          {clip?.body && (
            <div className="text-sm text-foreground/80 leading-relaxed article-body" dangerouslySetInnerHTML={{ __html: clip.body }} />
          )}

          {course && (
            <Link
              to={`/course/${course.slug}`}
              onClick={onClose}
              className="group sharp-card flex items-center gap-4 border border-border p-3"
            >
              {course.cover_image_url && (
                <img src={course.cover_image_url} alt="" className="w-20 h-14 object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">หลักสูตรที่เกี่ยวข้อง</p>
                <p className="text-sm font-bold truncate">{course.title}</p>
              </div>
              <ArrowRight className="motion-arrow w-4 h-4 shrink-0" style={{ color: accent.text }} aria-hidden="true" />
            </Link>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
