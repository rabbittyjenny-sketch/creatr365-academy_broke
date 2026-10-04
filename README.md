CREATR365  `README.md`  **สิ่งที่ตรวจจาก source จริง**   **ย้ำจุดที่ Dev/AI ห้ามเดาหรือสร้างระบบใหม่ทับของเดิม**

````md
# CREATR365 Academy — Developer & AI System README

> **Document purpose**
>
> README นี้เป็นเอกสารกลางสำหรับ Developer / AI / ผู้ช่วยทางเทคนิคทุกคนที่เข้ามาพัฒนาระบบ CREATR365 Academy
>
> จุดประสงค์หลักคือป้องกันการแก้ระบบผิดทาง, การสร้างระบบซ้ำ, การสร้าง Master Key ใหม่, การเปลี่ยน Learning Engine ที่ใช้งานได้อยู่แล้ว หรือการแก้หนึ่งส่วนจนทำให้อีกส่วนพัง
>
> **กฎสำคัญที่สุด**
>
> ห้ามเดาพฤติกรรมของระบบ
>
> ถ้ายังไม่พบหลักฐานจาก source code, database schema, migration, API หรือ production configuration ให้ระบุว่า:
>
> `UNKNOWN / VERIFY`
>
> แล้วหยุดการตัดสินใจตรงนั้น
>
> งานพัฒนาระบบสามารถใช้การคาดการณ์เพื่อหาแนวทางได้ แต่เมื่อจะลงมือแก้ code ต้องอ้างอิงข้อมูลจริงเท่านั้น

---

# 1. SYSTEM OVERVIEW

CREATR365 Academy ประกอบด้วยระบบหลัก 2 ส่วน ซึ่งทำงานร่วมกันแต่ไม่ควรถูกรวมเป็น application เดียวโดยอัตโนมัติ

## 1.1 Main Web App

หน้าที่หลัก:

- Home / Public Website
- Main Navigation
- Course Catalog
- Course Detail
- Registration / Login
- Student Dashboard
- Admin
- Articles
- Diagnostic / Assessment Entry Point
- Stripe Checkout
- Supabase-backed user / course / enrollment data

ฐานเว็บไซต์หลัก:

`creatr365-academy-main (Version6 - original didnt edit 14-08-26)`

### กฎ

Version6 เป็นฐานหลักของหน้าเว็บไซต์และ UX/UI

ห้าม:
- เอา UI จากโปรเจกต์อื่นมาทับทั้งระบบ
- เปลี่ยน Home เพียงเพราะพบเวอร์ชันใหม่กว่า
- สร้าง course catalog ใหม่แยกจาก Supabase

ให้:
- รักษา UI/UX ที่ใช้งานได้
- ดึงเฉพาะ logic ที่จำเป็นจาก source อื่น
- merge เป็นรายส่วน

---

# 2. LMS

LMS เป็น application แยกจาก Main Website

Production deployment:

`https://6course-quiz.vercel.app`

Source หลักที่ตรวจสอบ:

`6course-quiz-main (original no edit 14-08-26)(1)`

ไฟล์ที่เป็น Learning Engine หลัก:

`src/Creatr365_LMS_v2.jsx`

โดย `src/App.jsx` ของ LMS เรียกใช้งาน component นี้

## LMS มีหน้าที่

- Course Learning Dashboard
- Lesson Sequence
- YouTube Video Lessons
- Pre-test / Assessment
- Quiz / Knowledge Check
- Sequential Unlock
- Progress
- Score
- Submission / Learning Result
- Course Result

### กฎสำคัญ

**LMS Learning Engine เดิมเป็นของที่ต้องรักษา**

ห้าม:
- สร้าง LMS ใหม่โดยไม่จำเป็น
- ย้าย Learning Engine ทั้งหมดเข้ามาใน Main Web โดยอัตโนมัติ
- เปลี่ยน YouTube lesson engine เพียงเพราะ UI ไม่สวย

UI สามารถปรับได้ภายหลัง
แต่ **learning logic ที่ทำงานอยู่แล้วต้องได้รับการปกป้อง**

---

# 3. MASTER KEY

ระบบต้องใช้ Master Key หลักเพียงระบบเดียว

จาก source ที่ตรวจพบ Web App ใช้:

`user_accounts.student_id`

เป็นจุดสำคัญในการระบุ Master Student Account

## Master Key มีหน้าที่

ใช้เป็น identity กลางสำหรับข้อมูลของผู้เรียน เช่น:

```text
Master Key
   |
   +--> Enrollment / Purchase
   |
   +--> Student Dashboard
   |
   +--> LMS Learning Context
   |
   +--> Learning Progress
   |
   +--> Quiz / Score
   |
   +--> Submission
   |
   +--> Final Learning Result
````

## สิ่งที่ห้ามทำ

ห้าม:

* สร้าง Master Key ใหม่ใน browser
* ใช้ `auth.user.id` มาสร้าง Master Key ใหม่
* ใช้ `STU-${user.id}` เป็น fallback โดยไม่ตรวจระบบจริง
* ให้ LMS ใช้ identity อีกตัวหนึ่งโดยไม่มี mapping
* ใช้ Course ID เป็น Master Key
* ใช้ QG เป็น Master Key
* ใช้ YouTube URL เป็น Master Key

### IMPORTANT

`auth user id` และ `Master Key` เป็นคนละสิ่ง

ถ้ารูปแบบ Master Key ที่อยู่ production ไม่ตรงกับสิ่งที่ source คาดไว้:

**ห้าม generate format ใหม่**

ให้ตรวจ database และ mapping จริงก่อน

---

# 4. COURSE IDENTITIES

ในระบบมี course identity หลายระดับ

## 4.1 Public Web Course Slug

Current intended 5-course catalog:

```text
magnet
foundation
signal
stage
brand-host-architect
```

## 4.2 LMS Internal Course IDs

ใน LMS มี:

```text
FR_MAGNET
COURSE_0_FOUNDATION
COURSE_1_SIGNAL
COURSE_2_STAGE
COURSE_3_BRAND_HOST
```

## IMPORTANT

สองชุดนี้ไม่ใช่ค่าเดียวกัน

ต้องมี mapping:

```text
public course slug
        ↓
LMS internal course ID
```

ห้ามเดาว่า:

```text
slug === LMS ID
```

---

# 5. MAIN WEBSITE FLOW

## 5.1 Home

Home ใช้ UX/UI จาก Version6

หน้าที่หลัก:

* Public entry point
* Navigation
* Course CTA
* Login / Register
* Articles
* Diagnostic
* Course links

### Course CTA

Section 7–9 ต้องไปยัง Course Detail ที่ถูกต้อง

แนวคิด:

```text
Home
 |
 +--> Course A -> /course/magnet
 +--> Course B -> /course/foundation
 +--> Course C -> /course/signal
 +--> Course D -> /course/stage
 +--> Course E -> /course/brand-host-architect
```

ห้าม link ไปยัง course identity เก่าโดยไม่ตรวจ

---

# 6. COURSE CATALOG

Route:

`/courses`

Data source:

`courses`

หน้ารวมคอร์สต้องดึงข้อมูลจาก Supabase จริง

สิ่งที่ควรสะท้อนจาก database:

* title
* slug
* image
* description
* price
* promotion price (ถ้ามี)
* free / paid status
* active / published state

---

# 7. COURSE DETAIL

Route:

`/course/:slug`

Data source:

`courses`

Module source:

`course_modules`

Expected flow:

```text
/courses
   |
   v
/course/:slug
   |
   +--> Course information
   +--> Price
   +--> Free / Paid
   +--> Modules / lesson information
   +--> Purchase / Enroll
```

ถ้า Admin แก้ course แล้ว:

* Course Catalog ต้องสะท้อน
* Course Detail ต้องสะท้อน

ทั้งสองควรใช้ source เดียวกัน

---

# 8. STUDENT LOGIN

Main Website Login ใช้ระบบ Auth เดิมของ application

หลัง login:

```text
Login
  |
  v
Authenticated Session
  |
  v
Dashboard
```

Dashboard ต้องรู้ว่า user คือใคร

จากนั้นจึง resolve Master Key ของ user นี้

---

# 9. STUDENT DASHBOARD

> **อัปเดต 4 ต.ค. 2569:** Dashboard › เอกสาร แสดงไฟล์ Toolbox Premium ที่ซื้อแล้ว (`toolbox_purchases`) ข้างเอกสารคอร์ส และรองรับ `?section=resources` — ดู §41

Route:

`/dashboard`

หน้าที่หลัก:

* แสดงข้อมูลผู้เรียน
* แสดง course ที่ผู้เรียนมี
* แสดง purchased / enabled course
* แสดง learning status
* แสดง progress/result ที่ระบบเก็บไว้

Data source หลัก:

`course_enrollments`

สถานะที่พบใน source ได้แก่:

* `paid`
* `free`
* `active`

---

# 10. PURCHASED COURSE → DASHBOARD

เมื่อผู้ใช้ซื้อคอร์ส:

```text
Course Detail
      |
      v
Stripe Checkout
      |
      v
Payment success
      |
      v
Stripe webhook
      |
      v
course_enrollments
      |
      v
Dashboard
```

Dashboard ต้องแสดงคอร์สที่ผู้ใช้นั้นซื้อ/ได้รับ

## IMPORTANT

Dashboard ไม่ควร:

* สร้าง enrollment ใหม่เอง
* สร้าง Master Key ใหม่
* ใช้ course identity คนละชุด
* force login LMS ใหม่

---

# 11. LEARNING ENTRY — VERY IMPORTANT

มี 2 กรณี และต้องแยกกันชัดเจน

## 11.1 เปิดเรียนจาก Dashboard

ผู้เรียน Login Main Website อยู่แล้ว:

```text
Main Website Login
       |
       v
Dashboard
       |
       v
กดคอร์สที่มีสิทธิ์
       |
       v
Open LMS
       |
       +--> Existing learner context
       +--> Selected course context
       |
       v
Open selected course
```

### ห้าม

```text
Dashboard
  -> LMS Login
  -> Ask Master Key again
  -> Ask enrollment again
  -> Block
```

ผู้เรียนที่เข้าจาก Dashboard **ไม่ควรถูกบังคับให้กรอก Master Key ซ้ำ**

---

# 12. DIRECT LMS LOGIN

ถ้าผู้ใช้เปิด:

`https://6course-quiz.vercel.app`

โดยตรง

จึงเป็นอีก flow:

```text
Open LMS directly
       |
       v
Master Key Login
       |
       v
Resolve learner
       |
       v
Resolve available courses
       |
       v
Open course
```

### ถ้าไม่พบ Master Key

ต้องส่งผู้ใช้กลับไป Main Web registration flow

ไม่ควร:

* สร้าง student identity ใหม่อัตโนมัติ
* สร้าง Master Key ใหม่โดยไม่แจ้ง
* สร้าง user duplicate

---

# 13. KNOWN LMS LOGIN PROBLEM

ใน LMS source เดิมมี validation ที่ลักษณะ:

```js
if (!id.startsWith("STU-"))
```

ปัญหา:

* ถ้า Master Key จริงไม่ใช่ `STU-*`
* user จะถูก block ก่อนเข้า enrollment resolution

ดังนั้น:

```text
Master Key
    |
    v
Validate existence
    |
    v
Resolve learner
    |
    v
Resolve enrollment
    |
    v
Map course
    |
    v
Open course
```

ไม่ควรใช้รูปแบบ prefix เป็นตัวตัดสินว่าผู้เรียนมีสิทธิ์หรือไม่

---

# 14. ENROLLMENT RESOLUTION

LMS ต้องสามารถหา course ของ learner ได้จริง

Expected:

```text
Master Key
   |
   v
Learner
   |
   v
Enrollment
   |
   v
Course
   |
   v
LMS Course
```

ถ้า:

```text
Master Key ถูก
แต่ course map ผิด
```

ผู้ใช้จะ:

* Login ผ่าน
* แต่ไม่เห็น course
* หรือเข้า lesson ไม่ได้

ดังนั้น debugging ต้องตรวจทั้ง identity และ course mapping

---

# 15. LMS COURSE MAPPING

Current public slugs:

```text
magnet
foundation
signal
stage
brand-host-architect
```

LMS internal IDs:

```text
FR_MAGNET
COURSE_0_FOUNDATION
COURSE_1_SIGNAL
COURSE_2_STAGE
COURSE_3_BRAND_HOST
```

Mapping ต้องอยู่ใน logic ที่ตรวจสอบได้

อย่าสร้าง course ID ใหม่เพียงเพราะชื่อไม่เหมือนกัน

---

# 16. LMS LEARNING ENGINE

LMS ใช้ source เดิมที่ทำ lesson engine อยู่แล้ว

Flow:

```text
Course
  |
  v
Pre-test / Entry Assessment
  |
  v
Lesson
  |
  v
YouTube
  |
  v
Lesson Completion
  |
  v
Quiz / Post-test / Knowledge Check
  |
  v
Pass condition
  |
  v
Unlock next lesson
```

## YouTube

YouTube URL จริงอยู่ใน lesson data

URL สามารถซ้ำกันในหลาย lesson / course

### Critical

ห้ามใช้:

```text
YouTube URL
```

เป็น unique identity ของ progress

Progress ต้องผูกกับ:

```text
Learner
+
Course
+
Lesson / Module
```

---

# 17. PROGRESS / SCORE / RESULTS

ระบบเดิมมี flow เกี่ยวกับ:

* `module_progress`
* Quiz score
* Diagnostic result
* Submission
* Course result

Known diagnostic table:

`diagnostic_quiz_results`

Known Edge Functions include:

* `get-enrollment`
* `save-score`

## Rule

ก่อนแก้ data storage:

1. หาว่า write ตรงไหน
2. หาว่า read ตรงไหน
3. ตรวจ learner identity
4. ตรวจ course identity
5. ตรวจ module/lesson identity
6. ตรวจ read-back

ถ้ายังหาไม่เจอ:

`UNKNOWN / VERIFY`

ห้ามสร้าง table ใหม่เพื่อแก้ปัญหาที่จริงอาจเกิดจาก query/mapping

---

# 18. ADMIN

Admin เป็นระบบแยกจาก Student Dashboard

Route:

`/admin`

Expected login:

```text
Existing user
      |
      v
Role = admin
      |
      v
Existing email/password
      |
      v
/admin
```

## RPC

RPC เป็น backend/database function

RPC ไม่ใช่:

* password
* login form
* Master Key
* second authentication screen

Admin ไม่ควรต้องกรอก RPC

---

# 19. ADMIN COURSE MANAGEMENT

Admin ต้องจัดการข้อมูลจริงใน Supabase:

`courses`

และ:

`course_modules`

เมื่อ Admin:

* เพิ่ม course
* แก้ course
* ลบ/disable course
* เปลี่ยน title
* เปลี่ยน slug
* เปลี่ยนราคา
* เปลี่ยนรูป
* เพิ่ม/แก้ module

ข้อมูลควรไป Supabase แล้วถูกอ่านกลับโดย:

* `/courses`
* `/course/:slug`
* Dashboard

ไม่ควรมี data store อื่นที่ทำให้ข้อมูลสองชุดไม่ตรงกัน

---

# 20. ARTICLES

> **อัปเดต 4 ต.ค. 2569:** `articles.kind` มีความหมายแยกกัน — `video` = คลิปกิจกรรมในหน้า Community, `live_note` = Live Notes ที่แสดงใน `/courses` เท่านั้น (ไม่ขึ้นใน `/articles`, เปิด `/articles/<slug>` ของ live_note จะถูกพาไป `/courses?note=`) · policy อ่านสาธารณะ = `is_active = true` — ดู §41

Main routes:

```text
/articles
/articles/:slug
```

Data source:

`articles`

Admin Article Editor ต้องเขียนข้อมูลชุดเดียวกับที่ Frontend อ่าน

Expected:

```text
Admin Article Editor
        |
        v
Supabase: articles
        |
        +--> /articles
        |
        +--> /articles/:slug
```

ถ้า Admin แก้แล้ว Frontend ไม่เปลี่ยน:

ตรวจ:

* slug
* status/published flag
* query
* RLS
* cache

ก่อนสร้างระบบ article ใหม่

---

# 21. STRIPE

> **อัปเดต 4 ต.ค. 2569:** Stripe ขาย Toolbox Premium ด้วย (`toolbox-checkout` + branch `metadata.kind = 'toolbox'` ใน `stripe-webhook`) ใช้ pattern เดียวกับคอร์ส, log ลง `purchase_events` ชุดเดิม — flow คอร์สไม่เปลี่ยน ดู §41

Stripe เป็นระบบเดิมที่มีอยู่แล้ว

Do not redesign without a verified defect.

Expected purchase flow:

```text
Course Detail
      |
      v
Stripe Checkout
      |
      v
Payment
      |
      v
Stripe Webhook
      |
      v
course_enrollments
      |
      v
Dashboard
```

เมื่อแก้ Stripe ต้องตรวจ:

* user identity
* course identity
* enrollment
* payment status
* webhook
* duplicate event behavior

