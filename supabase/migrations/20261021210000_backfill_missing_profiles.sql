-- Accounts created before the on_auth_user_created trigger existed (all
-- sign-ups before 2026-07-20) never got a profiles row. Profile.tsx saves
-- with update(), which matches 0 rows for them and returns no error — so
-- /profile said "saved" while nothing was stored, and the Dashboard greeting
-- fell back to the email prefix.
--
-- Same values handle_new_user() writes for a new sign-up (display name,
-- avatar, LINE id from auth metadata). Data only: no schema, policy or
-- Master Key (user_accounts) change. Idempotent.
INSERT INTO public.profiles (user_id, display_name, avatar_url, line_user_id)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name'),
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'line_user_id'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;
