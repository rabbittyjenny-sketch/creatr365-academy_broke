-- ─────────────────────────────────────────────────────────────────────────
-- Profile identity fields + silent demographics
--
-- 1. Real names in Thai and English (printed on the two certificate
--    versions) and province. Gender / age_range / occupation / date_of_birth
--    already exist on profiles (20260918120000_profiles_date_of_birth.sql).
-- 2. Certificate names lock once the learner has a completion record —
--    afterwards only an admin (or the service role) can change them, so the
--    name on an issued certificate and the name in the system never drift.
-- 3. toolbox_downloads demographics are now copied from profiles by the
--    database instead of being sent by the browser. Toolbox no longer asks
--    for them in a popup; profiles is the single source.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name_th text,
  ADD COLUMN IF NOT EXISTS last_name_th  text,
  ADD COLUMN IF NOT EXISTS first_name_en text,
  ADD COLUMN IF NOT EXISTS last_name_en  text,
  ADD COLUMN IF NOT EXISTS province      text;

COMMENT ON COLUMN public.profiles.first_name_th IS 'ชื่อจริงภาษาไทย — ใช้บนใบประกาศฉบับภาษาไทย';
COMMENT ON COLUMN public.profiles.first_name_en IS 'First name in English — printed on the English certificate';
COMMENT ON COLUMN public.profiles.province      IS 'จังหวัดที่อยู่ (หรือ "ต่างประเทศ") — ใช้ทำสถิติเท่านั้น';

-- ── Name lock after a completion record exists ───────────────────────────
CREATE OR REPLACE FUNCTION public.lock_certificate_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.first_name_th IS DISTINCT FROM OLD.first_name_th
      OR NEW.last_name_th IS DISTINCT FROM OLD.last_name_th
      OR NEW.first_name_en IS DISTINCT FROM OLD.first_name_en
      OR NEW.last_name_en IS DISTINCT FROM OLD.last_name_en)
     AND auth.uid() IS NOT NULL                         -- service role / SQL editor bypass
     AND NOT public.has_role(auth.uid(), 'admin')
     AND EXISTS (SELECT 1 FROM public.completion_records cr WHERE cr.user_id = NEW.user_id)
  THEN
    RAISE EXCEPTION 'CERT_NAME_LOCKED'
      USING HINT = 'ชื่อนี้ใช้ออกใบประกาศแล้ว กรุณาติดต่อทีมงานเพื่อแก้ไข';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_certificate_names ON public.profiles;
CREATE TRIGGER trg_lock_certificate_names
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.lock_certificate_names();

-- ── Silent demographics on toolbox_downloads ─────────────────────────────
ALTER TABLE public.toolbox_downloads
  ADD COLUMN IF NOT EXISTS province text;

CREATE OR REPLACE FUNCTION public.fill_download_demographics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p record;
BEGIN
  SELECT gender, age_range, occupation, province INTO p
  FROM public.profiles WHERE user_id = NEW.user_id;
  -- Always overwrite whatever the client sent: the profile is the source.
  NEW.gender     := p.gender;
  NEW.age_range  := p.age_range;
  NEW.occupation := p.occupation;
  NEW.province   := p.province;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_download_demographics ON public.toolbox_downloads;
CREATE TRIGGER trg_fill_download_demographics
  BEFORE INSERT ON public.toolbox_downloads
  FOR EACH ROW EXECUTE FUNCTION public.fill_download_demographics();
