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

---

## 🆕 PHASE 3.1 — แก้คอร์สฟรี "Course price not configured" (ยืนยันจริง, 31 ส.ค. 2026)

### สาเหตุ (ยืนยันจาก production code จริงใน edge function `create-checkout`)

`supabase/functions/create-checkout/index.ts` parse ราคาจาก `course.price` (string) เป็นตัวเลขก่อนเสมอ แล้ว throw `"Course price not configured"` ทันทีถ้า parse ได้ `0` หรือ parse ไม่ได้ — โดยเช็คนี้เกิด**ก่อน**จะเช็คว่าคอร์สนี้ควรฟรีหรือไม่ ตรวจ DB จริงพบว่าคอร์ส `magnet` (MAGNET — LIVE COMMERCE BLUEPRINT) มี `price: "0"` และไม่มีสถานะ "free" ให้เลือกเลยใน dropdown ของ Admin (มีแค่ `now_open / coming_soon / fully_booked / draft / archived`) — เป็นบั๊กเดียวกับที่ผู้ใช้เจอตอนกดซื้อ

โค้ดใน `src/pages/Courses.tsx` (หน้ารวมคอร์ส) เขียน comment ไว้ล่วงหน้าอยู่แล้วว่า **"a future 'free' vs paid split lives in price/status, not here"** — แปลว่าคนออกแบบระบบเดิมตั้งใจให้ `status` เป็นจุดขยายสำหรับสถานะ free อยู่แล้ว เพียงแต่ยังไม่มีใครเพิ่มค่า `free` เข้าไปจริง

### แก้แล้ว

1. **`src/pages/AdminCourses.tsx`** — เพิ่ม `{ value:'free', label:'Free (เรียนฟรี)' }` ใน `STATUS_OPTIONS` (คอลัมน์ `courses.status` เป็น free-text ไม่มี CHECK constraint ในฐานข้อมูลจริง — ยืนยันแล้ว จึงไม่ต้องแก้ schema)
2. **`src/pages/Courses.tsx`** — เพิ่ม badge `FREE` ใน `STATUS_META` ให้ตรงกับสถานะใหม่
3. **`supabase/functions/create-checkout/index.ts`** — ย้ายการเช็ค `course.status === "free"` ไปไว้**ก่อน**การ parse ราคา ถ้าเป็น free ให้ข้ามไป insert `course_enrollments` สถานะ `free` ทันที (path เดิมที่มีอยู่แล้วสำหรับโปรโมโค้ด `discount_type='free'`) — ไม่ต้องผ่าน Stripe เลย ตรงกับที่ผู้ใช้ขอ: "ถ้าสถานะ free เมื่อกดซื้อ ควรดึงบทเรียนเข้าแดชบอร์ดทันที ไม่ต้องรอ payment success" — **deploy ขึ้น production แล้ว** (version 6 ของ edge function)
4. **`src/pages/CourseDetail.tsx`, `src/pages/Enroll.tsx`** — แก้การแสดงราคาจากการโชว์เลข `"0"` ตรงๆ (ตามภาพหน้าจอที่แนบ) ให้แสดง "ฟรี" แทน เมื่อ `status==='free'` หรือราคาว่าง/เป็น "0"; ซ่อนข้อความ "ชำระผ่าน Stripe / PCI DSS" ในหน้า Enroll เมื่อคอร์สฟรี (ไม่เกี่ยวกับ Stripe จริงๆ ในเคสนี้)
5. **แก้ข้อมูลจริงที่พังอยู่**: อัปเดต `courses.status = 'free'` ให้คอร์ส `magnet` (id `0c4a7138-...`) ใน production แล้ว ตอนนี้กดซื้อได้จริงไม่ error

### หมายเหตุ

- `stripe_price_id` ของ `magnet` ยังเป็นค่าเก่า `"free_magnet01"` ที่ admin เคยพิมพ์ไว้เป็น workaround ก่อนหน้านี้ — ตรวจแล้วว่าไม่มีจุดไหนในโค้ดอ่านค่านี้จริง (ไม่ถูกใช้ในการคำนวณ Stripe เลย) จึงปล่อยไว้ได้ ไม่กระทบอะไร
- ตรวจแล้ว: `npm run build`, `npx tsc --noEmit` ผ่านหมดหลังแก้

---

## 🆕 PHASE 2 — ข้อมูลจริงจาก Google Sheets (ต้นทางเดิมของระบบเรียน) — ค้นคว้าแล้ว 31 ส.ค. 2026

> ผู้ใช้ถามว่าคำเตือนเรื่อง "production ไม่มี migration history ที่ track จริง" เกี่ยวกับ `6course-quiz` repo หรือ Google Sheets ไหม
> **คำตอบ: ไม่เกี่ยวกันโดยตรง** คำเตือนนั้นพูดถึง Postgres schema ของเว็บหลัก (`courses`, `articles` ฯลฯ) ส่วน Google Sheets ที่กล่าวถึงด้านล่างคือฐานข้อมูลเดิมของฝั่ง **LMS** (`6course-quiz`) ที่เชื่อมผ่าน Google Apps Script — เป็นคนละระบบ คนละฐานข้อมูลตามที่ README ข้อ 2 ระบุไว้อยู่แล้ว (LMS แยกจาก Main Web) — แต่เป็นแหล่งข้อมูลจริงที่ควรใช้อ้างอิงตอนสร้างระบบสอบ/rubric ใน Supabase ในเฟส 2
> **หมายเหตุ**: session นี้ยังไม่ได้ attach repo `6course-quiz` (อยู่นอก scope ที่ได้รับอนุญาตตอนนี้) — ยังไม่ได้เปรียบเทียบกับโค้ดจริงของ LMS ถ้าต้องการให้ตรวจ ให้แจ้งเพื่อ add repo เพิ่ม

