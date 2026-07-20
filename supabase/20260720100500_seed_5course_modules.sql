-- =============================================================================
-- Seed course_modules for the 5 real courses (MAGNET/FOUNDATION/SIGNAL/
-- STAGE/BRAND_HOST_ARCHITECT) with `code` values that exactly match the
-- lesson `id`s hardcoded in the LMS's COURSES object
-- (lms/src/Creatr365_LMS_v2.jsx). This is required for two things to work:
--   1. The Dashboard's "ดูบทเรียน" lesson list shows the real lesson names
--      (pulled from the actual handbook table of contents), not placeholder
--      PRE/POST rows.
--   2. save-score resolves course_slug + module_code -> course_modules row
--      -> module_progress, so the Dashboard's done/total + score badges line
--      up with what the student actually completed in the LMS.
-- If you rename a lesson in the LMS COURSES object, update its `code` here
-- to match, or Dashboard/score-tracking will silently go out of sync again.
-- =============================================================================

DO $$
DECLARE
  v_magnet uuid;
  v_foundation uuid;
  v_signal uuid;
  v_stage uuid;
  v_brand_host uuid;
BEGIN
  SELECT id INTO v_magnet      FROM public.courses WHERE slug = 'magnet';
  SELECT id INTO v_foundation  FROM public.courses WHERE slug = 'foundation';
  SELECT id INTO v_signal      FROM public.courses WHERE slug = 'signal';
  SELECT id INTO v_stage       FROM public.courses WHERE slug = 'stage';
  SELECT id INTO v_brand_host  FROM public.courses WHERE slug = 'brand-host-architect';

  -- Clear out any old auto-generated modules for these 5 courses so we don't
  -- end up with duplicate/orphaned rows sitting next to the real lesson set.
  DELETE FROM public.course_modules
  WHERE course_id IN (v_magnet, v_foundation, v_signal, v_stage, v_brand_host);

  -- ── MAGNET ────────────────────────────────────────────────────────────
  INSERT INTO public.course_modules (course_id, code, name, duration_label, sort_order, has_quiz)
  VALUES
    (v_magnet, 'MG01', 'Why Live Commerce Matters',             '15 นาที', 1, true),
    (v_magnet, 'MG02', 'The Real Reason Live Succeeds or Fails','10 นาที', 2, true),
    (v_magnet, 'MG03', 'Find Your Host Identity',                '10 นาที', 3, false),
    (v_magnet, 'MG04', 'First Live Blueprint',                   '15 นาที', 4, true),
    (v_magnet, 'MG05', 'What Successful Lives Look Like',        '5 นาที',  5, false),
    (v_magnet, 'MG06', 'Measure What Matters',                   '10 นาที', 6, true);

  -- ── FOUNDATION (Course 0) ────────────────────────────────────────────
  INSERT INTO public.course_modules (course_id, code, name, duration_label, sort_order, has_quiz)
  VALUES
    (v_foundation, 'F001', 'ปัญหาที่แท้จริงของนักไลฟ์ไทย', '15 นาที', 1, false),
    (v_foundation, 'F01',  'Live Commerce คืออะไร',           '25 นาที', 2, true),
    (v_foundation, 'F02',  'จรรยาบรรณก่อนออกอากาศ',         '25 นาที', 3, true),
    (v_foundation, 'F03',  'ค้นหาตัวตนโฮสต์ของคุณ',         '15 นาที', 4, false),
    (v_foundation, 'F04',  'สร้าง Hook ที่หยุดนิ้วผู้ชม',    '60 นาที', 5, true),
    (v_foundation, 'F05',  'เทคนิค ASBC',                     '20 นาที', 6, true),
    (v_foundation, 'F06',  'เตรียมตัวไลฟ์ครั้งแรก',           '25 นาที', 7, true),
    (v_foundation, 'F07',  'อ่านข้อมูลและเติบโต',             '50 นาที', 8, true);

  -- ── SIGNAL (Course 1) ────────────────────────────────────────────────
  INSERT INTO public.course_modules (course_id, code, name, duration_label, sort_order, has_quiz)
  VALUES
    (v_signal, 'S00', 'ภาพรวมและแรงจูงใจ',                          '15 นาที', 1, false),
    (v_signal, 'S01', 'รากฐานความเชื่อใจและจรรยาบรรณ',             '45 นาที', 2, true),
    (v_signal, 'S02', 'ทักษะร่างกาย เสียง และการปรากฏตัวหน้ากล้อง', '60 นาที', 3, true),
    (v_signal, 'S03', 'โครงสร้างบทพูด ASBC',                        '60 นาที', 4, true),
    (v_signal, 'S04', 'จิตวิทยาการโน้มน้าวใจขั้นสูง',               '60 นาที', 5, true),
    (v_signal, 'S05', 'ระบบหลังบ้านและการวัดผล',                    '60 นาที', 6, true),
    (v_signal, 'S06', 'มาตรฐานสากลและบทสรุป',                       '30 นาที', 7, false);

  -- ── STAGE (Course 2, onsite) ─────────────────────────────────────────
  INSERT INTO public.course_modules (course_id, code, name, duration_label, sort_order, has_quiz)
  VALUES
    (v_stage, 'ST1', 'Foundation & Vocal Engine Lab', '09:00-10:30', 1, false),
    (v_stage, 'ST2', 'Camera Presence',                '10:30-11:30', 2, false),
    (v_stage, 'ST3', 'Hook Factory',                   '11:30-12:00 / 13:00-14:30', 3, true),
    (v_stage, 'ST4', 'Narrative Performance',          '14:30-15:30', 4, true),
    (v_stage, 'ST5', 'Crisis Improv Lab',              '15:30-16:30', 5, false),
    (v_stage, 'ST6', 'KPI Test & Debrief',             '16:30-17:00', 6, true);

  -- ── BRAND HOST ARCHITECT (Course 3, onsite, 2 days) ──────────────────
  INSERT INTO public.course_modules (course_id, code, name, duration_label, sort_order, has_quiz)
  VALUES
    (v_brand_host, 'BH1', '5 Hidden Souls — Host Archetype DNA',       'วัน 1 · 09:00-10:30', 1, true),
    (v_brand_host, 'BH2', 'Brand CI 4 มิติ สู่ความพรีเมียม',           'วัน 1 · 10:30-12:00', 2, true),
    (v_brand_host, 'BH3', 'Advanced Live Commerce Business Model',     'วัน 1 · 13:00-15:00', 3, true),
    (v_brand_host, 'BH4', 'Legal Framework & Multi-Channel Contract',  'วัน 1 · 15:00-17:00', 4, false),
    (v_brand_host, 'BH5', 'Multi-Camera Production Architecture',      'วัน 2 · 09:00-10:30', 5, false),
    (v_brand_host, 'BH6', 'Team Production System & Hand Signals',     'วัน 2 · 10:30-12:00', 6, true),
    (v_brand_host, 'BH7', 'P&L Mastery & Live Unit Economics',         'วัน 2 · 13:00-15:30', 7, true),
    (v_brand_host, 'BH8', 'Global Market Intel & Scaling Strategy',    'วัน 2 · 15:30-17:00', 8, true);
END $$;
