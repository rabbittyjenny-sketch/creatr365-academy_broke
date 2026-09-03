# Creatr365 — 5-Course Content Audit (2026-09-03)

> อ่านไฟล์นี้ก่อนแตะเนื้อหาคอร์ส/ข้อสอบต่อจากรอบนี้ เพื่อไม่ต้องไล่ตรวจซ้ำสิ่งที่ทำไปแล้ว
> ครอบคลุมงานที่ทำใน 2 repo: `creatr365-academy_broke` (เว็บหลัก + Supabase) และ `6course-quiz` (LMS จริงที่ผู้เรียนใช้)
> อ้างอิงจากคู่มือ 5 ไฟล์ที่แนบมาในงานนี้: **THE FOUNDATION** (Course 0, PDF), **SIGNAL**, **STAGE**, **BRAND HOST ARCHITECT**, **FR-MAGNET** (docx ทั้ง 4)

---

## 0. สถาปัตยกรรมที่ต้องเข้าใจก่อน (สำคัญที่สุด — พลาดจุดนี้แล้วงานจะซ้ำรอย)

ระบบนี้มี **2 ฐานข้อมูลที่แยกกันเด็ดขาด ไม่ได้ sync กัน**:

| ระบบ | อยู่ที่ไหน | ใช้ทำอะไร |
|---|---|---|
| **เว็บไซต์หลัก** (`/courses`, `/course/:slug`) | Supabase `courses` + `course_modules` + `course_resources` (repo `creatr365-academy_broke`) | หน้าโปรโมทคอร์ส, รายละเอียดคอร์ส, ปุ่มดาวน์โหลดคู่มือ PDF |
| **ระบบเรียนจริง** (LMS ที่ผู้เรียน login เข้าไปทำ) | Array `QUIZ_BANK` + `COURSES` hardcode ในไฟล์ `src/Creatr365_LMS_v2.jsx` (repo `6course-quiz`, deploy ที่ `6course-quiz.vercel.app`) | วิดีโอ, Pre-test, Knowledge Check ท้ายบท, ล็อก/ปลดล็อกบท |

**Supabase มีตาราง `course_quizzes`/`quiz_questions` แต่ว่างเปล่าและไม่มีโค้ดส่วนไหนเรียกใช้เลย** — อย่าเข้าใจผิดว่านี่คือที่เก็บข้อสอบจริง ข้อสอบจริงอยู่ใน `QUIZ_BANK` ใน JSX เท่านั้น

**Google Sheet `Creatr365_Master_Database` (tab `Quiz_Bank`)** เป็นต้นทางเก่าที่มีคนเคย export เป็น CSV ใส่ repo (`Creatr365_Master_Database - Quiz_Bank.csv`) แต่ **ตัวแอปจริงไม่ได้ดึงจาก Sheet นี้ตรงๆ** ใช้ค่าที่ hardcode ไว้ใน JSX ต่างหาก และค่าใน Sheet กับใน JSX **ไม่ตรงกัน** (เช่น ID เดียวกันแต่เนื้อหาคำถามคนละข้อ) — **Sheet นี้ยังไม่ได้อัปเดตให้ตรงกับสิ่งที่แก้ในรอบนี้เลย** (ดู TODO ข้อ 1)

`supabase/creatr365_seed_v2.sql` เป็นไฟล์ seed เก่าสำหรับ**ระบบ 6 คอร์สเดิม** (micro-express/signal/matrix/stage/blueprint/frontier) ที่ถูกยกเลิกไปแล้ว **ไม่รู้จัก slug ของ 5 คอร์สปัจจุบันเลย** (magnet/foundation/signal/stage/brand-host-architect) — อย่าเข้าใจผิดว่าไฟล์นี้คือ source of truth ของข้อมูลคอร์สปัจจุบัน ข้อมูลจริงถูกใส่ตรงเข้า production ผ่าน Supabase MCP/Admin UI ไม่มี migration file ที่ track ไว้ (ดู `Creatr365_TODO_Master.md` Phase 3 สำหรับบริบทเพิ่มเติมเรื่อง drift นี้)

---

