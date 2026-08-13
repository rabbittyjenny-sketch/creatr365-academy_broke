-- =============================================================================
-- CREATR365 Academy seed v2
-- Source of truth: 6course-quiz-main/src/Creatr365_LMS_v2.jsx
--
-- Notes:
-- - MATRIX uses MT01-MT06.
-- - BLUEPRINT uses B1,B2,B3,B5,B6,B7 because B4 was merged into B3.
-- - FRONTIER uses F1,F2,F3,F5,F6,F7 because F4 was merged into F3.
-- - This file is idempotent and safe to run more than once.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Keep module_progress compatible with supabase/functions/save-score
-- ---------------------------------------------------------------------------
ALTER TABLE public.module_progress
  ADD COLUMN IF NOT EXISTS score integer;

CREATE UNIQUE INDEX IF NOT EXISTS module_progress_user_module_unique
  ON public.module_progress (user_id, module_id);

CREATE UNIQUE INDEX IF NOT EXISTS course_modules_course_id_code_unique
  ON public.course_modules (course_id, code);

-- ---------------------------------------------------------------------------
-- 2) Seed 6 courses with the existing fixed UUIDs
-- ---------------------------------------------------------------------------
INSERT INTO public.courses (
  id,
  slug,
  tag,
  title,
  subtitle,
  description,
  duration,
  price,
  features,
  color,
  sort_order,
  is_active,
  learning_type,
  status,
  level,
  target_audience,
  format_label,
  kpi_notes,
  deliverables,
  outcome_goal,
  bloom_level
) VALUES
(
  '00729d54-fd3e-4ebb-afaf-c01261f000ee',
  'micro-express',
  'STARTER',
  'MICRO EXPRESS',
  '30-Sec Hook Formula',
  'หยุดนิ้วผู้ชมได้ใน 3 วินาที และวางพื้นฐาน Live Commerce 101',
  '3 ชั่วโมง',
  '990',
  ARRAY['30-Sec Hook Formula', 'Live Commerce 101', 'ส่ง Hook เขียน 1 ชิ้น'],
  'emerald',
  1,
  true,
  'online',
  'now_open',
  'STARTER',
  'ผู้เริ่มต้นทำ Live Commerce',
  'Online VOD',
  '[{"label":"Hook","target":"หยุดนิ้วผู้ชมใน 3 วินาที"}]'::jsonb,
  ARRAY['Hook เขียน 1 ชิ้น'],
  'สร้าง Hook สั้นที่ดึงความสนใจได้เร็ว',
  'Remember / Understand'
),
(
  '0ed8369b-79cb-4a20-bd9d-1e8c3e40d5cf',
  'signal',
  'ENTRY A',
  'SIGNAL',
  'Hook · Voice · Camera Presence',
  'ฝึก Hook, Voice, Camera Presence เพื่อเพิ่ม Watch Time',
  '6 ชั่วโมง',
  '2990',
  ARRAY['Hook Architecture', 'Vocal Dynamics', 'Camera Mastery', 'ส่ง Hook Video 30-45 วินาที'],
  'blue',
  2,
  true,
  'online',
  'now_open',
  'ENTRY',
  'Creator/Host ที่ต้องการมั่นใจหน้ากล้อง',
  'Online VOD',
  '[{"label":"Watch Time","target":"เพิ่ม Watch Time อย่างน้อย 30%"}]'::jsonb,
  ARRAY['Hook Video 30-45 วินาที'],
  'ยกระดับการเปิดไลฟ์และการสื่อสารหน้ากล้อง',
  'Apply'
),
(
  'd08531a4-8c2d-4e26-8013-53c025482ed5',
  'matrix',
  'ENTRY B',
  'MATRIX',
  'Platform Analytics · AI Tools',
  'เข้าใจ Algorithm, Dashboard, GMV, AI Tools และ Compliance',
  '6 ชั่วโมง',
  '2990',
  ARRAY['Algorithm Intel', 'Dashboard Analytics', 'AI Tools', 'Compliance PDPA/ETDA'],
  'violet',
  3,
  true,
  'online',
  'now_open',
  'ENTRY',
  'Creator/ทีมไลฟ์ที่ต้องใช้ข้อมูลตัดสินใจ',
  'Online VOD',
  '[{"label":"Live Score","target":"มากกว่า 75"}]'::jsonb,
  ARRAY['Data Analysis Report'],
  'อ่านข้อมูลไลฟ์และปรับระบบขายด้วย data',
  'Analyze'
),
(
  '99aec3b5-9e51-432c-981e-9f774711738e',
  'stage',
  'INTERMEDIATE',
  'STAGE',
  'Communication Mastery Lab',
  'ฝึก Vocal, Camera, Hook, Narrative และ Crisis Improv แบบ onsite',
  '8 ชั่วโมง (1 วัน)',
  '7900',
  ARRAY['Vocal Engine Lab', 'Camera Presence', 'Hook Factory', 'Crisis Improv Lab'],
  'orange',
  4,
  true,
  'onsite',
  'now_open',
  'INTERMEDIATE',
  'Host ที่ต้องการฝึก performance จริง',
  'Onsite 1 วัน',
  '[]'::jsonb,
  ARRAY['Trainer Assessment'],
  'ฝึกทักษะการแสดงสดและรับมือสถานการณ์จริง',
  'Apply / Analyze'
),
(
  '24562e32-bfa8-4951-8830-efb18d9d3d9d',
  'blueprint',
  'ADVANCED',
  'BLUEPRINT',
  'Identity & Production Architecture',
  'สร้าง Brand CI, Personal Branding, EPK และระบบ production team',
  '16 ชั่วโมง (2 วัน)',
  '15900',
  ARRAY['5 Hidden Souls', 'Brand CI Architecture', 'EPK', 'Multi-Camera Production'],
  'rose',
  5,
  true,
  'onsite',
  'now_open',
  'ADVANCED',
  'Host/Creator ที่ต้องการสร้างแบรนด์มืออาชีพ',
  'Onsite 2 วัน',
  '[]'::jsonb,
  ARRAY['EPK Draft'],
  'สร้าง identity และ production system ที่ใช้ขายงานกับแบรนด์ได้',
  'Create'
),
(
  '49c26d79-a040-4f85-8cf4-4305d51e4423',
  'frontier',
  'MASTER',
  'FRONTIER',
  'Business & Global Strategy',
  'P&L Mastery, Advanced Analytics, Smart Lazy Strategy และ Global Pitch',
  '16 ชั่วโมง (2 วัน)',
  '25900',
  ARRAY['P&L Mastery', 'Advanced Analytics', 'Smart Lazy Strategy', 'Global Pitch Simulation'],
  'slate',
  6,
  true,
  'onsite',
  'now_open',
  'MASTER',
  'Creator/Host ระดับมืออาชีพที่ต้องการขยายธุรกิจ',
  'Onsite 2 วัน',
  '[]'::jsonb,
  ARRAY['Global Pitch ภาษาอังกฤษ'],
  'วางระบบธุรกิจและ pitch สู่ตลาดที่ใหญ่ขึ้น',
  'Evaluate / Create'
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  tag = EXCLUDED.tag,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  learning_type = EXCLUDED.learning_type,
  status = EXCLUDED.status,
  level = EXCLUDED.level,
  target_audience = EXCLUDED.target_audience,
  format_label = EXCLUDED.format_label,
  kpi_notes = EXCLUDED.kpi_notes,
  deliverables = EXCLUDED.deliverables,
  outcome_goal = EXCLUDED.outcome_goal,
  bloom_level = EXCLUDED.bloom_level,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3) Seed course modules from LMS lesson codes
