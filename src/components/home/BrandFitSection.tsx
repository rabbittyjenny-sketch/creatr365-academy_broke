import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const RED = '#CC0033';

/* ─── accent rotation ────────────────────────────────────
   Sourced from this project's own brand skill (visual_system.md,
   "System B" — the documented 8-slot wayfinding accent palette used
   for per-block tags/borders/icons across Creatr365's long-form
   materials, e.g. instructor scripts and the Explore page tiles).
   Used here exactly as that system prescribes: thin accents (a
   number chip + a 3px top border) on an otherwise black/white card —
   never a full-color fill — so it stays inside System A's rules for
   this being a main marketing page. 7 cards → first 7 of the 8 slots,
   in the documented order; Teal (slot 8) sits unused this time. */
const ACCENTS = ['#C0A060', '#4A7FB5', '#6AAA7A', '#B87333', '#1E3A6E', '#9B4DCA', '#C0392B'] as const;

interface CardData {
  img: string;
  alt: string;
}

/* Image filenames follow the j01–j07 naming given for this section;
   drop the real photos into public/images/ under these exact names.
   Per feedback: no number/heading/description overlay anymore — the
   photo alone carries the section, so alt text is what's left to
   describe each card for accessibility. */
const CARDS: CardData[] = [
  { img: '/images/j01.png', alt: 'ปิดการขาย ช่วยสร้างยอด ลดอัตราคืนสินค้า' },
  { img: '/images/j02.png', alt: 'รักษา Retention ระหว่างไลฟ์' },
  { img: '/images/j03.png', alt: 'สร้างความน่าเชื่อถือต่อตัวเองและผลิตภัณฑ์' },
  { img: '/images/j04.png', alt: 'สื่อสารสินค้าได้ตรงกลุ่ม' },
  { img: '/images/j05.png', alt: 'คุมภาพลักษณ์แบรนด์ได้ดี' },
  { img: '/images/j06.png', alt: 'ทำงานแบบ Data-Driven + ปรับแผนได้เร็ว' },
  { img: '/images/j07.png', alt: 'ทำงานร่วมกับทีมหลังบ้าน ได้รู้ใจและพร้อม Support' },
];

/* ════════════════════════════════════════════════════════
   Card motion — deliberately not the site's usual data-aos
   fade-up (that's the flat, generic "slide-and-fade" every
   basic template/PowerPoint deck uses, which is exactly what
   was asked to move away from here), and not a scale-to-zoom
   hover either (scaling the photo past its frame is what was
   cropping it — the whole point was to stop hiding any of the
   photo). Two effects instead, both used for the reasons above:

   1. Entrance: a diagonal clip-path wipe. The card reveals along
      a moving diagonal edge rather than just fading up — a
      "reveal" rather than a "slide", closer to an editorial/film
      transition than a slide-deck one.
   2. Hover: a light 3D tilt that follows the pointer, plus a soft
      moving highlight — like glass catching light, not the photo
      itself moving or scaling. Nothing here ever changes the
      photo's own scale or crop; object-fit is `contain`, so the
      full frame is always visible regardless of hover state.
════════════════════════════════════════════════════════ */
function useTiltHover(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return; // skip on touch devices

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;  // 0..1
      const py = (e.clientY - r.top) / r.height;  // 0..1
      const ry = (px - 0.5) * 14;  // rotateY range
      const rx = (0.5 - py) * 10;  // rotateX range
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    };
    const onLeave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref]);
}

