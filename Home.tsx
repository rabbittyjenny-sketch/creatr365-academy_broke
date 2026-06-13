import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import CursorGlow from '@/components/CursorGlow';
import { useReveal } from '@/hooks/useReveal';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Play, ChevronRight, Check, X, Monitor, Users, Zap, ArrowUpRight } from 'lucide-react';

interface CourseRow {
  id:string; slug:string; tag:string; title:string; subtitle:string;
  color:string; is_active:boolean; learning_type:string; status:string;
  cover_image_url:string|null; price:string; duration:string; level:string|null;
}

/* ─── Brand constants (per Master Brand System) ────────── */
const RED  = '#CC0033';
const GRAY = 'rgba(255,255,255,0.45)';

const PPACT = [
  { letter:'P', name:'Presence',   th:'การปรากฏตัว',    desc:'คนดูตัดสินใจภายใน 3 วินาที' },
  { letter:'P', name:'Psychology', th:'จิตวิทยา',        desc:'ทำให้คนรู้สึก ก่อนคนซื้อ' },
  { letter:'A', name:'Authority',  th:'ความน่าเชื่อถือ', desc:'แบรนด์เลือกคนที่มี Identity' },
  { letter:'C', name:'Communication', th:'การสื่อสาร',   desc:'สื่อสารที่เปลี่ยนพฤติกรรม' },
  { letter:'T', name:'Trust',      th:'ความไว้ใจ',       desc:'ยอดขายที่ยั่งยืนสร้างจาก Trust' },
];

const JOURNEY = [
  { n:'01', label:'Consumer',    sub:'ดู เลื่อน ซื้อ' },
  { n:'02', label:'Seller',      sub:'เปิดไลฟ์ครั้งแรก' },
  { n:'03', label:'Host',        sub:'มีทักษะ มีระบบ' },
  { n:'04', label:'Pro Host',    sub:'Data-Driven' },
  { n:'05', label:'Brand Host',  sub:'Identity ชัด' },
  { n:'06', label:'Creator',     sub:'สร้างธุรกิจที่ยั่งยืน' },
];

const STATS = [
  { v:'$626.5B', l:'Global Live Commerce 2024' },
  { v:'27.7%',   l:'CAGR ถึงปี 2030' },
  { v:'80%',     l:'ผู้บริโภคชอบ Live Shopping' },
  { v:'+21.7%',  l:'ไทยโตเร็วที่สุดใน SEA' },
];

const WHY = [
  { q:'สอน "ทำไมได้ผล" ไม่ใช่แค่ "วิธีทำ"',            us:'PPACT Framework 5 มิติ ฝังในทุกคอร์ส',              them:'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube' },
  { q:'สร้าง Identity ที่แบรนด์ต้องการ',               us:'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด',    them:'เน้นเทคนิคตะโกนขายหรือสร้าง Hype' },
  { q:'ขับเคลื่อนด้วยข้อมูล ไม่ใช่ความรู้สึก',          us:'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools',     them:'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข' },
  { q:'ระบบที่รันได้เอง ไม่ต้องพึ่งโฮสต์คนเดียว',       us:'Brand Host Architect — วางระบบ Production ทั้งทีม',   them:'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย' },
  { q:'มาตรฐานวิชาชีพที่วัดผลได้จริง',                  us:'Key Collection System™ + Certificate มาตรฐาน',       them:'เรียนจบไม่รู้จะทำอะไรต่อ' },
];

const COLOR_HEX: Record<string,string> = { blue:'#4285F4', red:RED, yellow:'#C49A1A', green:'#34A853', black:'#888' };

