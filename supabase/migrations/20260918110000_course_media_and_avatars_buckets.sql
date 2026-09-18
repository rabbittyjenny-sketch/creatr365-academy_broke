-- `course-media` never existed as a storage bucket despite AdminCourses.tsx
-- (cover/intro/gallery image uploads) and the new AdminPageBanners.tsx
-- already calling `supabase.storage.from('course-media').upload(...)` —
-- confirmed via `select id from storage.buckets` returning only
-- course-resources/toolbox-covers/toolbox-files. Every upload through
-- those forms has been failing silently against a nonexistent bucket.
insert into storage.buckets (id, name, public)
values ('course-media', 'course-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read course-media" on storage.objects;
create policy "Public read course-media" on storage.objects for select
  using (bucket_id = 'course-media');

drop policy if exists "Admins write course-media" on storage.objects;
create policy "Admins write course-media" on storage.objects for all to authenticated
  using (bucket_id = 'course-media' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'course-media' and public.has_role(auth.uid(), 'admin'));

-- New: profile picture uploads (Profile.tsx). Public read (avatars are
-- shown to other users, e.g. in a future community feature), but a user
-- may only write to a path prefixed with their own auth uid — the same
-- "first path segment = own user id" convention Supabase's own docs use
-- for this exact case.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users manage own avatar" on storage.objects;
create policy "Users manage own avatar" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
