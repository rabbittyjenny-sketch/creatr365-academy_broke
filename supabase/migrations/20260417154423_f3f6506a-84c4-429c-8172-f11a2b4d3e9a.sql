-- Add status column to courses for marketing badges
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'now_open';

-- Allowed: now_open | coming_soon | new_update | none
-- Validation via trigger (not check, per guidelines)
CREATE OR REPLACE FUNCTION public.validate_course_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('now_open','coming_soon','new_update','none') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_course_status ON public.courses;
CREATE TRIGGER trg_validate_course_status
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.validate_course_status();

-- Delete the COMBO A+B course (Short Course A+B bundle)
DELETE FROM public.courses
  WHERE slug IN ('combo-a-b','combo-ab','short-course-ab','short-combo')
     OR (tag = 'COMBO' AND title ILIKE '%A+B%')
     OR (tag = 'COMBO' AND title ILIKE '%A%B%' AND title NOT ILIKE '%MASTERCLASS%');

-- Change Masterclass II color → black (same as Micro Express)
UPDATE public.courses
  SET color = 'black'
  WHERE slug = 'masterclass-2' OR title ILIKE '%MASTERCLASS II%';