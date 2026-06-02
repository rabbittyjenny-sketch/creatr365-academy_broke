export interface Course {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  price: string;
  features: string[];
  color: 'blue' | 'yellow' | 'red' | 'green' | 'black';
}

export const courses: Course[] = [
  {
    id: 'live-commerce-starter-kit',
    tag: 'FREE',
    title: 'LIVE COMMERCE STARTER KIT',
    subtitle: 'รู้จักอาชีพ รู้กฎหมาย รู้มาตรฐานก่อนเริ่ม',
    description: 'เข้าใจภาพรวมอาชีพ Live Commerce รู้กฎหมาย 5 ฉบับ มาตรฐานสากล จรรยาบรรณโฮสต์ และ Pre-Live Checklist ก่อนเริ่มไลฟ์จริง',
    duration: '75–90 นาที (VOD)',
    price: '',
    features: [
      'Live Commerce คืออะไร – ตลาดไทยและโอกาส',
      'โฮสต์ 5 ประเภท + แบบประเมินตัวเอง',
      'กฎหมาย 5 ฉบับที่โฮสต์ต้องรู้ (อย. / PDPA / สคบ.)',
      'จรรยาบรรณโฮสต์มืออาชีพ 6 ข้อ',
      'KPI พื้นฐาน 8 ตัว + Pre-Live Master Checklist',
    ],
    color: 'black',
  },
  {
    id: 'hook-and-hold',
    tag: 'LOW TICKET 1',
    title: 'HOOK & HOLD',
    subtitle: 'หยุดคนดูให้อยู่ใน 3 วินาที',
    description: 'มี Hook ของตัวเอง เปิดไลฟ์แล้วคนไม่เลื่อน พูดหน้ากล้องได้อย่างมั่นใจ Watch Time เพิ่ม >20%',
    duration: '3–4 ชั่วโมง (VOD)',
    price: '',
    features: [
      '30-Second Hook Formula ฉบับสมบูรณ์',
      'Hook 5 ประเภท + Hook Loop',
      'Voice Dynamics – Tone, Pacing, Pause, Whisper',
      'Camera Presence – Eye-line, Champion Stance',
      'CTA & Retention – ดึงคนอยู่ทั้งไลฟ์',
    ],
    color: 'blue',
  },
  {
    id: 'live-sales-system',
    tag: 'LOW TICKET 2',
    title: 'LIVE SALES SYSTEM',
    subtitle: 'อ่าน KPI เป็น ขายได้ระบบ',
    description: 'อ่าน Dashboard เป็น รู้ว่า KPI ตัวไหนบอกอะไร คำนวณ GMV ได้ ส่งรายงานมืออาชีพ',
    duration: '4 ชั่วโมง (VOD)',
    price: '',
    features: [
      'TikTok Live Algorithm 2026 – Live Score + Peak Time',
      'KPI 8 ตัวที่ต้องรู้ – CCV / CVR / AOV / GMV',
      'Product Selection – สินค้าแบบไหนขายดีใน Live',
      'Live Sales Flow – FOMO Ladder + Flash Sale',
      'Post-Live Report + AI Workflow',
    ],
    color: 'green',
  },
  {
    id: 'live-tech-setup',
    tag: 'LOW TICKET 3',
    title: 'LIVE TECH SETUP',
    subtitle: 'ตั้งค่าให้ถูก ไลฟ์ไม่มีสะดุด',
    description: 'ตั้งค่าแสง เสียง OBS และเน็ตสำรองได้ด้วยตัวเอง พร้อมไลฟ์จริง ลดปัญหาหน้างาน 80%',
    duration: '2–3 ชั่วโมง (VOD)',
    price: '',
    features: [
      'แสง Softbox + CRI สำหรับ Live Commerce',
      'ไมโครโฟน + Audio Setup มาตรฐาน',
      'OBS Studio – Scene, Overlay, Graphic',
      'เน็ตสำรอง + Backup Plan ฉุกเฉิน',
      'Pre-Live Tech Checklist ใช้ได้ทันที',
    ],
    color: 'yellow',
  },
  {
    id: 'ai-for-live-commerce',
    tag: 'LOW TICKET 4',
    title: 'AI FOR LIVE COMMERCE',
    subtitle: 'ใช้ AI ก่อน-ระหว่าง-หลังไลฟ์',
    description: 'ใช้ AI ก่อน ระหว่าง หลังไลฟ์ + ระบบเฉพาะของ Creatr365 ลดเวลาเตรียมงาน 80%',
    duration: '2–2.5 ชั่วโมง (VOD)',
    price: '',
    features: [
      'AI เขียนสคริปต์ + Hook ด้วย ChatGPT / Claude',
      'Canva AI + CapCut – ภาพ ป้าย กราฟิก',
      'Flowjin / Framedrop – ตัดคลิปอัตโนมัติ',
      'Script Generator (Creatr365) – สร้างสคริปต์ใน 5 นาที',
      'KPI Translator (Creatr365) – อ่าน Analytics ด้วย AI',
    ],
    color: 'red',
  },
  {
    id: 'live-psychology-conversion',
    tag: 'MID TIER 1',
    title: 'LIVE PSYCHOLOGY & CONVERSION',
    subtitle: 'อ่านใจคนดู เพิ่ม Conversion ไม่ลดราคา',
    description: 'อ่านพฤติกรรมคนดูได้ คุม Energy Live ได้ เพิ่ม Conversion Rate >3% โดยไม่ต้องกดดัน',
    duration: '7 ชั่วโมง (Onsite 1 วัน)',
    price: '',
    features: [
      'S-O-R + PAD Theory – รหัสซ่อนในสมองผู้ซื้อ',
      'Audience State Mapping – 4 สถานะผู้ชม',
      'Emotional Conversion – FOMO / Trust / Urgency / Belonging',
      'Live Energy Control – Dead Chat Recovery',
      'Roleplay + Simulation – สถานการณ์จริง',
    ],
    color: 'blue',
  },
  {
    id: 'host-identity-personal-brand',
    tag: 'MID TIER 2',
    title: 'HOST IDENTITY & PERSONAL BRAND',
    subtitle: 'มีตัวตนชัด แบรนด์อยากจ้าง',
    description: 'มี Persona ชัด มี EPK ใช้ได้จริง รู้เรทตัวเอง แบรนด์ใหญ่อยากจ้างซ้ำ',
    duration: '7 ชั่วโมง (Onsite 1 วัน)',
    price: '',
    features: [
      'Host Archetype 5 ประเภท – Expert / Entertainer / Closer / Educator / Luxury',
      'Signature Presence – Opening Identity + วลีเด็ดติดปาก',
      'Brand Communication – แบรนด์มองอะไรเมื่อจ้างโฮสต์',
      'Creator Reputation System – Professionalism + Crisis Image',
      'EPK Workshop – Media Kit + Rate Card + Host Contract',
    ],
    color: 'red',
  },
  {
    id: 'live-commerce-business-global',
    tag: 'HIGH TIER',
    title: 'LIVE COMMERCE BUSINESS & GLOBAL',
    subtitle: 'ขยายธุรกิจ รุกตลาดโลก',
    description: 'ขยายทีม ขยายตลาดต่างประเทศ คำนวณ P&L เป็น มี Agency Starter Kit พร้อมเปิดธุรกิจ',
    duration: '16 ชั่วโมง (Onsite 2 วัน)',
    price: '',
    features: [
      'P&L Mastery – คำนวณกำไรจริง + Break-even + ROAS',
      'Advanced Analytics – Retention Curve + Golden Minute',
      'Smart Lazy Strategy – ไลฟ์ 3 วัน/สัปดาห์ ยอดไม่ลด',
      'Global Market Intelligence – US / EU / China / ASEAN',
      'Global Pitch + EPK Final – นำเสนอต่อ Expert Panel',
    ],
    color: 'black',
  },
];