---

# 22. COUPON

Coupon definition และ Coupon usage เป็นคนละเรื่อง

## Coupon Definition

Expected information:

* code
* discount type
* discount value
* start time
* end time
* max usage
* active state

## Coupon Redemption

ควรเก็บ:

* coupon code
* promo code ID
* user
* Master Key
* course
* used time
* original amount
* discount amount
* VAT
* final amount
* status

## Usage limit

ตัวอย่าง:

```text
แจก/ส่งโค้ดให้ 1,000 คน
แต่กำหนดสิทธิ์ใช้จริง = 10

ครั้ง 1-10 -> ใช้ได้
ครั้ง 11 -> ปฏิเสธ
```

จำนวนที่แจก ≠ จำนวนสิทธิ์ใช้

## Calculation order

```text
Course Price
      |
      v
Discount
      |
      v
Price after discount
      |
      v
VAT
      |
      v
Final amount
```

---

# 23. MASTER KEY AND DATA OWNERSHIP

Conceptual data flow:

```text
Master Key
     |
     +--> account
     +--> purchases
     +--> enrollments
     +--> dashboard
     +--> LMS context
     +--> progress
     +--> quiz
     +--> score
     +--> submission
     +--> final result
```

## NEVER mix

| Identity           | Meaning                         |
| ------------------ | ------------------------------- |
| Auth User ID       | Login identity                  |
| Master Key         | Master learner identity         |
| Public Course Slug | Website course identity         |
| LMS Course ID      | LMS internal course identity    |
| Module ID          | Module/lesson database identity |
| QG                 | Question group                  |
| YouTube URL        | Media resource                  |

---

# 24. DEVELOPMENT METHOD

ทุก bug ต้อง trace:

```text
UI
 ↓
Route
 ↓
Component
 ↓
Auth
 ↓
API / Supabase
 ↓
Table / RPC / Edge Function
 ↓
Stored Record
 ↓
Read-back
 ↓
Next Screen
```

### ถ้ามี error

อย่าแก้ปลายเหตุทันที

ตัวอย่าง:

```text
Key accepted
but course does not open
```

ต้องตรวจ:

```text
Key
↓
Learner
↓
Enrollment
↓
Course Mapping
↓
Module
↓
Lesson
```

ไม่ใช่เพิ่ม Login อีกชั้น

---

# 25. NO-DESTRUCTIVE-CHANGE RULE

ห้าม:

* replace whole project
* replace Home unnecessarily
* replace working LMS
* create second Master Key
* create second course DB
* create second article DB
* delete existing working logic without proof
* change Stripe flow without verified reason

หลักการ:

> **Keep working logic. Replace only broken connection.**

---

# 26. CHANGE LOG FORMAT

ทุกครั้งที่แก้ code ให้รายงานแบบนี้:

```text
File:
Function / Component:

OLD:
...

NEW:
...

WHY:
...

VERIFIED FROM:
...

NOT VERIFIED:
...
```

ถ้ายังไม่ได้ทดสอบ production ให้บอกตามจริงว่า:

`Production verification pending`

---

# 27. VERIFIED FACTS

ข้อมูลต่อไปนี้ได้รับการตรวจจาก source ที่ส่งมา:

* Version6 เป็นฐาน Main Web
* 6course-quiz เป็น LMS
* LMS ใช้ `src/Creatr365_LMS_v2.jsx`
* LMS มี YouTube URLs จริง
* LMS มี lesson/quiz/progress logic
* Main Web มี course/enrollment/Supabase flow
* `user_accounts.student_id` เกี่ยวข้องกับ Master Key flow
* Web course slugs ต่างจาก LMS internal course IDs
* Admin และ Student Dashboard แยกกัน
* Articles อยู่ในระบบ Supabase-backed
* Stripe purchase/webhook code มีอยู่แล้ว
* LMS direct login และ Dashboard entry เป็นคนละ use case

---

# 28. NOT VERIFIED / VERIFY BEFORE CLAIMING

ข้อมูลเหล่านี้ต้องตรวจ production ก่อนสรุปว่าใช้งานจริง:

* Exact production Supabase/RLS state
* Exact Master Key values in production
* Exact live Stripe webhook behavior
* Exact deployed LMS commit
* Exact live API response
* Exact production 5-course mapping
* Real payment test
* Real login test

**ห้ามเปลี่ยนสิ่งที่อยู่ในหัวข้อนี้ให้กลายเป็น fact โดยไม่มีหลักฐาน**

---

# 29. GOLDEN RULE

> **Find the working source -> trace the data -> preserve it -> patch the broken connection.**

CREATR365 เป็นระบบที่มีของเดิมทำงานอยู่แล้วหลายส่วน

เป้าหมายของการพัฒนาคือ:

**repair + connect + extend**

ไม่ใช่:

**rebuild + replace + guess**

ถ้าไม่แน่ใจ:

`STOP -> INSPECT -> VERIFY -> PATCH`

ไม่ใช่:

`GUESS -> REWRITE -> BREAK`

---

# 30. EXPLORE / TOOLBOX ECOSYSTEM (เพิ่ม 2 ก.ย. 2569)

Explore เป็น **ecosystem landing page ใหม่** ไม่ใช่ course catalog และไม่ได้แทนที่ course catalog เดิม

Route:

`/explore`

```text
EXPLORE (nav)
   |
   v
/explore
   |
   +--> Courses tile        --> /courses          (ของเดิม ไม่เปลี่ยน ไม่ได้ย้าย)
   +--> Toolbox tile        --> /toolbox           (ใหม่)
   +--> AI Lab tile         --> /ai-lab            (Coming soon, ใหม่)
   +--> Creator Tools tile  --> /creator-tools     (Coming soon, ใหม่)
```

## กฎสำคัญ

`/courses` **ไม่ได้ถูกลบหรือย้าย** — route เดิม, ข้อมูลเดิม, ไม่เปลี่ยน เพียงแต่ `EXPLORE` ใน navbar (`Navbar.tsx`, `CourseNavbar.tsx`) ไม่ได้ชี้ตรงไป `/courses` อีกต่อไป แต่ชี้ไป `/explore` ก่อน (ผู้ใช้กด tile "Courses" เพื่อไป `/courses`)

ห้าม:
* ลบ route `/courses` คิดว่าถูกแทนที่แล้ว
* คิดว่า Toolbox / AI Lab / Creator Tools ใช้ตาราง `courses`

---

## 30.1 Toolbox — บังคับ login ก่อนโหลด (เป็นการตัดสินใจเชิงธุรกิจ ไม่ใช่บั๊ก)

> **อัปเดต 4 ต.ค. 2569 (แทนที่บางส่วนของหัวข้อนี้):** ป๊อปอัปถามเพศ/อายุ/อาชีพใน Toolbox **ถูกถอดแล้ว** — ข้อมูลประชากรมาจาก `/profile` แหล่งเดียว และ trigger เติมให้ `toolbox_downloads` เอง · Toolbox มีทั้งแจกฟรีและ Premium · policy `toolbox-files` เปลี่ยนเป็นแบบเช็คการซื้อ · กฎ "บังคับ login" ยังอยู่เหมือนเดิม — ดู §41

Toolbox = คลังไฟล์ฟรี (เทมเพลต/เอกสาร/รูปภาพ) route `/toolbox`, จัดการที่ `/admin/toolbox`

เหตุผลที่บังคับ login: เพื่อรู้ **Master Key** ของผู้โหลด + เก็บข้อมูล demographic (เพศ/อายุ/อาชีพ — ถามครั้งเดียว เก็บที่ `profiles`) สำหรับวางแผนธุรกิจ ตามที่ตกลงกันไว้ — **ห้ามเปลี่ยนให้โหลดได้โดยไม่ login คิดว่าเป็นการแก้ friction**

```text
/toolbox
   |
   v
กด "ดาวน์โหลด"
   |
   +-- ยังไม่ login --------> redirect /auth?redirect=/toolbox
   |
   +-- login แล้ว แต่ profile ไม่มี gender/age_range/occupation
   |         --> เปิด modal ถามครั้งเดียว --> บันทึกที่ profiles
   |
   v
createSignedUrl (bucket: toolbox-files, ttl 60s)
   |
   v
insert toolbox_downloads (insert-only log)
   |
   v
rpc increment_toolbox_download
```

### Storage buckets — ห้ามสลับ

| Bucket | Public? | เก็บอะไร |
| --- | --- | --- |
| `toolbox-covers` | Public | รูปปกที่โชว์บนการ์ด (ต้องเห็นได้แม้ยังไม่ login เพื่อจูงใจให้ login) |
| `toolbox-files` | **Private** | ไฟล์จริงที่โหลด — เข้าถึงได้เฉพาะ `authenticated` ผ่าน signed URL เท่านั้น |

ห้ามเปลี่ยน `toolbox-files` เป็น public — จะข้ามการบังคับ login ได้ทันทีถ้ามีคนรู้ direct URL

---

## 30.2 Migration ยังไม่ได้ apply กับ production — ตรวจก่อนเชื่อว่ามีข้อมูลจริง

Migration file: `supabase/migrations/20260902120000_toolbox_explore.sql`

สร้าง: `toolbox_assets`, `toolbox_downloads`, เพิ่ม column `gender`/`age_range`/`occupation` ใน `profiles`, สร้าง bucket `toolbox-covers`/`toolbox-files`

**Session ที่สร้าง migration นี้ไม่มีสิทธิ์เข้าถึง Supabase project จริง จึงยังไม่เคย apply กับที่ไหนเลย** — เจ้าของระบบต้องรันเองก่อนใช้งานจริง

`src/integrations/supabase/types.ts` ส่วนของ `toolbox_assets` / `toolbox_downloads` / `profiles` (field ใหม่) ถูก**เขียนมือ**ให้ตรงกับ migration — ไม่ได้มาจาก `supabase gen types` จริง

### UNKNOWN / VERIFY

* ตาราง `toolbox_assets` / `toolbox_downloads` มีอยู่ใน production Supabase แล้วหรือยัง
* `types.ts` ตรงกับ schema จริง 100% หรือยัง (ควรรัน `supabase gen types` ใหม่หลัง apply migration แล้ว diff เทียบ)

ห้าม: สันนิษฐานว่า `/toolbox` หรือ `/admin/toolbox` ใช้งานได้จริงโดยไม่ตรวจว่า migration รันแล้ว

---

## 30.3 สีทองสองเฉดคนละที่ — ตั้งใจ ไม่ใช่ inconsistency

| ใช้ที่ | สี | เหตุผล |
| --- | --- | --- |
| `/admin/*` ทั้งหมด (`AdminLayout`, `AdminCourses`, `AdminArticles`, `AdminToolbox` ฯลฯ) | `#D4A843` | ธีมเดิมของ Admin Console ที่มีมาก่อนแล้ว ใช้ร่วมกันทุกหน้า admin |
| `/explore`, `/toolbox`, `/ai-lab`, `/creator-tools` | `#C0A060` | สีทองแบรนด์จริงตาม **System B** (`creatr365-content-system` skill, `references/visual_system.md`) |

ห้าม: แก้ให้สองค่านี้เท่ากันเพราะคิดว่าเป็นบั๊ก — เป็นคนละ design system กันโดยตั้งใจ (Admin console เดิม vs. brand-facing pages ใหม่)

---

## 30.4 Dark mode pattern สำหรับหน้าใหม่กลุ่มนี้

หน้า `/explore`, `/toolbox`, `/ai-lab`, `/creator-tools` ใช้ hook `useDarkPage()` (`src/hooks/useDarkPage.ts`) toggle class `.dark` บน `<html>` ตอน mount/unmount — กลไกเดียวกับที่ `RequireAdmin.tsx` ใช้กับ `/admin/*` อยู่แล้ว

ห้าม:
* เพิ่มหน้าใหม่ในกลุ่มนี้แล้ว hardcode สีเข้มเอง — ให้เรียก `useDarkPage()` แล้วใช้ token เดิม (`bg-background`, `text-foreground`, `bg-card`, `border-border`) ที่จะพลิกสีให้อัตโนมัติ
* แก้ token กลาง (`--background`, `--foreground` ฯลฯ ใน `index.css`) เพื่อให้หน้ากลุ่มนี้เข้ม — จะทำให้ Home และหน้าทั่วไปเปลี่ยนสีตามไปด้วยทันที

---

## 30.5 Class `.sharp-card` / `.sharp-btn` / `.sharp-tile` — opt-in ต่อหน้าเท่านั้น

นิยามอยู่ท้าย `src/index.css` (มุมเหลี่ยม + hard shadow + press motion) — ใช้เฉพาะ Explore / Toolbox / AI Lab / Creator Tools / Admin Toolbox และบางส่วนของ Dashboard

ห้าม: ใส่ class เหล่านี้ใน Home หรือ shared component (`button.tsx`, `card.tsx`) — จะเปลี่ยนหน้าตาทุกหน้าที่ใช้ component นั้นทันที เจตนาคือ opt-in ต่อหน้า ไม่ใช่ design token กลาง

---

## 30.6 ไม่มี audit trail ของระบบจ่ายเงิน — ช่องโหว่ที่รู้แล้วแต่ยังไม่ได้แก้ (สำคัญ)

ตรวจสอบแล้ว (2 ก.ย. 2569): `course_enrollments` ไม่มี `updated_at`, ไม่มี history table แยก, ฟังก์ชัน `stripe-webhook` เขียนทับ `status` ตรง ๆ ไม่มี log เหตุการณ์ดิบจาก Stripe เก็บไว้ที่ไหนเลย

**ถ้า user แจ้งว่าจ่ายเงินแล้วคอร์สหาย ตอนนี้ตรวจสอบย้อนหลังจากในระบบเองไม่ได้** ต้องพึ่ง Stripe dashboard ภายนอกเท่านั้น

ข้อเสนอแก้ (ยังไม่ได้ทำ ตกลงกันว่าจะแยกเป็นงานคนละก้อน): ตาราง `stripe_webhook_events` (log ดิบแบบ insert-only), ตาราง `enrollment_audit_log` (insert-only ทุกครั้งที่ status เปลี่ยน), เพิ่ม `updated_at` ให้ `course_enrollments`

**ห้ามสันนิษฐานว่ามี audit trail อยู่แล้ว** จนกว่าจะมีการ apply งานส่วนนี้จริง

---

# 31. EXPLORE/DASHBOARD BUG-FIX ROUND (14 ก.ย. 2569)

ผลจากการตรวจสอบด้วย screenshot จริงของผู้ใช้ พบและแก้บั๊กต่อไปนี้ — เก็บเหตุผลไว้กัน regression กลับไปเป็นแบบเดิม

## 31.1 Dashboard flash "ยังไม่พบ Master Key" ทุกครั้งที่เข้า — แก้แล้ว

สาเหตุ: `Dashboard.tsx` มี state `user`/`studentId` ที่เริ่มเป็น `null` ทั้งคู่ ระหว่างที่ `load()` async กำลัง resolve, `user` จะถูก set ก่อน (หลัง `getSession()`) แต่ `studentId` ยัง `null` อยู่อีกหลาย await — ในช่วงนั้น component เข้าเงื่อนไข `!studentId` แล้วโชว์ข้อความ "ยังไม่พบ Master Key" ทั้งที่จริง ๆ แค่ยังโหลดไม่เสร็จ

แก้: เพิ่ม state `loading` แยกต่างหาก (เริ่ม `true`, set `false` ที่บรรทัดสุดท้ายของ `load()`) — โชว์ spinner ระหว่าง `loading`, โชว์ข้อความ "ไม่พบ" ก็ต่อเมื่อโหลดเสร็จแล้วจริง ๆ

ห้าม: ย้าย `if (!studentId)` ไปไว้ก่อนเช็ค `loading` อีก — กลับไปเป็นบั๊กเดิมทันที

## 31.2 Dashboard ตอนนี้ใช้ dark theme + Footer เหมือน Explore

`Dashboard.tsx` เรียก `useDarkPage()` แล้ว (เดิมมีแค่ `.sharp-card` มุมเหลี่ยม แต่ยังพื้นหลังสว่างของ light theme) และมี `<Footer/>` ต่อท้ายแล้ว เพื่อให้กล่อง/พื้นหลังตรงกับ Explore/Toolbox — สีของ accent การ์ด (แดง `--google-red`) **ยังคงเดิม ไม่ได้เปลี่ยนเป็นทอง** เพราะที่ขอมาคือ "สีพื้นกล่อง" ไม่ใช่สี accent — ถ้าต้องการให้ accent เป็นทองด้วยต้องสั่งแยก

**ขอบเขตที่ตีความ:** คำขอ "มุมเหลี่ยมของการ์ดเมนูให้เหมือนกันทั้งเว็บ" ตีความว่าหมายถึง Dashboard ให้ตรงกับ Explore (ทั้งสองหน้าเป็นกลุ่มเดียวกันที่ทำในรอบนี้) **ไม่ได้ไปแตะ Home** หรือ course card อื่น ๆ ของ Home — ถ้าจริง ๆ ต้องการให้ Home เปลี่ยนด้วย ต้องสั่งยืนยันแยก เพราะขัดกับกฎ "ห้ามแตะ Home" ที่ตกลงกันไว้ตอนแรก

