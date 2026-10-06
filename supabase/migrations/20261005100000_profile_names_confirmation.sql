-- ─────────────────────────────────────────────────────────────────────────
-- Certificate names: lock on the learner's own confirmation, not on having
-- a completion record.
--
-- Before: names locked as soon as completion_records had a row for the user
-- — so a learner who finished a course before this field existed could never
-- type their name at all (reported 2026-10-05).
-- Now: names are editable until the learner confirms them once (Profile shows
-- "ยืนยันข้อมูลถูกต้อง? แก้ไขภายหลังต้องติดต่อแอดมิน" with ยืนยัน / แก้ไข).
-- Confirming sets names_confirmed_at in the same update; after that only an
-- admin (or the service role / SQL editor) can change the names or clear the
-- confirmation.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS names_confirmed_at timestamptz;

COMMENT ON COLUMN public.profiles.names_confirmed_at IS
  'When the learner confirmed their TH/EN real names (used on certificates). Set once by the learner; afterwards only admins can edit names.';

CREATE OR REPLACE FUNCTION public.lock_certificate_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;                                   -- service role / SQL editor / admin
  END IF;

  IF OLD.names_confirmed_at IS NOT NULL AND (
       NEW.first_name_th IS DISTINCT FROM OLD.first_name_th
    OR NEW.last_name_th  IS DISTINCT FROM OLD.last_name_th
    OR NEW.first_name_en IS DISTINCT FROM OLD.first_name_en
    OR NEW.last_name_en  IS DISTINCT FROM OLD.last_name_en
    OR NEW.names_confirmed_at IS DISTINCT FROM OLD.names_confirmed_at
  ) THEN
    RAISE EXCEPTION 'CERT_NAME_LOCKED'
      USING HINT = 'ยืนยันชื่อไปแล้ว กรุณาติดต่อแอดมินเพื่อแก้ไข';
  END IF;

  -- Confirming requires all four names to be present.
  IF OLD.names_confirmed_at IS NULL AND NEW.names_confirmed_at IS NOT NULL AND (
       coalesce(trim(NEW.first_name_th), '') = '' OR coalesce(trim(NEW.last_name_th), '') = ''
    OR coalesce(trim(NEW.first_name_en), '') = '' OR coalesce(trim(NEW.last_name_en), '') = ''
  ) THEN
    RAISE EXCEPTION 'CERT_NAME_INCOMPLETE';
  END IF;

  RETURN NEW;
END;
$$;
-- trg_lock_certificate_names (BEFORE UPDATE ON profiles) already points at this function.