ค้นและอ่านไฟล์จริงใน Google Drive (บัญชี hello.livestreamers@gmail.com) ครบทั้ง 3 ไฟล์ที่ผู้ใช้ระบุ (ไม่รวมไฟล์ export .csv ปลีกย่อยที่เป็นแค่ snapshot ของแท็บเดียวกัน):

| ไฟล์ | สถานะ | สรุปเนื้อหาจริงที่อ่านแล้ว |
|---|---|---|
| `Creatr365_Master_Database` (Google Sheet) | อ่านครบ (413 บรรทัด) | แท็บ Quiz_Bank: **110 คำถามจริง**, แบ่งเป็น 7 กลุ่ม `QG-01`ถึง`QG-07`, 3 phase (`Pre`/`During`/`Post`), **2 ชุดข้อสอบ (`Set A`, `Set B`) มีอยู่แล้วจริง** — ตรงกับที่ผู้ใช้คาดว่า "น่าจะมีอย่างน้อย 2 ชุด" คอลัมน์ครบ: Q_ID, QG, Bloom_Level, Choice A-D, Answer, Answer_Explain, Skill_Tag, Is_Diagnostic, Recommended_Course, Pass_Criteria, Progression_Level |
| `rubric_master` (Google Sheet) | อ่านครบ | **16 rubric** (RUB-01 ถึง RUB-16) แต่ละอันมีเกณฑ์ 4 ระดับ (Professional/Competent/Developing/Rookie) ต่อมิติ, ตาราง Pass Criteria ครบทั้ง 6 คอร์ส, ตาราง KPI Master Reference (Conversion Rate, Watch Time ตามระดับ, Live Health Score ฯลฯ), ตาราง Progression Model 5 ระดับ (STARTER→MASTER) |
| `Creatr365_Learning_Flow_v3 (1).xlsx` | อ่านครบ | Flow ปฏิบัติการแบบละเอียดทีละขั้นของทั้ง 6 คอร์ส (ใครทำ/เกณฑ์ผ่าน/error path ถ้าไม่ผ่าน) รวมตารางเวลา Onsite จริงเป็นนาทีสำหรับ STAGE/BLUEPRINT/FRONTIER, จุดที่ต้องมีคนตรวจ (Human Gate) vs ระบบตรวจเอง (Auto), จุดเชื่อม LINE OA/Telegram/Make.com |

### ข้อสรุปสำคัญสำหรับเฟส 2

1. **ข้อมูลใน Google Sheets สมบูรณ์กว่า Supabase มาก** ตามที่ผู้ใช้บอกจริง — ตาราง `course_quizzes`/`quiz_questions` ใน Supabase มีอยู่แล้วแต่ว่างเปล่า 100%
2. **Schema ของ `course_quizzes` ถูกออกแบบไว้ล่วงหน้าให้รองรับโครงสร้างนี้อยู่แล้ว** (ยืนยันจาก live schema): มีคอลัมน์ `qg_code`, `phase`, `pass_threshold`, `source_ref` ตรงกับคอลัมน์ `QG`, `Phase`, `Pass_Criteria` ใน Quiz_Bank เป๊ะ — แปลว่าเวลาจะ import ไม่ต้องออกแบบตารางใหม่ ใช้ของเดิมได้เลย แต่ **`quiz_questions` ยังไม่มีคอลัมน์ `Set` (A/B)** ต้องเพิ่มก่อนถ้าจะรองรับการสุ่มสลับชุดข้อสอบ
3. **ระบบรหัสคลาส Onsite**: ยืนยันจาก Learning_Flow_v3 ว่า STAGE/BLUEPRINT/FRONTIER onsite ใช้ trainer ประเมินสด (Rubric) + TikTok API ดึง KPI จริง ไม่ได้ใช้ "รหัสกรอกในคลาส" แบบที่เข้าใจไว้ก่อนหน้า — สิ่งที่ตารางนี้เรียกว่า "Human Gate" คือทีมกรอกผลใน Sheets เอง ไม่ใช่นักเรียนกรอกรหัส **ต้องคุยกับผู้ใช้เพิ่มก่อนออกแบบ** ว่า "รหัสคลาสเรียนวันจริง" ที่ต้องการคือกลไกใหม่ที่ไม่เคยมีในระบบเดิมเลย หรือหมายถึงการแปลง flow ของ Trainer ในนี้ให้เป็นฟอร์มใน Admin
4. **ยังไม่ implement อะไรในรอบนี้ตามที่ผู้ใช้ขอ** — ส่วนการเรียน/สอบให้ใช้ของเดิม (Google Sheets + Apps Script) ไปก่อน รอ Phase 2 ค่อยออกแบบการ import เข้า Supabase อย่างเป็นระบบ พร้อม mapping ตาราง `quiz_questions`/`course_quizzes`/`assignments` ให้ตรงกับ 4 ไฟล์นี้

