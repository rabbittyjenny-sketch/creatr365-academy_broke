import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';

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

  const heroBgRef    = useParallax(0.2);
  const problemBgRef = useParallax(0.13);
  const journeyBgRef = useParallax(0.13);

  // เพิ่ม parallax ให้ BG ที่เคยนิ่งสนิท (ยกเว้น §2 และ §10 ตามสเปก — ปล่อยให้นิ่งเพื่อให้อ่านง่าย)
  const familyBgRef  = useParallax(0.08);   // §6  Team-work1.jpg
  const sec7BgRef     = useParallax(0.08);  // §7  i-can-live2.png
  const sec8BgRef     = useParallax(0.08);  // §8  i-can-sale2.png
  const sec9BgRef     = useParallax(0.08);  // §9  i-can-reply1.png

  return (
    <main className="home-scroll" style={{ background: '#0a0a0a', overflowX: 'hidden', fontSize: '18px' }}>

      {/* ══════════════════════════════════════
          §1  HERO
          BG: Hero-team1.png — brightness(0.72) เฉพาะ hero
          ไม่มี overlay gradient ทั้ง 2 อัน (ลบตามสเปก)
          layout: ซ้ายทั้งหมด
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* BG parallax layer — brightness filter only, no overlays */}
        <div ref={heroBgRef} style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform' }}>
          <img
            src="/images/Hero-team1.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center right'}}
          />
        </div>

        {/* Content — ปุ่ม + tagline ล่างสุดกลาง */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 'clamp(20px,4vw,48px) clamp(24px,7vw,96px)', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(16px,2vw,24px)' }}>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/courses" data-aos="fade-up"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(24px,3vw,40px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', borderRadius: '4px', cursor: 'pointer', border: 'none', transition: 'opacity .2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                BEGIN NOW <ArrowRight size={15} />
              </Link>
              <Link to="/auth" data-aos="fade-up" data-aos-delay="90"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '14px clamp(20px,2.5vw,32px)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.48)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                FREE ACCOUNT
              </Link>
            </div>
            <p data-aos="fade-up" data-aos-delay="200" style={{ fontSize: 'clamp(12px,1.3vw,15px)', lineHeight: 1.8, color: 'rgba(255,255,255,0.42)', textAlign: 'center' }}>
              เพราะอนาคตของ Live Commerce ไม่ใช่แค่การขายของ แต่คือการ{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>สร้างคุณค่า</strong>{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>สร้างอิทธิพล</strong>{' '}
              และ<strong style={{ color: '#fff', fontWeight: 700 }}>สร้างอาชีพที่ยั่งยืน</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §2  STATS / MARKET DATA
          BG: graph-section2.png เต็มหน้า 100vh
          ไม่มีอะไรทับ ไม่ filter ไม่ overlay เลย
          รูปมีข้อมูลครบในตัวเอง
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <img
          src="/images/graph-section2.png"
          alt="Live-Streaming E-Commerce Market Data"
          style={{ width: '100%', height: '100vh', objectFit: 'cover', display: 'block' }}
        />
      </section>

      {/* ══════════════════════════════════════
          §3  อยากร่วมงานกับแบรนด์ใหญ่?
          BG: สีพื้น #1a1a1a ไม่มีรูป BG
          แถวบน: brand1.png (4 กรอบ) slide-in from left
          แถวล่าง: brand2.png (3 กรอบ) slide-in from right
      ══════════════════════════════════════ */}
      <section style={{ background: '#1a1a1a', padding: 'clamp(60px,8vw,100px) 0', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 clamp(20px,4vw,48px)', width: '100%' }}>
          <div style={{ marginBottom: 'clamp(40px,5vw,60px)' }}>
            <h2 data-aos="fade-up" style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              อยากร่วมงานกับแบรนด์ใหญ่ ?
            </h2>
            <p data-aos="fade-up" data-aos-delay="80" style={{ fontSize: 'clamp(15px,2vw,20px)', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>
              สิ่งที่ตลาดต้องการ คือ…
            </p>
          </div>

          {/* แถวบน: brand1.png — slide in from left */}
          <div data-aos="fade-right" data-aos-delay="180" style={{ marginBottom: '16px', lineHeight: 0 }}>
            <img src="/images/brand1.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          {/* แถวล่าง: brand2.png — slide in from right */}
          <div data-aos="fade-left" data-aos-delay="260" style={{ marginBottom: 'clamp(40px,5vw,60px)', lineHeight: 0 }}>
            <img src="/images/brand2.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          {/* ปุ่มกึ่งกลางล่าง */}
          <div data-aos="fade-up" data-aos-delay="360" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/courses"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(28px,3vw,44px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', borderRadius: '4px', cursor: 'pointer', border: 'none', transition: 'opacity .2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              ดูหลักสูตร <ArrowRight size={15} />
            </Link>
            <Link to="/articles/diagnostic-quiz"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px clamp(24px,2.5vw,36px)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.62)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.48)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; }}>
              ▷ Find Your Path
            </Link>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════
          §4  เป็นเหมือนกันไหม ?
      ═════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* BG */}
        <img
          src="/images/ringlight-back1.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'left center'
          }}
        />

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
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
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
          <img
            src="/images/problem-up.png"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
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
            minHeight: '100vh',
            alignItems: 'center',
            gap: '40px'
          }}
        >
          {/* LEFT */}
          <div data-aos="fade-up">
            <h2
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
              data-aos-delay="150"
              style={{
                fontSize: 'clamp(1.8rem,3.8vw,3rem)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.2
              }}
            >
              เพราะเราเคยเจอปัญหามาก่อน
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
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* BG */}
        <div ref={familyBgRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <img
            src="/images/Team-work1.jpg"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
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
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* HEADER */}
          <div data-aos="fade-up" style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#fff' }}>
              Welcome to Creatr365's Family
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: '6px' }}>
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
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, clamp(200px,18vw,280px))',
                gap: '10px'
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
                  data-aos-delay={String(i * 80 + 120)}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '10px'
                  }}
                />
              ))}
            </div>
          </div>

          {/* MARQUEE */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              overflow: 'hidden',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.7)',
              padding: '10px 0'
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
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.28em',
                      color: 'rgba(255,255,255,0.55)',
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
      </section>

      {/* ═════════════════════════════════════
          §7  ไลฟ์ให้เป็น
      ═════════════════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <div ref={sec7BgRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <img
            src="/images/i-can-live2.png"
            alt="ไลฟ์ให้เป็น"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 'clamp(24px,4vw,60px)',
            bottom: 'clamp(28px,4vw,52px)',
            zIndex: 2,
            display: 'flex',
            gap: '40px',
            alignItems: 'flex-end'
          }}
        >
          {[
            { name: 'THE MAGNET',     sub: 'READY FOR LIVE',  tag: 'FREE',   slug: 'the-magnet' },
            { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER',   tag: 'COURSE', slug: 'the-foundation' }
          ].map((course, i) => (
            <Link
              key={course.name}
              to={`/course/${course.slug}`}
              data-aos="fade-up"
              data-aos-delay={String(i * 100)}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                fontSize: '9px',
                letterSpacing: '0.22em',
                fontWeight: 500,
                color: 'rgba(0,0,0,0.5)',
                textTransform: 'uppercase',
                marginBottom: '5px'
              }}>
                {course.tag}
              </div>
              <div style={{
                fontSize: 'clamp(12px,1vw,15px)',
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

      {/* ═════════════════════════════════════
          §8  ไลฟ์ให้ขายได้
      ═════════════════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <div ref={sec8BgRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <img
            src="/images/i-can-sale2.png"
            alt="ไลฟ์ให้ขายได้"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 'clamp(24px,4vw,60px)',
            bottom: 'clamp(28px,4vw,52px)',
            zIndex: 2,
            display: 'flex',
            gap: '40px',
            alignItems: 'flex-end'
          }}
        >
          {[
            { name: 'SIGNAL', sub: 'THE CONVERSION HOST : ONLINE',               tag: 'COURSE', slug: 'signal' },
            { name: 'STAGE',  sub: 'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', tag: 'COURSE', slug: 'stage' }
          ].map((course, i) => (
            <Link
              key={course.name}
              to={`/course/${course.slug}`}
              data-aos="fade-up"
              data-aos-delay={String(i * 100)}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                fontSize: '9px',
                letterSpacing: '0.22em',
                fontWeight: 500,
                color: 'rgba(0,0,0,0.5)',
                textTransform: 'uppercase',
                marginBottom: '5px'
              }}>
                {course.tag}
              </div>
              <div style={{
                fontSize: 'clamp(12px,1vw,15px)',
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

      {/* ═════════════════════════════════════
          §9  ไลฟ์ให้วัดผลและทำซ้ำได้
      ═════════════════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <div ref={sec9BgRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <img
            src="/images/i-can-reply1.png"
            alt="ไลฟ์ให้วัดผลและทำซ้ำได้"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* ซ้ายล่าง — main course */}
        <div
          data-aos="fade-up"
          style={{
            position: 'absolute',
            left: 'clamp(24px,4vw,60px)',
            bottom: 'clamp(28px,4vw,52px)',
            zIndex: 2
          }}
        >
          <div style={{
            fontSize: '9px',
            letterSpacing: '0.22em',
            fontWeight: 500,
            color: 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            marginBottom: '5px'
          }}>
            COMING SOON
          </div>
          <div style={{
            fontSize: 'clamp(12px,1vw,15px)',
            fontWeight: 600,
            color: '#1a1a1a',
            lineHeight: 1.2,
            letterSpacing: '0.04em'
          }}>
            THE BRAND ARCHITECT
          </div>
          <div style={{
            fontSize: '10px',
            letterSpacing: '0.16em',
            color: 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            marginTop: '3px',
            fontWeight: 400
          }}>
            MASTERCLASS : ONSITE 2 DAYS
          </div>
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
            alignItems: 'flex-end'
          }}
        >
          {[
            { name: 'THE FOUNDATION', sub: 'LIVE EXPLORER',                             slug: 'the-foundation' },
            { name: 'SIGNAL',         sub: 'THE CONVERSION HOST : ONLINE',               slug: 'signal' },
            { name: 'STAGE',          sub: 'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', slug: 'stage' }
          ].map((course, i) => (
            <Link
              key={course.name}
              to={`/course/${course.slug}`}
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
          §10  Brand Concept
          BG: Team-behind1.png เต็มหน้า 100vh ไม่ filter ไม่ overlay
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* BG เต็มหน้า ไม่มี overlay */}
        <img
          src="/images/Team-behind1.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* §10 content area — รูป Team-behind1.png คือตัวเนื้อหาเอง ตาม spec page 10 */}
        </div>
      </section>

      {/* ══════════════════════════════════════
          §11  JOURNEY
          BG: journey-stairs2.jpg เต็มหน้า 100vh ไม่ filter ไม่ overlay
          Parallax BG
          บนซ้าย: CONSUMER→CREATOR / YOUR JOURNEY / STARTS HERE.
          ล่างขวา: ปุ่ม
      ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* BG parallax — ไม่มี overlay gradient */}
        <div ref={journeyBgRef} style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform' }}>
          <img
            src="/images/journey-stairs2.jpg"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>

        {/* top-left */}
        <div style={{ position: 'absolute', top: 'clamp(32px,5vw,56px)', left: 'clamp(20px,6vw,80px)', zIndex: 1 }}>
          <p data-aos="fade-in" style={{ fontSize: '11px', letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)', marginBottom: '10px' }}>
            CONSUMER → CREATOR
          </p>
          <h2 data-aos="fade-up" data-aos-delay="120" style={{ fontSize: 'clamp(2.5rem,6vw,5.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.02 }}>
            YOUR JOURNEY<br /><span style={{ color: RED }}>STARTS HERE.</span>
          </h2>
        </div>

        {/* bottom-right buttons */}
        <div style={{ position: 'absolute', bottom: 'clamp(36px,5vw,60px)', right: 'clamp(20px,6vw,80px)', zIndex: 1, display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/courses" data-aos="fade-up" data-aos-delay="260"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(24px,3vw,40px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', borderRadius: '4px', cursor: 'pointer', border: 'none', transition: 'opacity .2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            เริ่มเส้นทางของคุณ <ArrowRight size={15} />
          </Link>
          <Link to="/auth" data-aos="fade-up" data-aos-delay="340"
            style={{ display: 'inline-flex', alignItems: 'center', padding: '14px clamp(20px,2.5vw,32px)', border: '1px solid rgba(255,255,255,0.26)', color: 'rgba(255,255,255,0.68)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', cursor: 'pointer', transition: 'all .2s' }}
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
      <section style={{ background: '#0a0a0a', padding: 'clamp(60px,8vw,100px) clamp(20px,4vw,48px)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <div data-aos="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,2vw,20px)', flexWrap: 'wrap', marginBottom: 'clamp(40px,5vw,60px)' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3.2rem)', fontWeight: 900, color: '#fff' }}>WHY</h2>
            <img src={LOGO} alt="Creatr365" style={{ height: 'clamp(26px,3vw,40px)', width: 'auto', filter: 'brightness(0) invert(1)' }} />
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3.2rem)', fontWeight: 900, color: '#fff' }}>DIFFERENCE?</h2>
          </div>

          <div data-aos="fade-up" data-aos-delay="120" style={{ border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {/* header row */}
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

          <div data-aos="fade-up" data-aos-delay={String(WHY.length * 60 + 150)} style={{ textAlign: 'center', marginTop: 'clamp(32px,4vw,48px)' }}>
            <Link to="/courses"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(32px,4vw,56px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', borderRadius: '4px', cursor: 'pointer', border: 'none', transition: 'opacity .2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              เลือกคอร์ส <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          §13  CTA
          BG: #080808 สีพื้น
          ข้อความตาม spec: quote ใหญ่ / tagline / ปุ่ม
      ══════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: 'clamp(80px,10vw,140px) clamp(20px,4vw,48px)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
          <div data-aos="fade-up">
            {/* Quote */}
            <p style={{ fontSize: 'clamp(1.4rem,3vw,2.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.35, marginBottom: 'clamp(24px,3vw,40px)' }}>
              "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง
            </p>
            <p style={{ fontSize: 'clamp(1rem,2vw,1.5rem)', lineHeight: 1.8, color: 'rgba(255,255,255,0.72)', marginBottom: 'clamp(32px,4vw,56px)' }}>
              แต่คือการ<span style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}>สร้างมาตรฐานและคุณภาพ</span><br />
              เพื่อการเติบโตในอาชีพที่พร้อมเข้าสู่ตลาดในระดับ Global<br />
              ด้วยอาชีพที่ยั่งยืนและธุรกิจที่เติบโตได้อย่างมีศักยภาพ"
            </p>
          </div>

          <div data-aos="fade-up" data-aos-delay="150">
            {/* Be a creatr mark */}
            <div style={{ marginBottom: 'clamp(16px,2vw,24px)' }}>
              <p style={{ fontSize: 'clamp(1.1rem,2.2vw,1.6rem)', fontWeight: 900, fontStyle: 'italic', color: '#fff', lineHeight: 1.1 }}>Be a creatr.</p>
              <p style={{ fontSize: 'clamp(1rem,2vw,1.4rem)', fontWeight: 700, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)', lineHeight: 1.1 }}>Not a consumer.</p>
              <p style={{ fontSize: '10px', letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginTop: '8px' }}>WELCOME TO CREATR365'S FAMILY</p>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/courses" data-aos="fade-up" data-aos-delay="280"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px clamp(24px,3vw,44px)', background: RED, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', borderRadius: '4px', cursor: 'pointer', border: 'none', transition: 'opacity .2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                BEGIN NOW <ArrowRight size={15} />
              </Link>
              <Link to="/auth" data-aos="fade-up" data-aos-delay="360"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '14px clamp(20px,2.5vw,36px)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textDecoration: 'none', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.48)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                FREE ACCOUNT
              </Link>
            </div>
          </div>

          {/* bottom-right logo — ปั๊มตราปิดท้าย แล้วลอยเบาๆต่อเนื่อง */}
          <div data-aos="fade-in" data-aos-delay="480" data-aos-once="true" style={{ marginTop: 'clamp(40px,6vw,80px)', display: 'flex', justifyContent: 'flex-end' }}>
            <img src={LOGO} alt="Creatr365" className="float-y" style={{ height: 'clamp(28px,3.5vw,48px)', width: 'auto', filter: 'brightness(0) invert(1)' }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(40px,5vw,60px) clamp(20px,4vw,48px) clamp(24px,3vw,40px)', fontFamily: 'inherit' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'clamp(24px,4vw,48px)', marginBottom: 'clamp(28px,3vw,40px)' }}>
            <div>
              <img src={LOGO} alt="Creatr365" style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: '12px' }} />
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: '260px', fontFamily: 'inherit' }}>
                A Creative House for the Future of Live Commerce.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'clamp(28px,4vw,56px)', flexWrap: 'wrap' }}>
              {Object.entries({
                'หลักสูตร': [['/courses','ดูทั้งหมด'],['/course/the-magnet','THE MAGNET'],['/course/the-foundation','THE FOUNDATION'],['/course/signal','SIGNAL'],['/course/stage','STAGE']],
                'เกี่ยวกับ': [['/about','เกี่ยวกับเรา'],['/articles','บทความ'],['/contact','ติดต่อ']],
              }).map(([title, links]) => (
                <div key={title}>
                  <p style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '14px', fontFamily: 'inherit' }}>{title}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(links as string[][]).map(([href, label]) => (
                      <Link key={href} to={href} style={{ fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color .2s', fontFamily: 'inherit' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '22px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
              {[['นโยบายความเป็นส่วนตัว', '/privacy'], ['ข้อกำหนดการใช้บริการ', '/terms'], ['นโยบายคุกกี้', '/cookies']].map(([l, h]) => (
                <Link key={l} to={h} style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color .2s', fontFamily: 'inherit', fontSize: '13px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
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