export const colorMap = {
  blue: {
    bg: 'bg-google-blue',
    text: 'text-google-blue',
    border: 'border-google-blue',
    bgLight: 'bg-google-blue/10',
    hex: '#4285F4',
  },
  red: {
    bg: 'bg-google-red',
    text: 'text-google-red',
    border: 'border-google-red',
    bgLight: 'bg-google-red/10',
    hex: '#CC0033',
  },
  yellow: {
    bg: 'bg-google-yellow',
    text: 'text-google-yellow',
    border: 'border-google-yellow',
    bgLight: 'bg-google-yellow/10',
    hex: '#FFD700',
  },
  green: {
    bg: 'bg-google-green',
    text: 'text-google-green',
    border: 'border-google-green',
    bgLight: 'bg-google-green/10',
    hex: '#34A853',
  },
  black: {
    bg: 'bg-foreground',
    text: 'text-foreground',
    border: 'border-foreground',
    bgLight: 'bg-foreground/10',
    hex: '#1A1A1A',
  },
};

export const marketStats = [
  {
    value: 'US$5.31T',
    label: 'มูลค่าตลาด E-Commerce โลก ปี 2026 — ทะลุ 5 ล้านล้านครั้งแรกในประวัติศาสตร์',
    source: 'ECDB Global E-Commerce Compass 2026',
    color: 'blue' as const,
  },
  {
    value: '90%',
    label: 'ของ Live Streamer ในตลาดวันนี้ ไลฟ์โดยไม่มีมาตรฐาน — Live Commerce ไทยโตเร็วที่สุดในโลก แต่ยังขาดระบบ',
    source: 'Creatr365 Market Research 2025',
    color: 'red' as const,
  },
  {
    value: '+21.7%',
    label: 'ไทยเติบโตเร็วที่สุดในภูมิภาค — ติด Top 3 ตลาด SEA',
    source: 'Statista SEA Live Commerce 2025',
    color: 'yellow' as const,
  },
  {
    value: '+25%',
    label: 'บริษัทที่ลงทุน Live Streaming อย่างจริงจัง รายงานรายได้เพิ่มสูงสุด 25%',
    source: 'McKinsey Live Commerce Report',
    color: 'green' as const,
  },
];

