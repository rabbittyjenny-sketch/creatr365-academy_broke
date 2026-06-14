import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import CursorGlow from '@/components/CursorGlow';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Play, Check, X, ChevronDown, ChevronRight } from 'lucide-react';

interface CourseRow {
  id: string; slug: string; tag: string; title: string; subtitle: string;
  color: string; is_active: boolean; learning_type: string; status: string;
  cover_image_url: string | null; price: string; duration: string; level: string | null;
}

const RED = '#CC0033';

const STATS = [
  { v: '33.9%', label: 'CAGR 2024–2034', l: 'ตลาด Live-Streaming E-Commerce โลก', src: 'Grand View Research' },
  { v: '$287B',  label: 'TARGET 2034',    l: 'มูลค่าตลาดโลกภายในปี 2034',          src: 'Grand View Research' },
  { v: '+21.7%', label: 'TH GROWTH',     l: 'ไทยโตเร็วที่สุดใน SEA ปี 2024',      src: 'Momentum Works' },
  { v: '73%',    label: 'CONSUMERS',     l: 'ผู้บริโภคไทยเคยใช้ Live Shopping',    src: 'Momentum Works' },
];

const BRAND_NEEDS = [
  { title: 'ปิดการขาย · ช่วยสร้างยอด · ลดอัตราคืนสินค้า', detail: 'โฮสต์ที่แบรนด์ต้องการต้องสร้าง Conversion ได้จริง ไม่ใช่แค่พูดเก่ง' },
  { title: 'รักษา Retention ระหว่างไลฟ์', detail: 'คนดูที่อยู่นาน = โอกาสขาย เรียนรู้เทคนิค Watch Time & Engagement ที่วัดผลได้' },
  { title: 'สร้างความน่าเชื่อถือต่อตัวเองและผลิตภัณฑ์', detail: 'Authority ไม่ได้มาจากประสบการณ์อย่างเดียว แต่จากการสื่อสารที่ถูกต้อง' },
  { title: 'คุมภาพลักษณ์แบรนด์ · สื่อสารสินค้าได้ตรงกลุ่ม', detail: 'รู้ว่าแบรนด์ต้องการอะไร สื่อสารตรง CI ได้ทุกช่วงของไลฟ์' },
  { title: 'ทำงานแบบ Data-Driven + ปรับแคมเปญได้เร็ว', detail: 'อ่าน CCV, CTR, CVR, Retention ได้จริง และปรับกลยุทธ์ได้ทันที' },
  { title: 'ทำงานร่วมกับทีมหลังบ้าน รู้หน้าที่และพร้อม Support', detail: 'โฮสต์มืออาชีพต้องทำงานเป็นทีม ไม่ใช่ดาราเดี่ยวที่ขาดไม่ได้' },
];

const BRAND_PROMISE_ITEMS = [
  { img: '/images/pro-course-online.png',       label: 'Online Course',           desc: 'เรียนได้ทุกที่ ทุกเวลา' },
  { img: '/images/pro-AI-Tech.png',              label: 'AI & Tech Tools',         desc: 'เครื่องมือระดับอาชีพ' },
  { img: '/images/pro-workshop-liveclass.png',   label: 'Workshop & Live Class',   desc: 'ฝึกจริง วัดผลจริง' },
  { img: '/images/pro-community-network.png',    label: 'Community & Network',     desc: 'เครือข่าย Creator ระดับมืออาชีพ' },
];

