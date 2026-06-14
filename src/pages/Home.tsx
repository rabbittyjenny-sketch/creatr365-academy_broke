import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import CursorGlow from '@/components/CursorGlow';
import { useReveal } from '@/hooks/useReveal';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Play, Check, X, Zap, ArrowUpRight } from 'lucide-react';

interface CourseRow {
  id:string; slug:string; tag:string; title:string; subtitle:string;
  color:string; is_active:boolean; learning_type:string; status:string;
  cover_image_url:string|null; price:string; duration:string; level:string|null;
}

/* ─── Brand constants ────────────────────────────────────── */
const RED = '#CC0033';

/* ─── Data ───────────────────────────────────────────────── */
const PAIN_POINTS = [
  'ไลฟ์แล้วไม่มีคนดู? ไม่มีคนแชร์?',
  'ทำยังไงให้คนอยู่ต่อ? ปิดการขายยังไง?',
  'ต้องใช้สคริปต์หรือเทคนิคอะไรดี?',
  'จะพูดอย่างไรเพื่อให้เกิดรายรับในไลฟ์?',
];

const STATS = [
  { v:'$172.9B', l:'มูลค่าตลาด Live Commerce โลก 2025', src:'Grand View Research' },
  { v:'41%',     l:'CAGR คาดการณ์ปี 2026–2033',          src:'Grand View Research' },
  { v:'1.1T฿',   l:'ตลาด e-Commerce ไทย ปี 2024 (+14%)', src:'Priceza' },
  { v:'+21.7%',  l:'ไทยโตเร็วที่สุดใน SEA ปี 2024',      src:'Momentum Works' },
];

const BRAND_NEEDS = [
  'ปิดการขาย · ช่วยสร้างยอด · ลดอัตราคืนสินค้า',
  'รักษา Retention ระหว่างไลฟ์',
  'สื่อสารสินค้าได้ตรงกลุ่ม',
  'สร้างความน่าเชื่อถือต่อตัวเองและผลิตภัณฑ์',
  'คุมภาพลักษณ์แบรนด์ได้ดี สื่อสารได้ตรง',
  'ทำงานแบบ Data-Driven + ปรับแคมเปญได้เร็ว',
  'ทำงานร่วมกับทีมหลังบ้านได้ รู้หน้าที่ Support',
];

const JOURNEY = [
  { n:'01', label:'Consumer',   sub:'ดู เลื่อน ซื้อ' },
  { n:'02', label:'Seller',     sub:'เปิดไลฟ์ครั้งแรก' },
  { n:'03', label:'Host',       sub:'มีทักษะ มีระบบ' },
  { n:'04', label:'Pro Host',   sub:'Data-Driven' },
  { n:'05', label:'Brand Host', sub:'Identity ชัด' },
  { n:'06', label:'Creator',    sub:'สร้างธุรกิจที่ยั่งยืน' },
];

