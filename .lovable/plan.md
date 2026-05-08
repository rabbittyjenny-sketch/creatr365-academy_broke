
# Phase 3 — Plan (ยังไม่เริ่มทำ รอยืนยัน)

ยึดตามไฟล์ `double_super_final_course.md`, `Quiz_System_Architecture.md`, `Quize_Bank.xlsx`, `Learning Flow v3` และ `quiz.html` ที่อยู่ใน storage แล้ว ส่วน "ฐานข้อมูลข้อสอบ" ไม่แตะต้องในเฟสนี้ตามที่สั่ง

---

## 1) แผนคอร์ส + จุดเรียก Pre/Post Test (วาง map ไว้ก่อน ยังไม่ผูก quiz engine)

ทุกคอร์สจะมี module sort_order เริ่มที่ `00 PRE-TEST` (ถ้ามี) และจบด้วย `99 POST-TEST` (ถ้ามี) — โครง modules อัปเดตตามนี้:

| Course | Format | บท (modules) | Pre-Test | Post-Test |
| :-- | :-- | :-- | :-- | :-- |
| MICRO EXPRESS · STARTER | VOD 100% (3 ชม.) | M01–M05 (5 คลิป) | QG-01 Pre Set-A (5 ข้อ) | QG-01 Post Set-A (6 ข้อ ≥70%) + QG-05 Pre |
| SIGNAL · DEVELOPING | VOD 4.5h + Live Q&A 1.5h (7+1) | S01 Hook · S02 S-O-R+PAD · S03 Vocal · S04 Camera · S05 Trust · S06 Narrative · S07 LiveQ&A | QG-01 Pre Set-B + QG-04 Pre | QG-01 Post + QG-03 Post + QG-04 Post (Post≥Pre+20pts) |
| MATRIX · DEVELOPING | VOD 4.5h + Workshop 1.5h | M01 Algorithm · M02 FOMO · M03 Dashboard · M04 Reporting · M05 AI · M06 Compliance · M07 Workshop | QG-05 Pre + QG-02 Pre | QG-05 Post + QG-02 Post (≥80%) + GMV Scenario (≥71%) |
| STAGE · COMPETENT | Onsite 1 วัน (8h) | ST01 Vocal Lab · ST02 Camera · ST03 Hook Factory · ST04 Narrative · ST05 Crisis Improv · ST06 KPI Test | QG-03 Pre + QG-01 During | QG-03 Post + Live KPI Rubric |
| BLUEPRINT · PROFICIENT | Onsite 2 วัน (16h) | BP01 5 Hidden Souls · BP02 Brand CI · BP03 Personal Branding/EPK · BP04 Multi-cam · BP05 Team System · BP06 Live Sim+EPK | QG-06 Pre | QG-06 Post + EPK Rubric |
| FRONTIER · MASTER | Onsite 2 วัน (16h) | FR01 P&L · FR02 Adv Analytics · FR03 Smart Lazy · FR04 P&L Workshop · FR05 Global Mkt · FR06 IMC · FR07 Global Pitch+EPK Final | QG-07 Pre + QG-05 Pre adv | QG-07 Post + Panel Review |

ระบบที่จะทำในเฟสนี้:
- เพิ่มคอลัมน์ `phase` ('pre'|'during'|'post') ลง `course_modules` และ flag `is_test`
- migration อัปเดต/insert modules ตามตารางข้างบน (idempotent)
- ในหน้า student VOD list จะเห็น "Pre-Test" เป็นบทแรก (locked ไว้ — ปุ่มจะ "เปิดใช้งานเร็วๆ นี้" ตามที่สั่งว่ายังไม่เชื่อม quiz engine จริง)

---

## 2) Dashboard นักเรียน — แสดงเฉพาะคอร์สที่เป็นเจ้าของ

เปลี่ยน rule:
- **แสดงเฉพาะ** course ที่ user มี `course_enrollments` row ที่ `status IN ('paid','free')`
- คอร์ส "ยังไม่ได้ลงทะเบียน" จะถูกเอาออกจาก Dashboard (ย้ายไปหน้า /courses อย่างเดียว)
- คอร์สฟรีจะเข้าได้เฉพาะเมื่อกด "เริ่มเรียนฟรี" จาก /course/:slug → ระบบ insert `course_enrollments(status='free')` อัตโนมัติ (ปัจจุบัน Enroll.tsx ทำอยู่แล้ว — จะตรวจ flow ให้ครบ)
- ถ้ายังไม่มี enrollment เลย แสดง empty state พร้อมปุ่มไป /courses

---

## 3) /courses — Hover effect "smooth + สีเดิม"

ปัญหาปัจจุบัน: card ใช้ class `hover-shift` กับชื่อคอร์สเฉยๆ การ์ดทั้งใบยกเล็กน้อย ไม่มี water/sweep

