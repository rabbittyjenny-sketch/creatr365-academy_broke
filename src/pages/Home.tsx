import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, ChevronDown, DollarSign, TrendingUp, BarChart3, Users, ExternalLink } from 'lucide-react';

const RED = '#CC0033';

/* ─── STATS (Section 2) ─────────────────────────────────── */
const STATS = [
  { v: '$172.9B', l: 'มูลค่าตลาด Live Commerce โลก 2025',   src: 'Grand View Research', icon: DollarSign },
  { v: '41%',     l: 'CAGR คาดการณ์ปี 2026–2033',            src: 'Grand View Research', icon: TrendingUp },
  { v: '1.1T฿',  l: 'ตลาด e-Commerce ไทย ปี 2024 (+14%)',   src: 'Priceza',             icon: BarChart3  },
  { v: '+21.7%', l: 'ไทยโตเร็วที่สุดใน SEA ปี 2024',        src: 'Momentum Works',      icon: Users      },
];

/* ─── BRAND NEEDS (Section 4) ───────────────────────────── */
const BRAND_NEEDS = [
  'ปิดการขาย · ช่วยสร้างยอด · ลดอัตราคืนสินค้า',
  'รักษา Retention ระหว่างไลฟ์',
  'สื่อสารสินค้าได้ตรงกลุ่ม',
  'สร้างความน่าเชื่อถือต่อตัวเองและผลิตภัณฑ์',
  'คุมภาพลักษณ์แบรนด์ได้ดี สื่อสารได้ตรง',
  'ทำงานแบบ Data-Driven + ปรับแคมเปญได้เร็ว',
  'ทำงานร่วมกับทีมหลังบ้านได้ รู้หน้าที่ Support',
];

/* ─── BRAND CATEGORIES (Section 5) ─────────────────────── */
const BRAND_CATS = [
  { img: '/images/pro-course-online.png',      label: 'คอร์สออนไลน์',         desc: 'เรียนได้ทุกที่ ทุกเวลา' },
  { img: '/images/pro-AI-tech.png',            label: 'AI & Technology',       desc: 'เทคโนโลยีสำหรับ Live Commerce' },
  { img: '/images/pro-workshop-liveclass.png', label: 'Workshop & Live Class', desc: 'เรียนสดกับผู้เชี่ยวชาญ' },
  { img: '/images/pro-community.png',          label: 'Community',             desc: 'เข้าร่วมชุมชนครีเอเตอร์' },
];

/* ─── TIERS (Section 6) ─────────────────────────────────── */
const TIERS = [
  {
    id: 't1', tier: 'TIER 1', headline: 'ไลฟ์ให้เป็น',
    sub: 'เริ่มต้นอย่างถูกต้อง สร้างรากฐานที่แข็งแกร่ง',
    outcome: 'ผลลัพธ์: รู้ทิศทาง มีรากฐานพร้อมก้าวต่อ',
    fgImg: '/images/i-can-live.png', bgImg: '/images/setmic1.png', path: '/tier1',
    courses: [
      { name: 'THE MAGNET',    sub: 'Live Commerce Blueprint', tag: 'FREE',   slug: 'the-magnet',
        why: 'แก้ปัญหาเรื่อง "ความกลัวและการเริ่มต้น" ชี้จุดกำแพงทฤษฎี ให้คว้าทิศทางได้เร็ว' },
      { name: 'THE FOUNDATION', sub: 'Core Host Framework',   tag: 'COURSE', slug: 'the-foundation',
        why: 'เข้าใจภาพรวมอาชีพ อุตสาหกรรม เครื่องมือพื้นฐาน PPACT Framework' },
    ],
  },
  {
    id: 't2', tier: 'TIER 2', headline: 'ไลฟ์ให้ขายได้',
    sub: 'เปลี่ยนทักษะเป็นรายได้จริง ปิดการขายได้อย่างมีระบบ',
    outcome: 'ผลลัพธ์: มีรายได้จากไลฟ์ มีระบบขายที่ทำซ้ำได้',
    fgImg: '/images/i-can-sale.png', bgImg: '/images/ringlight1.png', path: '/tier2',
    courses: [
      { name: 'SIGNAL', sub: 'The Conversion Host',          tag: 'COURSE', slug: 'signal',
        why: 'แก้ปัญหาแกนหลัก คนดูน้อย ปิดการขายไม่ได้ 9 ชั่วโมงเปลี่ยนทฤษฎีเป็นระบบทำเงิน' },
      { name: 'STAGE',  sub: 'The Signature Intensive Lab',  tag: 'COURSE', slug: 'stage',
        why: 'แก้ปัญหาหน้างาน ตื่นกล้อง ของหมด ระบบล่ม ปรับพฤติกรรมตาม Dashboard Data' },
    ],
  },
  {
    id: 't3', tier: 'TIER 3', headline: 'ไลฟ์ให้วัดผลและทำซ้ำได้',
    sub: 'สร้างระบบ ขยายธุรกิจ ไม่ขึ้นกับโฮสต์คนเดียว',
    outcome: 'ผลลัพธ์: ระบบขายแบบ End-to-End ที่วัดผลและปรับปรุงได้ต่อเนื่อง',
    fgImg: '/images/i-can-process.png', bgImg: '/images/mic1.png', path: '/tier3',
    courses: [
      { name: 'BRAND HOST ARCHITECT', sub: 'Masterclass', tag: 'COMING SOON', slug: '',
        why: 'แก้ปัญหาเชิงโครงสร้างระบบและตัวเลขหลังบ้าน ตอบโจทย์ระบบขายแบบ End-to-End' },
    ],
  },
];

