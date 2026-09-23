-- Audit trail for learning + purchases, and Master-Key-wide read access.
--
-- 1. quiz_attempts   — one row per quiz submission (pre-test, knowledge check,
--    diagnostic, quiz-less lesson). module_progress only keeps the *latest*
--    state per module, so a failed attempt was overwritten by the next one and
--    the pre-test score was never stored at all (BIBLE A4 step 8 requires
--    "บันทึกคะแนนทุกครั้ง"). Written only by the save-score edge function.
--
-- 2. purchase_events — one row per step of the checkout flow (started, promo
--    applied, blocked, Stripe session created, cancelled, expired, paid, …).
--    create-checkout used to DELETE a learner's earlier pending enrollment on
--    every new attempt, erasing the only evidence that a purchase was tried.
--    Written only by create-checkout / verify-payment / stripe-webhook.
--
-- 3. my_linked_user_ids() + widened SELECT policies — one Master Key can own
--    several auth identities (LINE + email). save-score / get-enrollment /
--    get-progress already resolve all of them, and the completion record is
--    owned by the earliest identity only, but the student Dashboard read with
--    `user_id = auth.uid()`, so a learner signed in with their *other* identity
--    saw no course, no progress and no completion record. Read-only widening:
--    no INSERT/UPDATE/DELETE policy changes.

-- ── 1. quiz_attempts ───────────────────────────────────────────────────────
create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  student_id  text not null,
  user_id     uuid references auth.users(id) on delete set null,
  course_id   uuid references public.courses(id) on delete set null,
  module_id   uuid references public.course_modules(id) on delete set null,
  lesson_code text,
  quiz_type   text not null check (quiz_type in ('pretest','knowledge_check','diagnostic','no_quiz')),
  qg          text,
  score_pct   integer,
  correct     integer,
  total       integer,
  passed      boolean,
  created_at  timestamptz not null default now()
);
create index if not exists idx_quiz_attempts_student on public.quiz_attempts (student_id, created_at desc);
create index if not exists idx_quiz_attempts_course on public.quiz_attempts (course_id);

alter table public.quiz_attempts enable row level security;

drop policy if exists "admins read quiz_attempts" on public.quiz_attempts;
create policy "admins read quiz_attempts" on public.quiz_attempts
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));

-- Same Master-Key ownership rule as lms_lesson_state.
drop policy if exists "learners read own quiz_attempts" on public.quiz_attempts;
create policy "learners read own quiz_attempts" on public.quiz_attempts
  for select to authenticated using (
    exists (
      select 1 from public.user_accounts ua
      where ua.student_id = quiz_attempts.student_id and ua.is_active
        and (ua.line_user_id = 'web:' || auth.uid()::text
             or ua.line_user_id in (select p.line_user_id from public.profiles p where p.user_id = auth.uid()))
    )
  );

-- ── 2. purchase_events ─────────────────────────────────────────────────────
create table if not exists public.purchase_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  course_id         uuid references public.courses(id) on delete set null,
  enrollment_id     uuid references public.course_enrollments(id) on delete set null,
  event             text not null check (event in (
                      'checkout_started','already_enrolled','course_full','promo_applied','promo_rejected',
                      'free_enrolled','pending_replaced','pending_created','stripe_session_created',
                      'checkout_cancelled','checkout_expired','payment_verified','webhook_paid','error')),
  price_original    numeric,
  discount_amount   numeric,
  amount_final      numeric,
  promo_code_id     uuid references public.promo_codes(id) on delete set null,
  stripe_session_id text,
  detail            jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists idx_purchase_events_user on public.purchase_events (user_id, created_at desc);
create index if not exists idx_purchase_events_enrollment on public.purchase_events (enrollment_id);

alter table public.purchase_events enable row level security;

drop policy if exists "admins read purchase_events" on public.purchase_events;
create policy "admins read purchase_events" on public.purchase_events
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));

-- ── 3. Master-Key-wide read access ─────────────────────────────────────────
-- Every auth identity linked (via user_accounts.student_id) to the same
-- Master Key as _uid, always including _uid itself. Mirrors
-- resolveLinkedUserIds() in the save-score / get-progress edge functions.
create or replace function public.linked_user_ids(_uid uuid)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  with my_keys as (
    select ua.student_id
    from public.user_accounts ua
    where ua.is_active
      and ua.student_id is not null
      and (ua.line_user_id = 'web:' || _uid::text
           or ua.line_user_id in (select p.line_user_id from public.profiles p
                                  where p.user_id = _uid and p.line_user_id is not null))
  ),
  linked as (
    select _uid as id
    union
    select substr(ua.line_user_id, 5)::uuid
    from public.user_accounts ua
    where ua.is_active
      and ua.student_id in (select student_id from my_keys)
      and ua.line_user_id ~ '^web:[0-9a-fA-F-]{36}$'
    union
    select p.user_id
    from public.user_accounts ua
    join public.profiles p on p.line_user_id = ua.line_user_id
    where ua.is_active
      and ua.student_id in (select student_id from my_keys)
  )
  select coalesce(array_agg(distinct id), array[_uid]) from linked where id is not null;
$$;

create or replace function public.my_linked_user_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$ select public.linked_user_ids(auth.uid()) $$;

revoke all on function public.linked_user_ids(uuid) from public, anon, authenticated;
revoke all on function public.my_linked_user_ids() from public, anon;
grant execute on function public.my_linked_user_ids() to authenticated;

-- IN (select unnest(...)) runs the function once per query, not once per row.
drop policy if exists "Users view linked enrollments" on public.course_enrollments;
create policy "Users view linked enrollments" on public.course_enrollments
  for select to authenticated using (user_id in (select unnest(public.my_linked_user_ids())));

drop policy if exists "Users view linked progress" on public.module_progress;
create policy "Users view linked progress" on public.module_progress
  for select to authenticated using (user_id in (select unnest(public.my_linked_user_ids())));

drop policy if exists "Users view linked completion records" on public.completion_records;
create policy "Users view linked completion records" on public.completion_records
  for select to authenticated using (user_id in (select unnest(public.my_linked_user_ids())));

drop policy if exists "Users view linked diagnostic attempts" on public.diagnostic_attempts;
create policy "Users view linked diagnostic attempts" on public.diagnostic_attempts
  for select to authenticated using (user_id in (select unnest(public.my_linked_user_ids())));

drop policy if exists "Users view linked assignments" on public.assignments;
create policy "Users view linked assignments" on public.assignments
  for select to authenticated using (user_id in (select unnest(public.my_linked_user_ids())));
