// Source: the "rubric_master" Google Sheet (Rubric_Header + Rubric_Criteria
// tabs) — CREATR365's real scoring rubrics for practical/performance
// assessments (Templates B/C/D in skill_AI.md), not invented here.
//
// IMPORTANT: as of the sheet's last edit, only RUB-01, 02, 03, 04, 05 and 16
// have full 4-level descriptive criteria filled in per dimension
// (`levels`). The other rubrics (RUB-06–15) only have dimension *names*
// (from the Header tab's Notes column) — the sheet itself has no
// level-by-level descriptive text for them yet. Do not invent that text:
// `levels` is left undefined for those, and the UI must fall back to a
// plain per-dimension numeric score instead of showing fabricated anchors.
export interface RubricDimension {
  name: string;
  levels?: { 4: string; 3: string; 2: string; 1: string };
}

export interface Rubric {
  name: string;
  usedInCourse: string;
  sessionRef: string;
  maxScore: number;
  passScore: number;
  passRule: string;
  dimensions: RubricDimension[];
}

export const RUBRICS: Record<string, Rubric> = {
  "RUB-01": {
    name: "Hook Video Submission",
    usedInCourse: "SIGNAL / ทุกคอร์สที่มี Practical",
    sessionRef: "S01 Post / Post-Test Practical",
    maxScore: 16, passScore: 12, passRule: "≥12/16 และไม่มีมิติใดได้ 1 คะแนน",
    dimensions: [
      { name: "Hook (Grabber)", levels: { 4: "หยุดนิ้วทันที มีตัวเลขหรือ Curiosity ชัดเจน", 3: "น่าสนใจแต่ยังไม่คมชัด", 2: "พยายามแต่ยังทั่วไป", 1: "เริ่มด้วย 'สวัสดี' หรือแนะนำตัว" } },
      { name: "Value Preview", levels: { 4: "ประโยชน์ชัดเจน โดนใจ ฟังแล้วอยากดูต่อ", 3: "บอกประโยชน์ได้ แต่ยังกว้าง", 2: "แค่บอกคุณสมบัติสินค้า ไม่ใช่ประโยชน์", 1: "ไม่มี Value Preview" } },
      { name: "Call to Stay", levels: { 4: "มี Urgency หรือ Offer แถมชัดเจน มีเงื่อนไข", 3: "มี CTA แต่ไม่มีความเร่งด่วน", 2: "บอกให้อยู่ต่อลอยๆ ไม่มีเหตุผล", 1: "ไม่มี CTA" } },
      { name: "Delivery (Eye-line + Voice)", levels: { 4: "มองเลนส์ตลอด มีจังหวะเสียง Pause ชัดเจน", 3: "มองกล้องเป็นส่วนใหญ่ เสียงมีจังหวะบ้าง", 2: "มองจอมือถือบ่อย เสียงราบเรียบ", 1: "มองพื้น/โน้ต เสียงอึดอัด โทนเดียว" } },
    ],
  },
  "RUB-02": {
    name: "Vocal Engine Lab",
    usedInCourse: "STAGE",
    sessionRef: "S01 Vocal Check",
    maxScore: 20, passScore: 14, passRule: "≥14/20 และไม่มีมิติใดได้ 1 คะแนน",
    dimensions: [
      { name: "Diaphragmatic Breathing", levels: { 4: "เห็นหน้าท้องขยายชัด เสียงก้อง ควบคุมลมหายใจได้", 3: "หายใจถูกแต่ไม่สม่ำเสมอ", 2: "หายใจตื้นเป็นบางครั้ง", 1: "หายใจผิด ใช้แค่ปอดส่วนบน" } },
      { name: "Tone Weight", levels: { 4: "น้ำหนักเสียงเปลี่ยนตามเนื้อหา เน้นคำสำคัญได้", 3: "มีน้ำหนักบ้าง แต่แบนบางจังหวะ", 2: "เสียงเรียบตลอด ไม่มีการเน้น", 1: "เสียงเบามาก หรือแข็งทื่อตลอด" } },
      { name: "Pacing", levels: { 4: "ช้า-เร็วถูกจังหวะ เน้นจุดสำคัญ หยุดได้ถูกที่", 3: "ค่อนข้างสม่ำเสมอ เปลี่ยนจังหวะบ้าง", 2: "เร็วเกินไปหรือช้าเกิน ขาด Dynamics", 1: "พูดเดิมๆ ตลอด ไม่มีจังหวะ" } },
      { name: "Strategic Pause", levels: { 4: "หยุดก่อนข้อมูลสำคัญทุกครั้ง เป็นธรรมชาติ", 3: "หยุดบ้างแต่ไม่สม่ำเสมอ", 2: "หยุดแบบสุ่ม ไม่สัมพันธ์กับเนื้อหา", 1: "ไม่มี Pause เลย หรือ Dead Air >3 วินาที" } },
      { name: "Whisper Trick", levels: { 4: "ใช้ถูกเวลา ดึงความสนใจได้ เป็นธรรมชาติ", 3: "ใช้ได้แต่ Timing ยังไม่เป๊ะ", 2: "พยายามใช้แต่ไม่เป็นธรรมชาติ", 1: "ไม่ใช้ หรือใช้ผิดสถานการณ์" } },
    ],
  },
  "RUB-03": {
    name: "Test Live Performance",
    usedInCourse: "STAGE",
    sessionRef: "S07 Test Live",
    maxScore: 16, passScore: 12, passRule: "≥12/16 + KPI ผ่านทั้ง 2 ตัว (Watch Time ≥40% และ Hook Rate ≥30%)",
    dimensions: [
      { name: "Hook & Grabber", levels: { 4: "หยุดนิ้วทันที มีตัวเลข/Curiosity ชัด", 3: "น่าสนใจแต่ไม่คม", 2: "พยายามแต่ยังทั่วไป", 1: "เริ่มด้วย 'สวัสดี'" } },
      { name: "Voice Dynamics", levels: { 4: "Pause ชัด Whisper ได้ จังหวะหลากหลาย", 3: "มีจังหวะบ้างแต่แบน", 2: "ราบเรียบขาดพลัง", 1: "โทนเดียว/พูดเร็วเกิน" } },
      { name: "Eye-line", levels: { 4: "มองเลนส์ตลอด ≥80% สบตาผู้ชมได้", 3: "มองกล้องเป็นหลัก หลุดบ้าง", 2: "มองจอตัวเองบ่อย", 1: "มองโน้ต/พื้น/มือถือบ่อย" } },
      { name: "Engagement", levels: { 4: "ตอบแชท+สร้าง FOMO ได้ไหลลื่น", 3: "ตอบแชทบ้าง", 2: "ตอบช้า ขาด Hype", 1: "ไม่ตอบหรือตอบไม่ตรงประเด็น" } },
    ],
  },
  "RUB-04": {
    name: "Global Pitch",
    usedInCourse: "FRONTIER",
    sessionRef: "F7 Global Pitch Simulation",
    maxScore: 16, passScore: 12, passRule: "≥12/16",
    dimensions: [
      { name: "Hook & Attention", levels: { 4: "หยุดนิ้วผู้ชมต่างชาติได้ทันที", 3: "น่าสนใจแต่ไม่แข็งแกร่ง", 2: "Hook ยังทั่วไป", 1: "ไม่มี Hook เริ่มด้วยแนะนำตัว" } },
      { name: "Value Proposition", levels: { 4: "ประโยชน์ชัดเจน โดนใจกลุ่มเป้าหมายต่างชาติ", 3: "บอกประโยชน์ได้ แต่ยังกว้าง", 2: "คลุมเครือ ผู้ฟังต้องคาดเดา", 1: "ไม่มี Value Proposition" } },
      { name: "Language & Clarity", levels: { 4: "ภาษาอังกฤษถูกต้อง ชัดเจน ฟังรู้เรื่อง 100%", 3: "มีผิดเล็กน้อย แต่เข้าใจได้", 2: "พอเข้าใจ มีสะดุดบ้าง", 1: "สื่อสารไม่รู้เรื่อง" } },
      { name: "Call to Action", levels: { 4: "CTA ชัดเจน มี Urgency/Benefit", 3: "มี CTA แต่ขาด Urgency", 2: "CTA ไม่ชัด", 1: "ไม่มี CTA" } },
    ],
  },
  "RUB-05": {
    name: "Hook Factory Speak",
    usedInCourse: "STAGE",
    sessionRef: "S03+S04 Hook Factory (พูดหน้ากล้อง)",
    maxScore: 12, passScore: 9, passRule: "≥9/12",
    dimensions: [
      { name: "ความมั่นใจ", levels: { 4: "สบตากล้อง เสียงหนักแน่น ไม่มีลังเล", 3: "ค่อนข้างมั่นคง ลังเลเล็กน้อย", 2: "ลังเลบ้าง เสียงสั่น", 1: "ไม่มั่นใจชัดเจน ก้มหน้า" } },
      { name: "ความชัดเจนของ Hook", levels: { 4: "หยุดนิ้วผู้ชมได้ทันที Hook คมชัด", 3: "น่าสนใจแต่ยังไม่คม", 2: "พยายามแต่ยังทั่วไป", 1: "ไม่มี Hook เลย" } },
      { name: "จังหวะและอารมณ์", levels: { 4: "มี Dynamics ชัด ช้า-เร็ว-หยุดถูกที่", 3: "มีจังหวะบ้าง", 2: "ราบเรียบ ขาดอารมณ์", 1: "โทนเดียวตลอด" } },
    ],
  },
  "RUB-06": {
    name: "FOMO Script Checklist", usedInCourse: "SIGNAL / MATRIX", sessionRef: "S01 Post / MT02 Post",
    maxScore: 4, passScore: 4, passRule: "ผ่านครบทั้ง 4 ขั้น (Pass/Fail รายขั้น)",
    dimensions: [{ name: "ขั้น1 Price Anchor" }, { name: "ขั้น2 Urgency" }, { name: "ขั้น3 Scarcity" }, { name: "ขั้น4 Social Proof" }],
  },
  "RUB-07": {
    name: "Hook Submission (MICRO)", usedInCourse: "MICRO EXPRESS", sessionRef: "Hook Submission Assignment",
    maxScore: 3, passScore: 3, passRule: "ผ่านครบทั้ง 3 องค์ประกอบ (Pass/Fail)",
    dimensions: [{ name: "Grabber" }, { name: "Value Preview" }, { name: "Call to Stay" }],
  },
  "RUB-08": {
    name: "Camera Presence Checklist", usedInCourse: "STAGE", sessionRef: "S02 Camera Presence",
    maxScore: 6, passScore: 5, passRule: "Pass ≥5/6",
    dimensions: [{ name: "Eye-line" }, { name: "ไม่ก้มมือถือ" }, { name: "Champion Stance" }, { name: "ใช้มือธรรมชาติ" }, { name: "โน้มตัว" }, { name: "ยิ้ม+สบตา" }],
  },
  "RUB-09": {
    name: "Crisis Improv Roleplay", usedInCourse: "STAGE", sessionRef: "S06 Crisis Improv Lab",
    maxScore: 4, passScore: 3, passRule: "Pass ≥3/4 ต่อ 1 สถานการณ์ — ต้องผ่านทั้ง 2 สถานการณ์",
    dimensions: [{ name: "Dead Air <3วิ" }, { name: "Recovery <10วิ" }, { name: "ไม่ตื่นตระหนก" }, { name: "ประโยคแก้ไขเชิงบวก" }],
  },
  "RUB-10": {
    name: "Self-Assessment (Option B)", usedInCourse: "STAGE", sessionRef: "S07 (ทางเลือกแทน Peer Review)",
    maxScore: 5, passScore: 4, passRule: "Pass ≥4/5",
    dimensions: [{ name: "ให้คะแนน 4 มิติครบ" }, { name: "มีเหตุผล" }, { name: "จุดแข็ง+หลักฐาน" }, { name: "จุดพัฒนา+แนวทาง" }, { name: "Action Plan 7 วัน" }],
  },
  "RUB-11": {
    name: "EPK Draft", usedInCourse: "BLUEPRINT", sessionRef: "B3 EPK Draft",
    maxScore: 10, passScore: 8, passRule: "≥8/10 (Checklist Pass/Fail)",
    dimensions: [{ name: "ชื่อ" }, { name: "รูป" }, { name: "Bio" }, { name: "Soul" }, { name: "KPI" }, { name: "คลิป 3" }, { name: "Testimonial" }, { name: "ช่องทาง" }, { name: "ราคา" }, { name: "Layout" }],
  },
  "RUB-12": {
    name: "EPK Final (BLUEPRINT)", usedInCourse: "BLUEPRINT", sessionRef: "B7 EPK Final",
    maxScore: 10, passScore: 9, passRule: "≥9/10 (Checklist Pass/Fail) — เงื่อนไขเดียวกับ RUB-11 แต่ต้องปรับปรุงตาม Feedback แล้ว",
    dimensions: [{ name: "ชื่อ" }, { name: "รูป" }, { name: "Bio" }, { name: "Soul" }, { name: "KPI" }, { name: "คลิป 3" }, { name: "Testimonial" }, { name: "ช่องทาง" }, { name: "ราคา" }, { name: "Layout" }],
  },
  "RUB-13": {
    name: "EPK Final (FRONTIER)", usedInCourse: "FRONTIER", sessionRef: "F7 EPK สากล",
    maxScore: 12, passScore: 10, passRule: "≥10/12 (Checklist Pass/Fail)",
    dimensions: [
      { name: "ชื่อ+ตำแหน่ง" }, { name: "Bio EN" }, { name: "Soul+Specialty" }, { name: "KPI EN" }, { name: "คลิป+sub EN" },
      { name: "ผลงาน" }, { name: "ตลาดพร้อม" }, { name: "ราคา USD" }, { name: "Contact" }, { name: "Mobile-friendly" }, { name: "รูปดี" }, { name: "ไม่มี Error" },
    ],
  },
  "RUB-14": {
    name: "Team Production Simulation", usedInCourse: "BLUEPRINT", sessionRef: "B6+B7 Simulation",
    maxScore: 6, passScore: 5, passRule: "Pass ≥5/6",
    dimensions: [{ name: "Host ไม่มอง Producer" }, { name: "Producer สลับฉากทัน" }, { name: "Chat Mod <30วิ" }, { name: "Inventory แจ้งทัน" }, { name: "Dead Air <3วิ" }, { name: "ไม่มีเสียงกวน" }],
  },
  "RUB-15": {
    name: "Panel Review (BLUEPRINT)", usedInCourse: "BLUEPRINT", sessionRef: "Final Panel",
    maxScore: 4, passScore: 3, passRule: "Pass ≥3/4",
    dimensions: [{ name: "นำเสนอชัดเจน" }, { name: "Soul+CI สอดคล้อง" }, { name: "EPK ครบ" }, { name: "แผน 30 วัน realistic" }],
  },
  "RUB-16": {
    name: "Panel Review (FRONTIER)", usedInCourse: "FRONTIER", sessionRef: "Final Panel",
    maxScore: 4, passScore: 3, passRule: "Pass ≥3/4 — Feasibility ต้องได้ ≥4/5",
    dimensions: [
      { name: "Feasibility", levels: { 4: "แผนเป็นไปได้จริง มีข้อมูลสนับสนุน ≥4/5", 3: "เป็นไปได้ แต่ขาดรายละเอียด", 2: "ไม่แน่ใจ ขาดข้อมูลสำคัญ", 1: "ไม่สมจริง" } },
      { name: "ตัวเลข P&L สมเหตุสมผล", levels: { 4: "คำนวณถูกต้อง ≥80% Margin สมจริง", 3: "ถูกส่วนใหญ่ มีผิดเล็กน้อย", 2: "มีผิดหลายจุด", 1: "ผิดหมด หรือไม่มีตัวเลข" } },
      { name: "เข้าใจตลาดต่างประเทศ", levels: { 4: "ระบุ VAT/กฎหมาย/พฤติกรรมผู้บริโภคได้ถูกต้อง", 3: "เข้าใจภาพรวม ขาดรายละเอียด", 2: "รู้บ้าง แต่มีเข้าใจผิด", 1: "ไม่รู้" } },
      { name: "นำเสนอชัดเจน มั่นใจ", levels: { 4: "พูดได้ไหลลื่น มั่นใจ ตอบคำถาม Panel ได้", 3: "ค่อนข้างดี สะดุดบ้าง", 2: "ลังเล อ่านโน้ตมาก", 1: "ไม่ผ่านเลย" } },
    ],
  },
};
