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

---

## 🆕 PHASE 3 — Admin Flow Repair (ยืนยันจริงจาก Supabase Live DB, 31 ส.ค. 2026)

> เขียนจากการต่อ Supabase MCP เข้ากับ project จริง (`exybvjqjdqxonhesydหk`) โดยตรง
> ตรวจ schema / RLS policy / storage bucket / auth.users จริงทุกจุดก่อนแก้โค้ด — ไม่มีการเดา
> อ่าน README.md (กฎหลักของระบบ) ทั้งหมดก่อนแตะโค้ดทุกไฟล์

### สาเหตุหลักที่ทำให้ "Admin ใช้งานไม่ได้ทุกหน้า" (ยืนยันด้วยข้อมูลจริง)

1. **`user_roles` ว่างเปล่า 100%** — ไม่มีใครเป็น admin เลยมาก่อน ดังนั้น `has_role(auth.uid(),'admin')` คืนค่า `false` เสมอสำหรับทุกคน → RLS บล็อกการเขียนข้อมูลทุกตารางที่ผูก admin policy (`courses`, `course_modules`, `course_resources`, `articles`, `promo_codes`, `user_roles`) อย่างเงียบๆ นี่คือสาเหตุที่อัปโหลดเอกสารคู่มือไม่ได้ — **ไม่ใช่บั๊กของโค้ดอัปโหลด** โค้ดถูกต้องอยู่แล้ว
   - ✅ **แก้แล้ว**: เพิ่ม `rabbitty.jenny@gmail.com` (user_id `87aa1fee-ade9-4b91-8c58-140d209fae61`) เป็น `admin` ใน `user_roles` จริงแล้ว (ยืนยันโดยผู้ใช้เลือกเองผ่าน AskUserQuestion จากรายชื่อ user จริง 6 คนใน `auth.users`)
2. **Route guard ไม่ครบทุกหน้า** — `AdminCourses.tsx`, `AdminAssignments.tsx`, `AdminPayments.tsx` มีคอมเมนต์อ้างว่า "Auth + admin role enforced centrally by `<RequireAdmin>` in App.tsx" แต่ **component นี้ไม่เคยถูกสร้างจริง** และ `App.tsx` ก็ไม่มี wrapper ใดๆ — สามคนหน้านี้จึง render ให้ใครก็ได้แม้ไม่ login (ข้อมูลจะว่าง/error เพราะ RLS แต่ UI โผล่มาเฉยๆ ดูเหมือน "ใช้งานไม่ได้") ส่วน `/admin` และ `/admin/articles` มี inline auth check ของตัวเอง (คนละแบบ คนละที่) ทำให้พฤติกรรมแต่ละหน้าไม่ตรงกัน
   - ✅ **แก้แล้ว**: สร้าง `src/components/admin/RequireAdmin.tsx` เป็น guard กลางจริงตามที่คอมเมนต์เดิมตั้งใจไว้ และ wrap ทั้ง 5 route (`/admin`, `/admin/courses`, `/admin/articles`, `/admin/assignments`, `/admin/payments`) ใน `src/App.tsx` ด้วย component เดียวกัน ลบ inline auth check ซ้ำซ้อนออกจาก `Admin.tsx` และ `AdminArticles.tsx` แล้ว (กัน mount กระพริบ/race กับ guard ใหม่)
3. **RLS policy ของทุกตารางที่ตรวจสอบถูกต้องอยู่แล้ว** — ไม่ต้องแก้ policy ใดๆ ทั้งสิ้น (`courses`, `course_modules`, `course_resources`, `articles`, `user_roles`, storage `course-resources` bucket) ทุกจุดอิง `has_role(auth.uid(),'admin')` ถูกแบบแผนแล้ว
4. **`course_resources` table + storage bucket `course-resources` (private) มีอยู่จริงใน production** ตรงกับโค้ด upload ใน `AdminCourses.tsx` และโค้ด download (signed URL) ใน `Dashboard.tsx` ทุกจุด — ฟีเจอร์ "แนบเอกสารคู่มือมากับคอร์ส" **มีอยู่แล้วและถูกต่อสายไว้ครบ** ปัญหาที่แท้จริงคือข้อ 1 (ไม่มี admin) เท่านั้น

### ⚠️ ความเสี่ยงที่พบระหว่างตรวจ (ต้องระวังก่อนแตะ DB ครั้งต่อไป)

