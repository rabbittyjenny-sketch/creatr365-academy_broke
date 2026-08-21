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
"""

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
