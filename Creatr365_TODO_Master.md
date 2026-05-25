# Creatr365 — TODO Master (สรุปจากการวิเคราะห์ระบบ พ.ค. 2026)

> ไฟล์นี้สรุปทุกอย่างที่ต้องแก้ไข เรียงลำดับความสำคัญ  
> อ่านไฟล์นี้ก่อนเริ่มทำงานทุกครั้ง เพื่อไม่ต้องอธิบายซ้ำ

---

## ข้อมูลระบบ (Context)

| รายการ | ค่า |
|---|---|
| Supabase URL | `https://exybvjqjdqxonhesydhk.supabase.co` |
| Supabase Publishable Key | `sb_publishable_3QLVwjWPu_tp3RckxebHNw_bjJZTUGh` |
| LMS App | `https://6course-quiz.vercel.app` (repo: `6course-quiz-main`) |
| Main Web | `https://creatr365.space` (repo: `creatr365-academy-main`) |
| Apps Script Quiz Bank | `https://script.google.com/macros/s/AKfycbwYnuFfq6E3GsU0fYznj9jrdM6hl3736ET1i3k4iZGCK5-2fyRTjF9ANHaAYdtIgV6XJQ/exec` |
| Apps Script Skill Gap | `https://script.google.com/macros/s/AKfycbymoQ7VcpEmpRHfopPxWuALnP8p4xW-YvAIJbaPu8EMspf16_COyz9M6eYH0ulxTV5B/exec` |

**Architecture ปัจจุบัน:**
```
LINE OA Rich Menu → เปิด creatr365.space → Login (email/password Supabase)
→ Dashboard → กด "เข้าเรียน" → เปิด 6course-quiz.vercel.app?kid=STU-xxx&course=signal
→ LMS โหลดบทเรียน+ข้อสอบ → บันทึกผลไป Apps Script + Supabase พร้อมกัน
```

---

## สถานะ Supabase (ยืนยันแล้ว ณ พ.ค. 2026)

| ตาราง | สถานะ | หมายเหตุ |
|---|---|---|
| `courses` | ว่าง | ยังไม่มีข้อมูลคอร์สเลย |
| `course_modules` | **ว่างเปล่า** | ยืนยันจากภาพ Table Editor |
| `module_progress` | ว่าง + ขาด column | ไม่มี `score` column |
| `course_enrollments` | ว่าง | รอ user จริงลงทะเบียน |
| `course_quizzes` | สร้างแล้ว ว่าง | ไม่ได้ใช้งาน |
| `quiz_questions` | สร้างแล้ว ว่าง | ไม่ได้ใช้งาน |
| `assignments` | สร้างแล้ว ว่าง | พร้อมใช้งาน (admin ตรวจงาน) |
| `user_accounts` | สร้างแล้ว ว่าง | รอ user จริง |
| `profiles` | สร้างแล้ว ว่าง | รอ user จริง |

---

## TODO LIST — เรียงตามลำดับก่อน-หลัง

---

### 🔴 PHASE 1A — ต้องทำก่อนโปรโมท (ไม่แตะ DB schema)

#### [P1-01] แก้ Logout ไม่ clear session
**ไฟล์:** `creatr365-academy-main/src/components/Navbar.tsx`  
**ปัญหา:** supabase.signOut() ล้าง Supabase token แต่ไม่ล้าง localStorage ทั้งหมด  
**แก้:** เพิ่ม 2 บรรทัดนี้ใน logout handler

```js
await supabase.auth.signOut()
localStorage.clear()          // ← เพิ่มบรรทัดนี้
navigate('/auth')
```

---

#### [P1-02] แก้ KEY_ID ได้คนละค่าเมื่อเข้าสองทาง (LINE vs Email)
**ไฟล์:** `creatr365-academy-main/src/pages/Dashboard.tsx`  
**ฟังก์ชัน:** `ensureStudentId()`  
**ปัญหา:** LINE user → STU-001 / Web email user → STU-XXXXXX = คนเดียวกัน 2 ID  
**แก้:** เปลี่ยนให้ lookup email ก่อนเสมอ

