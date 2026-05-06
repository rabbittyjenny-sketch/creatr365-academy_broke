
-- 1. Enrich courses table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS format_label text,
  ADD COLUMN IF NOT EXISTS intro_video_url text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_image_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS kpi_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deliverables text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS outcome_goal text,
  ADD COLUMN IF NOT EXISTS bloom_level text;

-- 2. course_modules
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  summary text DEFAULT '',
  duration_label text DEFAULT '',
  vod_url text,
  sort_order int NOT NULL DEFAULT 0,
  has_quiz boolean NOT NULL DEFAULT false,
  has_assignment boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules viewable by everyone" ON public.course_modules FOR SELECT USING (true);
CREATE POLICY "Admins manage modules" ON public.course_modules FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_course_modules_updated BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. course_quizzes & quiz_questions (data only)
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  qg_code text,
  phase text NOT NULL DEFAULT 'post',
  title text NOT NULL,
  pass_threshold int NOT NULL DEFAULT 80,
  source_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes viewable by everyone" ON public.course_quizzes FOR SELECT USING (true);
CREATE POLICY "Admins manage quizzes" ON public.course_quizzes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  q_no int NOT NULL,
  type text NOT NULL DEFAULT 'mcq',
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer text,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions visible to admins only" ON public.quiz_questions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- 4. module_progress
CREATE TABLE IF NOT EXISTS public.module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'unlocked',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own progress" ON public.module_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public.module_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.module_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all progress" ON public.module_progress FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update all progress" ON public.module_progress FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));

-- 5. assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  video_url text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  score numeric,
  reviewer_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own assignments" ON public.assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all assignments" ON public.assignments FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update assignments" ON public.assignments FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));

-- 6. enrollment notes (admin audit)
CREATE TABLE IF NOT EXISTS public.enrollment_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enrollment_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage enrollment notes" ON public.enrollment_notes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- 7. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('course-media','course-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Course media public read" ON storage.objects FOR SELECT USING (bucket_id = 'course-media');
CREATE POLICY "Admins upload course media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-media' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update course media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'course-media' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete course media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-media' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Users upload own assignments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-media' AND (storage.foldername(name))[1] = 'assignments' AND (storage.foldername(name))[2] = auth.uid()::text);

-- 8. unlock_next_module helper
CREATE OR REPLACE FUNCTION public.unlock_next_module(_user_id uuid, _module_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur_course uuid;
  cur_order int;
  next_module uuid;
BEGIN
  SELECT course_id, sort_order INTO cur_course, cur_order
    FROM public.course_modules WHERE id = _module_id;
  IF cur_course IS NULL THEN RETURN; END IF;
  -- mark current completed
  INSERT INTO public.module_progress(user_id, module_id, status, completed_at)
    VALUES (_user_id, _module_id, 'completed', now())
    ON CONFLICT (user_id, module_id)
    DO UPDATE SET status = 'completed', completed_at = now();
  -- unlock next
  SELECT id INTO next_module FROM public.course_modules
    WHERE course_id = cur_course AND sort_order > cur_order
    ORDER BY sort_order ASC LIMIT 1;
  IF next_module IS NOT NULL THEN
    INSERT INTO public.module_progress(user_id, module_id, status)
      VALUES (_user_id, next_module, 'unlocked')
      ON CONFLICT (user_id, module_id) DO NOTHING;
  END IF;
END;
$$;
