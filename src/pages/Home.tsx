import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';

/* ─── constants ─────────────────────────── */
const RED  = '#CC0033';
const LOGO = '/images/w-logo-oneline.png';

/* ─── parallax hook ─────────────────────── */
function useParallax(speed = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const fn = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [speed]);
  return ref;
}

/* ─── AOS hook ──────────────────────────── */
function useAOS() {
  useEffect(() => {
    const run = () => {
      document.querySelectorAll('[data-aos]').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight - 50)
          el.classList.add('aos-in');
      });
    };
    run();
    window.addEventListener('scroll', run, { passive: true });
    return () => window.removeEventListener('scroll', run);
  });
}

/* ─── WHY data ──────────────────────────── */
const WHY = [
  { them: 'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube',         us: 'PPACT Framework 5 มิติ ฝังในทุกคอร์ส' },
  { them: 'เน้นเทคนิคตะโกนขายหรือสร้าง Hype',          us: 'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด' },
  { them: 'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข',    us: 'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools' },
  { them: 'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย',        us: 'Brand Host Architect — วางระบบ Production ทั้งทีม' },
  { them: 'เรียนจบไม่รู้จะทำอะไรต่อ',                  us: 'Key Collection System™ มาตรฐานอุตสาหกรรม' },
];

/* ════════════════════════════════════════════
   HOME
════════════════════════════════════════════ */
export default function Home() {
  useAOS();

  /* §1 hero BG parallax — moves slower than content */
  const heroBgRef = useParallax(0.18);

  /* §5 problem BG parallax */
  const problemBgRef = useParallax(0.1);

  /* §7-9 tier BG parallax refs */
  const tier1BgRef = useParallax(0.1);
  const tier2BgRef = useParallax(0.1);
  const tier3BgRef = useParallax(0.1);

  /* §11 journey BG parallax */
  const journeyBgRef = useParallax(0.1);

  return (
    <main style={{ background: '#0a0a0a', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════
          §1  HERO
          BG: Hero-team1.png — filter brightness(0.72) hero only
          Text left: Logo → eyebrow → gap → headline → buttons → tagline
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* BG — parallax slow */}
        <div ref={heroBgRef} style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform' }}>
          <img
            src="/images/Hero-team1.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center right', filter: 'brightness(0.72)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(10,10,10,0.92) 32%, rgba(10,10,10,0.55) 62%, rgba(10,10,10,0.1) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, inset: 'auto 0 0 0', height: '180px', background: 'linear-gradient(to top, #0a0a0a, transparent)' }} />
        </div>

        {/* Content — faster than BG = parallax depth */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 'clamp(20px,4vw,48px) clamp(24px,7vw,96px)' }}>
          {/* top: Logo + eyebrow */}
          <div data-aos="fade-in">
            <img src={LOGO} alt="Creatr365" style={{ height: 'clamp(20px,2.2vw,28px)', width: 'auto', filter: 'brightness(0) invert(1)', display: 'block', marginBottom: '8px' }} />
            <p style={{ fontSize: '11px', letterSpacing: '0.32em', color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase' }}>
              A Creative House for the Future of Live Commerce.
            </p>
          </div>

          {/* bottom: headline + buttons + tagline */}
          <div style={{ marginTop: 'auto', paddingTop: 'clamp(80px,12vh,160px)' }}>
            <h1
              data-aos="fade-up"
              style={{ fontWeight: 900, lineHeight: 0.92, marginBottom: 'clamp(24px,3vw,36px)', fontSize: 'clamp(3.6rem,8.5vw,7rem)' }}
            >
              <span style={{ color: '#fff', display: 'block' }}>BE</span>
              <span style={{ color: '#fff', display: 'block' }}>CREATOR</span>
              <span style={{ color: RED, display: 'block' }}>.</span>
              <span style={{ color: 'rgba(255,255,255,0.22)', display: 'block', fontSize: '0.5em', letterSpacing: '0.07em', marginTop: '6px' }}>NOT A CONSUMER.</span>
            </h1>

            <div data-aos="fade-up" data-aos-delay="100" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: 'clamp(22px,3vw,32px)' }}>
              <Link to="/courses"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(24px,3vw,40px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', transition: 'opacity .2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                BEGIN NOW <ArrowRight size={15} />
              </Link>
              <Link to="/auth"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '14px clamp(20px,2.5vw,32px)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.48)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                FREE ACCOUNT
              </Link>
            </div>

            {/* tagline — bold on keywords only */}
            <p data-aos="fade-up" data-aos-delay="180"
              style={{ fontSize: 'clamp(12px,1.3vw,15px)', lineHeight: 1.8, color: 'rgba(255,255,255,0.42)', maxWidth: '580px' }}>
              เพราะอนาคตของ Live Commerce ไม่ใช่แค่การขายของ แต่คือการ{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>สร้างคุณค่า</strong>{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>สร้างอิทธิพล</strong>{' '}
              และ<strong style={{ color: '#fff', fontWeight: 700 }}>สร้างอาชีพที่ยั่งยืน</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §2  STATS
          BG: graph-section2.png เต็มหน้า
          ไม่มีอะไรทับ ไม่ filter ไม่ overlay
          รูปมีข้อมูลครบในตัวเอง
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', lineHeight: 0 }}>
        <img
          src="/images/graph-section2.png"
          alt="Live-Streaming E-Commerce Market Data"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </section>

      {/* ══════════════════════════════════════
          §3  อยากร่วมงานกับแบรนด์ใหญ่?
          BG: สีพื้น #1a1a1a ไม่มีรูป BG
          แถวบน: brand1.png slide-in from left
          แถวล่าง: brand2.png slide-in from right
          ไม่มีกรอบ ไม่มีข้อความใต้รูป
      ══════════════════════════════════════ */}
      <section style={{ background: '#1a1a1a', padding: 'clamp(60px,8vw,100px) 0' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 clamp(20px,4vw,48px)' }}>
          <div data-aos="fade-up" style={{ marginBottom: 'clamp(40px,5vw,60px)' }}>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              อยากร่วมงานกับแบรนด์ใหญ่ ?
            </h2>
            <p style={{ fontSize: 'clamp(15px,2vw,20px)', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>
              สิ่งที่ตลาดต้องการ คือ…
            </p>
          </div>

          {/* แถวบน: brand1.png — slide in from left */}
          <div
            data-aos="fade-right"
            style={{ marginBottom: '16px', lineHeight: 0 }}
          >
            <img
              src="/images/brand1.png"
              alt=""
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* แถวล่าง: brand2.png — slide in from right */}
          <div
            data-aos="fade-left"
            data-aos-delay="100"
            style={{ marginBottom: 'clamp(40px,5vw,60px)', lineHeight: 0 }}
          >
            <img
              src="/images/brand1.png"
              alt=""
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* ปุ่มกึ่งกลางล่าง */}
          <div data-aos="fade-up" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/courses"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(28px,3vw,44px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', transition: 'opacity .2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              ดูหลักสูตร <ArrowRight size={15} />
            </Link>
            <Link to="/articles/diagnostic-quiz"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px clamp(24px,2.5vw,36px)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.62)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.48)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; }}>
              ▷ Find Your Path
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §4  เป็นเหมือนกันไหม?
          BG: ringlight-back1.png เต็มหน้า ไม่ filter
          รูปซ้าย / text ขวา (ตาม CREATR365__5_.png)
          Logo + tagline กึ่งกลางล่างสุด
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '80vh', overflow: 'hidden' }}>
        <img
          src="/images/ringlight-back1.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left center' }}
        />
        {/* gradient: left transparent → right darker for text readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,10,0.05) 0%, rgba(10,10,10,0.05) 35%, rgba(10,10,10,0.82) 55%, rgba(10,10,10,0.97) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1320px', margin: '0 auto', padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', minHeight: '80vh' }}>
          <div /> {/* left col — ringlight image shows through */}

          {/* right col — text */}
          <div>
            <h2
              data-aos="fade-up"
              style={{ fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 900, color: '#fff', marginBottom: 'clamp(28px,3.5vw,44px)', lineHeight: 1.05 }}>
              เป็นเหมือนกันไหม ?
            </h2>

            {[
              'ไลฟ์แล้วไม่มีคนดู? ไม่มีคนแชร์?',
              'ทำยังไงให้คนอยู่ต่อ? ปิดการขายยังไง?',
              'ต้องใช้สคริปต์หรือเทคนิคอะไรดี?',
              'จะพูดอย่างไรเพื่อให้เกิดรายรับในไลฟ์?',
            ].map((q, i) => (
              <div key={i}
                data-aos="fade-up"
                data-aos-delay={String(i * 80)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: 'clamp(12px,2vw,20px)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: RED, flexShrink: 0, marginTop: '10px' }} />
                <p style={{ fontSize: 'clamp(15px,2vw,19px)', fontWeight: 500, color: '#fff', lineHeight: 1.5 }}>{q}</p>
              </div>
            ))}

           
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §5  เพราะเราเจอปัญหามาก่อน
          BG: problem-up.png เต็มหน้า ไม่ filter
          Parallax: BG เลื่อนช้า (0.1) / text เลื่อนเร็วกว่า = depth
          Text ซ้าย วางบนพื้นหลัง
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '70vh', overflow: 'hidden' }}>
        {/* BG parallax layer */}
        <div ref={problemBgRef} style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform' }}>
          <img
            src="/images/problem-up.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(10,10,10,0.88) 32%, rgba(10,10,10,0.45) 62%, rgba(10,10,10,0.1) 100%)' }} />
        </div>

        {/* Text — faster layer = depth effect */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1320px', margin: '0 auto', padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', minHeight: '70vh' }}>
          <div data-aos="fade-up">
            <img src={LOGO} alt="Creatr365" style={{ height: '20px', width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: '6px' }} />
            <p style={{ fontSize: '10px', letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '24px' }}>
              WELCOME TO CREATR365'S FAMILY
            </p>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.8vw,3rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: '20px' }}>
              ทุกคอร์สการเรียนรู้<br />
              <span style={{ color: RED }}>สร้างจากประสบการณ์จริง</span>
            </h2>
            <div style={{ borderLeft: `2px solid ${RED}55`, paddingLeft: '18px' }}>
              {[
                'ด้วยพื้นฐานความเข้าใจในปัญหา',
                'และถอดทุกประสบการณ์จริงจากอาชีพ Live Commerce',
                'มาสร้างเป็นเนื้อหาการเรียนรู้ที่ครบในทุกมิติ',
              ].map((t, i) => (
                <p key={i} style={{ fontSize: 'clamp(14px,1.5vw,16px)', lineHeight: 1.85, color: 'rgba(255,255,255,0.75)' }}>{t}</p>
              ))}
            </div>
          </div>
          <div /> {/* right — BG image shows */}
        </div>
      </section>

      {/* ══════════════════════════════════════
          §6  BRAND PROMISE
          BG: Team-work1.jpg เต็มหน้า ไม่ filter
          ข้อความบนสุด: Welcome + subtitle
          ซ้าย 2×2: 4 รูป ตามไฟล์ที่ระบุ ไม่มีชื่อใต้รูป
          Marquee ล่างสุด
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
        {/* BG */}
        <img
          src="/images/Team-work1.jpg"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.62)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1320px', margin: '0 auto', padding: 'clamp(50px,7vw,80px) clamp(20px,4vw,48px) clamp(40px,5vw,60px)' }}>
          {/* header */}
          <div data-aos="fade-up" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#fff' }}>
              Welcome to Creatr365's Family
            </h2>
            <p style={{ fontSize: 'clamp(14px,1.8vw,18px)', color: 'rgba(255,255,255,0.65)', marginTop: '6px' }}>
              หลักสูตรที่เลือกได้ตามสไตล์คุณ
            </p>
          </div>

          {/* 4 รูป ซ้าย 2×2 — ไม่มีชื่อใต้รูป */}
          <div
            data-aos="fade-up"
            data-aos-delay="80"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxWidth: '600px' }}>
            {[
              '/images/pro-course-online.png',
              '/images/pro-AI-tech.png',
              '/images/pro-workshop-liveclass.png',
              '/images/pro-community.png',
            ].map((src, i) => (
              <div key={i} style={{ aspectRatio: '1', overflow: 'hidden' }}>
                <img
                  src={src}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .65s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Marquee strip ล่างสุด */}
        <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.7)', padding: '11px 0' }}>
          <div style={{ display: 'flex', whiteSpace: 'nowrap', gap: '52px', animation: 'marqueeRun 28s linear infinite' }}>
            {Array(6).fill(['Free Gift ทั้งหมด : Free - Template', 'Free - Ebook', 'Free - Vocabulary guide', 'Free - Document Form', 'Free - Checklist']).flat().map((t, i) => (
              <span key={i} style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: RED, display: 'inline-block', flexShrink: 0 }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §7  ไลฟ์ให้เป็น
          BG: i-can-live2.png เต็มหน้า ไม่ filter
          Parallax BG เลื่อนช้า
          ข้อความวางบนพื้นหลัง ซ้ายล่าง
          Course list แนวตั้ง มี red vertical bar
          Link → /course/:slug
      ══════════════════════════════════════ */}
      <TierSection
        bgRef={tier1BgRef}
        bgSrc="/images/i-can-live2.png"
        logoSrc={LOGO}
        headline="ไลฟ์ให้"
        headlineRed="เป็น"
        courses={[
          { name: 'THE MAGNET',     sub: 'READY FOR LIVE',  tag: 'FREE',   slug: 'the-magnet' },
          { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER',   tag: 'COURSE', slug: 'the-foundation' },
        ]}
      />

      {/* ══════════════════════════════════════
          §8  ไลฟ์ให้ขายได้
          BG: i-can-sale2.png เต็มหน้า ไม่ filter
      ══════════════════════════════════════ */}
      <TierSection
        bgRef={tier2BgRef}
        bgSrc="/images/i-can-sale2.png"
        logoSrc={LOGO}
        headline="ไลฟ์ให้"
        headlineRed="ขายได้"
        courses={[
          { name: 'SIGNAL', sub: 'THE CONVERSION HOST : ONLINE',              tag: 'COURSE', slug: 'signal' },
          { name: 'STAGE',  sub: 'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', tag: 'COURSE', slug: 'stage' },
        ]}
      />

      {/* ══════════════════════════════════════
          §9  ไลฟ์ให้วัดผลและทำซ้ำได้
          BG: i-can-reply1.png เต็มหน้า ไม่ filter
      ══════════════════════════════════════ */}
      <TierSection
        bgRef={tier3BgRef}
        bgSrc="/images/i-can-reply1.png"
        logoSrc={LOGO}
        headline="ไลฟ์ให้"
        headlineRed="วัดผลและทำซ้ำได้"
        badge="DON'T MISS!"
        courses={[
          { name: 'The BRAND ARCHITECT', sub: 'MASTERCLASS : ONSITE 2 DAYS', tag: 'COMING SOON', slug: '' },
        ]}
        also={[
          { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER',                        slug: 'the-foundation' },
          { name: 'SIGNAL',         sub: 'THE CONVERSION HOST : ONLINE',          slug: 'signal' },
          { name: 'STAGE',          sub: 'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', slug: 'stage' },
        ]}
      />

      {/* ══════════════════════════════════════
          §10  Brand Concept
          BG: Team-behind1.png เต็มหน้า ไม่ filter
          ข้อความตาม PDF ref page 10
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '62vh', overflow: 'hidden' }}>
        <img
          src="/images/Team-behind1.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,10,10,0.78) 38%, rgba(10,10,10,0.32) 70%, rgba(10,10,10,0.1) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)', minHeight: '62vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
         
        </div>
      </section>

      {/* ══════════════════════════════════════
          §11  JOURNEY
          BG: journey-stairs2.jpg เต็มหน้า ไม่ filter
          Parallax BG
          บนซ้าย: CONSUMER→CREATOR / YOUR JOURNEY / STARTS HERE.
          ล่างขวา: ปุ่ม
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '90vh', overflow: 'hidden' }}>
        <div ref={journeyBgRef} style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform' }}>
          <img
            src="/images/journey-stairs2.jpg"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.28) 0%, rgba(10,10,10,0.1) 45%, rgba(10,10,10,0.62) 82%, #0a0a0a 100%)' }} />
        </div>

        {/* top-left */}
        <div data-aos="fade-in" style={{ position: 'absolute', top: 'clamp(32px,5vw,56px)', left: 'clamp(20px,6vw,80px)', zIndex: 1 }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)', marginBottom: '10px' }}>
            CONSUMER → CREATOR
          </p>
          <h2 style={{ fontSize: 'clamp(2.5rem,6vw,5.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.02 }}>
            YOUR JOURNEY<br /><span style={{ color: RED }}>STARTS HERE.</span>
          </h2>
        </div>

        {/* bottom-right buttons */}
        <div data-aos="fade-up" style={{ position: 'absolute', bottom: 'clamp(36px,5vw,60px)', right: 'clamp(20px,6vw,80px)', zIndex: 1, display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/courses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(24px,3vw,40px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', transition: 'opacity .2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            เริ่มเส้นทางของคุณ <ArrowRight size={15} />
          </Link>
          <Link to="/auth"
            style={{ display: 'inline-flex', alignItems: 'center', padding: '14px clamp(20px,2.5vw,32px)', border: '1px solid rgba(255,255,255,0.26)', color: 'rgba(255,255,255,0.68)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.52)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.26)'; e.currentTarget.style.color = 'rgba(255,255,255,0.68)'; }}>
            Free Account
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §12  WHY CREATR365 DIFFERENCE?
          BG: #0a0a0a สีพื้น
          ตาราง 2 col: คอร์สทั่วไป / CREATR365
      ══════════════════════════════════════ */}
      <section style={{ background: '#0a0a0a', padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div data-aos="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,2vw,20px)', flexWrap: 'wrap', marginBottom: 'clamp(40px,5vw,60px)' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3.2rem)', fontWeight: 900, color: '#fff' }}>WHY</h2>
            <img src={LOGO} alt="Creatr365" style={{ height: 'clamp(26px,3vw,40px)', width: 'auto', filter: 'brightness(0) invert(1)' }} />
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3.2rem)', fontWeight: 900, color: '#fff' }}>DIFFERENCE?</h2>
          </div>

          <div data-aos="fade-up" style={{ border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {/* header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '14px 22px', textAlign: 'center', background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)' }}>คอร์สทั่วไป</span>
              </div>
              <div style={{ padding: '14px 22px', textAlign: 'center', background: `${RED}10` }}>
                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.42em', textTransform: 'uppercase', color: RED }}>CREATR365</span>
              </div>
            </div>

            {WHY.map((row, i) => (
              <div key={i}
                data-aos="fade-up"
                data-aos-delay={String(i * 60)}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: i < WHY.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background .2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.012)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ padding: '18px 22px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.01)' }}>
                  <X size={13} style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0, marginTop: '3px' }} />
                  <p style={{ fontSize: 'clamp(12px,1.3vw,14px)', lineHeight: 1.58, color: 'rgba(255,255,255,0.35)' }}>{row.them}</p>
                </div>
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: `${RED}05` }}>
                  <Check size={13} style={{ color: '#34A853', flexShrink: 0, marginTop: '3px' }} />
                  <p style={{ fontSize: 'clamp(12px,1.3vw,14px)', lineHeight: 1.58, color: 'rgba(255,255,255,0.78)' }}>{row.us}</p>
                </div>
              </div>
            ))}
          </div>

          <div data-aos="fade-up" style={{ textAlign: 'center', marginTop: 'clamp(32px,4vw,48px)' }}>
            <Link to="/courses"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(32px,4vw,56px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', transition: 'opacity .2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              เริ่มเส้นทางของคุณ <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §13  CTA
          BG: #080808
          Quote → WELCOME → BE A CREATOR → ปุ่ม
      ══════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: 'clamp(70px,9vw,110px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <div data-aos="fade-up">
            <p style={{ fontSize: 'clamp(15px,1.8vw,19px)', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: '20px' }}>
              "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง<br />
              แต่คือการสร้างมาตรฐานและคุณภาพ<br />
              เพื่อการเติบโตในอาชีพที่พร้อมเข้าสู่ตลาดในระดับ Global<br />
              ด้วยอาชีพที่ยั่งยืนและธุรกิจที่เติบโตได้อย่างมีศักยภาพ"
            </p>
            <p style={{ fontSize: '10px', letterSpacing: '0.52em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '18px' }}>
              WELCOME TO CREATR365'S FAMILY
            </p>
            <h2 style={{ fontSize: 'clamp(3.8rem,9.5vw,8rem)', fontWeight: 900, lineHeight: 0.9, marginBottom: '36px' }}>
              <span style={{ color: '#fff', display: 'block' }}>BE A</span>
              <span style={{ color: RED, display: 'block' }}>CREATOR.</span>
              <span style={{ color: 'rgba(255,255,255,0.18)', display: 'block', fontSize: '0.48em', letterSpacing: '0.07em', marginTop: '6px' }}>NOT A CONSUMER.</span>
            </h2>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/courses"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px clamp(32px,4vw,52px)', background: RED, color: '#fff', fontWeight: 900, fontSize: '13px', letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', transition: 'opacity .2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                BEGIN NOW <ArrowRight size={16} />
              </Link>
              <Link to="/auth"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '15px clamp(24px,3vw,40px)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.52)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', transition: 'border-color .2s, color .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.42)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; }}>
                Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#040404', borderTop: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(44px,6vw,72px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '28px', marginBottom: '36px' }}>
            <div>
              <img src={LOGO} alt="Creatr365" style={{ height: '20px', width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: '7px' }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.36)' }}>A Creative House for the Future of Live Commerce.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '22px' }}>
              {[['หลักสูตร', '/courses'], ['บทความ', '/articles'], ['FAQ', '/faq'], ['ติดต่อ', '/contact'], ['เข้าสู่ระบบ', '/auth']].map(([l, h]) => (
                <Link key={l} to={h} style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.72)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '22px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.24)' }}>
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
              {[['นโยบายความเป็นส่วนตัว', '/privacy'], ['ข้อกำหนดการใช้บริการ', '/terms'], ['นโยบายการคืนเงิน', '/refund-policy']].map(([l, h]) => (
                <Link key={l} to={h} style={{ color: 'rgba(255,255,255,0.24)', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.52)')}
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

/* ─── TierSection component ─────────────────
   §7, §8, §9 — BG image เต็มหน้า ไม่ filter
   ข้อความวางทับพื้นหลัง ซ้ายล่าง
   Parallax: BG เลื่อนช้า (ref จาก parent)
   Course list แนวตั้ง + vertical red bar
   Link → /course/:slug
─────────────────────────────────────────── */
type CourseItem = { name: string; sub: string; tag: string; slug: string };
type AlsoItem   = { name: string; sub: string; slug: string };

function TierSection({ bgRef, bgSrc, logoSrc, headline, headlineRed, badge, courses, also }: {
  bgRef: React.RefObject<HTMLDivElement>;
  bgSrc: string;
  logoSrc: string;
  headline: string;
  headlineRed: string;
  badge?: string;
  courses: CourseItem[];
  also?: AlsoItem[];
}) {
  const RED = '#CC0033';
  return (
    <section style={{ position: 'relative', minHeight: '80vh', overflow: 'hidden' }}>
      {/* BG parallax */}
      <div ref={bgRef} style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform' }}>
        <img
          src={bgSrc}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* subtle gradient only on left for text readability — right stays full image */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.45) 42%, rgba(10,10,10,0.05) 70%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, inset: 'auto 0 0 0', height: '120px', background: 'linear-gradient(to top, rgba(10,10,10,0.6), transparent)' }} />
      </div>

      {/* Content — faster layer */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1320px', margin: '0 auto', padding: 'clamp(40px,6vw,70px) clamp(20px,4vw,48px)', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {/* Logo + welcome top-left */}
        <div data-aos="fade-in" style={{ position: 'absolute', top: 'clamp(20px,3vw,36px)', left: 'clamp(20px,4vw,48px)' }}>
          <img src={logoSrc} alt="Creatr365" style={{ height: 'clamp(18px,2vw,26px)', width: 'auto', filter: 'brightness(0) invert(1)', display: 'block', marginBottom: '4px' }} />
          <p style={{ fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>WELCOME TO CREATR365'S FAMILY</p>
        </div>

        {/* Badge */}
        {badge && (
          <div style={{ position: 'absolute', top: 'clamp(52px,7vw,80px)', left: 'clamp(20px,4vw,48px)' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 10px', border: `1px solid ${RED}`, color: RED, letterSpacing: '0.12em' }}>{badge}</span>
          </div>
        )}

        {/* Headline — huge Thai font */}
        <h2
          data-aos="fade-up"
          style={{ fontWeight: 900, lineHeight: 0.92, marginBottom: 'clamp(24px,3vw,36px)', fontSize: 'clamp(4rem,9vw,8rem)' }}>
          <span style={{ color: '#fff' }}>{headline}</span>
          <span style={{ color: RED }}>{headlineRed}</span>
        </h2>

        {/* Course list — vertical with red bar */}
        <div data-aos="fade-up" data-aos-delay="100" style={{ display: 'flex', gap: 'clamp(24px,4vw,56px)', flexWrap: 'wrap' }}>
          {courses.map((c, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${RED}`, paddingLeft: '14px' }}>
              <p style={{ fontSize: 'clamp(14px,1.6vw,17px)', fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>{c.name}</p>
              <p style={{ fontSize: 'clamp(11px,1.2vw,13px)', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: '6px' }}>{c.sub}</p>
              {c.tag === 'COMING SOON' ? (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' }}>(coming soon)</p>
              ) : (
                <Link
                  to={c.slug ? `/course/${c.slug}` : '/courses'}
                  style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textDecoration: 'underline', textUnderlineOffset: '3px', letterSpacing: '0.14em', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  เพิ่มเติม →
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* §9 "And" section */}
        {also && (
          <div data-aos="fade-up" data-aos-delay="160" style={{ marginTop: 'clamp(16px,2vw,24px)', paddingTop: 'clamp(14px,2vw,20px)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>And</p>
            <div style={{ display: 'flex', gap: 'clamp(24px,4vw,56px)', flexWrap: 'wrap' }}>
              {also.map((a, i) => (
                <div key={i} style={{ borderLeft: `3px solid rgba(255,255,255,0.2)`, paddingLeft: '14px' }}>
                  <p style={{ fontSize: 'clamp(13px,1.4vw,15px)', fontWeight: 700, color: '#fff' }}>{a.name}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: '5px' }}>{a.sub}</p>
                  <Link
                    to={`/course/${a.slug}`}
                    style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline', textUnderlineOffset: '3px', transition: 'color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                    เพิ่มเติม →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
