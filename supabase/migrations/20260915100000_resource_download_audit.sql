-- Track consent + every download of course materials.
-- Used to (a) legally record that the student explicitly acknowledged the
-- "no refund after download" clause before downloading, and (b) let admins
-- check download status when reviewing a refund request.
--
-- This mirrors what was already applied directly against production
-- Supabase — captured here as a migration file so a fresh environment can
-- reproduce the same schema instead of only trusting production state.

create table if not exists public.resource_download_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  resource_id uuid not null references public.course_resources(id) on delete cascade,
  consented boolean not null default true,
  downloaded_at timestamptz not null default now()
);

alter table public.resource_download_logs enable row level security;

-- Students log their own consent/download event (first download requires an
-- explicit consent click in the UI; repeat downloads of the same file are
-- still logged but skip re-asking — see DownloadConsentDialog).
drop policy if exists "Users can insert their own download logs" on public.resource_download_logs;
create policy "Users can insert their own download logs"
on public.resource_download_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- Students can read their own logs (so the UI can skip re-asking for
-- consent on a resource they already downloaded before).
drop policy if exists "Users can view their own download logs" on public.resource_download_logs;
create policy "Users can view their own download logs"
on public.resource_download_logs
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can see everyone's logs — needed when reviewing a refund request
-- to check whether the student already downloaded course materials.
drop policy if exists "Admins can view all download logs" on public.resource_download_logs;
create policy "Admins can view all download logs"
on public.resource_download_logs
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- module_progress previously had no admin-visibility policy (only
-- self-access + service role). Needed so the Admin Student Activity page
-- (/admin/students) can show a student's % lesson completion per course —
-- same "admin can view all" pattern already used on course_enrollments,
-- profiles, toolbox_downloads, user_accounts, diagnostic_quiz_results.
drop policy if exists "Admins can view all progress" on public.module_progress;
create policy "Admins can view all progress"
on public.module_progress
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));