- `supabase_migrations.schema_migrations` บน production **ว่างเปล่า** (list_migrations คืนค่า `[]`) — schema ปัจจุบันทั้งหมดถูกสร้างผ่าน SQL Editor/Dashboard โดยตรง ไม่ใช่ผ่าน CLI migration เลย ไฟล์ `.sql` 25 ไฟล์ใน `supabase/migrations/` **ไม่เคยถูก apply แบบ tracked จริง**
  **ห้ามรัน `supabase db push` หรือ `supabase db reset` ใส่ project นี้โดยไม่ reconcile ก่อน** — จะพยายาม replay migration ทั้งหมดทับ schema จริงที่มีอยู่แล้วและมีโอกาสสูงที่จะ error หรือสร้างข้อมูลซ้ำ/ชนกัน
- `course_resources` ไม่มีไฟล์ migration คู่กันเก็บไว้ใน repo (มีจริงใน DB แต่ไม่มีประวัติในโค้ด) — เป็นตัวอย่างของ drift ที่ต้อง reconcile ทีหลัง
- **กฎการทำงานต่อจากนี้**: ก่อนเชื่อว่าตาราง/RLS/bucket ใดๆ "มีหรือไม่มี" ให้ต่อ Supabase MCP (`list_tables`, `execute_sql`, `get_advisors`) ตรวจของจริงก่อนเสมอ ห้ามอ้างอิงแค่โฟลเดอร์ `supabase/migrations/` เพราะไม่ตรงกับ production

### ไฟล์ที่ลบแล้วในรอบนี้ (ยืนยันว่าไม่มีที่ไหน import ก่อนลบ + build ผ่านหลังลบ)

ทั้งหมดคือไฟล์อ้างอิง/สำรองที่ user ระบุไว้ว่า "เก็บไว้เผื่อแก้แต่ต้องลบออก" — ไม่ใช่ส่วนหนึ่งของแอปที่รันจริง (`index.html` ชี้ที่ `/src/main.tsx` เท่านั้น ไฟล์ที่ root ไม่เคยถูก Vite แตะเลย):

- Root-level: `AdminCourses.tsx`, `AdminScreen.jsx`, `Creatr365_LMS_v2.jsx`, `Home.tsx`, `FreeModuleScreen.jsx`, `freeModules.js`
- `src/**/*_before*`, `Dashboard_1.tsx`, `Auth._before.tsx`, `client_befor.ts` — สำเนาสำรองซ้ำกับไฟล์ใช้งานจริง
- `src/data/integrations/supabase/` (ทั้งโฟลเดอร์) — copy ซ้ำของ `src/integrations/supabase/` ที่ไม่มีการ import จากที่ไหนเลย

### อื่นๆ ที่แก้ในรอบนี้

- Regenerate `src/integrations/supabase/types.ts` จาก live schema จริงผ่าน Supabase MCP — แก้ TypeScript error 4 จุดที่ type เดิมไม่รู้จัก `ensure_master_student_account` และ `link_line_master_student_account` (RPC ที่มีอยู่จริงใน DB แต่ type เก่าไม่เคย regenerate)
- Dashboard.tsx: เพิ่มปุ่ม "Admin Console" ที่ header **เฉพาะเมื่อ** `isCurrentUserAdmin()` เป็นจริง — ลิงก์ออกไป `/admin` เท่านั้น ไม่มีการ render UI จัดการ Admin ซ้ำในหน้านักเรียนเลย (Admin Console เป็นคนละ layout อยู่แล้วจาก `AdminLayout.tsx`) → ตอบโจทย์ "แยกหน้าตา dashboard ไม่ให้ซ้ำซ้อน" โดยกระทบโค้ดเดิมน้อยที่สุด
- ตรวจแล้ว: `npm run build` ผ่าน, `npx tsc --noEmit` ผ่าน 0 error, `eslint` ไม่มี error ใหม่ที่เกิดจากรอบนี้ (เทียบด้วย `git stash` แล้วรัน eslint ซ้ำ ได้ error/warning จำนวนเท่าเดิมทุกจุด)

### สิ่งที่ยังไม่ได้ทำ — สำหรับรอบทำงานถัดไป (AI หรือทีม dev คนใหม่อ่านตรงนี้ก่อนเริ่ม)