## 1. โครงหัวข้อบทเรียน (course_modules) — ตรวจครบทั้ง 5 คอร์ส 35 บท

ตรวจ 3 อย่างต่อบท: ชื่อบท, เวลาเรียน (`duration_label`), สรุปเนื้อหา (`summary`) — เทียบกับหัวข้อ/ตารางภาพรวมในคู่มือแต่ละไฟล์

| คอร์ส | จำนวนบท | บั๊กที่พบ | แก้แล้ว |
|---|---|---|---|
| FOUNDATION | 8 (F001, F01–F07) | F05 "เทคนิค ASBC" เวลาเรียนผิด (ค้างที่ 20 นาที ทั้งที่คู่มืออัปเดตเป็น 35 นาทีแล้ว, รวมคอร์ส 4 ชม. 10 นาที ไม่ใช่ 3 ชม. 55 นาที) | ✅ |
| MAGNET | 6 (MG01–MG06) | ไม่พบบั๊กเวลาเรียน | — |
| SIGNAL | 7 (S00–S06) | ไม่พบบั๊กเวลาเรียน | — |
| STAGE | 6 (ST1–ST6) | ไม่พบบั๊กเวลาเรียน | — |
| BRAND HOST ARCHITECT | 8 (BH1–BH8) | ไม่พบบั๊กเวลาเรียน | — |

`summary` ว่างเปล่าทั้ง 35 บทก่อนแก้ — เติมครบจากเนื้อหาจริงในคู่มือแล้วทั้งหมด

**Known bug ที่ไม่ได้แก้ (อยู่ในตัวไฟล์ Word ต้นฉบับ ไม่ใช่ในระบบเว็บ):** คู่มือ STAGE สารบัญเขียนหัวข้อ "1.7 SOFTEN Framework" แต่เนื้อหาจริงในเล่มหัวข้อ SOFTEN ถูกเลขเป็น "1.8" (เลข 1.7 ตัวจริงถูกใช้กับหัวข้อ "10 แบบฝึกหัด Vocal" แทน) และมีคำเก่า "NESOTF" หลงเหลืออยู่ในเนื้อความช่วงเปิดของหัวข้อ SOFTEN — ต้องแก้ในไฟล์ Word ต้นฉบับเอง ไม่ใช่ในโค้ด/ฐานข้อมูล เพราะไม่เคยปรากฏในระบบเว็บ/แอปเลย

---

## 2. ไฟล์คู่มือ PDF ที่แนบไว้บนเว็บ (course_resources)

ตาราง `course_resources` คือปุ่ม "ดาวน์โหลดคู่มือ" บนหน้าคอร์ส **คนละเรื่องกับไฟล์ที่ใช้แนบในงานนี้** (ไฟล์ที่ใช้อ่านทำงานไม่เคยถูกอัปโหลดเข้าตารางนี้เลย — ตารางนี้มีไฟล์ที่มีคนอัปโหลดไว้ก่อนหน้าตั้งแต่ 31 ส.ค. 2026)

ก่อนแก้ มี 4 แถว แต่ 3 ใน 4 ผูกผิดคอร์ส:

| ไฟล์ | ผูกผิดที่ (ก่อนแก้) | แก้เป็น |
|---|---|---|
| คู่มือ SIGNAL | magnet | signal ✅ |
| คู่มือ FR-MAGNET | brand-host-architect | magnet ✅ |
| คู่มือ Foundation (ซ้ำ) | stage | ปิดการแสดงผล (deactivate) ✅ |
| คู่มือ Foundation | foundation (ถูกอยู่แล้ว) | — |

**ผลลัพธ์ปัจจุบัน:** signal, magnet, foundation มีไฟล์ถูกต้องแล้ว — **stage และ brand-host-architect ไม่มีไฟล์ PDF ในช่องนี้เลย** เพราะไม่เคยมีใครแปลงคู่มือ .docx ของ 2 คอร์สนี้เป็น PDF แล้วอัปโหลดจริง (ไม่ใช่ปัญหาโค้ด เป็นเรื่อง asset ที่ยังไม่ทำ)

---