### สิ่งที่ต้องทำในเฟส 2 (เพิ่มจากที่ระบุไว้ก่อนหน้า)

- [ ] คุยรายละเอียดกับผู้ใช้ก่อนสร้าง schema: ระบบสุ่มสลับข้อสอบ (ใช้ `Set A`/`Set B` ที่มีอยู่แล้วสลับกันทุกครั้งที่เข้าสอบ), กลไก "รหัสคลาสเรียนวันจริง" ที่ต้องการจริงๆ คืออะไร (ไม่มีอยู่ในระบบเดิมเลย เป็นฟีเจอร์ใหม่ทั้งหมด)
- [ ] ออกแบบ migration นำเข้าข้อมูลจาก Quiz_Bank (110 ข้อ) + rubric_master (16 rubric) เข้า `course_quizzes`/`quiz_questions` — ต้องเพิ่มคอลัมน์ `set_label` ใน `quiz_questions` ก่อน
- [ ] ถ้าต้องการเทียบกับโค้ด LMS จริง (`6course-quiz` repo) ต้องขอให้ attach repo เพิ่มในเซสชันก่อน (ตอนนี้ไม่อยู่ใน scope)

---

## 🆕 PHASE 3.2 — แก้ Admin แยกจาก Dashboard, Footer, Hover (31 ส.ค. 2026)

### แก้แล้ว + ยืนยันจริงด้วย headless browser (ไม่ใช่แค่ build ผ่าน)

**1. บั๊กลิงก์บทความใน Admin เด้งออกไป Dashboard ปกติ** — สาเหตุจริง: `AdminArticles.tsx` เป็นหน้าเดียวใน Admin ที่ยัง render `<CourseNavbar/>` (นาวบาร์สาธารณะของเว็บหลัก) ซึ่งมีลิงก์ "ห้องเรียน" ชี้ตรงไป `/dashboard` — ส่วนอีก 4 หน้า Admin ต่างก็มี header ของตัวเองคนละแบบ ไม่มี shell กลางเลย ทั้งที่มี `src/components/admin/AdminLayout.tsx` (sidebar shell) สร้างไว้แล้วแต่ไม่มีหน้าไหนเรียกใช้เลยสักหน้า
   - ✅ ย้ายทั้ง 5 หน้า Admin (`Admin.tsx`, `AdminCourses.tsx`, `AdminArticles.tsx`, `AdminAssignments.tsx`, `AdminPayments.tsx`) มาใช้ `AdminLayout` เดียวกันหมด ลบ header/nav-link ที่ซ้ำกันคนละแบบในแต่ละไฟล์ออก
   - ✅ ยืนยันจริงด้วย headless browser (Playwright): ทุกหน้า `/admin/*` ตอนนี้ redirect ไป `/auth?redirect=...` สะอาด ไม่มี error, ไม่มี `CourseNavbar`/ลิงก์ dashboard หลงเหลือใน Admin เลยสักจุด
   - เรื่อง "ข้อมูลที่แก้ใน Admin อัปเดตหน้าเว็บจริงไหม": ยืนยันแล้วว่าใช่ — ทุกหน้า Admin เขียนตรงเข้าตาราง Supabase เดียวกับที่ `/courses`, `/course/:slug`, `/articles`, `Dashboard` อ่าน ไม่มี data store แยกซ้อนที่ไหนเลย (ตรวจตั้งแต่ PHASE 3 แล้ว)

**2. Footer ลิงก์ไม่ทำงาน (นโยบาย/FAQ/ข้อกำหนด)** — สาเหตุจริง: `Footer.tsx` มีลิงก์ไป `/privacy`, `/terms`, `/refund-policy`, `/faq` มาตั้งแต่แรก และไฟล์หน้าเพจ (`Privacy.tsx`, `Terms.tsx`, `RefundPolicy.tsx`, `FAQ.tsx`) ก็มีอยู่แล้วในโค้ด แต่ **ไม่เคยถูกลงทะเบียน route ใน `App.tsx` เลยสักเส้นทาง** — กดแล้วเจอ 404 (NotFound) มาตลอด
   - ✅ เพิ่ม route ทั้ง 4 เส้นทางใน `App.tsx` แล้ว ยืนยันจริงว่าโหลดได้ถูกต้องพร้อม title ที่ถูกต้องทั้ง 4 หน้า

