import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, ChevronDown } from 'lucide-react';

const RED = '#CC0033';
const LOGO_URL = 'https://ik.imagekit.io/ideas365logo/w-logo-side.png';

/* ── Scroll reveal ── */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } }),
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    );
    const els = document.querySelectorAll('.js-reveal');
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
}

/* ── Count-up ── */
function useCountUp(target: string, trigger: boolean) {
  const [v, setV] = useState('—');
  useEffect(() => {
    if (!trigger) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setV(target); return; }
    const pre = target.match(/^[^0-9]*/)?.[0] ?? '';
    const suf = target.replace(/^[^0-9]*[\d.]+/, '');
    const dur = 1600; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setV(pre + (Math.round(e * num * 10) / 10).toLocaleString() + suf);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [trigger, target]);
  return v;
}

/* ── STATS data ── */
const STATS = [
  { v: '$172.9B', l: 'Live Commerce ทั่วโลก 2025', src: 'Grand View Research' },
  { v: '33.9%',   l: 'CAGR Live-Streaming E-Commerce 2024–2034', src: 'market.us' },
  { v: '1.1T฿',  l: 'ตลาด e-Commerce ไทย ปี 2024', src: 'Priceza' },
  { v: '+21.7%', l: 'ไทยโตเร็วที่สุดใน SEA', src: 'Momentum Works' },
];

/* ── BRAND cards (§4) – framed photo cards ── */
const BRAND_CARDS = [
  { img: '/images/brand1.png', num: '01', title: 'ปิดการขาย\nช่วยสร้างยอด ลดอัตราคืนสินค้า', sub: 'กลยุทธ์การพูดในไลฟ์ที่จัดการทั้งอารมณ์ และตัดสินใจซื้อสินค้าของผู้ชม' },
  { img: '/images/brand1.png', num: '02', title: 'รักษา Retention\nระหว่างไลฟ์', sub: 'ผู้ชมที่อยู่นานขึ้นคือโอกาสขายที่เพิ่มขึ้นตามไปด้วยทุกครั้ง' },
  { img: '/images/brand1.png', num: '03', title: 'สร้างความน่าเชื่อถือ\nต่อตัวเองและผลิตภัณฑ์', sub: 'วางตำแหน่งตัวเอง สร้างความไว้วางใจ และนำเสนอสินค้าที่น่าสนใจ' },
  { img: '/images/brand1.png', num: '04', title: 'สื่อสารสินค้า\nได้ตรงกลุ่ม', sub: 'เข้าใจสินค้า เข้าใจลูกค้า สื่อสารได้ตรงและมีผลตามความต้องการ' },
  { img: '/images/brand2.png', num: '05', title: 'คุมภาพลักษณ์\nแบรนด์ได้ดี', sub: 'สร้างภาพลักษณ์ที่มืออาชีพ น่าเชื่อถือ และเป็นตัวเองผ่านการไลฟ์ทุกครั้ง' },
  { img: '/images/brand2.png', num: '06', title: 'ทำงานแบบ Data-Driven\n+ ปรับแผนได้เร็ว', sub: 'เข้าใจข้อมูล วิเคราะห์ผลลัพธ์ และปรับกลยุทธ์ให้เดินต่อได้อย่างต่อเนื่อง' },
  { img: '/images/brand2.png', num: '07', title: 'ทำงานร่วมกับทีมหลังบ้าน\nได้รู้หน้าที่และพร้อม Support', sub: 'ทำงานร่วมกับทีมได้ทั้งในไลฟ์ทุกครั้ง เพื่อให้ไลฟ์ทำกำไรอย่างรวดเร็วและมีประสิทธิภาพ' },
];

