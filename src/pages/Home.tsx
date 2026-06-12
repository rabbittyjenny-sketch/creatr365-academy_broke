import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Play, ChevronRight, Check, X, Monitor, Users, Zap } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */
interface CourseRow {
  id: string; slug: string; tag: string; title: string; subtitle: string;
  description: string; duration: string; price: string; color: string;
  is_active: boolean; learning_type: string; status: string;
  cover_image_url: string | null; level: string | null; format_label: string | null;
}

/* ─── Static data ─────────────────────────────────────────────── */
const PPACT = [
  { letter: 'P', name: 'Presence', th: 'การปรากฏตัว', problem: 'คนดูเลื่อนผ่านภายใน 3 วินาที', color: '#4285F4' },
  { letter: 'P', name: 'Psychology', th: 'จิตวิทยา', problem: 'คนดูเยอะแต่ไม่ซื้อ', color: '#CC0033' },
  { letter: 'A', name: 'Authority', th: 'ความน่าเชื่อถือ', problem: 'แบรนด์ไม่จ้าง ขาด Identity', color: '#D4A843' },
  { letter: 'C', name: 'Communication', th: 'การสื่อสาร', problem: 'พูดจนคอแห้งแต่ปิดขายไม่ได้', color: '#34A853' },
  { letter: 'T', name: 'Trust', th: 'ความไว้วางใจ', problem: 'ยอดขายไม่ยั่งยืน คนไม่ซื้อซ้ำ', color: '#9B59B6' },
];

const JOURNEY = [
  { step: 'Consumer', th: 'ผู้บริโภค', desc: 'ดู เลื่อน ซื้อ รอคอย', locked: false },
  { step: 'Seller', th: 'ผู้ขาย', desc: 'เปิดไลฟ์ขายสินค้าเบื้องต้น', locked: false },
  { step: 'Host', th: 'โฮสต์', desc: 'มีทักษะการนำเสนออย่างมีระบบ', locked: false },
  { step: 'Pro Host', th: 'โฮสต์มืออาชีพ', desc: 'อ่านดาต้า ปรับกลยุทธ์ด้วยตัวเลข', locked: false },
  { step: 'Brand Host', th: 'Brand Host', desc: 'ตัวตนชัด แบรนด์อยากร่วมงาน', locked: false },
  { step: 'Creator', th: 'Creator', desc: 'สร้างระบบธุรกิจที่ยั่งยืน', locked: false },
];

const MARKET_STATS = [
  { value: '$626.5B', label: 'Global Live Commerce 2024', sub: '→ $2,758.1B ภายใน 2030', color: '#4285F4' },
  { value: '27.7%', label: 'CAGR 2024–2030', sub: 'อุตสาหกรรมโตเร็วที่สุดในโลก', color: '#D4A843' },
  { value: '80%', label: 'ผู้บริโภคชอบ Live Shopping', sub: 'มากกว่า Static Content', color: '#CC0033' },
  { value: '+21.7%', label: 'ไทยเติบโตเร็วที่สุดใน SEA', sub: 'ติด Top 3 ภูมิภาค', color: '#34A853' },
];

const WHY_DIFF = [
  {
    point: 'สอน "ทำไมถึงได้ผล" ไม่ใช่แค่ "วิธีทำ"',
    us: 'PPACT Framework ครบทั้ง 5 มิติ ฝังในทุกหลักสูตร',
    them: 'สอนเรื่องพื้นฐานที่หาดูได้ฟรีบน YouTube',
  },
  {
    point: 'สร้าง Identity ที่แบรนด์ต้องการ',
    us: 'Host Archetype + 5 Hidden Souls เพื่อตัวตนที่ชัดเจน',
    them: 'เน้นเทคนิคตะโกนขายหรือสร้าง Hype ชั่วคราว',
  },
  {
    point: 'ขับเคลื่อนด้วยข้อมูล ไม่ใช่ความรู้สึก',
    us: 'สอนอ่าน KPI Dashboard (CCV, CTR, CVR, Retention) + AI',
    them: 'สอนให้พูดตามสคริปต์โดยไม่วิเคราะห์ข้อมูล',
  },
  {
    point: 'ระบบที่รันได้เองโดยไม่ต้องพึ่งโฮสต์คนเดียว',
    us: 'Brand Host Architect — วางระบบ Production ทั้งทีม',
    them: 'ขึ้นอยู่กับโฮสต์คนเดียว หากหายไปยอดขายก็หาย',
  },
  {
    point: 'มาตรฐานวิชาชีพที่วัดผลได้',
    us: 'Key Collection System™ + Certificate รับรองมาตรฐาน',
    them: 'เรียนจบแล้วไม่รู้ต้องทำอะไรต่อ',
  },
];