export const kpiData = [
  { metric: 'Conversion Rate', value: '>3%', note: 'มาตรฐาน Live Commerce', color: 'blue' as const },
  { metric: 'Watch Time', value: '>60 นาที', note: 'ต่อไลฟ์', color: 'red' as const },
  { metric: 'Return Rate', value: '<15%', note: 'มาตรฐานสากล', color: 'yellow' as const },
  { metric: 'Dead Air', value: '<3 วินาที', note: 'Crisis Management', color: 'green' as const },
  { metric: 'Chat Velocity', value: '>5 msg/s', note: 'Peak Engagement', color: 'blue' as const },
  { metric: 'Live Health Score', value: '>80', note: 'คะแนน TikTok', color: 'red' as const },
];

export const targetAudience = [
  {
    title: 'มือใหม่ / เจ้าของร้าน',
    desc: 'ยังไม่เคยไลฟ์ขายของ อยากเริ่มต้นอย่างถูกต้อง รู้กฎหมาย รู้มาตรฐาน ก่อนกดปุ่ม Live ครั้งแรก',
    recommend: 'Live Commerce Starter Kit (ฟรี)',
    color: 'black' as const,
  },
  {
    title: 'โฮสต์ที่ไลฟ์อยู่แล้วแต่ยอดไม่โต',
    desc: 'เปิดไลฟ์แล้วคนดูไหลออก อ่าน KPI ไม่เป็น หรืออยากใช้ AI ช่วยลดภาระงาน',
    recommend: 'Hook & Hold → Live Sales System → AI for Live Commerce',
    color: 'blue' as const,
  },
  {
    title: 'In-house Host / ทีมแบรนด์',
    desc: 'ต้องการเพิ่ม Conversion Rate โดยไม่ลดราคา สร้างตัวตนชัด มี EPK พร้อมส่งแบรนด์ใหญ่',
    recommend: 'Live Psychology → Host Identity',
    color: 'red' as const,
  },
  {
    title: 'เจ้าของแบรนด์ / Agency',
    desc: 'อ่าน P&L เป็น คำนวณ Break-even ได้ พร้อมรุกตลาดสากล US / EU / China / ASEAN',
    recommend: 'Live Commerce Business & Global',
    color: 'green' as const,
  },
];