## 31.3 Hover สีผิดใน Explore tiles — แก้แล้ว (root cause สำคัญ อ่านก่อนแก้ hover ที่ไหนก็ตาม)

เว็บนี้มีระบบ hover-color กลาง 2 ตัวที่ทำงาน**แยกกันคนละกลไก** และทั้งสองต้องถูกตั้งค่า ไม่งั้นจะเจอบั๊กแบบเดียวกันอีก:

| กลไก | ใช้กับ | ตัวแปร | ค่า default |
| --- | --- | --- | --- |
| `.site-hover-scope ... :hover` | `p, li, span, a, button` (ไม่รวม h1-h6) | `--hover-accent` | แดง (`--google-red`) |
| `h1:hover, h2:hover, ...` | เฉพาะ heading (h1-h6) | `--heading-accent` | แดง (`--google-red`) เพราะ **h2 เซ็ตค่านี้ทับตัวเองเสมอ** (บรรทัด `h1,h2,...{--heading-accent:red}`) แม้ ancestor จะตั้ง `--heading-accent` ไว้ก็ไม่มีผล เพราะ custom property ถูก "set" ใหม่ที่ตัว h2 เอง ไม่ใช่แค่ inherit |

**วิธีตั้งสี accent ให้ tile/section หนึ่ง ๆ ที่ถูกต้อง:** ใส่ class `section-accent` บน wrapper แล้วตั้ง `style={{ '--hover-accent': hex, '--section-accent': hex }}` — ตัว `--section-accent` จะไหลผ่าน rule ที่มีอยู่แล้ว `.section-accent h2 { --heading-accent: var(--section-accent) }` ซึ่ง specificity สูงกว่า `h2{...}` เฉย ๆ จึงชนะได้จริง (ดูตัวอย่างจริงใน `Explore.tsx` ทั้ง 4 tile)

ห้าม: ตั้งแค่ `--hover-accent` เฉย ๆ แล้วคิดว่า heading จะเปลี่ยนสีตามด้วย — จะได้สีถูกเฉพาะ text ทั่วไป (p/span/a) ส่วน h1-h6 จะยังเด้งเป็นแดงเหมือนเดิมเวลาเมาส์ชี้ตรงตัวหัวข้อพอดี (ตรวจสอบได้ด้วยการ hover ตำแหน่งต่าง ๆ ในการ์ด ไม่ใช่แค่ hover จุดกึ่งกลาง)

## 31.4 Explore.tsx: "Creator Tools" tile ตัวหนังสือซ้อนทับ — แก้แล้ว

เหมือนบั๊กเดิมที่เคยแก้ใน `AiLab.tsx`/`CreatorTools.tsx` (h1-h6 เป็น `display:inline-block` ทั้งเว็บ) — ใน `Explore.tsx` มีแค่ tile "Creator Tools" ที่วาง `<span>` eyebrow กับ `<h2>` เป็น sibling ตรง ๆ ในกันคนละ `<div>` (อีก 3 tile แยก div ถูกต้องอยู่แล้ว) ทำให้ eyebrow กับหัวข้อไปอยู่บรรทัดเดียวกัน แก้โดยเพิ่ม `block` ให้ span

ห้าม: เพิ่ม tile ใหม่ใน Explore โดยวาง eyebrow span กับ h2 เป็น sibling ตรง ๆ โดยไม่ใส่ `block` หรือแยก div — จะเจอบั๊กเดิมซ้ำ

## 31.5 Nav-link ค้างสีแดงบนมือถือ/แตะหน้าจอ — แก้แล้ว

`@media (hover: none)` (สำหรับ touch device) มีการ reset สี hover ของ `p/span/a/button/heading` กลับเป็นปกติอยู่แล้ว แต่ **ลืม `.nav-link`** — แตะเมนู navbar บนมือถือแล้วจะค้างเป็นสีแดง+ตัวหนาเหมือน hover ค้างตลอดไปจนกว่าจะแตะที่อื่น เพิ่ม `.nav-link:hover` เข้า reset block แล้ว (คง `[aria-current="page"]` ไว้ตามเดิมเพราะเป็น state จริง ไม่ใช่ hover ค้าง)

## 31.6 เพิ่มปุ่มแสดง/ซ่อนรหัสผ่าน

Component ใหม่ `src/components/ui/password-input.tsx` (ครอบ `Input` เดิม + ปุ่มตา) ใช้แทน `<Input type="password">` ใน `Auth.tsx` และ `ResetPassword.tsx` แล้ว — `Register.tsx` ไม่มีช่องรหัสผ่าน (login ผ่าน LINE) จึงไม่ต้องแก้

## 31.7 Footer — ตรวจแล้ว ไม่มี "คอร์สเรียน" ซ้ำซ้อนตามที่กังวล

`Footer.tsx` มีคอลัมน์ "หลักสูตร" → "ดูทั้งหมด" + รายชื่อคอร์สอยู่แล้ว ไม่พบ heading "คอร์สเรียน" ซ้ำที่ไหนในโค้ด — สิ่งที่ทำเพิ่มคือเพิ่ม `<Footer/>` ให้ `Dashboard.tsx` (ตามข้อ 31.2)

**ข้อสังเกต (ยังไม่ได้แก้ เพราะไม่ใช่สิ่งที่ขอตรง ๆ):** หน้า `FAQ.tsx`, `Privacy.tsx`, `Terms.tsx`, `Contact.tsx` มี mini footer แบบเขียนอินไลน์ของตัวเอง (แค่ 3 ลิงก์ policy) แทนที่จะใช้ `<Footer/>` shared component — ถ้าต้องการให้ทุกหน้าใช้ Footer เดียวกันจริง ๆ ต้องสั่งแยก เพราะเป็นการเปลี่ยน layout ของ 4-5 หน้าที่ไม่ได้อยู่ใน scope รอบนี้

**อัปเดต (14 ก.ย. 2569):** ข้อความในไฟล์ `RefundPolicy.tsx`, `Terms.tsx`, `FAQ.tsx` ถูกแก้โดยผู้ใช้เองแล้วนอกรอบนี้ — งานฝั่ง Claude ในรอบถัดไปไม่ได้แตะเนื้อหาของ 3 ไฟล์นี้อีก

---

# 32. COURSES CATALOG (/courses, /course/:slug) — พาให้ตรงธีม Explore (14 ก.ย. 2569)

`Courses.tsx` (หน้ารวมหลักสูตร) และ `CourseDetail.tsx` (หน้ารายละเอียด) เดิมยังเป็นธีมสว่าง มุมโค้ง (`card-water`, `rounded-xl`) จากก่อนที่จะมี Explore/Toolbox — ทำให้เว็บดูเหมือนคนละเว็บเวลาสลับหน้า แก้ให้ทั้งคู่ใช้ `useDarkPage()` + `.sharp-card` เหมือน Explore/Toolbox/Dashboard แล้ว (สี accent ยังเป็นแดงเหมือนเดิม ไม่ได้เปลี่ยนเป็นทอง — ทองสงวนไว้เฉพาะ tile Courses ใน Explore ตาม System B ที่บอกว่าใช้ "อย่างมีวินัย" ไม่ใช่ทาสีทองทั้งเว็บ)

## 32.1 การ์ดคอร์สในหน้ารวมหลักสูตร — แก้ตามที่มาร์กในภาพ

| ตำแหน่ง | ก่อน | หลัง | เหตุผล |
| --- | --- | --- | --- |
| Badge มุมซ้ายบน (สถานะ) | แสดงได้ทั้ง `FREE`/`NOW OPEN`/`COMING SOON` ปนกัน | เหลือเฉพาะสถานะการเปิดรับจริง (`NOW OPEN`/`NEW UPDATE`/`COMING SOON`/`FULLY BOOKED`) — `status:'free'` ไม่ขึ้น badge ตรงนี้อีกแล้ว | ความว่างเปล่า/ราคาไม่ใช่ "สถานะ" ปนกันแล้วดูรก คนละเรื่องกับ badge เปิดรับ |
| Badge มุมขวาบน (level) | `STARTER`/`Intermediate` ฯลฯ | **ลบออก** | ตามที่มาร์กกากบาทในภาพ |
| แถวราคา (ล่างการ์ด) | ฟรี = ข้อความ "ฟรี" สีเขียว (`text-success`) | ฟรี = ข้อความ **"FREE"** ภาษาอังกฤษ สีปกติ (`text-foreground`) เหมือนราคาปกติ | ให้ดูเรียบร้อย เป็นมืออาชีพ ไม่ใช้สีเน้นพร่ำเพรื่อ |
| Kicker เหนือชื่อคอร์ส | ค่าดิบจาก DB เช่น `ชุดที่ 2 – ไลฟ์ให้ขายได้` | ตัด `ชุดที่ N –` ออกด้วย regex ฝั่ง frontend เหลือแค่ `ไลฟ์ให้ขายได้` | ไม่ต้องแก้ข้อมูลใน DB, แก้แค่การแสดงผล — ปลอดภัยกว่า |
| ข้อความสั้นใต้ meta row | `target_audience` (2 บรรทัด, line-clamp) — ข้อความบางคอร์สยาวจนล้น/ถูกตัดดูแปลก | เปลี่ยนไปดึงจาก `course.outcome_goal` แทน (ฟิลด์เดียวกับที่ CourseDetail.tsx โชว์ในกรอบเขียว "เป้าหมาย: ...") **โดยไม่เอาคำว่า "เป้าหมาย:" ติดมาด้วย** — ใช้ pattern เดียวกันทุกการ์ด | `outcome_goal` เขียนมาเพื่อสรุปเป็นประโยคสั้นอยู่แล้ว จึงพอดีกับ `line-clamp-2` กว่า `target_audience` ซึ่งบางคอร์สยาวเกิน ไม่ใช่การแก้ CourseDetail.tsx แต่อย่างใด — หน้ารายละเอียดใช้เป็นแหล่งข้อมูลอ้างอิงเท่านั้น |

Helper ใหม่ `tierLabel(tag)` (มีทั้งใน `Courses.tsx` และ `CourseDetail.tsx`, ยังไม่ได้ดึงมาเป็นไฟล์ shared เดียว — ถ้าจะแก้ที่ 3 จุดขึ้นไปควรย้ายไป `src/lib/`) — ตัด prefix `ชุดที่ N – ` ด้วย regex `^ชุดที่\s*\d+\s*[-–—]\s*`

### UNKNOWN / VERIFY
คอร์สที่มี `status = 'free'` ใน production ตอนนี้จะไม่มี badge มุมซ้ายบนอีกต่อไป (ก่อนหน้านี้ขึ้น "FREE") — ถ้าอยากให้คอร์สฟรีที่เปิดใช้งานจริงมี badge ด้วย ต้อง**แก้ข้อมูลใน Admin** ให้ status เป็น `now_open` แทน (ราคาจะยังโชว์ "FREE" ที่แถวราคาเหมือนเดิม เพราะคำนวณจาก `price` field แยกต่างหาก ไม่ผูกกับ `status`)

## 32.2 CourseDetail.tsx

* `course.outcome_goal` **ไม่มีการแก้ไขใด ๆ** — ยังแสดง `"เป้าหมาย: " + course.outcome_goal` เหมือนเดิมทุกประการ (รอบก่อนเข้าใจผิดว่าภาพมาร์กให้ลบ label นี้ แล้วลบไปจริง — แก้กลับคืนแล้ว หน้านี้ใช้เป็นแหล่งอ้างอิงให้หน้ารวมหลักสูตรไปดึงข้อความมาใช้เท่านั้น ดู 32.1)
* ลบ badge `LEVEL · {course.level}` ออกจาก header (เพื่อให้ตรงกับที่ลบออกในหน้ารวมหลักสูตร)
* Kicker ใช้ `tierLabel()` เหมือนกัน
* ราคา "ฟรี" → "FREE" (อังกฤษ) ทั้ง 2 จุดที่แสดง (header กับ sidebar) ให้ตรงกับหน้ารวมหลักสูตร
* การ์ด/กล่องต่าง ๆ (sidebar, module list, gallery, KPI notes) เปลี่ยนจาก `card-water`/`rounded-xl`/`rounded-lg` → `sharp-card`/ไม่มี rounded ตามธีมเดียวกัน — ไอคอนวงกลมเล็ก ๆ (เช่น check bullet `rounded-full`) ยังคงไว้ เพราะเป็นไอคอนวงกลม ไม่ใช่การ์ด

## 32.3 Grid แบบยืดหยุ่นรองรับคอร์สเพิ่มในอนาคต

เปลี่ยนจาก grid breakpoint ตายตัว (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) เป็น fluid grid:

```css
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
```

แต่ละการ์ดจองพื้นที่อย่างน้อย 280px แล้วปล่อยให้ CSS คำนวณจำนวนคอลัมน์เองตามความกว้างจอ — เพิ่มคอร์สจาก 5 เป็น 20/50 ใบก็ยังทำงานถูกโดยไม่ต้องแก้ breakpoint เพิ่ม (pattern เดียวกับที่เว็บ catalog ใหญ่ ๆ อย่าง Coursera/Udemy ใช้)

**ที่ยังไม่ได้ทำ (นอกขอบเขตรอบนี้ ถ้าคอร์สเพิ่มเยอะจริงควรพิจารณา):** filter ตาม tier/ประเภท, search, pagination/"load more" — ตอนนี้ทุกคอร์สที่ `is_active=true` และอยู่ใน `CURRENT_COURSE_SLUGS` ยังโหลดมาแสดงพร้อมกันหมด

## 32.4 ทดสอบแล้วอย่างไร

Sandbox นี้เข้า Supabase จริงไม่ได้ (เหมือนทุกรอบก่อนหน้า) จึงทดสอบด้วยการ mock response ของ `**/rest/v1/courses*` ผ่าน Playwright ให้เห็นการ์ดจริงพร้อมข้อมูลตัวอย่าง (5 คอร์ส คละสถานะ/ราคา/โปรโมชั่น/ความยาว `outcome_goal` รวมถึงกรณี `outcome_goal = null`) ทั้งจอ desktop และมือถือ (390px) ยืนยันว่า:
* badge สถานะ/ราคา/kicker ออกมาตรงตามตาราง 32.1
* ข้อความในกรอบใต้ meta row ของทุกการ์ดดึงจาก `outcome_goal` (ไม่ใช่ `target_audience`), ไม่มีคำว่า "เป้าหมาย:" ติดมา, และไม่ล้นกรอบด้วย `line-clamp-2`
* ตรวจ `/course/magnet` (mock เดียวกัน) ยืนยันว่า `CourseDetail.tsx` ยังโชว์ `"เป้าหมาย: " + outcome_goal` เหมือนเดิม — ไม่มีอะไรถูกลบออกจากหน้านี้
* ไม่มี error ใน console (นอกจาก network error ของ request ที่ไม่ได้ mock ซึ่งเป็นข้อจำกัดของ sandbox ไม่เกี่ยวกับโค้ด)
* mobile stack เป็นคอลัมน์เดียวอ่านง่าย ไม่ล้นจอ

---

# 33. Cleanup ไฟล์รูปที่ไม่ได้ใช้ + แก้การ์ดคอร์สอีก 2 จุด + จัด section หน้า Dashboard ใหม่ (14 ก.ย. 2569)

## 33.1 ลบไฟล์รูปที่ไม่ได้ใช้งานใน `public/images/`

ตรวจสอบตามรายงาน static-analysis (เช็คว่าแต่ละไฟล์ถูก import/อ้างอิงจากที่ไหนในโค้ดหรือไม่) ที่ระบุว่ามีรูป 51 ไฟล์ไม่ถูกอ้างอิงเลยใน `.tsx`/`.ts`/`.css`/SQL fixtures ใด ๆ — ก่อนลบจริง grep ซ้ำอีกรอบด้วยชื่อไฟล์ทั้งหมดทับทุกไฟล์ในโปรเจกต์ (ไม่ใช่แค่ `src/`) ไม่พบการอ้างอิงเพิ่มเติม จึงลบทิ้งทั้งหมด

* จากรายชื่อ 51 ไฟล์ในรายงาน มี 49 ไฟล์ที่ยังอยู่จริงบนดิสก์ (ถูกลบ) และ 2 ไฟล์ (`brand-story.png`, `live_behind_ads.png`) ไม่มีอยู่แล้วในตอนตรวจสอบ (คนละชื่อ/ถูกลบไปก่อนหน้านี้แล้ว) — ไม่มีอะไรต้องทำเพิ่มสำหรับ 2 ไฟล์นี้
* ผลลัพธ์: `public/images/` จาก 67 ไฟล์ (~50MB) เหลือ 18 ไฟล์ (~12MB) — ลดไปประมาณ 38MB
* **ข้อควรระวังที่ยังไม่ได้เช็ค:** รายงานต้นฉบับเตือนไว้ว่ารูปที่แอดมินอัปโหลด/กรอก URL ผ่านหน้า Admin (เช่น `cover_image_url` ของ courses/articles ในตาราง Supabase) จะไม่โดน static analysis ตรวจจับ เพราะเป็น URL ที่เก็บในฐานข้อมูล ไม่ใช่ import ในโค้ด — sandbox นี้เข้าถึง Supabase จริงไม่ได้ จึง**ไม่สามารถยืนยันได้ 100%** ว่าไม่มีคอร์ส/บทความไหนอ้างอิง URL ของ 49 ไฟล์นี้อยู่ (ผู้ใช้ยืนยันให้ลบตามรายการนี้แล้วโดยทราบความเสี่ยงนี้แล้ว)