const COLOR_HEX: Record<string, string> = {
  blue: '#4285F4', red: '#CC0033', yellow: '#D4A843', green: '#34A853', black: '#888',
};

/* ─── Component ───────────────────────────────────────────────── */
const Home: React.FC = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* Force dark mode for the entire page */
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    supabase
      .from('courses')
      .select('id,slug,tag,title,subtitle,description,duration,price,color,is_active,learning_type,status,cover_image_url,level,format_label')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => { setCourses((data as unknown as CourseRow[]) || []); setLoading(false); });
  }, []);

  return (
    <>
      <SEOHead
        title="CREATR365 — A Creative House for the Future of Live Commerce"
        description="Be Creator. Not Consumer. สร้างตัวตน สื่อสารทรงพลัง สร้างยอดขายด้วยจิตวิทยา ระบบ Creator Transformation System™ ครบ 5 มิติ"
      />
      <CourseNavbar />

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#080808] pt-16">

        {/* Background image overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-creators.jpg"
            alt=""
            aria-hidden
            className="w-full h-full object-cover object-center opacity-20 scale-105"
          />
          {/* Gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/60" />
        </div>

        {/* Red vertical accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-[#CC0033] to-transparent z-10" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          {/* Eyebrow */}
          <p className="text-xs font-bold tracking-[0.3em] text-[#D4A843] mb-6 uppercase">
            CREATR365 : A Creative House for the Future of Live Commerce.
          </p>

          {/* Hero headline */}
          <div className="mb-8">
            <h1 className="font-bold leading-none tracking-tight">
              <span className="block text-white" style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)' }}>
                BE CREATOR.
              </span>
              <span
                className="block"
                style={{
                  fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                  background: 'linear-gradient(90deg, #D4A843 0%, #F5C842 50%, #D4A843 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                NOT CONSUMER.
              </span>
            </h1>
          </div>

          {/* Sub-headline */}
          <p className="text-white/60 text-lg md:text-xl mb-4 max-w-xl font-light tracking-wide">
            BUILD YOUR IDENTITY. COMMAND ATTENTION. CREATE IMPACT.
          </p>
          <p className="text-white/50 text-base mb-10 max-w-lg leading-relaxed">
            เพราะตลาดไม่ต้องการแค่คนพูดเก่ง<br/>
            แต่ต้องการ Creator ที่มี <span className="text-[#D4A843]">Identity</span> ชัดเจน
            และสร้างระบบธุรกิจที่วัดผลได้จริง
          </p>

          {/* PPACT pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {PPACT.map((p) => (
              <span
                key={p.letter + p.name}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{ borderColor: p.color + '60', color: p.color, background: p.color + '15' }}
              >
                {p.letter} — {p.name}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              to="/courses"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #CC0033, #aa0028)' }}
            >
              ดูหลักสูตรทั้งหมด
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/articles/diagnostic-quiz"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white/80 text-base border border-white/20 hover:border-[#D4A843]/50 hover:text-[#D4A843] transition-all duration-300"
            >
              <Play className="w-4 h-4" />
              หาเส้นทางที่ใช่สำหรับคุณ
            </Link>
          </div>

          {/* Market stat chips */}
          <div className="flex flex-wrap gap-4 pt-8 border-t border-white/10">
            {MARKET_STATS.map((s) => (
              <div key={s.value} className="flex items-center gap-2">
                <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs text-white/40 max-w-[120px] leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-40">
          <div className="w-6 h-10 rounded-full border border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — BRAND PROMISE STRIP
      ══════════════════════════════════════════════════════════ */}
      <div
        className="w-full py-4 overflow-hidden"
        style={{ background: 'linear-gradient(90deg, #0A0A0A, #1a1200, #0A0A0A)' }}
      >
        <div className="flex items-center gap-12 animate-[marquee_20s_linear_infinite] whitespace-nowrap px-8">
          {[
            'Creator Transformation System™',
            'PPACT Framework ครบ 5 มิติ',
            'Certificate รับรองมาตรฐาน',
            'Key Collection System™',
            'Data-Driven Live Commerce',
            'AI Tools Integration',
            'Brand Host Architecture',
          ].concat([
            'Creator Transformation System™',
            'PPACT Framework ครบ 5 มิติ',
            'Certificate รับรองมาตรฐาน',
          ]).map((item, i) => (
            <span key={i} className="text-sm font-medium text-white/40 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843] flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — CREATOR EVOLUTION JOURNEY
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#080808] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">Creator Transformation System™</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-xl">
              เส้นทางจาก
              <span className="text-white/40"> Consumer</span>
              <br />สู่
              <span style={{ color: '#D4A843' }}> Creator</span>
            </h2>
            <p className="text-white/40 text-sm max-w-xs text-right leading-relaxed">
              ไม่บังคับให้เรียนตาม flow —<br/>
              <span className="text-white/60">เลือกได้อย่างอิสระ</span><br/>
              ระบบจะแนะนำคอร์สที่เหมาะกับคุณต่อไป
            </p>
          </div>
          <p className="text-white/40 text-sm mb-12 max-w-2xl">
            Creator Transformation System™ ออกแบบมาเพื่อพาคุณผ่านทุกระดับ — แต่คุณสามารถเริ่มจากจุดที่คุณอยู่ได้เลย
          </p>

          {/* Journey steps */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-10 left-10 right-10 h-[2px] bg-gradient-to-r from-white/5 via-[#D4A843]/30 to-white/5 hidden md:block" />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {JOURNEY.map((j, i) => {
                const isLast = i === JOURNEY.length - 1;
                return (
                  <div
                    key={j.step}
                    className="relative flex flex-col items-center text-center group"
                  >
                    {/* Step circle */}
                    <div
                      className="relative w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{
                        borderColor: isLast ? '#D4A843' : 'rgba(255,255,255,0.15)',
                        background: isLast ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: isLast ? '#D4A843' : 'rgba(255,255,255,0.4)' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {isLast && (
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#D4A843' }} />
                      )}
                    </div>
                    <p
                      className="text-sm font-bold mb-1"
                      style={{ color: isLast ? '#D4A843' : 'rgba(255,255,255,0.8)' }}
                    >
                      {j.step}
                    </p>
                    <p className="text-[11px] text-white/30 leading-tight">{j.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 items-start">
            <Link
              to="/articles/diagnostic-quiz"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#D4A843] hover:opacity-80 transition-opacity"
            >
              ค้นหาระดับของคุณตอนนี้
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="hidden sm:block text-white/20">|</span>
            <Link
              to="/courses"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white/80 transition-colors"
            >
              ดูทุกหลักสูตรพร้อมเลือกเอง
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — MARKET OPPORTUNITY (with brand image)
      ══════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0D0D0D] py-24 px-6 overflow-hidden">
        {/* Background image */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 z-0 hidden lg:block">
          <img
            src="/images/brand-story.png"
            alt="สร้างผู้นำไลฟ์คอมเมิร์ซ"
            className="w-full h-full object-cover object-left opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <span className="text-xs font-bold tracking-[0.3em] text-[#CC0033] uppercase">The Opportunity</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-3 mb-4 max-w-lg leading-tight">
            ตลาดที่กำลัง<br/>
            <span style={{ color: '#CC0033' }}>เติบโตที่สุด</span><br/>
            ในโลก
          </h2>
          <p className="text-white/40 max-w-md mb-14 leading-relaxed">
            Live Commerce ไม่ใช่แค่เทรนด์ — มันกำลังกลายเป็น
            Infrastructure ของการซื้อขายยุคใหม่ และไทยอยู่ใจกลางของการเปลี่ยนแปลงนี้
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {MARKET_STATS.map((s) => (
              <div
                key={s.value}
                className="rounded-2xl p-6 border"
                style={{ background: s.color + '08', borderColor: s.color + '25' }}
              >
                <p className="text-3xl md:text-4xl font-bold mb-2" style={{ color: s.color }}>{s.value}</p>
                <p className="text-white/70 text-sm font-medium mb-1">{s.label}</p>
                <p className="text-white/30 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-2xl border border-white/8 bg-white/3 max-w-2xl">
            <p className="text-white/60 text-sm leading-relaxed">
              <span className="text-[#D4A843] font-semibold">90%</span> ของ Live Streamer ในตลาดวันนี้ ไลฟ์โดยไม่มีมาตรฐาน —
              ในขณะที่คนส่วนใหญ่กำลังเรียน <span className="text-white/80">"วิธีขาย"</span>{' '}
              คนที่จะเติบโตจริงคือคนที่กำลัง <span className="text-[#D4A843] font-semibold">"สร้างตัวตน"</span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — PPACT FRAMEWORK
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#080808] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">Our Methodology</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
            PPACT Framework
          </h2>
          <p className="text-white/40 text-center max-w-xl mx-auto mb-16 leading-relaxed">
            ระบบการเรียนรู้ 5 มิติที่ออกแบบมาเพื่อแก้ปัญหาหลักของ Live Commerce
            ที่ผู้ขายส่วนใหญ่มักพบเจอ — ฝังอยู่ในทุกหลักสูตร
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PPACT.map((p, i) => (
              <div
                key={p.letter + i}
                className="group relative rounded-2xl p-6 border transition-all duration-500 hover:-translate-y-1 cursor-default"
                style={{ borderColor: p.color + '25', background: p.color + '06' }}
              >
                {/* Giant letter background */}
                <div
                  className="absolute -top-4 -right-2 text-[6rem] font-black opacity-5 leading-none select-none"
                  style={{ color: p.color }}
                >
                  {p.letter}
                </div>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black mb-4"
                  style={{ background: p.color + '20', color: p.color }}
                >
                  {p.letter}
                </div>
                <p className="font-bold text-white text-base mb-0.5">{p.name}</p>
                <p className="text-xs font-medium mb-3" style={{ color: p.color }}>{p.th}</p>
                <p className="text-white/40 text-xs leading-relaxed">
                  <span className="text-white/20">แก้ปัญหา:</span><br/>
                  {p.problem}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 6 — OUR COURSES
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0D0D0D] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">Curriculum</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mt-3">หลักสูตรของเรา</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-white/40 text-sm text-right max-w-xs">
                เลือกเรียนได้อย่างอิสระ ไม่บังคับ flow —
                ระบบจะแนะนำคอร์สต่อไปให้คุณโดยอัตโนมัติ
              </p>
              <Link to="/courses" className="group inline-flex items-center gap-1 text-sm text-[#D4A843] hover:opacity-80 transition-opacity font-semibold">
                ดูทั้งหมด <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Course grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
              {[1,2,3].map(n => (
                <div key={n} className="rounded-2xl bg-white/3 animate-pulse h-72" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {courses.map((c) => {
                const hex = COLOR_HEX[c.color] || '#888';
                const isFree = c.price?.toLowerCase().includes('ฟรี') || c.price === '0' || c.tag === 'FREE';
                const isComingSoon = c.status === 'coming_soon';
                return (
                  <Link
                    key={c.id}
                    to={isComingSoon ? '#' : `/course/${c.slug}`}
                    className="group relative rounded-2xl overflow-hidden border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
                    style={{ borderColor: hex + '25', background: '#111' }}
                    onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
                  >
                    {/* Course image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {c.cover_image_url ? (
                        <img
                          src={c.cover_image_url}
                          alt={c.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${hex}15, ${hex}05)` }}
                        >
                          <span className="text-5xl font-black opacity-20" style={{ color: hex }}>
                            {c.tag?.slice(0, 2) || c.title?.slice(0, 2)}
                          </span>
                        </div>
                      )}
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                        {isFree && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#34A853] text-white">FREE</span>
                        )}
                        {isComingSoon && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white/60 border border-white/20">COMING SOON</span>
                        )}
                        {c.status === 'now_open' && !isFree && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold border" style={{ color: hex, borderColor: hex + '60', background: hex + '20' }}>
                            NOW OPEN
                          </span>
                        )}
                        {c.learning_type === 'offline' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white/60 border border-white/20 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Onsite
                          </span>
                        )}
                        {c.learning_type === 'online' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white/60 border border-white/20 flex items-center gap-1">
                            <Monitor className="w-3 h-3" /> VOD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course info */}
                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: hex }}>{c.tag}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1 leading-tight">{c.title}</h3>
                      <p className="text-white/50 text-xs mb-4 leading-relaxed flex-1">{c.subtitle}</p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/8">
                        <div>
                          {isFree ? (
                            <span className="text-[#34A853] font-bold text-sm">ฟรี</span>
                          ) : (
                            <span className="text-white font-semibold text-sm">{c.price}</span>
                          )}
                          {c.duration && (
                            <span className="ml-2 text-white/30 text-xs">{c.duration}</span>
                          )}
                        </div>
                        {!isComingSoon && (
                          <span
                            className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                            style={{ color: hex }}
                          >
                            ดูรายละเอียด <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 text-center py-20 text-white/30">กำลังอัปเดตหลักสูตร — เร็ว ๆ นี้</div>
          )}

          {/* Free path note */}
          <div className="mt-8 p-5 rounded-2xl border border-[#D4A843]/20 bg-[#D4A843]/5 flex gap-4 items-start">
            <Zap className="w-5 h-5 text-[#D4A843] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#D4A843] font-semibold text-sm mb-1">เริ่มต้นได้ทุกจุด</p>
              <p className="text-white/50 text-xs leading-relaxed">
                ไม่มีการบังคับ flow — เลือกเรียนตามความต้องการของคุณ
                ระบบจะแนะนำคอร์สที่เหมาะสมต่อไปให้โดยอัตโนมัติหลังจากที่คุณเรียนจบแต่ละคอร์ส
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 7 — WHY CREATR365 ≠ คอร์สทั่วไป
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#080808] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-bold tracking-[0.3em] text-[#CC0033] uppercase">Why Different</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            CREATR365 ≠ คอร์สไลฟ์ขายของทั่วไป
          </h2>
          <p className="text-white/40 text-center mb-14 max-w-lg mx-auto text-sm leading-relaxed">
            ในขณะที่คนส่วนใหญ่มักเรียน "วิธีขาย" CREATR365 มุ่งเน้นการสร้าง
            "มาตรฐานใหม่ของอุตสาหกรรม"
          </p>

          {/* Comparison table */}
          <div className="rounded-2xl overflow-hidden border border-white/8">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_3fr_3fr] gap-0">
              <div className="p-4 bg-[#0F0F0F] border-b border-white/8" />
              <div className="p-4 bg-[#CC0033]/10 border-b border-[#CC0033]/20 flex items-center justify-center">
                <span className="text-xs font-bold text-[#CC0033] tracking-widest uppercase hidden md:block">CREATR365</span>
                <span className="text-xs font-bold text-[#CC0033] md:hidden">เรา</span>
              </div>
              <div className="p-4 bg-white/3 border-b border-white/8 flex items-center justify-center">
                <span className="text-xs font-bold text-white/30 tracking-widest uppercase hidden md:block">คอร์สทั่วไป</span>
                <span className="text-xs font-bold text-white/30 md:hidden">ทั่วไป</span>
              </div>
            </div>

            {WHY_DIFF.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_3fr_3fr] gap-0 border-b border-white/5 last:border-0"
              >
                <div className="p-4 bg-[#0F0F0F] flex items-start">
                  <p className="text-white/70 text-xs font-medium leading-relaxed">{row.point}</p>
                </div>
                <div className="p-4 bg-[#CC0033]/5 flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#34A853] flex-shrink-0 mt-0.5" />
                  <p className="text-white/80 text-xs leading-relaxed hidden md:block">{row.us}</p>
                </div>
                <div className="p-4 bg-transparent flex items-start gap-2">
                  <X className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />
                  <p className="text-white/30 text-xs leading-relaxed hidden md:block">{row.them}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 8 — TEAM (brand image)
      ══════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0A0A0A] py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/team-studio.png"
            alt="Creatr365 Team"
            className="w-full h-full object-cover object-top opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-[#0A0A0A]/40" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">About</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6 leading-tight">
            สร้างผู้นำ<br/>
            <span style={{ color: '#D4A843' }}>ไลฟ์คอมเมิร์ซ</span><br/>
            ที่แบรนด์ไว้วางใจ
          </h2>
          <p className="text-white/50 text-base max-w-xl mx-auto mb-4 leading-relaxed">
            คอร์สเดียวจบ ครบทุกมิติที่ธุรกิจไลฟ์คอมเมิร์ซต้องการ
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {['Authority', 'Professional Communication', 'Presence', 'Analytical', 'Trust & Transparency'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs text-white/50 border border-white/15">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-white/30 text-sm italic max-w-lg mx-auto">
            "เรียนรู้จากประสบการณ์จริง • ระบบจริง • เครื่องมือจริง • เคสธุรกิจจริง"
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 9 — FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#080808] py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase mb-4">Start Your Journey</p>
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            เริ่มต้น<br/>
            <span style={{ color: '#D4A843' }}>Creator Journey</span><br/>
            ของคุณวันนี้
          </h2>
          <p className="text-white/40 mb-10 max-w-md mx-auto leading-relaxed">
            Identity is not something you find. <span className="text-white/60 italic">It's something you build.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/courses"
              className="group inline-flex items-center justify-center gap-2 px-10 py-5 rounded-xl font-bold text-white text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #CC0033, #990022)' }}
            >
              ดูหลักสูตรทั้งหมด
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/auth"
              className="group inline-flex items-center justify-center gap-2 px-10 py-5 rounded-xl font-bold text-[#D4A843] text-base border-2 border-[#D4A843]/40 hover:border-[#D4A843] hover:bg-[#D4A843]/10 transition-all duration-300"
            >
              สร้างบัญชีฟรี
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-14 flex flex-wrap justify-center gap-8 text-center">
            {[
              { num: 'Creator Transformation', sub: 'System™ ที่ครบ 5 มิติ' },
              { num: 'Key Collection', sub: 'System™ รับรองมาตรฐาน' },
              { num: 'Data-Driven', sub: 'ไม่ใช่แค่ความรู้สึก' },
            ].map(t => (
              <div key={t.num}>
                <p className="text-white font-bold text-sm">{t.num}</p>
                <p className="text-white/30 text-xs mt-1">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#050505] border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <p className="text-white font-bold text-lg tracking-tight">CREATR365</p>
              <p className="text-white/30 text-xs mt-1">A Creative House for the Future of Live Commerce.</p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-white/30">
              <Link to="/courses" className="hover:text-white/60 transition-colors">หลักสูตร</Link>
              <Link to="/articles" className="hover:text-white/60 transition-colors">บทความ</Link>
              <Link to="/faq" className="hover:text-white/60 transition-colors">FAQ</Link>
              <Link to="/contact" className="hover:text-white/60 transition-colors">ติดต่อ</Link>
              <Link to="/auth" className="hover:text-white/60 transition-colors">เข้าสู่ระบบ</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-2 text-xs text-white/20">
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="hover:text-white/40 transition-colors">นโยบายความเป็นส่วนตัว</Link>
              <Link to="/terms" className="hover:text-white/40 transition-colors">ข้อกำหนดการใช้บริการ</Link>
              <Link to="/refund-policy" className="hover:text-white/40 transition-colors">นโยบายการคืนเงิน</Link>
              <Link to="/faq" className="hover:text-white/40 transition-colors">FAQ</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
