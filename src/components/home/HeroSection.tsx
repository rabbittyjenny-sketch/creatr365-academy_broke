import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/* ─── constants ──────────────────────────────────────────
   Kept local to this component on purpose: Home.tsx already
   defines its own RED for the other 12 sections. Duplicating
   the tiny constant here means this file can be dropped into
   (or removed from) Home.tsx without touching anything else. */
const RED = '#CC0033';
const BADGE = '/images/logoCreatr365/white_concept_side.png'; // "Be a creatr. Not a consumer." — white concept lockup, in the repo's brand-logo folder
const LOGO = '/images/w-logo-side.png'; // real "Creatr365." logo asset — confirmed by direct viewing, and named explicitly by the user
const CLIP = '/videos/golive-clip.mp4'; // public/videos/golive-clip.mp4 — hero background clip
const GROUP_SHIFT = 'clamp(22px,2.2vw,32px)'; // badge + buttons + English tagline sit this much lower than before (≈1–2 text lines)
const THAI_GAP = 'clamp(28px,3.4vw,44px)'; // the Thai line's original margin-top

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
      {/* Background clip + left-dark blend. Sits under the content
          wrapper (zIndex 0 vs 1); nothing inside it takes pointer events.
          No colour tint on top of the clip any more — it plays in its own colours. */}
      <div className="c365-hero-media" aria-hidden="true">
        <video ref={videoRef} className="c365-hero-video" autoPlay muted loop playsInline preload="auto">
          <source src={CLIP} type="video/mp4" />
        </video>
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
            {/* Badge slot: keeps the height the old badge image had (170px-wide
                image at 249x160 → 160/249 of the old clamp width), so the group
                below it moves down by exactly the margin-top and nothing else
                changes. The new, wider lockup sits on the slot's bottom edge, so
                its gap to the buttons stays the normal column gap. (The PNG has ~2.3% transparent
                padding on its left; the negative margin lines the glyphs up with the buttons' left edge.) marginTop is
                the "1–2 lines down" shift for badge + buttons + English tagline. */}
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 'calc(clamp(120px,13vw,170px) * 160 / 249)', marginTop: GROUP_SHIFT }}>
              <img src={BADGE} alt="Be a creatr. Not a consumer." style={{ display: 'block', width: 'clamp(160px,19.4vw,280px)', maxWidth: 'none', flexShrink: 0, height: 'auto', marginLeft: 'calc(clamp(160px,19.4vw,280px) * -0.023)', filter: 'drop-shadow(0 18px 30px rgba(0,0,0,.4))' }} />
            </div>

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

            {/* Thai line — now ONE line (wraps only when the screen is too narrow
                to hold it). Type follows Home.tsx section 10's body copy:
                clamp(13px,1.2vw,16px), line-height 1.72, rgba(255,255,255,.68),
                IBM Plex Sans Thai (Overpass has no Thai glyphs). The 3 key phrases
                are white and get section 10's red underline sweep (.c365-hero-em,
                same easing/duration as .c365-origin-speaking-word), started once
                the column has entered. Its top edge stays where it was: the
                group-shift is taken out of this margin. */}
            <p className="c365-hero-th" style={{ margin: 0, marginTop: `calc(${THAI_GAP} - ${GROUP_SHIFT})`, fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 'clamp(13px,1.2vw,16px)', lineHeight: 1.72, color: 'rgba(255,255,255,.68)', textAlign: 'left' }}>
              เพราะอนาคตของ Live Commerce ไม่ใช่แค่การขายของ <span style={{ whiteSpace: 'nowrap' }}>แต่คือการ</span>{' '}
              <span className={`c365-hero-em${entered ? ' is-in' : ''}`}>สร้างคุณค่า</span>,{' '}
              <span className={`c365-hero-em${entered ? ' is-in' : ''}`}>สร้างอิทธิพล</span> และ{' '}
              <span className={`c365-hero-em${entered ? ' is-in' : ''}`}>สร้างอาชีพที่ยั่งยืน</span>
            </p>
          </div>
        </div>
      </div>

      {/* .c365-hero-* classes are unique to this component, so these rules cannot
          touch any other section.
          Media: clip is zoomed/shifted onto the live-app monitor (right side),
          shown in its own colours (no tint, no colour filter);
          .c365-hero-blend keeps the left darker than the right so the
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

        /* Thai line: one line on desktop/tablet, normal wrapping on phones.
           Underline sweep copied from Home.tsx .c365-origin-speaking-word. */
        .c365-hero-th { white-space: nowrap; text-shadow: 0 1px 14px rgba(13,13,13,.7); }
        .c365-hero-em { color: #fff; font-weight: 700; display: inline-block; position: relative; white-space: nowrap; }
        .c365-hero-em::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -3px; height: 2px;
          background: ${RED};
          transform: scaleX(0); transform-origin: left center;
          transition: transform .72s cubic-bezier(.16,1,.3,1) .68s;
        }
        .c365-hero-em.is-in::after { transform: scaleX(1); }
        @media (max-width: 760px) {
          .c365-hero-th { white-space: normal; width: calc(100vw - 2 * clamp(18px,2.6vw,34px)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .c365-hero-em::after { transform: scaleX(1); transition: none; }
        }

        .c365-hero-media { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; background: #0D0D0D; }
        .c365-hero-video {
          position: absolute; inset: 0; width: 100%; height: 100%; display: block;
          object-fit: cover; object-position: 50% 50%;
          transform-origin: 51% 62%;
          transform: translate(20%, 1%) scale(1.1);
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
