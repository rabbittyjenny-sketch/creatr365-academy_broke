
-- 1) course_modules: phase + is_test
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- 2) articles
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  cover_image_url text,
  kind text NOT NULL DEFAULT 'news', -- news | tool | community | quiz
  target_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Articles viewable by everyone" ON public.articles;
CREATE POLICY "Articles viewable by everyone" ON public.articles
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage articles" ON public.articles;
CREATE POLICY "Admins manage articles" ON public.articles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) diagnostic_quiz_results
CREATE TABLE IF NOT EXISTS public.diagnostic_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  gender text,
  age_band text,
  province text,
  occupation text,
  interest text,
  total_score integer NOT NULL DEFAULT 0,
  per_qg_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  strengths text[] NOT NULL DEFAULT '{}',
  gaps text[] NOT NULL DEFAULT '{}',
  recommended_courses text[] NOT NULL DEFAULT '{}',
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostic_quiz_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert quiz results" ON public.diagnostic_quiz_results;
CREATE POLICY "Anyone can insert quiz results" ON public.diagnostic_quiz_results
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users view own quiz results" ON public.diagnostic_quiz_results;
CREATE POLICY "Users view own quiz results" ON public.diagnostic_quiz_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins view all quiz results" ON public.diagnostic_quiz_results;
CREATE POLICY "Admins view all quiz results" ON public.diagnostic_quiz_results
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- 4) seed pre/post test modules for every active course (idempotent)
INSERT INTO public.course_modules (course_id, code, name, summary, duration_label, sort_order, has_quiz, has_assignment, phase, is_test)
SELECT c.id, 'PRE', 'Pre-Test (แบบทดสอบก่อนเรียน)', 'วัดความรู้พื้นฐานก่อนเริ่มคอร์ส', '10 นาที', 0, true, false, 'pre', true
FROM public.courses c
WHERE c.is_active = true
AND NOT EXISTS (SELECT 1 FROM public.course_modules m WHERE m.course_id = c.id AND m.phase = 'pre');

INSERT INTO public.course_modules (course_id, code, name, summary, duration_label, sort_order, has_quiz, has_assignment, phase, is_test)
SELECT c.id, 'POST', 'Post-Test (แบบทดสอบหลังเรียน)', 'วัดผลการเรียนรู้ตามเกณฑ์ Bloom Apply/Analyze', '15 นาที', 99, true, false, 'post', true
FROM public.courses c
WHERE c.is_active = true
AND NOT EXISTS (SELECT 1 FROM public.course_modules m WHERE m.course_id = c.id AND m.phase = 'post');

-- 5) seed first article: diagnostic quiz
INSERT INTO public.articles (slug, title, summary, kind, target_url, sort_order)
VALUES (
  'diagnostic-quiz',
  'รู้ก่อนว่าคุณควรเริ่มจากตรงไหน',
  'แบบทดสอบประเมินทักษะ Live Commerce 14 ข้อ — ใช้เวลา 10 นาที วิเคราะห์ว่าคุณควรเริ่มเรียนคอร์สไหนก่อน',
  'quiz',
  '/articles/diagnostic-quiz',
  0
) ON CONFLICT (slug) DO NOTHING;