```ts
async function ensureStudentId(userId: string, email: string): Promise<string> {
  const fallback = 'STU-' + userId.slice(0, 6).toUpperCase();
  try {
    // 1. ลอง email ก่อน (master key)
    const { data: byEmail } = await supabase
      .from('user_accounts')
      .select('student_id')
      .eq('email', email)
      .maybeSingle();
    if ((byEmail as any)?.student_id) return (byEmail as any).student_id;

    // 2. ลอง line_user_id (web: prefix)
    const { data: byLine } = await supabase
      .from('user_accounts')
      .select('student_id')
      .eq('line_user_id', 'web:' + userId)
      .maybeSingle();
    if ((byLine as any)?.student_id) return (byLine as any).student_id;

    // 3. สร้างใหม่
    const { error } = await supabase.from('user_accounts').upsert(
      { line_user_id: 'web:' + userId, email, student_id: fallback, is_active: true },
      { onConflict: 'line_user_id' },
    );
    if (error) console.warn('user_accounts upsert:', error.message);
  } catch (e) {
    console.warn('ensureStudentId failed', e);
  }
  return fallback;
}
```

---

#### [P1-03] ยืนยัน LINE OA Rich Menu URL ชี้ถูก
**ไม่แตะโค้ด** — ตรวจใน LINE OA Manager  
**ต้องการ:** Rich Menu ทุกปุ่มที่เชื่อมเว็บ ต้องชี้ไป `https://creatr365.space/auth`  
**ตรวจ:** หลัง login แล้ว redirect ไป `/dashboard` อัตโนมัติ (มีอยู่แล้วในโค้ด)

---

### 🔴 PHASE 1B — แก้ระบบ Quiz Unlock (หัวใจหลัก)

#### [P1-04] เพิ่ม `score` column ใน `module_progress`
**วิธี:** รัน SQL นี้ใน Supabase Dashboard → SQL Editor

```sql
-- เพิ่ม score column
ALTER TABLE public.module_progress 
ADD COLUMN IF NOT EXISTS score integer;

-- เพิ่ม unique constraint (save-score ใช้ onConflict นี้)
CREATE UNIQUE INDEX IF NOT EXISTS module_progress_user_module_unique
ON public.module_progress (user_id, module_id);
```

---

#### [P1-05] Seed ข้อมูล courses + course_modules ใน Supabase
**ปัญหา:** `course_modules` ว่างเปล่า → unlock_next_module ทำงานไม่ได้  
**ต้องการ:** Insert ข้อมูล 6 คอร์ส (7 คอร์สรวม THE BEGINNING 365) + บทเรียนทุกบท

**โครงสร้างที่ต้อง insert ใน course_modules:**