## 33.2 หน้ารวมหลักสูตร (`/courses`) — แก้อีก 2 จุดตามภาพมาร์กกากบาท

| จุด | ก่อน | หลัง |
| --- | --- | --- |
| 1. ป้าย tier เหนือชื่อคอร์ส | `tierLabel()` เดิมตัดเฉพาะรูปแบบ `ชุดที่ N –` (ต้องมีคำว่า "ที่" เป๊ะ ๆ) | ผ่อนเงื่อนไข regex เป็น `/^ชุด[^-–—]*[-–—]\s*/` — ตัดทุกอย่างตั้งแต่ต้นข้อความที่ขึ้นต้นด้วย "ชุด" ไปจนถึงขีดตัวแรก ไม่ว่าจะเป็น "ชุดที่ 1 –", "ชุด 2 –", หรือ "ชุดที่3-" (ไม่มีช่องว่าง) ก็ตัดออกได้หมด เหลือแค่ชื่อ tier ท้ายสุด |
| 2. แถว meta ใต้ชื่อคอร์ส (แถวเดียวกับไอคอน Online/Onsite) | สองฝั่ง: ซ้าย = ประเภทการเรียน (Online/Onsite/Hybrid), ขวา = `format_label`/`duration` (ข้อความยาวเช่น "VOD ออนไลน์ ดูได้ทุกที่ทุกเวลา") | **ลบฝั่งขวาออกทั้งหมด** เหลือแค่ประเภทการเรียนฝั่งซ้ายอย่างเดียว — ตัด import ไอคอน `Clock` ที่ไม่ได้ใช้แล้วออกด้วย |

ทดสอบด้วย mock ที่ตั้งใจใส่ tag หลายรูปแบบ (`ชุดที่ 1 – ...`, `ชุด 2 – ...` ไม่มี "ที่", `ชุดที่3-...` ไม่มีช่องว่าง) ยืนยันว่า regex ใหม่ตัด prefix ออกถูกทุกแบบ, และ meta row เหลือแค่ label ประเภทการเรียนอย่างเดียวไม่มีข้อความ duration ต่อท้ายแล้ว — ดู `round2_courses_desktop.png`/`round2_courses_mobile.png`

หมายเหตุ: `course.format_label`/`course.duration` ยังอยู่ใน `CourseRow` interface เหมือนเดิม (ไม่ได้ลบ field) เผื่อมีที่อื่นในอนาคตต้องใช้ — แค่ไม่ render ในการ์ดหน้ารวมหลักสูตรแล้วเท่านั้น

## 33.3 จัด section หน้า Dashboard (`/dashboard`) ใหม่เป็นแบบแท็บ

**ปัญหาเดิม:** หน้า Dashboard เรียง Header → Stats → คอร์สของฉัน (การ์ดคอร์สที่ลงทะเบียน แต่ละใบขยายเป็นรายการบทเรียนได้) → กล่องวิธีใช้ LMS ต่อกันเป็นหน้ายาวหน้าเดียวตลอด — ยิ่งมีคอร์สที่ลงทะเบียนเยอะขึ้นก็ยิ่งเลื่อนยาวขึ้นเรื่อย ๆ ไม่มีจุดแบ่งที่ชัดเจน