#### 🔴 ต้องทำต่อทันที
- [ ] Login จริงด้วย `rabbitty.jenny@gmail.com` ที่เว็บ production แล้วไล่เข้าทุกหน้า `/admin`, `/admin/courses`, `/admin/articles`, `/admin/assignments`, `/admin/payments` เพื่อยืนยัน `RequireAdmin` ทำงานถูกต้องแบบ end-to-end (รอบนี้ยืนยันได้แค่ระดับ RLS/DB + build/typecheck เพราะไม่มี password ของบัญชีจริงให้ทดสอบผ่านเบราว์เซอร์)
- [ ] ทดสอบอัปโหลดเอกสารคู่มือจริงที่ `/admin/courses` → แท็บ "resources" ว่า insert ผ่านแล้วหลังมี admin role
- [ ] เก็บ SQL ตั้ง admin เพิ่ม (ด้านล่าง) ไว้ใน runbook ของทีม ให้ทำเองได้โดยไม่ต้องพึ่ง AI ทุกครั้ง

#### 🟡 หนี้ทางเทคนิค (ไม่กระทบผู้ใช้ตอนนี้ แต่เสี่ยง deploy พังในอนาคต)
- [ ] Reconcile migration history ระหว่าง repo (25 ไฟล์ที่ไม่เคย apply แบบ tracked) กับ production จริง — ตัดสินใจว่าจะ baseline ด้วย `supabase migration repair` หรือเขียน migration snapshot ใหม่ทั้งหมดแล้ว mark เป็น applied ห้ามรัน `db push`/`db reset` ก่อนทำขั้นนี้
- [ ] เพิ่ม migration file ที่ขาดสำหรับ `course_resources` table + `course-resources` bucket + policies ให้ตรงกับของจริงใน production

#### 🟢 Feature ที่ user ขอเพิ่ม — ต้องออกแบบต่อ (ยังไม่ทำในรอบนี้ เพราะต้อง "เข้าใจภาพรวมก่อน" ตามกฎ README ข้อ 24–25 และต้อง confirm requirement ก่อนสร้างตาราง/schema ใหม่)

**1. หน้าบทความ (Articles) — แบ่ง section ระดับมืออาชีพ**
สถานะจริงที่ตรวจแล้ว: ตาราง `articles` มี column `kind` (`blog`/`news`/`update`/`tool`/`community`/`quiz`) และ `target_url` อยู่แล้วในทั้ง DB และโค้ด `AdminArticles.tsx` — โครงข้อมูลรองรับ "การ์ดลิงก์เครื่องมือ" (kind=`tool` + `target_url`) ไว้แล้ว แต่หน้า `/articles` (`Articles.tsx`) ยังไม่ได้แยก section ตาม `kind` (ต้องเปิดไฟล์นี้ตรวจก่อนแก้ในรอบหน้า — ยังไม่ได้เปิดดูในรอบนี้)