| course slug | lesson code | lesson name | sort_order | has_quiz | qg_ref |
|---|---|---|---|---|---|
| micro-express | M01 | Why Hook คือทุกอย่าง | 1 | true | QG-01 |
| micro-express | M02 | 30-Sec Hook Formula ชั้นที่ 1 | 2 | true | QG-01 |
| micro-express | M03 | Formula ชั้นที่ 2-3 | 3 | true | QG-01 |
| micro-express | M04 | Host คือใคร? 5 ประเภท | 4 | true | QG-05 |
| micro-express | M05 | Live Commerce 101 | 5 | true | QG-05 |
| signal | S01 | Hook Architecture | 1 | true | QG-01 |
| signal | S02 | S-O-R + PAD Theory | 2 | true | QG-04 |
| signal | S03 | Vocal Dynamics | 3 | true | QG-03 |
| signal | S04 | Camera Mastery | 4 | true | QG-03 |
| signal | S05 | Trust Architecture | 5 | true | QG-03 |
| signal | S06 | Narrative Selling | 6 | true | QG-01 |
| matrix | MX01 | Algorithm Intelligence | 1 | true | QG-05 |
| matrix | MX02 | FOMO System | 2 | true | QG-02 |
| matrix | MX03 | Live Dashboard | 3 | true | QG-05 |
| matrix | MX04 | Reporting | 4 | true | QG-05 |
| matrix | MX05 | AI Tools | 5 | true | QG-05 |
| matrix | MX06 | Compliance | 6 | true | QG-06 |
| stage | ST01 | Vocal Engine Lab | 1 | true | QG-03 |
| stage | ST02 | Camera Presence | 2 | true | QG-03 |
| stage | ST03 | Hook Factory | 3 | true | QG-01 |
| stage | ST04 | Narrative Performance | 4 | true | QG-04 |
| stage | ST05 | Crisis Improv Lab | 5 | true | QG-03 |
| stage | ST06 | Test Live + Debrief | 6 | true | QG-01 |
| blueprint | B01 | 5 Hidden Souls | 1 | true | QG-06 |
| blueprint | B02 | Brand CI Architecture | 2 | true | QG-06 |
| blueprint | B03 | Personal Branding + EPK | 3 | true | QG-06 |
| blueprint | B04 | Multi-Camera Production | 4 | true | QG-06 |
| blueprint | B05 | Team Production System | 5 | true | QG-06 |
| blueprint | B06 | Live Simulation + EPK | 6 | true | QG-06 |
| frontier | F01 | P&L Mastery | 1 | true | QG-07 |
| frontier | F02 | Advanced Analytics | 2 | true | QG-05 |
| frontier | F03 | Smart Lazy Strategy | 3 | true | QG-07 |
| frontier | F04 | Global Market Intelligence | 4 | true | QG-07 |
| frontier | F05 | IMC & Digital Marketing | 5 | true | QG-06 |
| frontier | F06 | Global Pitch Simulation | 6 | true | QG-07 |

> ⚠️ ต้อง insert courses ก่อน → ได้ course_id → แล้ว insert course_modules ที่ผูก course_id

---

#### [P1-06] แก้ LMS ส่ง lesson_id แทน QG code ไปที่ Supabase
**ไฟล์:** `6course-quiz-main/src/Creatr365_LMS_v2.jsx`  
**ปัญหา:** save-score รับ `module_code: "QG-01"` แต่ course_modules ใช้ `code: "M01"` → หากันไม่เจอ  
**แก้ 1 จุด** ใน api() function บรรทัดที่ส่ง Supabase

```js
// ตอนนี้ (ผิด)
body: JSON.stringify({
  student_id: params.sid,
  course_slug: courseSlug,
  module_code: params.qg,   // ← ส่ง QG-01 ซึ่งไม่มีใน course_modules
  score: params.pct,
  passed: params.passed === true || params.passed === "true",
})

// แก้เป็น
body: JSON.stringify({
  student_id: params.sid,
  course_slug: courseSlug,
  module_code: params.lesson_id || params.qg,  // ← ส่ง M01, S01 ฯลฯ
  score: params.pct,
  passed: params.passed === true || params.passed === "true",
})
```

และเพิ่ม `lesson_id` เข้า apiSaveScore call ใน handleQuizDone

```js
// เพิ่ม lessonId param ใน apiSaveScore signature
const apiSaveScore = (sid, c, qt, qg, raw, total, pct, passed, lessonId) =>
  api({ action:"save_score", sid, course:c, quiz_type:qt, qg:qg||"", 
        raw, total, pct, passed, lesson_id: lessonId||"" });

// และส่ง activeLessonId เข้าไปตอน call
apiSaveScore(student?.id, activeCourse, quizCtx.quizType, quizCtx.qg, 
             result.correct, result.total, result.pct, 
             result.pct >= CFG.passThreshold,
             quizCtx.lessonId)   // ← เพิ่ม
```

---

#### [P1-07] แก้ Dashboard แสดง score จาก module_progress
**ไฟล์:** `creatr365-academy-main/src/pages/Dashboard.tsx`  
**แก้:** เพิ่ม score ใน select query + แสดงใน module list

