import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import CursorGlow from '@/components/CursorGlow';
import { useReveal } from '@/hooks/useReveal';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Trophy, Users2, Award, MessageCircle, BarChart3, Handshake, Check, X, Zap, ArrowUpRight } from 'lucide-react';

interface CourseRow {
  id:string; slug:string; tag:string; title:string; subtitle:string;
  color:string; is_active:boolean; learning_type:string; status:string;
  cover_image_url:string|null; price:string; duration:string; level:string|null;
}

const RED  = '#CC0033';
const GRAY = 'rgba(255,255,255,0.60)';

const JOURNEY = [
  { n:'01', label:'Consumer',    sub:'ผู้บริโภค' },
  { n:'02', label:'Seller',      sub:'ผู้ขาย' },
  { n:'03', label:'Host',        sub:'Host' },
  { n:'04', label:'Pro Host',    sub:'Pro Host' },
  { n:'05', label:'Brand Host',  sub:'Brand Host' },
  { n:'06', label:'Creator',     sub:'Creator' },
];

const STATS = [
  { v:'$172.9B', l:'Global Live Commerce 2025' },
  { v:'41%',   l:'CAGR ถึงปี 2033' },
  { v:'1.1T฿',     l:'Market size in 2024' },
  { v:'+21.7%',  l:'Thailand growth rate (SEA)' },
];

const BENEFITS = [
  { icon:Trophy, title:'ปัตการยาย · ช่วยสร้างยอด', desc:'เสิ่นเติมความแล่น' },
  { icon:Users2, title:'รักษา Retention ระหว่างไลฟ์', desc:'ลักษณ์ ID ชัดเจน' },
  { icon:Award, title:'Identity ที่แข็งแกร่ง', desc:'ลูกค้าเชื่อใจและจำได้' },
  { icon:MessageCircle, title:'สื่อสารสัิกาได้ใจ', desc:'เข้าใจจิตใจลูก' },
  { icon:BarChart3, title:'Data-Driven Decision', desc:'อ่าน KPI เข้าใจ' },
  { icon:Handshake, title:'Brand Support', desc:'ระบบเต็มตัว' },
];

const WHY = [
  { q:'สอน "ทำไมได้ผล" ไม่ใช่แค่ "วิธีทำ"',            us:'PPACT Framework 5 มิติ ฝังในทุกคอร์ส',              them:'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube' },
  { q:'สร้าง Identity ที่แบรนด์ต้องการ',               us:'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด',    them:'เน้นเทคนิคตะโกนขายหรือสร้าง Hype' },
  { q:'ขับเคลื่อนด้วยข้อมูล ไม่ใช่ความรู้สึก',          us:'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools',     them:'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข' },
  { q:'ระบบที่รันได้เอง ไม่ต้องพึ่งโฮสต์คนเดียว',       us:'Brand Host Architect — วางระบบ Production ทั้งทีม',   them:'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย' },
  { q:'มาตรฐานวิชาชีพที่วัดผลได้จริง',                  us:'Key Collection System™ + Certificate มาตรฐาน',       them:'เรียนจบไม่รู้จะทำอะไรต่อ' },
];

const COLOR_HEX: Record<string, string> = {
  red:'#CC0033', green:'#34A853', blue:'#2E7FF7', purple:'#A366FF', 
  orange:'#FF8C00', yellow:'#FFB81C', pink:'#FF1493', cyan:'#00D4FF'
};