**3. Hover effect ไม่ตรงกับ visual system ที่แนบมา (แก้แบบขอบเขตจำกัดตามที่อนุมัติ)** — เจอบั๊กจริงใน `src/index.css` บรรทัด 419: มี selector `.site-hover-scope,` (ไม่มีเงื่อนไข) ไปรวมอยู่ใน comma-list เดียวกับ `.site-hover-scope [data-accent="blue"]` — ทำให้ **ทั้งเว็บไซต์** (เพราะ `.site-hover-scope` ครอบทั้งแอปใน `App.tsx`) ได้ค่าเริ่มต้น `--hover-accent` เป็นสีน้ำเงินแบบไม่มีเงื่อนไข ทั้งที่ไฟล์ `reference_visual_system.md` ที่แนบมาระบุชัดว่า System A (เว็บ/การตลาด) ต้องเป็นดำ-ขาว-แดงเข้มเท่านั้น (แดง ≤5% ใช้เน้นเท่านั้น ไม่มีน้ำเงิน/เหลือง/เขียวในระบบเลย) — บรรทัด 421-423 (red/yellow/green) ไม่มี catch-all แบบนี้ ยืนยันว่าเป็น typo ไม่ใช่ของตั้งใจ
   - ✅ ลบ `.site-hover-scope,` ที่หลงออกไป เหลือแค่ `.site-hover-scope [data-accent="blue"]` (ต้องมี `data-accent="blue"` จริงๆ ถึงจะได้สีน้ำเงิน ตรงกับแพทเทิร์นของสีอื่น)
   - ✅ เปลี่ยนค่า fallback สีเริ่มต้น (ตอนไม่มี `--hover-accent`/`--section-accent` มาจากที่ไหนเลย) จาก `--google-blue` เป็น `--google-red` ใน 6 จุด (`.hover-shift`, heading hover, `.site-hover-scope` generic text hover, `.nav-link` x2, `.btn-brand`) — เป็น fallback ตัวสุดท้ายเท่านั้น
   - **ไม่ได้แตะ**: ทุกจุดที่ตั้งใจใส่ `data-accent="blue|yellow|green"` ไว้อย่างชัดเจน (เช่น "หน้าแรก" ในนาวบาร์) ยังเป็นสีเดิมทุกจุด — ตามที่อนุมัติไว้ว่า "แก้เฉพาะจุดที่ผิดชัดเจนก่อน" ไม่ใช่ recolor ทั้งเว็บ
   - ✅ ยืนยันจริงด้วย Playwright: hover element ที่ไม่มี accent ใดๆ เลยตอนนี้ได้สี `rgb(195,1,40)` (แดงตามแบรนด์) แทนที่จะเป็นน้ำเงิน, ส่วน "หน้าแรก" (data-accent="blue" ตั้งใจ) ยังเป็นน้ำเงินเหมือนเดิมไม่เปลี่ยน — ไม่มี regression
   - พบไฟล์ `src/index-no-motioneffect.css` ที่มีบั๊กเดียวกัน (`.site-hover-scope,` เดียวกัน) แต่ไฟล์นี้**ไม่ได้ถูก import ที่ไหนเลยในระบบ** (เป็นไฟล์ตายเหมือนไฟล์ `_before` อื่นๆที่เคยลบไปแล้ว) — ยังไม่ได้ลบในรอบนี้ ทิ้งไว้ให้ตัดสินใจว่าจะลบทีหลัง

### ยืนยันแล้ว (ยังไม่ implement — รอ go-ahead ให้เริ่มสร้างจริง)

**ระบบรหัสปลดล็อคคอร์ส Onsite** — ผู้ใช้ยืนยันโจทย์แล้ว: คอร์ส onsite (STAGE, BRAND HOST ARCHITECT) ซื้อแล้วเนื้อหายังไม่เปิด ต้องรอรหัสจากผู้สอนในวันเรียนจริงก่อนถึงจะปลดล็อคได้ และยืนยัน**ทิศทางออกแบบแล้ว**: ให้ออกรหัส **ต่อวันเรียน/รอบ ไม่ใช่รหัสเดียวทั้งคอร์ส** (เพราะ BRAND HOST ARCHITECT เรียน 2 วัน ถ้าให้รหัสเดียวทั้งคอร์สนักเรียนจะเห็นเนื้อหาวันที่ 2 ได้ตั้งแต่วันแรก)

สิ่งที่ต้องออกแบบต่อก่อนเริ่มสร้างจริง (ยังไม่ได้ทำ — เป็น net-new feature ต้องแก้ schema, admin UI, student UI):
- [ ] ตาราง/คอลัมน์ใหม่สำหรับเก็บรหัสต่อวัน/รอบ ผูกกับ `course_modules` หรือสร้างตารางใหม่ (เช่น `session_codes`: course_id, session_label, code, valid_date, created_by) — ยังไม่ตัดสินใจ schema แน่นอน
- [ ] Admin UI: หน้าจอให้ผู้สอนออกรหัสต่อวัน/รอบ (ออกก่อนวันเรียน หรือออกสดในวันเรียน?)
- [ ] Student UI: จุดกรอกรหัสใน Dashboard/หน้าเรียน เพื่อปลดล็อคเนื้อหาของวันนั้น
- [ ] นโยบายหมดอายุของรหัส (ใช้ได้แค่วันนั้น? ใช้ซ้ำได้ในรอบถัดไปของคอร์สเดียวกันไหม เพราะมีหลายรอบ/หลาย batch)
- [ ] ความปลอดภัย: ป้องกันเดารหัส/แชร์รหัสข้ามคน (rate limit, ผูกกับ enrollment ของคนนั้น)
- **ยังไม่เริ่มสร้าง** ตามที่ผู้ใช้ระบุว่าเป็นส่วนที่ต้องเจาะลึกและยังไม่เร่งด่วนเท่า Admin flow — รอ confirm รายละเอียดข้างต้นก่อนเขียน migration/โค้ดจริง

---

## 🆕 PHASE 3.3 — บทความ 404, Navbar/Logo, WHY section (31 ส.ค. 2026)

