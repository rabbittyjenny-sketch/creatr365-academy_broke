// Source: the "rubric_master" workbook — tabs Rubric_Header, Rubric_Criteria,
// Pass_Criteria, Progression_Model, KPI_Reference. These are CREATR365's real
// scoring rubrics for practical/performance assessment. Nothing here is
// invented except RUB-17, which is flagged `custom: true`.
//
// WHAT CHANGED IN THIS VERSION (and why the old "missing descriptions" note
// was wrong):
// The previous file assumed RUB-06..RUB-15 were incomplete because they had
// no 4/3/2/1 descriptive anchors. Re-reading Rubric_Header shows why: for
// those rubrics `Max_Score === Total_Dimensions`, i.e. they were never 1–4
// scales at all — they are **binary checklists**, one point per item, scored
// pass/fail per line. So the anchors are not missing; they do not apply.
//
// Rubrics therefore now carry an explicit `kind`:
//   'scale'     — each dimension scored 1–4 with descriptive anchors
//   'checklist' — each item scored 0 or 1 (met / not met)
// and `maxPerDimension` (4 or 1) so the scoring UI can render the right
// control instead of always showing a 0–4 number box.

export interface RubricDimension {
  name: string;
  /** Present on 'scale' rubrics: the 4/3/2/1 behavioural anchors. */
  levels?: { 4: string; 3: string; 2: string; 1: string };
  /** Present on some 'checklist' items: what "met" concretely means. */
  criterion?: string;
  /** Per-dimension floor from Rubric_Criteria.Pass_Threshold, when set. */
  minToPass?: number;
}

export type RubricKind = 'scale' | 'checklist';

export interface Rubric {
  name: string;
  usedInCourse: string;
  sessionRef: string;
  kind: RubricKind;
  /** 4 for 'scale', 1 for 'checklist'. Drives the input control's max. */
  maxPerDimension: number;
  maxScore: number;
  passScore: number;
  passRule: string;
  dimensions: RubricDimension[];
  /** Extra non-rubric gates that must also pass (KPI thresholds etc). */
  additionalGates?: string[];
  /** True for rubrics authored by us, not sourced from rubric_master. */
  custom?: boolean;
  /** Set when the rubric belongs to a retired curriculum. */
  legacy?: boolean;
}

const SCALE = { kind: 'scale' as const, maxPerDimension: 4 };
const CHECK = { kind: 'checklist' as const, maxPerDimension: 1 };