-- ---------------------------------------------------------------------------
WITH lms_modules (
  course_slug,
  code,
  name,
  duration_label,
  vod_url,
  sort_order,
  has_quiz,
  has_assignment,
  phase,
  is_test,
  summary
) AS (
  VALUES
  -- PRE/POST test modules, 2 per course = 12 rows
  ('micro-express', 'PRE',  'Pre-Test (แบบทดสอบก่อนเรียน)',  '10 นาที', NULL,   0, true,  false, 'pre',  true, 'วัดความรู้พื้นฐานก่อนเริ่มคอร์ส'),
  ('micro-express', 'POST', 'Post-Test (แบบทดสอบหลังเรียน)', '15 นาที', NULL,  99, true,  false, 'post', true, 'วัดผลการเรียนรู้หลังจบคอร์ส'),
  ('signal',        'PRE',  'Pre-Test (แบบทดสอบก่อนเรียน)',  '10 นาที', NULL,   0, true,  false, 'pre',  true, 'วัดความรู้พื้นฐานก่อนเริ่มคอร์ส'),
  ('signal',        'POST', 'Post-Test (แบบทดสอบหลังเรียน)', '15 นาที', NULL,  99, true,  false, 'post', true, 'วัดผลการเรียนรู้หลังจบคอร์ส'),
  ('matrix',        'PRE',  'Pre-Test (แบบทดสอบก่อนเรียน)',  '10 นาที', NULL,   0, true,  false, 'pre',  true, 'วัดความรู้พื้นฐานก่อนเริ่มคอร์ส'),
  ('matrix',        'POST', 'Post-Test (แบบทดสอบหลังเรียน)', '15 นาที', NULL,  99, true,  false, 'post', true, 'วัดผลการเรียนรู้หลังจบคอร์ส'),
  ('stage',         'PRE',  'Pre-Test (แบบทดสอบก่อนเรียน)',  '10 นาที', NULL,   0, true,  false, 'pre',  true, 'วัดความรู้พื้นฐานก่อนเริ่มคอร์ส'),
  ('stage',         'POST', 'Post-Test (แบบทดสอบหลังเรียน)', '15 นาที', NULL,  99, true,  false, 'post', true, 'วัดผลการเรียนรู้หลังจบคอร์ส'),
  ('blueprint',     'PRE',  'Pre-Test (แบบทดสอบก่อนเรียน)',  '10 นาที', NULL,   0, true,  false, 'pre',  true, 'วัดความรู้พื้นฐานก่อนเริ่มคอร์ส'),
  ('blueprint',     'POST', 'Post-Test (แบบทดสอบหลังเรียน)', '15 นาที', NULL,  99, true,  false, 'post', true, 'วัดผลการเรียนรู้หลังจบคอร์ส'),
  ('frontier',      'PRE',  'Pre-Test (แบบทดสอบก่อนเรียน)',  '10 นาที', NULL,   0, true,  false, 'pre',  true, 'วัดความรู้พื้นฐานก่อนเริ่มคอร์ส'),
  ('frontier',      'POST', 'Post-Test (แบบทดสอบหลังเรียน)', '15 นาที', NULL,  99, true,  false, 'post', true, 'วัดผลการเรียนรู้หลังจบคอร์ส'),

  -- MICRO EXPRESS
  ('micro-express', 'M01',  'Why Hook คือทุกอย่าง',           '8 นาที',            'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  10, true,  false, 'main', false, 'QG-01'),
  ('micro-express', 'M02',  '30-Sec Hook Formula ชั้นที่ 1',  '10 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  20, true,  false, 'main', false, 'QG-01'),
  ('micro-express', 'M03',  'Formula ชั้นที่ 2-3',             '12 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  30, true,  false, 'main', false, 'QG-01'),
  ('micro-express', 'M04',  'Host คือใคร? 5 ประเภท',          '8 นาที',            'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  40, true,  false, 'main', false, 'QG-05'),
  ('micro-express', 'M05',  'Live Commerce 101',                '10 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  50, true,  true,  'main', false, 'QG-05'),

  -- SIGNAL
  ('signal',        'S01',  'Hook Architecture',                '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  10, true,  false, 'main', false, 'QG-01'),
  ('signal',        'S02',  'S-O-R + PAD Theory',               '90 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  20, true,  false, 'main', false, 'QG-04'),
  ('signal',        'S03',  'Vocal Dynamics',                   '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  30, true,  false, 'main', false, 'QG-03'),
  ('signal',        'S04',  'Camera Mastery',                   '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  40, true,  false, 'main', false, 'QG-03'),
  ('signal',        'S05',  'Trust Architecture',               '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  50, true,  false, 'main', false, 'QG-03'),
  ('signal',        'S06',  'Narrative Selling',                '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  60, true,  true,  'main', false, 'QG-01'),

  -- MATRIX
  ('matrix',        'MT01', 'Algorithm Intel',                  '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  10, true,  false, 'main', false, 'QG-01'),
  ('matrix',        'MT02', 'FOMO System',                      '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  20, true,  false, 'main', false, 'QG-02'),
  ('matrix',        'MT03', 'Dashboard Analytics',              '90 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  30, true,  false, 'main', false, 'QG-05'),
  ('matrix',        'MT04', 'Reporting & GMV',                  '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  40, true,  false, 'main', false, 'QG-05'),
  ('matrix',        'MT05', 'AI Tools',                         '60 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  50, true,  false, 'main', false, 'QG-05'),
  ('matrix',        'MT06', 'Compliance (PDPA/ETDA)',           '30 นาที',           'https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb',  60, true,  true,  'main', false, 'QG-07'),

  -- STAGE
  ('stage',         'S1',   'Vocal Engine Lab',                 '09:00-10:30',       NULL,                                                                  10, true,  false, 'main', false, 'QG-03'),
  ('stage',         'S2',   'Camera Presence',                  '10:30-11:30',       NULL,                                                                  20, true,  false, 'main', false, 'QG-03'),
  ('stage',         'S3',   'Hook Factory',                     '11:30-12:00',       NULL,                                                                  30, true,  false, 'main', false, 'QG-01'),
  ('stage',         'S4',   'Narrative Performance',            '13:00-14:30',       NULL,                                                                  40, true,  false, 'main', false, 'QG-04'),
  ('stage',         'S5',   'Crisis Improv Lab',                '14:30-16:30',       NULL,                                                                  50, true,  false, 'main', false, 'QG-03'),
  ('stage',         'S6',   'Test Live + Debrief',              '16:30-17:00',       NULL,                                                                  60, true,  false, 'main', false, 'QG-01'),

  -- BLUEPRINT
  ('blueprint',     'B1',   '5 Hidden Souls',                   'วัน 1 · 09:00-11:30', NULL,                                                               10, true,  false, 'main', false, 'QG-06'),
  ('blueprint',     'B2',   'Brand CI Architecture',            'วัน 1 · 12:30-14:30', NULL,                                                               20, true,  false, 'main', false, 'QG-06'),
  ('blueprint',     'B3',   'Personal Branding + EPK',          'วัน 1 · 14:30-16:30', NULL,                                                               30, true,  false, 'main', false, 'QG-06'),
  ('blueprint',     'B5',   'Multi-Camera Production',          'วัน 2 · 09:00-11:00', NULL,                                                               50, true,  false, 'main', false, 'QG-06'),
  ('blueprint',     'B6',   'Team Production System',           'วัน 2 · 11:00-12:30', NULL,                                                               60, true,  false, 'main', false, 'QG-06'),
  ('blueprint',     'B7',   'Live Simulation + EPK Build',      'วัน 2 · 13:30-16:00', NULL,                                                               70, true,  true,  'main', false, 'QG-06'),

  -- FRONTIER
  ('frontier',      'F1',   'P&L Mastery',                      'วัน 1 · 09:00-11:30', NULL,                                                               10, true,  false, 'main', false, 'QG-07'),
  ('frontier',      'F2',   'Advanced Analytics',               'วัน 1 · 12:30-14:00', NULL,                                                               20, true,  false, 'main', false, 'QG-05'),
  ('frontier',      'F3',   'Smart Lazy Strategy',              'วัน 1 · 14:00-15:30', NULL,                                                               30, true,  false, 'main', false, 'QG-07'),
  ('frontier',      'F5',   'Global Market Intelligence',       'วัน 2 · 09:00-11:00', NULL,                                                               50, true,  false, 'main', false, 'QG-07'),
  ('frontier',      'F6',   'IMC & Digital Marketing',          'วัน 2 · 11:00-12:30', NULL,                                                               60, true,  false, 'main', false, 'QG-06'),
  ('frontier',      'F7',   'Global Pitch Simulation',          'วัน 2 · 13:30-16:00', NULL,                                                               70, true,  true,  'main', false, 'QG-07')
)
INSERT INTO public.course_modules (
  course_id,
  code,
  name,
  duration_label,
  vod_url,
  sort_order,
  has_quiz,
  has_assignment,
  phase,
  is_test,
  summary
)
SELECT
  c.id,
  lm.code,
  lm.name,
  lm.duration_label,
  lm.vod_url,
  lm.sort_order,
  lm.has_quiz,
  lm.has_assignment,
  lm.phase,
  lm.is_test,
  lm.summary
FROM lms_modules lm
JOIN public.courses c ON c.slug = lm.course_slug
ON CONFLICT (course_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  duration_label = EXCLUDED.duration_label,
  vod_url = EXCLUDED.vod_url,
  sort_order = EXCLUDED.sort_order,
  has_quiz = EXCLUDED.has_quiz,
  has_assignment = EXCLUDED.has_assignment,
  phase = EXCLUDED.phase,
  is_test = EXCLUDED.is_test,
  summary = EXCLUDED.summary,
  updated_at = now();

COMMIT;

-- Quick check after running:
-- SELECT c.slug, count(cm.id) AS module_count
-- FROM public.courses c
-- LEFT JOIN public.course_modules cm ON cm.course_id = c.id
-- WHERE c.slug IN ('micro-express','signal','matrix','stage','blueprint','frontier')
-- GROUP BY c.slug, c.sort_order
-- ORDER BY c.sort_order;
