import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { BrandFitSection } from '@/components/home/BrandFitSection';
import { SEOHead } from '@/components/SEOHead';

/* ─── constants ─────────────────────────── */
const RED  = '#CC0033';
const LOGO = '/images/w-logo-side.png';

/* ════════════════════════════════════════════
   PARALLAX HOOK
   Offset คำนวณจากตำแหน่ง section ใน viewport
   (ไม่ใช่ raw scrollY) → เริ่มต้นถูกทันที mount
════════════════════════════════════════════ */
function useParallax(speed = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const section = el.parentElement as HTMLElement | null;
    let ticking = false;
    const update = () => {
      ticking = false;
      const target = section ?? el;
      const rect = target.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = `translate3d(0,${offset}px,0)`;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [speed]);
  return ref;
}

/* ════════════════════════════════════════════
   AOS HOOK
   เพิ่ม .aos-in เมื่อ element เข้า viewport, ถอดออกเมื่อออกจาก viewport
   → reveal เล่นใหม่ทุกครั้งที่เลื่อนกลับมาเจอ element (ไม่ใช่ครั้งเดียวจบ)
   ใส่ data-aos-once="true" บน element ที่ต้องการให้ค้างค่าหลังเล่นครั้งแรก
   ส่ง data-aos-delay → --aos-delay CSS var
════════════════════════════════════════════ */
function useAOS() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-aos]'));
    els.forEach(el => {
      const delay = el.getAttribute('data-aos-delay');
      if (delay) el.style.setProperty('--aos-delay', `${delay}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.add('aos-in');
          } else if (el.getAttribute('data-aos-once') !== 'true') {
            el.classList.remove('aos-in');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── WHY data ──────────────────────────── */
/* ════════════════════════════════════════════
   SCENE REVEAL
   Viewport-triggered artwork reveal, independent of parallax.
════════════════════════════════════════════ */
function useSceneReveal() {
  useEffect(() => {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
    if (!scenes.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const scene = entry.target as HTMLElement;
        if (entry.isIntersecting) scene.classList.add('is-visible');
        else if (scene.getAttribute('data-scene-once') !== 'true') scene.classList.remove('is-visible');
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    scenes.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);
}


const WHY = [
  { them: 'สูตรสำเร็จที่หาดูในโลกออนไลน์',         us: 'มีโครงสร้างเบื้องหลังของแต่ละคอร์สโดยใช้ PPACT Framework 5 มิติ เป็นแกนหลักและมี Framework เฉพาะของCreatr365 เท่านั้น' },
  { them: 'เทคนิคที่เอามาปรับใช้กับตัวเองไม่ได้ แข่งลดราคาสินค้าและลดค่าตอบแทนของตัวเองเพื่อให้ได้งาน',          us: 'ผู้เรียนต้องเข้าใจพื้นฐานสำคัญเป็นแกนหลักของทุกอย่าง ไปจนถึงบทเรียนของการอ่านค่าตัวเลข รวมถึงการนำตัวเลขนั้นๆไปวิเคราะห์ เพื่อวางแผนในอนาคต พร้อมตัวช่วย AI Tools' },
  { them: 'สอนตามทฤษฎีที่มีแต่คำศัพท์เทคนิค,ไม่วิเคราะห์ตัวเลข',    us: 'เครื่องมือ,เทมเพลตรวมถึงชุดคำศัพท์ที่ต้องรู้ในอาชีพนี้ คู่มือใช้เลือกใช้คำอธิบายแบบที่คนปกติเข้าใจได้ง่ายๆ' },
  { them: 'เน้นเฉพาะคนที่อยากรวย แต่ไม่มีคำแนะนำในโครงสร้างของการเติบโตแบบ Team-Work ที่ทำให้ทั้งทีมหรือองค์กรก้าวไปด้วยกัน',        us: 'เรียนรู้ตั้งแต่ประวัติความเป็นมา ระบบนิเวศน์ของ Live Streamer เพื่อเห็นความสำคัญและการสร้างมาตรฐานให้ตัวเองเพื่อตอบโจทย์ในอาชีพนี้ได้อย่างถาวร' },
  { them: 'เรียนจบไม่รู้จะทำอะไรต่อ',                  us: 'ภาพรวมและความสำคัญของระบบ, เพิ่มคุณค่าในอาชีพ/พัฒนาตัวเองอย่างต่อเนื่อง “Be a Creator Not a Comsumer” เพื่อมีมาตรฐานของตัวเอง,ทีม,องค์กร เทียบเท่าระดับสากลและพร้อมก้าวเข้าสู่การเป็น host ในระดับ global ได้' },
];


const MOTION_CSS = `
  /* Real black base + scene reveal. */
  .c365-scene {
    position: relative;
    background: #000;
    overflow: hidden;
  }
  .c365-scene-bg-reveal {
    position: absolute;
    inset: 0;
    opacity: 0;
    transform: scale(1.025);
    transform-origin: 50% 50%;
    transition: opacity 1.35s cubic-bezier(.22,1,.36,1), transform 1.6s cubic-bezier(.22,1,.36,1);
    will-change: opacity, transform;
    width: 100%;
    height: 100%;
  }
  [data-scene].is-visible .c365-scene-bg-reveal {
    opacity: 1;
    transform: scale(1);
  }

  /* Existing content/AOS is preserved; only its entrance timing changes by scene. */
  [data-scene].is-visible [data-aos] {
    transition-delay: calc(var(--aos-delay, 0ms) + var(--scene-content-delay, 0ms));
  }

  .c365-motion-bg {
    animation: c365BgFloat 18s ease-in-out infinite alternate;
    transform-origin: 50% 50%;
    will-change: transform;
  }
  .c365-motion-bg-slow {
    animation: c365BgFloatSlow 24s ease-in-out infinite alternate;
    transform-origin: 50% 50%;
    will-change: transform;
  }
  .c365-motion-float { animation: c365Float 8s ease-in-out infinite alternate; will-change: translate; }
  .c365-motion-float-slow { animation: c365FloatSlow 12s ease-in-out infinite alternate; will-change: translate; }
  .c365-motion-drift { animation: c365Drift 10s ease-in-out infinite alternate; will-change: translate; }
  .c365-motion-pulse { animation: c365Pulse 4.5s ease-in-out infinite; will-change: opacity, scale; }
  .c365-motion-card { animation: c365Card 9s ease-in-out infinite alternate; will-change: translate; }

  /* Motion vocabulary: different cadence per scene, not one formula for all 13. */
  [data-scene="1"] { --scene-content-delay: 360ms; }
  [data-scene="2"] { --scene-content-delay: 0ms; }
  [data-scene="4"] { --scene-content-delay: 420ms; }
  [data-scene="5"] { --scene-content-delay: 880ms; }
  [data-scene="6"] { --scene-content-delay: 420ms; }
  [data-scene="7"], [data-scene="8"] { --scene-content-delay: 420ms; }
  [data-scene="9"] { --scene-content-delay: 520ms; }
  [data-scene="10"] { --scene-content-delay: 0ms; }
  [data-scene="11"] { --scene-content-delay: 520ms; }

  [data-scene="1"] .c365-scene-bg-reveal,
  [data-scene="11"] .c365-scene-bg-reveal { transition-duration: 1.65s, 1.8s; }
  [data-scene="2"] .c365-scene-bg-reveal { transition-duration: 1.25s, 1.35s; }
  [data-scene="4"] .c365-scene-bg-reveal { transition-duration: 1.45s, 1.65s; }
  [data-scene="5"] .c365-scene-bg-reveal { transition-delay: 200ms; transition-duration: 1.3s, 1.55s; }
  [data-scene="6"] .c365-scene-bg-reveal { transition-duration: 1.15s, 1.35s; }
  [data-scene="7"] .c365-scene-bg-reveal,
  [data-scene="8"] .c365-scene-bg-reveal,
  [data-scene="9"] .c365-scene-bg-reveal { transition-duration: 1.2s, 1.45s; }
  [data-scene="10"] .c365-scene-bg-reveal { transition-duration: 2.1s, 2.2s; }

  @keyframes c365BgFloat { from { transform: scale(1); } to { transform: scale(1.025) translate3d(-0.35%, -0.25%, 0); } }
  @keyframes c365BgFloatSlow { from { transform: scale(1); } to { transform: scale(1.018) translate3d(0.25%, -0.2%, 0); } }
  @keyframes c365Float { from { translate: 0 0; } to { translate: 0 -7px; } }
  @keyframes c365FloatSlow { from { translate: 0 0; } to { translate: 0 -4px; } }
  @keyframes c365Drift { from { translate: 0 0; } to { translate: 5px -3px; } }
  @keyframes c365Pulse { 0%,100% { opacity: .84; scale: 1; } 50% { opacity: 1; scale: 1.015; } }
  @keyframes c365Card { from { translate: 0 0; } to { translate: 0 -5px; } }

  @media (prefers-reduced-motion: reduce) {
    .c365-scene-bg-reveal, .c365-motion-bg, .c365-motion-bg-slow, .c365-motion-float, .c365-motion-float-slow, .c365-motion-drift, .c365-motion-pulse, .c365-motion-card {
      animation: none !important; transition: none !important; will-change: auto; opacity: 1 !important; transform: none !important;
    }
  }
`;



/* ════════════════════════════════════════════
   HOME
════════════════════════════════════════════ */
export default function Home() {
  useAOS();
  useSceneReveal();

  // Home is a black-background page throughout — match the shared CourseNavbar
  // to it the same way every other dark page does (Contact, Articles, ...),
  // instead of leaving it on the default light theme's white bar.
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const problemBgRef = useParallax(0.13);
  const journeyBgRef = useParallax(0.13);

  // เพิ่ม parallax ให้ BG ที่เคยนิ่งสนิท (ยกเว้น §2 และ §10 ตามสเปก — ปล่อยให้นิ่งเพื่อให้อ่านง่าย)
  const familyBgRef  = useParallax(0.08);   // §6  Team-work1.jpg
  const sec7BgRef     = useParallax(0.08);  // §7  i-can-live2.png
  const sec8BgRef     = useParallax(0.08);  // §8  i-can-sale2.png
  const sec9BgRef     = useParallax(0.08);  // §9  i-can-reply1.png

  return (
    <main className="home-scroll" style={{ background: '#0a0a0a', overflowX: 'hidden', fontSize: '18px' }}>
      <style>{MOTION_CSS}</style>
      {/* Heading-hover thickness/position touch-ups for THIS page's own
          headings — added as a separate block, MOTION_CSS above is
          untouched. .c365-h-thick only bumps the shared ::after bar from
          2px to 3px for headings confirmed (by measuring rendered width
          against the underline width) to already be positioned correctly.
          .c365-h-nodefault turns the default hover/underline off for a
          heading that needs a different treatment instead (paired with a
          .heading-hover span placed precisely on the line that needs it) —
          used once below, on the "YOUR JOURNEY / STARTS HERE." heading,
          whose two lines differ enough in width (708px vs 659px) that the
          shared rule overshot the second line by ~49px on hover. Neither
          rule edits src/index.css's shared selector, so no other heading
          on this site is affected. */}
      <style>{`
        .c365-h-thick::after { height: 3px !important; }
        .c365-h-nodefault::after { content: none !important; }
        .c365-h-nodefault:hover { color: inherit !important; }
      `}</style>
      <SEOHead
        title="Creatr365 — A Creative House for the Future of Live Commerce"
        description="ประเทศไทยครองอันดับ 1 ของโลกด้านการซื้อสินค้าออนไลน์รายสัปดาห์ (66.6%) — Creatr365 พัฒนาโฮสต์ไลฟ์คอมเมิร์ซมืออาชีพด้วยหลักจิตวิทยา ข้อมูล และการสื่อสาร Be a Creator, Not a Consumer."
        url="https://c365.ideas365.space/"
      />
<CourseNavbar />
      {/* ══════════════════════════════════════
          §1  HERO — extracted to its own component
          (src/components/home/HeroSection.tsx). Fully self-contained:
          its own motion loop, its own <style> for its own class names.
          Nothing else in this file reads or writes anything inside it.
      ══════════════════════════════════════ */}
      <HeroSection />

      {/* ══════════════════════════════════════
          §2  STATS / MARKET DATA
          BG: graph-section2.png เต็มหน้า 100vh
          ไม่มีอะไรทับ ไม่ filter ไม่ overlay เลย
          รูปมีข้อมูลครบในตัวเอง
      ══════════════════════════════════════ */}
      <section className="c365-scene" data-scene="2" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <div className="c365-scene-bg-reveal">
<img
          className="c365-motion-bg-slow" src="/images/graph-section2.png"
          alt="Live-Streaming E-Commerce Market Data"
          style={{ width: '100%', height: '100vh', objectFit: 'contain', display: 'block' }}
        />
</div>
      </section>

      {/* ══════════════════════════════════════
          §3  อยากร่วมงานกับแบรนด์ใหญ่?
          BG: สีพื้น #1a1a1a ไม่มีรูป BG
          แถวบน: brand1.png (4 กรอบ) slide-in from left
          แถวล่าง: brand2.png (3 กรอบ) slide-in from right
      ══════════════════════════════════════ */}
      {/* §3 — extracted to its own component (src/components/home/BrandFitSection.tsx).
          Same heading/subtitle/CTAs as before; the 2 banner images are replaced
          with the 7-card grid. Fully self-contained, own <style>, own class names. */}
      <BrandFitSection />

      {/* ═════════════════════════════════════
          §4  เป็นเหมือนกันไหม ?
      ═════════════════════════════════════ */}
      <section className="c365-scene" data-scene="4" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* BG */}
        <div className="c365-scene-bg-reveal">
<img
          className="c365-motion-bg-slow" src="/images/ringlight-back1.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'left center'
          }}
        />
</div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1320px',
            margin: '0 auto',
            padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            alignItems: 'center',
            minHeight: '100vh',
            gap: '40px'
          }}
        >
          {/* LEFT — empty, background shows through */}
          <div />

          {/* RIGHT — TEXT */}
          <div style={{ maxWidth: '560px', marginLeft: 'auto' }}>
            <h2
              data-aos="fade-up"
              className="c365-motion-drift c365-h-thick"
              style={{
                fontSize: 'clamp(2.4rem,5vw,4rem)',
                fontWeight: 900,
                color: '#fff',
                marginBottom: '40px',
                lineHeight: 1.05
              }}
            >
              เป็นเหมือนกันไหม ?
            </h2>

            {[
              'ไลฟ์แล้วไม่มีคนดู? ไม่มีคนแชร์?',
              'ทำยังไงให้คนอยู่ต่อ? ปิดการขายยังไง?',
              'ต้องใช้สคริปต์หรือเทคนิคอะไรดี?',
              'จะพูดอย่างไรเพื่อให้เกิดรายรับในไลฟ์?'
            ].map((q, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={String(i * 80 + 100)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  marginBottom: '18px'
                }}
              >
                <div
                  className="float-y"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: RED,
                    marginTop: '10px',
                    flexShrink: 0
                  }}
                />
                <p
                  style={{
                    fontSize: 'clamp(15px,2vw,19px)',
                    fontWeight: 500,
                    color: '#fff',
                    lineHeight: 1.55
                  }}
                >
                  {q}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════
          §5  เพราะเราเจอปัญหามาก่อน
      ═════════════════════════════════════ */}
      <section className="c365-scene" data-scene="5" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* BG Parallax */}
        <div
          ref={problemBgRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            willChange: 'transform'
          }}
        >
          <div className="c365-scene-bg-reveal">
<img
            className="c365-motion-bg" src="/images/problem-up.png"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
          />
</div>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1320px',
            margin: '0 auto',
            padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            minHeight: '100vh',
            alignItems: 'center',
            gap: '40px'
          }}
        >
          {/* LEFT */}
          <div data-aos="fade-up">
            <h2
              className="c365-motion-drift c365-h-thick"
              style={{
                fontSize: 'clamp(1.8rem,3.8vw,3rem)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.2,
                marginBottom: '20px'
              }}
            >
              ทุกคอร์สการเรียนรู้
              <br />
              <span style={{ color: RED }}>สร้างจากประสบการณ์จริง</span>
            </h2>

            <div style={{ borderLeft: `2px solid ${RED}55`, paddingLeft: '18px' }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.85 }}>
                ด้วยพื้นฐานความเข้าใจในปัญหา
              </p>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.85 }}>
                และถอดทุกประสบการณ์จริงจากอาชีพ Live Commerce
              </p>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.85 }}>
                มาสร้างเป็นเนื้อหาการเรียนรู้ที่ครบในทุกมิติ
              </p>
            </div>
          </div>

          {/* RIGHT — bottom aligned text, เลื่อนเข้าจากขวาให้สวนทางกับฝั่งซ้าย */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              height: '100%',
              paddingBottom: '24vh',
              textAlign: 'right'
            }}
          >
            <h2
              data-aos="fade-left"
              className="c365-motion-float-slow c365-h-thick"
              data-aos-delay="150"
              style={{
                fontSize: 'clamp(1.8rem,3.8vw,3rem)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.2
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>เพราะเราเคยเจอปัญหามาก่อน</span>
            </h2>
          </div>
        </div>

        {/* บรรทัดสุดท้าย — ยึดขอบล่างสุดของ BG, ขนาดใหญ่ขึ้น */}
        <p
          data-aos="fade-up"
          data-aos-delay="300"
          style={{
            position: 'absolute',
            bottom: 'clamp(28px,4.5vw,56px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            width: '100%',
            maxWidth: '880px',
            padding: '0 24px',
            fontSize: 'clamp(15px,1.8vw,20px)',
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center'
          }}
        >
          หากคุณต้องการ{' '}
          <strong style={{ color: '#fff', fontWeight: 700 }}>เรียนแค่ทฤษฎีการไลฟ์</strong>{' '}
          หรือ<strong style={{ color: '#fff', fontWeight: 700 }}>การสอนแบบจับมือทํา</strong>{' '}
          <strong style={{ color: '#fff', fontWeight: 800 }}> ที่นี่…ไม่ใช่ของคุณ</strong>
        </p>
      </section>
       
     {/* ═════════════════════════════════════
          §6  BRAND PROMISE
      ═════════════════════════════════════ */}
      <section className="c365-scene" data-scene="6" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* BG */}
        <div ref={familyBgRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <div className="c365-scene-bg-reveal">
<img
            className="c365-motion-bg-slow" src="/images/Team-work1.jpg"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'left center'
            }}
          />
</div>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1320px',
            margin: '0 auto',
            padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* HEADER */}
          <div data-aos="fade-up" className="c365-motion-drift" style={{ marginBottom: '40px' }}>
            <h2 className="c365-h-thick" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#333' }}>
              Welcome to Creatr365's Family
            </h2>
            <p style={{ color: '#4a4a4a', marginTop: '6px' }}>
              หลักสูตรที่เลือกได้ตามสไตล์คุณ
            </p>
          </div>

          {/* GRID wrapper — เติมพื้นที่ที่เหลือใต้ header, จัดกึ่งกลางแนวตั้งในพื้นที่นั้น, ชิดซ้าย */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              paddingBottom: 'clamp(50px,6vw,70px)'
            }}
          >
            <div
              className="c365-family-row"
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: '14px',
                width: '100%'
              }}
            >
              {[
                '/images/pro-course-online.png',
                '/images/pro-workshop-liveclass.png',
                '/images/pro-AI-tech.png',
                '/images/pro-community.png'
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  data-aos="zoom-in"
                  className="c365-motion-card"
                  data-aos-delay={String(i * 80 + 120)}
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '10px'
                  }}
                />
              ))}
            </div>
          </div>

          {/* MARQUEE — full-bleed fix: this div's containing block is the
              maxWidth:1320px wrapper above (it's position:relative), so the
              old width:'100%' capped the bar at 1320px instead of the full
              section — confirmed by measuring it at 1320px on a 1920px
              screen. left:50%+width:100vw+margin-left:-50vw breaks it out to
              the true viewport width regardless of that ancestor. */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              width: '100vw',
              marginLeft: '-50vw',
              overflow: 'hidden',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.7)',
              padding: '12px 0'
            }}
          >
            <div
              style={{
                display: 'flex',
                whiteSpace: 'nowrap',
                gap: '52px',
                animation: 'marqueeRun 28s linear infinite'
              }}
            >
              {Array(6)
                .fill([
                  'Free Template',
                  'Free Ebook',
                  'Free Guide',
                  'Free Form',
                  'Free Checklist'
                ])
                .flat()
                .map((t, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.22em',
                      color: 'rgba(255,255,255,0.88)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: RED
                      }}
                    />
                    {t}
                  </span>
                ))}
            </div>
          </div>
        </div>
        {/* .c365-family-row is unique to §6 — cannot affect any other section */}
        <style>{`
          @media (max-width: 700px) {
            .c365-family-row { flex-wrap: wrap !important; }
            .c365-family-row img { flex: 1 1 calc(50% - 7px) !important; width: calc(50% - 7px) !important; }
          }
        `}</style>
      </section>

      {/* ═════════════════════════════════════
          §7  ไลฟ์ให้เป็น
      ═════════════════════════════════════ */}
      <section className="c365-scene" data-scene="7" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <div ref={sec7BgRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <div className="c365-scene-bg-reveal">
<img
            className="c365-motion-bg" src="/images/i-can-live2.png"
            alt="ไลฟ์ให้เป็น"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
</div>
        </div>
<div
          style={{
            position: 'absolute',
            left: 'clamp(28px,5vw,72px)',
            bottom: 'clamp(56px,8vh,100px)',
            zIndex: 2,
            display: 'flex',
            gap: 'clamp(32px,4vw,56px)',
              right: 'clamp(20px,5vw,72px)',
            flexWrap: 'wrap',
          }}
        >
          {[
            { name: 'MAGNET — LIVE COMMERCE BLUEPRINT', sub: 'FREE',          slug: 'magnet' },
            { name: 'THE FOUNDATION',               sub: 'ONLINE', slug: 'foundation' }
          ].map((course, i) => (
            <Link
              key={course.name}
              to={`/course/${course.slug}`}
              className="c365-motion-card"
              data-aos="fade-up"
              data-aos-delay={String(i * 100)}
              style={{ display: 'flex', gap: '14px', alignItems: 'stretch', textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              <div style={{ width: '4px', background: RED, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 'clamp(18px,1.8vw,24px)', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>
                  {course.name}
                </p>
                <p style={{ fontSize: 'clamp(13px,1.1vw,15px)', color: 'rgba(0,0,0,0.6)', marginTop: '4px' }}>
                  {course.sub}
                </p>
                <p style={{ fontSize: 'clamp(12px,1vw,14px)', color: 'rgba(0,0,0,0.7)', textDecoration: 'underline', textUnderlineOffset: '3px', marginTop: '8px' }}>
                  เพิ่มเติม
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════
          §8  ไลฟ์ให้ขายได้
      ═════════════════════════════════════ */}
      <section className="c365-scene" data-scene="8" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <div ref={sec8BgRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <div className="c365-scene-bg-reveal">
<img
            className="c365-motion-bg" src="/images/i-can-sale2.png"
            alt="ไลฟ์ให้ขายได้"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
</div>
        </div>
<div
          style={{
            position: 'absolute',
            left: 'clamp(28px,5vw,72px)',
            bottom: 'clamp(56px,8vh,100px)',
            zIndex: 2,
            display: 'flex',
            gap: 'clamp(32px,4vw,56px)',
              right: 'clamp(20px,5vw,72px)',
            flexWrap: 'wrap',
          }}
        >
          {[
            { name: 'SIGNAL', sub: 'THE CONVERSION HOST : ONLINE',               slug:  'signal' },
            { name: 'STAGE',  sub: 'COMMUNICATION MASTERY LAB : ONSITE 1 DAY', slug: 'stage' }
          ].map((course, i) => (
            <Link
              key={course.name}
              to={`/course/${course.slug}`}
              className="c365-motion-card"
              data-aos="fade-up"
              data-aos-delay={String(i * 100)}
              style={{ display: 'flex', gap: '14px', alignItems: 'stretch', textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              <div style={{ width: '4px', background: RED, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 'clamp(18px,1.8vw,24px)', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>
                  {course.name}
                </p>
                <p style={{ fontSize: 'clamp(13px,1.1vw,15px)', color: 'rgba(0,0,0,0.6)', marginTop: '4px' }}>
                  {course.sub}
                </p>
                <p style={{ fontSize: 'clamp(12px,1vw,14px)', color: 'rgba(0,0,0,0.7)', textDecoration: 'underline', textUnderlineOffset: '3px', marginTop: '8px' }}>
                  เพิ่มเติม
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════
          §9  ไลฟ์ให้วัดผลและทำซ้ำได้
      ═════════════════════════════════════ */}
      <section className="c365-scene" data-scene="9" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <div ref={sec9BgRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <div className="c365-scene-bg-reveal">
<img
            className="c365-motion-bg" src="/images/i-can-reply1.png"
            alt="ไลฟ์ให้วัดผลและทำซ้ำได้"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
</div>
        </div>

        {/* ซ้ายล่าง — main course */}
        <div
          data-aos="fade-up"
          className="c365-motion-float"
          style={{
            position: 'absolute',
            left: 'clamp(28px,5vw,72px)',
            bottom: 'clamp(48px,6vh,90px)',
            zIndex: 2,
          }}
        >
          <div style={{
            display: 'inline-block',
            background: '#F67C8C',
            color: 'rgba(0,0,0,0.55)',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            padding: '4px 10px 10px',
            transform: 'rotate(-6deg)',
            clipPath: 'polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%)',
            marginBottom: '12px',
            marginLeft: '-2px',
          }}>
            DON'T MISS!
          </div>
          <Link to="/course/brand-host-architect" style={{ display: 'flex', gap: '14px', alignItems: 'stretch', textDecoration: 'none' }}>
            <div style={{ width: '4px', background: RED, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 'clamp(18px,1.8vw,24px)', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>
                The BRAND ARCHITECT
              </p>
              <p style={{ fontSize: 'clamp(13px,1.1vw,15px)', color: 'rgba(0,0,0,0.6)', marginTop: '4px' }}>
                ONSITE 2 DAYS
              </p>
              <p style={{ fontSize: 'clamp(12px,1vw,14px)', color: 'rgba(0,0,0,0.7)', textDecoration: 'underline', textUnderlineOffset: '3px', marginTop: '8px' }}>
                ดูรายละเอียด
              </p>
            </div>
          </Link>
        </div>
        {/* กลาง–ขวาล่าง — also list */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(28px,4vw,52px)',
            left: '50%',
            transform: 'translateX(-10%)',
            zIndex: 2,
            display: 'flex',
            gap: '36px',
            flexWrap: 'wrap',
            right: 'clamp(16px,4vw,60px)',
            alignItems: 'flex-end'
          }}
        >
          {[
            { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER',                             slug: 'foundation' },
            { name: 'SIGNAL',         sub: 'THE CONVERSION HOST : ONLINE',               slug: 'signal' },
            { name: 'STAGE',          sub: 'THE COMMUNICATION MASTERY LAB : ONSITE 1 DAY', slug: 'stage'}
          ].map((course, i) => (
            <Link
              key={course.name}
              to={`/course/${course.slug}`}
              className="c365-motion-card"
              data-aos="fade-up"
              data-aos-delay={String(i * 80 + 120)}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                fontSize: 'clamp(11px,0.9vw,14px)',
                fontWeight: 600,
                color: '#1a1a1a',
                lineHeight: 1.2,
                letterSpacing: '0.04em'
              }}>
                {course.name}
              </div>
              <div style={{
                fontSize: '10px',
                letterSpacing: '0.16em',
                color: 'rgba(0,0,0,0.5)',
                textTransform: 'uppercase',
                marginTop: '3px',
                fontWeight: 400
              }}>
                {course.sub}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          §10  BRAND PHILOSOPHY / OUR ORIGIN
          The existing promo portrait becomes a living presence;
          narrative reveals in sequence when this scene enters view.
      ══════════════════════════════════════ */}
      <section
        className="c365-scene c365-origin-section"
        data-scene="10"
        style={{
          position: 'relative',
          minHeight: '100vh',
          overflow: 'hidden',
          isolation: 'isolate',
          background: '#080808',
          color: '#fff',
          padding: 'clamp(64px,7vw,96px) clamp(20px,6vw,84px) clamp(64px,7vw,90px)',
          boxSizing: 'border-box',
        }}
      >
        <div aria-hidden="true" className="c365-origin-ambient" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto' }}>
          <header className="c365-origin-header">
            <p
              data-aos="fade-in"
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'rgba(255,255,255,.46)',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '.34em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: RED }}>10</span>
              <span style={{ width: 38, height: 1, background: 'rgba(255,255,255,.24)' }} />
              BRAND PHILOSOPHY / OUR ORIGIN
            </p>

            <div data-aos="fade-up" data-aos-delay="100" className="c365-origin-brand-lockup">
              <h2 className="c365-h-nodefault c365-origin-brand">
                <img
                  src="/images/logoCreatr365/white_logo_side.png"
                  alt="Creatr365"
                  className="c365-origin-logo"
                  decoding="async"
                />
              </h2>
              <p className="c365-origin-reading">(ครีเอท-สามหกห้า)</p>
            </div>

            <p
              data-aos="fade-up"
              data-aos-delay="180"
              style={{
                margin: '12px 0 0',
                maxWidth: 760,
                color: 'rgba(255,255,255,.62)',
                fontSize: 'clamp(11px,1.25vw,15px)',
                fontWeight: 700,
                letterSpacing: '.13em',
                lineHeight: 1.7,
                textTransform: 'none',
              }}
            >
              A Creative House for the Future of Live Commerce
            </p>
          </header>

          <div className="c365-origin-grid">
            {/* Photo enters as a reveal, giving this brand story a human presence. */}
            <div className="c365-origin-photo-stage" style={{ gridArea: 'photo' }}>
              <div aria-hidden="true" className="c365-origin-photo-number">365</div>
              <div aria-hidden="true" className="c365-origin-photo-frame" />
              <div className="c365-origin-photo-reveal">
                <img
                  src="/images/section9promote.jpg"
                  alt="Creatr365 brand story"
                  loading="lazy"
                  decoding="async"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'min(68vh, 760px)',
                    objectFit: 'contain',
                    objectPosition: 'center bottom',
                    filter: 'drop-shadow(0 28px 55px rgba(0,0,0,.48))',
                  }}
                />
              </div>
              <img
                className="c365-origin-photo-caption"
                src="/images/logoCreatr365/white_concept_center.png"
                alt="Be a creator not a consumer"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="c365-origin-story" style={{ gridArea: 'story' }}>
              <p
                data-aos="fade-up"
                style={{
                  margin: 0,
                  color: 'rgba(255,255,255,.48)',
                  fontSize: 'clamp(14px,1.45vw,18px)',
                  lineHeight: 1.68,
                }}
              >
                ระบบนี้ไม่ได้เกิดจากการอยากมีคอร์ส
              </p>

              <h3
                data-aos="fade-up"
                data-aos-delay="100"
                className="c365-origin-thesis"
                style={{
                  margin: '10px 0 0',
                  color: '#fff',
                  fontSize: 'clamp(1.8rem,3.4vw,3.5rem)',
                  lineHeight: 1.04,
                  fontWeight: 850,
                  letterSpacing: '-.04em',
                }}
              >
                แต่เกิดจากการเห็น
                <br />
                <span className="c365-origin-kinetic">ช่องว่างในตลาด</span>
              </h3>

              <p
                data-aos="fade-up"
                data-aos-delay="180"
                className="c365-origin-belief"
                style={{
                  margin: 'clamp(16px,2vw,24px) 0 0',
                  color: 'rgba(255,255,255,.76)',
                  fontSize: 'clamp(16px,1.75vw,22px)',
                  lineHeight: 1.52,
                  fontWeight: 600,
                }}
              >
                ที่โฮสต์จำนวนมาก “ไลฟ์ได้” แต่ยังไม่ถูกมองว่า{' '}
                <span className="c365-origin-speaking-word">“ไลฟ์เป็น”</span>
              </p>

              <div
                data-aos="fade-up"
                data-aos-delay="240"
                style={{
                  marginTop: 'clamp(24px,3vw,36px)',
                  paddingLeft: 18,
                  borderLeft: '1px solid rgba(255,255,255,.22)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: 'rgba(255,255,255,.68)',
                    fontSize: 'clamp(13px,1.2vw,16px)',
                    lineHeight: 1.72,
                  }}
                >
                  ทุกเนื้อหา เครื่องมือ และ Framework ใน Creatr365
                  <br className="c365-origin-desktop-break" />
                  {' '}ถูกพัฒนาจากประสบการณ์ตรงในการทำงานจริงกับโฮสต์และแบรนด์
                </p>
              </div>

              <p
                data-aos="fade-up"
                data-aos-delay="320"
                className="c365-origin-not-copied"
                style={{
                  margin: 'clamp(14px,1.6vw,20px) 0 0',
                  color: '#fff',
                  fontSize: 'clamp(14px,1.4vw,18px)',
                  fontWeight: 800,
                  lineHeight: 1.5,
                }}
              >
                ไม่ได้คัดลอกจากคอร์สใด
              </p>

              <div
                data-aos="fade-up"
                data-aos-delay="360"
                style={{
                  marginTop: 'clamp(22px,2.8vw,34px)',
                  paddingTop: 'clamp(16px,1.8vw,22px)',
                  borderTop: '1px solid rgba(255,255,255,.15)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: 'rgba(255,255,255,.46)',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '.2em',
                  }}
                >
                  เป้าหมายของเราชัดเจน:
                </p>

                <div className="c365-origin-goals">
                  <p data-aos="fade-up" data-aos-delay="80">สร้างโฮสต์ที่มีมาตรฐาน</p>
                  <p data-aos="fade-up" data-aos-delay="160">วัดผลได้</p>
                  <p data-aos="fade-up" data-aos-delay="240">และแบรนด์อยากร่วมงานระยะยาว</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .c365-origin-section { --origin-red: #CC0033; }
          .c365-origin-ambient {
            position: absolute;
            z-index: 0;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(ellipse at 78% 43%, rgba(204,0,51,.14), transparent 38%),
              linear-gradient(135deg, rgba(255,255,255,.018), transparent 48%);
          }
          .c365-origin-header { position: relative; z-index: 2; }
          .c365-origin-brand-lockup { display: inline-block; max-width: 100%; }
          .c365-origin-brand { margin: 0; line-height: 1; width: fit-content; max-width: 100%; }
          .c365-origin-logo {
            display: block;
            width: clamp(190px,21vw,300px);
            max-width: 100%;
            height: auto;
            object-fit: contain;
            object-position: left center;
          }
          .c365-origin-reading {
            margin: 7px 0 0;
            color: rgba(255,255,255,.55);
            font-size: clamp(10px,.85vw,12px);
            font-weight: 600;
            letter-spacing: .08em;
            line-height: 1.35;
          }
          .c365-origin-grid {
            display: grid;
            grid-template-columns: minmax(0,1fr) minmax(0,.76fr);
            grid-template-areas: "story photo";
            align-items: center;
            gap: clamp(30px,4.6vw,72px);
            margin-top: clamp(32px,4.5vw,58px);
          }
          .c365-origin-story { min-width: 0; }
          .c365-origin-thesis { max-width: 680px; }
          .c365-origin-kinetic { display: inline-block; transform-origin: left center; }
          [data-scene="10"].is-visible .c365-origin-kinetic {
            animation: c365OriginWordIn 900ms cubic-bezier(.16,1,.3,1) 160ms both;
          }
          .c365-origin-speaking-word {
            color: #fff;
            display: inline-block;
            position: relative;
            white-space: nowrap;
          }
          .c365-origin-speaking-word::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -3px;
            height: 2px;
            background: var(--origin-red);
            transform: scaleX(0);
            transform-origin: left center;
            transition: transform .72s cubic-bezier(.16,1,.3,1) .4s;
          }
          [data-scene="10"].is-visible .c365-origin-speaking-word::after { transform: scaleX(1); }
          .c365-origin-photo-stage {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 0;
            min-height: 460px;
            isolation: isolate;
          }
          .c365-origin-photo-number {
            position: absolute;
            z-index: -1;
            left: -8%;
            bottom: 4%;
            color: rgba(255,255,255,.035);
            font-size: clamp(7rem,19vw,18rem);
            font-weight: 900;
            line-height: .75;
            letter-spacing: -.09em;
            user-select: none;
          }
          .c365-origin-photo-frame {
            position: absolute;
            top: 5%;
            right: 4%;
            bottom: 7%;
            left: 7%;
            border: 1px solid rgba(255,255,255,.2);
            transform: rotate(3deg) scale(.96);
            opacity: .2;
            transition: transform 1.2s cubic-bezier(.16,1,.3,1), opacity 1s ease;
          }
          [data-scene="10"].is-visible .c365-origin-photo-frame {
            transform: rotate(1deg) scale(1);
            opacity: .7;
          }
          .c365-origin-photo-reveal {
            position: relative;
            z-index: 1;
            width: 100%;
            opacity: .15;
            clip-path: inset(8% 0 0 16%);
            transform: translate3d(28px,18px,0) scale(.965);
            filter: saturate(.82);
            transition:
              clip-path 1.1s cubic-bezier(.16,1,.3,1),
              opacity .9s ease,
              transform 1.2s cubic-bezier(.16,1,.3,1),
              filter 1.2s ease;
          }
          [data-scene="10"].is-visible .c365-origin-photo-reveal {
            opacity: 1;
            clip-path: inset(0);
            transform: translate3d(0,0,0) scale(1);
            filter: saturate(1);
          }
          .c365-origin-photo-caption {
            position: absolute;
            z-index: 2;
            right: clamp(6px,1vw,14px);
            bottom: clamp(4px,.7vw,10px);
            display: block;
            width: clamp(132px,13vw,188px);
            max-width: 44%;
            max-height: 104px;
            height: auto;
            object-fit: contain;
            object-position: right bottom;
            filter: drop-shadow(0 4px 14px rgba(0,0,0,.45));
          }
          .c365-origin-not-copied { position: relative; padding-left: 16px; }
          .c365-origin-not-copied::before {
            content: '';
            position: absolute;
            left: 0;
            top: .28em;
            bottom: .28em;
            width: 2px;
            background: var(--origin-red);
          }
          .c365-origin-goals { display: grid; gap: 5px; margin-top: 10px; }
          .c365-origin-goals p {
            position: relative;
            margin: 0;
            padding-left: 16px;
            color: #fff;
            font-size: clamp(16px,1.7vw,21px);
            font-weight: 800;
            line-height: 1.45;
          }
          .c365-origin-goals p::before {
            content: '';
            position: absolute;
            left: 0;
            top: .68em;
            width: 5px;
            height: 5px;
            background: var(--origin-red);
          }
          @keyframes c365OriginWordIn {
            0% { opacity: 0; transform: translate3d(0,16px,0) scale(.94); filter: blur(8px); }
            68% { opacity: 1; transform: translate3d(0,-2px,0) scale(1.015); filter: blur(0); }
            100% { opacity: 1; transform: translate3d(0,0,0) scale(1); filter: blur(0); }
          }
          @media (max-width: 900px) {
            .c365-origin-grid {
              grid-template-columns: minmax(0,1fr);
              grid-template-areas: "photo" "story";
              gap: 26px;
              margin-top: 30px;
            }
            .c365-origin-photo-stage {
              min-height: 0;
              padding: 8px 8px 30px;
              width: 100%;
              max-width: 620px;
              margin: 0 auto;
            }
            .c365-origin-photo-reveal { max-width: 520px; margin: 0 auto; }
            .c365-origin-photo-reveal img { height: min(55vh,560px) !important; }
            .c365-origin-photo-number { left: 0; bottom: 15%; font-size: 36vw; }
            .c365-origin-photo-caption {
              width: clamp(116px,22vw,160px);
              max-width: 38%;
              max-height: 82px;
              bottom: 4px;
              right: 8px;
            }
            .c365-origin-logo { width: min(64vw,260px); }
            .c365-origin-desktop-break { display: none; }
          }
          @media (max-width: 480px) {
            .c365-origin-photo-reveal img { height: min(48vh,430px) !important; }
            .c365-origin-photo-caption { width: 124px; max-width: 38%; max-height: 68px; }
            .c365-origin-goals p { font-size: 16px; }
          }
          @media (prefers-reduced-motion: reduce) {
            [data-scene="10"].is-visible .c365-origin-kinetic,
            [data-scene="10"].is-visible .c365-origin-photo-frame,
            [data-scene="10"].is-visible .c365-origin-photo-reveal,
            [data-scene="10"].is-visible .c365-origin-speaking-word::after {
              animation: none !important;
              transition: none !important;
              filter: none !important;
            }
            .c365-origin-photo-frame { opacity: .7; transform: none; }
            .c365-origin-photo-reveal { clip-path: none; opacity: 1; transform: none; filter: none; }
            .c365-origin-kinetic { opacity: 1; transform: none; filter: none; }
            .c365-origin-speaking-word::after { transform: scaleX(1); }
          }
        `}</style>
      </section>

      {/* ══════════════════════════════════════
          §11  JOURNEY / FINAL CHAPTER
          Cinematic chapter frame — image remains the hero,
          typography and CTA act as editorial overlays.
      ══════════════════════════════════════ */}
      <section
        className="c365-scene"
        data-scene="11"
        style={{
          position: 'relative',
          minHeight: '100vh',
          overflow: 'hidden',
          background: '#080808',
          isolation: 'isolate',
        }}
      >
        <div
          ref={journeyBgRef}
          style={{
            position: 'absolute',
            inset: '-4%',
            zIndex: 0,
            willChange: 'transform',
          }}
        >
          <div className="c365-scene-bg-reveal" style={{ position: 'absolute', inset: 0 }}>
            <img
              className="c365-motion-bg"
              src="/images/journey-stairs2.jpg"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Cinematic contrast layer — deliberately subtle, not a photo filter. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            background: 'linear-gradient(90deg, rgba(8,8,8,.76) 0%, rgba(8,8,8,.24) 44%, rgba(8,8,8,.08) 72%, rgba(8,8,8,.48) 100%), linear-gradient(0deg, rgba(8,8,8,.72) 0%, transparent 32%, rgba(8,8,8,.16) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Editorial chapter marker */}
        <div
          data-aos="fade-in"
          style={{
            position: 'absolute',
            top: 'clamp(28px,4vw,58px)',
            left: 'clamp(20px,5vw,76px)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'rgba(255,255,255,.54)',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '.32em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: RED }}>11</span>
          <span style={{ width: 42, height: 1, background: 'rgba(255,255,255,.3)' }} />
          <span>FINAL CHAPTER</span>
        </div>

        {/* Main title — treated like a film title, not a website headline. */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            minHeight: '100vh',
            boxSizing: 'border-box',
            padding: 'clamp(100px,13vh,150px) clamp(20px,6vw,90px) clamp(120px,14vh,170px)',
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <p
              data-aos="fade-up"
              style={{
                margin: 0,
                color: 'rgba(255,255,255,.62)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.42em',
                textTransform: 'uppercase',
              }}
            >
              CONSUMER <span style={{ color: RED }}>→</span> CREATOR
            </p>

            <h2
              data-aos="fade-up"
              data-aos-delay="100"
              className="c365-h-nodefault"
              style={{
                margin: 'clamp(16px,2vw,28px) 0 0',
                color: '#fff',
                fontSize: 'clamp(3.3rem,8.5vw,8.6rem)',
                lineHeight: '.86',
                fontWeight: 900,
                letterSpacing: '-.055em',
                textTransform: 'uppercase',
              }}
            >
              YOUR
              <br />
              JOURNEY
              <br />
              <span style={{ color: RED }}>STARTS HERE.</span>
            </h2>

            <div
              data-aos="fade-up"
              data-aos-delay="220"
              style={{
                marginTop: 'clamp(26px,4vw,48px)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                maxWidth: 440,
              }}
            >
              <span style={{ width: 3, alignSelf: 'stretch', minHeight: 54, background: RED }} />
              <p
                style={{
                  margin: 0,
                  color: 'rgba(255,255,255,.68)',
                  fontSize: 'clamp(12px,1.1vw,15px)',
                  lineHeight: 1.7,
                  letterSpacing: '.01em',
                }}
              >
                จากคนที่เคยเป็นผู้ชม
                <br />
                สู่คนที่สร้างคุณค่า อิทธิพล และอาชีพของตัวเอง
              </p>
            </div>
          </div>
        </div>

        {/* Small action strip — intentionally secondary to the title. */}
        <div
          data-aos="fade-up"
          data-aos-delay="320"
          style={{
            position: 'absolute',
            right: 'clamp(20px,6vw,80px)',
            bottom: 'clamp(30px,5vw,62px)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,.32)',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '.28em',
              textTransform: 'uppercase',
            }}
          >
            NEXT / YOUR MOVE
          </span>
          <Link
            to="/courses"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '13px 20px',
              background: RED,
              color: '#fff',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '.1em',
              textDecoration: 'none',
              textTransform: 'uppercase',
              borderRadius: 2,
            }}
          >
            เริ่มเส้นทางของคุณ <ArrowRight size={14} />
          </Link>
          <Link
            to="/auth"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 18px',
              border: '1px solid rgba(255,255,255,.24)',
              color: 'rgba(255,255,255,.7)',
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '.1em',
              textDecoration: 'none',
              textTransform: 'uppercase',
              borderRadius: 2,
            }}
          >
            Free Account
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §12  WHY CREATR365 IS DIFFERENT
          Editorial comparison — same source data, new visual grammar.
          No table/card UI: each point reads like a magazine spread.
      ══════════════════════════════════════ */}
      <section
        className="c365-scene"
        data-scene="12"
        style={{
          position: 'relative',
          minHeight: '100vh',
          background: '#080808',
          color: '#fff',
          padding: 'clamp(76px,10vw,140px) clamp(20px,6vw,88px)',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Quiet registration line — keeps the section visually connected to the cinematic system. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'clamp(26px,4vw,52px)',
            left: 'clamp(20px,6vw,88px)',
            right: 'clamp(20px,6vw,88px)',
            height: 1,
            background: 'rgba(255,255,255,.09)',
          }}
        />

        <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto' }}>
          <div
            data-aos="fade-up"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(180px,.42fr)',
              gap: 'clamp(28px,7vw,120px)',
              alignItems: 'end',
              marginBottom: 'clamp(54px,8vw,96px)',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: RED,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: '.42em',
                  textTransform: 'uppercase',
                }}
              >
                12 / THE DIFFERENCE
              </p>
              <h2
                className="c365-h-nodefault"
                style={{
                  margin: '18px 0 0',
                  fontSize: 'clamp(3rem,7vw,7rem)',
                  lineHeight: '.88',
                  fontWeight: 900,
                  letterSpacing: '-.055em',
                  textTransform: 'uppercase',
                }}
              >
                WHY
                <br />
                CREATR<span style={{ color: RED }}>365</span>?
              </h2>
            </div>

            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,.46)',
                fontSize: 'clamp(11px,1vw,13px)',
                lineHeight: 1.8,
                letterSpacing: '.02em',
                maxWidth: 300,
              }}
            >
              ไม่ใช่แค่เรียนให้ทำได้
              <br />
              แต่เรียนให้เข้าใจว่า
              <br />
              <span style={{ color: '#fff' }}>ทำไมมันถึงได้ผล</span>
            </p>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,.18)' }}>
            {WHY.map((row, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={String(100 + i * 90)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'clamp(42px,6vw,76px) minmax(0,1fr) minmax(0,1fr)',
                  borderBottom: '1px solid rgba(255,255,255,.1)',
                  minHeight: 'clamp(150px,18vh,205px)',
                }}
              >
                <div
                  style={{
                    padding: 'clamp(20px,2.4vw,34px) 0',
                    color: RED,
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '.18em',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>

                <div
                  style={{
                    padding: 'clamp(20px,2.4vw,34px) clamp(16px,3vw,42px) clamp(20px,2.4vw,34px) 0',
                    borderRight: '1px solid rgba(255,255,255,.1)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: 'rgba(255,255,255,.34)',
                      fontSize: 'clamp(15px,1.8vw,22px)',
                      lineHeight: 1.35,
                    }}
                  >
                    {row.them}
                  </p>
                </div>

                <div
                  style={{
                    padding: 'clamp(20px,2.4vw,34px) 0 clamp(20px,2.4vw,34px) clamp(16px,3vw,42px)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#fff',
                      fontSize: 'clamp(15px,1.8vw,22px)',
                      lineHeight: 1.35,
                      fontWeight: 700,
                    }}
                  >
                    {row.us}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            data-aos="fade-up"
            data-aos-delay="360"
            style={{
              marginTop: 'clamp(38px,5vw,64px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,.28)',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '.28em',
                textTransform: 'uppercase',
              }}
            >
              FRAMEWORK / PRACTICE / DATA / AI-READY
            </p>
            <Link
              to="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderBottom: `1px solid ${RED}`,
                paddingBottom: 7,
              }}
            >
              Explore the curriculum <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §13  LAST FRAME
          End-credit feeling rather than a conventional CTA block.
          Existing core message is preserved; hierarchy is redesigned.
      ══════════════════════════════════════ */}
      <section
        className="c365-scene"
        data-scene="13"
        style={{
          position: 'relative',
          minHeight: '100vh',
          background: '#050505',
          color: '#fff',
          padding: 'clamp(90px,12vw,170px) clamp(20px,6vw,90px)',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Fine red registration line */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'clamp(28px,4vw,54px)',
            left: 'clamp(20px,6vw,90px)',
            right: 'clamp(20px,6vw,90px)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ color: RED, fontSize: 9, fontWeight: 900, letterSpacing: '.32em' }}>13</span>
          <span style={{ height: 1, flex: 1, background: 'rgba(255,255,255,.1)' }} />
          <span style={{ color: 'rgba(255,255,255,.28)', fontSize: 9, fontWeight: 800, letterSpacing: '.28em' }}>LAST FRAME</span>
        </div>

        <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto' }}>
          <div
            data-aos="fade-up"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1.35fr) minmax(220px,.65fr)',
              gap: 'clamp(42px,9vw,150px)',
              alignItems: 'end',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: RED,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: '.4em',
                  textTransform: 'uppercase',
                }}
              >
                THE STATEMENT
              </p>

              <blockquote
                style={{
                  margin: 'clamp(28px,4vw,52px) 0 0',
                  padding: 0,
                  border: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: 'clamp(2rem,4.8vw,5.2rem)',
                    lineHeight: '.98',
                    fontWeight: 900,
                    letterSpacing: '-.045em',
                  }}
                >
                  เพราะเป้าหมายสูงสุด
                  <br />
                  ไม่ใช่การ<span style={{ color: RED }}>ไลฟ์เก่ง.</span>
                </p>

                <p
                  style={{
                    margin: 'clamp(28px,4vw,48px) 0 0',
                    maxWidth: 680,
                    color: 'rgba(255,255,255,.55)',
                    fontSize: 'clamp(13px,1.25vw,17px)',
                    lineHeight: 1.9,
                  }}
                >
                  แต่คือการ
                  <span style={{ color: '#fff', textDecoration: 'underline', textUnderlineOffset: 5 }}>
                    สร้างมาตรฐานและคุณภาพ
                  </span>
                  <br />
                  เพื่อการเติบโตในอาชีพที่พร้อมเข้าสู่ตลาดในระดับ Global
                  <br />
                  ด้วยอาชีพที่ยั่งยืนและธุรกิจที่เติบโตได้อย่างมีศักยภาพ
                </p>
              </blockquote>
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="160"
              style={{
                borderTop: `2px solid ${RED}`,
                paddingTop: 22,
              }}
            >
              <p
                className="c365-h-nodefault"
                style={{
                  margin: 0,
                  fontSize: 'clamp(2rem,3.8vw,4rem)',
                  lineHeight: .9,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-.045em',
                }}
              >
                Be a creatr.
              </p>
              <p
                style={{
                  margin: '7px 0 0',
                  color: 'rgba(255,255,255,.42)',
                  fontSize: 'clamp(1rem,2vw,1.5rem)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                }}
              >
                Not a consumer.
              </p>

              <p
                style={{
                  margin: '18px 0 0',
                  color: 'rgba(255,255,255,.28)',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '.28em',
                  lineHeight: 1.7,
                  textTransform: 'uppercase',
                }}
              >
                WELCOME TO CREATR365'S FAMILY
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginTop: 28,
                }}
              >
                <Link
                  to="/courses"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '13px 19px',
                    background: RED,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 10,
                    letterSpacing: '.1em',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    borderRadius: 2,
                  }}
                >
                  Begin now <ArrowRight size={13} />
                </Link>
                <Link
                  to="/auth"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '12px 17px',
                    border: '1px solid rgba(255,255,255,.2)',
                    color: 'rgba(255,255,255,.62)',
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: '.1em',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    borderRadius: 2,
                  }}
                >
                  Free Account
                </Link>
              </div>
            </div>
          </div>

          {/* End-credit metadata */}
          <div
            data-aos="fade-up"
            data-aos-delay="300"
            style={{
              marginTop: 'clamp(90px,13vw,170px)',
              paddingTop: 18,
              borderTop: '1px solid rgba(255,255,255,.1)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,.25)', fontSize: 9, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase' }}>
              CREATR365
            </span>
            <span style={{ color: 'rgba(255,255,255,.25)', fontSize: 9, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase' }}>
              LIVE COMMERCE / PSYCHOLOGY / COMMUNICATION / DATA / AI-READY
            </span>
            <span style={{ color: 'rgba(255,255,255,.25)', fontSize: 9, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase' }}>
              2026
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