export const RUBRICS: Record<string, Rubric> = {
  'RUB-01': {
    ...SCALE,
    name: 'Hook Video Submission',
    usedInCourse: 'SIGNAL / ทุกคอร์สที่มี Practical',
    sessionRef: 'S01 Post / Post-Test Practical',
    maxScore: 16,
    passScore: 12,
    passRule: '≥12/16 และไม่มีมิติใดได้ 1 คะแนน',
    dimensions: [
      {
        name: 'Hook (Grabber)',
        minToPass: 3,
        levels: {
          4: 'หยุดนิ้วทันที มีตัวเลขหรือ Curiosity ชัดเจน',
          3: 'น่าสนใจแต่ยังไม่คมชัด',
          2: 'พยายามแต่ยังทั่วไป',
          1: "เริ่มด้วย 'สวัสดี' หรือแนะนำตัว",
        },
      },
      {
        name: 'Value Preview',
        minToPass: 2,
        levels: {
          4: 'ประโยชน์ชัดเจน โดนใจ ฟังแล้วอยากดูต่อ',
          3: 'บอกประโยชน์ได้ แต่ยังกว้าง',
          2: 'แค่บอกคุณสมบัติสินค้า ไม่ใช่ประโยชน์',
          1: 'ไม่มี Value Preview',
        },
      },
      {
        name: 'Call to Stay',
        minToPass: 2,
        levels: {
          4: 'มี Urgency หรือ Offer แถมชัดเจน มีเงื่อนไข',
          3: 'มี CTA แต่ไม่มีความเร่งด่วน',
          2: 'บอกให้อยู่ต่อลอยๆ ไม่มีเหตุผล',
          1: 'ไม่มี CTA',
        },
      },
      {
        name: 'Delivery (Eye-line + Voice)',
        minToPass: 2,
        levels: {
          4: 'มองเลนส์ตลอด มีจังหวะเสียง Pause ชัดเจน',
          3: 'มองกล้องเป็นส่วนใหญ่ เสียงมีจังหวะบ้าง',
          2: 'มองจอมือถือบ่อย เสียงราบเรียบ',
          1: 'มองพื้น/โน้ต เสียงอึดอัด โทนเดียว',
        },
      },
    ],
  },

  'RUB-02': {
    ...SCALE,
    name: 'Vocal Engine Lab',
    usedInCourse: 'STAGE',
    sessionRef: 'ST1 Vocal Check',
    maxScore: 20,
    passScore: 14,
    passRule: '≥14/20 และไม่มีมิติใดได้ 1 คะแนน',
    dimensions: [
      {
        name: 'Diaphragmatic Breathing',
        minToPass: 2,
        levels: {
          4: 'เห็นหน้าท้องขยายชัด เสียงก้อง ควบคุมลมหายใจได้',
          3: 'หายใจถูกแต่ไม่สม่ำเสมอ',
          2: 'หายใจตื้นเป็นบางครั้ง',
          1: 'หายใจผิด ใช้แค่ปอดส่วนบน',
        },
      },
      {
        name: 'Tone Weight',
        minToPass: 2,
        levels: {
          4: 'น้ำหนักเสียงเปลี่ยนตามเนื้อหา เน้นคำสำคัญได้',
          3: 'มีน้ำหนักบ้าง แต่แบนบางจังหวะ',
          2: 'เสียงเรียบตลอด ไม่มีการเน้น',
          1: 'เสียงเบามาก หรือแข็งทื่อตลอด',
        },
      },
      {
        name: 'Pacing',
        minToPass: 2,
        levels: {
          4: 'ช้า-เร็วถูกจังหวะ เน้นจุดสำคัญ หยุดได้ถูกที่',
          3: 'ค่อนข้างสม่ำเสมอ เปลี่ยนจังหวะบ้าง',
          2: 'เร็วเกินไปหรือช้าเกิน ขาด Dynamics',
          1: 'พูดเดิมๆ ตลอด ไม่มีจังหวะ',
        },
      },
      {
        name: 'Strategic Pause',
        minToPass: 2,
        levels: {
          4: 'หยุดก่อนข้อมูลสำคัญทุกครั้ง เป็นธรรมชาติ',
          3: 'หยุดบ้างแต่ไม่สม่ำเสมอ',
          2: 'หยุดแบบสุ่ม ไม่สัมพันธ์กับเนื้อหา',
          1: 'ไม่มี Pause เลย หรือ Dead Air >3 วินาที',
        },
      },
      {
        name: 'Whisper Trick',
        minToPass: 2,
        levels: {
          4: 'ใช้ถูกเวลา ดึงความสนใจได้ เป็นธรรมชาติ',
          3: 'ใช้ได้แต่ Timing ยังไม่เป๊ะ',
          2: 'พยายามใช้แต่ไม่เป็นธรรมชาติ',
          1: 'ไม่ใช้ หรือใช้ผิดสถานการณ์',
        },
      },
    ],
  },

  'RUB-03': {
    ...SCALE,
    name: 'Test Live Performance',
    usedInCourse: 'STAGE',
    sessionRef: 'ST6 Test Live',
    maxScore: 16,
    passScore: 12,
    passRule: '≥12/16 + KPI ผ่านทั้ง 2 ตัว (Watch Time ≥40% และ Hook Rate ≥30%)',
    additionalGates: ['Watch Time ≥40% (ผู้ชมอยู่ดู >60 วินาที)', 'Hook Rate ≥30%'],
    dimensions: [
      {
        name: 'Hook & Grabber',
        minToPass: 3,
        levels: {
          4: 'หยุดนิ้วทันที มีตัวเลข/Curiosity ชัด',
          3: 'น่าสนใจแต่ไม่คม',
          2: 'พยายามแต่ยังทั่วไป',
          1: "เริ่มด้วย 'สวัสดี'",
        },
      },
      {
        name: 'Voice Dynamics',
        minToPass: 2,
        levels: {
          4: 'Pause ชัด Whisper ได้ จังหวะหลากหลาย',
          3: 'มีจังหวะบ้างแต่แบน',
          2: 'ราบเรียบขาดพลัง',
          1: 'โทนเดียว/พูดเร็วเกิน',
        },
      },
      {
        name: 'Eye-line',
        minToPass: 2,
        levels: {
          4: 'มองเลนส์ตลอด ≥80% สบตาผู้ชมได้',
          3: 'มองกล้องเป็นหลัก หลุดบ้าง',
          2: 'มองจอตัวเองบ่อย',
          1: 'มองโน้ต/พื้น/มือถือบ่อย',
        },
      },
      {
        name: 'Engagement',
        minToPass: 2,
        levels: {
          4: 'ตอบแชท+สร้าง FOMO ได้ไหลลื่น',
          3: 'ตอบแชทบ้าง',
          2: 'ตอบช้า ขาด Hype',
          1: 'ไม่ตอบหรือตอบไม่ตรงประเด็น',
        },
      },
    ],
  },

  'RUB-04': {
    ...SCALE,
    legacy: true,
    name: 'Global Pitch',
    usedInCourse: 'FRONTIER (หลักสูตรเดิม)',
    sessionRef: 'F7 Global Pitch Simulation',
    maxScore: 16,
    passScore: 12,
    passRule: '≥12/16',
    dimensions: [
      {
        name: 'Hook & Attention',
        minToPass: 3,
        levels: {
          4: 'หยุดนิ้วผู้ชมต่างชาติได้ทันที',
          3: 'น่าสนใจแต่ไม่แข็งแกร่ง',
          2: 'Hook ยังทั่วไป',
          1: 'ไม่มี Hook เริ่มด้วยแนะนำตัว',
        },
      },
      {
        name: 'Value Proposition',
        minToPass: 2,
        levels: {
          4: 'ประโยชน์ชัดเจน โดนใจกลุ่มเป้าหมายต่างชาติ',
          3: 'บอกประโยชน์ได้ แต่ยังกว้าง',
          2: 'คลุมเครือ ผู้ฟังต้องคาดเดา',
          1: 'ไม่มี Value Proposition',
        },
      },
      {
        name: 'Language & Clarity',
        minToPass: 2,
        levels: {
          4: 'ภาษาอังกฤษถูกต้อง ชัดเจน ฟังรู้เรื่อง 100%',
          3: 'มีผิดเล็กน้อย แต่เข้าใจได้',
          2: 'พอเข้าใจ มีสะดุดบ้าง',
          1: 'สื่อสารไม่รู้เรื่อง',
        },
      },
      {
        name: 'Call to Action',
        minToPass: 2,
        levels: {
          4: 'CTA ชัดเจน มี Urgency/Benefit',
          3: 'มี CTA แต่ขาด Urgency',
          2: 'CTA ไม่ชัด',
          1: 'ไม่มี CTA',
        },
      },
    ],
  },

  'RUB-05': {
    ...SCALE,
    name: 'Hook Factory Speak',
    usedInCourse: 'STAGE',
    sessionRef: 'ST3 Hook Factory (พูดหน้ากล้อง)',
    maxScore: 12,
    passScore: 9,
    passRule: '≥9/12',
    dimensions: [
      {
        name: 'ความมั่นใจ',
        minToPass: 2,
        levels: {
          4: 'สบตากล้อง เสียงหนักแน่น ไม่มีลังเล',
          3: 'ค่อนข้างมั่นคง ลังเลเล็กน้อย',
          2: 'ลังเลบ้าง เสียงสั่น',
          1: 'ไม่มั่นใจชัดเจน ก้มหน้า',
        },
      },
      {
        name: 'ความชัดเจนของ Hook',
        minToPass: 2,
        levels: {
          4: 'หยุดนิ้วผู้ชมได้ทันที Hook คมชัด',
          3: 'น่าสนใจแต่ยังไม่คม',
          2: 'พยายามแต่ยังทั่วไป',
          1: 'ไม่มี Hook เลย',
        },
      },
      {
        name: 'จังหวะและอารมณ์',
        minToPass: 2,
        levels: {
          4: 'มี Dynamics ชัด ช้า-เร็ว-หยุดถูกที่',
          3: 'มีจังหวะบ้าง',
          2: 'ราบเรียบ ขาดอารมณ์',
          1: 'โทนเดียวตลอด',
        },
      },
    ],
  },

  'RUB-06': {
    ...CHECK,
    name: 'FOMO Script Checklist',
    usedInCourse: 'SIGNAL',
    sessionRef: 'S01 Post',
    maxScore: 4,
    passScore: 4,
    passRule: 'ผ่านครบทั้ง 4 ขั้น (Pass/Fail รายขั้น)',
    dimensions: [
      { name: 'ขั้น 1 — Price Anchor', criterion: 'แสดงราคาเต็มก่อนบอกราคาลด ให้ผู้ชมเห็นส่วนต่างชัดเจน' },
      { name: 'ขั้น 2 — Urgency',      criterion: 'มีกรอบเวลาจริงที่ตรวจสอบได้ ไม่ใช้ Countdown เท็จ' },
      { name: 'ขั้น 3 — Scarcity',     criterion: 'ระบุจำนวนคงเหลือตามสต็อกจริง' },
      { name: 'ขั้น 4 — Social Proof', criterion: 'อ้างหลักฐานที่มีอยู่จริง เช่น ยอดสั่งซื้อในไลฟ์หรือรีวิว' },
    ],
  },

  'RUB-07': {
    ...CHECK,
    name: 'Hook Submission',
    usedInCourse: 'FOUNDATION',
    sessionRef: 'Hook Submission Assignment',
    maxScore: 3,
    passScore: 3,
    passRule: 'ผ่านครบทั้ง 3 องค์ประกอบ (Pass/Fail)',
    dimensions: [
      { name: 'Grabber',       criterion: 'ประโยคเปิดหยุดความสนใจได้ ไม่เริ่มด้วยการทักทายหรือแนะนำตัว' },
      { name: 'Value Preview', criterion: 'บอกประโยชน์ที่ผู้ชมจะได้ ไม่ใช่แค่คุณสมบัติสินค้า' },
      { name: 'Call to Stay',  criterion: 'มีเหตุผลที่ชัดเจนว่าทำไมต้องอยู่ดูต่อ' },
    ],
  },

  'RUB-08': {
    ...CHECK,
    name: 'Camera Presence Checklist',
    usedInCourse: 'STAGE',
    sessionRef: 'ST2 Camera Presence',
    maxScore: 6,
    passScore: 5,
    passRule: 'Pass ≥5/6',
    dimensions: [
      { name: 'Eye-line',            criterion: 'มองเลนส์เป็นหลัก ไม่หลุดไปมองจอ' },
      { name: 'ไม่ก้มมือถือ',        criterion: 'ไม่ก้มอ่านหน้าจอระหว่างพูด' },
      { name: 'Champion Stance',     criterion: 'ยืนตรง ไหล่ผาย มือผ่อนคลาย' },
      { name: 'ใช้มือธรรมชาติ',      criterion: 'มือประกอบการพูดอย่างเป็นธรรมชาติ ไม่เกร็งหรือกอดอก' },
      { name: 'โน้มตัวเข้าหากล้อง',  criterion: 'ใช้ระยะโน้มตัวตามกฎ 15-5-3 ในช่วงสำคัญ' },
      { name: 'ยิ้ม + สบตา',         criterion: 'สีหน้าเปิดรับ สบตาผู้ชมผ่านเลนส์' },
    ],
  },

  'RUB-09': {
    ...CHECK,
    name: 'Crisis Improv Roleplay',
    usedInCourse: 'STAGE',
    sessionRef: 'ST5 Crisis Improv Lab',
    maxScore: 4,
    passScore: 3,
    passRule: 'Pass ≥3/4 ต่อ 1 สถานการณ์ — ต้องผ่านทั้ง 2 สถานการณ์',
    additionalGates: ['ต้องผ่านครบทั้ง 2 สถานการณ์ที่ Trainer ตั้งให้'],
    dimensions: [
      { name: 'Dead Air < 3 วินาที',       criterion: 'ไม่มีช่วงเงียบต่อเนื่องเกิน 3 วินาที' },
      { name: 'Recovery < 10 วินาที',      criterion: 'กลับเข้าสู่เนื้อหาเดิมได้ภายใน 10 วินาที' },
      { name: 'ไม่ตื่นตระหนก',             criterion: 'น้ำเสียงและสีหน้าคงที่ ไม่แสดงอาการลน' },
      { name: 'ประโยคแก้ไขเชิงบวก',       criterion: 'ใช้เทคนิค Yes-And ไม่ปฏิเสธหรือโต้กลับผู้ชม' },
    ],
  },

  'RUB-10': {
    ...CHECK,
    name: 'Self-Assessment (Option B)',
    usedInCourse: 'STAGE',
    sessionRef: 'ST6 (ทางเลือกแทน Peer Review)',
    maxScore: 5,
    passScore: 4,
    passRule: 'Pass ≥4/5',
    dimensions: [
      { name: 'ให้คะแนน 4 มิติครบ',   criterion: 'ประเมินตนเองครบทุกมิติของ RUB-03' },
      { name: 'มีเหตุผลกำกับ',        criterion: 'อธิบายว่าทำไมจึงให้คะแนนนั้น' },
      { name: 'จุดแข็ง + หลักฐาน',    criterion: 'ระบุจุดแข็งพร้อมอ้างช่วงเวลาในคลิปจริง' },
      { name: 'จุดพัฒนา + แนวทาง',    criterion: 'ระบุจุดที่ต้องพัฒนาพร้อมวิธีแก้ที่ทำได้จริง' },
      { name: 'Action Plan 7 วัน',    criterion: 'มีแผนปฏิบัติภายใน 7 วันที่วัดผลได้' },
    ],
  },

  'RUB-11': {
    ...CHECK,
    name: 'EPK Draft',
    usedInCourse: 'BRAND HOST ARCHITECT',
    sessionRef: 'BH2 Brand CI / EPK Draft',
    maxScore: 10,
    passScore: 8,
    passRule: '≥8/10 (Checklist Pass/Fail)',
    dimensions: [
      { name: 'ชื่อ + ตำแหน่ง' },
      { name: 'รูปโปรไฟล์คุณภาพใช้งานได้' },
      { name: 'Bio' },
      { name: 'Soul (บุคลิกหลัก)' },
      { name: 'KPI ที่ทำได้จริง' },
      { name: 'คลิปตัวอย่าง 3 ชิ้น' },
      { name: 'Testimonial' },
      { name: 'ช่องทางติดต่อ' },
      { name: 'โครงสร้างราคา' },
      { name: 'Layout อ่านง่าย เป็นระเบียบ' },
    ],
  },

  'RUB-12': {
    ...CHECK,
    legacy: true,
    name: 'EPK Final (BLUEPRINT)',
    usedInCourse: 'BLUEPRINT (หลักสูตรเดิม)',
    sessionRef: 'B7 EPK Final',
    maxScore: 10,
    passScore: 9,
    passRule: '≥9/10 — เงื่อนไขเดียวกับ RUB-11 แต่ต้องปรับตาม Feedback แล้ว',
    dimensions: [
      { name: 'ชื่อ + ตำแหน่ง' },
      { name: 'รูปโปรไฟล์คุณภาพใช้งานได้' },
      { name: 'Bio' },
      { name: 'Soul (บุคลิกหลัก)' },
      { name: 'KPI ที่ทำได้จริง' },
      { name: 'คลิปตัวอย่าง 3 ชิ้น' },
      { name: 'Testimonial' },
      { name: 'ช่องทางติดต่อ' },
      { name: 'โครงสร้างราคา' },
      { name: 'ปรับแก้ตาม Feedback รอบ Draft ครบ' },
    ],
  },

  'RUB-13': {
    ...CHECK,
    legacy: true,
    name: 'EPK Final (สากล)',
    usedInCourse: 'FRONTIER (หลักสูตรเดิม)',
    sessionRef: 'F7 EPK สากล',
    maxScore: 12,
    passScore: 10,
    passRule: '≥10/12 (Checklist Pass/Fail)',
    dimensions: [
      { name: 'ชื่อ + ตำแหน่ง' },
      { name: 'Bio ภาษาอังกฤษ' },
      { name: 'Soul + Specialty' },
      { name: 'KPI ภาษาอังกฤษ' },
      { name: 'คลิป + ซับภาษาอังกฤษ' },
      { name: 'ผลงานที่ผ่านมา' },
      { name: 'ระบุตลาดที่พร้อมรับงาน' },
      { name: 'ราคาเป็นสกุล USD' },
      { name: 'ช่องทางติดต่อสากล' },
      { name: 'Mobile-friendly' },
      { name: 'คุณภาพรูปภาพดี' },
      { name: 'ไม่มีข้อผิดพลาดด้านภาษา' },
    ],
  },

  'RUB-14': {
    ...CHECK,
    name: 'Team Production Simulation',
    usedInCourse: 'BRAND HOST ARCHITECT',
    sessionRef: 'BH6 Team Production System',
    maxScore: 6,
    passScore: 5,
    passRule: 'Pass ≥5/6 — Dead Air ต้อง <3 วินาที',
    dimensions: [
      { name: 'Host ไม่มอง Producer',      criterion: 'ผู้ชมไม่รู้ว่ามีการประสานงานหลังกล้อง' },
      { name: 'Producer สลับฉากทัน',       criterion: 'เปลี่ยนมุมกล้อง/ฉากได้ตรงจังหวะ' },
      { name: 'Chat Mod ตอบ <30 วินาที',   criterion: 'ตอบคอมเมนต์สำคัญภายใน 30 วินาที' },
      { name: 'Inventory แจ้งทัน',         criterion: 'แจ้งสถานะสต็อกก่อนสินค้าหมด' },
      { name: 'Dead Air < 3 วินาที',       criterion: 'ไม่มีช่วงเงียบเกิน 3 วินาทีตลอดรอบจำลอง' },
      { name: 'ไม่มีเสียงรบกวนจากทีม',    criterion: 'ไม่มีเสียงทีมงานหลุดเข้าไมค์' },
    ],
  },

  'RUB-15': {
    ...CHECK,
    legacy: true,
    name: 'Panel Review (BLUEPRINT)',
    usedInCourse: 'BLUEPRINT (หลักสูตรเดิม)',
    sessionRef: 'Final Panel',
    maxScore: 4,
    passScore: 3,
    passRule: 'Pass ≥3/4',
    dimensions: [
      { name: 'นำเสนอชัดเจน' },
      { name: 'Soul + CI สอดคล้องกัน' },
      { name: 'EPK ครบถ้วน' },
      { name: 'แผน 30 วันเป็นไปได้จริง' },
    ],
  },

  'RUB-16': {
    ...CHECK,
    legacy: true,
    name: 'Panel Review (FRONTIER)',
    usedInCourse: 'FRONTIER (หลักสูตรเดิม)',
    sessionRef: 'Final Panel',
    maxScore: 4,
    passScore: 3,
    passRule: 'Pass ≥3/4 — Feasibility ต้องได้ ≥4/5 จากคณะกรรมการ',
    additionalGates: ['Feasibility ≥4/5'],
    dimensions: [
      { name: 'Feasibility',                 criterion: 'แผนเป็นไปได้จริง มีข้อมูลสนับสนุน (ต้องได้ ≥4/5)' },
      { name: 'ตัวเลข P&L สมเหตุสมผล',      criterion: 'คำนวณถูกต้อง ≥80% และ Margin สมจริง' },
      { name: 'เข้าใจตลาดต่างประเทศ',       criterion: 'ระบุ VAT / กฎหมาย / พฤติกรรมผู้บริโภคได้ถูกต้อง' },
      { name: 'นำเสนอชัดเจน มั่นใจ',        criterion: 'พูดไหลลื่น ตอบคำถามคณะกรรมการได้' },
    ],
  },

  'RUB-17': {
    ...SCALE,
    custom: true,
    name: 'Scaling Readiness Scorecard & P&L Worksheet',
    usedInCourse: 'BRAND HOST ARCHITECT',
    sessionRef: 'BH7 P&L Mastery / BH8 Scaling Strategy',
    maxScore: 16,
    passScore: 12,
    passRule: '≥12/16 และไม่มีมิติใดได้ 1 คะแนน',
    dimensions: [
      {
        name: 'ความถูกต้องของตัวเลข P&L',
        minToPass: 3,
        levels: {
          4: 'คำนวณถูกทุกบรรทัด รวมต้นทุนแฝงและค่าธรรมเนียมแพลตฟอร์มครบ',
          3: 'ถูกเป็นส่วนใหญ่ มีผิดเล็กน้อยที่ไม่กระทบข้อสรุป',
          2: 'มีผิดหลายจุด ทำให้ Margin คลาดเคลื่อน',
          1: 'ผิดเกือบทั้งหมด หรือไม่ได้กรอกตัวเลข',
        },
      },
      {
        name: 'การระบุต้นทุนแฝง',
        minToPass: 2,
        levels: {
          4: 'ระบุต้นทุนแฝงครบ (ค่าคืนของ ค่าธรรมเนียมชำระเงิน ค่าแรงทีม ค่าตัวอย่างสินค้า)',
          3: 'ระบุได้เกือบครบ ขาด 1 รายการ',
          2: 'ระบุได้เฉพาะต้นทุนตรง',
          1: 'ไม่ได้ระบุต้นทุนแฝงเลย',
        },
      },
      {
        name: 'จุดคุ้มทุนและเป้าหมาย',
        minToPass: 2,
        levels: {
          4: 'คำนวณ Break-even GMV ได้ และตั้งเป้ารายเดือนที่สอดคล้องกับกำลังทีม',
          3: 'คำนวณจุดคุ้มทุนได้ แต่เป้าหมายยังไม่สมจริง',
          2: 'พยายามคำนวณแต่สูตรผิด',
          1: 'ไม่มีการคำนวณจุดคุ้มทุน',
        },
      },
      {
        name: 'ความพร้อมในการขยายสเกล',
        minToPass: 2,
        levels: {
          4: 'ระบุคอขวดของระบบชัดเจน พร้อมลำดับการแก้ที่ทำได้ใน 90 วัน',
          3: 'ระบุคอขวดได้ แต่แผนแก้ยังกว้าง',
          2: 'ระบุปัญหาได้แต่ไม่มีแผน',
          1: 'ไม่ได้วิเคราะห์ความพร้อม',
        },
      },
    ],
  },
};

/**
 * Module code -> recommended rubric, used to preselect the right rubric on
 * the onsite scoring screen. Source: rubric_master Pass_Criteria tab.
 * ST4 now maps to RUB-05 (Hook Factory Speak): Narrative Performance is
 * graded on the same three observable behaviours — confidence, clarity of
 * the narrative hook, and pacing/emotion — so reusing RUB-05 keeps scores
 * comparable across cohorts instead of leaving trainers to pick freely.
 */
export const MODULE_RUBRIC_HINTS: Record<string, string> = {
  ST1: 'RUB-02',
  ST2: 'RUB-08',
  ST3: 'RUB-05',
  ST4: 'RUB-05',
  ST5: 'RUB-09',
  ST6: 'RUB-03',
  BH2: 'RUB-11',
  BH6: 'RUB-14',
  BH7: 'RUB-17',
  BH8: 'RUB-17',
  F07: 'RUB-07',
  S06: 'RUB-01',
};

/** Rubrics safe to offer in the current curriculum (hides retired ones). */
export const ACTIVE_RUBRIC_IDS = Object.entries(RUBRICS)
  .filter(([, r]) => !r.legacy)
  .map(([id]) => id);
