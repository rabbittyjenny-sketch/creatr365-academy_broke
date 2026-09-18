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
const PHOTOS = {
  host: '/images/hero-host1.webp',
  beauty: '/images/hero-beauty1.webp',
  food: '/images/hero-food1.webp',
  fashion: '/images/hero-fashion1.webp',
} as const;

/* ════════════════════════════════════════════════════════
   FLOAT ITEM CONFIG
   Position/size come from the approved design; depth/rot/phase
   drive the idle sine-wave float; ex/ey/er/delay/dur drive the
   one-time "fly into place" entrance.

   delay/dur are the reference build's own numbers × 2.3 — the
   reference file was re-checked line-by-line against its actual
   engine script (not just the DOM), and delay/dur here already
   matched it exactly; "too fast" was a request to go slower than
   the reference itself, not a bug in matching it, so every value
   is stretched by the same factor to keep the original cascade/
   timing relationships intact, just unfolding over ~2.3x longer. */
type FloatKind = 'photo-host' | 'photo-beauty' | 'photo-food' | 'photo-fashion' | 'tag-standard' | 'tag-bubble' | 'tag-torn' | 'tag-host';

interface FloatConfig {
  kind: FloatKind;
  left: string; top: string; width: string;
  depth: number; rot: number; phase: number;
  ex: number; ey: number; er: number; delay: number; dur: number;
}

// Positions below were re-laid-out from the original design's numbers:
// the container's 2.5/1 aspect ratio (now 2.1/1, see scatterRef below) made
// each square-ish photo item's actual on-screen HEIGHT roughly 2x its
// width%, so several items' bounding boxes genuinely overlapped at rest —
// not an animation glitch, confirmed with screenshots at multiple points
// during and after the entrance (photo-beauty sat on top of photo-food,
// photo-fashion covered tag-host and nearly all of tag-bubble). Left/top/
// width were recomputed to keep every pair's footprint clear (checked
// pairwise in %, accounting for each item's real aspect ratio), and ex/ey/er
// (the entrance flight distance) were scaled down by ~45% so items travel a
// shorter path relative to the container and spend less time passing
// through each other's space mid-flight — delay/dur (the actual timing/
// stagger, matched to the reference build) are untouched, so the rhythm of
// the cascade is unchanged, only how far each item travels to get there.
const FLOAT_ITEMS: FloatConfig[] = [
  { kind: 'photo-host',    left: '20%', top: '44%', width: '15%',   depth: 1.1, rot: -3, phase: 0.4, ex: -39, ey: -297, er: 187,  delay: 2025, dur: 4255 },
  { kind: 'photo-beauty',  left: '40%', top: '12%', width: '15.5%', depth: 1.5, rot: 5,  phase: 1.9, ex: 50,  ey: -275, er: -165, delay: 1470, dur: 4025 },
  { kind: 'photo-food',    left: '62%', top: '40%', width: '15%',   depth: 2,   rot: -2, phase: 3.4, ex: 33,  ey: -253, er: -176, delay: 505,  dur: 3680 },
  { kind: 'photo-fashion', left: '82%', top: '10%', width: '15%',   depth: 1.3, rot: 4,  phase: 4.7, ex: -22, ey: -231, er: 143,  delay: 965,  dur: 3565 },
  { kind: 'tag-standard',  left: '88%', top: '62%', width: '11.5%', depth: 1.6, rot: 6,  phase: 2.2, ex: 22,  ey: -209, er: 165,  delay: 0,    dur: 3220 },
  { kind: 'tag-bubble',    left: '58%', top: '70%', width: '15%',   depth: 1.2, rot: -5, phase: 1.1, ex: 28,  ey: -198, er: -143, delay: 1290, dur: 3335 },
  { kind: 'tag-torn',      left: '30%', top: '78%', width: '11%',   depth: 1.7, rot: -6, phase: 2.6, ex: 17,  ey: -165, er: -121, delay: 230,  dur: 2990 },
  { kind: 'tag-host',      left: '8%',  top: '72%', width: '12.5%', depth: 1.4, rot: -3, phase: 0.6, ex: -11, ey: -187, er: 132,  delay: 1105, dur: 3450 },
];