const CURRICULUM_TIERS = [
  {
    tier: 'ไลฟ์ให้เป็น',
    desc: 'เริ่มต้นอย่างถูกต้อง สร้างรากฐานที่แข็ง',
    courses: [
      {
        name: 'THE MAGNET',
        sub: 'Live Commerce Blueprint',
        tag: 'FREE',
        why: 'แก้ปัญหาเรื่อง "ความกลัวและการเริ่มต้น" ชี้จุดกำแพงทฤษฎี ให้คว้าทิศทางได้เร็ว',
        slug: 'the-magnet',
      },
      {
        name: 'THE FOUNDATION',
        sub: 'Core Host Framework',
        tag: 'COURSE',
        why: 'เข้าใจภาพรวมอาชีพ อุตสาหกรรม เครื่องมือพื้นฐาน PPACT Framework และรู้ว่าตัวเองเหมาะกับอาชีพนี้ไหม',
        slug: 'the-foundation',
      },
    ],
  },
  {
    tier: 'ไลฟ์ให้ขายได้',
    desc: 'เปลี่ยนทักษะเป็นรายได้จริง',
    courses: [
      {
        name: 'SIGNAL',
        sub: 'The Conversion Host',
        tag: 'COURSE',
        why: 'แก้ปัญหาแกนหลัก คนดูน้อย ปิดการขายไม่ได้ ขายแข็ง อ่านข้อมูลไม่เป็น 9 ชั่วโมงเปลี่ยนทฤษฎีเป็นระบบทำเงิน',
        slug: 'signal',
      },
      {
        name: 'STAGE',
        sub: 'The Signature Intensive Lab',
        tag: 'COURSE',
        why: 'แก้ปัญหาหน้างาน ตื่นกล้อง ของหมด ระบบล่ม ปรับพฤติกรรมตาม Dashboard Data แบบเรียลไทม์',
        slug: 'stage',
      },
    ],
  },
  {
    tier: 'ไลฟ์ให้วัดผลและทำซ้ำได้',
    desc: 'สร้างระบบ ขยายธุรกิจ ไม่ขึ้นกับโฮสต์คนเดียว',
    courses: [
      {
        name: 'BRAND HOST ARCHITECT',
        sub: 'Masterclass',
        tag: 'COMING SOON',
        why: 'แก้ปัญหาเชิงโครงสร้างระบบและตัวเลขหลังบ้านของ Seller และเจ้าของธุรกิจ ตอบโจทย์ระบบขายแบบ End-to-End',
        slug: '',
      },
    ],
  },
];

const SOFT_SKILLS = [
  'Soft Skills',
  'การสื่อสาร',
  'การขาย',
  'การวางแผนงาน',
  'การวิเคราะห์ข้อมูล',
  'Digital Marketing สำหรับ Live Commerce',
  'ความคิดสร้างสรรค์ที่พร้อมออกนอกกรอบ',
];

const WHY = [
  { q:'สอน "ทำไมได้ผล" ไม่ใช่แค่ "วิธีทำ"',       them:'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube',             us:'PPACT Framework 5 มิติ ฝังในทุกคอร์ส' },
  { q:'สร้าง Identity ที่แบรนด์ต้องการ',           them:'เน้นเทคนิคตะโกนขายหรือสร้าง Hype',              us:'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด' },
  { q:'ขับเคลื่อนด้วยข้อมูล ไม่ใช่ความรู้สึก',     them:'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข',        us:'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools' },
  { q:'ระบบที่รันได้เอง ไม่ต้องพึ่งโฮสต์คนเดียว',  them:'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย',           us:'Brand Host Architect — วางระบบ Production ทั้งทีม' },
  { q:'มาตรฐานวิชาชีพที่วัดผลได้จริง',             them:'เรียนจบไม่รู้จะทำอะไรต่อ',                       us:'Key Collection System™ มาตรฐานอุตสาหกรรม' },
];

const COLOR_HEX: Record<string,string> = { blue:'#4285F4', red:RED, yellow:'#C49A1A', green:'#34A853', black:'#888' };

/* ─── Parallax hook ─────────────────────────────────────── */
function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onScroll = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return ref;
}