จะกลับไปใช้รูปแบบเดิม:
- เพิ่ม `.card-water` utility ใน `index.css` — overlay สี accent (blue/red/yellow/green) วิ่งจากซ้าย→ขวาแบบ scaleX แล้ว fade เข้า (cubic-bezier ease-out 600ms) คล้าย sweep-hover แต่ทั้งใบ
- ใช้ CSS variable `--hover-accent` set ที่ root ของการ์ด → text/border/CTA arrow ใช้สีเดียวกันเมื่อ hover
- ลบ transform ของ `hover-shift` ในบริบทใน card เพื่อกัน jank
- บังคับ `transition` ทั้ง color, background, transform, box-shadow ใน 350–600ms ease-out
- การ์ดใน Home preview, Courses list, CourseDetail sticky CTA ใช้ utility ตัวเดียวกันทั้งเว็บ

---

## 4) เมนูใหม่ "บทความ / Articles"

Routing + Nav:
- เพิ่ม `/articles` ใน CourseNavbar (และ Mobile bottom nav ถ้ามี) ระหว่าง "หลักสูตร" กับ "ติดต่อ"
- หน้า `/articles` = grid การ์ด (รูปแบบเดียวกับ /courses) ดึงจาก table ใหม่ `articles` (slug, title, summary, cover_image_url, kind enum: news|tool|community|quiz, target_url, is_active, sort_order)
- Migration จะ seed 1 การ์ดแรก: `kind='quiz'`, target = `/articles/diagnostic-quiz`

หน้า Diagnostic Quiz `/articles/diagnostic-quiz`:
- React component ที่ port จาก `quiz.html` (intro → survey → 14 ข้อ → result with skill profile + course recommendations)
- ใช้ design system โมโนโทน (ลบ `#10b981/#ef4444/#FF…` ของ html เดิม → ใช้ token `--success/--destructive/--muted`)
- ไม่มีบังคับ login (ใช้ฟรีสาธารณะตาม spec)

Data ที่จะเก็บ (เตรียม table `diagnostic_quiz_results` ไว้สำหรับเฟสถัดไป — เฟสนี้ insert เลยให้พร้อมใช้):
- `id, created_at`
- demographics: `gender, age_band, province, occupation, interest`
- `total_score (0–14), per_qg_scores jsonb` (คะแนนรายกลุ่ม QG-01…QG-07)
- `strengths text[], gaps text[], recommended_courses text[]`
- `user_id` (nullable — ถ้า login อยู่)
- `user_agent, referrer`
- RLS: insert public, select admin only (เพื่อสรุปข้อมูลภายหลัง)

หมายเหตุ: ใช้ฐานข้อมูลคำถาม "ของคนทั่วไป" ตาม `quiz.html` (14 ข้อ) ไปก่อน — ยังไม่ต่อกับ QG bank ของในคอร์ส (อันนั้นรอเฟสถัดไป)

---

## 5) Hover unified ทั้งเว็บ

ตรวจและ normalize:
- ทุก card (Course/Article/Module/Stat) ใช้ `.card-water` + `.hover-shift`
- ทุกปุ่ม CTA ใช้ `.btn-slide` + arrow translate-x
- ทุก nav link ใช้ `.hover-shift` (มีอยู่แล้ว) แต่ปรับ duration เป็น 350ms ทั่วทั้งระบบ

---

## ไฟล์ที่จะแก้/สร้าง

DB migration:
- ALTER `course_modules` add `phase text default 'main'`, `is_test boolean default false`
- CREATE `articles` (id, slug, title, summary, cover_image_url, kind, target_url, is_active, sort_order, created_at)
- CREATE `diagnostic_quiz_results` (+ RLS)
- Seed: modules ทุกคอร์สตามตาราง §1, article 1 รายการ (Diagnostic Quiz)

Code:
- `src/index.css` — เพิ่ม `.card-water`, ปรับ duration
- `src/pages/Dashboard.tsx` — ลบ section "คอร์สที่ยังไม่ได้ลงทะเบียน"
- `src/pages/Courses.tsx`, `src/pages/Home.tsx`, `src/pages/CourseDetail.tsx` — apply `.card-water`
- `src/components/CourseNavbar.tsx` — เพิ่มลิงก์ "บทความ"
- `src/pages/Articles.tsx` (ใหม่) — grid card
- `src/pages/DiagnosticQuiz.tsx` (ใหม่) — port จาก quiz.html
- `src/App.tsx` — route `/articles`, `/articles/diagnostic-quiz`, `/admin/assignments`, `/admin/payments` (ลงทะเบียนให้ครบ)

---

## ที่ "ยังไม่ทำ" ในเฟสนี้ (ตามคำสั่ง)

- ไม่ผูก Quiz Engine ของในคอร์ส (QG-01…QG-07) เข้ากับ Dashboard
- ไม่สร้าง quiz_questions seed (ข้อมูลใน xlsx เก็บไว้ใช้ภายหลัง)
- ไม่ออกใบ Certificate PDF
- ไม่แตะ schema `quiz_questions / course_quizzes` ที่มีอยู่แล้ว