## 3. ระบบข้อสอบจริง (`QUIZ_BANK` ใน 6course-quiz)

### 3.1 กลไกการทำงาน (สำคัญ ต้องเข้าใจก่อนแก้ QG ใดๆ ต่อไป)

แต่ละบทเรียนมี field `qg` (เช่น `"QG-01"`) — ตอนกด "ทำแบบทดสอบ" ระบบจะดึงข้อสอบด้วย

```js
QUIZ_BANK.filter(q => q.qg === lesson.qg)   // ตรงตัวเป๊ะเท่านั้น ไม่มี fallback
```

ถ้าบทไหนผูก `qg` ผิดหมวด จะได้ข้อสอบผิดเนื้อหาทันทีโดยไม่มี error ใดๆ เตือน — บั๊กประเภทนี้เป็นสาเหตุหลักของทุกจุดที่แก้ในหัวข้อ 3.2

### 3.2 บั๊ก qg ผิดหมวดที่พบและแก้ (ไล่ตรวจครบทุกบทที่มีข้อสอบในทั้ง 5 คอร์สแล้ว)

| บท | คอร์ส | ก่อนแก้ | หลังแก้ | เหตุผล |
|---|---|---|---|---|
| F02 จรรยาบรรณก่อนออกอากาศ | FOUNDATION | QG-06 (Brand/Production — ผิดหมวด) | **QG-08 ใหม่** | สร้างหมวดจรรยาบรรณ/กฎหมาย 12 ข้อจากเนื้อหาคู่มือจริง |
| F03 ค้นหาตัวตนโฮสต์ของคุณ | FOUNDATION | QG-06 (ผิดหมวด) | **QG-09 ใหม่** | สร้างหมวดตัวตนโฮสต์ระบบ FOUNDATION 9 ข้อ (Expert/Entertainer/Relatable/Storyteller/Motivator) |
| S01 รากฐานความเชื่อใจและจรรยาบรรณ | SIGNAL | QG-06 (ผิดหมวด) | QG-08 | ย้ายเข้าหมวดจรรยาบรรณที่สร้างไว้ |
| MG03 Find Your Host Identity | MAGNET | QG-06 (ผิดหมวด) | **QG-10 ใหม่** | ระบบตัวตนโฮสต์ของ MAGNET (E-Commerce Host/In-House Expert/Influencer Host/Multi-Platform Host/Brand Ambassador) เป็นคนคนละระบบกับ FOUNDATION ตามที่คู่มือเขียนไว้เอง ใช้ QG-09 ร่วมไม่ได้ ต้องสร้างใหม่ 8 ข้อ |
| BH4 Legal Framework & Multi-Channel Contract | BRAND HOST ARCHITECT | QG-06 (ผิดหมวด) | QG-08 | เป็นเนื้อหากฎหมาย/สัญญา ไม่ใช่ Production |

นอกจากนี้แก้คำตอบข้อสอบที่ผิด 1 ข้อ: `QG04-POST-A-002` เคยระบุว่า ASBC ย่อมาจาก "Attention-Story-Benefit-CTA" (ผิด/ล้าสมัย) แก้เป็น "Appeal/Sales Point/Benefit Focus/Conscious Choice" (นิยามที่ถูกต้องปัจจุบัน ใช้ร่วมกันทั้ง FOUNDATION/SIGNAL/STAGE)

**สรุปหมวดข้อสอบทั้งหมดหลังแก้ (QUIZ_BANK: 81 → 110 ข้อ):**

| QG | ชื่อหมวด | จำนวนข้อ | ใหม่ในรอบนี้? |
|---|---|---|---|
| QG-01 | Attention & Hook Mechanics | 16 | เดิม |
| QG-02 | Hook Loop & FOMO Ladder | 8 | เดิม |
| QG-03 | Voice, Camera & Trust Architecture | 9 | เดิม |
| QG-04 | Buyer Psychology — S-O-R & PAD Theory | 9 | เดิม |
| QG-05 | Analytics & KPI Calculation | 16 | เดิม |
| QG-06 | Brand Identity & Production | 10 | เดิม |
| QG-07 | Business, P&L & Global Strategy | 13 | เดิม |
| QG-08 | Ethics, Disclosure & Legal Compliance | 12 | ✅ ใหม่ |
| QG-09 | Host Identity & Archetypes (ระบบ FOUNDATION) | 9 | ✅ ใหม่ |
| QG-10 | Host Identity & Archetypes (ระบบ MAGNET) | 8 | ✅ ใหม่ |