> ผู้ใช้แก้ `Home.tsx` เองโดยตรงบน GitHub (5 commit) เพิ่มระบบ motion (`useSceneReveal`, `data-scene`, `MOTION_CSS`) และอัปเดตข้อความ WHY ก่อนรอบนี้ — ดึงมาทำงานต่อจาก `origin/main` แล้ว ไม่ได้ทับของที่แก้เอง

### แก้แล้ว + ยืนยันด้วย headless browser จริง

1. **บทความ 404 ทั้งที่ Admin ตั้งเผยแพร่แล้ว** — สาเหตุจริง: `ArticleDetail.tsx` เขียนไว้ถูกต้องสมบูรณ์ (query, RLS, render) แต่ **ไม่เคยถูก import หรือลงทะเบียน route `/articles/:slug` ใน `App.tsx` เลย** — บั๊กคลาสเดียวกับ footer routes ที่เจอรอบก่อน (component พร้อมใช้แต่ไม่มีใครต่อสาย) เพิ่ม route แล้ว ตรวจ query ที่ยิงจริง (`?slug=eq.amazon-live&is_active=eq.true`) ตรงกับข้อมูลจริงในตาราง (`is_active:true`) ทุกประการ — ยืนยันไม่ได้ว่าเนื้อหาแสดงจริงในรอบนี้เพราะ sandbox บล็อก network ขาออกไป Supabase จาก headless browser (`ERR_TUNNEL_CONNECTION_FAILED`) แต่ route/query ถูกต้อง 100% ตามข้อมูลจริงที่ตรวจแล้ว
2. **Navbar สีขาวค้างอยู่ในหน้า Home** — สาเหตุจริง: `CourseNavbar` ใช้ CSS variable `--background` ที่สลับดำ/ขาวผ่านการ toggle class `.dark` บน `<html>` (หน้าอื่นเช่น Contact, Articles ทำ toggle นี้อยู่แล้วในหน้าตัวเอง) แต่ `Home.tsx` ไม่เคย toggle เลย — เพิ่ม `classList.add('dark')` ให้ Home ตามแพทเทิร์นเดียวกับหน้าอื่น ยืนยันจริงว่า navbar เป็นสีดำแล้ว (`rgba(13,13,13,.85)`) โดยไม่กระทบหน้า Courses/DiagnosticQuiz ที่ยังขาวตามเดิม (`rgba(255,255,255,.85)`)
3. **โลโก้ navbar 2 แบบตามธีม** — เพิ่มโลโก้ 2 ตัวใน `CourseNavbar.tsx` (`w-logo-side.png` สำหรับหน้าดำ, `C365-Logo1_1 (2).png` ขนาดใหญ่ขึ้น `h-12` สำหรับหน้าขาว) สลับด้วย CSS ล้วน (`.navbar-logo-dark`/`.navbar-logo-light` + `.dark` selector) ไม่ใช้ JS เช็คธีม เพื่อไม่ให้ชนกับ timing ของ effect ที่ toggle dark class ในแต่ละหน้า — ยืนยันด้วย computed style ว่าเลือกโลโก้ถูกฝั่งในทั้งสองกรณี **ไม่สามารถยืนยันภาพจริงได้ในรอบนี้เพราะ sandbox บล็อกโดเมน `ik.imagekit.io`** (`ERR_TUNNEL_CONNECTION_FAILED`) — URL ที่ใช้ตรงกับที่ผู้ใช้ระบุทุกตัวอักษร รบกวนช่วยดูภาพจริงบน preview อีกทีค่ะ
4. **ตาราง WHY section** — ลบไอคอน ✓/✗ ออกแล้ว, เพิ่มขนาดฟอนต์จาก `clamp(12px,1.3vw,14px)` เป็น `clamp(14px,1.6vw,17px)`, เพิ่มปุ่มเป็น 2 ปุ่มด้านล่างให้สมมาตร (ปุ่มซ้าย outline / ปุ่มขวา fill แดง ตามภาพตัวอย่างที่แนบมา)
5. **Motion sequence section WHY** — ปรับลำดับ `data-aos-delay` ให้เป็น: กรอบตาราง+หัวตาราง (delay 0) → heading "WHY [โลโก้] DIFFERENCE?" (delay 200) → แต่ละแถวข้อความ 2 ฝั่งพร้อมกัน (delay 320 เพิ่มทีละ 110ms ต่อแถว) โดยไม่ย้าย DOM/เปลี่ยน layout เลย ใช้ประโยชน์จากที่ AOS แต่ละ element trigger อิสระจากกัน — ทำเฉพาะ section WHY ตามที่ผู้ใช้ระบุ (ไม่ได้ทำ pattern นี้กับอีก 12 section)

### ยังไม่ได้ทำ / ต้องดูภาพจริงก่อนสรุป