```ts
// เปลี่ยน query module_progress
supabase.from('module_progress')
  .select('module_id, status, score, completed_at')
  .eq('user_id', session.user.id)

// Interface เพิ่ม score
interface ProgressRow { module_id: string; status: string; score: number | null }

// แสดงใน module list (ใน JSX)
{mod.has_quiz && prog?.score != null && (
  <span className={`text-[10px] font-bold ${prog.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
    {prog.score}% {prog.score >= 70 ? '✓ ผ่าน' : '✗ ยังไม่ผ่าน'}
  </span>
)}
{mod.has_quiz && prog?.score == null && prog?.status === 'unlocked' && (
  <span className="text-[10px] text-muted-foreground">ยังไม่ได้ทำ</span>
)}
{(!prog || prog.status === 'not_started') && (
  <span className="text-[10px] text-muted-foreground">🔒</span>
)}
```

---

#### [P1-08] แก้ Dashboard Stats ให้แสดงตัวเลขจริง
**ไฟล์:** `creatr365-academy-main/src/pages/Dashboard.tsx`  
**ปัญหา:** stats hardcode เป็น 0 ทั้งหมด  
**แก้:** คำนวณจากข้อมูลที่ query มาแล้ว

```ts
// คำนวณ stats จาก state ที่มีอยู่แล้ว
const statsData = useMemo(() => {
  const completedCourses = enrollments.filter(e => {
    const mods = modulesByCourse.get(e.course_id) || [];
    return mods.length > 0 && mods.every(m => completedModuleIds.has(m.id));
  }).length;

  const quizScores = progress.filter(p => p.score != null).map(p => p.score!);
  const avgScore = quizScores.length 
    ? Math.round(quizScores.reduce((a,b) => a+b, 0) / quizScores.length) 
    : 0;

  return [
    { label: 'คอร์สที่เรียนอยู่', value: enrolledCourses.length, accent: 'blue' },
    { label: 'Quiz ผ่านแล้ว', value: progress.filter(p => (p.score ?? 0) >= 70).length, accent: 'green' },
    { label: 'คะแนนเฉลี่ย', value: avgScore ? `${avgScore}%` : '-', accent: 'red' },
    { label: 'ใบประกาศ', value: completedCourses, accent: 'yellow' },
  ];
}, [enrollments, enrolledCourses, modulesByCourse, completedModuleIds, progress]);
```

---

### 🟡 PHASE 2 — หลังโปรโมท (แตะ DB + โครงสร้างใหม่)

#### [P2-01] เชื่อม LINE LIFF จริง
**ไฟล์:** `.env` + `AuthSheet.tsx`  
**ต้องทำ:**
- สร้าง LIFF App ใน LINE Developers Console
- ใส่ `VITE_LINE_LIFF_ID` ใน .env
- เพิ่ม LINE Login button ใน AuthSheet.tsx
- เมื่อ login สำเร็จ → upsert `user_accounts` ด้วย `line_user_id` จาก LIFF token
- Merge กับ email account ถ้า email ตรงกัน

#### [P2-02] Seed quiz_questions จาก QUIZ_BANK
**ต้องทำ:**
- เขียน migration script แปลง QUIZ_BANK array (116 ข้อ) → INSERT ลง `course_quizzes` + `quiz_questions`
- LMS เปลี่ยนจาก hardcoded QUIZ_BANK → fetch จาก Supabase
- ข้อดี: แก้ข้อสอบได้โดยไม่แตะโค้ด

#### [P2-03] เพิ่ม THE BEGINNING 365 (คอร์สที่ 7)
**ไฟล์:** `6course-quiz-main/src/Creatr365_LMS_v2.jsx`  
**ต้องทำ:**
- เพิ่ม `THE_BEGINNING` ใน COURSES config
- เพิ่มใน COURSE_ORDER array
- Seed course_modules ใน Supabase
- เพิ่ม slug mapping ใน `get-enrollment` edge function

#### [P2-04] ย้าย LMS เข้าเว็บหลัก (ไม่แยก subdomain)
**ต้องทำ:**
- สร้าง route `/learn/:course` ใน creatr365-academy-main
- ย้าย Creatr365_LMS_v2.jsx เข้ามา
- session ใช้ร่วมกัน ไม่ต้องส่ง ?kid= ใน URL
- ปลอดภัยกว่า (ไม่มี student_id ใน URL)

#### [P2-05] One-time token แทน ?kid= ใน URL
**ปัญหา:** ตอนนี้ใครรู้ URL + kid ก็เข้า LMS ได้โดยไม่ต้อง login  
**แก้:** สร้าง edge function ออก short-lived token (15 นาที) แทน

---

## Flow ปัจจุบัน vs Flow ที่ควรเป็น

### Quiz Unlock Flow (หลัง Phase 1B ทำเสร็จ)

```
นักเรียนดูวิดีโอบท M01 จบ
  ↓