/* ─── WHY (Section 9) ───────────────────────────────────── */
const WHY = [
  { q: 'สอน "ทำไมได้ผล" ไม่ใช่แค่ "วิธีทำ"',         them: 'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube',              us: 'PPACT Framework 5 มิติ ฝังในทุกคอร์ส' },
  { q: 'สร้าง Identity ที่แบรนด์ต้องการ',              them: 'เน้นเทคนิคตะโกนขายหรือสร้าง Hype',               us: 'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด' },
  { q: 'ขับเคลื่อนด้วยข้อมูล ไม่ใช่ความรู้สึก',       them: 'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข',         us: 'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools' },
  { q: 'ระบบที่รันได้เอง ไม่ต้องพึ่งโฮสต์คนเดียว',   them: 'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย',             us: 'Brand Host Architect — วางระบบ Production ทั้งทีม' },
  { q: 'มาตรฐานวิชาชีพที่วัดผลได้จริง',                them: 'เรียนจบไม่รู้จะทำอะไรต่อ',                       us: 'Key Collection System™ มาตรฐานอุตสาหกรรม' },
];

/* ─── SOFT SKILLS (Section 10) ─────────────────────────── */
const SOFT_SKILLS = [
  'Soft Skills', 'การสื่อสาร', 'การขาย', 'การวางแผนงาน',
  'การวิเคราะห์ข้อมูล', 'Digital Marketing สำหรับ Live Commerce',
  'ความคิดสร้างสรรค์ที่พร้อมออกนอกกรอบ',
];

/* ─── Scroll Reveal ─────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ─── Count-Up ──────────────────────────────────────────── */
function CountUp({ target, trigger }: { target: string; trigger: boolean }) {
  const [val, setVal] = useState('—');
  useEffect(() => {
    if (!trigger) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setVal(target); return; }
    const pre = target.match(/^[^0-9]*/)?.[0] ?? '';
    const suf = target.replace(/^[^0-9]*[\d.]+/, '');
    const dur = 1400; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(pre + (Math.round(e * num * 10) / 10).toLocaleString() + suf);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [trigger, target]);
  return <>{val}</>;
}