/* ─── Parallax hook ────────────────────────────────────── */
function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onScroll = () => {
      const y = window.scrollY * speed;
      el.style.transform = `translateY(${y}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return ref;
}

/* ─── Home ─────────────────────────────────────────────── */
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
    supabase.from('courses').select('id,slug,tag,title,subtitle,color,is_active,learning_type,status,cover_image_url,price,duration,level')
      .eq('is_active', true).order('sort_order')
      .then(({ data }) => setCourses((data as any) || []));
  }, []);

  return (
    <>
      <SEOHead title="CREATR365 — A Creative House for the Future of Live Commerce"
        description="Be Creator. Not Consumer. สร้างตัวตน สื่อสารทรงพลัง สร้างยอดขายด้วย PPACT Framework" />
      <CourseNavbar />
      <CursorGlow />

      {/* ══ 1. HERO ════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#060606] pt-16 grain">
        {/* Parallax image — VISIBLE, editorial right-side crop */}
        <div ref={heroParallax} className="absolute inset-0 z-0 parallax-slow">
          <img src="/images/hero-creators.jpg" alt=""
            className="w-full h-full object-cover object-center opacity-55 scale-110" />
          {/* Editorial gradient: text side dark, image side lighter */}
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(105deg, #060606 42%, rgba(6,6,6,0.55) 70%, rgba(6,6,6,0.2) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-40"
            style={{ background:'linear-gradient(to top, #060606, transparent)' }} />
        </div>

        {/* Left accent line */}
        <div className="absolute left-0 top-20 bottom-20 w-px"
          style={{ background:`linear-gradient(to bottom, transparent, ${RED}, transparent)` }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full">
          {/* Eyebrow */}
          <p className="text-[11px] font-bold tracking-[0.4em] text-white/35 mb-8 uppercase">
            CREATR365 · A Creative House for the Future of Live Commerce.
          </p>

          {/* Headline — commanding, editorial */}
          <div className="mb-10 overflow-hidden">
            <h1 className="font-black leading-[0.9] tracking-tight" style={{ fontSize:'clamp(3.8rem,11vw,9rem)' }}>
              <span className="block text-white text-reveal" style={{ animationDelay:'0.1s' }}>BE</span>
              <span className="block text-reveal" style={{ color:RED, animationDelay:'0.25s' }}>CREATOR.</span>
              <span className="block text-white/20 text-reveal" style={{ fontSize:'0.65em', animationDelay:'0.4s' }}>NOT CONSUMER.</span>
            </h1>
          </div>

          {/* Sub copy — brand voice: short, psychologically sharp */}
          <p className="text-white/50 text-lg md:text-xl mb-3 max-w-lg font-light leading-relaxed">
            Attention is a skill.
          </p>
          <p className="text-white/30 text-base mb-10 max-w-md leading-loose">
            Live Commerce ไม่ใช่แค่การขายของ —<br/>
            แต่คือศาสตร์ของ <span className="text-white/60">Human Behavior, Trust, Identity.</span>
          </p>

          {/* PPACT compact pills */}
          <div className="flex flex-wrap gap-2 mb-12">
            {PPACT.map(p => (
              <span key={p.letter+p.name}
                className="px-3 py-1 rounded-full text-[11px] font-semibold text-white/50 border border-white/10 tracking-wide">
                {p.letter} · {p.name}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/courses"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-none font-bold text-white text-sm tracking-widest uppercase transition-all duration-300"
              style={{ background:RED }}>
              EXPLORE COURSES
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/articles/diagnostic-quiz"
              className="group inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-white/50 border border-white/15 hover:border-white/30 hover:text-white/80 transition-all duration-300">
              <Play className="w-4 h-4" /> Find Your Path
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-20 pt-8 border-t border-white/8 flex flex-wrap gap-8">
            {STATS.map(s => (
              <div key={s.v}>
                <p className="text-2xl font-black text-white">{s.v}</p>
                <p className="text-[11px] text-white/30 mt-0.5 max-w-[100px] leading-tight">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-25 float-y">
          <div className="w-5 h-8 border border-white/40 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ══ MANIFESTO STRIP ════════════════════════════════ */}
      <div className="bg-[#0A0A0A] border-y border-white/5 py-5 overflow-hidden">
        <div className="flex whitespace-nowrap gap-16" style={{ animation:'marquee 22s linear infinite' }}>
          {['Attention is a professional skill.', 'Communication changes behavior.', 'คนจำ energy ได้ก่อนคำพูด', 'Identity is not something you find. It\u2019s something you build.', 'Be Creator. Not Consumer.', 'Live Commerce is the new media.', 'Psychology First.'].concat(['Attention is a professional skill.', 'Communication changes behavior.', 'คนจำ energy ได้ก่อนคำพูด']).map((t, i) => (
            <span key={i} className="text-xs font-semibold tracking-[0.2em] text-white/20 flex items-center gap-4 uppercase">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background:RED }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ══ 2. CREATOR TRANSFORMATION SYSTEM™ ════════════ */}
      <section ref={sec1 as any} className="bg-[#060606] py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="mb-16">
            <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-3"
              style={{ color:RED }}>Creator Transformation System™</p>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight max-w-lg">
              จาก Consumer<br/>
              <span className="text-white/20">สู่</span> Creator
            </h2>
          </div>

          {/* Journey — horizontal editorial */}
          <div className="relative grid grid-cols-3 md:grid-cols-6 gap-4">
            {/* Connecting line */}
            <div className="absolute top-8 left-8 right-8 h-px hidden md:block"
              style={{ background:`linear-gradient(to right, transparent, ${RED}60, ${RED}60, transparent)` }} />

            {JOURNEY.map((j, i) => {
              const isLast = i === JOURNEY.length - 1;
              return (
                <div key={j.label} data-reveal data-reveal-delay={String(i * 80)} className="flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-500"
                    style={{
                      border:`1.5px solid ${isLast ? RED : 'rgba(255,255,255,0.12)'}`,
                      background: isLast ? `${RED}18` : 'rgba(255,255,255,0.02)',
                    }}>
                    <span className="text-xs font-black" style={{ color: isLast ? RED : 'rgba(255,255,255,0.3)' }}>{j.n}</span>
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: isLast ? RED : 'rgba(255,255,255,0.75)' }}>{j.label}</p>
                  <p className="text-[10px] text-white/25">{j.sub}</p>
                </div>
              );
            })}
          </div>

          <div data-reveal className="mt-12 flex items-start gap-3 max-w-xl">
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color:RED }} />
            <p className="text-white/35 text-sm leading-relaxed">
              เลือกเรียนได้อย่างอิสระ ไม่บังคับ flow —
              ระบบจะแนะนำเส้นทางที่เหมาะกับคุณโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </section>

      {/* ══ 3. MARKET OPPORTUNITY ═════════════════════════ */}
      <section className="relative bg-[#0A0A0A] py-28 px-6 overflow-hidden">
        {/* Brand image — editorial, fully visible right side */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block z-0">
          <img src="/images/brand-story.png" alt=""
            className="w-full h-full object-cover object-left opacity-60" />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(to right, #0A0A0A 30%, rgba(10,10,10,0.3) 100%)' }} />
        </div>

        <div ref={sec2 as any} className="relative z-10 max-w-6xl mx-auto">
          <div data-reveal>
            <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-4 text-white/30">The Opportunity</p>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6 max-w-lg">
              ตลาดที่<span style={{ color:RED }}> โต</span><br/>เร็วที่สุด<br/>ในโลก
            </h2>
            <p className="text-white/35 max-w-sm mb-14 leading-relaxed text-sm">
              "โลกกำลังให้รางวัลกับคนที่สื่อสารเก่ง"<br/>
              และไทยอยู่ใจกลางของการเปลี่ยนแปลงนี้
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div key={s.v} data-reveal data-reveal-delay={String(i * 100)}
                className="rounded-none border p-6 transition-all duration-300"
                style={{ borderColor:'rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)' }}>
                <p className="text-3xl font-black text-white mb-2">{s.v}</p>
                <p className="text-white/35 text-xs leading-relaxed">{s.l}</p>
              </div>
            ))}
          </div>

          <div data-reveal className="mt-8 p-5 border border-white/6 max-w-xl bg-black/30 text-sm text-white/40 leading-loose">
            "90% ของ Live Streamer วันนี้ ไลฟ์โดยไม่มีมาตรฐาน —
            คนที่เติบโตจริงคือคนที่กำลัง <span className="text-white/70 font-semibold">สร้างตัวตน</span> ไม่ใช่แค่ขายของ"
          </div>
        </div>
      </section>

      {/* ══ 4. PPACT FRAMEWORK ════════════════════════════ */}
      <section ref={sec3 as any} className="bg-[#060606] py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-4 text-white/30">Our Methodology</p>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-3">PPACT</h2>
            <p className="text-white/30 text-sm max-w-sm mx-auto">ระบบ 5 มิติที่ฝังอยู่ในทุกหลักสูตร — แก้ปัญหาหลักที่ Live Host ส่วนใหญ่มีแต่ไม่รู้</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-px bg-white/5">
            {PPACT.map((p, i) => (
              <div key={p.name} data-reveal data-reveal-delay={String(i * 80)}
                className="p-8 bg-[#060606] transition-all duration-500 group cursor-default">
                {/* Giant ghost letter */}
                <div className="text-[6rem] font-black leading-none opacity-5 text-white mb-4 select-none">{p.letter}</div>
                <div className="w-8 h-px mb-5" style={{ background:RED }} />
                <p className="text-white font-bold text-base mb-1">{p.name}</p>
                <p className="text-white/30 text-xs mb-4">{p.th}</p>
                <p className="text-white/20 text-xs leading-relaxed group-hover:text-white/40 transition-colors">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. COURSES ════════════════════════════════════ */}
      <section ref={sec4 as any} className="bg-[#0A0A0A] py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-3 text-white/30">Curriculum</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">หลักสูตร</h2>
            </div>
            <div className="text-right">
              <p className="text-white/25 text-xs mb-2 leading-relaxed">เลือกเรียนได้อย่างอิสระ ไม่บังคับ flow</p>
              <Link to="/courses" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                ดูทั้งหมด <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(n => <div key={n} className="h-72 shimmer rounded-none" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c, idx) => {
                const hex = COLOR_HEX[c.color] || '#888';
                const isFree = c.price?.toLowerCase().includes('ฟรี') || c.price === '0' || c.tag === 'FREE';
                const isCS = c.status === 'coming_soon';
                return (
                  <Link key={c.id} to={isCS ? '#' : `/course/${c.slug}`}
                    onClick={isCS ? e => e.preventDefault() : undefined}
                    data-reveal data-reveal-delay={String(idx * 70)}
                    className="group relative overflow-hidden border border-white/8 bg-[#0E0E0E] flex flex-col transition-all duration-500 hover:border-white/20">

                    {/* Course image — visible, editorial */}
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
                      <div className="absolute inset-0"
                        style={{ background:'linear-gradient(to top, #0E0E0E 0%, transparent 60%)' }} />

                      {/* Status badge */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {isFree && <span className="px-2 py-0.5 text-[10px] font-black bg-[#34A853] text-white">FREE</span>}
                        {isCS && <span className="px-2 py-0.5 text-[10px] font-bold text-white/40 border border-white/15">COMING SOON</span>}
                        {c.status === 'now_open' && !isFree && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-white/80 border border-white/20">NOW OPEN</span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-px" style={{ background:hex }} />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/30">{c.tag}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1 leading-tight">{c.title}</h3>
                      <p className="text-white/30 text-xs mb-5 flex-1 leading-relaxed">{c.subtitle}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-white/6">
                        <span className="font-bold text-sm" style={{ color: isFree ? '#34A853' : 'rgba(255,255,255,0.7)' }}>
                          {isFree ? 'ฟรี' : c.price}
                          {c.duration && <span className="text-white/20 font-normal text-xs ml-2">{c.duration}</span>}
                        </span>
                        {!isCS && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white/50 transition-colors flex items-center gap-1">
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

          <div data-reveal className="mt-8 border border-white/6 p-5 flex gap-4 items-start bg-[#060606]">
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/20" />
            <p className="text-white/25 text-xs leading-relaxed">
              <span className="text-white/50 font-semibold">เลือกเรียนได้อย่างอิสระ</span> —
              ระบบจะแนะนำคอร์สต่อไปให้คุณหลังเรียนแต่ละคอร์สโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </section>

      {/* ══ 6. WHY DIFFERENT ══════════════════════════════ */}
      <section className="bg-[#060606] py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div data-reveal className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-4 text-white/30">Why Different</p>
            <h2 className="text-3xl md:text-5xl font-black text-white">CREATR365 ≠<br/>คอร์สทั่วไป</h2>
          </div>

          <div className="border border-white/8">
            <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_3fr_3fr] border-b border-white/8">
              <div className="p-4 bg-[#0A0A0A]" />
              <div className="p-4 border-l border-white/5 flex items-center justify-center">
                <span className="text-[10px] font-black text-white/70 tracking-widest uppercase">CREATR365</span>
              </div>
              <div className="p-4 border-l border-white/5 flex items-center justify-center">
                <span className="text-[10px] font-black text-white/20 tracking-widest uppercase">คอร์สทั่วไป</span>
              </div>
            </div>
            {WHY.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_3fr_3fr] border-b border-white/5 last:border-0">
                <div className="p-5 bg-[#0A0A0A] flex items-center">
                  <p className="text-white/50 text-xs font-medium">{row.q}</p>
                </div>
                <div className="p-5 border-l border-white/5 flex items-start gap-2">
                  <Check className="w-3 h-3 text-[#34A853] flex-shrink-0 mt-0.5" />
                  <p className="text-white/60 text-xs leading-relaxed hidden md:block">{row.us}</p>
                </div>
                <div className="p-5 border-l border-white/5 flex items-start gap-2">
                  <X className="w-3 h-3 text-white/15 flex-shrink-0 mt-0.5" />
                  <p className="text-white/20 text-xs leading-relaxed hidden md:block">{row.them}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. TEAM ════════════════════════════════════════ */}
      <section className="relative bg-[#0A0A0A] py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/team-studio.png" alt=""
            className="w-full h-full object-cover object-top opacity-45" />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(to top, #0A0A0A 30%, rgba(10,10,10,0.65) 70%, rgba(10,10,10,0.4) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-6 text-white/30">About</p>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            สร้างผู้นำ<br/><span style={{ color:RED }}>ไลฟ์คอมเมิร์ซ</span><br/>ที่แบรนด์ไว้ใจ
          </h2>
          <p className="text-white/30 text-sm italic max-w-md mx-auto">
            "เรียนรู้จากประสบการณ์จริง · ระบบจริง · เครื่องมือจริง · เคสธุรกิจจริง"
          </p>
        </div>
      </section>

      {/* ══ 8. CTA ═════════════════════════════════════════ */}
      <section className="bg-[#060606] py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.35em] uppercase mb-8 text-white/20">Start Your Journey</p>
          <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-4">
            Identity is<br/>not something<br/>you <span style={{ color:RED }}>find.</span>
          </h2>
          <p className="text-white/30 text-base mb-12">It's something you <span className="text-white/60 font-semibold">build.</span></p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses"
              className="group inline-flex items-center justify-center gap-3 px-10 py-5 font-black text-white text-sm tracking-widest uppercase transition-all duration-300"
              style={{ background:RED }}>
              BEGIN NOW <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/auth"
              className="inline-flex items-center justify-center px-10 py-5 font-bold text-white/40 text-sm border border-white/12 hover:border-white/25 hover:text-white/70 transition-all uppercase tracking-widest">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════ */}
      <footer className="bg-[#040404] border-t border-white/5 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div>
              <p className="text-white font-black text-lg tracking-widest">CREATR365</p>
              <p className="text-white/20 text-xs mt-1">A Creative House for the Future of Live Commerce.</p>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-white/25">
              {[['หลักสูตร','/courses'],['บทความ','/articles'],['FAQ','/faq'],['ติดต่อ','/contact'],['เข้าสู่ระบบ','/auth']].map(([l,h])=>(
                <Link key={l} to={h} className="hover:text-white/50 transition-colors uppercase tracking-wider text-[10px]">{l}</Link>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-[10px] text-white/15 uppercase tracking-wider">
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              {[['นโยบายความเป็นส่วนตัว','/privacy'],['ข้อกำหนดการใช้บริการ','/terms'],['นโยบายการคืนเงิน','/refund-policy']].map(([l,h])=>(
                <Link key={l} to={h} className="hover:text-white/35 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
export default Home;