กด "ทำข้อสอบ" → QuizEngine แสดง 5 ข้อ (QG-01)
  ↓
ส่งคำตอบ → calcScore() → pct = 82%
  ↓
apiSaveScore(sid, "MICRO_EXPRESS", "kc", "QG-01", 4, 5, 82, true, "M01")
  ↓
  ├─ Apps Script: บันทึก Student_Progress sheet
  └─ Supabase save-score:
      1. หา user_id จาก student_id
      2. หา module_id จาก (slug="micro-express", code="M01")  ← แก้แล้ว
      3. upsert module_progress {status:"completed", score:82}   ← มี column แล้ว
      4. call unlock_next_module(M01) → insert M02 {status:"unlocked"}
  ↓
Dashboard refresh → M01 แสดง ✓ 82% | M02 แสดง "ยังไม่ได้ทำ" | M03 แสดง 🔒
```

---

## ไฟล์ที่ต้องแก้ (สรุป)

| ไฟล์ | TODO | Phase |
|---|---|---|
| Supabase SQL Editor | P1-04: ADD COLUMN score | 1B |
| Supabase SQL Editor | P1-05: INSERT courses + course_modules | 1B |
| `creatr365-academy-main/src/components/Navbar.tsx` | P1-01: localStorage.clear() | 1A |
| `creatr365-academy-main/src/pages/Dashboard.tsx` | P1-02: ensureStudentId() | 1A |
| `creatr365-academy-main/src/pages/Dashboard.tsx` | P1-07: แสดง score | 1B |
| `creatr365-academy-main/src/pages/Dashboard.tsx` | P1-08: stats จริง | 1B |
| `6course-quiz-main/src/Creatr365_LMS_v2.jsx` | P1-06: ส่ง lesson_id แทน qg | 1B |
| LINE OA Manager (ไม่แตะโค้ด) | P1-03: ตรวจ Rich Menu URL | 1A |

---

## หมายเหตุสำคัญ

- **QUIZ_BANK 116 ข้อ** อยู่ใน `Creatr365_LMS_v2.jsx` hardcoded — ยังไม่ได้ย้ายไป Supabase
- **Short_Answer 25 ข้อ** ในคลัง quiz ยังไม่ได้ใช้งาน — ไม่มี auto-grade
- **Pass threshold = 70%** ทุกคอร์ส (CFG.passThreshold)
- **Upsell Guard = 80%** ถ้าคะแนน QG ≥80% ไม่แนะนำคอร์สนั้นซ้ำ
- **MICRO EXPRESS** เป็น free lead-magnet — get-enrollment ส่งให้ทุก student เสมอ
- **course_quizzes + quiz_questions** มีตารางพร้อมแต่ว่าง — ใช้ Phase 2
- **ชั้น 3 KPI** (Watch Time, TikTok Analytics) ตัดออกจาก scope ปัจจุบัน
- **Onsite courses** (STAGE, BLUEPRINT, FRONTIER) ใช้ sessionCode — Phase 2 สร้างระบบแยก

---

*อัปเดตล่าสุด: พ.ค. 2026 — วิเคราะห์จากโค้ด creatr365-academy-main + 6course-quiz-main + Supabase schema*