/* ══════════════════════════════════════════════════════════
   HOME
══════════════════════════════════════════════════════════ */
const Home = () => {
  useScrollReveal();

  /* Parallax hero */
  const heroImgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (heroImgRef.current) heroImgRef.current.style.transform = `scale(1.05) translateY(${window.scrollY * 0.25}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Stats count-up trigger */
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsTrig, setStatsTrig] = useState(false);
  useEffect(() => {
    const el = statsRef.current; if (!el) return;
    const obs = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setStatsTrig(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  /* Stats modal */
  const [statsModal, setStatsModal] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setStatsModal(false); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  /* Accordion tier */
  const [openTier, setOpenTier] = useState<string | null>(null);

  return (
    <main className="bg-[#0a0a0a] site-hover-scope">

      {/* ═══════════════════════════════════════════════
          §1  HERO
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden grain">
        {/* BG image with parallax */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            ref={heroImgRef}
            src="/images/hero-team.jpg"
            alt="Creatr365 Team"
            className="w-full h-full object-cover object-center opacity-55"
            style={{ transform: 'scale(1.05)', transition: 'transform 0.05s linear' }}
          />
          <div className="hero-gradient absolute inset-0" />
          <div className="absolute bottom-0 left-0 right-0 h-48"
            style={{ background: 'linear-gradient(to top, #0a0a0a, transparent)' }} />
          {/* Red radial */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(204,0,51,0.18) 0%, transparent 70%)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 w-full">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-[0.42em] text-white/55 mb-8 uppercase animate-fade-in-up">
              CREATR365 &middot; Live Commerce Academy
            </p>

            <h1 className="font-black text-white leading-[0.95] mb-8 animate-fade-in-up"
              style={{ fontSize: 'clamp(2.8rem,7.5vw,5.5rem)', animationDelay: '0.15s', animationFillMode: 'both' }}>
              BE <span style={{ color: RED }}>CREATOR.</span><br />
              <span className="text-white/25 block mt-2" style={{ fontSize: '0.55em', letterSpacing: '0.12em' }}>
                NOT CONSUMER.
              </span>
            </h1>

            <blockquote className="border-l-2 pl-5 mb-8 animate-fade-in-up"
              style={{ borderColor: `${RED}70`, animationDelay: '0.28s', animationFillMode: 'both' }}>
              <p className="text-white/75 text-lg md:text-xl leading-relaxed italic">
                "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง<br />
                แต่คือการสร้างธุรกิจที่เติบโตได้"
              </p>
            </blockquote>

            <p className="text-white/50 text-base mb-10 animate-fade-in-up"
              style={{ animationDelay: '0.38s', animationFillMode: 'both' }}>
              หากคุณต้องการ "เรียนแค่ทฤษฎีการไลฟ์" หรือ "การสอนแบบจับมือทำ"&nbsp;&nbsp;
              <span className="text-white font-bold">ที่นี่… ไม่ใช่ของคุณ</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
              style={{ animationDelay: '0.48s', animationFillMode: 'both' }}>
              <Link to="/courses"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-white font-bold text-sm tracking-[0.22em] uppercase transition-all duration-300 animate-pulse-glow"
                style={{ background: RED }}>
                ดูหลักสูตร
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
              <Link to="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white/60 border border-white/18 hover:border-white/40 hover:text-white transition-all duration-300 text-sm font-semibold uppercase tracking-[0.18em]">
                Free Account
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll mouse indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
          <div className="w-6 h-10 border-2 border-white/25 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §2  STATS STRIP  (click = modal)
      ═══════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-white/6 bg-[#080808]">
        <div ref={statsRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={i} onClick={() => setStatsModal(true)}
                  className="reveal glass-card rounded-md p-6 text-center stat-card text-left"
                  style={{ transitionDelay: `${i * 0.09}s` }}>
                  <Icon className="w-5 h-5 mb-3" style={{ color: RED }} />
                  <p className="text-3xl sm:text-4xl font-black text-white mb-1 tabular-nums">
                    <CountUp target={s.v} trigger={statsTrig} />
                  </p>
                  <p className="text-white text-sm leading-relaxed mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.l}</p>
                  <p className="text-white/35 text-xs uppercase tracking-widest">{s.src}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-white/30 text-xs">
              Sources: Grand View Research · Priceza · Momentum Works 2024–2025
            </p>
            <button onClick={() => setStatsModal(true)}
              className="text-xs text-white/30 hover:text-white/55 transition-colors flex items-center gap-1 underline underline-offset-2">
              ดูอ้างอิง <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Modal */}
      {statsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
          onClick={() => setStatsModal(false)}>
          <div className="relative max-w-lg w-full bg-[#111] border border-white/10 p-8 rounded-md"
            style={{ animation: 'modalScaleIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setStatsModal(false)}
              className="absolute top-4 right-4 text-white/35 hover:text-white transition-colors text-xl font-light">✕</button>
            <p className="text-xs font-bold tracking-[0.42em] uppercase mb-6" style={{ color: RED }}>แหล่งข้อมูลอ้างอิง</p>
            <div className="space-y-5">
              {STATS.map((s, i) => (
                <div key={i} className="border-b border-white/6 pb-5 last:border-0 last:pb-0">
                  <p className="text-3xl font-black text-white mb-1">{s.v}</p>
                  <p className="text-white text-sm leading-relaxed mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.l}</p>
                  <p className="text-white/35 text-xs uppercase tracking-widest">Source: {s.src}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-white/30 text-xs leading-relaxed border-t border-white/6 pt-5">
              Grand View Research — Live Commerce Market Size Report 2025<br />
              Priceza — Thailand E-Commerce Report 2024<br />
              Momentum Works — E-commerce in Southeast Asia 3.0 (2025)
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          §3  MARQUEE — "เป็นเหมือนกันไหม?"
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-white/5">
        {/* BG silhouette */}
        <div className="absolute inset-0 z-0">
          <img src="/images/identity-silhouette.jpg" alt=""
            className="w-full h-full object-cover opacity-12" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, #0a0a0a 25%, transparent 55%, #0a0a0a 85%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, #0a0a0a 0%, transparent 20%, transparent 80%, #0a0a0a 100%)' }} />
        </div>

        {/* Marquee band top */}
        <div className="relative z-10 py-3 border-b border-white/5 overflow-hidden bg-black/20">
          <div className="flex whitespace-nowrap gap-10 animate-marquee">
            {Array(2).fill([
              'เป็นเหมือนกันไหม?', '"เรียนแค่ทฤษฎีการไลฟ์"',
              '"การสอนแบบจับมือทำ"', 'ที่นี่… ไม่ใช่ของคุณ',
              'Be Creator. Not Consumer.', 'Psychology First. Data Always.',
            ]).flat().map((t, i) => (
              <span key={i} className="text-xs font-bold tracking-[0.28em] uppercase text-white flex items-center gap-3 flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: RED }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Center */}
        <div className="relative z-10 py-28 px-6 text-center max-w-3xl mx-auto">
          <div className="reveal">
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-6">เป็นเหมือนกันไหม?</h2>
            <p className="text-white text-lg sm:text-xl leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
              หากคุณต้องการ{' '}
              <span className="text-white font-bold">"เรียนแค่ทฤษฎีการไลฟ์"</span>
            </p>
            <p className="text-white text-lg sm:text-xl leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
              หรือ <span className="text-white font-bold">"การสอนแบบจับมือทำ"</span>
            </p>
            <p className="text-2xl sm:text-4xl font-black" style={{ color: RED }}>
              ที่นี่… ไม่ใช่ของคุณ
            </p>
          </div>
        </div>

        {/* Marquee band bottom */}
        <div className="relative z-10 py-3 border-t border-white/5 overflow-hidden bg-black/20">
          <div className="flex whitespace-nowrap gap-10" style={{ animation: 'marquee 30s linear infinite reverse' }}>
            {Array(2).fill([
              'Attention is a Professional Skill.', 'Build a Business That Outlasts You.',
              'Communication Changes Behavior.', 'Live Commerce ในไทยยังโตขึ้นอย่างมหาศาล',
              'Psychology First. Data Always.', 'สร้างตัวตน สื่อสารทรงพลัง',
            ]).flat().map((t, i) => (
              <span key={i} className="text-xs font-bold tracking-[0.28em] uppercase flex items-center gap-3 flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: RED }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §4  เพราะเราเจอปัญหามาก่อน
      ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-center">
            {/* Left text */}
            <div className="reveal">
              <p className="text-sm font-bold tracking-[0.38em] uppercase mb-5" style={{ color: RED }}>
                เพราะเราเจอปัญหามาก่อน
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-7">
                Creatr365<br />
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>สร้างจาก</span><br />
                ประสบการณ์จริง
              </h2>
              <p className="mb-7 leading-relaxed text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>
                เราสร้างคอร์สทั้งหมดจากพื้นฐานความเข้าใจในปัญหา<br />
                และถอดทุกประสบการณ์จริงจากอาชีพ Live Commerce<br />
                มาสร้างเป็นเนื้อหาการเรียนรู้ที่ครบในทุกมิติ
              </p>
              <div className="border-l-2 pl-5 mb-10" style={{ borderColor: RED }}>
                <p className="text-white leading-relaxed text-base" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  ไม่ใช่แค่ไลฟ์ให้เป็น —<br />
                  แต่ต้องการให้คุณ <strong className="text-white">สร้างไลฟ์ที่มีคุณค่า</strong><br />
                  ด้วยมาตรฐานในอาชีพที่มีคุณภาพ<br />
                  พร้อมก้าวเข้าสู่ตลาดระดับ Global ได้ในอนาคต
                </p>
              </div>

              {/* Brand needs */}
              <p className="text-xs font-bold tracking-[0.32em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                ปัจจุบันแบรนด์ใหญ่ๆ ต้องการ
              </p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                {BRAND_NEEDS.map((n, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: RED }} />
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{n}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right images — stacked with offset (slide in from right) */}
            <div className="reveal relative h-[420px] sm:h-[520px]" style={{ transitionDelay: '0.18s' }}>
              <div className="absolute top-0 left-0 w-[82%] h-[56%] overflow-hidden rounded-sm">
                <img src="/images/problem-up.png" alt="เพราะเราเจอปัญหามาก่อน (บนซ้าย)"
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, #0a0a0a 100%)' }} />
                <span className="absolute top-3 left-3 text-xs font-bold tracking-widest uppercase px-3 py-1 bg-black/50 border border-white/10"
                  style={{ color: 'rgba(255,255,255,0.6)' }}>
                  เพราะเราเจอปัญหามาก่อน
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-[65%] h-[55%] overflow-hidden rounded-sm"
                style={{ border: `2px solid ${RED}30` }}>
                <img src="/images/creator-live2.png" alt="Creator Live (ล่างขวา)"
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, transparent 55%, #0a0a0a 100%)' }} />
              </div>
              {/* accent dot */}
              <div className="absolute w-3 h-3 rounded-full z-10"
                style={{ background: RED, boxShadow: `0 0 14px ${RED}80`, bottom: '43%', right: '38%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §5  BRAND PROMISE — Welcome to Creatr365's Family
      ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal text-center mb-10">
            <p className="text-xs font-bold tracking-[0.46em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              WELCOME TO CREATR365'S FAMILY
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-3">
              หลักสูตรที่เลือกเรียนได้<br />
              <span style={{ color: RED }}>ตามสไตล์คุณ</span>
            </h2>
          </div>

          {/* Team image */}
          <div className="reveal mb-10 overflow-hidden" style={{ height: 'clamp(200px,38vw,420px)' }}>
            <img src="/images/Team-work.jpg" alt="Creatr365 Team"
              className="w-full h-full object-cover object-center hover:scale-[1.02] transition-transform duration-700"
              style={{ filter: 'brightness(0.78) contrast(1.08)' }} />
          </div>

          {/* 4 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {BRAND_CATS.map((c, i) => (
              <div key={i} className="reveal glass-card rounded-md overflow-hidden group hover:border-white/18 transition-all duration-400"
                style={{ transitionDelay: `${i * 0.09}s` }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={c.img} alt={c.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 opacity-85 group-hover:opacity-100" />
                </div>
                <div className="p-4">
                  <p className="text-white font-bold text-sm mb-1">{c.label}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §6  CURRICULUM 3 TIERS — Accordion
      ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal mb-14">
            <p className="text-xs font-bold tracking-[0.42em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.38)' }}>
              CURRICULUM
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-2">หลักสูตร 3 ชั้น</h2>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
              เรียนได้อย่างอิสระ · ไม่บังคับ flow · ระบบแนะนำเส้นทางให้อัตโนมัติ
            </p>
          </div>

          <div className="space-y-3">
            {TIERS.map((tier, ti) => {
              const isOpen = openTier === tier.id;
              return (
                <div key={tier.id}
                  className={`reveal border overflow-hidden transition-all duration-400 ${isOpen ? 'tier-section' : ''}`}
                  style={{
                    transitionDelay: `${ti * 0.08}s`,
                    borderColor: isOpen ? `${RED}35` : 'rgba(255,255,255,0.07)',
                    background: isOpen ? '#0e0e0e' : '#090909',
                    boxShadow: isOpen ? `0 0 0 1px ${RED}20, inset 0 0 40px rgba(204,0,51,0.025)` : 'none',
                  }}>
                  {/* Accordion header */}
                  <button className="w-full flex items-center gap-5 p-6 md:p-8 text-left group"
                    onClick={() => setOpenTier(isOpen ? null : tier.id)}>
                    <span className="text-xs font-black tracking-widest uppercase px-2 py-1 border flex-shrink-0 transition-colors duration-300"
                      style={{
                        color: isOpen ? RED : 'rgba(255,255,255,0.3)',
                        borderColor: isOpen ? `${RED}55` : 'rgba(255,255,255,0.1)',
                      }}>
                      {tier.tier}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-lg sm:text-2xl truncate">{tier.headline}</p>
                      <p className="text-sm mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.42)' }}>{tier.sub}</p>
                    </div>
                    <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform duration-400"
                      style={{ color: isOpen ? RED : 'rgba(255,255,255,0.28)', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  {/* Accordion body */}
                  <div className="accordion-content" style={{ maxHeight: isOpen ? '1000px' : '0px', opacity: isOpen ? 1 : 0 }}>
                    <div className="px-6 md:px-8 pb-10">
                      {/* Tier imagery */}
                      <div className="relative mb-8 overflow-hidden rounded-sm" style={{ height: 'clamp(180px,30vw,340px)' }}>
                        <img src={tier.bgImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-18" />
                        <img src={tier.fgImg} alt={tier.headline}
                          className="relative z-10 h-full mx-auto object-contain drop-shadow-2xl" />
                        <div className="absolute inset-0"
                          style={{ background: 'linear-gradient(to right, #0e0e0e 0%, transparent 35%, transparent 65%, #0e0e0e 100%)' }} />
                        <div className="absolute inset-0"
                          style={{ background: 'linear-gradient(to bottom, transparent 45%, #0e0e0e 100%)' }} />
                        {/* Outcome */}
                        <div className="absolute bottom-4 inset-x-0 flex justify-center">
                          <span className="px-4 py-1.5 text-xs font-bold border border-white/12 bg-black/55 backdrop-blur-sm tracking-wider"
                            style={{ color: 'rgba(255,255,255,0.75)' }}>
                            {tier.outcome}
                          </span>
                        </div>
                      </div>

                      {/* Course cards — slide in from right on open */}
                      <div className={`grid gap-4 ${tier.courses.length === 1 ? 'max-w-lg' : 'sm:grid-cols-2'}`}>
                        {tier.courses.map((course, ci) => {
                          const isCS = course.tag === 'COMING SOON';
                          const isFree = course.tag === 'FREE';
                          return (
                            <div key={course.name} className="glass-card rounded-sm p-6 hover:border-white/14 transition-all duration-350"
                              style={{ animation: isOpen ? `slideInFromRight 0.45s cubic-bezier(0.16,1,0.3,1) ${ci * 90}ms both` : 'none' }}>
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <p className="text-white font-black text-base sm:text-lg">{course.name}</p>
                                  <p className="text-xs mt-0.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.38)' }}>{course.sub}</p>
                                </div>
                                <span className="text-xs font-black px-2 py-1 border flex-shrink-0 ml-3"
                                  style={{
                                    color: isFree ? '#34A853' : isCS ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)',
                                    borderColor: isFree ? '#34A85345' : isCS ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)',
                                  }}>
                                  {course.tag}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.58)' }}>{course.why}</p>
                              {!isCS ? (
                                <Link to={`/courses`}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
                                  style={{ color: isFree ? '#34A853' : 'rgba(255,255,255,0.42)' }}>
                                  สมัครเรียน <ArrowRight className="w-3 h-3" />
                                </Link>
                              ) : (
                                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Coming Soon</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Link to={tier.path}
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
                          style={{ color: RED }}>
                          ดูรายละเอียดเพิ่มเติม <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §7  BRAND CONCEPT
      ═══════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 border-t border-white/5 overflow-hidden">
        {/* BG image */}
        <div className="absolute inset-0 z-0">
          <img src="/images/Team-behind.png" alt="Brand Concept"
            className="w-full h-full object-cover opacity-22" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #0a0a0a 45%, rgba(10,10,10,0.65) 70%, rgba(10,10,10,0.25) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="reveal text-center mb-14">
            <p className="text-xs font-bold tracking-[0.46em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              BRAND CONCEPT
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              เราไม่สัญญาว่าเรียนจบแล้ว<br />
              <span style={{ color: RED }}>คุณจะรวย</span>
            </h2>
          </div>

          <div className="reveal flex flex-col md:flex-row items-center gap-12 justify-center" style={{ transitionDelay: '0.12s' }}>
            {/* Logos */}
            <div className="flex flex-col items-center gap-4">
              <img src="/images/Creatr365_center.png" alt="Creatr365 Logo"
                className="h-20 md:h-28 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }} />
              <img src="/images/creatr365_concept_center.png" alt="Creatr365 Concept"
                className="h-8 md:h-12 object-contain"
                style={{ filter: 'brightness(0) invert(1)', opacity: 0.55 }} />
            </div>

            {/* Manifesto */}
            <div className="max-w-sm">
              <p className="text-base leading-loose mb-5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                แต่เราจะให้คุณ{' '}
                <span className="text-white font-bold">"ได้ทำ"</span>{' '}
                เพื่อเอาไปปรับใช้ในการไลฟ์ที่คุณ{' '}
                <span className="text-white font-bold">"ทำได้"</span>{' '}
                จริง
              </p>
              <blockquote className="border-l-2 pl-4 italic" style={{ borderColor: `${RED}60` }}>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง<br />
                  แต่คือการสร้างธุรกิจที่เติบโตได้"
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §8  JOURNEY — full-bleed image + buttons only
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '88vh' }}>
        {/* Full bleed */}
        <img src="/images/journey-stairs.jpg" alt="Consumer to Creator Journey"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.72)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.38) 0%, rgba(10,10,10,0.2) 40%, rgba(10,10,10,0.72) 85%, #0a0a0a 100%)' }} />

        {/* Buttons bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-14 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
            <div className="reveal">
              <p className="text-xs font-bold tracking-[0.46em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                CONSUMER → CREATOR
              </p>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                YOUR JOURNEY<br /><span style={{ color: RED }}>STARTS HERE.</span>
              </h2>
            </div>
            <div className="reveal flex flex-col sm:flex-row gap-4 flex-shrink-0" style={{ transitionDelay: '0.12s' }}>
              <Link to="/courses"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-white font-bold text-sm tracking-[0.22em] uppercase transition-all duration-300 animate-pulse-glow"
                style={{ background: RED }}>
                เริ่มเส้นทางของคุณ
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/journey"
                className="inline-flex items-center justify-center px-8 py-4 font-bold text-sm border border-white/22 hover:border-white/45 hover:text-white transition-all uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.68)' }}>
                ดูเส้นทางทั้งหมด
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §9  WHY CREATR365 DIFFERENCE?
      ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal mb-14">
            <p className="text-xs font-bold tracking-[0.42em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              COMPARISON
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              WHY <span style={{ color: RED }}>CREATR365</span><br />DIFFERENCE?
            </h2>
          </div>

          <div className="reveal border border-white/7 overflow-hidden rounded-sm">
            {/* Header */}
            <div className="grid border-b border-white/7" style={{ gridTemplateColumns: '2fr 3fr 3fr' }}>
              <div className="p-4 bg-white/[0.02]" />
              <div className="p-4 border-l border-white/5 flex items-center justify-center bg-white/[0.02]">
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.42)' }}>คอร์สทั่วไป</span>
              </div>
              <div className="p-4 border-l border-white/5 flex items-center justify-center table-row-highlight">
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: RED }}>CREATR365</span>
              </div>
            </div>
            {WHY.map((row, i) => (
              <div key={i} className="grid border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors duration-200"
                style={{ gridTemplateColumns: '2fr 3fr 3fr' }}>
                <div className="p-5 bg-white/[0.015] border-r border-white/5 flex items-center">
                  <p className="text-sm font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.68)' }}>{row.q}</p>
                </div>
                <div className="p-5 border-r border-white/5 flex items-start gap-2.5">
                  <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }} />
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{row.them}</p>
                </div>
                <div className="p-5 flex items-start gap-2.5 table-row-highlight">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>{row.us}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §10  SOFT SKILLS + CTA
      ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center mb-24">
            {/* Soft skills list */}
            <div className="reveal">
              <p className="text-xs font-bold tracking-[0.42em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                ทักษะที่สำคัญที่สุดในอาชีพนี้
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-8">
                ไม่ใช่แค่ทักษะไลฟ์<br />
                <span style={{ color: RED }}>แต่คือทักษะชีวิต</span>
              </h2>
              {SOFT_SKILLS.map((s, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-white/6 last:border-0 group cursor-default">
                  <span className="text-xs font-black w-6 flex-shrink-0 tabular-nums" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  <p className="text-sm sm:text-base group-hover:text-white transition-colors duration-300"
                    style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {s}
                  </p>
                </div>
              ))}
            </div>

            {/* Big manifesto */}
            <div className="reveal text-center lg:text-left" style={{ transitionDelay: '0.12s' }}>
              <p className="text-base italic mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
                "เราไม่สัญญาว่าเรียนจบแล้วคุณจะรวย"
              </p>
              <h2 className="font-black text-white leading-[1.0] mb-6"
                style={{ fontSize: 'clamp(3.2rem,8.5vw,6.5rem)' }}>
                BE A<br />
                <span style={{ color: RED }}>CREATOR.</span><br />
                <span style={{ fontSize: '0.52em', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em' }}>NOT A CONSUMER.</span>
              </h2>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                เพราะโจทย์ของตลาดตอนนี้คือ{' '}
                <span style={{ color: 'rgba(255,255,255,0.62)' }}>Performance · Data · ระบบขายแบบ End-to-End</span>
              </p>
            </div>
          </div>

          {/* CTA strip */}
          <div className="reveal border border-white/7 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 cta-strip-shimmer"
            style={{ background: 'linear-gradient(135deg,#0e0e0e 0%,#0b0b0b 100%)' }}>
            <div>
              <p className="text-xs font-bold tracking-[0.46em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.32)' }}>
                WELCOME TO CREATR365'S FAMILY
              </p>
              <h3 className="text-2xl sm:text-4xl font-black text-white">พร้อมเริ่มต้นแล้วหรือยัง?</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
              <Link to="/courses"
                className="group inline-flex items-center justify-center gap-3 px-9 py-4 text-white font-black text-sm tracking-[0.22em] uppercase transition-all duration-300 animate-pulse-glow"
                style={{ background: RED }}>
                BEGIN NOW
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link to="/auth"
                className="inline-flex items-center justify-center px-9 py-4 font-bold text-sm border border-white/14 hover:border-white/30 transition-all uppercase tracking-[0.15em]"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          §11  FOOTER — Creatr365 original (preserved)
      ═══════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-16 bg-[#070707]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div>
              <p className="font-black text-xl tracking-widest text-white">
                CREATR<span style={{ color: RED }}>365</span>
              </p>
              <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                A Creative House for the Future of Live Commerce.
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              {([['หลักสูตร', '/courses'], ['บทความ', '/articles'], ['FAQ', '/faq'], ['ติดต่อ', '/contact'], ['เข้าสู่ระบบ', '/auth']] as [string, string][]).map(([l, h]) => (
                <Link key={l} to={h} className="text-xs uppercase tracking-wider transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-xs uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.28)' }}>
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div className="flex flex-wrap gap-5">
              {([['นโยบายความเป็นส่วนตัว', '/privacy'], ['ข้อกำหนดการใช้บริการ', '/terms'], ['นโยบายการคืนเงิน', '/refund-policy']] as [string, string][]).map(([l, h]) => (
                <Link key={l} to={h} className="hover:text-white/55 transition-colors normal-case">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
