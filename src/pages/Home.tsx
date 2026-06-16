import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const RED   = '#CC0033';
const LOGO  = '/images/w-logo-oneline.png';  // horizontal white logo

/* ─────────────────────────────────────────
   PARALLAX HOOK
   — layers move at different speeds (depth)
───────────────────────────────────────── */
function useParallaxLayer(speed = 0.15) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const fn = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [speed]);
  return ref;
}

/* ─────────────────────────────────────────
   SCROLL REVEAL HOOK  (fade-up / fade-in)
───────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const run = () => {
      document.querySelectorAll('[data-aos]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 60) el.classList.add('aos-in');
      });
    };
    run();
    window.addEventListener('scroll', run, { passive: true });
    return () => window.removeEventListener('scroll', run);
  });
}

/* ─────────────────────────────────────────
   COUNT-UP HOOK
───────────────────────────────────────── */
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
      setV(pre + (num < 10 ? (Math.round(e * num * 10) / 10).toFixed(1) : Math.round(e * num).toLocaleString()) + suf);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [trigger, target]);
  return v;
}

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const STATS = [
  { v: '$172.9B', l: 'Live Commerce ทั่วโลก 2025',               src: 'Grand View Research' },
  { v: '33.9%',   l: 'CAGR Live-Streaming E-Commerce 2024–2034', src: 'market.us' },
  { v: '1.1T฿',  l: 'ตลาด e-Commerce ไทย ปี 2024',              src: 'Priceza' },
  { v: '+21.7%', l: 'ไทยโตเร็วที่สุดใน SEA ปี 2024',            src: 'Momentum Works' },
];

/* brand cards §3 — ใช้รูปที่มีจริง */
const BRAND_TOP = [
  { img: '/images/brand1.png', n:'01', title:'ปิดการขาย\nช่วยสร้างยอด ลดอัตราคืนสินค้า',      body:'กลยุทธ์การพูดในไลฟ์ที่จัดการทั้งอารมณ์ผู้ชม และนำไปสู่การตัดสินใจซื้อสินค้า และลดการส่งคืนสินค้า' },
  { img: '/images/brand1.png', n:'02', title:'รักษา Retention\nระหว่างไลฟ์',                   body:'ผู้ชมที่อยู่นานขึ้นคือโอกาสขายที่เพิ่มขึ้นตามไปด้วยทุกครั้ง ตั้งแต่วินาทีที่เปิดจอไลฟ์ขึ้น' },
  { img: '/images/brand1.png', n:'03', title:'สร้างความน่าเชื่อถือ\nต่อตัวเองและผลิตภัณฑ์',   body:'วางตำแหน่งตัวเอง สร้างความไว้วางใจ และนำเสนอสินค้าที่น่าสนใจ และมีคุณค่าในสายตาผู้บริโภค' },
  { img: '/images/brand1.png', n:'04', title:'สื่อสารสินค้า\nได้ตรงกลุ่ม',                    body:'เข้าใจสินค้า เข้าใจลูกค้า สื่อสารได้ตรงและมีผลตามความต้องการ และสื่อสารได้ใส่ใจความต้องการ' },
];
const BRAND_BTM = [
  { img: '/images/brand1.png', n:'05', title:'คุมภาพลักษณ์\nแบรนด์ได้ดี',                      body:'สร้างภาพลักษณ์มืออาชีพ น่าเชื่อถือ และเป็นตัวเองผ่านการไลฟ์ทุกครั้ง' },
  { img: '/images/brand1.png', n:'06', title:'ทำงานแบบ Data-Driven\n+ ปรับแผนได้เร็ว',          body:'เข้าใจข้อมูล วิเคราะห์ผลลัพธ์ ปรับกลยุทธ์ให้เดินต่อได้อย่างต่อเนื่อง' },
  { img: '/images/brand1.png', n:'07', title:'ทำงานร่วมกับทีมหลังบ้านได้\nรู้หน้าที่และพร้อม Support', body:'ทำงานร่วมกับทีมได้ทั้งในไลฟ์ทุกครั้ง เพื่อให้ไลฟ์ทำกำไรอย่างมีประสิทธิภาพ' },
];

