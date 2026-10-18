import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/* ─── constants ──────────────────────────────────────────
   Kept local to this component on purpose: Home.tsx already
   defines its own RED for the other 12 sections. Duplicating
   the tiny constant here means this file can be dropped into
   (or removed from) Home.tsx without touching anything else. */
const RED = '#CC0033';
const BADGE = '/images/be-a-creator-live.png'; // existing asset, unchanged
const LOGO = '/images/w-logo-side.png'; // real "Creatr365." logo asset — confirmed by direct viewing, and named explicitly by the user
const CLIP = '/videos/golive-clip.mp4'; // public/videos/golive-clip.mp4 — hero background clip

/* ════════════════════════════════════════════════════════
   HERO SECTION
════════════════════════════════════════════════════════ */
export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Background clip: respect "reduce motion" — keep it on screen, paused on frame 1.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      videoRef.current?.pause();
    }
  }, []);

  // Left-column entrance (headline lines + CTA block): fade/rise in,
  // staggered — driven by one boolean flip so each element's own
  // transitionDelay does the staggering, no per-item timers needed.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  const lineStyle = (delayMs: number): React.CSSProperties => ({
    display: 'inline-block',
    opacity: entered ? 1 : 0,
    transform: entered ? 'translateY(0)' : 'translateY(48px)',
    filter: entered ? 'blur(0)' : 'blur(10px)',
    transition: `transform 1s cubic-bezier(.16,1,.3,1) ${delayMs}ms, opacity .75s ease-out ${delayMs}ms, filter .75s ease-out ${delayMs}ms`,
  });

  return (
    <section className="c365-scene" data-scene="1" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#0D0D0D' }}>
      {/* Background clip + brand grade + left-dark blend. Sits under the content
          wrapper (zIndex 0 vs 1); nothing inside it takes pointer events. */}
      <div className="c365-hero-media" aria-hidden="true">
        <video ref={videoRef} className="c365-hero-video" autoPlay muted loop playsInline preload="auto">
          <source src={CLIP} type="video/mp4" />
        </video>
        <div className="c365-hero-grade" />
        <div className="c365-hero-blend" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'clamp(18px,2.6vw,34px)', paddingTop: 'clamp(96px,14vh,148px)', boxSizing: 'border-box' }}>

        {/* Logo lives on its own, above the row — NOT inside the same flex
            column as badge/buttons/taglines. Putting it in that column
            (previous turn) made the column much taller, and because the
            scatter beside it is a flex sibling aligned to flex-start, the
            scatter visually got pushed out of its previously-balanced
            position as a side effect — nothing in the scatter's own code
            changed, but the sibling it aligns against got much taller.
            Kept large here (this is the actual size regression to fix —
            it should read as the dominant element, only the badge below
            it was asked to shrink), with its own bottom margin as the
            explicit gap to the badge. */}
        <h1 className="c365-h-nodefault" style={{ margin: 0, marginBottom: 'clamp(80px,10vw,140px)' }}>
          <img src={LOGO} alt="Creatr365" style={{ display: 'block', width: 'clamp(280px,34vw,480px)', height: 'auto', ...lineStyle(0) }} />
        </h1>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', gap: 'clamp(20px,3vw,48px)', width: '100%', flex: 1, flexWrap: 'wrap' }}>

          {/* Left column: badge (shrunk, as asked) → CTAs → English tagline
              → Thai paragraph. Flush left throughout. */}
          <div style={{
            flex: '0 0 auto', width: 'clamp(240px,27vw,360px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'clamp(16px,2vw,24px)',
            opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(46px)',
            transition: 'transform .95s cubic-bezier(.16,1,.3,1) 280ms, opacity .7s ease-out 280ms',
          }}>
            <img src={BADGE} alt="Be Creator. Not Consumer. Live Stream" style={{ display: 'block', width: 'clamp(120px,13vw,170px)', height: 'auto', filter: 'drop-shadow(0 18px 30px rgba(0,0,0,.4))' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'nowrap', width: 'max-content' }}>
              <Link to="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px clamp(20px,2.6vw,36px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '.08em', borderRadius: 4, whiteSpace: 'nowrap' }}>
                BEGIN NOW <ArrowRight size={15} />
              </Link>
              <Link to="/auth" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px clamp(16px,2.2vw,28px)', border: '1px solid rgba(255,255,255,.22)', color: 'rgba(255,255,255,.6)', fontWeight: 600, fontSize: '13px', letterSpacing: '.08em', borderRadius: 4, whiteSpace: 'nowrap' }}>
                FREE ACCOUNT
              </Link>
            </div>

            <p style={{ margin: 0, fontFamily: 'Overpass, sans-serif', fontWeight: 600, fontSize: 'clamp(9px,.85vw,12px)', letterSpacing: '.22em', color: '#F8F8F6', textAlign: 'left', whiteSpace: 'nowrap' }}>
              A CREATIVE HOUSE FOR THE FUTURE OF LIVE COMMERCE
            </p>

            {/* Fixed: Overpass has no Thai glyphs at all (the project's own
                tailwind config says so explicitly) — this was silently
                falling back to a generic system font. Switched to IBM Plex
                Sans Thai, the Thai font already loaded for this project.
                2 lines via an explicit <br/>, broken after "ไม่ใช่แค่การ
                ขายของ" (line 1 = the "what it isn't" clause, line 2 = the
                "what it is" clause + the 3 bolded terms), per request.
                Line-height between the 2 lines left at the browser
                default, unchanged, per request. Font-size bumped a step
                past the English line's own clamp (9px/.85vw/12px) to
                10px/1vw/14px — Thai text at an identical px value reads
                optically smaller than Latin caps (shorter x-height, no
                ascenders/descenders to fill the line), so matching the
                raw number undershoots visual parity; this compensates. */}
                        <p style={{ margin: 0, marginTop: 'clamp(28px,3.4vw,44px)', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 'clamp(10px,1vw,14px)', letterSpacing: '.02em', color: 'rgba(255,255,255,.55)', textAlign: 'left', whiteSpace: 'nowrap' }}>
              เพราะอนาคตของ Live Commerce ไม่ใช่แค่การขายของ<br />
              แต่คือการ{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>สร้างคุณค่า</strong>,{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>สร้างอิทธิพล</strong> และ{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>สร้างอาชีพที่ยั่งยืน</strong>
            </p>
          </div>
        </div>
      </div>

      {/* .c365-hero-* classes are unique to this component, so these rules cannot
          touch any other section.
          Media: clip is zoomed/shifted onto the live-app monitor (right side);
          .c365-hero-grade pulls it toward the Creatr365 palette (#0D0D0D base,
          #CC0033 red); .c365-hero-blend keeps the left darker than the right so the
          left column reads exactly as before.
          .c365-h-nodefault turns off the sitewide h1/h2.../::after hover-
          underline (src/index.css) specifically for this hero wordmark:
          that rule sizes the underline to the widest of the heading's
          lines ("Creatr") but anchors it under whichever line is last
          ("365."), so on this two-line, very-different-width headline it
          rendered as a long red bar overshooting "365." on hover — a
          decorative heading convention that doesn't fit a display
          wordmark like this one anyway. The override lives only on this
          class, so index.css itself, and every other heading site-wide,
          is untouched. */}
      <style>{`
        .c365-h-nodefault::after { content: none !important; }
        .c365-h-nodefault:hover { color: inherit !important; }

        .c365-hero-media { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; background: #0D0D0D; }
        .c365-hero-video {
          position: absolute; inset: 0; width: 100%; height: 100%; display: block;
          object-fit: cover; object-position: 50% 50%;
          transform-origin: 51% 62%;
          transform: translate(20%, 1%) scale(1.1);
          filter: saturate(.78) contrast(1.12) brightness(.9);
        }
        .c365-hero-grade {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 70% 60%, rgba(204,0,51,.22), rgba(204,0,51,0) 60%), #CC0033;
          background-blend-mode: normal;
          mix-blend-mode: soft-light; opacity: .38;
        }
        .c365-hero-blend {
          position: absolute; inset: 0;
          background:
            linear-gradient(90deg, #0D0D0D 0%, rgba(13,13,13,.97) 30%, rgba(13,13,13,.8) 42%, rgba(13,13,13,.4) 58%, rgba(13,13,13,0) 78%),
            linear-gradient(180deg, rgba(13,13,13,.6) 0%, rgba(13,13,13,0) 22%, rgba(13,13,13,0) 76%, rgba(13,13,13,.75) 100%);
        }
        @media (max-width: 1100px) {
          .c365-hero-blend {
            background:
              linear-gradient(90deg, #0D0D0D 0%, rgba(13,13,13,.97) 40%, rgba(13,13,13,.85) 52%, rgba(13,13,13,.45) 66%, rgba(13,13,13,0) 84%),
              linear-gradient(180deg, rgba(13,13,13,.6) 0%, rgba(13,13,13,0) 22%, rgba(13,13,13,0) 76%, rgba(13,13,13,.75) 100%);
          }
        }
        @media (max-width: 820px) {
          .c365-hero-video { transform-origin: 51% 62%; transform: translate(-2%, 6%) scale(1.35); object-position: 50% 62%; }
          .c365-hero-blend {
            background:
              linear-gradient(180deg, rgba(13,13,13,.96) 0%, rgba(13,13,13,.92) 52%, rgba(13,13,13,.6) 78%, rgba(13,13,13,.85) 100%);
          }
        }
      `}</style>
    </section>
  );
}
