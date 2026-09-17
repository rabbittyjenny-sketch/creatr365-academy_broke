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
  n: string;
  img: string;
  title: string;
  desc: string;
}

/* NOTE: headings/descriptions transcribed off the reference screenshot —
   please double-check wording before shipping (same caveat as the Hero
   tags). Image filenames follow the j01–j07 naming given for this section;
   drop the real photos into public/images/ under these exact names. */
const CARDS: CardData[] = [
  { n: '01', img: '/images/j01.png', title: 'ปิดการขาย ช่วยสร้างยอด ลดอัตราคืนสินค้า', desc: 'เทคนิคการสื่อสารที่ทำให้ผู้ชมตัดสินใจซื้ออย่างมั่นใจ และลดการคืนสินค้าได้จริง' },
  { n: '02', img: '/images/j02.png', title: 'รักษา Retention ระหว่างไลฟ์', desc: 'กลยุทธ์การดึงความสนใจให้อยู่กับคุณตั้งแต่วินาทีแรกจนจบไลฟ์' },
  { n: '03', img: '/images/j03.png', title: 'สร้างความน่าเชื่อถือต่อตัวเองและผลิตภัณฑ์', desc: 'วางตำแหน่งตัวตน สร้างความไว้วางใจ และนำเสนอสินค้าได้อย่างมีพลัง' },
  { n: '04', img: '/images/j04.png', title: 'สื่อสารสินค้าได้ตรงกลุ่ม', desc: 'เข้าใจกลุ่มเป้าหมายอย่างลึกซึ้ง และสื่อสารให้ตรงความต้องการ' },
  { n: '05', img: '/images/j05.png', title: 'คุมภาพลักษณ์แบรนด์ได้ดี', desc: 'สร้างภาพลักษณ์ที่น่าเชื่อถือ และสะท้อนตัวตนแบรนด์ผ่านการไลฟ์ทุกครั้ง' },
  { n: '06', img: '/images/j06.png', title: 'ทำงานแบบ Data-Driven + ปรับแผนได้เร็ว', desc: 'เข้าใจข้อมูล วิเคราะห์ผลลัพธ์ และปรับกลยุทธ์ให้ยอดขายเติบโตอย่างต่อเนื่อง' },
  { n: '07', img: '/images/j07.png', title: 'ทำงานร่วมกับทีมหลังบ้าน ได้รู้ใจและพร้อม Support', desc: 'ทำงานร่วมกันได้อย่างไหลลื่น เพื่อให้ไลฟ์ทุกครั้งเป็นไปอย่างราบรื่นและมีประสิทธิภาพ' },
];

function BrandFitCard({ card, i }: { card: CardData; i: number }) {
  const accent = ACCENTS[i];
  const wide = i < 3; // row 1 = 3 wide cards, row 2 = 4 narrower cards — matches the reference layout
  return (
    <div
      data-aos="fade-up"
      data-aos-delay={String(i * 90)}
      className={`c365-brandfit-card${wide ? ' c365-motion-card' : ''}`}
      style={{
        position: 'relative',
        gridColumn: wide ? 'span 4' : 'span 3',
        aspectRatio: wide ? '4/3.1' : '4/3.6',
        borderRadius: 16,
        overflow: 'hidden',
        borderTop: `3px solid ${accent}`,
        background: '#141414',
        boxShadow: '0 14px 34px rgba(0,0,0,.4)',
      }}
    >
      <img
        src={card.img}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0) 35%, rgba(10,10,10,.92) 100%)' }} />

      <span style={{ position: 'absolute', left: 18, top: 16, fontFamily: 'Overpass, sans-serif', fontWeight: 900, fontSize: '13px', letterSpacing: '.04em', color: accent }}>
        {card.n}
      </span>

      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16 }}>
        <h3 style={{ margin: 0, marginBottom: 6, color: '#fff', fontWeight: 800, fontSize: wide ? 'clamp(16px,1.5vw,20px)' : 'clamp(14px,1.2vw,16px)', lineHeight: 1.25 }}>
          {card.title}
        </h3>
        <p style={{ margin: 0, color: 'rgba(255,255,255,.68)', fontSize: wide ? '13px' : '12px', lineHeight: 1.5 }}>
          {card.desc}
        </p>
      </div>
    </div>
  );
}

export function BrandFitSection() {
  return (
    <section style={{ background: '#1a1a1a', padding: 'clamp(60px,8vw,100px) 0', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 clamp(20px,4vw,48px)', width: '100%' }}>
        <div style={{ marginBottom: 'clamp(40px,5vw,60px)' }}>
          <h2 data-aos="fade-up" className="c365-motion-drift" style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
            อยากร่วมงานกับแบรนด์ใหญ่ ?
          </h2>
          <p data-aos="fade-up" data-aos-delay="80" style={{ fontSize: 'clamp(15px,2vw,20px)', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>
            สิ่งที่ตลาดต้องการ คือ…
          </p>
        </div>

        <div className="c365-brandfit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14, marginBottom: 'clamp(40px,5vw,60px)' }}>
          {CARDS.map((card, i) => (
            <BrandFitCard key={card.n} card={card} i={i} />
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

      {/* .c365-brandfit-* is unique to this component — cannot affect any other section */}
      <style>{`
        .c365-brandfit-card { transition: transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s ease; }
        .c365-brandfit-card:hover { transform: translateY(-6px); box-shadow: 0 22px 44px rgba(0,0,0,.55); }
        .c365-brandfit-card:hover img { transform: scale(1.045); }
        .c365-brandfit-card img { transition: transform .5s cubic-bezier(.16,1,.3,1); }
        @media (max-width: 900px) {
          .c365-brandfit-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .c365-brandfit-card { grid-column: span 1 !important; aspect-ratio: 4/3.4 !important; }
        }
        @media (max-width: 540px) {
          .c365-brandfit-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .c365-brandfit-card, .c365-brandfit-card img { transition: none !important; }
        }
      `}</style>
    </section>
  );
}