**แก้โดย:** ใช้ shadcn `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (component นี้ scaffold มาพร้อมโปรเจกต์อยู่แล้วแต่ไม่เคยถูกใช้ที่ไหนมาก่อนในทั้งโปรเจกต์ — ใช้ของที่มีอยู่แทนที่จะเขียน tab UI เองใหม่) แบ่งเนื้อหาเป็น 2 แท็บ:

* **ภาพรวม** (default) — Stats grid (4 กล่อง) + กล่องวิธีเข้าระบบ LMS
* **คอร์สของฉัน (N)** — รายการคอร์สที่ลงทะเบียนทั้งหมด (ของเดิมทุกอย่างเหมือนเดิม ทั้ง progress bar, ปุ่มเข้าเรียน/ดูบทเรียน, เอกสารดาวน์โหลด, รายการบทเรียนแบบ expand) — ตัวเลขในวงเล็บบนแท็บ = จำนวนคอร์สที่ลงทะเบียนจริง

Header (ทักทาย + Master Key + ลิงก์ Admin Console) ยังอยู่นอกแท็บเหมือนเดิม เพราะเป็นข้อมูลตัวตนที่ควรเห็นตลอด ไม่ใช่ "section เนื้อหา" ที่ควรถูกซ่อนสลับไปมา

**ทำไมเป็น 2 แท็บ ไม่ใช่ sidebar แบบ Admin เป๊ะ ๆ:** หน้า Admin (`AdminLayout`) เป็น sidebar เต็มจอฝั่งซ้ายสำหรับหน้าจอกว้าง ออกแบบมาสำหรับบริบทแอดมินที่มีหลายเมนู/หลาย route แยกกัน แต่ Dashboard เป็นหน้านักเรียนที่ใช้งานบนมือถือเป็นหลัก (container `max-w-2xl`) และมีแค่ 2 กลุ่มเนื้อหาจริง ๆ — การใช้แท็บ segmented control ที่ responsive ในตัว (Radix Tabs) ให้ผลลัพธ์เดียวกัน (แบ่งเนื้อหาเป็นส่วน ไม่ต่อกันยาว ๆ) โดยไม่ต้องเปลี่ยนโครง route หรือ container width ทั้งหน้า — ความเสี่ยงต่ำกว่าและใช้ของที่มีอยู่แล้วในระบบ

## 33.4 ทดสอบแล้วอย่างไร

Sandbox เข้าถึง Supabase จริงไม่ได้เหมือนทุกรอบ — ทดสอบ `/courses` ด้วยการ mock `**/rest/v1/courses*` เหมือนรอบก่อน (ดู 33.2) และทดสอบ `/dashboard` ด้วยการ:
* ฝัง fake session เข้า `localStorage` ตรง key ที่ supabase-js คาดหวัง (`sb-<project-ref>-auth-token`) ให้ `getSession()` resolve ได้โดยไม่ต้องยิง network จริง
* mock ทุก endpoint ที่หน้านี้เรียก (`profiles`, `courses`, `course_enrollments`, `user_accounts`, `course_modules`, `module_progress`, `course_resources`, RPC `has_role`/`ensure_master_student_account`) ด้วยข้อมูลตัวอย่าง 2 คอร์สที่ลงทะเบียนแล้ว

ยืนยันว่า:
* แท็บ "ภาพรวม" เป็นค่าเริ่มต้น แสดง Stats + กล่อง LMS ถูกต้อง
* คลิกแท็บ "คอร์สของฉัน (2)" แล้วสลับเนื้อหาไปแสดงรายการคอร์สถูกต้อง และเนื้อหาแท็บ "ภาพรวม" (ข้อความ "วิธีเข้าระบบ LMS") หายไปจาก DOM ระหว่างอยู่แท็บอื่น (`role="tab"` query ยืนยัน `data-state` ถูกต้อง)
* progress bar, ปุ่มเข้าเรียน/ดูบทเรียน, เอกสารดาวน์โหลด ยังทำงานเหมือนเดิมทุกจุดหลังย้ายเข้าแท็บ
* ทั้ง desktop (1440px) และมือถือ (390px) เลย์เอาต์ไม่ล้น ไม่มี error ใน console (นอกจาก network error ของ request ที่ไม่ได้ mock ซึ่งเป็นข้อจำกัด sandbox)
* `npx tsc --noEmit`, `npm run build` ผ่านสะอาด; `npx eslint` มี error เดิม 9 จุดใน `Dashboard.tsx` (การ cast `any` ใน data-loading logic บรรทัด 85-122) ซึ่งอยู่นอก diff ของรอบนี้ทั้งหมด (ตรวจด้วย `git diff` ยืนยันแล้ว) ไม่ใช่ของใหม่ที่เพิ่มมา

## 33.5 สรุปงานที่เกินขอบเขต "ง่าย ไม่เสี่ยง" ของรอบนี้ — รอการอนุมัติรอบถัดไป

ไม่มี — งานทั้งหมดที่ขอในรอบนี้ (ลบรูป, แก้การ์ดคอร์ส 2 จุด, จัด section หน้า Dashboard ใหม่) อยู่ในขอบเขตที่ทำได้ปลอดภัยและตรงไปตรงมา ไม่มีส่วนไหนที่ใหญ่/เสี่ยงเกินจนต้องเลื่อนไปรออนุมัติ

**สิ่งที่สังเกตเห็นระหว่างทางแต่ไม่ได้แก้ (นอกขอบเขตที่ขอ):** การ์ดคอร์สในหน้า Dashboard (`คอร์สของฉัน`) ยังโชว์ `c.tag` แบบดิบ (มี "ชุดที่ N –" ติดอยู่) ไม่ได้ผ่าน `tierLabel()` เหมือนหน้า `/courses`/`/course/:slug` — ถ้าต้องการให้ตรงกันด้วย เป็นการแก้เล็ก ๆ ที่ทำต่อได้ในรอบถัดไป *(อัปเดต: แก้ไปแล้วในรอบ §34 — ดูด้านล่าง)*

---

# 34. แก้ bug คำว่า "ชุด" vs "ชั้น" ที่ทำให้ tierLabel ไม่เคยทำงานจริง + คืนรูปที่ลบผิด + เพิ่มแท็บเอกสารใน Dashboard (14 ก.ย. 2569, ต่อจาก §33)

หลังจากส่งงานรอบ §33 ผู้ใช้ทักท้วง 2 เรื่อง: (1) ทำไมบอกว่าเข้า Supabase จริงไม่ได้ ทั้งที่เชื่อมต่อไว้แล้วใช้งานได้จริง และ (2) ให้ recheck ว่า Admin สอดคล้องกับหน้าที่แก้ไปหรือยัง พร้อมให้ไปค้นคว้า pattern ของระบบสากลอื่น ๆ มาก่อนออกแบบหน้า Dashboard แทนที่จะเดาเอง — ทั้งสองข้อถูกต้อง และนำไปสู่การเจอบั๊กจริงที่ควรแก้ทันที

## 34.1 เรื่อง "เข้า Supabase ไม่ได้" — เข้าใจผิด ไม่ใช่ข้อจำกัดจริง

Sandbox นี้มี **Supabase MCP connector** ต่ออยู่ตลอด (project `exybvjqjdqxonhesydhk` — โปรเจกต์เดียวกับที่แอปใช้จริงตาม `.env`) ที่ query DB ได้โดยตรงผ่าน SQL — แยกคนละส่วนกับ "เบราว์เซอร์ Playwright ในนี้ออกอินเทอร์เน็ตไม่ได้" ที่เคยเจอในรอบก่อน ๆ (นั่นเป็นข้อจำกัดของ browser sandbox เท่านั้น ไม่ใช่ของเครื่องมือ MCP) การพูดว่า "sandbox เข้า Supabase จริงไม่ได้" ในรอบ §32/§33 จึงเป็นการเข้าใจผิด/ไม่ได้ตรวจสอบให้ครบ — ตั้งแต่รอบนี้เป็นต้นไปจะ query ข้อมูลจริงก่อนแก้/ก่อนทดสอบเสมอเมื่อเกี่ยวกับข้อมูลใน DB

## 34.2 บั๊กจริงที่เจอจากการเช็คข้อมูลจริง — คืนรูป 5 ไฟล์ที่ลบผิดในรอบ §33

เช็คตาราง `courses` จริงพบว่า **5 คอร์สที่กำลังแสดงอยู่จริง (magnet, foundation, signal, stage, brand-host-architect) ใช้ `cover_image_url` ชี้ไปที่ 5 ไฟล์ที่เพิ่งลบทิ้งในรอบ §33.1** (`W-the-standard.png`, `W-live-explorers.png`, `the-signal.png`, `the-stage.png`, `W-the-strategic.png`) — รายงาน static-analysis เดิมเตือนไว้แล้วว่าเช็คจากโค้ดอย่างเดียวจะไม่เห็นการอ้างอิงผ่าน URL ใน DB แต่รอบที่แล้วไม่ได้ตรวจ DB จริงตามคำเตือนนั้น เพราะเข้าใจผิดว่าเข้าไม่ได้ (ดู 34.1)

**แก้แล้ว:** กู้ไฟล์ทั้ง 5 กลับมาจาก git history ก่อน merge เข้า main (commit `a93f1a6`) — และเช็คซ้ำทุกคอลัมน์ที่อาจเก็บ URL รูปในทุกตาราง (`courses.gallery_image_urls`, `events.background_image_url`, `toolbox_assets.cover_image_url`, `profiles.avatar_url`, `articles.cover_image_url`) ไม่พบการอ้างอิง `/images/` อื่นอีก ยืนยันว่าไฟล์ที่เหลืออีก 44 ไฟล์ที่ลบไปปลอดภัยจริงจากข้อมูลจริง ไม่ใช่แค่จาก static grep

## 34.3 บั๊กจริงอีกตัว — tierLabel() ใช้คำผิดมาตลอด ไม่เคยตัด prefix ได้จริงบน production

เช็ค `courses.tag` จริงพบว่าใช้คำว่า **"ชั้นที่"** (ชั้น = ระดับ/ชั้น) เช่น `"ชั้นที่ 1 — ไลฟ์ให้เป็น"` — แต่ `tierLabel()` ที่เขียนไว้ตั้งแต่รอบ §32 (และแก้ซ้ำในรอบ §33.2) ใช้ regex จับคำว่า **"ชุด"** (ชุด = set) ซึ่งเป็นคนละคำกันตั้งแต่ตัวอักษรที่ 2 — แปลว่า **`tierLabel()` ไม่เคยตัด prefix ออกได้จริงบนข้อมูลจริงเลยสักรอบเดียว** ตั้งแต่เริ่มมีฟีเจอร์นี้ ถึงแม้ Playwright test ทุกรอบก่อนหน้าจะ "ผ่าน" เพราะทดสอบด้วย mock data ที่พิมพ์คำว่า "ชุด" เองแทนที่จะใช้ข้อมูลจริง (บทเรียน: mock data ต้องอิงจากข้อมูลจริงเสมอ ไม่ใช่เดาจากสมมติฐานของตัวเอง)

**แก้แล้ว:** เปลี่ยน regex เป็น `/^(?:ชั้น|ชุด)[^-–—]*[-–—]\s*/` (รองรับทั้งสองคำ เผื่อ admin พิมพ์ไม่ตรงกันในอนาคต) และย้าย `tierLabel()` จากที่เคย copy-paste ซ้ำ 2 ที่ (`Courses.tsx`, `CourseDetail.tsx`) ไปเป็นไฟล์ shared `src/lib/courseTag.ts` ไฟล์เดียว เพราะตอนนี้มีจุดใช้งานที่ 3 แล้ว (Dashboard.tsx — ดู 34.4) ตรงตามที่เคยบันทึกไว้ใน README ว่า "ถ้าจะแก้ที่ 3 จุดขึ้นไปควรย้ายไป `src/lib/`" ทดสอบด้วยข้อมูล tag จริงทั้ง 5 คอร์สที่ query มา ยืนยันว่าตัด prefix ถูกทุกคอร์สแล้ว (ดู 34.6)

## 34.4 Recheck หน้า Admin (`AdminCourses.tsx`) — เจอจุดไม่สอดคล้อง 1 จุด แก้แล้ว

ช่อง "Tag / Code" ในฟอร์มแก้ไขคอร์ส (`AdminCourses.tsx`) มี placeholder เดิมเป็น `"SIGNAL"` ซึ่งชวนให้แอดมินเข้าใจผิดว่าควรพิมพ์โค้ดสั้น ๆ ตัวพิมพ์ใหญ่ ทั้งที่รูปแบบจริงที่ใช้และที่ `tierLabel()` คาดหวังคือประโยคเต็มแบบ `"ชั้นที่ 1 — ไลฟ์ให้เป็น"` — แก้ placeholder ให้ตรงกับรูปแบบจริง และเพิ่มข้อความอธิบายใต้ช่องว่าหน้าเว็บจะตัด prefix "ชั้นที่ N —" ออกให้อัตโนมัติตอนแสดงผล ไม่ต้องพิมพ์แยกสองช่อง

ฟิลด์อื่น ๆ ที่ตรวจ (Outcome Goal, Target Audience, Format Label, ราคา/โปรโมชั่น, สถานะ, level, เอกสาร/โมดูล) เทียบกับสิ่งที่หน้า public แต่ละหน้าอ่าน/แสดงแล้ว **สอดคล้องกันดี** ไม่พบจุดอื่นที่ต้องแก้

## 34.5 Dashboard — ค้นคว้า pattern จากระบบสากลจริง แล้วเพิ่มแท็บที่ 3

ค้นคว้า student dashboard ของ Teachable, Coursera, Thinkific ([sources](#) ด้านล่าง) พบ pattern ร่วมกันชัดเจน: ระบบเหล่านี้แยก **"คอร์ส/ความคืบหน้า"** ออกจาก **"เอกสาร/materials"** และ **"ใบประกาศ"** เป็นคนละส่วนเสมอ ไม่ฝังปุ่มดาวน์โหลดไว้ในการ์ดคอร์สแต่ละใบแบบที่ Dashboard เดิม (และที่แก้ไปในรอบ §33.3) ทำอยู่

**แก้โดยเพิ่มแท็บที่ 3 "เอกสาร"** (ใช้ shadcn Tabs ตัวเดียวกับ 2 แท็บก่อนหน้า) รวมเอกสารจากทุกคอร์สที่ลงทะเบียนไว้ในที่เดียว จัดกลุ่มตามชื่อคอร์ส แทนที่ปุ่มดาวน์โหลดที่เคยฝังอยู่ในการ์ดคอร์สแต่ละใบ (เหลือไว้แค่ข้อความสั้น ๆ บอกจำนวนไฟล์ + ลิงก์เชิญไปดูที่แท็บเอกสาร กันไม่ให้งงว่าเอกสารหายไปไหน) ตัวนับจำนวนไฟล์บนแท็บ ("เอกสาร (N)") อิงจากข้อมูลจริงเหมือนแท็บอื่น ๆ

**ที่ไม่ได้สร้าง (เพื่อความซื่อตรง ไม่ทำของปลอมให้ดูครบ):** ไม่ได้เพิ่มแท็บ "ใบประกาศ/Certificates" แยกต่างหาก แม้ระบบสากลจะมี เพราะ schema ปัจจุบันไม่มีไฟล์ใบประกาศหรือกลไกออกใบประกาศจริง (มีแค่ตัวเลขนับคอร์สที่เรียนจบในสถิติ "ใบประกาศ" ที่มีอยู่แล้ว) — การสร้างปุ่ม "ดาวน์โหลดใบประกาศ" ที่กดแล้วไม่มีอะไรเกิดขึ้นจะเป็นการสร้างของปลอมให้ดูเหมือนใช้งานได้ทั้งที่ไม่ได้ ถ้าต้องการฟีเจอร์นี้จริงต้องออกแบบระบบออกใบประกาศ (เก็บไฟล์/เทมเพลต) ก่อน — เป็นงานที่ใหญ่กว่าขอบเขต "ง่าย ไม่เสี่ยง" ของรอบนี้ จึงขอสรุปไว้ตรงนี้เพื่อรออนุมัติแยกต่างหาก แทนที่จะสร้างเองโดยไม่ถาม

## 34.6 ทดสอบแล้วอย่างไร (ครั้งนี้ทดสอบด้วยข้อมูลจริง ไม่ใช่ mock ที่เดาเอง)

ดึงข้อมูลจริงจากตาราง `courses` (ทั้ง 5 คอร์สที่ active), `course_modules`, และ `course_resources` ผ่าน Supabase MCP มาใช้เป็น mock response ของ Playwright โดยตรง (ค่า/ข้อความทุกตัวคัดลอกมาจาก DB จริง ไม่ได้พิมพ์เดาเอง) ยืนยันว่า:
* หน้า `/courses`: kicker ของทั้ง 5 คอร์สตัด prefix ถูกต้อง (`"FREE"`, `"ไลฟ์ให้เป็น"`, `"ไลฟ์ให้ขายได้"` ×2, `"ไลฟ์ให้วัดผลและทำซ้ำได้"`) และภาพหน้าปกทั้ง 5 คอร์สโหลดถูกไฟล์ (หลังกู้คืนใน 34.2) ตรงกับภาพตัวอย่างที่ผู้ใช้ส่งมาทุกจุด
* หน้า `/dashboard`: การ์ดคอร์สในแท็บ "คอร์สของฉัน" ก็ตัด prefix ถูกด้วย (ใช้ `tierLabel()` ตัวเดียวกับ 34.3) แท็บ "เอกสาร" รวมไฟล์จากคอร์สที่ลงทะเบียนจริงมาแสดงถูกต้อง จัดกลุ่มตามคอร์ส ดาวน์โหลดผ่าน signed URL เหมือนเดิม
* `npx tsc --noEmit`, `npm run build` ผ่านสะอาด; `npx eslint` error ที่เหลือทั้งหมด (`AdminCourses.tsx`/`CourseDetail.tsx`/`Dashboard.tsx` การ cast `any`) ยืนยันด้วย `git diff` แล้วว่าอยู่นอก diff ของรอบนี้ทั้งหมด ไม่ใช่ของใหม่
* Desktop (1440px) และมือถือ (390px) ไม่ล้นจอทั้งสองหน้า

Sources (ค้นคว้าตามที่ขอในรอบนี้):
* [Student dashboard – Teachable Help Center](https://support.teachable.com/en/articles/11691026-student-dashboard)
* [The Student Dashboard – Thinkific](https://support.thinkific.com/hc/en-us/articles/1500001538961-The-Student-Dashboard)
* [About Course Certificates – Coursera](https://www.coursera.support/s/article/learner-000001187?language=en_US)

---

# 35. Dashboard เป็น sidebar จริงแบบ Admin + certificates section + ตรวจ slug (14 ก.ย. 2569, ต่อจาก §34)

ผู้ใช้ทักท้วง §34 อีกครั้ง 3 เรื่อง: (1) ถามโครงสร้าง `slug` ว่าจัดการ/ตรวจสอบอะไรไปบ้าง (2) ไม่พอใจที่ Dashboard ยังเป็นการ์ดแท็บที่ดูอึดอัด ทั้งที่มีพื้นที่ว่างเยอะ อยากได้แบบ Admin จริง ๆ ที่กดหัวข้อฝั่งซ้ายแล้วโชว์เนื้อหาฝั่งขวา (3) ให้สร้างโครงส่วน "ใบประกาศ" ไว้เลย ไม่ต้องเปิดใช้งานก็ได้แต่ให้มีโครงสร้างรองรับ และ (4) ถามที่มาของเลข Master Key "CR-0001" ที่เห็นในภาพแคปหน้าจอ

## 35.1 เรื่อง `slug`

`courses.slug` เป็น routing key หลักของทั้งระบบ — ใช้โดยตรงใน `/course/:slug` (`CourseDetail.tsx`, `Enroll.tsx` query ด้วย `.eq('slug', id)`), เป็น key เชื่อม progress/enrollment/resources ผ่าน `course_id` และใช้สร้างลิงก์จาก `Home.tsx`/`Courses.tsx`/`Dashboard.tsx`/`AdminCourses.tsx`

ตรวจ `CURRENT_COURSE_SLUGS` (allowlist 5 slug ที่ hardcode ไว้ใน `Courses.tsx` และ `Dashboard.tsx`, มีอยู่ก่อนรอบที่ฉันเริ่มทำงาน ไม่ใช่สิ่งที่ฉันเพิ่มเอง) เทียบกับข้อมูลจริงในตาราง `courses` (14 คอร์สทั้งหมด) พบว่า:
* คอร์สอีก 9 รายการ (hook-and-hold, live-sales-system, live-tech-setup, ai-for-live-commerce, live-psychology-conversion, host-identity-personal-brand, live-commerce-business-global, live-commerce-starter-kit) ทั้งหมด **`is_active = false`** อยู่แล้ว — เพราะทั้ง `Courses.tsx` และ `Dashboard.tsx` query ด้วย `.eq('is_active', true)` ก่อนอยู่แล้ว ตัว `CURRENT_COURSE_SLUGS` จึงไม่ได้ซ่อนอะไรเพิ่มในสถานการณ์ปัจจุบัน — ซ้ำซ้อนกับ `is_active` แต่ไม่ใช่บั๊ก (เป็นเหมือนตาข่ายกันพลาดสองชั้น เผื่อมีใครเผลอเปิด `is_active` ของคอร์สที่ยังไม่พร้อมจริง)
* **สิ่งที่เจอและต้องแจ้งแยกต่างหาก (ไม่ใช่บั๊กของโค้ดที่แก้ได้ แต่เป็นเนื้อหาใน `Home.tsx` ซึ่งอยู่ในรายการห้ามแตะ):** `Home.tsx` มีลิงก์คอร์สแบบ hardcode ที่ชี้ไปยัง slug ของคอร์สที่ `is_active:false` เหล่านี้โดยตรง (เช่น `hook-and-hold`, `live-sales-system`, `live-commerce-business-global` ฯลฯ) — และบางอันชื่อที่โชว์ไม่ตรงกับ title จริงของ slug นั้นเลย เช่น การ์ดโชว์ชื่อ "STAGE" แต่ลิงก์ไปที่ slug `live-commerce-business-global` (title จริงคือ "LIVE COMMERCE BUSINESS & GLOBAL" คนละคอร์สกับ STAGE) เพราะ `CourseDetail.tsx` ไม่ได้กรอง `is_active` เลย (ต่างจาก `Courses.tsx`/`Dashboard.tsx`) คนที่กดลิงก์จาก Home จะเห็นหน้ารายละเอียดของคอร์สแบบร่างที่ยังไม่พร้อมได้จริง — เรื่องนี้อยู่ใน `Home.tsx` ซึ่งเป็นไฟล์ที่ตกลงกันไว้ว่าจะไม่แตะต้องเด็ดขาด จึงแค่รายงานให้ทราบ ไม่ได้แก้ไขเอง ถ้าต้องการให้แก้ต้องสั่งแยกชัดเจนอีกครั้ง

## 35.2 Dashboard — เปลี่ยนจากแท็บเป็น sidebar จริงแบบ Admin

**สร้างใหม่ทั้งหมด:** ลบ `Tabs` (shadcn) ออก เปลี่ยนเป็น flex สองคอลัมน์ — เมนูฝั่งซ้าย (sticky) + เนื้อหาฝั่งขวา (`section` state ธรรมดา แทนที่ Radix Tabs) กดหัวข้อฝั่งซ้ายแล้วสลับเนื้อหาฝั่งขวาทันที ตรงตามที่ขอ

**ทำไมไม่ใช้ component `Sidebar` ของ Admin (`AdminLayout`) ตรง ๆ:** ลองแล้วพบปัญหาเชิงโครงสร้างจริง — component `Sidebar` ของ shadcn ที่ `AdminLayout` ใช้ถูกออกแบบให้ "เป็นเจ้าของทั้งหน้าจอ" (`position: fixed`, สูงเต็ม viewport, ไม่มี navbar/footer อื่นของเว็บแทรกอยู่) เพราะหน้า Admin ทั้งหมดไม่มี `CourseNavbar`/`Footer` ของเว็บหลัก แต่หน้า Dashboard มีทั้ง `CourseNavbar` (sticky ด้านบน) และ `Footer` (ด้านล่าง) อยู่ในโฟลว์ปกติของหน้าอยู่แล้ว — ถ้าเอา `Sidebar` แบบ fixed มาวางซ้อนจะไปทับ navbar/footer ของเว็บจริง จึงสร้างเมนูฝั่งซ้ายแบบใหม่เอง (`sticky top-24` ธรรมดา ไม่ fixed) ที่ให้ผลลัพธ์แบบเดียวกันทุกจุด (กดฝั่งซ้าย → โชว์ฝั่งขวา, active state เน้นด้วยเส้นซ้าย+พื้นหลัง) แต่ไม่ชนกับโครงหน้าเว็บที่มีอยู่แล้ว — ความเสี่ยงต่ำกว่าและไม่ต้องแก้ทั้งหน้าใหม่ทั้งระบบ

**แก้พื้นที่ว่าง:** container กว้างขึ้นจาก `max-w-2xl` (672px, แคบตั้งใจไว้แบบมือถือ) เป็น `max-w-5xl` (1024px) — stat tiles ที่เคยเป็น 2×2 อึดอัด ตอนนี้โชว์ 4 คอลัมน์แถวเดียวบนจอกว้าง ใช้พื้นที่ที่ว่างอยู่เดิมแทนที่จะปล่อยว่างไว้ ยืนยันด้วย screenshot จริงว่าไม่มีพื้นที่ว่างเหลือแบบเดิมแล้ว

มือถือ: เมนูฝั่งซ้ายพับเป็นแถบแนวนอนเลื่อนได้เหนือเนื้อหา (`flex md:flex-col` สลับทิศทางตาม breakpoint) แทนที่จะเป็น drawer แบบ Admin — เพราะทดสอบแล้วว่าปุ่มเลื่อนแนวนอนธรรมดาเสี่ยงน้อยกว่าและไม่ต้องพึ่ง mobile Sheet ของ Sidebar component ที่ไม่ได้ถูกออกแบบมาให้ใช้นอกบริบท Admin

## 35.3 เพิ่มส่วน "ใบประกาศ" — สร้างโครงไว้ตามที่ขอ ทำงานทีเดียวจบ

เพิ่มเป็นหัวข้อที่ 4 ในเมนู มีตัวนับ (ตัวเลขคอร์สที่เรียนจบครบทุกบทเรียน คำนวณจากข้อมูลจริง `module_progress`) และ badge "เร็วๆ นี้" ต่อท้ายชื่อหัวข้อในเมนูให้เห็นชัดว่ายังไม่เปิดใช้งานเต็มรูปแบบ — คลิกเข้าไปแล้วเห็นรายชื่อคอร์สที่เรียนจบจริง (ถ้ามี) แต่ละคอร์สมี badge "เร็วๆ นี้" แทนปุ่มดาวน์โหลด พร้อมข้อความอธิบายว่าโครงสร้างเตรียมไว้แล้ว รอระบบออกใบประกาศจริงเปิดใช้งาน

**ทำไมไม่ทำปุ่มดาวน์โหลดที่ใช้งานได้จริงเลย:** เพราะ schema ปัจจุบัน (`courses`, `course_enrollments`, `module_progress`, ฯลฯ) ไม่มีตาราง/ไฟล์ใบประกาศอยู่จริง การทำปุ่มที่กดแล้วไม่มีอะไรเกิดขึ้น หรือใช้ placeholder URL ปลอม จะเป็นการสร้างของที่ดูเหมือนใช้งานได้ทั้งที่ไม่ได้ ซึ่งขัดกับสิ่งที่ควรทำ — แต่โครงสร้าง UI/state/การนับจำนวนคอร์สที่จบแล้วสร้างไว้ครบตามที่ขอแล้ว เมื่อมีระบบออกใบประกาศจริง (เก็บไฟล์ในตาราง/Storage bucket ใหม่) จะต่อยอดจากส่วนนี้ได้ทันทีโดยไม่ต้องรื้อโครงสร้างเดิม

## 35.4 Master Key "CR-0001" ที่เห็นในภาพ — มาจากไหน

เป็น **ข้อมูลปลอมที่ฉันกำหนดขึ้นเองในสคริปต์ทดสอบ Playwright** (mock response ของ RPC `ensure_master_student_account` และตาราง `user_accounts`) เพื่อจำลอง session ผู้ใช้ที่ login แล้วสำหรับถ่าย screenshot ตรวจสอบหน้าตาเท่านั้น **ไม่ใช่ข้อมูลจริงจากฐานข้อมูล** และไม่มีคำว่า `"CR-0001"` อยู่ในซอร์สโค้ดของแอปเลยสักจุด (เช็คด้วย grep ทั้งโปรเจกต์ยืนยันแล้ว) — Master Key จริงของผู้ใช้แต่ละคนมาจากตาราง `user_accounts.student_id` ที่ query ตาม `line_user_id` หรือ email ของ session ที่ login จริง (ดูฟังก์ชัน `load()` ใน `Dashboard.tsx`) ขออภัยที่ไม่ได้อธิบายไว้ตั้งแต่รอบก่อนว่า screenshot ที่ส่งมาเป็นข้อมูลจำลอง ไม่ใช่ของจริง

## 35.5 ทดสอบแล้วอย่างไร

ใช้ข้อมูลคอร์สจริงจาก Supabase (foundation, signal) เหมือนรอบก่อน mock module_progress ให้ foundation เรียนจบครบทุกบทเพื่อทดสอบ flow "ใบประกาศ" โดยเฉพาะ ยืนยันว่า:
* เมนูฝั่งซ้ายกดแล้วสลับเนื้อหาฝั่งขวาถูกต้องครบทั้ง 4 หัวข้อ, active state เน้นถูกต้อง
* Stats แสดง 4 คอลัมน์เต็มความกว้างบนจอ 1440px ไม่มีพื้นที่ว่างเหลือแบบเดิม
* หัวข้อ "ใบประกาศ" แสดงคอร์สที่เรียนจบจริง (foundation, 100% สำเร็จ) พร้อม badge "เร็วๆ นี้" ถูกต้อง ไม่มีปุ่มดาวน์โหลดปลอม
* มือถือ (390px): เมนูพับเป็นแถบเลื่อนแนวนอนเหนือเนื้อหา ไม่ล้นจอ
* `npx tsc --noEmit`, `npm run build` ผ่านสะอาด; `npx eslint` เหลือเฉพาะ error `any` เดิมที่มีมาก่อนรอบนี้ (ยืนยันด้วย `git diff`) และแก้ warning `react-hooks/exhaustive-deps` ใหม่ 1 จุดที่เกิดจากการรีแฟกเตอร์ `statsData` แล้ว

---

# 36. บั๊กจริง: บันทึกคอร์สใน Admin แล้วไม่ขึ้นหน้ารวมหลักสูตร + Admin ให้ดูสบายตาขึ้น (14 ก.ย. 2569, ต่อจาก §35)

ผู้ใช้รายงานปัญหาจริง: "บันทึกแล้วไม่แสดงผล ดึงคอร์สที่มีอยู่มาแสดงในหน้ารวมหลักสูตรไม่ได้ทั้งๆที่บันทึกและกรอกราคาไปแล้ว" พร้อมขอให้ปรับสี/ตัวหนังสือใน Admin ให้สบายตาไม่ลายตา และเพิ่มคำอธิบายฟิลด์ที่จำเป็น/มีข้อบังคับ

## 36.1 หาสาเหตุจริงจากข้อมูลจริงใน Supabase ก่อนแก้

Query ตาราง `courses` ทั้งหมด (14 คอร์ส) พบว่า: `RequireAdmin` (การ์ดกั้นทาง Admin) และ RLS policy ของตาราง `courses` ใช้ฟังก์ชัน `has_role()` ตัวเดียวกันทุกจุด — ตรวจสอบ `pg_policies`/`has_role()` แล้วยืนยันว่าไม่ใช่ปัญหาสิทธิ์การเขียน (ถ้าเข้าหน้า Admin ได้ ก็บันทึกได้แน่นอน)

**สาเหตุจริงคือ `CURRENT_COURSE_SLUGS`** — ค่าคงที่ hardcode รายชื่อ slug ไว้แค่ 5 คอร์ส (`magnet, foundation, signal, stage, brand-host-architect`) ใน `Courses.tsx` และ `Dashboard.tsx` ที่มีอยู่ **ก่อน**ที่ฉันจะเริ่มทำงานในโปรเจกต์นี้ (ยืนยันด้วย `git log -S`) กรองซ้ำอีกชั้นหลังจากกรอง `is_active` แล้ว — คอร์สไหนก็ตามที่ไม่ใช่ 5 slug นี้ จะ**ไม่มีทางแสดงบนหน้ารวมหลักสูตรหรือ Dashboard ได้เลย ไม่ว่าจะตั้ง `is_active = true` หรือกรอกราคาครบแค่ไหนก็ตาม** และ Admin UI ไม่มีจุดไหนบอกเรื่องนี้เลย — ตรงกับอาการที่รายงานเป๊ะ

รอบ §35 เคยตรวจเจอค่าคงที่ตัวนี้แล้ว แต่สรุปผิดว่า "ไม่ใช่บั๊ก แค่ซ้ำซ้อนกับ is_active" เพราะตอนนั้นเช็คแค่ข้อมูลที่มีอยู่แล้วในตาราง (บังเอิญ 5 คอร์สที่ active ตรงกับ allowlist พอดี) โดยไม่ได้คิดถึงกรณีแอดมินเพิ่ม/เปิดใช้คอร์สใหม่ในอนาคต — เป็นการสรุปที่ผิดพลาด ขออภัยและแก้ไขจริงในรอบนี้

**แก้แล้ว:** ลบ `CURRENT_COURSE_SLUGS` และการกรองด้วยมันออกทั้งหมดจาก `Courses.tsx` และ `Dashboard.tsx` — ตอนนี้ `is_active = true` เป็นสวิตช์เดียวที่ควบคุมว่าคอร์สจะแสดงบนเว็บสาธารณะหรือไม่ ตรงตามที่ Admin UI ควรทำงาน

## 36.2 ปรับสีและตัวหนังสือ Admin ให้สบายตาขึ้น

ลดจำนวนเฉดสีและระดับความเข้มของตัวหนังสือที่ใช้แบบไม่มีระบบ:
* **สี accent เหลือ 2 สีตามความหมาย**: แดง (`#CC0033`) สำหรับปุ่มหลัก/danger, เขียว (`#34A853`) สำหรับสถานะ "เปิดใช้งาน/เผยแพร่แล้ว" — เอาสีทอง (`#D4A843`) ที่เคยใช้แบบไม่มีความหมายชัดเจน (hover ปุ่มแก้ไข, สีโค้ดโปรโมชั่น) ออกทั้งหมด
* **ระดับสีตัวหนังสือ (opacity) ลดจาก ~9 ระดับ (white/70,60,55,50,40,35,30,25,20) เหลือ 4 ระดับที่มีความหมายชัดเจน**: `text-white` (หัวข้อ/เน้น), `/60` (เนื้อหารอง), `/30` (label/meta/hint), `/20` (placeholder/disabled) — ยกเว้น badge "Hidden/ปิด" ที่คงไว้ 5 ระดับพิเศษ (`/50`) เพราะเป็นชุดคู่กับ badge เขียว "เผยแพร่แล้ว" (`bg-[#34A853]/15`) ให้อ่านคู่กันง่าย ไม่ใช่ค่าที่ใส่เดี่ยวๆ แบบสุ่ม
* **แถวคอร์สในลิสต์**: เปลี่ยนจากจุดสีกลม (5 เฉดสีลอยเรียงกัน มองแล้วเหมือนลูกกวาด) เป็นแถบสีบางๆ ด้านซ้ายของแถว (`border-l-2`) — ข้อมูลเดิมครบ (สี accent ของคอร์ส) แต่ไม่แย่งสายตาเท่าจุดสีสดลอยกลางแถว
* **เพิ่ม badge "เผยแพร่แล้ว" (เขียว) คู่กับ "Hidden" (เทา)** ในลิสต์คอร์ส — เดิมมีแค่ badge "Hidden" ตอน inactive เท่านั้น ไม่มี badge ฝั่งตรงข้ามตอน active ทำให้ดูไม่สมดุลและอาจมองข้ามสถานะไปได้ ตอนนี้เห็นสถานะชัดเจนทุกแถวโดยไม่ต้องเดา