/* ── CURRICULUM ── */
const TIERS = [
  {
    id: 't1', bg: '/images/i-can-live2.png',
    headline: 'ไลฟ์ให้เป็น', headlineRed: '',
    courses: [
      { name: 'THE MAGNET',    sub: 'READY FOR LIVE',    tag: 'FREE',   slug: 'the-magnet',    detail: 'เพิ่มเติม' },
      { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER',    tag: 'COURSE', slug: 'the-foundation', detail: 'เพิ่มเติม' },
    ],
  },
  {
    id: 't2', bg: '/images/i-can-sale2.png',
    headline: 'ไลฟ์ให้', headlineRed: 'ขายได้',
    courses: [
      { name: 'SIGNAL', sub: 'THE CONVERSION HOST : ONLINE',             tag: 'COURSE', slug: 'signal', detail: 'เพิ่มเติม' },
      { name: 'STAGE',  sub: 'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', tag: 'COURSE', slug: 'stage',  detail: 'เพิ่มเติม' },
    ],
  },
  {
    id: 't3', bg: '/images/i-can-reply1.png',
    headline: 'ไลฟ์ให้', headlineRed: 'วัดผลและทำซ้ำได้',
    courses: [
      { name: 'The BRAND ARCHITECT', sub: 'MASTERCLASS : ONSITE 2 DAYS', tag: 'COMING SOON', slug: '', detail: '' },
    ],
    also: [
      { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER',                      slug: 'the-foundation' },
      { name: 'SIGNAL',         sub: 'THE CONVERSION HOST : ONLINE',        slug: 'signal' },
      { name: 'STAGE',          sub: 'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', slug: 'stage' },
    ],
  },
];

/* ── WHY table ── */
const WHY = [
  { q: 'สอน "ทำไมได้ผล" ไม่ใช่แค่ "วิธีทำ"',       them: 'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube',           us: 'PPACT Framework 5 มิติ ฝังในทุกคอร์ส' },
  { q: 'สร้าง Identity ที่แบรนด์ต้องการ',            them: 'เน้นเทคนิคตะโกนขายหรือสร้าง Hype',            us: 'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด' },
  { q: 'ขับเคลื่อนด้วยข้อมูล ไม่ใช่ความรู้สึก',     them: 'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข',      us: 'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools' },
  { q: 'ระบบที่รันได้เอง ไม่ต้องพึ่งโฮสต์คนเดียว', them: 'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย',          us: 'Brand Host Architect — วางระบบ Production ทั้งทีม' },
  { q: 'มาตรฐานวิชาชีพที่วัดผลได้จริง',              them: 'เรียนจบไม่รู้จะทำอะไรต่อ',                    us: 'Key Collection System™ มาตรฐานอุตสาหกรรม' },
];

/* ═══════════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════════ */
export default function Home() {
  useReveal();

  /* Hero parallax */
  const heroBgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (heroBgRef.current) heroBgRef.current.style.transform = `translateY(${window.scrollY * 0.22}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Stats trigger */
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsTrig, setStatsTrig] = useState(false);
  useEffect(() => {
    const el = statsRef.current; if (!el) return;
    const obs = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setStatsTrig(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  /* Stats modal */
  const [modal, setModal] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(false); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  /* Tier accordion */
  const [tier, setTier] = useState<string | null>(null);
  const toggleTier = useCallback((id: string) => setTier(p => p === id ? null : id), []);

  return (
    <main className="bg-[#0a0a0a] overflow-x-hidden">

      {/* ══════════════════════════════════════════
          §1  HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* BG parallax */}
        <div ref={heroBgRef} className="absolute inset-0 z-0 will-change-transform">
          <img src="/images/hero-team.jpg" alt="" className="w-full h-full object-cover object-center scale-110"
            style={{ filter: 'brightness(0.52)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg,rgba(10,10,10,0.92) 36%,rgba(10,10,10,0.5) 62%,rgba(10,10,10,0.18) 100%)' }} />
          <div className="absolute bottom-0 inset-x-0 h-64" style={{ background: 'linear-gradient(to top,#0a0a0a,transparent)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full min-h-screen px-8 md:px-16 pt-24 pb-16">
          {/* Logo + eyebrow */}
          <div className="hero-fade-1">
            <img src={LOGO_URL} alt="Creatr365" className="h-8 md:h-10 w-auto object-contain mb-4" style={{ filter: 'brightness(0) invert(1)' }} />
            <p className="text-white text-xs md:text-sm font-light tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>
              A Creative House for the Future of Live Commerce.
            </p>
          </div>

          {/* Big headline — bottom left */}
          <div className="mt-auto">
            <div className="hero-fade-2 mb-6">
              <h1 className="font-black text-white leading-[0.92]" style={{ fontSize: 'clamp(3.5rem,9vw,7rem)' }}>
                BE A<br />
                <span className="text-white">CREATOR</span><span style={{ color: RED }}>.</span><br />
                <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.62em', letterSpacing: '0.05em' }}>NOT A CONSUMER.</span>
              </h1>
            </div>

            {/* CTA buttons */}
            <div className="hero-fade-3 flex flex-col sm:flex-row gap-4 mb-8">
              <Link to="/courses"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-white font-bold text-sm tracking-[0.22em] uppercase"
                style={{ background: RED }}>
                BEGIN NOW <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link to="/auth"
                className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold border border-white/18 hover:border-white/40 transition-all uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.6)' }}>
                FREE ACCOUNT
              </Link>
            </div>

            {/* Bottom tagline */}
            <p className="hero-fade-4 text-sm md:text-base leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
              เพราะอนาคตของ Live Commerce ไม่ใช่แค่การขายของ&nbsp;&nbsp;
              แต่คือการ{' '}
              <span className="text-white font-bold">สร้างคุณค่า</span>{' '}
              <span className="text-white font-bold">สร้างอิทธิพล</span>{' '}
              และ<span className="text-white font-bold">สร้างอาชีพที่ยั่งยืน</span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          §2  STATS — graph-section2.png BG + count-up
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/graph-section2.png" alt="" className="w-full h-full object-cover object-center opacity-90" />
          <div className="absolute inset-0" style={{ background: 'rgba(10,10,10,0.55)' }} />
        </div>
        <div ref={statsRef} className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {STATS.map((s, i) => {
              const val = useCountUp(s.v, statsTrig);
              return (
                <button key={i} onClick={() => setModal(true)}
                  className="js-reveal bg-black/40 backdrop-blur-sm p-7 text-left hover:bg-black/60 transition-all duration-300 group"
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  <p className="text-3xl sm:text-5xl font-black text-white mb-2 tabular-nums tracking-tight">
                    {statsTrig ? val : '—'}
                  </p>
                  <p className="text-sm leading-relaxed mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>{s.l}</p>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.src}</p>
                  <div className="mt-3 h-0.5 w-0 group-hover:w-full transition-all duration-500" style={{ background: RED }} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModal(false)}>
          <div className="relative max-w-lg w-full bg-[#111] border border-white/10 p-8 rounded-sm"
            style={{ animation: 'popIn .25s cubic-bezier(.16,1,.3,1)' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white text-xl">✕</button>
            <p className="text-xs font-bold tracking-[0.44em] uppercase mb-6" style={{ color: RED }}>Market Insight — แหล่งอ้างอิง</p>
            <img src="/images/graph-section2.png" alt="Market Data" className="w-full rounded-sm mb-6 opacity-90" />
            {STATS.map((s, i) => (
              <div key={i} className="border-b border-white/6 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                <p className="text-2xl font-black text-white">{s.v}</p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{s.l}</p>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.32)' }}>Source: {s.src}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          §4  อยากร่วมงานกับแบรนด์ใหญ่?
          (§3 MARQUEE removed per instructions)
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 px-6" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto">
          <div className="js-reveal mb-14">
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-2">อยากร่วมงานกับแบรนด์ใหญ่ ?</h2>
            <p className="text-lg sm:text-2xl font-light" style={{ color: 'rgba(255,255,255,0.55)' }}>สิ่งที่ตลาดต้องการ คือ…</p>
          </div>

          {/* Top row — 4 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {BRAND_CARDS.slice(0, 4).map((c, i) => (
              <BrandCard key={i} c={c} delay={i * 0.08} />
            ))}
          </div>
          {/* Bottom row — 3 cards centered */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
            {BRAND_CARDS.slice(4).map((c, i) => (
              <BrandCard key={i} c={c} delay={(i + 4) * 0.08} />
            ))}
          </div>

          {/* CTA buttons centered */}
          <div className="js-reveal flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-bold text-sm tracking-[0.22em] uppercase"
              style={{ background: RED }}>
              ดูหลักสูตร <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/articles/diagnostic-quiz"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm border border-white/18 hover:border-white/35 transition-all uppercase tracking-[0.18em]"
              style={{ color: 'rgba(255,255,255,0.62)' }}>
              ▷ Find Your Path
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          §5  เป็นเหมือนกันไหม? — ringlight-back1 BG
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '80vh' }}>
        <div className="absolute inset-0 z-0">
          <img src="/images/ringlight-back1.png" alt="" className="w-full h-full object-cover object-left opacity-85"
            style={{ filter: 'brightness(0.6)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, #0a0a0a 0%, rgba(10,10,10,0.65) 45%, rgba(10,10,10,0.1) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* Right col — text (visual is on left via BG) */}
          <div className="lg:col-start-2 js-reveal">
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-10 leading-tight">เป็นเหมือนกันไหม ?</h2>
            <div className="space-y-5">
              {[
                'ไลฟ์แล้วไม่มีคนดู? ไม่มีคนแชร์?',
                'ทำยังไงให้คนอยู่ต่อ? ปิดการขายยังไง?',
                'ต้องใช้สคริปต์หรือเทคนิคอะไรดี?',
                'จะพูดอย่างไรเพื่อให้เกิดรายรับในไลฟ์?',
              ].map((q, i) => (
                <div key={i} className="js-reveal flex items-start gap-3" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="w-2 h-2 rounded-full mt-2.5 flex-shrink-0" style={{ background: RED }} />
                  <p className="text-lg sm:text-xl font-medium text-white leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
            {/* Logo bottom center */}
            <div className="mt-16 text-center lg:text-left">
              <img src={LOGO_URL} alt="Creatr365" className="h-7 w-auto object-contain inline-block mb-2"
                style={{ filter: 'brightness(0) invert(1)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
                A Creative House for the Future of Live Commerce.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          §6  เพราะเราเจอปัญหามาก่อน — problem-up BG
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-28 px-6">
        <div className="absolute inset-0 z-0">
          <img src="/images/problem-up.png" alt="" className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.45)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(10,10,10,0.92) 40%,rgba(10,10,10,0.5) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="js-reveal mb-10">
            <img src={LOGO_URL} alt="Creatr365" className="h-8 w-auto mb-4" style={{ filter: 'brightness(0) invert(1)' }} />
            <p className="text-xs uppercase tracking-[0.4em] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>WELCOME TO CREATR365'S FAMILY</p>
          </div>
          <div className="js-reveal">
            <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-8">
              ทุกคอร์สการเรียนรู้<br />
              <span style={{ color: RED }}>สร้างจากประสบการณ์จริง</span>
            </h2>
            <div className="max-w-xl space-y-3 border-l-2 pl-6" style={{ borderColor: `${RED}60` }}>
              {[
                'ด้วยพื้นฐานความเข้าใจในปัญหา',
                'และถอดทุกประสบการณ์จริงจากอาชีพ Live Commerce',
                'มาสร้างเป็นเนื้อหาการเรียนรู้ที่ครบในทุกมิติ',
              ].map((t, i) => (
                <p key={i} className="text-base sm:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{t}</p>
              ))}
            </div>
            <p className="mt-8 text-sm italic" style={{ color: 'rgba(255,255,255,0.38)' }}>
              หากคุณต้องการ "เรียนแค่ทฤษฎีการไลฟ์" หรือ "การสอนแบบจับมือทำ"&nbsp;
              <span className="not-italic font-bold text-white">ที่นี่… ไม่ใช่ของคุณ</span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          §7  BRAND PROMISE — Team-work1.jpg BG
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 px-6" style={{ background: '#060606' }}>
        <div className="max-w-7xl mx-auto">
          <div className="js-reveal text-center mb-12">
            <p className="text-xs uppercase tracking-[0.48em] mb-3" style={{ color: 'rgba(255,255,255,0.38)' }}>WELCOME TO CREATR365'S FAMILY</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              หลักสูตรที่เลือกได้<span style={{ color: RED }}>ตามสไตล์คุณ</span>
            </h2>
          </div>

          {/* Layout: left = 4 course images, right = team photo */}
          <div className="grid lg:grid-cols-2 gap-6 items-start mb-6">
            {/* Left: 2x2 grid — no labels */}
            <div className="grid grid-cols-2 gap-3">
              {[
                '/images/pro-course-online.png',
                '/images/pro-AI-tech.png',
                '/images/pro-workshop-liveclass.png',
                '/images/pro-community.png',
              ].map((src, i) => (
                <div key={i} className="js-reveal aspect-square overflow-hidden group" style={{ transitionDelay: `${i * 0.08}s` }}>
                  <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-100" />
                </div>
              ))}
            </div>
            {/* Right: team photo */}
            <div className="js-reveal overflow-hidden" style={{ transitionDelay: '0.12s', height: 'clamp(320px,45vw,540px)' }}>
              <img src="/images/Team-work1.jpg" alt="Creatr365 Team"
                className="w-full h-full object-cover object-center hover:scale-[1.02] transition-transform duration-700"
                style={{ filter: 'brightness(0.82)' }} />
            </div>
          </div>

          {/* Free gift marquee */}
          <div className="overflow-hidden border-y border-white/6 py-3" style={{ background: '#0d0d0d' }}>
            <div className="flex whitespace-nowrap gap-12" style={{ animation: 'marqueeScroll 22s linear infinite' }}>
              {Array(4).fill([
                'Free Gift ทั้งหมด : Free - Template',
                'Free - Ebook',
                'Free - Vocabulary guide',
                'Free - Document Form',
                'Free - Checklist',
              ]).flat().map((t, i) => (
                <span key={i} className="text-xs sm:text-sm font-bold tracking-[0.25em] uppercase flex-shrink-0 flex items-center gap-3"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: RED }} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          §8  CURRICULUM — 3 full-bg tier sections
      ══════════════════════════════════════════ */}
      <section className="py-16 px-6" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto">
          <div className="js-reveal mb-14 text-center">
            <p className="text-xs uppercase tracking-[0.44em] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>CURRICULUM</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white">หลักสูตร 3 ชั้น</h2>
          </div>

          <div className="space-y-4">
            {TIERS.map((t) => {
              const isOpen = tier === t.id;
              return (
                <div key={t.id} className="js-reveal relative overflow-hidden border border-white/7"
                  style={{ background: '#0a0a0a', boxShadow: isOpen ? `0 0 0 1px ${RED}25` : 'none' }}>
                  {/* Accordion header with BG image */}
                  <button className="w-full relative h-[220px] sm:h-[280px] flex items-end group overflow-hidden"
                    onClick={() => toggleTier(t.id)}>
                    <img src={t.bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-[1.03] transition-transform duration-700" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.4) 55%, transparent 100%)' }} />
                    {/* Logo top-left */}
                    <div className="absolute top-4 left-5">
                      <img src={LOGO_URL} alt="Creatr365" className="h-5 w-auto" style={{ filter: 'brightness(0) invert(1)', opacity: 0.7 }} />
                      <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>WELCOME TO CREATR365'S FAMILY</p>
                    </div>
                    {/* Tier number + Don't miss badge */}
                    {t.id === 't3' && (
                      <div className="absolute top-4 left-5 mt-10">
                        <span className="text-xs font-black px-2 py-1 border" style={{ color: RED, borderColor: RED }}>DON'T MISS!</span>
                      </div>
                    )}
                    {/* Headline bottom-left */}
                    <div className="relative z-10 flex items-end justify-between w-full px-5 pb-4">
                      <h3 className="text-5xl sm:text-7xl font-black leading-none">
                        <span className="text-white">{t.headline}</span>
                        {t.headlineRed && <span style={{ color: RED }}>{'\n' + t.headlineRed}</span>}
                      </h3>
                      <ChevronDown className="w-6 h-6 text-white/50 transition-transform duration-400 flex-shrink-0 mb-2"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                    </div>
                  </button>

                  {/* Accordion body */}
                  <div style={{ maxHeight: isOpen ? '800px' : '0px', overflow: 'hidden', transition: 'max-height .5s cubic-bezier(.4,0,.2,1), opacity .35s ease', opacity: isOpen ? 1 : 0 }}>
                    <div className="px-5 pb-8 pt-5">
                      {/* Course cards */}
                      <div className={`grid gap-3 ${t.courses.length === 1 ? 'max-w-md' : 'sm:grid-cols-2'}`}>
                        {t.courses.map((c, ci) => {
                          const isCS = c.tag === 'COMING SOON';
                          const isFree = c.tag === 'FREE';
                          return (
                            <div key={ci} className="border border-white/8 p-5 hover:border-white/15 transition-all"
                              style={{ background: '#111', animation: isOpen ? `slideRight .4s cubic-bezier(.16,1,.3,1) ${ci * 90}ms both` : 'none' }}>
                              {isCS && <p className="text-xs font-black tracking-widest mb-3" style={{ color: RED }}>★ MASTERCLASS</p>}
                              <p className="text-white font-black text-lg leading-tight">{c.name}</p>
                              <p className="text-xs tracking-widest mt-1 mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                <em>{c.sub}</em>
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black px-2 py-1 border"
                                  style={{ color: isFree ? '#34A853' : isCS ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.45)', borderColor: isFree ? '#34A85340' : 'rgba(255,255,255,0.08)' }}>
                                  {c.tag}
                                </span>
                                {c.detail && !isCS && (
                                  <Link to={`/courses`} className="text-xs font-bold underline underline-offset-2 hover:opacity-70 transition-opacity"
                                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {c.detail}
                                  </Link>
                                )}
                                {isCS && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>(coming soon)</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Tier 3 also-includes */}
                      {t.also && (
                        <div className="mt-5 border-t border-white/6 pt-5">
                          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>And</p>
                          <div className="grid sm:grid-cols-3 gap-3">
                            {t.also.map((a, ai) => (
                              <Link key={ai} to={a.slug ? `/courses` : '#'}
                                className="border border-white/6 p-4 hover:border-white/14 transition-all group"
                                style={{ background: '#0e0e0e' }}>
                                <p className="text-white font-bold text-sm group-hover:text-white transition-colors">{a.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}><em>{a.sub}</em></p>
                                <p className="text-xs mt-2 font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>เพิ่มเติม →</p>
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

      {/* ══════════════════════════════════════════
          §9  BRAND CONCEPT — Team-behind1.png BG
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-28 px-6">
        <div className="absolute inset-0 z-0">
          <img src="/images/Team-behind1.png" alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0a0a0a 42%,rgba(10,10,10,0.65) 68%,rgba(10,10,10,0.2) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto js-reveal text-center">
          <p className="text-xs uppercase tracking-[0.48em] mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>BRAND CONCEPT</p>
          <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-6">
            เราไม่สัญญาว่าเรียนจบแล้ว<br />
            <span style={{ color: RED }}>คุณจะรวย</span>
          </h2>
          <p className="text-base sm:text-lg leading-relaxed mb-4 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.68)' }}>
            แต่เราจะให้คุณ <span className="text-white font-bold">"ได้ทำ"</span> เพื่อเอาไปปรับใช้ในการไลฟ์ที่คุณ{' '}
            <span className="text-white font-bold">"ทำได้"</span> จริง
          </p>
          <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.4)' }}>
            "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง แต่คือการสร้างธุรกิจที่เติบโตได้"
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          §10  JOURNEY — journey-stairs2.jpg full BG
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '90vh' }}>
        <img src="/images/journey-stairs2.jpg" alt="Journey"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.65)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(10,10,10,0.4) 0%,rgba(10,10,10,0.18) 40%,rgba(10,10,10,0.7) 82%,#0a0a0a 100%)' }} />

        {/* Top-left text */}
        <div className="absolute top-10 left-6 md:left-16 z-10 js-reveal">
          <p className="text-xs uppercase tracking-[0.5em] text-white/55 mb-2">CONSUMER → CREATOR</p>
          <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight">
            YOUR JOURNEY<br /><span style={{ color: RED }}>STARTS HERE.</span>
          </h2>
        </div>

        {/* Bottom-right buttons */}
        <div className="absolute bottom-10 right-6 md:right-16 z-10 js-reveal flex flex-col sm:flex-row gap-4">
          <Link to="/courses"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-bold text-sm tracking-[0.22em] uppercase"
            style={{ background: RED }}>
            เริ่มเส้นทางของคุณ <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/auth"
            className="inline-flex items-center justify-center px-8 py-4 font-bold text-sm border border-white/22 hover:border-white/45 transition-all uppercase tracking-[0.18em]"
            style={{ color: 'rgba(255,255,255,0.68)' }}>
            Free Account
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          §11  WHY CREATR365 DIFFERENCE? — 2 col table
      ══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 px-6" style={{ background: '#060606' }}>
        <div className="max-w-5xl mx-auto">
          <div className="js-reveal mb-12">
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              WHY <span style={{ color: RED }}>CREATR365</span><br />DIFFERENCE?
            </h2>
          </div>
          <div className="js-reveal border border-white/7 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-2 border-b border-white/7">
              <div className="p-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.38)' }}>ที่อื่น</span>
              </div>
              <div className="p-4 flex items-center justify-center border-l border-white/7"
                style={{ background: `${RED}10` }}>
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: RED }}>CREATR365</span>
              </div>
            </div>
            {WHY.map((row, i) => (
              <div key={i} className="grid grid-cols-2 border-b border-white/5 last:border-0 hover:bg-white/[0.012] transition-colors">
                <div className="p-5 flex items-start gap-2.5 border-r border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{row.them}</p>
                </div>
                <div className="p-5 flex items-start gap-2.5" style={{ background: `${RED}05` }}>
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>{row.us}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          §12  CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: '#080808' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="js-reveal">
            <p className="text-white text-lg sm:text-xl italic mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
              "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง<br />
              แต่คือการสร้างธุรกิจที่เติบโตได้"
            </p>
            <p className="text-xs uppercase tracking-[0.5em] mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>WELCOME TO CREATR365'S FAMILY</p>
            <h2 className="font-black text-white leading-[0.95] mb-10" style={{ fontSize: 'clamp(3.5rem,9vw,7rem)' }}>
              BE A<br />
              <span style={{ color: RED }}>CREATOR.</span><br />
              <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.55em', letterSpacing: '0.05em' }}>NOT A CONSUMER.</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/courses"
                className="group inline-flex items-center justify-center gap-3 px-10 py-4 text-white font-black text-sm tracking-[0.22em] uppercase"
                style={{ background: RED }}>
                BEGIN NOW <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link to="/auth"
                className="inline-flex items-center justify-center px-10 py-4 font-bold text-sm border border-white/15 hover:border-white/32 transition-all uppercase tracking-[0.15em]"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — Creatr365 original preserved
      ══════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-14 px-6" style={{ background: '#040404' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            <div>
              <img src={LOGO_URL} alt="Creatr365" className="h-7 w-auto mb-2" style={{ filter: 'brightness(0) invert(1)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>A Creative House for the Future of Live Commerce.</p>
            </div>
            <div className="flex flex-wrap gap-6 text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.42)' }}>
              {([['หลักสูตร', '/courses'], ['บทความ', '/articles'], ['FAQ', '/faq'], ['ติดต่อ', '/contact'], ['เข้าสู่ระบบ', '/auth']] as [string,string][]).map(([l, h]) => (
                <Link key={l} to={h} className="hover:text-white/65 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div className="flex flex-wrap gap-5">
              {([['นโยบายความเป็นส่วนตัว', '/privacy'], ['ข้อกำหนดการใช้บริการ', '/terms'], ['นโยบายการคืนเงิน', '/refund-policy']] as [string,string][]).map(([l, h]) => (
                <Link key={l} to={h} className="hover:text-white/50 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ── Brand card component ── */
function BrandCard({ c, delay }: { c: typeof BRAND_CARDS[0]; delay: number }) {
  return (
    <div className="js-reveal group relative overflow-hidden border border-white/8 hover:border-white/18 transition-all duration-400 cursor-default"
      style={{ background: '#0e0e0e', transitionDelay: `${delay}s` }}>
      {/* Image with hover zoom */}
      <div className="aspect-square overflow-hidden relative">
        <img src={c.img} alt="" className="w-full h-full object-cover opacity-70 group-hover:scale-110 group-hover:opacity-90 transition-all duration-700" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(14,14,14,0.95) 0%,rgba(14,14,14,0.5) 50%,rgba(14,14,14,0.1) 100%)' }} />
        {/* Number */}
        <span className="absolute top-3 right-3 text-xs font-black" style={{ color: `${RED}90` }}>{c.num}</span>
      </div>
      {/* Text — slide up on hover */}
      <div className="p-4">
        <p className="text-white font-bold text-sm leading-snug mb-1 whitespace-pre-line">{c.title}</p>
        <p className="text-xs leading-relaxed max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-500"
          style={{ color: 'rgba(255,255,255,0.52)' }}>
          {c.sub}
        </p>
      </div>
    </div>
  );
}
