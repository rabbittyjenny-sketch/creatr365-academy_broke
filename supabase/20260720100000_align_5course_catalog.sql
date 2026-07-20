-- =============================================================================
-- Align public.courses with the real 5-course catalog:
--   MAGNET -> FOUNDATION -> SIGNAL -> STAGE -> BRAND HOST ARCHITECT
--
-- Root cause fixed here: get-enrollment (SLUG_TO_LMS) and the LMS's COURSES
-- object were both updated to expect slugs: magnet / foundation / signal /
-- stage / brand-host-architect — but this table still had the OLD 6-course
-- catalog (micro-express / signal / matrix / stage / blueprint / frontier).
-- That mismatch is why enrollment + LMS access silently failed for anyone
-- enrolled in the old course rows.
--
-- Strategy: RENAME existing rows in place (never delete) so every existing
-- course_enrollments / course_modules / module_progress row (which points at
-- course_id, a stable UUID) keeps working with zero data loss.
--   micro-express  -> magnet                 (free lead-magnet course)
--   matrix         -> foundation              (repurposed row; MATRIX's
--                                              analytics/KPI content is now
--                                              folded into FOUNDATION Module 7
--                                              + SIGNAL Module 5, per the
--                                              handbook restructure)
--   signal         -> signal                  (unchanged)
--   stage          -> stage                   (unchanged)
--   blueprint      -> brand-host-architect     (primary row for Course 3)
--   frontier       -> merged into blueprint's new row, then deactivated
--                      (its content is now BRAND_HOST_ARCHITECT Part 3/7/8)
-- =============================================================================

-- 1) micro-express -> magnet
UPDATE public.courses SET
  slug = 'magnet',
  tag = 'LEAD MAGNET',
  title = 'MAGNET',
  subtitle = 'Live Commerce Blueprint',
  description = 'แผนที่ก่อนเข้าสู่ FOUNDATION — เข้าใจอุตสาหกรรม Live Commerce อย่างถูกต้องใน 65 นาที ก่อนตัดสินใจเรียนหลักสูตรเชิงลึก',
  duration = '65 นาที (VOD Self-paced)',
  price = '',
  learning_type = 'online',
  level = 'STARTER',
  updated_at = now()
WHERE slug = 'micro-express';

-- 2) matrix -> foundation (repurposed row so we don't need a brand-new UUID)
UPDATE public.courses SET
  slug = 'foundation',
  tag = 'COURSE 0',
  title = 'FOUNDATION',
  subtitle = 'The Foundation — ไลฟ์ให้เป็น',
  description = 'ปูพื้นอุปกรณ์ จรรยาบรรณ การค้นหาตัวตนโฮสต์ Hook ที่หยุดนิ้วผู้ชม เทคนิค ASBC และการอ่าน KPI พื้นฐาน — จุดเริ่มต้นของเส้นทางอาชีพ Host',
  duration = '3 ชั่วโมง 55 นาที (VOD)',
  learning_type = 'online',
  level = 'STARTER',
  updated_at = now()
WHERE slug = 'matrix';

-- 3) blueprint -> brand-host-architect (primary row for the merged course)
UPDATE public.courses SET
  slug = 'brand-host-architect',
  tag = 'COURSE 03',
  title = 'BRAND HOST ARCHITECT',
  subtitle = 'Identity Architecture, Production System & Global Scaling',
  description = 'Masterclass 2 วันเต็ม: 5 Hidden Souls, Brand CI 4 มิติ, Business Model, Legal Framework, Multi-Camera Production, Team System, P&L Mastery และ Global Scaling Strategy',
  duration = '16 ชั่วโมง (Onsite 2 วัน)',
  learning_type = 'offline',
  level = 'PROFICIENT',
  updated_at = now()
WHERE slug = 'blueprint';

-- 4) Re-point any existing enrollments/modules/progress from the old
--    'frontier' course row onto the new brand-host-architect row, then
--    retire the now-duplicate frontier row instead of deleting it.
DO $$
DECLARE
  v_frontier_id uuid;
  v_brand_host_id uuid;
BEGIN
  SELECT id INTO v_frontier_id FROM public.courses WHERE slug = 'frontier';
  SELECT id INTO v_brand_host_id FROM public.courses WHERE slug = 'brand-host-architect';

  IF v_frontier_id IS NOT NULL AND v_brand_host_id IS NOT NULL THEN
    UPDATE public.course_enrollments
      SET course_id = v_brand_host_id
      WHERE course_id = v_frontier_id
        AND NOT EXISTS (
          SELECT 1 FROM public.course_enrollments ce2
          WHERE ce2.course_id = v_brand_host_id
            AND ce2.user_id = public.course_enrollments.user_id
        );

    UPDATE public.course_modules
      SET course_id = v_brand_host_id
      WHERE course_id = v_frontier_id;

    UPDATE public.courses SET
      is_active = false,
      slug = 'frontier-retired',
      updated_at = now()
    WHERE id = v_frontier_id;
  END IF;
END $$;

-- 5) Keep sort_order sane for the 5 visible courses on the public site.
UPDATE public.courses SET sort_order = 1 WHERE slug = 'magnet';
UPDATE public.courses SET sort_order = 2 WHERE slug = 'foundation';
UPDATE public.courses SET sort_order = 3 WHERE slug = 'signal';
UPDATE public.courses SET sort_order = 4 WHERE slug = 'stage';
UPDATE public.courses SET sort_order = 5 WHERE slug = 'brand-host-architect';

-- 6) Every registered student should see MAGNET (the free lead-magnet
--    course) on their dashboard automatically — matches get-enrollment's
--    "always include the free course" behavior on the LMS side.
INSERT INTO public.course_enrollments (user_id, course_id, status)
SELECT p.user_id, c.id, 'free'
FROM public.profiles p
CROSS JOIN (SELECT id FROM public.courses WHERE slug = 'magnet') c
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_enrollments ce
  WHERE ce.user_id = p.user_id AND ce.course_id = c.id
);