## 36.3 เพิ่มคำอธิบายฟิลด์ที่จำเป็น/มีข้อบังคับ

* **แบนเนอร์ "ก่อนคอร์สนี้จะแสดงบนเว็บสาธารณะ ต้องมีครบ"** — แสดงตลอดเวลาที่เปิดหน้าแก้ไขคอร์ส (ไม่ใช่ซ่อนอยู่ในแท็บใดแท็บหนึ่ง) สรุป 3 ข้อ: (1) Slug + ชื่อหลักสูตร บันทึกไม่ได้เลยถ้าขาด (2) ต้องเปิดสวิตช์ "เผยแพร่แล้ว" (3) ราคา เว้นว่างได้ถ้าฟรี แต่ถ้าลืมกรอกจะขึ้น "ไม่มีราคา" แทน — ตอบตรงคำถาม "บันทึกแล้วทำไมไม่ขึ้น" ที่ผู้ใช้เจอ
* **เครื่องหมาย `*` สีแดงต่อท้าย label** ของฟิลด์ที่บังคับกรอก (Slug, ชื่อหลักสูตร, รหัสส่วนลด, หลักสูตรที่ผูกโปรโมชั่น) ผ่าน `Field` component ตัวใหม่ที่รับ prop `required` — ใช้ CSS `::after` แทนการพิมพ์ " *" ต่อท้ายข้อความ label ตรงๆ เพื่อให้แก้ที่เดียวใช้ได้ทุกฟิลด์
* **hint text ใต้ฟิลด์** ผ่าน prop ใหม่ `hint` บน `Field` — ใช้กับ Slug (อธิบายรูปแบบ URL), Tag (อธิบายพฤติกรรมการตัด prefix อัตโนมัติ)
* **กล่องอธิบายสวิตช์ "เผยแพร่แล้ว/Hidden"** ขยายจากป้ายคำเดียวเป็นกล่องพร้อมคำอธิบายผลลัพธ์ชัดเจนทั้ง 2 สถานะ ("เปิดอยู่ — แสดงบนหน้ารวมหลักสูตรและลงทะเบียนได้ทันที" / "ปิดอยู่ — ถูกซ่อนจากทุกหน้าเว็บสาธารณะ ไม่ว่าฟิลด์อื่นจะกรอกครบแค่ไหน") — ตรงจุดที่เคยเป็นสาเหตุของปัญหาในรอบนี้พอดี
* **แถวราคาในลิสต์คอร์ส**: ถ้าไม่มีราคา ขึ้นข้อความ "ไม่มีราคา" สีจางแทนที่จะปล่อยว่างเปล่า (ก่อนหน้านี้ช่องราคาว่างดูเหมือนข้อมูลหาย ทั้งที่จริงคือยังไม่ได้กรอก)

## 36.4 ทดสอบแล้วอย่างไร

ทดสอบด้วยข้อมูลคอร์สจำลองที่มี slug **นอกเหนือ** จาก allowlist เดิม (เช่น `hook-and-hold`, `live-sales-system`) ตั้ง `is_active: true` ยืนยันว่า:
* หน้า `/courses` แสดงคอร์สทั้งหมดที่ `is_active = true` ครบ ไม่ใช่แค่ 5 คอร์สเดิมอีกต่อไป — คือการยืนยันว่าบั๊กที่รายงานแก้จริงแล้ว
* หน้า Admin (`/admin/courses`, จำลอง session แอดมินด้วยการฝัง fake auth token + mock RPC `has_role` คืนค่า `true`): เปิดหน้าแก้ไขคอร์สแล้วเห็นแบนเนอร์คำอธิบาย, เครื่องหมาย `*` ที่ฟิลด์บังคับ, กล่องอธิบายสวิตช์เผยแพร่ ครบถ้วนตามที่ออกแบบ ทั้งจอ desktop (1440px) และมือถือ (390px) ไม่ล้นจอ
* ไม่มี error ใน console (นอกจาก network error ของ request ที่ไม่ได้ mock ซึ่งเป็นข้อจำกัด sandbox)
* `npx tsc --noEmit`, `npm run build` ผ่านสะอาด; `npx eslint` เหลือเฉพาะ error `any` เดิมที่มีมาก่อนรอบนี้ทั้งหมด (ยืนยันด้วย `git diff --stat` ว่าบรรทัดที่ error ไม่ได้อยู่ใน diff ของรอบนี้)

---

# 37. DEPENDENCY VULNERABILITIES — 4 ยังไม่ได้แก้ ต้องอัปเกรด major version (15 ก.ย. 2569)

ตรวจสอบแล้ว: รัน `npm audit fix` (ไม่ใช้ `--force`) แก้ไปแล้ว 19 จาก 23 รายการที่ `npm audit` เจอ (postcss/ws/yaml และ transitive deps — อยู่ใน semver range เดิม ไม่กระทบ `package.json`)

**เหลือ 4 รายการที่ตั้งใจไม่แตะ เพราะการแก้ต้องอัปเกรด major version ที่กระทบวงกว้างทั้งระบบ:**

| แพ็กเกจ | Severity | ต้องอัปเกรดเป็น | กระทบ |
|---|---|---|---|
| `esbuild` (ผ่าน `vite`) | moderate | Vite 5 → 8 | ทั้ง build pipeline/config/plugin ที่ใช้อยู่ |
| `react-router` / `react-router-dom` | moderate | v6 → v7 | ทุก route/page ในเว็บ (API เปลี่ยนหลายจุดใน v7) |

ความเสี่ยงจริงของทั้ง 2 ตัว ณ ตอนนี้:
* **esbuild**: ช่องโหว่นี้กระทบเฉพาะตอนรัน dev server (`vite dev`) เท่านั้น ไม่กระทบ production build ที่ deploy จริงบน Vercel
* **react-router**: เป็นเคส open-redirect ที่ต้องมีเงื่อนไขเฉพาะ ไม่ใช่ critical/RCE

**ห้ามรัน `npm audit fix --force` แบบไม่ได้วางแผน** เพราะจะ bump ทั้ง Vite และ React Router ข้าม major version พร้อมกันในคำสั่งเดียว — เสี่ยง build/route พังทั้งเว็บโดยไม่รู้ตัว ถ้าจะแก้ 4 รายการนี้ ต้องแยกเป็นงานอัปเกรดของตัวเอง วางแผน breaking-change ของแต่ละตัว (โดยเฉพาะ React Router v7 API ที่เปลี่ยนจาก v6) แล้วทดสอบทุก route ก่อน merge

ตรวจสอบสถานะปัจจุบันได้ด้วย `npm audit` — ถ้าตัวเลขมากกว่า 4 แปลว่ามี dependency ใหม่ที่ยังไม่ได้ patch เพิ่มเข้ามา ต้องรัน `npm audit fix` (แบบไม่ force) ซ้ำก่อน

---

# 38. ADMIN — กฎการออกแบบ (15 ก.ย. 2569)

**Admin ไม่ใช่หน้าที่โชว์ใคร เป็นเครื่องมือทำงานภายใน (internal tool) เท่านั้น**

บทเรียนจากรอบแก้ `/admin/students`: หน้าแรกที่ส่งไปมี summary เป็นการ์ดมีไอคอนประดับ 4 ใบ แต่ timeline กิจกรรมกลับ**ไม่โชว์เวลา** ทั้งที่ข้อมูล timestamp เต็ม (`created_at`/`downloaded_at`) มีอยู่แล้วในทุก record — โชว์แค่หัวข้อวันที่แล้วซ่อนเวลาไปเฉยๆ เป็น**บั๊กจริงที่กระทบการใช้งาน** (audit/ตรวจสอบข้อพิพาทต้องรู้เวลาแม่นยำ) ไม่ใช่เรื่องสไตล์ที่มองข้ามได้

ห้าม:
* เสียเวลาใส่กราฟิก ไอคอนประดับ การ์ดสีสัน หรือ UI ที่สวยแต่ไม่ช่วยให้ทำงานเร็วขึ้น ในหน้า Admin
* ปล่อยผ่านเรื่องแสดงผลข้อมูลไม่ครบ (เช่น มี timestamp ในฐานข้อมูลแต่ไม่โชว์) เพียงเพราะหน้าตา build ผ่านและดูดี

ให้:
* ออกแบบ Admin แบบเรียบ (plain/dense), ใช้สีตามแบรนด์เท่าที่จำเป็น (เช่น gold accent `#D4A843` ที่ใช้อยู่แล้วทั่ว Admin) ไม่ใช่เพิ่มสี/ไอคอนเพื่อความสวยงามเฉยๆ
* จัดคอลัมน์ให้สแกนง่าย: label ซ้าย/ค่าขวา, ใช้ font-mono กับตัวเลข วันที่ เวลา และ ID
* ทุกจุดที่เป็น audit/tracking (log การซื้อ, การดาวน์โหลด, การเปลี่ยนสถานะ ฯลฯ) **ต้องโชว์วันที่ + เวลาเต็ม** ไม่ใช่จัดกลุ่มแค่ระดับวันแล้วซ่อนเวลา
* ก่อนส่งงานทุกครั้ง เปิดดูผลจริง (screenshot หรือรันจริง) เทียบกับ requirement ทีละข้อ ไม่ใช่แค่ `npm run build` ผ่านแล้วถือว่าเสร็จ

---

# 39. LOG แยกตามประเภทจริง + หน้า PROFILE (15 ก.ย. 2569, ต่อจาก §38)

## 39.1 `/admin/students` — เลิกรวม log เป็นเส้นเดียว แยกเป็น 3 หมวดจริง

ของเดิม (ตามที่แก้ใน §38) ยัง**รวม**เหตุการณ์ทุกประเภท (ซื้อ/โหลดเอกสาร/โหลด Toolbox) เป็น feed เดียวเรียงเวลา แค่ติด label บอกประเภทต่อแถว — ยังไม่ใช่การแยกหมวดจริง

วิเคราะห์จากปัญหาจริงที่แอดมินต้องเช็ค:

```text
"ซื้อแล้วแต่ไม่ได้คอร์ส"        → ต้องดู ประวัติการซื้อคอร์ส (course_enrollments)
"ขอคืนเงินแต่โหลดเอกสารไปแล้ว"  → ต้องดู ประวัติการดาวน์โหลดเอกสารคอร์ส (resource_download_logs)
"อ้างว่าไม่เคยโหลดของฟรี"       → ต้องดู ประวัติการดาวน์โหลด Toolbox (toolbox_downloads)
```

