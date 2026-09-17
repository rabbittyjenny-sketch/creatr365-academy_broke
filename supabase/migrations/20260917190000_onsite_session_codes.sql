-- Onsite lessons (STAGE/BRAND_HOST_ARCHITECT) gate each lesson's exam behind
-- a 4-digit code the trainer reads aloud in the room ("กรอกรหัส" screen in
-- the LMS). This previously lived entirely in a legacy Google Apps
-- Script/Sheet outside every repo — no admin UI in this system could set or
-- rotate it. Moving it here: one current code per module (the admin
-- overwrites it before each training day, matching "regenerate per session
-- date" rather than keeping a full rotation history), plus an audit log of
-- successful redemptions per student per lesson.

ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS onsite_unlock_code text,
  ADD COLUMN IF NOT EXISTS onsite_session_label text;

CREATE TABLE IF NOT EXISTS public.onsite_code_redemptions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id    uuid        NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  redeemed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onsite_code_redemptions_user ON public.onsite_code_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_onsite_code_redemptions_module ON public.onsite_code_redemptions (module_id);

ALTER TABLE public.onsite_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Students can see their own redemption history; admins can see everyone's
-- (for the same "check the audit trail" use AdminStudents already serves).
-- No INSERT policy for anon/authenticated — every write goes through the
-- redeem-session-code edge function on the service_role key, which is the
-- only thing that ever confirms a code match.
DROP POLICY IF EXISTS "Users view own onsite redemptions" ON public.onsite_code_redemptions;
CREATE POLICY "Users view own onsite redemptions" ON public.onsite_code_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins view all onsite redemptions" ON public.onsite_code_redemptions;
CREATE POLICY "Admins view all onsite redemptions" ON public.onsite_code_redemptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