export const Home: React.FC = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const sec1 = useReveal();
  const sec2 = useReveal();
  const sec3 = useReveal();
  const sec4 = useReveal();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('courses').select('*').eq('is_active', true);
      setCourses((data || []) as CourseRow[]);
    })();
  }, []);

  return (
    <>
      <SEOHead page="home" />
      <CourseNavbar />
      <CursorGlow />

      {/* ══ 1. HERO SECTION ════════════════════════════ */}
      <section className="relative w-full min-h-screen flex items-center pt-32 bg-[#000000] overflow-hidden">
        {/* Hero image background */}
        <div className="absolute inset-0 z-0">
          {/* PHOTO: Team of professional creators - use high-contrast with dark overlay */}
          <img src="/images/hero-team.jpg" alt=""
            className="w-full h-full object-cover object-center opacity-40" />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(105deg, #000000 35%, rgba(0,0,0,0.70) 65%, rgba(0,0,0,0.3) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-48"
            style={{ background:'linear-gradient(to top, #000000, transparent)' }} />
        </div>

        {/* Left accent line */}
        <div className="absolute left-0 top-20 bottom-20 w-px"
          style={{ background:`linear-gradient(to bottom, transparent, ${RED}, transparent)` }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full">
          {/* Eyebrow */}
          <p className="text-[13px] font-bold tracking-[0.4em] text-white/70 mb-12 uppercase">
            CREATR365 · A Creative House for the Future of Live Commerce
          </p>

          {/* Main headline */}
          <div className="mb-14 overflow-hidden max-w-4xl">
            <h1 className="font-black leading-[0.95] tracking-tight" style={{ fontSize:'clamp(4.5rem,12vw,10rem)', color:'#FFFFFF' }}>
              <span className="block text-reveal" style={{ animationDelay:'0.1s' }}>BE</span>
              <span className="block text-reveal" style={{ color:RED, animationDelay:'0.25s' }}>CREATOR.</span>
              <span className="block text-reveal" style={{ fontSize:'0.55em', color:'rgba(255,255,255,0.35)', animationDelay:'0.4s' }}>NOT CONSUMER.</span>
            </h1>
          </div>

          {/* Sub copy */}
          <p className="text-white/80 text-lg md:text-2xl mb-4 max-w-2xl font-light leading-relaxed">
            Attention is a skill.
          </p>
          <p className="text-white/65 text-base md:text-lg mb-14 max-w-2xl leading-relaxed">
            Live Commerce ไม่ใช่แค่การขายของ —<br/>
            แต่คือศาสตร์ของ <span className="text-white/85 font-semibold">Human Behavior, Trust, Identity.</span>
          </p>

          {/* STATS strip in hero */}
          <div className="mt-20 pt-8 border-t border-white/20 flex flex-wrap gap-12">
            {STATS.map(s => (
              <div key={s.v}>
                <p className="text-3xl md:text-4xl font-black text-white">{s.v}</p>
                <p className="text-[12px] text-white/50 mt-2 max-w-[120px] leading-tight font-medium">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-40 float-y">
          <div className="w-5 h-8 border-2 border-white/50 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-white/70 rounded-full" />
          </div>
        </div>
      </section>

      {/* ══ 2. JOURNEY TRANSFORMATION ═══════════════════ */}
      <section className="bg-[#000000] py-32 px-6 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="mb-20">
            <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-4" style={{ color:RED }}>Creator Transformation System™</p>
            <h2 className="text-5xl md:text-7xl font-black text-white leading-tight max-w-3xl">
              จาก Consumer<br/>
              <span className="text-white/30">สู่</span> Creator
            </h2>
          </div>

          {/* Journey grid with connecting line */}
          <div className="relative grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
            {/* Connecting line */}
            <div className="absolute top-10 left-8 right-8 h-px hidden md:block"
              style={{ background:`linear-gradient(to right, transparent, ${RED}80, ${RED}80, transparent)` }} />

            {JOURNEY.map((j, i) => {
              const isLast = i === JOURNEY.length - 1;
              return (
                <div key={j.label} data-reveal data-reveal-delay={String(i * 80)} className="flex flex-col items-center text-center">
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500"
                    style={{
                      border:`2px solid ${isLast ? RED : 'rgba(255,255,255,0.25)'}`,
                      background: isLast ? `${RED}20` : 'rgba(255,255,255,0.03)',
                    }}>
                    <span className="text-sm font-black" style={{ color: isLast ? RED : 'rgba(255,255,255,0.50)' }}>{j.n}</span>
                  </div>
                  <p className="text-base font-bold mb-2" style={{ color: isLast ? RED : 'rgba(255,255,255,0.85)' }}>{j.label}</p>
                  <p className="text-xs text-white/40">{j.sub}</p>
                </div>
              );
            })}
          </div>

          <div data-reveal className="mt-16 flex items-start gap-3 max-w-2xl">
            <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color:RED }} />
            <p className="text-white/55 text-sm leading-relaxed font-medium">
              เลือกเรียนได้อย่างอิสระ ไม่บังคับ flow — ระบบจะแนะนำเส้นทางที่เหมาะกับคุณโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </section>

      {/* ══ 3. BENEFITS SECTION ════════════════════════ */}
      <section className="relative bg-[#0A0A0A] py-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="mb-20 text-center">
            <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-6 text-white/50">Benefits</p>
            <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
              อยากร่วมงาน<br/>กับแบรนด์ใหญ่?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">แบรนด์ใหญ่ต้องการคนที่มีมาตรฐาน</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} data-reveal data-reveal-delay={String(i * 100)}
                  className="p-8 bg-[#0A0A0A] border border-white/12 hover:border-white/25 transition-all duration-300">
                  <Icon className="w-10 h-10 mb-6" style={{ color:RED }} />
                  <h3 className="text-lg font-bold text-white mb-3">{b.title}</h3>
                  {b.desc && <p className="text-white/50 text-sm">{b.desc}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 4. IDENTITY SECTION ════════════════════════ */}
      <section className="relative bg-[#000000] py-32 px-6 overflow-hidden">
        {/* Identity image — silhouette with light */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block z-0">
          {/* PHOTO: Woman/creator silhouette with ring light - centered dramatic lighting */}
          <img src="/images/identity-silhouette.jpg" alt=""
            className="w-full h-full object-cover object-center opacity-50" />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(to left, rgba(0,0,0,0.2), #000000 30%)' }} />
        </div>

        <div ref={sec1 as any} className="relative z-10 max-w-3xl">
          <div data-reveal className="mb-12">
            <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-6 text-white/50">Purpose</p>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
              เอาปัญหานี้<br/>เหมือนกับใหม่?
            </h2>
          </div>

          <div className="space-y-6 max-w-xl">
            <p className="text-white/75 text-lg font-medium leading-relaxed">
              ไลฟ์แล้วไม่มีคนดู? ไม่มีคนแชร์?
            </p>
            <p className="text-white/65 text-lg leading-relaxed">
              ทำไมคนอื่นได้ขายยอด? คุณนั่งเหมือนเว้นไป?
            </p>
            <p className="text-white/65 text-lg leading-relaxed">
              ต้องใช้สคริปต์หรือเทคนิคอะไรถึงจะดี?
            </p>
            <p className="text-white/65 text-lg leading-relaxed">
              จะทำอย่างไรให้เก็บความรับผิดชอบไม่ได้?
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-white/15">
            <p className="text-white/50 text-sm italic">
              ทางออกที่ถูกต้องของ "ระบบการขายที่ใช้ได้จริง" คือ "การสร้างตัวตนที่ชัด" — ความไว้ใจของลูกค้า
            </p>
          </div>
        </div>
      </section>

      {/* ══ 5. ABOUT CREATR365 ═════════════════════════ */}
      <section className="relative bg-[#0A0A0A] py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* PHOTO: Team working on production/content - studio setting */}
          <img src="/images/team-work.jpg" alt=""
            className="w-full h-full object-cover object-top opacity-35" />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(to top, #0A0A0A 20%, rgba(10,10,10,0.75) 60%, rgba(10,10,10,0.5) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-4 text-white/50">เพราะเราเจอปัญหามาก่อน</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
                Creatr365
              </h2>
              <h3 className="text-2xl font-bold text-white/80 mb-6">
                คอร์สการเรียนรู้<br/>ที่สร้างจากประสบการณ์จริง
              </h3>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                เราสร้างคอร์สที่หมดจากพื้นฐานความชำนาญไลฟ์ บูมหานและถ่ายทำประสบการณ์จริง Live Commerce มาสร้างเป็นเนื้อหาที่ใช้ได้จริงทันที
              </p>
              <p className="text-white/50 text-base italic">
                เพราะไม่ไลดอเวี้ยงของ Live Commerce อยอวิไม่รูจะทำอะไรต่อ
              </p>
            </div>

            <div className="space-y-4">
              {/* PHOTO 1: Creator doing live with ring light */}
              <div className="aspect-[4/3] bg-[#111] rounded-lg overflow-hidden border border-white/10">
                <img src="/images/creator-live.jpg" alt="Creator doing live commerce"
                  className="w-full h-full object-cover opacity-70" />
              </div>

              {/* PHOTO 2 & 3: Analysis/dashboard and team */}
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-[#111] rounded-lg overflow-hidden border border-white/10">
                  <img src="/images/analytics.jpg" alt="Analytics dashboard"
                    className="w-full h-full object-cover opacity-70" />
                </div>
                <div className="aspect-square bg-[#111] rounded-lg overflow-hidden border border-white/10">
                  <img src="/images/team-analysis.jpg" alt="Team analyzing data"
                    className="w-full h-full object-cover opacity-70" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 6. COURSES SECTION ═════════════════════════ */}
      <section ref={sec2 as any} className="bg-[#000000] py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-4 text-white/50">Curriculum</p>
              <h2 className="text-5xl md:text-6xl font-black text-white">หลักสูตร</h2>
            </div>
            <div className="text-left md:text-right">
              <p className="text-white/50 text-sm mb-3 leading-relaxed font-medium">เลือกเรียนได้อย่างอิสระ ไม่บังคับ flow</p>
              <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                ดูทั้งหมด <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(n => <div key={n} className="h-96 shimmer rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 6).map((c, idx) => {
                const hex = COLOR_HEX[c.color] || '#888';
                const isFree = c.price?.toLowerCase().includes('ฟรี') || c.price === '0' || c.tag === 'FREE';
                const isCS = c.status === 'coming_soon';
                return (
                  <Link key={c.id} to={isCS ? '#' : `/course/${c.slug}`}
                    onClick={isCS ? e => e.preventDefault() : undefined}
                    data-reveal data-reveal-delay={String(idx * 80)}
                    className="group relative overflow-hidden border border-white/15 bg-[#0A0A0A] hover:bg-[#0F0F0F] hover:border-white/30 flex flex-col transition-all duration-500">

                    {/* Course image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#111]">
                      {c.cover_image_url ? (
                        <img src={c.cover_image_url} alt={c.title}
                          className="w-full h-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background:`linear-gradient(135deg, ${hex}15, transparent)` }}>
                          <span className="text-7xl font-black opacity-8" style={{ color:hex }}>
                            {c.title?.slice(0,2)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0"
                        style={{ background:'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)' }} />

                      {/* Status badge */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {isFree && <span className="px-3 py-1 text-xs font-bold bg-[#34A853] text-white rounded-sm">FREE</span>}
                        {isCS && <span className="px-3 py-1 text-xs font-bold text-white/50 border border-white/25 rounded-sm">COMING SOON</span>}
                        {c.status === 'now_open' && !isFree && (
                          <span className="px-3 py-1 text-xs font-bold text-white/80 border border-white/30 rounded-sm">NOW OPEN</span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-px" style={{ background:hex }} />
                        <span className="text-xs font-bold tracking-wider uppercase text-white/40">{c.tag}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 leading-snug">{c.title}</h3>
                      <p className="text-white/50 text-sm mb-6 flex-1 leading-relaxed">{c.subtitle}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="font-bold text-sm text-white/80">
                          {isFree ? 'ฟรี' : c.price}
                          {c.duration && <span className="text-white/40 font-normal text-xs ml-2">{c.duration}</span>}
                        </span>
                        {!isCS && (
                          <span className="text-xs font-bold uppercase tracking-wider text-white/40 group-hover:text-white/70 transition-colors flex items-center gap-1">
                            ดู <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div data-reveal className="mt-12 border border-white/12 p-7 flex gap-4 items-start bg-[#0A0A0A]">
            <Zap className="w-5 h-5 flex-shrink-0 mt-0.5 text-white/40" />
            <p className="text-white/60 text-sm leading-relaxed">
              <span className="text-white/75 font-semibold">เลือกเรียนได้อย่างอิสระ</span> — ระบบจะแนะนำคอร์สต่อไปให้คุณหลังเรียนแต่ละคอร์สโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </section>

      {/* ══ 7. WHY DIFFERENT ════════════════════════════ */}
      <section className="bg-[#0A0A0A] py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="text-center mb-16">
            <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-6 text-white/50">Why Different</p>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4">CREATR365 ≠ คอร์สทั่วไป</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">ที่สำหรับ ไม่ใช่แค่สอน วิธี</p>
          </div>

          <div className="border border-white/15 bg-[#000000] overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_3fr_3fr] border-b border-white/15 bg-[#060606]">
              <div className="p-6" />
              <div className="p-6 border-l border-white/10 flex items-center justify-center">
                <span className="text-xs font-black text-white/80 tracking-widest uppercase">CREATR365</span>
              </div>
              <div className="p-6 border-l border-white/10 flex items-center justify-center">
                <span className="text-xs font-black text-white/30 tracking-widest uppercase">คอร์สทั่วไป</span>
              </div>
            </div>
            {WHY.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_3fr_3fr] border-b border-white/10 last:border-0 bg-[#000000]">
                <div className="p-6 flex items-center">
                  <p className="text-white/70 text-sm font-medium leading-snug">{row.q}</p>
                </div>
                <div className="p-6 border-l border-white/10 flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#34A853] flex-shrink-0 mt-1" />
                  <p className="text-white/65 text-sm leading-relaxed hidden md:block">{row.us}</p>
                </div>
                <div className="p-6 border-l border-white/10 flex items-start gap-3">
                  <X className="w-4 h-4 text-white/20 flex-shrink-0 mt-1" />
                  <p className="text-white/25 text-sm leading-relaxed hidden md:block">{row.them}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. TEAM / ABOUT ═════════════════════════════ */}
      <section className="relative bg-[#000000] py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* PHOTO: Team studio or Jenjira at work */}
          <img src="/images/team-studio.jpg" alt=""
            className="w-full h-full object-cover object-top opacity-40" />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(to top, #000000 25%, rgba(0,0,0,0.70) 75%, rgba(0,0,0,0.5) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-8 text-white/50">About</p>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            สร้างผู้นำ<br/><span style={{ color:RED }}>ไลฟ์คอมเมิร์ซ</span><br/>ที่แบรนด์ไว้ใจ
          </h2>
          <p className="text-white/60 text-lg italic max-w-2xl mx-auto">
            "เรียนรู้จากประสบการณ์จริง · ระบบจริง · เครื่องมือจริง · เคสธุรกิจจริง"
          </p>
        </div>
      </section>

      {/* ══ 9. CTA SECTION ══════════════════════════════ */}
      <section className="bg-[#0A0A0A] py-40 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-10 text-white/40">Start Your Journey</p>
          <h2 className="text-6xl md:text-7xl font-black text-white leading-tight mb-6">
            Identity is<br/>not something<br/>you <span style={{ color:RED }}>find.</span>
          </h2>
          <p className="text-white/60 text-lg md:text-xl mb-16 font-medium">
            It's something you <span className="text-white/80 font-bold">build.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link to="/courses"
              className="group inline-flex items-center justify-center gap-3 px-12 py-6 font-black text-white text-base tracking-widest uppercase transition-all duration-300 hover:scale-[1.02]"
              style={{ background:RED }}>
              BEGIN NOW <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/auth"
              className="inline-flex items-center justify-center px-12 py-6 font-bold text-white/60 text-base border-2 border-white/25 hover:border-white/50 hover:text-white/80 transition-all uppercase tracking-widest">
              Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 10. FINAL JOURNEY VISUAL ════════════════════ */}
      <section className="relative bg-[#000000] py-40 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* PHOTO: Dramatic silhouettes on stairs - progression/ascension */}
          <img src="/images/journey-stairs.jpg" alt=""
            className="w-full h-full object-cover object-center opacity-45" />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(to right, #000000 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[12px] font-bold tracking-[0.35em] uppercase mb-6 text-white/50">journey</p>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                CREATR365<br/><span className="text-white/40">JOURNEY</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed font-medium">
                FROM CONSUMER TO CREATOR
              </p>
              <p className="text-white/50 text-base leading-relaxed mb-12">
                ทุกคนที่เคยเรียนมาก่อน จากผู้บริโภค สู่ CREATOR ที่โลกจดจำ
              </p>
              <Link to="/articles/diagnostic-quiz"
                className="inline-flex items-center gap-2 px-8 py-4 font-bold text-white/70 border border-white/20 hover:border-white/50 hover:text-white transition-all uppercase tracking-wider text-sm">
                Find Your Path <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative h-96 hidden lg:block">
              {/* Visualization of journey progression */}
              <div className="absolute inset-0 flex items-end justify-between px-4">
                {JOURNEY.map((j, i) => (
                  <div key={j.label} className="flex flex-col items-center">
                    <div className="h-full flex items-end">
                      <div className="w-8 rounded-t-lg transition-all duration-700"
                        style={{
                          background: i === 5 ? RED : 'rgba(255,255,255,0.15)',
                          height: `${(i + 1) * 50}px`
                        }} />
                    </div>
                    <p className="text-xs font-bold text-white/50 mt-2 text-center">{j.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