แต่ละปัญหาอ้างอิงคนละตาราง คนละ context — จึงแยกเป็น 3 section อิสระ ไม่ merge กัน แอดมินเปิดตรงหมวดที่เกี่ยวกับข้อร้องเรียนได้ทันที ไม่ต้องไล่สแกน feed รวม

คำในแต่ละแถวก็ตัดให้สั้นลง จากประโยคเต็ม ("ซื้อแล้ว · 4,900 ฿ · ใช้โค้ด WELCOME10 (ลด 10%)") เป็นคอลัมน์สั้น: ชื่อคอร์ส / สถานะ / ราคา / โค้ดส่วนลด (ถ้ามี) / วันเวลา — สแกนเป็นตารางได้ ไม่ต้องอ่านประโยค

## 39.2 หน้า `/profile` — ใหม่

> **อัปเดต 4 ต.ค. 2569:** เจ้าของระบบสั่งเพิ่มชื่อ-นามสกุลไทย/อังกฤษ (ใช้ออกใบประกาศ) และจังหวัด เป็นฟิลด์บังคับ · อาชีพเปลี่ยนเป็นรายการให้เลือก · ข้อห้ามเรื่องเบอร์โทร/เลขบัตร/ที่อยู่ละเอียดยังใช้อยู่ — ดู §41

ตรวจสอบก่อนแล้ว (grep ทั้ง `src/pages/`) ว่าไม่เคยมีหน้า profile ผู้ใช้แยกมาก่อน — มีแค่ header เล็กๆ ใน Dashboard ที่โชว์ชื่อ/Master Key เฉยๆ แก้ไขอะไรไม่ได้

อ้างอิงจาก pattern ของระบบบัญชีผู้ใช้จริงที่มีเอกสารสาธารณะตรวจสอบได้ (Udemy account/profile settings — support.udemy.com): มีชื่อ, รูป, headline/bio ให้แก้ และ**ต้องมีอีเมลเสมอ**เป็นข้อมูลหลักของบัญชี — เอาเฉพาะ pattern "ต้องมีอีเมล" กับ "แก้ชื่อที่แสดงได้" มาใช้ ไม่เอาทั้งหมดของ Udemy เพราะโปรเจกต์นี้ไม่ใช่ marketplace ผู้สอน

ฟิลด์ที่มี — **ใช้เฉพาะฟิลด์ที่ระบบนี้เก็บอยู่แล้วที่อื่น ไม่เพิ่มข้อมูลส่วนตัวใหม่**:
* อีเมล (บังคับ, เหมือน `Register.tsx`) — ดึงจาก `auth.users.email` ของ session
* ชื่อที่แสดง (`profiles.display_name`)
* เพศ / ช่วงอายุ / อาชีพ (`profiles.gender/age_range/occupation` — ใช้ตัวเลือกชุดเดียวกับฟอร์มใน `Toolbox.tsx` เป๊ะ ไม่สร้างชุดใหม่)
* Master Key (อ่านอย่างเดียว)

**ห้ามเพิ่ม**: เบอร์โทร, เลขบัตรประชาชน, ที่อยู่, ข้อมูลบัตรเครดิต หรือข้อมูลส่วนตัวอ่อนไหวอื่นใดที่ระบบยังไม่เคยเก็บมาก่อน — ตรงตามที่สั่ง

### บัญชี LINE — บังคับใส่อีเมลจริง

`supabase/functions/liff-auth/index.ts` สร้าง "synthetic email" รูปแบบ `line_<line_user_id>@line.creatr365.com` ให้บัญชีที่สมัครผ่าน LINE — อีเมลนี้ติดต่อจริงไม่ได้ หน้า Profile ตรวจจับ pattern นี้ (`isSyntheticEmail()`) แล้ว**บังคับ**ให้กรอกอีเมลจริงก่อนบันทึกได้ ถ้ายังเป็น synthetic หรือกรอกรูปแบบไม่ถูกต้อง จะ block การบันทึกทั้งหมด (ไม่ใช่แค่ field อีเมล)

การเปลี่ยนอีเมลไปผ่าน `supabase.auth.updateUser({ email })` ของ Supabase เอง (ต้องยืนยันทางอีเมลใหม่ก่อนมีผลจริง) — ไม่ใช่เขียนทับตาราง `user_accounts`/`profiles` ตรงๆ เพราะจะกระทบ Master Key resolution ที่ README ห้ามแตะโดยไม่จำเป็น (ดู §3)

## 39.3 ทดสอบแล้วอย่างไร

รัน mocked-session smoke test (mock localStorage session + mock ทุก endpoint ที่เรียก, ไม่มีการเขียนข้อมูลจริงลง Supabase) กับ build จริงบน local server:

* `/dashboard` — ปุ่ม "โปรไฟล์" ใน header ขึ้นจริง, ดาวน์โหลดเอกสาร + consent dialog ยังทำงานถูกเหมือนเดิม (regression check)
* `/profile` — จำลอง session อีเมล synthetic แบบ LINE: ข้อความเตือนขึ้นถูก, ช่องอีเมลว่างให้กรอกเอง, กดบันทึกทั้งที่ยังไม่กรอกอีเมล → **block จริง ไม่มีการเขียนข้อมูลใดๆ** (ตรวจจาก request ที่ยิงจริง), กรอกอีเมลจริง + ข้อมูลอื่นแล้วบันทึก → เขียน `profiles` จริงตามที่กรอก
* `/admin/students` — ค้นหาแล้วเห็น 3 section แยกจริง (ซื้อคอร์ส / เอกสารคอร์ส / Toolbox) พร้อมวันเวลาเต็มทุกแถว
* `npx tsc --noEmit`, `npx eslint` (เฉพาะไฟล์ที่แก้ — สะอาด, error `any` ที่เหลือใน `Dashboard.tsx` เป็นของเดิมก่อนรอบนี้ทั้งหมด), `npm run build` ผ่านสะอาด

---

# 40. บั๊กจริง: อัปโหลดไฟล์ Toolbox (PDF/ZIP) ไม่ผ่าน + เพิ่ม consent เงื่อนไขไฟล์ฟรี (17 ก.ย. 2569)

ผู้ใช้รายงาน: อัปโหลดไฟล์เข้า Toolbox ไม่ได้ ลอง `.zip` แล้วบางไฟล์ใส่ไม่ได้ ลอง `.pdf` ใส่ไม่ได้เลยสักไฟล์

## 40.1 หาสาเหตุจริงจาก source ของ `@supabase/storage-js` เอง (ยืนยันจากซอร์สโค้ด ไม่ใช่การเดา)

`AdminToolbox.tsx` (`uploadCover`/`uploadFile`) สร้าง storage key ด้วย `` `${Date.now()}-${file.name}` `` โดยใช้ชื่อไฟล์เดิมตรง ๆ — ตรวจซอร์สโค้ด `storage-js` (`StorageFileApi.uploadOrUpdate`) พบว่า path ที่ส่งเข้าไปสร้าง request URL **ไม่ถูก URL-encode เลย** ชื่อไฟล์ที่มีช่องว่าง/ภาษาไทย/วงเล็บ/สัญลักษณ์ (ปกติมากสำหรับไฟล์ที่แอดมินเซฟไว้ เช่น `"เทมเพลต Caption (1).pdf"`) จึงทำให้ request พังได้ขึ้นอยู่กับตัวอักษรที่มีในชื่อไฟล์นั้น ๆ — ตรงกับอาการที่รายงาน: zip บางไฟล์ผ่านบางไฟล์ไม่ผ่าน (ขึ้นกับชื่อ), PDF ที่ทดสอบไม่ผ่านเลยสักไฟล์ (ถ้าไฟล์ทดสอบตั้งชื่อภาษาไทย/มีช่องว่างทุกไฟล์)

**จุดสำคัญ:** `AdminCourses.tsx` (`uploadResourceFile`, bucket `course-resources`) มี `safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_')` อยู่ก่อนแล้ว — เป็นหลักฐานว่า pattern "sanitize ชื่อไฟล์ก่อนใช้เป็น storage key" **มีอยู่แล้วในระบบ** แค่ไม่ได้ถูกใช้ที่ `AdminToolbox.tsx` จุดเดียว จึงแก้โดยดึง pattern เดิมมาใช้ซ้ำ (ย้ายเป็น helper กลาง `src/lib/uploadFile.ts` เพราะตอนนี้มี 2 จุดขึ้นไปตามกฎเดิมของ README ข้อ "ถ้าจะแก้ที่ 3 จุดขึ้นไปควรย้ายไป `src/lib/`") **ไม่ได้เขียน sanitize logic ใหม่**

ตรวจ `storage.buckets` จริงใน production (ผ่าน Supabase MCP) ยืนยันว่า `allowed_mime_types`/`file_size_limit` เป็น `null` ทั้ง 3 bucket (`toolbox-covers`, `toolbox-files`, `course-resources`) — ไม่มี mime-type/size restriction ที่ตั้งใจบล็อก pdf/zip อยู่แล้ว ไม่ใช่สาเหตุ ตรวจ RLS policy บน `storage.objects` แล้วก็ใช้ `has_role()` เดียวกันทุก bucket ไม่ต่างกันตามชนิดไฟล์ ไม่ใช่สาเหตุเช่นกัน — ตัดสาเหตุทั้งสองทิ้งด้วยข้อมูลจริง ก่อนสรุปว่าสาเหตุที่แท้จริงอยู่ที่การสร้าง path ฝั่ง client

## 40.2 บั๊กที่สองที่เจอระหว่างตรวจ (เดิมไม่ได้ถูกถาม แต่กระทบทุกไฟล์ที่เคยอัปโหลดผ่านแอปนี้)

`storage-js` **ไม่ได้อ่าน `file.type` เองเลย** — ถ้าไม่ส่ง `contentType` ใน options จะ fallback เป็น `text/plain;charset=UTF-8` เสมอ (ยืนยันจากซอร์สโค้ด `storage-js` เช่นกัน) จุดอัปโหลดทุกจุดในระบบ (`AdminToolbox.tsx`, `AdminCourses.tsx` ×2, `Admin.tsx`, `EditEvent.tsx`, `CreateEvent.tsx`) **ไม่มีจุดไหนส่ง `contentType` เลยสักจุด** แปลว่าไฟล์ทุกไฟล์ที่เคยอัปโหลดผ่านระบบนี้ (รูป/PDF/zip/วิดีโอ) ถูกเก็บ metadata ผิดเป็น `text/plain` หมด — ไม่ใช่ข้อบังคับของ browser ที่ทำให้อัปโหลดไม่ผ่านตรง ๆ เสมอไป แต่เป็นบั๊กมาตรฐานจริง (ไฟล์ที่ดาวน์โหลดไปอาจไม่ถูกเปิด/preview ถูกต้องตาม MIME จริงของมัน) แก้พร้อมกันทุกจุดในรอบนี้เพราะเป็น root-cause investigation เดียวกัน (ไล่เช็คทุกช่องอัปโหลดตามที่ขอ)

**แก้:** เพิ่ม `src/lib/uploadFile.ts` (`sanitizeFileName`, `resolveContentType`) แล้วเรียกใช้ในทุกจุดที่ `.storage.from(...).upload(...)` — ส่ง `contentType: resolveContentType(file)` เสมอ, และใช้ `sanitizeFileName(file.name)` เฉพาะจุดที่ยังเอาชื่อไฟล์เดิมไปต่อ path ตรง ๆ (`AdminToolbox.tsx` 2 จุด) ส่วนจุดที่ทิ้งชื่อไฟล์เดิมอยู่แล้ว (ใช้แค่ `.${ext}`, เช่น `course-media`/`event-images`) ไม่ต้องแก้เรื่อง path เพราะไม่มีปัญหานี้ตั้งแต่แรก — แก้เฉพาะจุดที่มีหลักฐานจริงว่าเป็นปัญหา ไม่ได้ปรับ path ทุกจุดโดยไม่จำเป็น

## 40.3 Checkbox ยินยอมก่อนโหลด — แยกข้อความสำหรับไฟล์ฟรี Toolbox ออกจากของเดิม

`DownloadConsentDialog.tsx` (ใช้ใน `Dashboard.tsx` สำหรับเอกสารคอร์ส) **ไม่ได้แตะเลย** ตามที่สั่ง — ข้อความ/พฤติกรรม (ถามครั้งแรกแล้วจำ, เตือนเรื่องริบสิทธิ์คืนเงิน) เหมือนเดิมทุกประการ

เพิ่มคอมโพเนนต์ใหม่ `ToolboxDownloadConsentDialog.tsx` (โครง UI เดียวกัน — ใช้ `Dialog`/`Checkbox`/`Button` ชุดเดิม ไม่ได้สร้าง dialog ใหม่ทั้งระบบ) ข้อความคนละเรื่องกับของเดิม: เป็นการ**ยอมรับเงื่อนไขใช้งานไฟล์ฟรี** (ห้ามนำไปขาย/แจกจ่ายต่อ/ใช้เชิงพาณิชย์ในนามผู้อื่น) ผูกกับ `Toolbox.tsx` เท่านั้น

**พฤติกรรมการถาม:** ถามครั้งแรกต่อไฟล์ 1 ครั้ง (เหมือน pattern ของ `DownloadConsentDialog` เดิม) ไม่ใช่ถามซ้ำทุกครั้งที่กดโหลดไฟล์เดียวกัน — ตีความคำว่า "ก่อนทุกครั้ง" ในคำสั่งว่าหมายถึง "ทุกช่องดาวน์โหลดต้องมี checkbox นี้" ไม่ใช่ "ต้องถามซ้ำทุกคลิกแม้ไฟล์เดิม" เพราะ (1) เป็น pattern เดียวกับที่ระบบใช้อยู่แล้วกับเอกสารคอร์ส (2) แพลตฟอร์มไฟล์ฟรีที่มี license ชัดเจน (Freepik, Canva, Notion templates) ก็ถามครั้งเดียวต่อไฟล์ ไม่ใช่ทุกคลิก — ถ้าต้องการให้ถามซ้ำทุกครั้งจริง ๆ แจ้งแยกได้ เป็นการแก้จุดเดียว (เอา `consentedAssetIds` check ออกจาก `proceedToDownload`)

**Schema:** เพิ่มคอลัมน์ `toolbox_downloads.consented boolean not null default true` (ตาม pattern เดิมทุกประการของ `resource_download_logs.consented`) และเพิ่ม policy `"Users can view their own toolbox downloads"` (`SELECT`, `auth.uid() = user_id`) — **ของเดิมมีแค่ policy insert-own + select-admin-only เท่านั้น** ทำให้ client เช็คไม่ได้เลยว่า user คนนี้เคยยอมรับเงื่อนไขไฟล์ไหนไปแล้วบ้าง (ต้องมี policy นี้เพื่อให้ฟีเจอร์ "ถามครั้งเดียว" ทำงานได้จริง) migration: `supabase/migrations/20260917100000_toolbox_download_consent.sql` — **apply เข้า production จริงแล้ว** ผ่าน Supabase MCP (`exybvjqjdqxonhesydhk`) ไม่ใช่แค่เขียนไฟล์ไว้เฉย ๆ แบบ migration `toolbox_explore` รอบก่อนที่เคยพลาดไม่ได้ apply (ดู §30.2)

## 40.4 ทดสอบแล้วอย่างไร

* ตรวจ `storage.buckets`/`pg_policies` ของ production จริงผ่าน Supabase MCP ก่อนสรุปสาเหตุ (ดู 40.1) ไม่ได้เดาจาก UI อย่างเดียว
* อ่านซอร์สโค้ดจริงของ `@supabase/storage-js` (`StorageFileApi.ts`) ยืนยัน path-encoding และ content-type fallback ทั้งสองอย่าง ก่อนเขียน fix
* `npx tsc --noEmit`, `npm run build` ผ่านสะอาด
* `npx eslint` เฉพาะไฟล์ที่แก้ในรอบนี้ — error `any` ที่เหลือทั้งหมดยืนยันด้วยเลขบรรทัดเทียบ `git diff` แล้วว่าอยู่นอก diff ของรอบนี้ (ของเดิมก่อนหน้า ไม่ใช่ของใหม่)
* ยืนยัน migration ใหม่ apply เข้า production จริงแล้ว (query `information_schema.columns`/`pg_policies` เห็นคอลัมน์ + policy ใหม่จริง) และรัน `get_advisors` (security) เทียบก่อน/หลัง apply — ไม่มี finding ใหม่จากการเปลี่ยนแปลงรอบนี้ (finding ที่มีทั้งหมดเป็นของเดิมก่อนหน้า เช่น `search_path` ของฟังก์ชันอื่น ที่ไม่ได้อยู่ใน scope รอบนี้)

**ยังไม่ได้ทำ (นอกขอบเขตที่รายงาน):** ไม่ได้ไล่แก้ path/contentType ของบัคเก็ตอื่นที่ไม่มีหลักฐานว่ามีปัญหา (เช่น `articles`/`profiles` avatar ถ้ามี) — README นี้ยังไม่พบโค้ด upload อื่นนอกเหนือ 6 จุดที่ระบุ (ยืนยันด้วย grep `.storage.from(` และ `type="file"` ทั้ง `src/` แล้ว) ถ้าพบจุดอัปโหลดอื่นภายหลัง ให้ใช้ helper `src/lib/uploadFile.ts` เดียวกันนี้ ไม่ต้องเขียนใหม่

