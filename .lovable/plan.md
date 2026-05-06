
# Phase 2 — Backend, Course Enrichment & Student Portal

## 1. Course Schema Enrichment (DB migration)

Add columns to `courses` so admin can edit everything from backend, and pages render only what is filled:

- `level` text — STARTER / DEVELOPING / COMPETENT / PROFICIENT / MASTER (from PDF "Value Ladder")
- `target_audience` text — กลุ่มผู้เรียน (e.g. "มือใหม่อยากลองก่อน")
- `format_label` text — รูปแบบ (e.g. "VOD Self-paced", "Onsite 1 วัน")
- `intro_video_url` text nullable — YouTube/MP4 URL for course intro
- `cover_image_url` text nullable — banner image
- `gallery_image_urls` text[] — extra images
- `kpi_notes` jsonb — `[{label, value, note}]` rendered small at bottom of course page
- `deliverables` text[] — "สิ่งที่ผู้เรียนจะได้รับ" (badge, certificate, templates)
- `outcome_goal` text — short "เป้าหมาย" line from PDF
- `bloom_level` text — Pre→Post (e.g. "Remember → Apply/Analyze")

Re-seed all 6 courses (MICRO EXPRESS, SIGNAL, MATRIX, STAGE, BLUEPRINT, FRONTIER) with full data from `double_super_final_course.pdf`:
- level + target_audience + format_label + outcome_goal + deliverables + kpi_notes (e.g. Watch Time, NPS, Pass criteria) per course.
- Modules from PDF Page 2-9 will be inserted into the new `course_modules` table (below).

## 2. Modules / Quizzes / Assignments backend

New tables (RLS: public read for active rows, admin write; user-scoped progress tables):

- `course_modules` — `id, course_id, code (M01,S03…), name, summary, duration_label, vod_url, sort_order, has_quiz, has_assignment`
- `course_quizzes` — `id, course_id, module_id nullable, qg_code (QG-01…), phase (pre|during|post), title, pass_threshold int, source_ref text` (no questions table yet — exams exist externally; this just registers them)
- `quiz_questions` — `id, quiz_id, q_no, type (mcq|tf|calc|scenario|write), prompt, options jsonb, answer text, explanation text` — seeded from QG-01…QG-07 in `Creatr365_Quiz_System_Architecture.docx` so data is preserved even though the front-end won't render them yet
- `module_progress` — `user_id, module_id, status (locked|unlocked|completed), completed_at`
- `assignments` — `id, user_id, course_id, module_id, video_url, note, status (pending|approved|rejected), score, reviewer_id, reviewed_at, created_at`

RLS: students read/write own rows; admins read/update all. `has_role(auth.uid(),'admin')` for review.

## 3. Storage bucket for course media

- New public bucket `course-media` (covers, intro videos, gallery)
- RLS: public read; admin write. Admin uploads via `/admin/courses` — URLs saved to course columns above.

## 4. `/admin/courses` upgrade

Existing AdminCourses page extended:
- Per-course form: edit level, target_audience, format_label, outcome_goal, kpi_notes, deliverables, bloom_level
- Upload widgets: cover image, intro video (file or URL paste), multiple gallery images → uploads to `course-media` bucket
- Modules sub-editor: add/edit/reorder `course_modules` rows + paste VOD URL per module
- Toggle has_quiz / has_assignment per module
- Save price, stripe_price_id (already exists)

Simple Tabs UI: "ข้อมูลหลัก / สื่อ / โมดูล / ราคา".

## 5. Course detail / Courses list rendering rules

- Render `cover_image_url` only if present; else no empty hero block
- Render `intro_video_url` only if present (YouTube embed or `<video>`)
- Render gallery only if `gallery_image_urls.length > 0`
- Show `level` badge (STARTER…MASTER) on course card
- Replace existing "ใครควรเรียนคอร์สนี้" block with the small KPI list (`kpi_notes`) at the bottom of `CourseDetail.tsx` using `text-xs text-muted-foreground`
- Show `deliverables` as a clean bullet list ("สิ่งที่ผู้เรียนจะได้รับ")
- Hide price section entirely if `price` empty (already done)

## 6. Student Portal updates (`/dashboard`)

- Pull real `course_modules` instead of deriving from `features`
- Pull real `module_progress` per user; first module auto-unlocked on enrollment via DB trigger
- Quiz tab: show "Quiz พร้อมให้ทำเร็วๆ นี้" placeholder (do NOT wire to Tally yet, per request)
- Submit tab: real upload → inserts into `assignments`, file goes to `course-media/assignments/{user}/…`
- Level badge under name uses course-level naming: STARTER → MASTER (mapped from completed courses + their `level`)

## 7. Admin review pages

- `/admin/assignments` — list pending `assignments`, video preview, Approve/Reject + score; on approve, mark `module_progress` completed and unlock next module via SQL function `unlock_next_module(user_id, module_id)`
- `/admin/payments` — list `course_enrollments` joined with course + profile; status filter; mark refund/note (insert-only audit log table `enrollment_notes` if needed)

Both gated by `has_role('admin')`; redirect non-admins.

## 8. Payment flow check

- Verify `create-checkout` still finds price (now from `stripe_price_id` if set, else parses `price` text fallback)
- Add `verify-payment` edge function called from `/payment-success` to set enrollment `status='paid'` (currently relies on webhook only — adding fallback makes test trustworthy)
- Re-run live curl tests after deploy

## 9. What is NOT in this phase (per user)

- No quiz front-end / Tally integration. Quiz data is seeded in DB so it's ready when the tool is decided.
- No Certificate PDF generator (placeholder badge only).

## Technical notes

```text
courses ──< course_modules ──< module_progress (user_id)
courses ──< course_quizzes ──< quiz_questions      (data only, no UI)
courses ──< course_enrollments (existing)
modules ──< assignments (user_id, reviewer_id)
storage: course-media (public)  admin-write
```

All new SELECT policies are `is_active = true` or `auth.uid() = user_id`; INSERT/UPDATE/DELETE require `has_role(auth.uid(),'admin')` except student-owned rows.