const CURRICULUM_TIERS = [
  {
    tier: 'ไลฟ์ให้เป็น',
    tagline: 'สร้างรากฐาน · เริ่มต้นอย่างถูกต้อง',
    bg: '/images/i-can-live.png',
    overlay: '/images/setmic1.png',
    courses: [
      { name: 'THE MAGNET',      sub: 'READY FOR LIVE · FREE',                   tag: 'FREE',        slug: 'the-magnet',    desc: 'เรียนรู้การวางระบบ การเตรียมอุปกรณ์ การเซตสตูดิโอและ Launch Plan ที่ทำให้เราเริ่มไลฟ์ได้จริง แม้มีงบจำกัด เน้นการแก้ปัญหาเรื่อง "ความกลัวและการเริ่มต้น" หยุดรอความพร้อม แล้วเริ่มสร้างโอกาสของตัวเอง' },
      { name: 'THE FOUNDATION',  sub: 'LIVE EXPLORER · COURSE',                  tag: 'COURSE',      slug: 'the-foundation', desc: 'ถูกออกแบบมาเพื่อสร้างรากฐานให้คุณเข้าใจอุตสาหกรรมไลฟ์คอมเมอรซ์ เข้าใจในอาชีพ เรียนรู้เพื่อเตรียมความพร้อมและสร้างการไลฟ์ที่ใช้ได้จริง เพื่อให้คุณพร้อมรับงานไลฟ์แรก' },
    ],
  },
  {
    tier: 'ไลฟ์ให้ขายได้',
    tagline: 'เปลี่ยนทักษะเป็นรายได้จริง',
    bg: '/images/i-can-sale.png',
    overlay: '/images/ringlight1.png',
    courses: [
      { name: 'SIGNAL',  sub: 'THE CONVERSION HOST · ONLINE',           tag: 'COURSE',  slug: 'signal',  desc: 'หลักสูตรที่จัดการกับ (คนดูน้อย, ปิดการขายไม่ได้, ขายแข็ง, อ่านข้อมูลไม่เป็น) คอร์ส 9 ชั่วโมงเปลี่ยนทฤษฎีให้เป็นระบบทำเงิน เข้าใจ CCV, CTR, CVR, Retention ใช้ KPI ที่แบรนด์วัดผลจริง รวมถึงการใช้ AI เพื่อช่วยวางแผน' },
      { name: 'STAGE',   sub: 'THE SIGNATURE INTENSIVE LAB · ONSITE 1 DAY', tag: 'COURSE', slug: 'stage', desc: 'แก้ปัญหาหน้างาน ตื่นกล้อง ของหมด ระบบล่ม ปรับพฤติกรรมตาม Dashboard Data แบบ Real-time ผ่านการฝึกปฏิบัติแบบ Intensive Lab 1 วันเต็ม' },
    ],
  },
  {
    tier: 'ไลฟ์ให้วัดผลและทำซ้ำได้',
    tagline: 'สร้างระบบ ขยายธุรกิจ ไม่ขึ้นกับโฮสต์คนเดียว',
    bg: '/images/i-can-process.png',
    overlay: '/images/mic1.png',
    courses: [
      { name: 'THE BRAND HOST ARCHITECT', sub: 'MASTERCLASS · COMING SOON', tag: 'COMING SOON', slug: '', desc: 'หลักสูตรสำหรับผู้ที่ต้องการสร้างระบบ สร้างทีม แก้ปัญหาเชิงโครงสร้างของ Seller และเจ้าของธุรกิจ (ทีมงานน้อย, งบจำกัด, ขาดทุนสะสม) ตอบโจทย์ระบบขายแบบ End-to-End ที่ตลาดต้องการระยะยาว' },
    ],
  },
];

const WHY = [
  { q: 'สอน "ทำไมได้ผล" ไม่ใช่แค่ "วิธีทำ"',       them: 'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube',           us: 'PPACT Framework 5 มิติ ฝังในทุกคอร์ส' },
  { q: 'สร้าง Identity ที่แบรนด์ต้องการ',           them: 'เน้นเทคนิคตะโกนขายหรือสร้าง Hype',            us: 'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด' },
  { q: 'ขับเคลื่อนด้วยข้อมูล ไม่ใช่ความรู้สึก',     them: 'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข',      us: 'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools' },
  { q: 'ระบบที่รันได้เอง ไม่ต้องพึ่งโฮสต์คนเดียว',  them: 'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย',         us: 'Brand Host Architect — วางระบบ Production ทั้งทีม' },
  { q: 'มาตรฐานวิชาชีพที่วัดผลได้จริง',             them: 'เรียนจบไม่รู้จะทำอะไรต่อ',                     us: 'Key Collection System™ มาตรฐานอุตสาหกรรม' },
];

/* ─── Hooks ─────────────────────────────────────────────── */
function useParallax(speed = 0.25) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onScroll = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return ref;
}