- **ฟอนต์หัวข้อ "Welcome to Creatr365's Family"**: ตรวจ computed style แล้วพบว่า font-family เดียวกับหัวข้ออื่นทุกจุดอยู่แล้ว (`Google Sans Flex, IBM Plex Sans Thai, ...`) ไม่มี override ที่ผิดที่ไหนในโค้ด — ใส่ fontFamily ให้ตรงชัดเจนเพิ่มเพื่อความชัวร์ แต่ **ไม่พบสาเหตุ CSS ที่ทำให้ต่างจากหัวข้ออื่นจริงๆ** เป็นไปได้ว่าเป็นเรื่อง "Google Sans Flex" โหลดไม่ติด (ไม่ใช่ฟอนต์ที่เปิดสาธารณะใน Google Fonts จริง ต้องตรวจสอบ) แล้ว fallback ไป IBM Plex Sans Thai ซึ่ง glyph ภาษาอังกฤษหน้าตาต่างจากฟอนต์ปกติ — ถ้ายังเห็นว่าแปลกอยู่หลัง deploy รบกวนแนบภาพชัดๆ มาเทียบจะตามได้ตรงจุดกว่านี้
- **ตรวจสอบขนาดฟอนต์ normal text ทุก section**: ยังไม่ได้ไล่ตรวจทั้ง 13 section อย่างละเอียด (แก้เฉพาะจุดที่ระบุชัดคือตาราง WHY) — ต้องขอภาพจริงหรือให้ระบุ section ที่เล็กเกินไปเพิ่มเติม
- **Motion pattern (bg→image→object→text) กับ section อื่น**: ผู้ใช้ระบุเจาะจงแค่ section WHY ในรอบนี้ ยังไม่ได้ทำกับ section อื่น

---

## 🆕 PHASE 3.4 — เปลี่ยนเมนูบาร์บนสุดเป็นภาษาอังกฤษ (31 ส.ค. 2026)

### สิ่งที่แก้

เปลี่ยน label ของเมนูบาร์บนสุด (ไม่แตะ `to` path ใดๆ เลย แก้แค่ข้อความที่แสดง):

| เดิม (ไทย) | ใหม่ (อังกฤษ) | ไปที่ |
|---|---|---|
| หน้าแรก | **HOME** | `/` |
| หลักสูตร | **EXPLORE** | `/courses` |
| แบบทดสอบ | **TEST YOURSELF** | `/articles/diagnostic-quiz` |
| บทความ | **COMMUNITY** | `/articles` |
| ติดต่อ | **C365** | `/contact` |
| ห้องเรียน (เห็นเมื่อ login แล้ว) | **MY STUDIO** | `/dashboard` |
| ออกจากระบบ (เห็นเมื่อ login แล้ว) | **SIGN OUT** | (ปุ่ม logout) |
| เข้าสู่ระบบ (เห็นเมื่อยังไม่ login) | **LOGIN** | `/auth` |

**เรื่อง "LOGIN / SIGN OUT / Register เปลี่ยนตาม authentication state"**: โครงสร้างโค้ดเดิม (ก่อนแก้) มีปุ่มเดียวที่สลับข้อความ+พฤติกรรมตามสถานะ login อยู่แล้ว (`user ? <ปุ่ม SIGN OUT> : <ปุ่ม LOGIN>`) — รอบนี้แค่เปลี่ยนข้อความจากไทยเป็นอังกฤษ ไม่ได้เพิ่มปุ่ม "Register" แยกใหม่ เพราะ **ในเมนูบาร์ไม่เคยมีปุ่ม Register แยกมาก่อน** (การสมัครสมาชิกอยู่ในหน้า `/auth`/`/register` ที่ปุ่ม LOGIN ลิงก์ไป) ตีความว่าผู้ใช้หมายถึง "หน้าที่ LOGIN ลิงก์ไปมีการสมัครสมาชิกรวมอยู่ด้วย" ไม่ใช่ต้องการปุ่ม Register แยกในเมนูบาร์ — **ถ้าต้องการปุ่ม Register แยกต่างหากในเมนูบาร์จริงๆ ต้องแจ้งเพิ่ม** เพราะเป็นการเปลี่ยนโครงสร้าง ไม่ใช่แค่เปลี่ยนข้อความ

### ไฟล์ที่แก้ — และทำไมต้องแก้ 2 ไฟล์

พบว่าเว็บมี **นาวบาร์ 2 ตัวที่ทำหน้าที่คล้ายกันแต่แยกไฟล์กัน**:

- `src/components/CourseNavbar.tsx` — ใช้แทบทุกหน้า (Home, Courses, Dashboard, Articles, Contact ฯลฯ)
- `src/components/Navbar.tsx` — ใช้เฉพาะหน้า Events (`Discover`, `MyEvents`, `CreateEvent`, `EditEvent`) มี behavior เฉพาะตัวคือพื้นหลังโปร่งใสตอนอยู่บนสุดแล้วเปลี่ยนเป็นกระจกขาวตอน scroll ลง (ปุ่ม/ไอคอนพื้นหลังทั้งหน้าจึงต่างจาก `CourseNavbar`)

เดิม label เป็นภาษาไทยเหมือนกันทุกตัวใน 2 ไฟล์นี้ (ก็อปกันมา) — รอบนี้แก้ label ให้ตรงกันเป็นภาษาอังกฤษทั้ง 2 ไฟล์ **แต่ไม่ได้รวมเป็นไฟล์เดียว** เพราะ `Navbar.tsx` มี scroll-transition behavior ที่ตั้งใจแยกไว้สำหรับหน้า Events โดยเฉพาะ (ไม่ใช่ของซ้ำซ้อนที่ควรลบทิ้งเฉยๆ) — ใส่ comment กำกับไว้ในทั้ง 2 ไฟล์แล้วว่าต้องแก้คู่กันถ้าจะเปลี่ยน label อีก เพื่อไม่ให้ label เพี้ยนกลับไปคนละภาษาแบบเดิมอีก

