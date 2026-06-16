import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, ChevronDown } from 'lucide-react';

/* ─── Brand constants ───────────────────────────────────── */
const RED = '#CC0033';
// Logo ใช้ไฟล์จริงใน public/images/w-logo-side.png (white, horizontal)
const LOGO = '/images/w-logo-side.png';

/* ─── Scroll reveal (IntersectionObserver) ──────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } }),
      { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
}

/* ─── Count-up ──────────────────────────────────────────── */
function CountUp({ v, trigger }: { v: string; trigger: boolean }) {
  const [val, setVal] = useState('—');
  useEffect(() => {
    if (!trigger) return;
    const num = parseFloat(v.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setVal(v); return; }
    const pre = v.match(/^[^0-9]*/)?.[0] ?? '';
    const suf = v.replace(/^[^0-9]*[\d.]+/, '');
    const dur = 1500; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(pre + (Math.round(ease * num * 10) / 10).toLocaleString() + suf);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [trigger, v]);
  return <>{val}</>;
}

/* ─── STATS ──────────────────────────────────────────────── */
const STATS = [
  { v: '$172.9B', l: 'Live Commerce ทั่วโลก 2025',          src: 'Grand View Research' },
  { v: '33.9%',   l: 'CAGR Live-Streaming E-Commerce 2024–2034', src: 'market.us' },
  { v: '1.1T฿',  l: 'ตลาด e-Commerce ไทย ปี 2024',         src: 'Priceza' },
  { v: '+21.7%', l: 'ไทยโตเร็วที่สุดใน SEA ปี 2024',       src: 'Momentum Works' },
];

/* ─── BRAND NEEDS cards (§4) ────────────────────────────── */
// brand1.png ไม่มีในโปรเจค → ใช้ w-set-logo-side-noBG.png + image ที่มีจริง
// รูปแถวบน 4 ใบ / แถวล่าง 3 ใบ  ตรงกับรูปตัวอย่าง
const BRAND_TOP = [
  { img: '/images/white-man-live.png',    num: '01', title: 'ปิดการขาย\nช่วยสร้างยอด ลดอัตราคืนสินค้า',      sub: 'กลยุทธ์การพูดในไลฟ์ที่จัดการทั้งอารมณ์ผู้ชม และนำไปสู่การตัดสินใจซื้อสินค้า' },
  { img: '/images/creator-live2.png',     num: '02', title: 'รักษา Retention\nระหว่างไลฟ์',                   sub: 'ผู้ชมที่อยู่นานขึ้นคือโอกาสขายที่เพิ่มขึ้นตามไปด้วยทุกครั้ง' },
  { img: '/images/2pax-white-suite.png',  num: '03', title: 'สร้างความน่าเชื่อถือ\nต่อตัวเองและผลิตภัณฑ์',   sub: 'วางตำแหน่งตัวเอง สร้างความไว้วางใจ และนำเสนอสินค้าที่น่าสนใจ' },
  { img: '/images/team-studio.png',       num: '04', title: 'สื่อสารสินค้า\nได้ตรงกลุ่ม',                     sub: 'เข้าใจสินค้า เข้าใจลูกค้า สื่อสารได้ตรงและมีผลตามความต้องการ' },
];
const BRAND_BTM = [
  { img: '/images/set-mic-bags.png',      num: '05', title: 'คุมภาพลักษณ์\nแบรนด์ได้ดี',                      sub: 'สร้างภาพลักษณ์มืออาชีพ น่าเชื่อถือ และเป็นตัวเองผ่านการไลฟ์ทุกครั้ง' },
  { img: '/images/white-man-data.png',    num: '06', title: 'ทำงานแบบ Data-Driven\n+ ปรับแผนได้เร็ว',          sub: 'เข้าใจข้อมูล วิเคราะห์ผลลัพธ์ ปรับกลยุทธ์ให้เดินต่อได้อย่างต่อเนื่อง' },
  { img: '/images/team-analysis.jpg',     num: '07', title: 'ทำงานร่วมกับทีมหลังบ้านได้\nรู้หน้าที่และพร้อม Support', sub: 'ทำงานร่วมกับทีมได้ทั้งในไลฟ์ทุกครั้ง เพื่อให้ไลฟ์ทำกำไรอย่างมีประสิทธิภาพ' },
];

/* ─── CURRICULUM tiers (§8) ─────────────────────────────── */
const TIERS = [
  {
    id: 't1',
    bg: '/images/i-can-live.png',
    headline: 'ไลฟ์ให้', red: 'เป็น',
    courses: [
      { name: 'THE MAGNET',     sub: 'READY FOR LIVE',   tag: 'FREE',   link: '/courses' },
      { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER',    tag: 'COURSE', link: '/courses' },
    ],
  },
  {
    id: 't2',
    bg: '/images/i-can-sale.png',
    headline: 'ไลฟ์ให้', red: 'ขายได้',
    courses: [
      { name: 'SIGNAL', sub: 'THE CONVERSION HOST : ONLINE',              tag: 'COURSE', link: '/courses' },
      { name: 'STAGE',  sub: 'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', tag: 'COURSE', link: '/courses' },
    ],
  },
  {
    id: 't3',
    bg: '/images/i-can-process.png',
    headline: 'ไลฟ์ให้', red: 'วัดผลและทำซ้ำได้',
    badge: "DON'T MISS!",
    courses: [
      { name: 'The BRAND ARCHITECT', sub: 'MASTERCLASS : ONSITE 2 DAYS', tag: 'COMING SOON', link: '' },
    ],
    also: [
      { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER', link: '/courses' },
      { name: 'SIGNAL',         sub: 'THE CONVERSION HOST : ONLINE', link: '/courses' },
      { name: 'STAGE',          sub: 'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', link: '/courses' },
    ],
  },
];

/* ─── WHY table ─────────────────────────────────────────── */
const WHY = [
  { them: 'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube',           us: 'PPACT Framework 5 มิติ ฝังในทุกคอร์ส' },
  { them: 'เน้นเทคนิคตะโกนขายหรือสร้าง Hype',            us: 'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด' },
  { them: 'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข',      us: 'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools' },
  { them: 'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย',          us: 'Brand Host Architect — วางระบบ Production ทั้งทีม' },
  { them: 'เรียนจบไม่รู้จะทำอะไรต่อ',                    us: 'Key Collection System™ มาตรฐานอุตสาหกรรม' },
];

/* ══════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════ */
export default function Home() {
  useReveal();

  /* Hero parallax */
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = () => { if (heroRef.current) heroRef.current.style.transform = `translateY(${window.scrollY * 0.18}px)`; };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Stats trigger */
  const statsEl = useRef<HTMLDivElement>(null);
  const [trig, setTrig] = useState(false);
  useEffect(() => {
    const el = statsEl.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTrig(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  /* Stats modal */
  const [modal, setModal] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setModal(false);
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  /* Tier accordion */
  const [openTier, setOpenTier] = useState<string | null>(null);
  const toggleTier = useCallback((id: string) => setOpenTier(p => p === id ? null : id), []);

  return (
    <main style={{ background: '#0a0a0a', overflowX: 'hidden' }}>

      {/* ══════════════════════════
          §1  HERO
          Layout: logo+tagline บนซ้าย, BE CREATOR / NOT CONSUMER กลาง-ล่างซ้าย, ปุ่ม, tagline ล่างสุด
          BG: hero-team.jpg เต็มหน้า parallax
      ══════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* BG parallax */}
        <div ref={heroRef} className="absolute inset-0 z-0" style={{ willChange: 'transform' }}>
          <img src="/images/hero-team.jpg" alt=""
            className="w-full h-full object-cover object-center"
            style={{ transform: 'scale(1.06)', filter: 'brightness(0.48)' }} />
          {/* gradient ซ้าย → ขวา ให้ text ซ้ายอ่านได้ */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(105deg, rgba(10,10,10,0.95) 32%, rgba(10,10,10,0.55) 60%, rgba(10,10,10,0.12) 100%)' }} />
          {/* gradient ล่าง */}
          <div className="absolute bottom-0 inset-x-0 h-48"
            style={{ background: 'linear-gradient(to top, #0a0a0a, transparent)' }} />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen px-8 md:px-16 py-10">
          {/* บน: Logo + tagline */}
          <div style={{ animation: 'fadeUp .8s .1s both' }}>
            <img src={LOGO} alt="Creatr365"
              style={{ height: '28px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: '10px' }} />
            <p style={{ fontSize: '11px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
              A Creative House for the Future of Live Commerce.
            </p>
          </div>

          {/* กลาง → ล่าง: headline */}
          <div className="mt-auto">
            <h1 style={{ fontWeight: 900, lineHeight: '0.93', marginBottom: '32px', animation: 'fadeUp .85s .22s both', fontSize: 'clamp(3.6rem, 8.5vw, 6.8rem)' }}>
              <span style={{ color: '#ffffff', display: 'block' }}>BE A</span>
              <span style={{ color: '#ffffff', display: 'block' }}>CREATOR</span>
              <span style={{ color: RED, display: 'block' }}>.</span>
              <span style={{ color: 'rgba(255,255,255,0.22)', display: 'block', fontSize: '0.52em', letterSpacing: '0.06em', marginTop: '6px' }}>NOT A CONSUMER.</span>
            </h1>

            {/* ปุ่ม */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px', animation: 'fadeUp .85s .36s both' }}>
              <Link to="/courses"
                className="group"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 32px', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'opacity .2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                BEGIN NOW <ArrowRight size={16} />
              </Link>
              <Link to="/auth"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                FREE ACCOUNT
              </Link>
            </div>

            {/* บรรทัดล่างสุด — tagline ขนาดเล็ก */}
            <p style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgba(255,255,255,0.45)', animation: 'fadeUp .85s .5s both', maxWidth: '600px' }}>
              เพราะอนาคตของ Live Commerce ไม่ใช่แค่การขายของ&nbsp; แต่คือการ{' '}
              <strong style={{ color: '#ffffff', fontWeight: 700 }}>สร้างคุณค่า</strong>{' '}
              <strong style={{ color: '#ffffff', fontWeight: 700 }}>สร้างอิทธิพล</strong>{' '}
              และ<strong style={{ color: '#ffffff', fontWeight: 700 }}>สร้างอาชีพที่ยั่งยืน</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          §2  STATS
          BG: graph-section2.png เต็มหน้า ไม่มีอะไรทับ
          แสดงตัวเลข count-up ด้านบน เมื่อ scroll ถึง
          คลิก = modal แสดง source
      ══════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '420px' }}>
        {/* BG รูปกราฟ — เต็มหน้า ไม่มีอะไรทับ */}
        <img src="/images/graph-section2.png" alt="Market Data"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.82)' }} />
        {/* overlay บางมากแค่ให้อ่าน text ได้ */}
        <div className="absolute inset-0" style={{ background: 'rgba(10,10,10,0.38)' }} />

        <div ref={statsEl} className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', background: 'rgba(255,255,255,0.06)' }}>
            {STATS.map((s, i) => (
              <button key={i} onClick={() => setModal(true)}
                className="reveal"
                style={{
                  background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(12px)', padding: '28px 24px',
                  textAlign: 'left', border: 'none', cursor: 'pointer', transitionDelay: `${i * 80}ms`,
                  transition: 'background .3s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,51,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(10,10,10,0.55)')}>
                <p style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, color: '#fff', marginBottom: '8px', fontVariantNumeric: 'tabular-nums' }}>
                  <CountUp v={s.v} trigger={trig} />
                </p>
                <p style={{ fontSize: '13px', lineHeight: '1.55', color: 'rgba(255,255,255,0.75)', marginBottom: '6px' }}>{s.l}</p>
                <p style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{s.src}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setModal(true)}
            style={{ marginTop: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.32)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', letterSpacing: '0.2em' }}>
            ดูแหล่งอ้างอิง →
          </button>
        </div>
      </section>

      {/* Stats Source Modal */}
      {modal && (
        <div onClick={() => setModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', maxWidth: '520px', width: '100%', animation: 'popIn .22s cubic-bezier(.16,1,.3,1)', position: 'relative' }}>
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            <p style={{ fontSize: '10px', letterSpacing: '0.42em', textTransform: 'uppercase', color: RED, marginBottom: '20px', fontWeight: 700 }}>Market Insight — แหล่งอ้างอิง</p>
            <img src="/images/graph-section2.png" alt="" style={{ width: '100%', marginBottom: '20px', opacity: 0.92 }} />
            {STATS.map((s, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>{s.v}</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '3px' }}>{s.l}</p>
                <p style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginTop: '4px' }}>Source: {s.src}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════
          §4  อยากร่วมงานกับแบรนด์ใหญ่?
          BG: สีเข้มตามธีม ไม่ใส่รูป
          Cards: Hover → Zoom image + slide-up text
      ══════════════════════════ */}
      <section style={{ background: '#080808', padding: '80px 0' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 24px' }}>
          <div className="reveal" style={{ marginBottom: '52px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.6rem)', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>อยากร่วมงานกับแบรนด์ใหญ่ ?</h2>
            <p style={{ fontSize: '18px', fontWeight: 300, color: 'rgba(255,255,255,0.48)' }}>สิ่งที่ตลาดต้องการ คือ…</p>
          </div>

          {/* แถวบน 4 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            {BRAND_TOP.map((c, i) => <BrandCard key={i} c={c} delay={i * 0.07} />)}
          </div>
          {/* แถวล่าง 3 — centered */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '990px', margin: '0 auto 48px' }}>
            {BRAND_BTM.map((c, i) => <BrandCard key={i} c={c} delay={(i + 4) * 0.07} />)}
          </div>

          {/* ปุ่ม */}
          <div className="reveal" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/courses"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 36px', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              ดูหลักสูตร <ArrowRight size={15} />
            </Link>
            <Link to="/articles/diagnostic-quiz"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 36px', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.42)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
              ▷ Find Your Path
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          §5  เป็นเหมือนกันไหม?
          BG: ringlight-back1.png เต็ม, text ขวา
      ══════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '80vh' }}>
        <img src="/images/ringlight-back1.png" alt=""
          className="absolute inset-0 w-full h-full object-cover object-left"
          style={{ filter: 'brightness(0.55)' }} />
        {/* Gradient ซ้าย transparent, ขวาเข้ม */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.1) 35%, rgba(10,10,10,0.85) 60%, rgba(10,10,10,0.97) 100%)' }} />

        <div className="relative z-10" style={{ maxWidth: '1320px', margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', minHeight: '80vh' }}>
          {/* col ซ้าย — ว่าง (BG image อยู่ด้านนี้) */}
          <div />
          {/* col ขวา — text */}
          <div className="reveal">
            <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, color: '#fff', marginBottom: '36px', lineHeight: '1.1' }}>
              เป็นเหมือนกันไหม ?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '56px' }}>
              {[
                'ไลฟ์แล้วไม่มีคนดู? ไม่มีคนแชร์?',
                'ทำยังไงให้คนอยู่ต่อ? ปิดการขายยังไง?',
                'ต้องใช้สคริปต์หรือเทคนิคอะไรดี?',
                'จะพูดอย่างไรเพื่อให้เกิดรายรับในไลฟ์?',
              ].map((q, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: RED, flexShrink: 0, marginTop: '8px' }} />
                  <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 500, color: '#ffffff', lineHeight: '1.5' }}>{q}</p>
                </div>
              ))}
            </div>
            {/* Logo + tagline ล่างสุด กึ่งกลาง */}
            <div style={{ textAlign: 'center' }}>
              <img src={LOGO} alt="Creatr365"
                style={{ height: '22px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', display: 'inline-block', marginBottom: '6px' }} />
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)' }}>A Creative House for the Future of Live Commerce.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          §6  เพราะเราเจอปัญหามาก่อน
          BG: problem-up.png เต็มหน้า, text ซ้าย
      ══════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '70vh' }}>
        <img src="/images/problem-up.png" alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.42)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, rgba(10,10,10,0.96) 38%, rgba(10,10,10,0.5) 65%, rgba(10,10,10,0.15) 100%)' }} />

        <div className="relative z-10" style={{ maxWidth: '1320px', margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', minHeight: '70vh' }}>
          <div className="reveal">
            <img src={LOGO} alt="Creatr365"
              style={{ height: '22px', width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: '6px' }} />
            <p style={{ fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>WELCOME TO CREATR365'S FAMILY</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: '1.2', marginBottom: '24px' }}>
              ทุกคอร์สการเรียนรู้<br />
              <span style={{ color: RED }}>สร้างจากประสบการณ์จริง</span>
            </h2>
            <div style={{ borderLeft: `2px solid ${RED}60`, paddingLeft: '20px', marginBottom: '24px' }}>
              {['ด้วยพื้นฐานความเข้าใจในปัญหา', 'และถอดทุกประสบการณ์จริงจากอาชีพ Live Commerce', 'มาสร้างเป็นเนื้อหาการเรียนรู้ที่ครบในทุกมิติ'].map((t, i) => (
                <p key={i} style={{ fontSize: '15px', lineHeight: '1.8', color: 'rgba(255,255,255,0.72)' }}>{t}</p>
              ))}
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', fontStyle: 'italic' }}>
              หากคุณต้องการ "เรียนแค่ทฤษฎีการไลฟ์" หรือ "การสอนแบบจับมือทำ"&nbsp;
              <span style={{ fontStyle: 'normal', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>ที่นี่… ไม่ใช่ของคุณ</span>
            </p>
          </div>
          <div /> {/* ว่าง — BG image แสดงด้านขวา */}
        </div>
      </section>

      {/* ══════════════════════════
          §7  BRAND PROMISE
          BG: Team-work.jpg (ไฟล์ที่มีจริงคือ team-work.jpg)
          ซ้าย: 2×2 course images ไม่มีแท็กชื่อ
          ขวา: team photo ตัดออก เพราะ BG คือ team แล้ว
          ล่างสุด: Free gift marquee
      ══════════════════════════ */}
      <section style={{ background: '#060606', padding: '80px 0 0' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 24px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.48em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '10px' }}>WELCOME TO CREATR365'S FAMILY</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff' }}>
              หลักสูตรที่เลือกได้<span style={{ color: RED }}>ตามสไตล์คุณ</span>
            </h2>
          </div>

          {/* Layout: team BG + 4 course images ซ้าย */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'start' }}>
            {/* Left: 2×2 course images */}
            <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                '/images/pro-course-online.png',
                '/images/pro-AI-Tech.png',
                '/images/pro-workshop-liveclass.png',
                '/images/pro-community-network.png',
              ].map((src, i) => (
                <div key={i} style={{ aspectRatio: '1', overflow: 'hidden' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s', }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                </div>
              ))}
            </div>
            {/* Right: team photo */}
            <div className="reveal" style={{ overflow: 'hidden', height: '100%', minHeight: '340px' }}>
              <img src="/images/team-work.jpg" alt="Creatr365 Team"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.82)', transition: 'transform .7s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
            </div>
          </div>
        </div>

        {/* Marquee Free gifts */}
        <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 0', marginTop: '32px', background: '#0d0d0d' }}>
          <div style={{ display: 'flex', whiteSpace: 'nowrap', gap: '48px', animation: 'marqueeRun 24s linear infinite' }}>
            {Array(6).fill(['Free Gift ทั้งหมด : Free - Template', 'Free - Ebook', 'Free - Vocabulary guide', 'Free - Document Form', 'Free - Checklist']).flat().map((t, i) => (
              <span key={i} style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.48)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: RED, display: 'inline-block', flexShrink: 0 }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          §8  CURRICULUM 3 TIERS
          แต่ละ tier = full-width BG image (รูปคอร์ส)
          Accordion เปิด → แสดง course cards + slide in from right
      ══════════════════════════ */}
      <section style={{ background: '#080808', padding: '80px 0' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 24px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '52px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.44em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginBottom: '10px' }}>CURRICULUM</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff' }}>หลักสูตร 3 ชั้น</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TIERS.map((t) => {
              const isOpen = openTier === t.id;
              return (
                <div key={t.id} className="reveal"
                  style={{ border: `1px solid ${isOpen ? RED + '40' : 'rgba(255,255,255,0.07)'}`, overflow: 'hidden', transition: 'border-color .35s', boxShadow: isOpen ? `0 0 0 1px ${RED}18` : 'none' }}>
                  {/* Header = clickable BG image */}
                  <button onClick={() => toggleTier(t.id)}
                    style={{ position: 'relative', width: '100%', height: 'clamp(200px, 28vw, 320px)', display: 'flex', alignItems: 'flex-end', cursor: 'pointer', border: 'none', padding: 0, overflow: 'hidden', background: '#0a0a0a' }}>
                    <img src={t.bg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.65)', transition: 'transform .7s' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                    {/* gradient ล่าง */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 55%, transparent 100%)' }} />

                    {/* Logo + family บนซ้าย */}
                    <div style={{ position: 'absolute', top: '16px', left: '20px' }}>
                      <img src={LOGO} alt="Creatr365" style={{ height: '18px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.65 }} />
                      <p style={{ fontSize: '8px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>WELCOME TO CREATR365'S FAMILY</p>
                    </div>

                    {/* Badge */}
                    {t.badge && (
                      <div style={{ position: 'absolute', top: '44px', left: '20px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, padding: '3px 8px', border: `1px solid ${RED}`, color: RED, letterSpacing: '0.12em' }}>{t.badge}</span>
                      </div>
                    )}

                    {/* Headline ล่างซ้าย */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', padding: '16px 20px' }}>
                      <h3 style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', fontWeight: 900, lineHeight: '0.95', color: '#fff', textAlign: 'left' }}>
                        {t.headline}<span style={{ color: RED }}>{t.red}</span>
                      </h3>
                      <ChevronDown size={22} style={{ color: isOpen ? RED : 'rgba(255,255,255,0.4)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .35s', flexShrink: 0, marginBottom: '4px' }} />
                    </div>
                  </button>

                  {/* Accordion body */}
                  <div style={{ maxHeight: isOpen ? '900px' : '0', overflow: 'hidden', transition: 'max-height .5s cubic-bezier(.4,0,.2,1)', opacity: isOpen ? 1 : 0, transitionProperty: 'max-height, opacity' }}>
                    <div style={{ padding: '24px 20px 28px', background: '#0c0c0c' }}>
                      {/* Course cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: t.courses.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '10px', maxWidth: t.courses.length === 1 ? '480px' : '100%' }}>
                        {t.courses.map((c, ci) => {
                          const isCS = c.tag === 'COMING SOON';
                          const isFree = c.tag === 'FREE';
                          return (
                            <div key={ci}
                              style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', padding: '20px', animation: isOpen ? `slideInRight .4s cubic-bezier(.16,1,.3,1) ${ci * 80}ms both` : 'none', transition: 'border-color .25s' }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                              {isCS && <p style={{ fontSize: '10px', fontWeight: 900, color: RED, letterSpacing: '0.18em', marginBottom: '8px' }}>★ MASTERCLASS</p>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                                <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', fontWeight: 900, color: '#fff', lineHeight: '1.2' }}>{c.name}</p>
                                <span style={{ fontSize: '9px', fontWeight: 900, padding: '3px 7px', border: `1px solid ${isFree ? '#34A85350' : 'rgba(255,255,255,0.1)'}`, color: isFree ? '#34A853' : isCS ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.45)', flexShrink: 0, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
                                  {c.tag}
                                </span>
                              </div>
                              <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.38)', marginBottom: '14px', fontStyle: 'italic' }}>{c.sub}</p>
                              {!isCS && c.link ? (
                                <Link to={c.link}
                                  style={{ fontSize: '11px', fontWeight: 700, color: isFree ? '#34A853' : 'rgba(255,255,255,0.38)', textDecoration: 'none', letterSpacing: '0.18em', textTransform: 'uppercase' }}
                                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                                  เพิ่มเติม →
                                </Link>
                              ) : (
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.15em' }}>coming soon</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Tier 3: also includes */}
                      {t.also && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px' }}>
                          <p style={{ fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '12px' }}>And</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {t.also.map((a, ai) => (
                              <Link key={ai} to={a.link}
                                style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', padding: '14px', textDecoration: 'none', display: 'block', transition: 'border-color .2s' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{a.name}</p>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.32)', fontStyle: 'italic' }}>{a.sub}</p>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '8px', letterSpacing: '0.15em' }}>เพิ่มเติม →</p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          §9  BRAND CONCEPT
          BG: team-behind.png (ไฟล์จริงที่มี)
      ══════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '60vh' }}>
        <img src="/images/team-behind.png" alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.35)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(10,10,10,0.94) 40%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.18) 100%)' }} />
        <div className="relative z-10" style={{ maxWidth: '1320px', margin: '0 auto', padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="reveal">
            <p style={{ fontSize: '10px', letterSpacing: '0.48em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginBottom: '20px' }}>BRAND CONCEPT</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', fontWeight: 900, color: '#fff', lineHeight: '1.2', marginBottom: '20px' }}>
              เราไม่สัญญาว่าเรียนจบแล้ว<br /><span style={{ color: RED }}>คุณจะรวย</span>
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.9', color: 'rgba(255,255,255,0.65)', maxWidth: '520px', margin: '0 auto 16px' }}>
              แต่เราจะให้คุณ <strong style={{ color: '#fff' }}>"ได้ทำ"</strong> เพื่อเอาไปปรับใช้ในการไลฟ์ที่คุณ <strong style={{ color: '#fff' }}>"ทำได้"</strong> จริง
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
              "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง แต่คือการสร้างธุรกิจที่เติบโตได้"
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          §10  JOURNEY
          BG: journey-stairs.jpg เต็มหน้า
          บนซ้าย: text
          ล่างขวา: ปุ่ม
      ══════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '88vh' }}>
        <img src="/images/journey-stairs.jpg" alt="Journey"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.62)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.15) 45%, rgba(10,10,10,0.68) 82%, #0a0a0a 100%)' }} />

        {/* top-left text */}
        <div className="relative z-10 reveal" style={{ position: 'absolute', top: '40px', left: 'clamp(24px, 6vw, 80px)', zIndex: 10 }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
            CONSUMER → CREATOR
          </p>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, color: '#fff', lineHeight: '1.05' }}>
            YOUR JOURNEY<br /><span style={{ color: RED }}>STARTS HERE.</span>
          </h2>
        </div>

        {/* bottom-right buttons */}
        <div className="reveal" style={{ position: 'absolute', bottom: '48px', right: 'clamp(24px, 6vw, 80px)', zIndex: 10, display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/courses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 36px', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            เริ่มเส้นทางของคุณ <ArrowRight size={15} />
          </Link>
          <Link to="/auth"
            style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', border: '1px solid rgba(255,255,255,0.24)', color: 'rgba(255,255,255,0.68)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.48)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)'; e.currentTarget.style.color = 'rgba(255,255,255,0.68)'; }}>
            Free Account
          </Link>
        </div>
      </section>

      {/* ══════════════════════════
          §11  WHY CREATR365 DIFFERENCE?
          2 คอลัมน์: ที่อื่น / CREATR365
      ══════════════════════════ */}
      <section style={{ background: '#060606', padding: '80px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
          <div className="reveal" style={{ marginBottom: '44px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff' }}>
              WHY <span style={{ color: RED }}>CREATR365</span><br />DIFFERENCE?
            </h2>
          </div>
          <div className="reveal" style={{ border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            {/* header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ padding: '14px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>ที่อื่น</span>
              </div>
              <div style={{ padding: '14px 20px', textAlign: 'center', background: `${RED}12` }}>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: RED }}>CREATR365</span>
              </div>
            </div>
            {WHY.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.012)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.012)' }}>
                  <X size={13} style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0, marginTop: '3px' }} />
                  <p style={{ fontSize: '13px', lineHeight: '1.55', color: 'rgba(255,255,255,0.35)' }}>{row.them}</p>
                </div>
                <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: `${RED}05` }}>
                  <Check size={13} style={{ color: '#34A853', flexShrink: 0, marginTop: '3px' }} />
                  <p style={{ fontSize: '13px', lineHeight: '1.55', color: 'rgba(255,255,255,0.78)' }}>{row.us}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          §12  CTA
      ══════════════════════════ */}
      <section style={{ background: '#080808', padding: '80px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <div className="reveal">
            <p style={{ fontSize: '17px', lineHeight: '1.8', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', marginBottom: '20px' }}>
              "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง<br />
              แต่คือการสร้างธุรกิจที่เติบโตได้"
            </p>
            <p style={{ fontSize: '10px', letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>WELCOME TO CREATR365'S FAMILY</p>
            <h2 style={{ fontSize: 'clamp(3.5rem, 9vw, 7.5rem)', fontWeight: 900, lineHeight: '0.92', marginBottom: '36px' }}>
              <span style={{ color: '#fff', display: 'block' }}>BE A</span>
              <span style={{ color: RED, display: 'block' }}>CREATOR.</span>
              <span style={{ color: 'rgba(255,255,255,0.18)', display: 'block', fontSize: '0.5em', letterSpacing: '0.07em', marginTop: '4px' }}>NOT A CONSUMER.</span>
            </h2>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/courses"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 44px', background: RED, color: '#fff', fontWeight: 900, fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                BEGIN NOW <ArrowRight size={16} />
              </Link>
              <Link to="/auth"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '15px 36px', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
                Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER — เดิม preserved */}
      <footer style={{ background: '#040404', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '56px 24px' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px', marginBottom: '40px' }}>
            <div>
              <img src={LOGO} alt="Creatr365" style={{ height: '22px', width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)' }}>A Creative House for the Future of Live Commerce.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              {[['หลักสูตร', '/courses'], ['บทความ', '/articles'], ['FAQ', '/faq'], ['ติดต่อ', '/contact'], ['เข้าสู่ระบบ', '/auth']].map(([l, h]) => (
                <Link key={l} to={h} style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.24)' }}>
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {[['นโยบายความเป็นส่วนตัว', '/privacy'], ['ข้อกำหนดการใช้บริการ', '/terms'], ['นโยบายการคืนเงิน', '/refund-policy']].map(([l, h]) => (
                <Link key={l} to={h} style={{ color: 'rgba(255,255,255,0.24)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.24)')}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ─── Brand Card Component ─────────────────────────────── */
function BrandCard({ c, delay }: { c: { img: string; num: string; title: string; sub: string }; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="reveal"
      style={{ background: '#0e0e0e', border: `1px solid ${hovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}`, overflow: 'hidden', cursor: 'default', transitionDelay: `${delay}s`, transition: 'border-color .3s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {/* Image */}
      <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
        <img src={c.img} alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: hovered ? 0.88 : 0.65, transform: hovered ? 'scale(1.08)' : 'scale(1)', transition: 'transform .65s, opacity .35s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,14,14,0.96) 0%, rgba(14,14,14,0.4) 55%, transparent 100%)' }} />
        <span style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '10px', fontWeight: 900, color: `${RED}90`, letterSpacing: '0.1em' }}>{c.num}</span>
      </div>
      {/* Text */}
      <div style={{ padding: '14px 14px 16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: '1.4', marginBottom: '6px', whiteSpace: 'pre-line' }}>{c.title}</p>
        <p style={{ fontSize: '11px', lineHeight: '1.55', color: 'rgba(255,255,255,0.5)', maxHeight: hovered ? '80px' : '0', overflow: 'hidden', transition: 'max-height .45s ease' }}>
          {c.sub}
        </p>
      </div>
    </div>
  );
}