`RADAR_DIMS` (แกน "brand" ในกราฟ radar 5 แกนของ Dashboard) ขยายให้ครอบคลุม QG-08/09/10 ด้วยแล้ว ไม่ได้เพิ่มแกนใหม่

### 3.3 สิ่งที่ยังไม่ได้ตรวจในระบบข้อสอบ (ทำแค่ qg tag matching เท่านั้น)

- ยังไม่ได้ไล่เช็คว่าเนื้อหา**คำถามรายข้อ**ในแต่ละ QG (โดยเฉพาะ QG-01 ถึง QG-07 ที่เป็นของเดิม ไม่ได้เขียนใหม่รอบนี้) ตรงกับคู่มือจริงทุกข้อหรือไม่ — ตรวจแค่ว่า "หมวดใหญ่ถูกต้องตามหัวข้อบท" เท่านั้น
- วิดีโอทุกบท (ทั้ง 21 บทที่เป็น VOD) ยังชี้ไปที่ลิงก์ YouTube placeholder เดียวกันหมด ไม่ใช่วิดีโอจริงของแต่ละบท — คู่มือ 5 ไฟล์ไม่มีลิงก์วิดีโอระบุไว้เลย แก้จากเอกสารไม่ได้ ต้องรอไฟล์วิดีโอจริงจากทีม

---

## 4. รายละเอียดระดับคอร์ส (courses.features / courses.deliverables)

ตรวจแยกจากข้อ 1 เพราะเป็นคนละ field — audit ที่ทำหลังสุดในรอบนี้ พบ 1 จุดที่ผิดจริง (ข้อมูลข้ามคอร์สกัน) และแก้แล้ว, อีก 2 จุดที่ตรวจไม่พบในคู่มือถูกลบออกตามคำสั่งผู้ใช้:

| คอร์ส | field | ปัญหา | การจัดการ |
|---|---|---|---|
| magnet | features | มีสถิติ "Live ขายได้มากกว่าเว็บ 10–15 เท่า" ซึ่งเป็นสถิติของคู่มือ FOUNDATION ไม่ใช่ของ MAGNET เอง | ✅ แก้เป็นสถิติจริงของ MAGNET (TikTok Shop GMV โต 500% ใน 8 เดือน) |
| brand-host-architect | features | "Agency Starter Kit — สัญญา Rate Card ทีม Scaling Framework" ไม่พบในคู่มือ BH เลย (คำนี้อยู่ในเอกสารชุดขยายแยกต่างหากที่ไม่ได้แนบมาในงานนี้) | ✅ ลบออกตามคำสั่งผู้ใช้ |
| brand-host-architect | deliverables | "Agency Starter Kit — สัญญาจ้างโฮสต์ + Client Onboarding + Rate Card" (คำเดียวกัน คนละ field) | ✅ ลบออกตามคำสั่งผู้ใช้ |
| brand-host-architect | deliverables | "Certified Brand Host Architect — Certificate + Digital Badge" ไม่พบในคู่มือเลย (grep ทั้ง 809 บรรทัด) | ✅ ลบออกตามคำสั่งผู้ใช้ |

**ยังไม่ได้ตรวจ:** `target_audience`, `outcome_goal`, `description`, `subtitle` ของทั้ง 5 คอร์ส และ `kpi_notes` — audit รอบนี้เช็คแค่ `features`/`deliverables` เท่านั้น เพราะเป็นจุดที่พบปัญหาก่อน ยังไม่ได้ไล่ที่เหลือ

---

## 5. TODO — สิ่งที่ต้องทำต่อ