### Font

เปลี่ยนจาก `text-sm font-medium` → `text-[13px] font-bold tracking-[0.06em]` (desktop) และ `text-[15px] font-bold tracking-[0.04em]` (mobile drawer) ให้ตัวหนาขึ้น มี letter-spacing แบบเว็บมาตรฐานสากล (ตัวพิมพ์ใหญ่ + tracking กว้าง) **ไม่ได้แตะ `.nav-link` CSS class เดิมเลย** (สี hover/active accent, transition ทำงานเหมือนเดิมทุกจุด) ยืนยันด้วย headless browser แล้วว่า hover effect ยังทำงานถูกต้อง (เช่น EXPLORE โชว์สีแดงตอน active, HOME โชว์สีฟ้าตอน hover เหมือนก่อนแก้)

### สิ่งที่ไม่ได้แตะ (นอก scope ของคำขอนี้)

พบคำไทยเดิม ("บทความ", "ติดต่อ", "ห้องเรียน" ฯลฯ) หลงเหลืออยู่ในหน้าอื่นๆ อีกหลายจุด (เช่น label ใน `Footer.tsx`, ปุ่มกลับหน้าหลักใน breadcrumb ต่างๆ, ปุ่ม sign-out ในหน้า Admin/Dashboard เอง) — **ไม่ได้แก้** เพราะเป็นข้อความคนละบริบทกับ "เมนูบาร์ด้านบนสุด" ที่ขอมา (เช่น footer เป็นสารบัญเว็บ ไม่ใช่ nav bar) ถ้าต้องการให้ทั้งเว็บเป็นอังกฤษทั้งหมดต้องแจ้งเพิ่มเป็นงานแยก เพราะกระทบวงกว้างกว่านี้มาก

---

## 🆕 PHASE 3.5 — เปลี่ยนฟอนต์อังกฤษเป็น Overpass + Navbar สีแดงล้วน (1 ก.ย. 2026)

### สิ่งที่แก้

1. **ฟอนต์อังกฤษทั้งเว็บ → Overpass** — จุดที่แก้ (3 จุดเท่านั้น เพราะ font stack มาจากที่เดียว):
   - `index.html`: เปลี่ยน Google Fonts link จาก `Google+Sans+Flex` เป็น `Overpass:wght@400;500;600;700;800`
   - `tailwind.config.ts`: `fontFamily.sans` เปลี่ยนจาก `['Google Sans Flex', 'IBM Plex Sans Thai', ...]` เป็น `['Overpass', 'IBM Plex Sans Thai', ...]` — Thai ยังคง fallback ไป IBM Plex Sans Thai เหมือนเดิมทุกจุด (ไม่ได้แตะฟอนต์ไทย)
   - ลบ `fontFamily` inline ที่เคยใส่ไว้ในหัวข้อ "Welcome to Creatr365's Family" (`Home.tsx`) ออก เพราะตอนนี้ inherit ค่า default ของ `body` ที่ถูกต้องอยู่แล้ว
   - **น่าจะแก้ปัญหาฟอนต์ "Welcome to Creatr365's Family" ที่เคยรายงานไว้ก่อนหน้านี้โดยอัตโนมัติ** — ตอนตรวจครั้งก่อนสงสัยไว้ว่า `Google Sans Flex` อาจไม่ใช่ฟอนต์ที่เปิดให้ใช้จริงบน Google Fonts (เพราะ Google Sans เป็นฟอนต์ภายในของ Google ปกติไม่เปิด public) ทำให้ทุกจุดที่ตั้งใจใช้มัน fallback ไป IBM Plex Sans Thai แทนแบบเงียบๆ — Overpass เป็นฟอนต์ Google Fonts จริงที่โหลดได้แน่นอน ควรจะสม่ำเสมอทุกจุดแล้ว รบกวนดู preview อีกทีว่าหัวข้อนั้นดูปกติแล้วหรือยัง
   - `body { font-weight: 500 }` (Medium) เป็นค่าเริ่มต้นทั่วทั้งเว็บใน `index.css` แล้ว จุดไหนตั้งใจให้หนา (`font-bold` / `fontWeight: 700+`) ยัง override ได้ตามปกติไม่กระทบ

2. **Navbar: hover/active = ตัวหนา + ขีดเส้นใต้, ปกติ = Medium** — แก้ที่ `.nav-link` CSS class เดียวใน `index.css` (ใช้ร่วมกันทั้ง `CourseNavbar.tsx` และ `Navbar.tsx`): ปกติ `font-weight: 500`, hover/active (`aria-current="page"`) เปลี่ยนเป็น `font-weight: 700` พร้อมเส้นใต้ที่มีอยู่แล้วเดิม (ไม่ได้สร้างกลไก underline ใหม่ ของเดิมมีอยู่แล้วแค่ไม่เคยเปลี่ยนความหนาตัวอักษรร่วมด้วย)