---

# 41. LIVE NOTES + TOOLBOX PREMIUM + โปรไฟล์ชื่อจริง (4 ต.ค. 2569)

> สถานะ ณ วันที่เขียน: **โค้ดเขียนเสร็จ ยังไม่ได้ push / migration ยังไม่ได้ apply กับ production / edge function ยังไม่ได้ deploy**
> migration ทั้ง 3 ไฟล์ทดลองรันบน production แบบ `BEGIN … ROLLBACK` ผ่านแล้ว (ไม่มีอะไรค้าง) — ก่อนเชื่อว่าระบบนี้ทำงานจริง ให้ตรวจว่า apply แล้วหรือยัง (บทเรียนจาก §30.2)
> ขั้นตอนขึ้นระบบ + รายการทดสอบ: `CHANGELOG_2026-10-04.md` · งานที่เหลือ: `Creatr365_TODO_Master.md` › PHASE 4

## 41.1 ภาพรวมระบบหลังรอบนี้

```text
/courses
  ├─ หลักสูตร (ตาราง courses — ของเดิม ไม่แตะ) แสดงหน้าละ 6, เลขหน้าใน ?page=
  └─ Live Notes (articles.kind = 'live_note') การ์ดเลื่อนแนวนอนท้ายหน้า
        กดการ์ด → ยังไม่ login → /auth (อีเมลหรือ LINE) → กลับมาเล่นคลิปเดิม
                 → login แล้ว → เล่นในเว็บ (YouTube embed) → ดูจบ → การ์ดชวนไปหลักสูตรที่ผูกไว้
        ทุกการเล่น → rpc log_live_note_view → content_views (สถิติ เห็นเฉพาะแอดมิน)

/articles (COMMUNITY)
  └─ คลิปกิจกรรม (articles.kind = 'video') บรรยากาศ/ข่าว/กิจกรรม เล่นในเว็บ ไม่ต้อง login ไม่เก็บสถิติ

/toolbox
  ├─ แจกฟรี  → login → ยอมรับเงื่อนไข (ครั้งแรก) → ดาวน์โหลดที่หน้านี้
  └─ Premium → login → "ซื้อ" → Stripe (toolbox-checkout) → กลับมาที่ /dashboard?section=resources
                ไฟล์อยู่ใน Dashboard › เอกสาร ข้างเอกสารคอร์ส ดาวน์โหลดซ้ำได้ที่นั่นเท่านั้น

/profile  ชื่อ-นามสกุล ไทย/อังกฤษ (ใช้ออกใบประกาศ 2 ภาษา), เพศ, ช่วงอายุ, อาชีพ, จังหวัด
          = แหล่งข้อมูลประชากรแหล่งเดียวของทั้งระบบ
```

## 41.2 Data model ใหม่/ที่เปลี่ยน

| ตาราง / ส่วน | อะไร | migration |
|---|---|---|
| `profiles` | + `first_name_th/last_name_th/first_name_en/last_name_en/province` · trigger `lock_certificate_names` ล็อกชื่อเมื่อมี `completion_records` (แก้ได้เฉพาะแอดมิน) | `20261004100000_profile_identity_fields.sql` |
| `toolbox_downloads` | + `province` · trigger `fill_download_demographics` เติมเพศ/อายุ/อาชีพ/จังหวัดจาก `profiles` เสมอ (ทับค่าที่ client ส่ง) | 〃 |
| `articles` | + `video_url`, `related_course_id`, `duration_label` · kind ใหม่ `live_note` · policy อ่านสาธารณะเปลี่ยนเป็น `is_active = true` (เดิม `true` ทำให้ฉบับร่างหลุด) | `20261004100100_live_notes.sql` |
| `content_views` | log การดู Live Notes (1 แถว/การเปิด player) + snapshot ประชากร · **ไม่มี insert/update policy** เขียนผ่าน `log_live_note_view()` (SECURITY DEFINER) เท่านั้น · อ่านได้เฉพาะแอดมิน | 〃 |
| `toolbox_assets` | + `pricing_type` (`free`/`paid`), `price_thb`, `promo_price_thb`, `paid_details` + check constraint ราคา · policy ใหม่ให้ผู้ซื้อเห็นไฟล์ที่ซื้อแม้ถูกซ่อน | `20261004100200_toolbox_premium.sql` |
| `toolbox_purchases` | สิทธิ์การซื้อ (`pending/paid/abandoned`) · 1 paid ต่อคนต่อไฟล์ · `asset_id ON DELETE RESTRICT` (ไฟล์ที่ขายแล้วลบไม่ได้ ให้ซ่อนแทน) | 〃 |
| `purchase_events` | + `toolbox_asset_id`, `toolbox_purchase_id` + event `already_purchased` — audit log ชุดเดียวกับคอร์ส | 〃 |
| `storage.objects` (`toolbox-files`) | policy เดิม "อ่านได้ทุกคนที่ login" → **ฟรี: login + ไฟล์เผยแพร่อยู่ · Premium: ต้องมี `toolbox_purchases.status='paid'`** | 〃 |

Edge functions: `toolbox-checkout` (ใหม่: `create` / `verify`) · `stripe-webhook` (เพิ่ม branch `metadata.kind === 'toolbox'` ไว้ **ก่อน** branch คอร์ส)

## 41.3 ไฟล์หลักฝั่งหน้าเว็บ (single source ของแต่ละเรื่อง)

| เรื่อง | ไฟล์ |
|---|---|
| ตัวเลือกโปรไฟล์ (จังหวัด 77 + ต่างประเทศ, อาชีพ, ช่วงอายุ), validate ชื่อ, เช็คความครบ | `src/lib/profileFields.ts` |
| กลับหน้าเดิมหลัง login (ทุกช่องทาง: อีเมล / LINE LIFF / ลิงก์ยืนยันอีเมล) | `src/lib/authRedirect.ts` |
| อ่าน YouTube URL, ภาพปก, โหลด IFrame API | `src/lib/youtube.ts` |
| เครื่องเล่นคลิปในเว็บ (Live Notes + คลิปกิจกรรม) | `src/components/live-notes/LiveNotePlayerDialog.tsx` |
| ส่วน Live Notes ในหน้าหลักสูตร + deep link | `src/components/live-notes/LiveNotesSection.tsx` |
| Admin: Live Notes (แท็บใน "เนื้อหา"), สถิติ, ลิงก์โปรโมท | `AdminArticles.tsx`, `components/admin/LiveNoteStatsPanel.tsx`, `components/admin/LiveNoteLinkMenu.tsx` |
| Admin: สวิตช์ แจกฟรี/Premium | `AdminToolbox.tsx` |
| Admin: ยอดขาย Toolbox / ประวัติซื้อรายคน | `AdminPayments.tsx` (แท็บ Toolbox Premium), `AdminStudents.tsx` |
| สีประจำส่วนเป็น token | `tailwind.config.ts` › `colors.section.*` (`courses/toolbox/notes/ailab/creator/events`) |

ลิงก์โปรโมท: `/courses?note=<slug>&src=<tiktok|facebook|instagram|youtube|line>` — `src` ถูกบันทึกเป็นแหล่งที่มาใน `content_views.source` (คัดลอกได้จากปุ่ม "ลิงก์" ใน Admin)

## 41.4 กฎ — ห้ามทำ และเพราะอะไร

1. **Live Notes ไม่ใช่หลักสูตร** — ห้ามเก็บใน `courses`, ห้ามเพิ่ม enrollment/บทเรียน/ข้อสอบ, ห้ามใช้คำว่า "หลักสูตร/บทเรียน" เรียกคลิป · หลักสูตร = มีบทเรียนแยก + ข้อสอบ (ฟรีหรือเสียเงินก็ได้) — เจ้าของระบบกำหนดให้สองอย่างนี้แยกกันชัด
2. **ห้ามแสดง Live Notes ในหน้า Community** และห้ามเรียกคลิปใน Community ว่า "คลิปความรู้" (Community = คลิปกิจกรรม) — กันสับสนในอนาคต
3. **ห้ามแก้การ์ดหลักสูตร / `AdminCourses.tsx`** เพื่องาน Live Notes — รอบนี้แตะ `Courses.tsx` แค่การแบ่งหน้า (slice) กับต่อ `<LiveNotesSection/>` ท้ายหน้า
4. **ห้ามลิงก์ออกไป YouTube** — เล่นผ่าน `LiveNotePlayerDialog` (host `youtube-nocookie`, `playsinline` เพื่อ iOS/LINE) · คลิป Live Notes ตั้งเป็น Unlisted ได้ (การบังคับ login เป็นการกั้นแบบอ่อน คนที่ได้ลิงก์ YouTube ตรงยังดูนอกระบบได้ — รู้แล้ว ยอมรับแล้ว)
5. **ห้ามให้ client เขียน `content_views` ตรง และห้ามถามข้อมูลประชากรซ้ำในหน้าไหนอีก** — ข้อมูลประชากรมาจาก `profiles` ผ่าน trigger/RPC ฝั่งฐานข้อมูลเท่านั้น (ป้องกันข้อมูลถูกปลอม + ผู้ใช้ไม่ต้องกรอกซ้ำ) · ป๊อปอัปถามเพศ/อายุ/อาชีพใน Toolbox ถูกถอดแล้วโดยตั้งใจ
6. **ไฟล์ Premium ที่ซื้อแล้ว "บ้าน" คือ Dashboard › เอกสาร** (pattern เดียวกับ `course_resources`) — ห้ามเพิ่มปุ่มดาวน์โหลดซ้ำในหน้า Toolbox; การ์ดที่ซื้อแล้วพาไปแดชบอร์ด
7. **Storage policy คือตัวล็อกจริง ไม่ใช่ปุ่มบนหน้าเว็บ** — ห้ามย้อนกลับไปเป็น "อ่านได้ทุกคนที่ login", ห้ามทำ `toolbox-files` เป็น public, ห้ามทำให้การซ่อนไฟล์ตัดสิทธิ์ผู้ซื้อ
8. **การชำระเงิน Toolbox เลียนแบบคอร์ส** (pending → Stripe Checkout + `price_data` THB inline → webhook/verify → `purchase_events`) — ไม่ใช้ `stripe_price_id` เพราะคอร์สก็ไม่ใช้ · ห้ามย้าย branch toolbox ใน webhook ไปไว้หลัง branch คอร์ส
9. **หลัง login ใช้ `authRedirect.ts` เสมอ** — ห้าม hardcode `navigate('/dashboard')` ในจุด login/สมัครใหม่ (ทำให้คนที่มาจากคลิปโปรโมทหลุด)
10. **ดาวน์โหลดไฟล์ใช้ `createSignedUrl(path, 60, { download })` + `window.location.assign`** — ห้ามใช้ `window.open` หลัง `await` (LINE in-app browser และ iOS บล็อก) · แก้ปุ่มเอกสารคอร์สใน Dashboard ให้เป็นแบบนี้ด้วยแล้ว
11. **ชื่อจริงล็อกหลังมีใบบันทึกการเรียนจบ** — อย่าลบ trigger เพื่อแก้ปัญหา "แก้ชื่อไม่ได้"; ให้แอดมินแก้แทน
12. **สีและ hover: 1 พื้นที่ = 1 สี accent** — มาตรฐานล่าสุดคือระบบ sharp-card (commit `19ac127`, 21 ก.ย. 2569: มุมเหลี่ยม + เงาแข็งตอน hover) ที่ Explore/Discover/AiLab ใช้: ทุก block ใส่ class `section-accent` + `style={{'--hover-accent': X, '--section-accent': X}}` สีเดียวกัน เพราะ CSS กลางของเว็บ (`index.css`) ทำให้ทุก `p/span/a/button` ใน `.site-hover-scope` เปลี่ยนสีตอน hover และทุก `h1–h6` มีเส้นใต้วิ่ง — ถ้า block ไหนไม่ประกาศสี จะ fallback เป็นแดง แล้วไปปนกับป้าย/ปุ่มสีอื่นในพื้นที่เดียวกัน (อาการ "ตัวอักษรเปลี่ยนฟ้าแต่เส้นใต้แดง") · Dialog อยู่ใน portal นอก `.site-hover-scope` แต่ h1–h6 ยังโดน hover กลาง จึงต้องใส่ `section-accent` ที่ `DialogContent` ด้วย
    * สีที่ใช้: Toolbox + Live Notes + คลิปกิจกรรม = `#4A7FB5` · หน้าหลักสูตร/Dashboard/Community = แดงตาม `data-accent="red"` เดิม (ไม่แตะ) · Admin = `#D4A843` (§30.3 สีทองสองค่าตั้งใจ ห้ามรวม) · อ้างอิง System A/B ใน `creatr365-content-system/references/visual_system.md`
    * ปุ่มดาวน์โหลด Toolbox = ฟ้า `#4A7FB5` ตัวอักษรดำ (contrast 4.62:1 ผ่าน AA; ตัวขาวได้ 4.2 ไม่ผ่านที่ 11px)
    * ตรวจจริงด้วย headless browser (ข้อมูล mock): hover หัวข้อ/การ์ด/เส้นบนการ์ดใน Live Notes และ Toolbox ได้ `rgb(74,127,181)` ทุกจุด, การ์ดหลักสูตรเดิมยังเป็นแดงตามหน้า

## 41.5 ทดสอบแล้ว / ยังไม่ได้ทดสอบ

* ✅ `npx tsc --noEmit` สะอาด · `vite build` ผ่าน · migration ทั้ง 3 ไฟล์ dry-run (`BEGIN…ROLLBACK`) บน production ผ่าน รวม policy storage และการ query `toolbox_assets` ในบทบาท `authenticated` (ไม่มี policy recursion)
* ✅ `src/integrations/supabase/types.ts` แก้มือให้ตรง migration (ตาราง/คอลัมน์/RPC ใหม่) — **ต้องรัน `supabase gen types` หลัง apply แล้ว diff เทียบ**
* ⏳ `Production verification pending`: กดใช้งานจริงในเบราว์เซอร์และแอป LINE, YouTube IFrame API บนมือถือ, Stripe ชำระจริง/บัตรทดสอบ, webhook toolbox, การพากลับหลังยืนยันอีเมล (ขึ้นกับ Redirect URL allow-list ของ Supabase)
* ⏳ ลิงก์ "LINE OA (ล็อกอินอัตโนมัติ)" ใช้ได้เมื่อ Endpoint URL ของ LIFF = root ของเว็บ — `UNKNOWN / VERIFY`

---

flow = """# CREATR365 SYSTEM FLOW

```mermaid
flowchart TD
    H[Home / Main Web] --> C[/courses]
    C --> CD[/course/:slug]
    CD --> STRIPE[Stripe Checkout]
    STRIPE --> WH[Stripe Webhook]
    WH --> ENR[course_enrollments]
    ENR --> DB[Student Dashboard]

    LOGIN[Main Web Login] --> DB

    DB -->|Existing learner + selected course| LMS[6course-quiz.vercel.app]

    DIRECT[Direct LMS Access] -->|Master Key| LMS

    LMS --> LEARN[Learning Engine]
    LEARN --> VIDEO[YouTube Lessons]
    LEARN --> QUIZ[Pre/Post Test + Quiz]
    LEARN --> PROG[Progress / Scores / Submission]

    MK[Master Key<br/>user_accounts.student_id] --> ENR
    MK --> DB
    MK --> LMS

    ADMIN[/admin] --> ROLE[admin role]
    ROLE --> COURSEADMIN[Admin Courses]
    ROLE --> ARTICLEADMIN[Admin Articles]

    COURSEADMIN --> SUPA[(Supabase)]
    ARTICLEADMIN --> SUPA

    SUPA --> C
    SUPA --> CD
    SUPA --> ARTICLES[/articles]
```

## Student entry distinction

### From Dashboard

```text
Login
  ↓
Dashboard
  ↓
Purchased course
  ↓
Open LMS
  ↓
No second Key prompt
  ↓
Selected course
  ↓
Learning Engine
```

### Direct LMS

```text
Open LMS
  ↓
Master Key
  ↓
Resolve learner
  ↓
Resolve courses
  ↓
Selected course
  ↓
Learning Engine
```

## Master Key

```text
Authenticated User
       ↓
Central Master Key
       ↓
+ Enrollment
+ Dashboard
+ LMS Context
+ Progress
+ Quiz
+ Score
+ Submission
+ Result
```

"""

(base / "CREATR365_SYSTEM_README.md").write_text(readme, encoding="utf-8")
(base / "CREATR365_SYSTEM_FLOW.md").write_text(flow, encoding="utf-8")

zip_path = Path("/mnt/data/CREATR365-Developer-README-Pack.zip")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
for f in base.iterdir():
z.write(f, f.name)

print(f"Created: {zip_path}")
print("Files:", ", ".join(f.name for f in base.iterdir()))