/* WHY table §12 */
const WHY = [
  { them:'สูตรสำเร็จที่หาดูได้ฟรีบน YouTube',           us:'PPACT Framework 5 มิติ ฝังในทุกคอร์ส' },
  { them:'เน้นเทคนิคตะโกนขายหรือสร้าง Hype',            us:'Host Archetype + Soul Blueprint เพื่อตัวตนที่ชัด' },
  { them:'สอนพูดตามสคริปต์โดยไม่วิเคราะห์ตัวเลข',      us:'อ่าน KPI (CCV, CTR, CVR, Retention) + AI Tools' },
  { them:'ขึ้นกับโฮสต์คนเดียว ถ้าหายไปยอดหาย',          us:'Brand Host Architect — วางระบบ Production ทั้งทีม' },
  { them:'เรียนจบไม่รู้จะทำอะไรต่อ',                    us:'Key Collection System™ มาตรฐานอุตสาหกรรม' },
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function Home() {
  useScrollReveal();

  /* §1 hero — BG parallax layer */
  const heroBg = useParallaxLayer(0.16) as React.RefObject<HTMLDivElement>;
  /* §5 problem — secondary element parallax */
  const problemImg = useParallaxLayer(0.08) as React.RefObject<HTMLDivElement>;

  /* §2 stats count-up trigger */
  const statsWrap = useRef<HTMLDivElement>(null);
  const [statsTrig, setStatsTrig] = useState(false);
  useEffect(() => {
    const el = statsWrap.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsTrig(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  /* §2 stats source modal */
  const [modal, setModal] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setModal(false);
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  /* Tier accordion §7-9 */
  const [openTier, setOpenTier] = useState<string|null>(null);
  const toggleTier = useCallback((id: string) => setOpenTier(p => p === id ? null : id), []);

  /* §4 ringlight — text fade-in stagger */
  const rlRef = useRef<HTMLDivElement>(null);
  const [rlVisible, setRlVisible] = useState(false);
  useEffect(() => {
    const el = rlRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setRlVisible(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const S1v = useCountUp(STATS[0].v, statsTrig);
  const S2v = useCountUp(STATS[1].v, statsTrig);
  const S3v = useCountUp(STATS[2].v, statsTrig);
  const S4v = useCountUp(STATS[3].v, statsTrig);
  const statVals = [S1v, S2v, S3v, S4v];

  return (
    <main style={{ background:'#0a0a0a', overflowX:'hidden' }}>

      {/* ═══════════════════════════════════
          §1  HERO
          Layout (ตาม PDF/ref):
            บนซ้าย  — Logo  + eyebrow
            กลาง gap
            ล่างซ้าย — BE / CREATOR. / NOT CONSUMER.
            ล่างซ้าย — ปุ่ม BEGIN NOW + FREE ACCOUNT
            ล่างสุด  — tagline เล็ก (bold keywords)
          BG: Hero-team1.png ทีมชิดขวา, ซ้ายมืด
      ═══════════════════════════════════ */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* BG parallax — ช้ากว่า content */}
        <div ref={heroBg} style={{ position:'absolute', inset:0, zIndex:0, willChange:'transform' }}>
          <img src="/images/Hero-team1.png" alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center right', filter:'brightness(0.52)', transform:'scale(1.06)' }} />
          {/* gradient: solid black ซ้าย → transparent ขวา */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(100deg,rgba(10,10,10,0.97) 30%,rgba(10,10,10,0.65) 58%,rgba(10,10,10,0.15) 100%)' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'200px', background:'linear-gradient(to top,#0a0a0a,transparent)' }} />
        </div>

        {/* Content — เร็วกว่า BG → เกิด parallax depth */}
        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', minHeight:'100vh', padding:'clamp(20px,4vw,44px) clamp(24px,7vw,96px)' }}>
          {/* บนซ้าย */}
          <div data-aos="fade-in" style={{ marginBottom:'auto' }}>
            <img src={LOGO} alt="Creatr365"
              style={{ height:'clamp(22px,2.4vw,30px)', width:'auto', objectFit:'contain', filter:'brightness(0) invert(1)', display:'block', marginBottom:'10px' }} />
            <p style={{ fontSize:'11px', letterSpacing:'0.32em', color:'rgba(255,255,255,0.42)', textTransform:'uppercase' }}>
              A Creative House for the Future of Live Commerce.
            </p>
          </div>

          {/* ล่างซ้าย — headline */}
          <div style={{ paddingTop:'clamp(80px,12vh,160px)' }}>
            <h1 data-aos="fade-up" style={{ fontWeight:900, lineHeight:0.92, marginBottom:'clamp(24px,3vw,36px)', fontSize:'clamp(3.8rem,8.5vw,7.2rem)' }}>
              <span style={{ color:'#fff', display:'block' }}>BE</span>
              <span style={{ color:'#fff', display:'block' }}>CREATOR</span>
              <span style={{ color:RED, display:'block' }}>.</span>
              <span style={{ color:'rgba(255,255,255,0.22)', display:'block', fontSize:'0.5em', letterSpacing:'0.07em', marginTop:'6px' }}>NOT A CONSUMER.</span>
            </h1>

            {/* ปุ่ม */}
            <div data-aos="fade-up" data-aos-delay="100" style={{ display:'flex', gap:'14px', flexWrap:'wrap', marginBottom:'clamp(24px,3vw,36px)' }}>
              <Link to="/courses" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px clamp(24px,3vw,40px)', background:RED, color:'#fff', fontWeight:700, fontSize:'13px', letterSpacing:'0.22em', textTransform:'uppercase', textDecoration:'none', transition:'opacity .2s' }}
                onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                BEGIN NOW <ArrowRight size={15}/>
              </Link>
              <Link to="/auth" style={{ display:'inline-flex', alignItems:'center', padding:'14px clamp(20px,2.5vw,32px)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.58)', fontWeight:600, fontSize:'13px', letterSpacing:'0.18em', textTransform:'uppercase', textDecoration:'none', transition:'border-color .2s,color .2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.45)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.color='rgba(255,255,255,0.58)'; }}>
                FREE ACCOUNT
              </Link>
            </div>

            {/* tagline ล่างสุด — font เล็ก, keywords bold+ขาว */}
            <p data-aos="fade-up" data-aos-delay="180" style={{ fontSize:'clamp(12px,1.3vw,15px)', lineHeight:1.8, color:'rgba(255,255,255,0.42)', maxWidth:'580px' }}>
              เพราะอนาคตของ Live Commerce ไม่ใช่แค่การขายของ&nbsp; แต่คือการ{' '}
              <strong style={{ color:'#fff', fontWeight:700 }}>สร้างคุณค่า</strong>{' '}
              <strong style={{ color:'#fff', fontWeight:700 }}>สร้างอิทธิพล</strong>{' '}
              และ<strong style={{ color:'#fff', fontWeight:700 }}>สร้างอาชีพที่ยั่งยืน</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          §2  STATS
          BG: graph-section2.png — เต็มหน้า ไม่มีอะไรทับ
          count-up + คลิก = modal source
      ═══════════════════════════════════ */}
      <section style={{ position:'relative', minHeight:'360px' }}>
        {/* BG กราฟ — subtle parallax ช้ากว่า */}
        <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden' }}>
          <img src="/images/graph-section2.png" alt="Market Data"
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
          {/* overlay บางมาก — แค่ให้ตัวเลขอ่านได้ */}
          <div style={{ position:'absolute', inset:0, background:'rgba(10,10,10,0.42)' }} />
        </div>

        <div ref={statsWrap} style={{ position:'relative', zIndex:1, maxWidth:'1320px', margin:'0 auto', padding:'clamp(48px,6vw,80px) clamp(20px,4vw,40px)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'2px', background:'rgba(255,255,255,0.04)' }}>
            {STATS.map((s, i) => (
              <button key={i} onClick={()=>setModal(true)}
                data-aos="fade-up" data-aos-delay={String(i*80)}
                style={{ background:'rgba(10,10,10,0.52)', backdropFilter:'blur(10px)', padding:'28px 22px', textAlign:'left', border:'none', cursor:'pointer', transition:'background .3s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(204,0,51,0.14)')}
                onMouseLeave={e=>(e.currentTarget.style.background='rgba(10,10,10,0.52)')}>
                <p style={{ fontSize:'clamp(1.9rem,3.8vw,3rem)', fontWeight:900, color:'#fff', marginBottom:'8px', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                  {statVals[i]}
                </p>
                <p style={{ fontSize:'13px', lineHeight:1.55, color:'rgba(255,255,255,0.75)', marginBottom:'6px' }}>{s.l}</p>
                <p style={{ fontSize:'10px', letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)' }}>{s.src}</p>
              </button>
            ))}
          </div>
          <button onClick={()=>setModal(true)} style={{ marginTop:'10px', background:'none', border:'none', color:'rgba(255,255,255,0.28)', fontSize:'11px', cursor:'pointer', letterSpacing:'0.2em', textDecoration:'underline', display:'block' }}>
            ดูแหล่งอ้างอิงทั้งหมด →
          </button>
        </div>
      </section>

      {/* Stats modal */}
      {modal && (
        <div onClick={()=>setModal(false)} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.84)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)', padding:'36px', maxWidth:'520px', width:'100%', position:'relative', animation:'popIn .22s cubic-bezier(.16,1,.3,1)' }}>
            <button onClick={()=>setModal(false)} style={{ position:'absolute', top:'14px', right:'16px', background:'none', border:'none', color:'rgba(255,255,255,0.38)', fontSize:'20px', cursor:'pointer' }}>✕</button>
            <p style={{ fontSize:'10px', letterSpacing:'0.44em', textTransform:'uppercase', color:RED, fontWeight:700, marginBottom:'20px' }}>Market Insight — แหล่งอ้างอิง</p>
            <img src="/images/graph-section2.png" alt="" style={{ width:'100%', marginBottom:'20px', borderRadius:'2px' }} />
            {STATS.map((s,i)=>(
              <div key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', paddingBottom:'14px', marginBottom:'14px' }}>
                <p style={{ fontSize:'22px', fontWeight:900, color:'#fff' }}>{s.v}</p>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.62)', marginTop:'3px' }}>{s.l}</p>
                <p style={{ fontSize:'10px', letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginTop:'4px' }}>Source: {s.src}</p>
              </div>
            ))}
            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', lineHeight:1.7, marginTop:'8px' }}>
              Grand View Research (2025) · market.us Report MU1125B4874 · Priceza Thailand E-Commerce 2024 · Momentum Works SEA 3.0 (2025)
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          §3  อยากร่วมงานกับแบรนด์ใหญ่?
          BG: สีเข้มธีม ไม่ใส่รูป
          Cards: brand1.png — Reveal/Slide in effect
          ปุ่ม: ดูหลักสูตร + Find Your Path
      ═══════════════════════════════════ */}
      <section style={{ background:'#080808', padding:'clamp(60px,8vw,100px) 0' }}>
        <div style={{ maxWidth:'1320px', margin:'0 auto', padding:'0 clamp(20px,4vw,48px)' }}>
          <div data-aos="fade-up" style={{ marginBottom:'clamp(40px,5vw,60px)' }}>
            <h2 style={{ fontSize:'clamp(2rem,5vw,3.8rem)', fontWeight:900, color:'#fff', marginBottom:'8px' }}>อยากร่วมงานกับแบรนด์ใหญ่ ?</h2>
            <p style={{ fontSize:'clamp(15px,2vw,20px)', fontWeight:300, color:'rgba(255,255,255,0.45)' }}>สิ่งที่ตลาดต้องการ คือ…</p>
          </div>

          {/* แถวบน 4 cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'10px' }}>
            {BRAND_TOP.map((c,i)=><BrandCard key={i} c={c} delay={i*0.08} />)}
          </div>
          {/* แถวล่าง 3 cards — centered */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', maxWidth:'990px', margin:'0 auto clamp(40px,5vw,56px)' }}>
            {BRAND_BTM.map((c,i)=><BrandCard key={i} c={c} delay={(i+4)*0.08} />)}
          </div>

          {/* ปุ่ม centered */}
          <div data-aos="fade-up" style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/courses" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px clamp(28px,3vw,44px)', background:RED, color:'#fff', fontWeight:700, fontSize:'13px', letterSpacing:'0.22em', textTransform:'uppercase', textDecoration:'none', transition:'opacity .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
              ดูหลักสูตร <ArrowRight size={15}/>
            </Link>
            <Link to="/articles/diagnostic-quiz" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px clamp(24px,2.5vw,36px)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.62)', fontWeight:600, fontSize:'13px', letterSpacing:'0.18em', textTransform:'uppercase', textDecoration:'none', transition:'border-color .2s,color .2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.45)'; e.currentTarget.style.color='#fff'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.color='rgba(255,255,255,0.62)'; }}>
              ▷ Find Your Path
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          §4  เป็นเหมือนกันไหม?
          BG: ringlight-back1.png ซ้าย
          Text ขวา — stagger fade-in
          Logo + tagline กึ่งกลางล่างสุด
      ═══════════════════════════════════ */}
      <section ref={rlRef} style={{ position:'relative', minHeight:'80vh', overflow:'hidden' }}>
        {/* BG ringlight — ช้ากว่า text (depth) */}
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          <img src="/images/ringlight-back1.png" alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'left center', filter:'brightness(0.56)', transition:'transform 8s ease' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(10,10,10,0.08) 0%,rgba(10,10,10,0.75) 52%,rgba(10,10,10,0.97) 100%)' }} />
        </div>

        <div style={{ position:'relative', zIndex:1, maxWidth:'1320px', margin:'0 auto', padding:'clamp(60px,8vw,100px) clamp(20px,4vw,48px)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px', alignItems:'center', minHeight:'80vh' }}>
          <div />{/* ซ้าย — ว่าง (BG เป็น visual) */}

          {/* ขวา — text stagger */}
          <div>
            <h2 style={{ fontSize:'clamp(2.4rem,5vw,4rem)', fontWeight:900, color:'#fff', marginBottom:'clamp(28px,3.5vw,44px)', lineHeight:1.05, opacity: rlVisible?1:0, transform: rlVisible?'translateY(0)':'translateY(30px)', transition:'opacity .7s,transform .7s' }}>
              เป็นเหมือนกันไหม ?
            </h2>
            {[
              'ไลฟ์แล้วไม่มีคนดู? ไม่มีคนแชร์?',
              'ทำยังไงให้คนอยู่ต่อ? ปิดการขายยังไง?',
              'ต้องใช้สคริปต์หรือเทคนิคอะไรดี?',
              'จะพูดอย่างไรเพื่อให้เกิดรายรับในไลฟ์?',
            ].map((q,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'14px', marginBottom:'clamp(14px,2vw,22px)', opacity: rlVisible?1:0, transform: rlVisible?'translateY(0)':'translateY(24px)', transition:`opacity .6s ${0.18+i*0.12}s, transform .6s ${0.18+i*0.12}s` }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:RED, flexShrink:0, marginTop:'9px' }} />
                <p style={{ fontSize:'clamp(15px,2vw,19px)', fontWeight:500, color:'#ffffff', lineHeight:1.5 }}>{q}</p>
              </div>
            ))}

            {/* Logo + tagline กึ่งกลางล่าง */}
            <div style={{ marginTop:'clamp(40px,5vw,64px)', textAlign:'center', opacity: rlVisible?1:0, transition:'opacity .7s .72s' }}>
              <img src={LOGO} alt="Creatr365" style={{ height:'22px', width:'auto', filter:'brightness(0) invert(1)', display:'inline-block', marginBottom:'6px' }} />
              <p style={{ fontSize:'16px', color:'rgba(255,255,255,0.52)' }}>A Creative House for the Future of Live Commerce.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          §5  เพราะเราเจอปัญหามาก่อน
          BG: problem-up.png
          Text ซ้าย — fade-up
          รูป BG เคลื่อนที่ต่าง speed = depth
      ═══════════════════════════════════ */}
      <section style={{ position:'relative', minHeight:'70vh', overflow:'hidden' }}>
        {/* BG — parallax layer ช้า */}
        <div ref={problemImg} style={{ position:'absolute', inset:0, zIndex:0, willChange:'transform' }}>
          <img src="/images/problem-up.png" alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', filter:'brightness(0.42)' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,rgba(10,10,10,0.96) 38%,rgba(10,10,10,0.52) 65%,rgba(10,10,10,0.14) 100%)' }} />
        </div>

        <div style={{ position:'relative', zIndex:1, maxWidth:'1320px', margin:'0 auto', padding:'clamp(60px,8vw,100px) clamp(20px,4vw,48px)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px', alignItems:'center', minHeight:'70vh' }}>
          <div data-aos="fade-up">
            <img src={LOGO} alt="Creatr365" style={{ height:'20px', width:'auto', filter:'brightness(0) invert(1)', marginBottom:'6px' }} />
            <p style={{ fontSize:'10px', letterSpacing:'0.42em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)', marginBottom:'24px' }}>WELCOME TO CREATR365'S FAMILY</p>
            <h2 style={{ fontSize:'clamp(1.8rem,3.8vw,3rem)', fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:'22px' }}>
              ทุกคอร์สการเรียนรู้<br/>
              <span style={{ color:RED }}>สร้างจากประสบการณ์จริง</span>
            </h2>
            <div style={{ borderLeft:`2px solid ${RED}55`, paddingLeft:'18px', marginBottom:'22px' }}>
              {['ด้วยพื้นฐานความเข้าใจในปัญหา','และถอดทุกประสบการณ์จริงจากอาชีพ Live Commerce','มาสร้างเป็นเนื้อหาการเรียนรู้ที่ครบในทุกมิติ'].map((t,i)=>(
                <p key={i} style={{ fontSize:'clamp(14px,1.5vw,16px)', lineHeight:1.85, color:'rgba(255,255,255,0.72)' }}>{t}</p>
              ))}
            </div>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.36)', fontStyle:'italic' }}>
              หากคุณต้องการ "เรียนแค่ทฤษฎีการไลฟ์" หรือ "การสอนแบบจับมือทำ"&nbsp;
              <span style={{ fontStyle:'normal', fontWeight:700, color:'rgba(255,255,255,0.68)' }}>ที่นี่… ไม่ใช่ของคุณ</span>
            </p>
          </div>
          <div />{/* ว่าง ขวา */}
        </div>
      </section>

      {/* ═══════════════════════════════════
          §6  BRAND PROMISE
          BG: Team-work1.jpg ขวา
          ซ้าย: 2×2 course image cards
          ล่าง: marquee free gifts
      ═══════════════════════════════════ */}
      <section style={{ background:'#060606', paddingTop:'clamp(60px,7vw,90px)' }}>
        <div style={{ maxWidth:'1320px', margin:'0 auto', padding:'0 clamp(20px,4vw,48px)' }}>
          <div data-aos="fade-up" style={{ marginBottom:'clamp(32px,4vw,48px)' }}>
            <p style={{ fontSize:'10px', letterSpacing:'0.48em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)', marginBottom:'8px' }}>WELCOME TO CREATR365'S FAMILY</p>
            <h2 style={{ fontSize:'clamp(1.8rem,4vw,3rem)', fontWeight:900, color:'#fff' }}>
              หลักสูตรที่เลือกได้<span style={{ color:RED }}>ตามสไตล์คุณ</span>
            </h2>
          </div>

          {/* Grid: ซ้าย course 2×2 | ขวา team photo */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', alignItems:'stretch' }}>
            <div data-aos="fade-up" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {[
                { src:'/images/pro-course-online.png',      label:'คอร์สเรียนออนไลน์'     },
                { src:'/images/pro-workshop-liveclass.png', label:'เวิร์คช็อป & ไลฟ์คลาส' },
                { src:'/images/pro-AI-tech.png',            label:'TECH & AI'               },
                { src:'/images/pro-community.png',          label:'ชุมชน & เครือข่าย'      },
              ].map((item,i)=>(
                <div key={i} style={{ aspectRatio:'1', overflow:'hidden', position:'relative', background:'#111' }}>
                  <img src={item.src} alt={item.label}
                    style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.85, transition:'transform .65s,opacity .35s' }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLImageElement).style.transform='scale(1.07)'; (e.currentTarget as HTMLImageElement).style.opacity='1'; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLImageElement).style.transform='scale(1)'; (e.currentTarget as HTMLImageElement).style.opacity='0.85'; }} />
                </div>
              ))}
            </div>
            <div data-aos="fade-up" data-aos-delay="100" style={{ overflow:'hidden', minHeight:'340px' }}>
              <img src="/images/Team-work1.jpg" alt="Creatr365 Team"
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', filter:'brightness(0.82)', transition:'transform .7s' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.03)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')} />
            </div>
          </div>
        </div>

        {/* Marquee free gifts */}
        <div style={{ overflow:'hidden', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'11px 0', marginTop:'clamp(28px,4vw,48px)', background:'#0d0d0d' }}>
          <div style={{ display:'flex', whiteSpace:'nowrap', gap:'52px', animation:'marqueeRun 26s linear infinite' }}>
            {Array(5).fill(['Free Gift ทั้งหมด : Free - Template','Free - Ebook','Free - Vocabulary guide','Free - Document Form','Free - Checklist']).flat().map((t,i)=>(
              <span key={i} style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'rgba(255,255,255,0.46)', flexShrink:0, display:'inline-flex', alignItems:'center', gap:'12px' }}>
                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:RED, display:'inline-block', flexShrink:0 }} />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          §7  ไลฟ์ให้เป็น
          BG: i-can-live2.png
          Courses: THE MAGNET / THE FOUNDATION
          แต่ละคอร์สมีลิ้งค์ไปหน้ารายละเอียดคอร์ส
      ═══════════════════════════════════ */}
      <TierSection
        id="t1"
        bg="/images/i-can-live2.png"
        logoSrc={LOGO}
        headline="ไลฟ์ให้"
        headlineRed="เป็น"
        open={openTier} onToggle={toggleTier}
        courses={[
          { name:'THE MAGNET',    sub:'READY FOR LIVE',  tag:'FREE',   slug:'the-magnet',    detail:'เพิ่มเติม' },
          { name:'THE FOUNDATION', sub:'LIVE EXPLORER',  tag:'COURSE', slug:'the-foundation', detail:'เพิ่มเติม' },
        ]}
      />

      {/* ═══════════════════════════════════
          §8  ไลฟ์ให้ขายได้
          BG: i-can-sale2.png
      ═══════════════════════════════════ */}
      <TierSection
        id="t2"
        bg="/images/i-can-sale2.png"
        logoSrc={LOGO}
        headline="ไลฟ์ให้"
        headlineRed="ขายได้"
        open={openTier} onToggle={toggleTier}
        courses={[
          { name:'SIGNAL', sub:'THE CONVERSION HOST : ONLINE',              tag:'COURSE', slug:'signal', detail:'เพิ่มเติม' },
          { name:'STAGE',  sub:'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', tag:'COURSE', slug:'stage',  detail:'เพิ่มเติม' },
        ]}
      />

      {/* ═══════════════════════════════════
          §9  ไลฟ์ให้วัดผลและทำซ้ำได้
          BG: i-can-reply1.png
          + Also includes 3 courses
      ═══════════════════════════════════ */}
      <TierSection
        id="t3"
        bg="/images/i-can-reply1.png"
        logoSrc={LOGO}
        headline="ไลฟ์ให้"
        headlineRed="วัดผลและทำซ้ำได้"
        badge="DON'T MISS!"
        open={openTier} onToggle={toggleTier}
        courses={[
          { name:'The BRAND ARCHITECT', sub:'MASTERCLASS : ONSITE 2 DAYS', tag:'COMING SOON', slug:'', detail:'' },
        ]}
        also={[
          { name:'THE FOUNDATION', sub:'LIVE EXPLORER',                       slug:'the-foundation' },
          { name:'SIGNAL',         sub:'THE CONVERSION HOST : ONLINE',         slug:'signal' },
          { name:'STAGE',          sub:'THE SIGNATURE INTENSIVE LAB : ONSITE 1 DAY', slug:'stage' },
        ]}
      />

      {/* ═══════════════════════════════════
          §10  BRAND CONCEPT
          BG: Team-behind1.png
      ═══════════════════════════════════ */}
      <section style={{ position:'relative', minHeight:'62vh', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          <img src="/images/Team-behind1.png" alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', filter:'brightness(0.34)' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(10,10,10,0.95) 40%,rgba(10,10,10,0.5) 70%,rgba(10,10,10,0.18) 100%)' }} />
        </div>
        <div style={{ position:'relative', zIndex:1, maxWidth:'860px', margin:'0 auto', padding:'clamp(60px,8vw,100px) clamp(20px,4vw,48px)', textAlign:'center', minHeight:'62vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div data-aos="fade-up">
            <p style={{ fontSize:'10px', letterSpacing:'0.48em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:'18px' }}>BRAND CONCEPT</p>
            <h2 style={{ fontSize:'clamp(2rem,4.5vw,3.6rem)', fontWeight:900, color:'#fff', lineHeight:1.18, marginBottom:'18px' }}>
              เราไม่สัญญาว่าเรียนจบแล้ว<br/><span style={{ color:RED }}>คุณจะรวย</span>
            </h2>
            <p style={{ fontSize:'clamp(14px,1.6vw,17px)', lineHeight:1.9, color:'rgba(255,255,255,0.65)', maxWidth:'480px', margin:'0 auto 14px' }}>
              แต่เราจะให้คุณ <strong style={{ color:'#fff' }}>"ได้ทำ"</strong> เพื่อเอาไปปรับใช้ในการไลฟ์ที่คุณ <strong style={{ color:'#fff' }}>"ทำได้"</strong> จริง
            </p>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.34)', fontStyle:'italic' }}>
              "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง แต่คือการสร้างธุรกิจที่เติบโตได้"
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          §11  JOURNEY
          BG: journey-stairs2.jpg เต็มหน้า
          บนซ้าย: CONSUMER→CREATOR / YOUR JOURNEY / STARTS HERE.
          ล่างขวา: ปุ่ม
      ═══════════════════════════════════ */}
      <section style={{ position:'relative', minHeight:'90vh', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          <img src="/images/journey-stairs2.jpg" alt="Journey"
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', filter:'brightness(0.62)' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(10,10,10,0.32) 0%,rgba(10,10,10,0.14) 45%,rgba(10,10,10,0.68) 82%,#0a0a0a 100%)' }} />
        </div>

        {/* บนซ้าย */}
        <div data-aos="fade-in" style={{ position:'absolute', top:'clamp(32px,5vw,56px)', left:'clamp(20px,6vw,80px)', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'0.5em', textTransform:'uppercase', color:'rgba(255,255,255,0.48)', marginBottom:'10px' }}>CONSUMER → CREATOR</p>
          <h2 style={{ fontSize:'clamp(2.5rem,6vw,5.2rem)', fontWeight:900, color:'#fff', lineHeight:1.02 }}>
            YOUR JOURNEY<br/><span style={{ color:RED }}>STARTS HERE.</span>
          </h2>
        </div>

        {/* ล่างขวา — ปุ่ม */}
        <div data-aos="fade-up" style={{ position:'absolute', bottom:'clamp(36px,5vw,60px)', right:'clamp(20px,6vw,80px)', zIndex:1, display:'flex', gap:'14px', flexWrap:'wrap', justifyContent:'flex-end' }}>
          <Link to="/courses" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px clamp(24px,3vw,40px)', background:RED, color:'#fff', fontWeight:700, fontSize:'13px', letterSpacing:'0.22em', textTransform:'uppercase', textDecoration:'none', transition:'opacity .2s' }}
            onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
            เริ่มเส้นทางของคุณ <ArrowRight size={15}/>
          </Link>
          <Link to="/auth" style={{ display:'inline-flex', alignItems:'center', padding:'14px clamp(20px,2.5vw,32px)', border:'1px solid rgba(255,255,255,0.24)', color:'rgba(255,255,255,0.65)', fontWeight:600, fontSize:'13px', letterSpacing:'0.18em', textTransform:'uppercase', textDecoration:'none', transition:'border-color .2s,color .2s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.48)'; e.currentTarget.style.color='#fff'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.24)'; e.currentTarget.style.color='rgba(255,255,255,0.65)'; }}>
            Free Account
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════
          §12  WHY CREATR365 DIFFERENCE?
          BG: สีเข้ม #060606
          ตาราง 2 col: คอร์สทั่วไป / CREATR365
          Logo ในหัวตาราง col ขวา
      ═══════════════════════════════════ */}
      <section style={{ background:'#060606', padding:'clamp(60px,8vw,100px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth:'1080px', margin:'0 auto' }}>
          {/* Heading: WHY [logo] DIFFERENCE? */}
          <div data-aos="fade-up" style={{ display:'flex', alignItems:'center', gap:'clamp(10px,2vw,20px)', flexWrap:'wrap', marginBottom:'clamp(40px,5vw,60px)' }}>
            <h2 style={{ fontSize:'clamp(1.8rem,4vw,3.2rem)', fontWeight:900, color:'#fff', lineHeight:1 }}>WHY</h2>
            <img src="/images/w-logo-oneline.png" alt="Creatr365"
              style={{ height:'clamp(28px,3.5vw,44px)', width:'auto', filter:'brightness(0) invert(1)', objectFit:'contain' }} />
            <h2 style={{ fontSize:'clamp(1.8rem,4vw,3.2rem)', fontWeight:900, color:'#fff', lineHeight:1 }}>DIFFERENCE?</h2>
          </div>

          <div data-aos="fade-up" style={{ border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
            {/* header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding:'14px 22px', textAlign:'center', background:'rgba(255,255,255,0.025)', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:'10px', fontWeight:900, letterSpacing:'0.42em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)' }}>คอร์สทั่วไป</span>
              </div>
              <div style={{ padding:'14px 22px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', background:`${RED}10` }}>
                <img src="/images/w-logo-oneline.png" alt="Creatr365" style={{ height:'16px', width:'auto', filter:'brightness(0) invert(1)', opacity:0.9 }} />
              </div>
            </div>
            {WHY.map((row,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom: i<WHY.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition:'background .2s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.013)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div style={{ padding:'18px 22px', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'flex-start', gap:'10px', background:'rgba(255,255,255,0.012)' }}>
                  <X size={13} style={{ color:'rgba(255,255,255,0.22)', flexShrink:0, marginTop:'3px' }} />
                  <p style={{ fontSize:'clamp(12px,1.3vw,14px)', lineHeight:1.58, color:'rgba(255,255,255,0.35)' }}>{row.them}</p>
                </div>
                <div style={{ padding:'18px 22px', display:'flex', alignItems:'flex-start', gap:'10px', background:`${RED}06` }}>
                  <Check size={13} style={{ color:'#34A853', flexShrink:0, marginTop:'3px' }} />
                  <p style={{ fontSize:'clamp(12px,1.3vw,14px)', lineHeight:1.58, color:'rgba(255,255,255,0.78)' }}>{row.us}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ปุ่มล่าง */}
          <div data-aos="fade-up" style={{ textAlign:'center', marginTop:'clamp(32px,4vw,48px)' }}>
            <Link to="/courses" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'14px clamp(32px,4vw,56px)', background:RED, color:'#fff', fontWeight:700, fontSize:'13px', letterSpacing:'0.22em', textTransform:'uppercase', textDecoration:'none', transition:'opacity .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
              เริ่มเส้นทางของคุณ <ArrowRight size={15}/>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          §13  CTA
          BG: #080808 (dark)
          Quote + WELCOME + BE A CREATOR + ปุ่ม
          Logo ล่างสุด
      ═══════════════════════════════════ */}
      <section style={{ background:'#080808', padding:'clamp(70px,9vw,110px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth:'820px', margin:'0 auto', textAlign:'center' }}>
          <div data-aos="fade-up">
            <p style={{ fontSize:'clamp(15px,1.8vw,19px)', lineHeight:1.8, color:'rgba(255,255,255,0.48)', fontStyle:'italic', marginBottom:'20px' }}>
              "เพราะเป้าหมายสูงสุดไม่ใช่การไลฟ์เก่ง<br/>
              แต่คือการสร้างธุรกิจที่เติบโตได้"
            </p>
            <p style={{ fontSize:'10px', letterSpacing:'0.52em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginBottom:'18px' }}>WELCOME TO CREATR365'S FAMILY</p>
            <h2 style={{ fontSize:'clamp(3.8rem,9.5vw,8rem)', fontWeight:900, lineHeight:0.9, marginBottom:'36px' }}>
              <span style={{ color:'#fff', display:'block' }}>BE A</span>
              <span style={{ color:RED, display:'block' }}>CREATOR.</span>
              <span style={{ color:'rgba(255,255,255,0.18)', display:'block', fontSize:'0.48em', letterSpacing:'0.07em', marginTop:'6px' }}>NOT A CONSUMER.</span>
            </h2>
            <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', marginBottom:'clamp(48px,6vw,72px)' }}>
              <Link to="/courses" style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'15px clamp(32px,4vw,52px)', background:RED, color:'#fff', fontWeight:900, fontSize:'13px', letterSpacing:'0.22em', textTransform:'uppercase', textDecoration:'none', transition:'opacity .2s' }}
                onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                BEGIN NOW <ArrowRight size={16}/>
              </Link>
              <Link to="/auth" style={{ display:'inline-flex', alignItems:'center', padding:'15px clamp(24px,3vw,40px)', border:'1px solid rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.52)', fontWeight:600, fontSize:'13px', letterSpacing:'0.15em', textTransform:'uppercase', textDecoration:'none', transition:'border-color .2s,color .2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.42)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'; e.currentTarget.style.color='rgba(255,255,255,0.52)'; }}>
                Free Account
              </Link>
            </div>
            {/* Logo ล่างสุด */}
            <img src="/images/w-logo-oneline.png" alt="Creatr365" style={{ height:'clamp(20px,2.2vw,26px)', width:'auto', filter:'brightness(0) invert(1)', opacity:0.5 }} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FOOTER — Creatr365 original preserved
      ═══════════════════════════════════ */}
      <footer style={{ background:'#040404', borderTop:'1px solid rgba(255,255,255,0.05)', padding:'clamp(44px,6vw,72px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth:'1320px', margin:'0 auto' }}>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-start', gap:'28px', marginBottom:'36px' }}>
            <div>
              <img src={LOGO} alt="Creatr365" style={{ height:'20px', width:'auto', filter:'brightness(0) invert(1)', marginBottom:'7px' }} />
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.36)' }}>A Creative House for the Future of Live Commerce.</p>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'22px' }}>
              {[['หลักสูตร','/courses'],['บทความ','/articles'],['FAQ','/faq'],['ติดต่อ','/contact'],['เข้าสู่ระบบ','/auth']].map(([l,h])=>(
                <Link key={l} to={h} style={{ fontSize:'11px', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.38)', textDecoration:'none', transition:'color .2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.38)')}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'22px', display:'flex', flexWrap:'wrap', justifyContent:'space-between', gap:'10px', fontSize:'11px', color:'rgba(255,255,255,0.24)' }}>
            <p>© 2025 CREATR365. All rights reserved.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'18px' }}>
              {[['นโยบายความเป็นส่วนตัว','/privacy'],['ข้อกำหนดการใช้บริการ','/terms'],['นโยบายการคืนเงิน','/refund-policy']].map(([l,h])=>(
                <Link key={l} to={h} style={{ color:'rgba(255,255,255,0.24)', textDecoration:'none', transition:'color .2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.24)')}>
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

/* ─────────────────────────────────────────
   BRAND CARD COMPONENT
   Hover: image zoom + text slide-up reveal
───────────────────────────────────────── */
function BrandCard({ c, delay }: { c:{img:string;n:string;title:string;body:string}; delay:number }) {
  const [h, setH] = useState(false);
  return (
    <div data-aos="fade-up" data-aos-delay={String(Math.round(delay*1000))}
      style={{ background:'#0e0e0e', border:`1px solid ${h ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}`, overflow:'hidden', cursor:'default', transition:'border-color .3s' }}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      <div style={{ aspectRatio:'1', overflow:'hidden', position:'relative' }}>
        <img src={c.img} alt=""
          style={{ width:'100%', height:'100%', objectFit:'cover', opacity: h ? 0.9 : 0.68, transform: h ? 'scale(1.08)' : 'scale(1)', transition:'transform .65s, opacity .35s' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(14,14,14,0.97) 0%,rgba(14,14,14,0.38) 55%,transparent 100%)' }} />
        <span style={{ position:'absolute', top:'10px', right:'12px', fontSize:'10px', fontWeight:900, color:`${RED}90`, letterSpacing:'0.1em' }}>{c.n}</span>
      </div>
      <div style={{ padding:'14px 14px clamp(14px,1.5vw,18px)' }}>
        <p style={{ fontSize:'clamp(12px,1.2vw,14px)', fontWeight:700, color:'#fff', lineHeight:1.4, marginBottom:'6px', whiteSpace:'pre-line' }}>{c.title}</p>
        <p style={{ fontSize:'11px', lineHeight:1.6, color:'rgba(255,255,255,0.5)', maxHeight: h ? '80px' : '0', overflow:'hidden', transition:'max-height .42s ease' }}>
          {c.body}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TIER SECTION COMPONENT  (§7, §8, §9)
   Full-BG image header (clickable accordion)
   Logo + "WELCOME TO CREATR365'S FAMILY"
   Headline แยก 2 ส่วน: ขาว + แดง
   Course cards: ลิ้งค์ไปหน้ารายละเอียดคอร์ส
───────────────────────────────────────── */
type CourseItem = { name:string; sub:string; tag:string; slug:string; detail:string };
type AlsoItem   = { name:string; sub:string; slug:string };

function TierSection({ id, bg, logoSrc, headline, headlineRed, badge, courses, also, open, onToggle }:
  { id:string; bg:string; logoSrc:string; headline:string; headlineRed:string; badge?:string;
    courses:CourseItem[]; also?:AlsoItem[]; open:string|null; onToggle:(id:string)=>void }) {

  const isOpen = open === id;
  const RED = '#CC0033';

  return (
    <section style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'#080808' }}>
      {/* Clickable header = BG image */}
      <button onClick={()=>onToggle(id)}
        style={{ position:'relative', width:'100%', height:'clamp(220px,30vw,380px)', display:'flex', alignItems:'flex-end', cursor:'pointer', border:'none', padding:0, overflow:'hidden', background:'#0a0a0a' }}>
        {/* BG image — hover zoom */}
        <img src={bg} alt=""
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', filter:'brightness(0.62)', transform: isOpen ? 'scale(1.04)' : 'scale(1)', transition:'transform .7s' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(10,10,10,0.93) 0%,rgba(10,10,10,0.42) 52%,transparent 100%)' }} />

        {/* บนซ้าย: Logo + WELCOME */}
        <div style={{ position:'absolute', top:'clamp(12px,2vw,20px)', left:'clamp(16px,3vw,32px)' }}>
          <img src={logoSrc} alt="Creatr365" style={{ height:'18px', width:'auto', filter:'brightness(0) invert(1)', opacity:0.65, display:'block' }} />
          <p style={{ fontSize:'8px', letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,0.38)', marginTop:'3px' }}>WELCOME TO CREATR365'S FAMILY</p>
        </div>

        {/* badge */}
        {badge && (
          <div style={{ position:'absolute', top:'clamp(44px,5vw,60px)', left:'clamp(16px,3vw,32px)' }}>
            <span style={{ fontSize:'10px', fontWeight:900, padding:'3px 8px', border:`1px solid ${RED}`, color:RED, letterSpacing:'0.12em' }}>{badge}</span>
          </div>
        )}

        {/* Headline ล่างซ้าย + chevron ล่างขวา */}
        <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'clamp(12px,2vw,20px) clamp(16px,3vw,32px)' }}>
          <h2 style={{ fontSize:'clamp(3rem,7vw,6.5rem)', fontWeight:900, lineHeight:0.92, textAlign:'left', pointerEvents:'none' }}>
            <span style={{ color:'#fff' }}>{headline}</span>
            <span style={{ color:RED }}>{headlineRed}</span>
          </h2>
          <span style={{ fontSize:'22px', color: isOpen ? RED : 'rgba(255,255,255,0.38)', transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .38s,color .28s', flexShrink:0, marginBottom:'6px', lineHeight:1 }}>
            ▾
          </span>
        </div>
      </button>

      {/* Accordion body */}
      <div style={{ maxHeight: isOpen ? '1000px' : '0', overflow:'hidden', transition:'max-height .52s cubic-bezier(.4,0,.2,1)', opacity: isOpen ? 1 : 0, transitionProperty:'max-height,opacity' }}>
        <div style={{ padding:'clamp(20px,3vw,32px) clamp(16px,3vw,32px) clamp(28px,4vw,40px)', background:'#0c0c0c' }}>

          {/* Course cards */}
          <div style={{ display:'grid', gridTemplateColumns: courses.length===1 ? '1fr' : 'repeat(2,1fr)', gap:'10px', maxWidth: courses.length===1 ? '460px' : '100%' }}>
            {courses.map((c,ci)=>{
              const isCS = c.tag==='COMING SOON';
              const isFree = c.tag==='FREE';
              return (
                <div key={ci}
                  style={{ background:'#141414', border:'1px solid rgba(255,255,255,0.07)', padding:'clamp(16px,2vw,22px)', animation: isOpen ? `slideInRight .4s cubic-bezier(.16,1,.3,1) ${ci*90}ms both` : 'none', transition:'border-color .25s' }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.16)')}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
                  {isCS && <p style={{ fontSize:'10px', fontWeight:900, color:RED, letterSpacing:'0.18em', marginBottom:'8px' }}>★ MASTERCLASS</p>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'8px' }}>
                    <p style={{ fontSize:'clamp(15px,1.8vw,18px)', fontWeight:900, color:'#fff', lineHeight:1.2 }}>{c.name}</p>
                    <span style={{ fontSize:'9px', fontWeight:900, padding:'3px 7px', border:`1px solid ${isFree ? '#34A85350' : 'rgba(255,255,255,0.09)'}`, color: isFree ? '#34A853' : isCS ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.45)', flexShrink:0, letterSpacing:'0.1em', whiteSpace:'nowrap' }}>
                      {c.tag}
                    </span>
                  </div>
                  <p style={{ fontSize:'11px', letterSpacing:'0.14em', color:'rgba(255,255,255,0.38)', marginBottom:'14px', fontStyle:'italic' }}>{c.sub}</p>

                  {/* ลิ้งค์ไปหน้ารายละเอียดคอร์ส — ใช้ /course/:slug */}
                  {!isCS && c.slug ? (
                    <Link to={`/course/${c.slug}`}
                      style={{ fontSize:'11px', fontWeight:700, color: isFree ? '#34A853' : 'rgba(255,255,255,0.42)', textDecoration:'underline', textUnderlineOffset:'3px', letterSpacing:'0.18em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:'5px', transition:'opacity .2s' }}
                      onMouseEnter={e=>(e.currentTarget.style.opacity='0.7')}
                      onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                      {c.detail} →
                    </Link>
                  ) : (
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.22)', letterSpacing:'0.15em' }}>coming soon</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* §9 also includes */}
          {also && (
            <div style={{ marginTop:'22px', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'18px' }}>
              <p style={{ fontSize:'10px', letterSpacing:'0.34em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginBottom:'12px' }}>And</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                {also.map((a,ai)=>(
                  <Link key={ai} to={`/course/${a.slug}`}
                    style={{ background:'#0f0f0f', border:'1px solid rgba(255,255,255,0.06)', padding:'clamp(12px,1.5vw,16px)', textDecoration:'none', display:'block', transition:'border-color .2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.16)')}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.06)')}>
                    <p style={{ fontSize:'13px', fontWeight:700, color:'#fff', marginBottom:'4px' }}>{a.name}</p>
                    <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.32)', fontStyle:'italic', marginBottom:'8px' }}>{a.sub}</p>
                    <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)', letterSpacing:'0.15em' }}>เพิ่มเติม →</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