จากการค้นคว้า pattern ที่ใช้จริงในระดับสากล (Content Hub / Topic Matrix — Webflow, Neil Patel, Portent):
- แยกเป็น 3 โซนตามพฤติกรรมผู้ใช้ ไม่ผสมเป็น feed เดียว: (1) Pillar/Featured บทความ pin บนสุด (2) Cluster — จัดกลุ่มบทความปกติตาม `kind` (blog/news/update/community) (3) Tools & Resources — `kind='tool'` render เป็น grid การ์ดเมนูแยกต่างหาก เพราะพฤติกรรมต่างกัน (บทความ=อ่าน, tool=คลิกออกไปใช้งานทันที)
- แนะนำ: เพิ่ม tab/filter บน `Articles.tsx` ตาม `kind`, ทำโซน Tools เป็น grid การ์ดอยู่บนสุดหรือ sidebar แยกจาก list บทความ — ไม่ต้องสร้างตารางใหม่ ใช้ `kind`/`target_url` ที่มีอยู่แล้วได้เลย
- Sources: [Choosing blog/resource center/content hub – Webflow](https://webflow.com/blog/choosing-blog-resource-center-content-hub), [How to Create a Content Hub – Neil Patel](https://neilpatel.com/blog/what-is-a-content-hub/), [Content Hub Types – Portent](https://portent.com/blog/content/how-to-choose-a-content-hub-types-and-examples.htm)

**2. ระบบส่งงาน/สอบ + รหัสคลาสเรียน Onsite**
ตรวจตาราง `assignments` จริงแล้ว: มีแค่ `video_url`, `note`, `status`, `score`, `module_id` — **ไม่มี column สำหรับ "รหัสคลาสเรียนวันจริง" (session/attendance code) อยู่เลย** สิ่งที่ user เรียกว่า "วางโครงไว้แล้ว" คือ `courses.learning_type` (`offline`/`online`/`hybrid`) เท่านั้น ซึ่งเป็นแค่ flag ประเภทคอร์ส ไม่ใช่ระบบรหัสจริง
→ ต้องออกแบบใหม่ทั้งหมด (ตาราง `session_codes` หรือ column `assignments.session_code`, หน้า Admin ออกรหัสต่อรอบเรียน, หน้านักเรียนกรอกรหัสแทนอัปโหลดวิดีโอเมื่อ `learning_type='offline'`)
→ **ต้องถามผู้ใช้ก่อนสร้าง schema ใหม่**: รหัสใช้ครั้งเดียวต่อคนหรือต่อรอบ? หมดอายุเมื่อไหร่? ใครเป็นคนออกรหัส (admin ต่อคลาส หรือ fix ต่อคอร์ส)? — ห้ามเดาแล้วสร้างตารางเอง

**3. Dashboard แยก Admin/Student**
ทำแล้วบางส่วนพอสำหรับตอนนี้ (ปุ่ม "Admin Console" ใน header ของ `Dashboard.tsx` เมื่อเป็น admin) — Admin Console เป็นคนละ layout (`AdminLayout.tsx`) อยู่แล้ว จึงไม่ซ้ำซ้อนตามที่ user ขอ ไม่ต้องสร้างระบบใหม่เพิ่ม

**4. Research pattern สากลอื่นที่ยึดแกนเราเป็นหลัก แล้วดึงมาปรับใช้**
- ระบบเรามี RBAC (`user_roles` + `has_role()`) ตรงกับ best practice ของ LMS สากลอยู่แล้ว (role แยกจาก permission, ตรวจผ่าน RPC ฝั่ง DB ไม่ใช่ client-side) สิ่งที่ขาดคือ "การกำหนดสิทธิ์จริง" (แก้แล้วในรอบนี้) ไม่ใช่ตัวสถาปัตยกรรม — **ไม่ต้อง rebuild ระบบสิทธิ์ใหม่**
- แนะนำระยะยาวเท่านั้น (ยังไม่จำเป็นตอนนี้เพราะมี admin คนเดียว): เพิ่ม role ระดับกลาง เช่น `instructor` (ตรวจงาน/ข้อสอบได้ แต่แก้ราคา/course ไม่ได้) ถ้าทีมโตขึ้น ตาม principle of least privilege
- Sources: [Role-Based Access Control in LMS – The Learning OS](https://www.thelearningos.com/enterprise-knowledge/role-based-access-control-in-lms-a-comprehensive-guide), [Managing User Roles in LMS – eLearning Industry](https://elearningindustry.com/best-practices-for-managing-user-roles-and-permissions-in-your-lms)

### วิธีตั้ง Admin เพิ่มในอนาคต (ทำเองได้จาก Supabase SQL Editor โดยไม่ต้องพึ่ง AI)

ต้องเป็น email ที่สมัครในระบบไว้แล้วเท่านั้น (ห้ามสร้าง user ใหม่ผ่านทางนี้):

```sql
-- ตั้งสิทธิ์ admin ให้ผู้ใช้ที่มีอยู่แล้ว
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'ใส่อีเมลตรงนี้'
on conflict do nothing;

-- ตรวจสอบว่าใครเป็น admin อยู่บ้างในระบบตอนนี้
select u.email, ur.role, ur.created_at
from public.user_roles ur
join auth.users u on u.id = ur.user_id;
```

### ไฟล์ที่แก้ในรอบนี้ (สรุปสำหรับ dev คนถัดไป)

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| Supabase `user_roles` (live DB) | insert admin role ให้ rabbitty.jenny@gmail.com |
| `src/components/admin/RequireAdmin.tsx` | **ไฟล์ใหม่** — guard กลางสำหรับทุก /admin/* route |
| `src/App.tsx` | wrap ทั้ง 5 admin route ด้วย `<RequireAdmin>` |
| `src/pages/Admin.tsx` | ลบ inline auth check ซ้ำซ้อน (ใช้ guard กลางแทน) |
| `src/pages/AdminArticles.tsx` | ลบ inline auth check ซ้ำซ้อน (ใช้ guard กลางแทน) |
| `src/pages/Dashboard.tsx` | เพิ่มปุ่ม "Admin Console" เมื่อ user เป็น admin |
| `src/integrations/supabase/types.ts` | regenerate จาก live schema จริง |
| ไฟล์ตายที่ลบ (ดูรายชื่อด้านบน) | ลบเพราะไม่มีการ import จริงในระบบ build เลย |