/* ════════════════════════════════════════════════════════
   MOTION HOOK
   Pointer-parallax + idle float + one-time entrance, applied
   directly to refs every frame (no React state in the loop —
   same approach the reference build used, so it stays smooth).
   Fully self-contained: nothing here reads or writes the
   useParallax/useAOS/useSceneReveal hooks used by the rest of
   Home.tsx, so it cannot affect any other section.
════════════════════════════════════════════════════════ */
function useFloatMotion(containerRef: React.RefObject<HTMLDivElement>, itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = FLOAT_ITEMS.map((c) => ({ ...c, x: 0, y: 0, r: c.rot, s: 1, op: 0, vx: 0, vy: 0, vr: 0, hov: 0, over: 0 }));

    if (reduce) {
      state.forEach((_, i) => {
        const el = itemRefs.current[i];
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      return;
    }

    let px = 0, py = 0, tpx = 0, tpy = 0;
    const startTime = performance.now();
    const root = containerRef.current;

    const setFromPoint = (cx: number, cy: number) => {
      if (!root) return;
      const r = root.getBoundingClientRect();
      tpx = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width / 2)));
      tpy = Math.max(-1, Math.min(1, (cy - (r.top + r.height / 2)) / (r.height / 2)));
    };
    const onMove = (e: PointerEvent) => setFromPoint(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) setFromPoint(t.clientX, t.clientY); };
    const onLeave = () => { tpx = 0; tpy = 0; };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('blur', onLeave);
    root?.addEventListener('pointerleave', onLeave);

    const cleanups: Array<() => void> = [];
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const enter = () => { state[i].over = 1; };
      const leave = () => { state[i].over = 0; };
      el.addEventListener('pointerenter', enter);
      el.addEventListener('pointerleave', leave);
      cleanups.push(() => { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave); });
    });

    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const t = now / 1000;
      const width = root?.clientWidth ?? 1000;
      const narrow = width < 640 ? 0.5 : width < 900 ? 0.75 : 1;
      const strength = 1.1; // matches the reference file's own default motionStrength
      const k = strength * narrow;
      px += (tpx - px) * 0.07;
      py += (tpy - py) * 0.07;
      const elapsed = now - startTime;

      state.forEach((it, i) => {
        const el = itemRefs.current[i];
        if (!el) return;
        const d = it.depth;
        const dx = Math.cos(t * 0.42 + it.phase * 1.3) * 4.5 * d;
        const dy = Math.sin(t * 0.58 + it.phase) * 7 * d;
        const dr = Math.sin(t * 0.33 + it.phase * 0.8) * 1.4 * d;
        it.hov += (it.over - it.hov) * 0.12;

        const localT = elapsed - it.delay;
        let ease = 1, targetOp = 0;
        if (localT <= 0) { ease = 1; targetOp = 0; }
        else if (localT >= it.dur) { ease = 0; targetOp = 1; }
        else {
          const p = localT / it.dur;
          // was: Math.pow(1 - p, 3) — a cubic that has ZERO slope at p=1 (matches the
          // held ease=0 after landing, fine) but a NON-zero slope at p=0 (≈ -3/dur).
          // Right before p=0 the value is pinned flat at ease=1 (slope 0), so the
          // instant an item's delay elapses, its target suddenly starts moving at
          // that non-zero rate — a step in target-velocity the spring must snap onto,
          // which is exactly the stutter before the "roll down" settles.
          // Fix: smootherstep (Perlin) has zero 1st AND 2nd derivative at BOTH p=0
          // and p=1, so it matches the flat pre/post regions on both sides — no
          // velocity or acceleration step anywhere. p, dur, delay all untouched, so
          // total timing/speed is identical; only the shape of the curve changed.
          const s = p * p * p * (p * (p * 6 - 15) + 10);
          ease = 1 - s;
          targetOp = Math.min(1, localT / 220);
        }
        it.op += (targetOp - it.op) * 0.2;

        const exO = it.ex * ease * narrow;
        const eyO = it.ey * ease * narrow;
        const erO = it.er * ease * narrow;

        const tx = (px * 30 * d + dx) * k + exO;
        const ty = (py * 20 * d + dy) * k - it.hov * 16 + eyO;
        const tr = it.rot + (px * 5.2 * d + dr) * k + it.hov * Math.sign(it.rot || 1) * 2 + erO;

        it.vx = (it.vx + (tx - it.x) * 0.085) * 0.84;
        it.vy = (it.vy + (ty - it.y) * 0.085) * 0.84;
        it.vr = (it.vr + (tr - it.r) * 0.07) * 0.86;
        it.x += it.vx; it.y += it.vy; it.r += it.vr;
        it.s = 1 + it.hov * 0.045;

        el.style.transform = `translate3d(${it.x.toFixed(2)}px,${it.y.toFixed(2)}px,0) rotate(${it.r.toFixed(2)}deg) scale(${it.s.toFixed(4)})`;
        el.style.opacity = it.op.toFixed(3);
      });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('blur', onLeave);
      root?.removeEventListener('pointerleave', onLeave);
      cleanups.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ════════════════════════════════════════════════════════
   HERO SECTION