### ต้องทำก่อน (blocking)
- [ ] **Merge PR สองใบ** ทุกอย่างในไฟล์นี้ยัง deploy ไม่ถึงมือผู้ใช้จริงจนกว่าจะ merge:
  - `creatr365-academy_broke` PR #22 (course_modules + course_resources + courses.features/deliverables)
  - `6course-quiz` PR #14 (QUIZ_BANK, ASBC fix, F05 duration)

### ต้องตัดสินใจ / ทำเพิ่ม (ไม่ blocking แต่ค้างอยู่)
- [ ] **Sync Google Sheet `Creatr365_Master_Database` (tab Quiz_Bank)** ให้ตรงกับ `QUIZ_BANK` ใน JSX ที่แก้ในรอบนี้ (เพิ่ม QG-08/09/10 รวม 29 แถว, แก้ QG04-POST-A-002) — ไม่ได้ทำในรอบนี้เพราะไม่มีเครื่องมือแก้เซลล์สเปรดชีตโดยตรงในเซสชันนี้ และเป็นระบบหลักที่ควรให้เจ้าของระบบ confirm ก่อนแก้
- [ ] **แก้บั๊กเลขหัวข้อในไฟล์ STAGE ต้นฉบับ** (สารบัญ "1.7 SOFTEN" vs เนื้อหาจริง "1.8" + คำ "NESOTF" ตกค้าง) — ต้องแก้ในไฟล์ Word ต้นฉบับโดยตรง ไม่เกี่ยวกับโค้ด
- [ ] **หาไฟล์วิดีโอจริงมาแทน placeholder** ทั้ง 21 บท (Foundation 8 + Signal 7 + Magnet 6) — ต้องมีคนอัดวิดีโอ/มีลิงก์จริงส่งมาก่อน
- [ ] **แปลงคู่มือ STAGE และ BRAND HOST ARCHITECT เป็น PDF แล้วอัปโหลดเข้า `course_resources`** — ตอนนี้ 2 คอร์สนี้ไม่มีไฟล์ดาวน์โหลดบนหน้าเว็บเลย
- [ ] **ตรวจ `target_audience`, `outcome_goal`, `description`, `subtitle`, `kpi_notes`** ของทั้ง 5 คอร์สเทียบกับคู่มือ — ยังไม่ได้ทำในรอบนี้ (ทำแค่ features/deliverables)
- [ ] **ตรวจเนื้อหาคำถามรายข้อ** ใน QG-01 ถึง QG-07 (ของเดิม ไม่ใช่ที่เขียนใหม่รอบนี้) เทียบกับคู่มือทีละข้อ — รอบนี้ตรวจแค่ระดับ "หมวดถูกต้องตามหัวข้อบท" เท่านั้น ไม่ได้ไล่ทุกข้อ

---

## 6. Repo/PR ที่เกี่ยวข้อง

| Repo | Branch | PR | สิ่งที่แก้ |
|---|---|---|---|
| creatr365-academy_broke | claude/blissful-ptolemy-ul2dn9 | [#22](https://github.com/rabbittyjenny-sketch/creatr365-academy_broke/pull/22) | course_modules, course_resources, courses.features/deliverables |
| 6course-quiz | claude/blissful-ptolemy-ul2dn9 | [#14](https://github.com/rabbittyjenny-sketch/6course-quiz/pull/14) | QUIZ_BANK (QG-08/09/10 ใหม่ + แก้ qg tag 5 บท + แก้คำตอบผิด 1 ข้อ), F05 duration |

ไฟล์ SQL บันทึกการแก้ไขทั้งหมด (สำหรับ reproduce/ตรวจย้อนหลัง) อยู่ที่ `supabase/fixes/` ในโฟลเดอร์นี้:
- `2026-09-03_foundation_content_and_resource_fix.sql`
- `2026-09-03b_all_courses_module_summaries.sql`
- `2026-09-03c_course_level_feature_accuracy.sql`

---

*เขียนเมื่อ 2026-09-03 — งานทั้งหมดในไฟล์นี้อ้างอิงจากคู่มือ 5 ไฟล์ที่แนบมาในงานนี้ + ฐานข้อมูล Supabase production จริง (project `exybvjqjdqxonhesydhk`) + โค้ดจริงในทั้ง 2 repo*