function useRevealOnScroll(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-in');
            io.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

function BrandFitCard({ card, i }: { card: CardData; i: number }) {
  const accent = ACCENTS[i];
  const wide = i < 3; // row 1 = 3 wide cards, row 2 = 4 narrower cards — matches the reference layout
  const cardRef = useRef<HTMLDivElement>(null);
  useTiltHover(cardRef);
  useRevealOnScroll(cardRef);

  return (
    // The clip-path reveal lives on the INNER div, not this outer one.
    // IntersectionObserver measures an element's actually-visible area —
    // a collapsed clip-path (zero-width sliver, the reveal's starting
    // state) makes an element permanently report zero intersection, so
    // observing the same node we clip creates a deadlock: it can never
    // detect "now visible" because clipping already made it invisible.
    // This outer node stays unclipped so it can always be observed
    // correctly; the inner node is what actually animates.
    <div
      ref={cardRef}
      className="c365-brandfit-card"
      style={{
        gridColumn: wide ? 'span 4' : 'span 3',
        aspectRatio: wide ? '4/3.1' : '4/3.6',
      }}
    >
      <div
        className="c365-brandfit-card-inner"
        style={{
          transitionDelay: `${i * 70}ms`,
          borderTop: `3px solid ${accent}`,
          background: `linear-gradient(160deg, ${accent}22, #101010 70%)`,
        }}
      >
        <div className="c365-brandfit-tilt">
          <div className="c365-brandfit-sheen" />
          <img src={card.img} alt={card.alt} />
        </div>
      </div>
    </div>
  );
}

export function BrandFitSection() {
  return (
    <section style={{ background: '#1a1a1a', padding: 'clamp(60px,8vw,100px) 0', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 clamp(20px,4vw,48px)', width: '100%' }}>
        <div style={{ marginBottom: 'clamp(56px,7vw,80px)' }}>
          <h2 data-aos="fade-up" className="c365-motion-drift c365-h-thick" style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
            อยากร่วมงานกับแบรนด์ใหญ่ ?
          </h2>
          <p data-aos="fade-up" data-aos-delay="80" style={{ fontSize: 'clamp(15px,2vw,20px)', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>
            สิ่งที่ตลาดต้องการ คือ…
          </p>
        </div>

        <div className="c365-brandfit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 26, marginBottom: 'clamp(48px,6vw,70px)' }}>
          {CARDS.map((card, i) => (
            <BrandFitCard key={card.img} card={card} i={i} />
          ))}
        </div>

        <div data-aos="fade-up" data-aos-delay="360" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/courses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(28px,3vw,44px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>
            ดูหลักสูตร <ArrowRight size={15} />
          </Link>
          <Link to="/articles/diagnostic-quiz"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px clamp(24px,2.5vw,36px)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.62)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', cursor: 'pointer' }}>
            ▷ Find Your Path
          </Link>
        </div>
      </div>

      {/* .c365-brandfit-* is unique to this component — cannot affect any
          other section. .c365-h-thick only changes this h2's own hover-
          underline THICKNESS (it was already correctly positioned — a
          single-line heading, verified by measuring its rendered width
          against the underline's width: both 803px, an exact match) — the
          override doesn't touch src/index.css's shared rule, just adds a
          thicker ::after for this one class.

          Card motion, see the two hooks above for the reasoning:
          - clip-path reveal on scroll (.is-in), not a fade-up
          - 3D pointer-tilt + moving sheen on hover, not a scale-zoom
          - img uses object-fit: contain, never cover — the whole photo
            stays visible in every state, nothing is ever cropped. */}
      <style>{`
        .c365-brandfit-card {
          position: relative;
        }
        .c365-brandfit-card-inner {
          position: absolute; inset: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 14px 34px rgba(0,0,0,.4);
          clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
          opacity: 0;
          transition: clip-path 1.1s cubic-bezier(.19,1,.22,1), opacity .9s ease-out, box-shadow .3s ease;
        }
        .c365-brandfit-card.is-in .c365-brandfit-card-inner {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          opacity: 1;
        }
        /* Tilt lives on its own inner element with its own FAST transition —
           kept separate from the entrance reveal above on purpose. Pointer
           tracking sets --rx/--ry dozens of times per second; if it shared
           the entrance's slow ~1s easing (as an earlier version did), each
           mousemove would retrigger that slow transition chasing a target
           that immediately moves again, so the tilt visually never catches
           up — it looked frozen, and only the (unrelated) sheen worked.
           A short transition here lets it actually track the cursor. */
        .c365-brandfit-tilt {
          position: absolute; inset: 0;
          perspective: 900px;
          transform: rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));
          transition: transform .12s ease-out;
        }
        .c365-brandfit-tilt img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: contain; object-position: center;
        }
        .c365-brandfit-card:hover .c365-brandfit-card-inner { box-shadow: 0 24px 50px rgba(0,0,0,.55); }
        .c365-brandfit-sheen {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          opacity: 0; transition: opacity .3s ease;
          background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,.14), rgba(255,255,255,0) 45%);
        }
        .c365-brandfit-card:hover .c365-brandfit-sheen { opacity: 1; }
        .c365-h-thick::after { height: 3px !important; }
        @media (max-width: 900px) {
          .c365-brandfit-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .c365-brandfit-card { grid-column: span 1 !important; aspect-ratio: 4/3.4 !important; }
        }
        @media (max-width: 540px) {
          .c365-brandfit-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .c365-brandfit-card-inner { transition: opacity .3s ease !important; clip-path: none !important; }
          .c365-brandfit-tilt { transform: none !important; }
        }
      `}</style>
    </section>
  );
}