/* ─── Home ──────────────────────────────────────────────── */
const Home: React.FC = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const heroParallax = useParallax(0.25);
  const sec1 = useReveal() as React.MutableRefObject<HTMLElement|null>;
  const sec2 = useReveal() as React.MutableRefObject<HTMLElement|null>;
  const sec3 = useReveal() as React.MutableRefObject<HTMLElement|null>;
  const sec4 = useReveal() as React.MutableRefObject<HTMLElement|null>;

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    supabase.from('courses')
      .select('id,slug,tag,title,subtitle,color,is_active,learning_type,status,cover_image_url,price,duration,level')
      .eq('is_active', true).order('sort_order')
      .then(({ data }) => setCourses((data as any) || []));
  }, []);

  return (
    <>
      <SEOHead
        title="CREATR365 — A Creative House for the Future of Live Commerce"
        description="Be Creator. Not Consumer. สร้างตัวตน สื่อสารทรงพลัง สร้างยอดขายด้วย PPACT Framework"
      />
      <CourseNavbar />
      <CursorGlow />

      {/* ══ 1. HERO — Pain-first opening ══════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#060606] pt-16 grain">
        <div ref={heroParallax} className="absolute inset-0 z-0">
          <img src="/images/hero-creators.jpg" alt=""
            className="w-full h-full object-cover object-center opacity-45 scale-110" />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(105deg, #060606 50%, rgba(6,6,6,0.5) 75%, rgba(6,6,6,0.15) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-48"
            style={{ background:'linear-gradient(to top, #060606, transparent)' }} />
        </div>

        {/* Left accent */}
        <div className="absolute left-0 top-20 bottom-20 w-px"
          style={{ background:`linear-gradient(to bottom, transparent, ${RED}, transparent)` }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full">

          {/* Pain hook — lead with the problem */}
          <p className="text-sm font-bold tracking-[0.4em] text-white/55 mb-10 uppercase">
            CREATR365 · เจอปัญหา?
          </p>

          <div className="mb-10 max-w-2xl">
            {PAIN_POINTS.map((p, i) => (
              <p key={i}
                className="font-black leading-tight text-white/80 mb-2"
                style={{ fontSize:'clamp(1.15rem,3.2vw,1.75rem)', opacity: 1 - i * 0.18 }}>
                {p}
              </p>
            ))}
          </div>

          {/* Pattern interrupt — honest positioning */}
          <div className="mb-12 border-l-2 pl-5 max-w-lg" style={{ borderColor: RED }}>
            <p className="text-white/65 text-base leading-relaxed italic">
              หากคุณต้องการ{' '}
              <span className="text-white/70">"เรียนทฤษฎีการไลฟ์"</span>{' '}
              หรือ{' '}
              <span className="text-white/70">"การสอนแบบจับมือทำ"</span>{' '}
              — ที่นี่ไม่ใช่ของคุณ
            </p>
          </div>

          {/* Hero CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/courses"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white text-base tracking-widest uppercase transition-all duration-300"
              style={{ background: RED }}>
              ดูหลักสูตร
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/articles/diagnostic-quiz"
              className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white/50 border border-white/15 hover:border-white/30 hover:text-white/80 transition-all duration-300">
              <Play className="w-4 h-4" /> Find Your Path
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-20 float-y">
          <div className="w-5 h-8 border border-white/40 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ══ 2. MARKET — Social proof + urgency ════════════════ */}
      <section className="bg-[#0A0A0A] py-20 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {STATS.map((s, i) => (
              <div key={i} className="bg-[#0A0A0A] p-7">
                <p className="text-3xl md:text-4xl font-black text-white mb-1">{s.v}</p>
                <p className="text-white/65 text-sm leading-relaxed mb-1">{s.l}</p>
                <p className="text-white/40 text-sm uppercase tracking-wider">{s.src}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-white/40 text-sm leading-relaxed">
            แหล่งข้อมูล: Grand View Research (2025) · Priceza E-Commerce Report (2024) · Momentum Works — E-commerce in Southeast Asia 3.0 (2025)
          </p>
        </div>
      </section>

      {/* ══ MANIFESTO STRIP ═══════════════════════════════════ */}
      <div className="bg-[#060606] border-b border-white/5 py-4 overflow-hidden">
        <div className="flex whitespace-nowrap gap-16" style={{ animation:'marquee 24s linear infinite' }}>
          {[
            'Live Commerce ในไทยยังโตขึ้นอย่างมหาศาล',
            'แต่มันสวนทางกับอัตราการเติบโตในอาชีพ',
            'Attention is a professional skill.',
            'Be Creator. Not Consumer.',
            'Psychology First. Data Always.',
            'Communication changes behavior.',
            'Be a Creator. Not a Consumer.',
          ].concat([
            'Live Commerce ในไทยยังโตขึ้นอย่างมหาศาล',
            'แต่มันสวนทางกับอัตราการเติบโตในอาชีพ',
          ]).map((t, i) => (
            <span key={i} className="text-sm font-semibold tracking-[0.18em] text-white/45 flex items-center gap-4 uppercase">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: RED }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ══ 3. BRAND PROMISE — เราเจอปัญหามาก่อน ════════════ */}
      <section ref={sec1 as any} className="bg-[#060606] py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div data-reveal>
              <p className="text-sm font-bold tracking-[0.35em] uppercase mb-4" style={{ color: RED }}>
                เพราะเราเจอปัญหามาก่อน
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                Creatr365<br/>
                <span className="text-white/50">สร้างจาก</span><br/>
                ประสบการณ์จริง
              </h2>
              <p className="text-white/65 text-base leading-loose mb-6">
                เราสร้างคอร์สทั้งหมดจากพื้นฐานความเข้าใจในปัญหา
                และถอดทุกประสบการณ์จริงจากอาชีพ Live Commerce
                มาสร้างเป็นเนื้อหาการเรียนรู้ที่ครบในทุกมิติ
              </p>
              <p className="text-white/60 text-base leading-loose border-l-2 pl-4" style={{ borderColor: RED }}>
                ไม่ใช่แค่ไลฟ์ให้เป็น —<br/>
                แต่ต้องการให้คุณ<strong className="text-white"> สร้างไลฟ์ที่มีคุณค่า</strong><br/>
                ด้วยมาตรฐานในอาชีพที่มีคุณภาพ<br/>
                พร้อมก้าวเข้าสู่ตลาดระดับ Global ได้ในอนาคต
              </p>
            </div>

            {/* Brand needs grid */}
            <div data-reveal className="space-y-0">
              <p className="text-sm font-bold tracking-[0.3em] text-white/55 uppercase mb-5">
                ปัจจุบันแบรนด์ใหญ่ๆ ต้องการ
              </p>
              {BRAND_NEEDS.map((n, i) => (
                <div key={i}
                  className="flex items-start gap-3 py-3.5 border-b border-white/6 last:border-0">
                  <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: RED }} />
                  <p className="text-white/55 text-base leading-relaxed">{n}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. JOURNEY — Consumer → Creator ══════════════════ */}
      <section className="bg-[#0A0A0A] py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="mb-16">
            <p className="text-sm font-bold tracking-[0.35em] uppercase mb-3" style={{ color: RED }}>
              Creator Transformation System™
            </p>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight max-w-lg">
              จาก Consumer<br/>
              <span className="text-white/45">สู่</span> Creator
            </h2>
          </div>

          <div className="relative grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="absolute top-8 left-8 right-8 h-px hidden md:block"
              style={{ background:`linear-gradient(to right, transparent, ${RED}50, ${RED}50, transparent)` }} />
            {JOURNEY.map((j, i) => {
              const isLast = i === JOURNEY.length - 1;
              return (
                <div key={j.label} data-reveal data-reveal-delay={String(i * 80)} className="flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{
                      border:`1.5px solid ${isLast ? RED : 'rgba(255,255,255,0.12)'}`,
                      background: isLast ? `${RED}18` : 'rgba(255,255,255,0.02)',
                    }}>
                    <span className="text-sm font-black" style={{ color: isLast ? RED : 'rgba(255,255,255,0.3)' }}>{j.n}</span>
                  </div>
                  <p className="text-base font-bold mb-1" style={{ color: isLast ? RED : 'rgba(255,255,255,0.75)' }}>{j.label}</p>
                  <p className="text-sm text-white/50">{j.sub}</p>
                </div>
              );
            })}
          </div>

          <div data-reveal className="mt-12 flex items-start gap-3 max-w-xl">
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: RED }} />
            <p className="text-white/60 text-base leading-relaxed">
              เลือกเรียนได้อย่างอิสระ ไม่บังคับ flow —
              ระบบจะแนะนำเส้นทางที่เหมาะกับคุณโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </section>

      {/* ══ 5. CURRICULUM — 3-tier structure ═════════════════ */}
      <section ref={sec2 as any} className="bg-[#060606] py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="mb-16">
            <p className="text-sm font-bold tracking-[0.35em] uppercase mb-3 text-white/55">Curriculum</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-2">หลักสูตร 3 ชั้น</h2>
            <p className="text-white/55 text-base">เรียนได้อย่างอิสระ · ไม่บังคับ flow · ระบบแนะนำเส้นทางให้อัตโนมัติ</p>
          </div>

          <div className="space-y-10">
            {CURRICULUM_TIERS.map((tier, ti) => (
              <div key={tier.tier} data-reveal data-reveal-delay={String(ti * 100)}>
                {/* Tier header */}
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-sm font-black tracking-widest uppercase px-2 py-1 border"
                    style={{ color: RED, borderColor: `${RED}40` }}>
                    TIER {ti + 1}
                  </span>
                  <div>
                    <p className="text-white font-bold text-lg">&gt; {tier.tier}</p>
                    <p className="text-white/55 text-sm">{tier.desc}</p>
                  </div>
                </div>

                {/* Course cards */}
                <div className={`grid gap-4 ${tier.courses.length === 1 ? 'grid-cols-1 max-w-xl' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {tier.courses.map((course) => {
                    const isCS = course.tag === 'COMING SOON';
                    const isFree = course.tag === 'FREE';
                    const dbCourse = courses.find(c => c.slug === course.slug);
                    const hex = dbCourse ? (COLOR_HEX[dbCourse.color] || '#888') : RED;

                    return (
                      <div key={course.name}
                        className={`border border-white/8 bg-[#0E0E0E] p-6 transition-all duration-300 ${isCS ? 'opacity-50' : 'hover:border-white/20'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-white font-black text-lg leading-tight">{course.name}</p>
                            <p className="text-white/55 text-sm mt-0.5">{course.sub}</p>
                          </div>
                          <span className={`text-sm font-black px-2 py-1 flex-shrink-0 ml-3 ${
                            isFree ? 'bg-[#34A853] text-white' :
                            isCS ? 'border border-white/15 text-white/55' :
                            'border text-white/50'
                          }`}
                          style={!isFree && !isCS ? { borderColor:`${hex}50`, color: hex } : {}}>
                            {course.tag}
                          </span>
                        </div>

                        <p className="text-white/60 text-sm leading-relaxed mb-5">{course.why}</p>

                        {!isCS && (
                          <Link to={`/course/${course.slug}`}
                            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors"
                            style={{ color: isFree ? '#34A853' : 'rgba(255,255,255,0.5)' }}>
                            สมัครเรียน <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        {isCS && (
                          <p className="text-white/45 text-sm uppercase tracking-widest">Coming Soon</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div data-reveal className="mt-10 border border-white/6 p-5 flex gap-4 items-start bg-[#060606]">
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/45" />
            <p className="text-white/50 text-sm leading-relaxed">
              <span className="text-white/50 font-semibold">เลือกเรียนได้อย่างอิสระ</span> —
              ระบบจะแนะนำคอร์สต่อไปให้คุณหลังเรียนแต่ละคอร์สโดยอัตโนมัติ
            </p>
          </div>

          <div data-reveal className="mt-6 text-right">
            <Link to="/courses" className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-widest text-white/65 hover:text-white transition-colors">
              ดูหลักสูตรทั้งหมด <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 6. LIVE COURSE CARDS — from Supabase ═════════════ */}
      {courses.length > 0 && (
        <section ref={sec3 as any} className="bg-[#0A0A0A] py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-bold tracking-[0.35em] uppercase mb-8 text-white/50">เปิดรับสมัครตอนนี้</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c, idx) => {
                const hex = COLOR_HEX[c.color] || '#888';
                const isFree = (c.price?.toLowerCase() ?? '').includes('ฟรี') || c.price === '0' || c.tag === 'FREE';
                const isCS = c.status === 'coming_soon';
                return (
                  <Link key={c.id} to={isCS ? '#' : `/course/${c.slug}`}
                    onClick={isCS ? e => e.preventDefault() : undefined}
                    data-reveal data-reveal-delay={String(idx * 70)}
                    className="group relative overflow-hidden border border-white/8 bg-[#0E0E0E] flex flex-col transition-all duration-500 hover:border-white/20">

                    <div className="relative aspect-[16/10] overflow-hidden bg-[#111]">
                      {c.cover_image_url ? (
                        <img src={c.cover_image_url} alt={c.title}
                          className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background:`linear-gradient(135deg, ${hex}12, transparent)` }}>
                          <span className="text-6xl font-black opacity-10" style={{ color:hex }}>
                            {c.title?.slice(0,2)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background:'linear-gradient(to top, #0E0E0E 0%, transparent 60%)' }} />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {isFree && <span className="px-2 py-0.5 text-sm font-black bg-[#34A853] text-white">FREE</span>}
                        {isCS && <span className="px-2 py-0.5 text-sm font-bold text-white/65 border border-white/15">COMING SOON</span>}
                        {c.status === 'now_open' && !isFree && (
                          <span className="px-2 py-0.5 text-sm font-bold text-white/80 border border-white/20">NOW OPEN</span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-px" style={{ background:hex }} />
                        <span className="text-sm font-bold tracking-widest uppercase text-white/55">{c.tag}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1 leading-tight">{c.title}</h3>
                      <p className="text-white/55 text-sm mb-5 flex-1 leading-relaxed">{c.subtitle}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/6">
                        <span className="font-bold text-base" style={{ color: isFree ? '#34A853' : 'rgba(255,255,255,0.7)' }}>
                          {isFree ? 'ฟรี' : c.price}
                          {c.duration && <span className="text-white/45 font-normal text-sm ml-2">{c.duration}</span>}
                        </span>
                        {!isCS && (
                          <span className="text-sm font-bold uppercase tracking-widest text-white/45 group-hover:text-white/50 transition-colors flex items-center gap-1">
                            ดู <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ 7. WHY DIFFERENT — ตาราง (คอร์สทั่วไป | CREATR365) */}
      <section ref={sec4 as any} className="bg-[#060606] py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div data-reveal className="text-center mb-14">
            <p className="text-sm font-bold tracking-[0.35em] uppercase mb-4 text-white/55">Why Different</p>
            <h2 className="text-3xl md:text-5xl font-black text-white">CREATR365 ≠<br/>คอร์สทั่วไป</h2>
          </div>

          <div className="border border-white/8">
            {/* Header row */}
            <div className="grid grid-cols-[2fr_3fr_3fr] border-b border-white/8">
              <div className="p-4 bg-[#0A0A0A]" />
              <div className="p-4 border-l border-white/5 flex items-center justify-center">
                <span className="text-sm font-black text-white/50 tracking-widest uppercase">คอร์สทั่วไป</span>
              </div>
              <div className="p-4 border-l border-white/5 flex items-center justify-center"
                style={{ background:`${RED}08` }}>
                <span className="text-sm font-black tracking-widest uppercase" style={{ color: RED }}>CREATR365</span>
              </div>
            </div>
            {WHY.map((row, i) => (
              <div key={i} className="grid grid-cols-[2fr_3fr_3fr] border-b border-white/5 last:border-0">
                <div className="p-5 bg-[#0A0A0A] flex items-center">
                  <p className="text-white/50 text-sm font-medium">{row.q}</p>
                </div>
                <div className="p-5 border-l border-white/5 flex items-start gap-2">
                  <X className="w-3 h-3 text-white/40 flex-shrink-0 mt-0.5" />
                  <p className="text-white/45 text-sm leading-relaxed hidden md:block">{row.them}</p>
                </div>
                <div className="p-5 border-l border-white/5 flex items-start gap-2"
                  style={{ background:`${RED}05` }}>
                  <Check className="w-3 h-3 text-[#34A853] flex-shrink-0 mt-0.5" />
                  <p className="text-white/60 text-sm leading-relaxed hidden md:block">{row.us}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. SOFT SKILLS MANIFESTO ══════════════════════════ */}
      <section className="bg-[#0A0A0A] py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div data-reveal>
              <p className="text-sm font-bold tracking-[0.35em] uppercase mb-4 text-white/55">ทักษะที่สำคัญที่สุดในอาชีพนี้</p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-8">
                เราไม่สัญญา...<br/>
                <span className="text-white/45">ว่าเรียนแล้วรวย</span>
              </h2>
              <p className="text-white/65 text-base leading-loose mb-6">
                แต่เราจะให้คุณ{' '}
                <span className="text-white/70 font-semibold">"ได้ทำ"</span>{' '}
                เพื่อเอาไปปรับใช้ในการไลฟ์ที่คุณ{' '}
                <span className="text-white/70 font-semibold">"ทำได้"</span>{' '}
                จริง
              </p>
              <Link to="/courses"
                className="group inline-flex items-center gap-3 px-8 py-4 font-bold text-white text-base tracking-widest uppercase transition-all duration-300"
                style={{ background: RED }}>
                เริ่มต้นเลย
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div data-reveal className="space-y-0">
              {SOFT_SKILLS.map((s, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-white/6 last:border-0 group">
                  <span className="text-sm font-black text-white/40 w-5 flex-shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-white/50 text-base group-hover:text-white/80 transition-colors">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 9. CTA CLOSE ══════════════════════════════════════ */}
      <section className="bg-[#060606] py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold tracking-[0.35em] uppercase mb-8 text-white/45">
            Welcome to Creatr365's Family
          </p>
          <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-4">
            BE <span style={{ color: RED }}>CREATOR.</span><br/>
            <span className="text-white/45" style={{ fontSize:'0.65em' }}>NOT CONSUMER.</span>
          </h2>
          <p className="text-white/55 text-base mb-12 max-w-sm mx-auto leading-relaxed">
            … เพราะโจทย์ของตลาดตอนนี้คือ{' '}
            <span className="text-white/60">Performance · Data · ระบบขายแบบ End-to-End</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses"
              className="group inline-flex items-center justify-center gap-3 px-10 py-5 font-black text-white text-base tracking-widest uppercase transition-all duration-300"
              style={{ background: RED }}>
              BEGIN NOW <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/auth"
              className="inline-flex items-center justify-center px-10 py-5 font-bold text-white/65 text-base border border-white/12 hover:border-white/25 hover:text-white/70 transition-all uppercase tracking-widest">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer className="bg-[#040404] border-t border-white/5 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div>
              <p className="text-white font-black text-lg tracking-widest">CREATR365</p>
              <p className="text-white/45 text-sm mt-1">A Creative House for the Future of Live Commerce.</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-white/50">
              {[['หลักสูตร','/courses'],['บทความ','/articles'],['FAQ','/faq'],['ติดต่อ','/contact'],['เข้าสู่ระบบ','/auth']].map(([l,h]) => (
                <Link key={l} to={h} className="hover:text-white/50 transition-colors uppercase tracking-wider text-sm">{l}</Link>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-sm text-white/40 uppercase tracking-wider">
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              {[['นโยบายความเป็นส่วนตัว','/privacy'],['ข้อกำหนดการใช้บริการ','/terms'],['นโยบายการคืนเงิน','/refund-policy']].map(([l,h]) => (
                <Link key={l} to={h} className="hover:text-white/60 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
export default Home;