3. **Navbar สีแดงล้วน** — ลบ `data-accent="blue"/"green"/"yellow"` ออกจากทุกจุดใน `CourseNavbar.tsx` (MAIN_NAV 5 item, ปุ่ม MY STUDIO, LOGIN) เหลือแค่สีแดงซึ่งเป็นค่า fallback เริ่มต้นของระบบอยู่แล้ว (ตั้งไว้ตั้งแต่ PHASE 3.2) — **ขอบเขตแค่ Navbar เท่านั้น** ไม่ได้ไปแตะระบบสี 4 สี (blue/red/yellow/green) ที่ใช้ในหน้าอื่น (เช่น section การ์ดใน Home, Courses) เพราะคำขอพูดถึงเฉพาะ "ส่วน Navbar" — ถ้าต้องการให้ทั้งเว็บเหลือแค่สีแดงต้องแจ้งเพิ่มเป็นงานแยก เพราะกระทบวงกว้างกว่านี้มาก (`Navbar.tsx` ไม่เคยมี `data-accent` อยู่แล้วตั้งแต่แรกจึงไม่มีอะไรต้องลบในไฟล์นั้น)

### ยืนยันจริงด้วย headless browser (ไม่ใช่แค่โค้ด)

- `getComputedStyle(document.body).fontFamily` → `Overpass, "IBM Plex Sans Thai", system-ui, sans-serif` ✅
- ปุ่ม/ลิงก์ navbar ก่อน hover → `font-weight: 500`, สีปกติ (ไม่มีสี accent)
- hover/active → `font-weight: 700` + สี `rgb(195,1,40)`/`rgb(204,0,41)` (แดงทั้งคู่ ไม่มีน้ำเงิน/เขียว/เหลืองอีกแล้ว)
- **ไม่สามารถยืนยันว่าไฟล์ฟอนต์ Overpass โหลดจริงจาก Google Fonts ได้ในรอบนี้** เพราะ sandbox บล็อก `fonts.googleapis.com` — โค้ด/config ถูกต้อง 100% แต่การโหลดฟอนต์จริงต้องรอดู preview จริง

---

## 🆕 PHASE 4 — หลังงาน Live Notes + Toolbox Premium (4 ต.ค. 2026)

ภาพรวม + กฎห้ามทำ: `README.md` §41 · ขั้นตอนขึ้นระบบ + รายการทดสอบ: `CHANGELOG_2026-10-04.md`

### 🔴 ต้องทำก่อนเปิดใช้
- [P4-01] Apply migration 3 ไฟล์ `20261004100000/100100/100200` + deploy `toolbox-checkout`, `stripe-webhook` (ยังไม่ได้ทำ — โค้ดเขียนเสร็จแต่ยังไม่ขึ้น production)
- [P4-02] เพิ่ม Redirect URL `https://c365.ideas365.space/**` ใน Supabase Auth (ไม่งั้นลิงก์ยืนยันอีเมลพาคนกลับคลิปไม่ได้ เหลือแค่ fallback ในเบราว์เซอร์เดิม)
- [P4-03] ทดสอบตามรายการใน CHANGELOG ทั้งเบราว์เซอร์ มือถือ และแอป LINE + ชำระด้วยบัตรทดสอบ Stripe
- [P4-04] `supabase gen types` แล้ว diff กับ `types.ts` ที่แก้มือ

### 🟡 รอเจ้าของระบบตัดสินใจ
- [P4-05] เพิ่มเงื่อนไขไฟล์ Toolbox Premium ในหน้านโยบายคืนเงิน (`RefundPolicy.tsx`)
- [P4-06] ยืนยันว่า Endpoint URL ของ LIFF app = root ของเว็บ (ถ้าไม่ใช่ ตัวเลือก "LINE OA ล็อกอินอัตโนมัติ" ในเมนูลิงก์ของ Admin จะใช้ไม่ได้ ให้ใช้ตัวเลือก "LINE (เปิดในเบราว์เซอร์)")

### 🟢 ข้อจำกัดที่รู้แล้ว (ยังไม่ต้องแก้)
- ลิงก์ Live Notes ที่แชร์บนโซเชียลจะขึ้น preview แบบทั่วไปของเว็บ ไม่ใช่ชื่อ/ภาพของคลิปนั้น — เว็บเป็น SPA และ crawler ของโซเชียลไม่รัน JS (เกี่ยวกับงาน SSG ที่ค้างไว้ใน `CHANGELOG_2026-09-23.md` ข้อ 2)
- การบังคับ login ดู Live Notes เป็นการกั้นแบบอ่อน: ถ้ามีคนได้ลิงก์ YouTube ตรงยังดูนอกระบบได้ (ยอมรับแล้วสำหรับคลิปฟรีที่ใช้ดึงคน; ถ้าต้องกันจริงต้องย้ายไปผู้ให้บริการวิดีโอที่จำกัดโดเมนได้)
- README §30.6 (ไม่มี audit trail การจ่ายเงิน) ล้าสมัยบางส่วน: ตอนนี้มี `purchase_events` แล้ว และ `create-checkout` ของคอร์ส log ทุกขั้น แต่ branch คอร์สใน `stripe-webhook` ยังไม่ log `webhook_paid` (branch Toolbox log แล้ว) — ถ้าจะปิดช่องนี้ให้เพิ่ม log ใน branch คอร์สแบบเดียวกัน