function useInView(rootMargin = '0px 0px -80px 0px') {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          el.querySelectorAll('[data-reveal]').forEach((item) => {
            const delay = (item as HTMLElement).dataset.revealDelay ?? '0';
            setTimeout(() => item.classList.add('revealed'), parseInt(delay));
          });
          obs.unobserve(e.target);
        }
      }),
      { rootMargin, threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return ref;
}

/* ─── AccordionItem ──────────────────────────────────────── */
const AccordionItem: React.FC<{ item: typeof BRAND_NEEDS[0]; idx: number }> = ({ item, idx }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 last:border-0 cursor-pointer group" onClick={() => setOpen(o => !o)}>
      <div className="flex items-center justify-between py-4 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-white/30 w-5 flex-shrink-0 tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
          <p className="text-white font-semibold text-sm leading-snug">{item.title}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ color: open ? RED : 'rgba(255,255,255,0.3)' }} />
      </div>
      <div className={`overflow-hidden transition-all duration-400 ease-out ${open ? 'max-h-24 pb-4' : 'max-h-0'}`}>
        <p className="text-white/60 text-sm leading-relaxed pl-8">{item.detail}</p>
      </div>
    </div>
  );
};

/* ─── CurriculumPanel ────────────────────────────────────── */
const CurriculumPanel: React.FC<{ data: typeof CURRICULUM_TIERS[0]; index: number }> = ({ data, index }) => {
  const [active, setActive] = useState<number | null>(null);
  const sec = useInView();
  return (
    <section ref={sec as any} className="relative min-h-screen flex items-center overflow-hidden" style={{ background: '#080808' }}>
      <div className="absolute inset-0 z-0">
        <img src={data.bg} alt="" className="w-full h-full object-cover object-center opacity-20 scale-105" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, #080808 50%, rgba(8,8,8,0.55) 80%, rgba(8,8,8,0.2) 100%)' }} />
      </div>
      <div className="absolute right-0 bottom-0 w-1/3 h-2/3 z-0 hidden lg:block pointer-events-none">
        <img src={data.overlay} alt="" className="w-full h-full object-contain object-bottom opacity-12" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full">
        <div data-reveal className="mb-10">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-xs font-black tracking-widest uppercase px-3 py-1.5 border"
              style={{ color: RED, borderColor: `${RED}50` }}>TIER {index + 1}</span>
            <div className="h-px flex-1 max-w-[60px]" style={{ background: `${RED}40` }} />
          </div>
          <h2 className="font-black text-white leading-tight mb-2"
            style={{ fontSize: 'clamp(2.4rem,7vw,5rem)' }}>{data.tier}</h2>
          <p className="text-white/55 text-base">{data.tagline}</p>
        </div>

        <div className={`grid gap-5 ${data.courses.length === 1 ? 'max-w-xl' : 'grid-cols-1 sm:grid-cols-2 max-w-3xl'}`}>
          {data.courses.map((course, ci) => {
            const isCS = course.tag === 'COMING SOON';
            const isFree = course.tag === 'FREE';
            return (
              <div key={course.name}
                data-reveal data-reveal-delay={String(ci * 120)}
                className={`border bg-black/70 backdrop-blur-sm p-6 transition-all duration-500 ${isCS ? 'opacity-55 border-white/6' : 'border-white/12 hover:border-white/25'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{course.name}</p>
                    <p className="text-white/45 text-xs tracking-wider mt-1">{course.sub}</p>
                  </div>
                  <span className={`text-xs font-black px-2 py-1 flex-shrink-0 ${isFree ? 'bg-[#34A853] text-white' : isCS ? 'border border-white/15 text-white/45' : 'border text-white/60'}`}
                    style={!isFree && !isCS ? { borderColor: `${RED}50`, color: RED } : {}}>
                    {course.tag}
                  </span>
                </div>

                <button
                  className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/65 transition-colors mt-2"
                  onClick={() => setActive(active === ci ? null : ci)}>
                  <ChevronRight className={`w-3 h-3 transition-transform ${active === ci ? 'rotate-90' : ''}`} />
                  {active === ci ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                </button>
                <div className={`overflow-hidden transition-all duration-400 ${active === ci ? 'max-h-48 mt-3' : 'max-h-0'}`}>
                  <p className="text-white/65 text-sm leading-relaxed">{course.desc}</p>
                </div>

                {!isCS && (
                  <div className="mt-5 pt-4 border-t border-white/8">
                    <Link to={`/course/${course.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors"
                      style={{ color: isFree ? '#34A853' : 'rgba(255,255,255,0.75)' }}>
                      สมัครเรียน <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ─── Home ──────────────────────────────────────────────── */
const Home: React.FC = () => {
  const [statsModal, setStatsModal] = useState(false);
  const heroParallax = useParallax(0.2);
  const sec2 = useInView();
  const sec3 = useInView();
  const sec4 = useInView();
  const sec5 = useInView();
  const sec9 = useInView();
  const sec10 = useInView();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setStatsModal(false);
  }, []);

  return (
    <>
      <SEOHead
        title="CREATR365 — A Creative House for the Future of Live Commerce"
        description="Be Creator. Not Consumer. สร้างตัวตน สื่อสารทรงพลัง สร้างยอดขายด้วย PPACT Framework"
      />
      <CourseNavbar />
      <CursorGlow />

      {/* ═══ 1. HERO ═════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16 grain"
        style={{ background: '#070707' }}>
        <div ref={heroParallax} className="absolute inset-0 z-0 parallax-slow">
          <img src="/images/hero-team.jpg" alt="CREATR365 Team"
            className="w-full h-full object-cover object-center opacity-55 scale-110" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(105deg, #070707 42%, rgba(7,7,7,0.6) 70%, rgba(7,7,7,0.2) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-52"
            style={{ background: 'linear-gradient(to top, #070707, transparent)' }} />
        </div>
        <div className="absolute left-0 top-20 bottom-20 w-[2px]"
          style={{ background: `linear-gradient(to bottom, transparent, ${RED}, transparent)` }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full">
          <p className="text-[11px] font-bold tracking-[0.45em] text-white/40 mb-8 uppercase text-reveal"
            style={{ animationDelay: '0.05s' }}>
            CREATR365 · A Creative House for the Future of Live Commerce.
          </p>
          <div className="mb-10 overflow-hidden">
            <h1 className="font-black leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(3.6rem,10vw,8.5rem)' }}>
              <span className="block text-white text-reveal" style={{ animationDelay: '0.12s' }}>BE</span>
              <span className="block text-reveal" style={{ color: RED, animationDelay: '0.28s' }}>CREATOR.</span>
              <span className="block text-white/22 text-reveal" style={{ fontSize: '0.6em', animationDelay: '0.44s' }}>NOT CONSUMER.</span>
            </h1>
          </div>
          <div className="mb-10 border-l-2 pl-5 max-w-lg" style={{ borderColor: RED }}>
            <p className="text-white/65 text-base md:text-lg leading-relaxed">
              เมื่อ Live Commerce ไม่ใช่แค่การขายของ
            </p>
            <p className="text-white/40 text-sm mt-1">แต่คือการสร้างคุณค่า · สร้างอิทธิพล · สร้างอาชีพที่ยั่งยืน</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/courses"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white text-sm tracking-widest uppercase transition-all duration-300"
              style={{ background: RED }}>
              ดูหลักสูตร <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/articles/diagnostic-quiz"
              className="group inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-white/60 border border-white/15 hover:border-white/35 hover:text-white transition-all duration-300">
              <Play className="w-4 h-4" /> Find Your Path
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-25 float-y">
          <div className="w-5 h-8 border border-white/40 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ═══ 2. STATS STRIP ══════════════════════════════════════ */}
      <section ref={sec2 as any} className="bg-[#111] border-y border-white/8 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <p data-reveal className="text-[11px] font-bold tracking-[0.35em] uppercase text-white/45">Market Opportunity</p>
            <button data-reveal data-reveal-delay="100"
              onClick={() => setStatsModal(true)}
              className="text-xs text-white/40 border border-white/12 px-3 py-1.5 hover:border-white/30 hover:text-white/65 transition-all">
              ดูกราฟตลาด →
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map((s, i) => (
              <div key={s.label} data-reveal data-reveal-delay={String(i * 100)}
                className="bg-[#0D0D0D] border border-white/8 p-6 hover:border-white/18 transition-all duration-500">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/35 mb-2">{s.label}</p>
                <p className="text-3xl md:text-4xl font-black text-white leading-none mb-2">{s.v}</p>
                <p className="text-white/65 text-sm leading-snug mb-2">{s.l}</p>
                <p className="text-white/30 text-xs uppercase tracking-wider">{s.src}</p>
              </div>
            ))}
          </div>
          <p data-reveal data-reveal-delay="500"
            className="mt-5 text-white/30 text-xs leading-relaxed">
            แหล่งข้อมูล: Grand View Research (2024) · Momentum Works — SEA E-commerce (2025) · Priceza E-Commerce Thailand (2024)
          </p>
        </div>
      </section>

      {/* STATS MODAL (pop-up overlay) */}
      {statsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.87)' }} onClick={handleOverlayClick}>
          <div className="bg-[#111] border border-white/12 max-w-2xl w-full p-8 relative"
            style={{ animation: 'fadeInScale 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
            <button onClick={() => setStatsModal(false)}
              className="absolute top-4 right-5 text-white/40 hover:text-white text-2xl leading-none transition-colors">×</button>
            <p className="text-[10px] font-black tracking-[0.35em] uppercase mb-4" style={{ color: RED }}>
              Live-Streaming E-Commerce Market · Global
            </p>
            <h3 className="text-white font-black text-xl md:text-2xl mb-8">
              ตลาดโลกคาดเติบโตสู่ $287 พันล้าน ภายในปี 2034
            </h3>
            <div className="space-y-4 mb-8">
              {[
                { year: '2024', val: 89.33, max: 287 },
                { year: '2026', val: 119.62, max: 287 },
                { year: '2028', val: 160.17, max: 287 },
                { year: '2030', val: 210, max: 287 },
                { year: '2034', val: 287, max: 287 },
              ].map(b => (
                <div key={b.year} className="flex items-center gap-4">
                  <span className="text-white/40 text-xs font-mono w-10 flex-shrink-0">{b.year}</span>
                  <div className="flex-1 bg-white/5 h-6 relative overflow-hidden">
                    <div className="h-full" style={{
                      width: `${(b.val / b.max) * 100}%`,
                      background: `linear-gradient(to right, ${RED}cc, ${RED})`,
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                  <span className="text-white font-bold text-sm w-20 text-right">${b.val}B</span>
                </div>
              ))}
            </div>
            <p className="text-white/30 text-xs">Source: Grand View Research, Livestream E-Commerce Market Size Report (2024)</p>
            <p className="text-white/20 text-xs mt-1">CAGR 2024–2034: 33.9%</p>
          </div>
        </div>
      )}

      {/* ═══ 3. MARQUEE / เป็นเหมือนกันไหม? ════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '88vh', background: '#060606' }}>
        <div className="absolute inset-0 z-0">
          <img src="/images/identity-silhouette.jpg" alt=""
            className="w-full h-full object-cover object-center opacity-35" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, #060606 0%, rgba(6,6,6,0.45) 50%, #060606 100%)' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center min-h-[88vh] max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold tracking-[0.45em] uppercase mb-6 text-white/40">เพราะเราเข้าใจ</p>
            <h2 className="font-black text-white leading-tight mb-8"
              style={{ fontSize: 'clamp(2.8rem,8vw,6rem)' }}>เป็นเหมือนกันไหม ?</h2>
            <div className="space-y-3 mb-10">
              {['ไลฟ์แล้วไม่มีคนดู? ไม่มีคนแชร์?', 'ทำยังไงให้คนอยู่ต่อ? ปิดการขายยังไง?', 'ต้องใช้สคริปต์หรือเทคนิคอะไรดี?', 'จะพูดอย่างไรเพื่อให้เกิดรายรับในไลฟ์?'].map((p, i) => (
                <p key={i} className="text-white font-semibold" style={{ fontSize: 'clamp(1rem,2.5vw,1.35rem)', opacity: 1 - i * 0.16 }}>{p}</p>
              ))}
            </div>
            <div className="border-l-2 pl-5 mb-8" style={{ borderColor: RED }}>
              <p className="text-white/60 text-base md:text-lg leading-relaxed">
                หากคุณต้องการ <span className="text-white">"เรียนแค่ทฤษฎีการไลฟ์"</span> หรือ <span className="text-white">"การสอนแบบจับมือทำ"</span>
              </p>
              <p className="text-white/40 text-base mt-1">ที่นี่…ไม่ใช่ของคุณ</p>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xl">
              เพราะอนาคตของ Live Commerce ไม่ใช่แค่การขายของ<br />
              แต่คือการสร้างคุณค่า สร้างอิทธิพล และสร้างอาชีพที่ยั่งยืน
            </p>
          </div>
        </div>
        {/* Scrolling marquee at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/55 border-t border-white/5 py-3 overflow-hidden">
          <div className="flex whitespace-nowrap gap-14" style={{ animation: 'marquee 22s linear infinite' }}>
            {['Creatr365 · A Creative House for the Future of Live Commerce', 'Be a Creator. Not a Consumer.', 'เมื่อ Live Commerce ไม่ใช่แค่การขายของ', 'Psychology First · Data Always', 'Communication Changes Behavior', 'Identity is not something you find. It\'s something you build.', 'Be a Creator. Not a Consumer.'].concat(['Creatr365 · A Creative House for the Future of Live Commerce', 'เมื่อ Live Commerce ไม่ใช่แค่การขายของ']).map((t, i) => (
              <span key={i} className="text-xs font-semibold tracking-[0.2em] text-white/25 flex items-center gap-4 uppercase">
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: RED }} />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 4. เพราะเราเจอปัญหามาก่อน ═══════════════════════════ */}
      <section ref={sec3 as any} className="bg-[#0C0C0C] py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Row 1: image left + text right */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-start mb-10">
            <div data-reveal data-reveal-delay="0">
              <div className="relative overflow-hidden aspect-[4/3] group">
                <img src="/images/problem-up.png" alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, transparent 55%, rgba(12,12,12,0.85) 100%)' }} />
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-black tracking-widest uppercase px-2 py-1"
                    style={{ background: RED, color: 'white' }}>เพราะเราเจอปัญหามาก่อน</span>
                </div>
              </div>
            </div>
            <div data-reveal data-reveal-delay="150">
              <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-4" style={{ color: RED }}>เพราะเราเจอปัญหามาก่อน</p>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-5">
                ทุกคอร์สการเรียนรู้<br /><span className="text-white/40">สร้างจากประสบการณ์จริง</span>
              </h2>
              <p className="text-white/65 text-base leading-loose mb-5">
                เราสร้างคอร์สทั้งหมดจากพื้นฐานความเข้าใจในปัญหา
                และถอดทุกประสบการณ์จริงจากอาชีพ Live Commerce
                มาสร้างเป็นเนื้อหาการเรียนรู้ที่ครบในทุกมิติ
              </p>
              <p className="text-white/60 text-base leading-loose border-l-2 pl-4" style={{ borderColor: RED }}>
                ไม่ใช่แค่ไลฟ์ให้เป็น —<br />
                แต่ต้องการให้คุณ <strong className="text-white">สร้างไลฟ์ที่มีคุณค่า</strong><br />
                ด้วยมาตรฐานในอาชีพที่มีคุณภาพ<br />
                พร้อมก้าวเข้าสู่ตลาดระดับ Global ได้ในอนาคต
              </p>
            </div>
          </div>

          {/* Row 2: accordion left + image right */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-start">
            <div data-reveal data-reveal-delay="200">
              <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-5 text-white/45">
                สิ่งที่แบรนด์ต้องการในตอนนี้
              </p>
              <div className="border border-white/8 px-4">
                {BRAND_NEEDS.map((item, i) => <AccordionItem key={i} item={item} idx={i} />)}
              </div>
            </div>
            <div data-reveal data-reveal-delay="100">
              <div className="relative overflow-hidden aspect-[4/3] group">
                <img src="/images/creator-live2.png" alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(315deg, transparent 55%, rgba(12,12,12,0.85) 100%)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. BRAND PROMISE — Welcome to Creatr365's Family ════ */}
      <section ref={sec4 as any} className="bg-[#0A0A0A] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Team image */}
          <div data-reveal className="relative overflow-hidden mb-10" style={{ aspectRatio: '21/8' }}>
            <img src="/images/team-work.jpg" alt="CREATR365 Team"
              className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
              style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.7) 100%)' }}>
              <p className="text-[11px] font-bold tracking-[0.45em] uppercase text-white/65 mb-3">
                Welcome to Creatr365's Family
              </p>
              <h2 className="font-black text-white leading-tight" style={{ fontSize: 'clamp(1.8rem,4.5vw,3.2rem)' }}>
                หลักสูตรที่เลือกเรียนได้ตามสไตล์คุณ
              </h2>
            </div>
          </div>

          {/* 4 promise icons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {BRAND_PROMISE_ITEMS.map((item, i) => (
              <div key={item.label}
                data-reveal data-reveal-delay={String(i * 100)}
                className="bg-[#111] border border-white/8 overflow-hidden group hover:border-white/20 transition-all duration-500">
                <div className="aspect-square overflow-hidden bg-[#0A0A0A]">
                  <img src={item.img} alt={item.label}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-600" />
                </div>
                <div className="p-4">
                  <p className="text-white font-bold text-sm mb-1">{item.label}</p>
                  <p className="text-white/50 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6. CURRICULUM — 3 Full-Screen Panels ═══════════════ */}
      <div>
        {CURRICULUM_TIERS.map((tier, i) => (
          <CurriculumPanel key={tier.tier} data={tier} index={i} />
        ))}
      </div>
      <div className="bg-[#0A0A0A] py-6 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/35 text-sm">เลือกเรียนได้อย่างอิสระ · ไม่บังคับ flow · ระบบแนะนำเส้นทางให้อัตโนมัติ</p>
          <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/55 hover:text-white transition-colors">
            ดูหลักสูตรทั้งหมด <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ═══ 7. BRAND CONCEPT ════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '75vh', background: '#060606' }}>
        <div className="absolute inset-0 z-0">
          <img src="/images/team-behind.png" alt=""
            className="w-full h-full object-cover object-center opacity-28" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, #060606 0%, rgba(6,6,6,0.4) 50%, #060606 100%)' }} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[75vh] text-center px-6 py-20">
          <div className="mb-8" style={{ animation: 'fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
            <img src="/images/creatr365_center.png" alt="CREATR365"
              className="h-14 md:h-18 object-contain mx-auto mb-6 opacity-90" />
          </div>
          <div style={{ animation: 'fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.25s both' }}>
            <img src="/images/creatr365_concept_center.png" alt="Be a Creator. Not a Consumer."
              className="max-w-xs md:max-w-sm mx-auto object-contain" />
          </div>
          <p className="mt-10 text-white/40 text-base italic max-w-md"
            style={{ animation: 'fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s both' }}>
            "เพราะ เป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง<br />
            แต่คือการสร้างธุรกิจที่เติบโตได้"
          </p>
        </div>
      </section>

      {/* ═══ 8. JOURNEY — Full Image + Button Only ════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '80vh', background: '#000' }}>
        <div className="absolute inset-0 z-0">
          <img src="/images/journey-stairs.jpg" alt="Journey — Consumer to Creator"
            className="w-full h-full object-cover object-center opacity-80" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 100%)' }} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-end min-h-[80vh] pb-20 px-6">
          <Link to="/courses"
            className="group inline-flex items-center justify-center gap-3 px-10 py-5 font-black text-white text-sm tracking-widest uppercase transition-all duration-300 hover:opacity-90"
            style={{ background: RED }}>
            BEGIN YOUR JOURNEY
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ═══ 9. WHY CREATR365 DIFFERENCE? ════════════════════════ */}
      <section ref={sec9 as any} className="bg-[#0A0A0A] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div data-reveal className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-4 text-white/40">Comparison</p>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              WHY <span style={{ color: RED }}>CREATR365</span><br />
              <span className="text-white/30" style={{ fontSize: '0.75em' }}>DIFFERENCE ?</span>
            </h2>
          </div>

          <div className="border border-white/8">
            <div className="grid grid-cols-[2fr_3fr_3fr] border-b border-white/8">
              <div className="p-4 bg-[#0D0D0D]" />
              <div className="p-4 border-l border-white/5 flex items-center justify-center">
                <div className="text-center">
                  <X className="w-3 h-3 text-white/25 mx-auto mb-1" />
                  <span className="text-[10px] font-black text-white/35 tracking-widest uppercase">คอร์สทั่วไป</span>
                </div>
              </div>
              <div className="p-4 border-l border-white/5 flex items-center justify-center"
                style={{ background: `${RED}12` }}>
                <div className="text-center">
                  <Check className="w-3 h-3 mx-auto mb-1" style={{ color: RED }} />
                  <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: RED }}>CREATR365</span>
                </div>
              </div>
            </div>
            {WHY.map((row, i) => (
              <div key={i} data-reveal data-reveal-delay={String(i * 80)}
                className="grid grid-cols-[2fr_3fr_3fr] border-b border-white/5 last:border-0">
                <div className="p-5 bg-[#0D0D0D] flex items-center">
                  <p className="text-white/65 text-sm font-medium leading-snug">{row.q}</p>
                </div>
                <div className="p-5 border-l border-white/5 flex items-start gap-2">
                  <X className="w-3 h-3 text-white/25 flex-shrink-0 mt-0.5" />
                  <p className="text-white/35 text-sm leading-relaxed hidden md:block">{row.them}</p>
                </div>
                <div className="p-5 border-l border-white/5 flex items-start gap-2"
                  style={{ background: `${RED}06` }}>
                  <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#34A853' }} />
                  <p className="text-white/80 text-sm leading-relaxed hidden md:block">{row.us}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 10. SOFT SKILLS / CTA ═══════════════════════════════ */}
      <section ref={sec10 as any} className="bg-[#060606] py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p data-reveal className="text-[11px] font-bold tracking-[0.45em] uppercase mb-10 text-white/30">
            Welcome to Creatr365's Family
          </p>
          <h2 data-reveal data-reveal-delay="80"
            className="font-black text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(2.2rem,7vw,5.5rem)' }}>
            เราไม่สัญญาว่า<br />
            <span style={{ color: RED }}>เรียนจบแล้วคุณจะรวย</span>
          </h2>
          <p data-reveal data-reveal-delay="180"
            className="text-white/55 text-base md:text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            แต่เราจะให้คุณ <span className="text-white/80 font-semibold">"ได้ทำ"</span>{' '}
            เพื่อเอาไปปรับใช้ในการไลฟ์ที่คุณ{' '}
            <span className="text-white/80 font-semibold">"ทำได้"</span> จริง
          </p>

          <div data-reveal data-reveal-delay="260"
            className="mb-12 py-8 border-y border-white/8">
            <p className="font-black text-white tracking-widest uppercase mb-1"
              style={{ fontSize: 'clamp(1.8rem,5vw,3.5rem)' }}>
              BE A CREATOR.
            </p>
            <p className="font-black text-white/22 tracking-widest uppercase"
              style={{ fontSize: 'clamp(1.1rem,3vw,2rem)' }}>
              NOT A CONSUMER.
            </p>
          </div>

          <div data-reveal data-reveal-delay="360"
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses"
              className="group inline-flex items-center justify-center gap-3 px-10 py-5 font-black text-white text-sm tracking-widest uppercase transition-all duration-300"
              style={{ background: RED }}>
              BEGIN NOW <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/auth"
              className="inline-flex items-center justify-center px-10 py-5 font-bold text-white/60 text-sm border border-white/15 hover:border-white/30 hover:text-white/80 transition-all uppercase tracking-widest">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="bg-[#040404] border-t border-white/5 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div>
              <p className="text-white font-black text-base tracking-widest">CREATR365</p>
              <p className="text-white/40 text-xs mt-1">A Creative House for the Future of Live Commerce.</p>
            </div>
            <div className="flex flex-wrap gap-6">
              {[['หลักสูตร', '/courses'], ['บทความ', '/articles'], ['FAQ', '/faq'], ['ติดต่อ', '/contact'], ['เข้าสู่ระบบ', '/auth']].map(([l, h]) => (
                <Link key={l} to={h} className="text-white/40 hover:text-white/70 transition-colors uppercase tracking-wider text-xs">{l}</Link>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-[10px] text-white/25 uppercase tracking-wider">
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              {[['นโยบายความเป็นส่วนตัว', '/privacy'], ['ข้อกำหนดการใช้บริการ', '/terms'], ['นโยบายการคืนเงิน', '/refund-policy']].map(([l, h]) => (
                <Link key={l} to={h} className="hover:text-white/50 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