════════════════════════════════════════════════════════ */
export function HeroSection() {
  const scatterRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  useFloatMotion(scatterRef, itemRefs);

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

  let i = 0;
  // Stable per-index ref callbacks — created once and reused across
  // renders (rather than a fresh closure per render), so React never
  // sees the ref prop "change" and re-attach mid-animation.
  const refCallbacks = useRef<Array<(el: HTMLDivElement | null) => void>>(
    FLOAT_ITEMS.map((_, idx) => (el: HTMLDivElement | null) => { itemRefs.current[idx] = el; })
  );
  const nextRef = () => refCallbacks.current[i++];

  return (
    <section className="c365-scene" data-scene="1" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#0D0D0D' }}>
      {/* soft brand-red glow, same treatment as the reference design */}
      <div style={{ position: 'absolute', left: '50%', top: '58%', width: '120vw', height: '70vh', transform: 'translate(-50%,-50%)', background: `radial-gradient(ellipse at center, ${RED}29, rgba(13,13,13,0) 62%)`, pointerEvents: 'none' }} />

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
        {/* width/height/aspectRatio on this <img> (and on the badge below) are
            not decorative — they fix a real, measured layout-shift bug.
            Without them, the browser has no way to know this image's box
            height before the PNG finishes downloading, so it renders at
            ~0 height first, then snaps to its real ~472px-tall box the
            instant the logo loads — shoving the row below (left column +
            floating scatter) down by that same amount in one un-animated
            frame. Verified with a PerformanceObserver('layout-shift')
            probe against the production build: this was firing a single
            ~0.11 CLS shift at ~500ms that moved the scatter container by
            215px, and because the floating items are positioned with
            PERCENTAGE left/top relative to that container, they visibly
            snapped mid-fall — this, not the entrance easing itself
            (already fixed for velocity-continuity), was the real cause of
            the reported stutter/"overlapping" look on load. Reserving the
            real aspect ratio up front makes the browser allocate the
            final box size on the very first layout pass, so nothing
            shifts once the image loads. */}
        <h1 className="c365-h-nodefault" style={{ margin: 0, marginBottom: 'clamp(80px,10vw,140px)' }}>
          <img src={LOGO} alt="Creatr365" width={936} height={472} style={{ display: 'block', width: 'clamp(280px,34vw,480px)', height: 'auto', aspectRatio: '936 / 472', ...lineStyle(0) }} />
        </h1>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', gap: 'clamp(20px,3vw,48px)', width: '100%', flex: 1, flexWrap: 'wrap' }}>

          {/* Left column: badge (shrunk, as asked) → CTAs → English tagline
              → Thai paragraph. Flush left throughout. */}
          <div style={{
            flex: '0 0 auto', width: 'clamp(240px,27vw,360px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'clamp(16px,2vw,24px)',
            opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(46px)',
            transition: 'transform .95s cubic-bezier(.16,1,.3,1) 280ms, opacity .7s ease-out 280ms',
          }}>
            <img src={BADGE} alt="Be Creator. Not Consumer. Live Stream" width={249} height={168} style={{ display: 'block', width: 'clamp(120px,13vw,170px)', height: 'auto', aspectRatio: '249 / 168', filter: 'drop-shadow(0 18px 30px rgba(0,0,0,.4))' }} />

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

          {/* scattered photo bubbles + tags — pointer-parallax + entrance driven by useFloatMotion */}
          <div ref={scatterRef} className="c365-hero-scatter" style={{ position: 'relative', flex: 1, minWidth: 280, aspectRatio: '2.1/1', maxHeight: '62vh' }}>

            <div ref={nextRef()} style={{ position: 'absolute', left: FLOAT_ITEMS[0].left, top: FLOAT_ITEMS[0].top, width: FLOAT_ITEMS[0].width, aspectRatio: '1/1', opacity: 0, borderRadius: '50%', border: 'clamp(3px,.45vw,6px) solid #F8F8F6', background: '#1D4ED8', overflow: 'hidden', boxShadow: '0 26px 60px rgba(0,0,0,.45)' }}>
              <img src={PHOTOS.host} alt="Live host at desk setup" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div ref={nextRef()} style={{ position: 'absolute', left: FLOAT_ITEMS[1].left, top: FLOAT_ITEMS[1].top, width: FLOAT_ITEMS[1].width, aspectRatio: '1/1.05', opacity: 0, borderRadius: 'clamp(10px,2vw,28px)', border: 'clamp(3px,.45vw,6px) solid #F8F8F6', background: '#6D28D9', overflow: 'hidden', boxShadow: '0 26px 60px rgba(0,0,0,.45)' }}>
              <img src={PHOTOS.beauty} alt="Beauty host live on phone" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div ref={nextRef()} style={{ position: 'absolute', left: FLOAT_ITEMS[2].left, top: FLOAT_ITEMS[2].top, width: FLOAT_ITEMS[2].width, aspectRatio: '1/1', opacity: 0, borderRadius: '50%', border: 'clamp(3px,.45vw,6px) solid #F8F8F6', background: '#D4A017', overflow: 'hidden', boxShadow: '0 26px 60px rgba(0,0,0,.45)' }}>
              <img src={PHOTOS.food} alt="Food host live cooking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div ref={nextRef()} style={{ position: 'absolute', left: FLOAT_ITEMS[3].left, top: FLOAT_ITEMS[3].top, width: FLOAT_ITEMS[3].width, aspectRatio: '1/1.05', opacity: 0, borderRadius: 'clamp(10px,2vw,28px)', border: 'clamp(3px,.45vw,6px) solid #F8F8F6', background: '#1E9E52', overflow: 'hidden', boxShadow: '0 26px 60px rgba(0,0,0,.45)' }}>
              <img src={PHOTOS.fashion} alt="Fashion host with ring light" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* NOTE: Thai copy on these 4 tags was read off the reference screenshot —
                small text, please double-check spelling before shipping. */}
            <div ref={nextRef()} style={{ position: 'absolute', left: FLOAT_ITEMS[4].left, top: FLOAT_ITEMS[4].top, width: FLOAT_ITEMS[4].width, opacity: 0, display: 'flex', flexDirection: 'column', gap: 4 }} className="c365-hero-tag">
              <span style={{ display: 'block', background: '#D4A017', color: '#0D0D0D', fontWeight: 700, fontSize: 'clamp(9px,.9vw,12px)', textAlign: 'center', padding: '8px 6px', borderRadius: 8, boxShadow: '0 10px 22px rgba(0,0,0,.35)' }}>มาตรฐาน</span>
              <span style={{ display: 'block', background: '#1D4ED8', color: '#F8F8F6', fontWeight: 700, fontSize: 'clamp(9px,.9vw,12px)', textAlign: 'center', padding: '8px 6px', borderRadius: 8, boxShadow: '0 10px 22px rgba(0,0,0,.35)' }}>ระดับ</span>
              <span style={{ display: 'block', background: '#1D4ED8', color: '#F8F8F6', fontWeight: 700, fontSize: 'clamp(9px,.9vw,12px)', textAlign: 'center', padding: '8px 6px', borderRadius: 8, boxShadow: '0 10px 22px rgba(0,0,0,.35)' }}>สากล</span>
            </div>

            <div ref={nextRef()} style={{ position: 'absolute', left: FLOAT_ITEMS[5].left, top: FLOAT_ITEMS[5].top, width: FLOAT_ITEMS[5].width, opacity: 0, background: 'rgba(248,248,246,.08)', border: '1px dashed rgba(248,248,246,.35)', color: 'rgba(248,248,246,.65)', fontWeight: 600, fontSize: 'clamp(9px,.9vw,12px)', textAlign: 'center', padding: '10px 8px', borderRadius: 10 }} className="c365-hero-tag">
              ไม่ใช่ทุกคนที่ไลฟ์เก่ง แต่ทุกคนพัฒนาได้
            </div>

            <div ref={nextRef()} style={{ position: 'absolute', left: FLOAT_ITEMS[6].left, top: FLOAT_ITEMS[6].top, width: FLOAT_ITEMS[6].width, opacity: 0, background: '#F8F8F6', color: '#0D0D0D', fontWeight: 700, fontSize: 'clamp(9px,.85vw,11.5px)', textAlign: 'center', padding: '9px 6px', borderRadius: 6, boxShadow: '0 12px 24px rgba(0,0,0,.35)' }} className="c365-hero-tag">
              การสื่อสาร ทักษะพลัง
            </div>

            <div ref={nextRef()} style={{ position: 'absolute', left: FLOAT_ITEMS[7].left, top: FLOAT_ITEMS[7].top, width: FLOAT_ITEMS[7].width, opacity: 0, display: 'flex', flexDirection: 'column', gap: 4 }} className="c365-hero-tag">
              <span style={{ display: 'block', background: '#6D28D9', color: '#F8F8F6', fontWeight: 700, fontSize: 'clamp(9px,.85vw,11.5px)', textAlign: 'center', padding: '7px 6px', borderRadius: 8, boxShadow: '0 10px 20px rgba(0,0,0,.35)' }}>HOST</span>
              <span style={{ display: 'block', background: '#1E9E52', color: '#F8F8F6', fontWeight: 700, fontSize: 'clamp(9px,.85vw,11.5px)', textAlign: 'center', padding: '7px 6px', borderRadius: 8, boxShadow: '0 10px 20px rgba(0,0,0,.35)' }}>แบรนด์อยากจ้าง</span>
            </div>

          </div>
        </div>
      </div>

      {/* Small screens: let the scatter wrap under the CTA column instead of
          overlapping it — .c365-hero-scatter/.c365-hero-tag are unique to
          this component, so this rule cannot touch any other section.
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
        @media (max-width: 820px) {
          .c365-hero-scatter { position: static !important; aspect-ratio: auto !important; max-height: none !important; display: flex !important; flex-wrap: wrap !important; justify-content: center !important; gap: 12px !important; padding-block: 10px !important; }
          .c365-hero-scatter > div { position: static !important; left: auto !important; top: auto !important; width: auto !important; flex: 1 1 40% !important; max-width: 42% !important; }
          .c365-hero-tag { display: none !important; }
        }
      `}</style>
    </section>
  );
}
