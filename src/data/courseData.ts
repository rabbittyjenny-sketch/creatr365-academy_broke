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
    id: 'masterclass-1',
    tag: 'SIGNATURE',
    title: 'MASTERCLASS I',
    subtitle: 'Psychology × Sales Mastery',
    description: 'เรียนรู้ S-O-R Framework, PAD Theory, FOMO Ladder +247% และ Vocal Dynamics เพื่อเพิ่ม Conversion Rate +150-400%',
    duration: '2 วัน (16 ชม.)',
    price: '25,000 - 45,000 ฿',
    features: ['S-O-R Framework', 'PAD Theory', 'FOMO Ladder +247%', 'Vocal Dynamics'],
    color: 'blue',
  },
  {
    id: 'masterclass-2',
    tag: 'SIGNATURE',
    title: 'MASTERCLASS II',
    subtitle: 'Business × Global Expansion',
    description: 'เจาะลึก Platform Algorithm, Analytics Mastery, P&L Calculation และ Global Strategy สำหรับการขยายธุรกิจระดับโลก',
    duration: '2 วัน (16 ชม.)',
    price: '25,000 - 45,000 ฿',
    features: ['Platform Algorithm', 'Analytics Mastery', 'P&L Calculation', 'Global Strategy'],
    color: 'red',
  },
  {
    id: 'combo-pass',
    tag: 'COMBO',
    title: 'COMBO PASS',
    subtitle: 'Masterclass I + II',
    description: 'ครบทุกทักษะ ส่วนลด 15-20% พร้อม Priority Support และ Certification',
    duration: '4 วัน (32 ชม.)',
    price: '40,000 - 75,000 ฿',
    features: ['ครบทุกทักษะ', 'ส่วนลด 15-20%', 'Priority Support', 'Certification'],
    color: 'green',
  },
  {
    id: 'short-course-a',
    tag: 'SHORT COURSE',
    title: 'SHORT COURSE A',
    subtitle: 'Hook, Voice & Camera Presence',
    description: 'ฝึก 30-Second Hook, Vocal Training และ Camera Framing เพื่อเริ่มต้นอย่างมืออาชีพ',
    duration: '1 วัน (6 ชม.)',
    price: '3,900 - 6,900 ฿',
    features: ['30-Second Hook', 'Vocal Training', 'Camera Framing'],
    color: 'yellow',
  },
  {
    id: 'short-course-b',
    tag: 'SHORT COURSE',
    title: 'SHORT COURSE B',
    subtitle: 'Platform Mastery & Analytics',
    description: 'เรียนรู้ TikTok Algorithm, KPI Dashboard และ AI Tools เพื่อเป็นโฮสต์ที่ขับเคลื่อนด้วยข้อมูล',
    duration: '1 วัน (6 ชม.)',
    price: '3,900 - 6,900 ฿',
    features: ['TikTok Algorithm', 'KPI Dashboard', 'AI Tools'],
    color: 'blue',
  },
  {
    id: 'micro-express',
    tag: 'MICRO',
    title: 'MICRO EXPRESS',
    subtitle: '30-Second Hook Formula',
    description: 'คอร์สออนไลน์ 3 ชั่วโมง เรียนรู้สูตร Hook ที่ดึงคนดูให้อยู่ภายใน 30 วินาที',
    duration: '3 ชั่วโมง (ออนไลน์)',
    price: '1,500 - 1,900 ฿',
    features: ['30-Second Hook Formula', 'Lead Magnet', 'ออนไลน์'],
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
    hex: '#EA4335',
  },
  yellow: {
    bg: 'bg-google-yellow',
    text: 'text-google-yellow',
    border: 'border-google-yellow',
    bgLight: 'bg-google-yellow/10',
    hex: '#FBBC04',
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
  { value: '66.6%', label: 'คนไทยช้อปออนไลน์รายสัปดาห์', source: 'Research and Markets, 2026', color: 'blue' as const },
  { value: '$15.2B', label: 'Social Commerce ไทย 2026', source: 'เติบโต 9.6% YoY', color: 'red' as const },
  { value: '$4.6B', label: 'TikTok Shop Thailand GMV', source: 'เติบโต 92% YoY', color: 'yellow' as const },
  { value: '15,000+', label: 'โฮสต์มือโปรที่ตลาดต้องการ', source: 'JobsDB Thailand, 2026', color: 'green' as const },
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
    title: 'โฮสต์ที่ไลฟ์อยู่แล้ว',
    desc: 'ไลฟ์มา 6-12 เดือน แต่ยอดขายไม่โต อยากพัฒนาทักษะให้เป็นระบบ',
    recommend: 'Masterclass I',
    color: 'blue' as const,
  },
  {
    title: 'เจ้าของแบรนด์',
    desc: 'ต้องการสร้างทีม In-house Live ลดต้นทุนจ้างเอเจนซี่ ควบคุม Brand Identity',
    recommend: 'Masterclass II',
    color: 'red' as const,
  },
  {
    title: 'ผู้ต้องการเปิดธุรกิจ',
    desc: 'Live Commerce Business หรือ Agency เข้าใจโครงสร้างต้นทุน รุกตลาด Cross-border',
    recommend: 'Combo Pass',
    color: 'green' as const,
  },
  {
    title: 'มือใหม่สนใจอาชีพ',
    desc: 'อยากเริ่มต้นเป็น Live Host เรียนรู้พื้นฐานที่ถูกต้อง สร้าง Portfolio ตั้งแต่เริ่ม',
    recommend: 'Micro Express → Short Course',
    color: 'yellow' as const,
  },
];
