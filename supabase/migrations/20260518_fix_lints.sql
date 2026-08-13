-- =============================================================================
-- CREATR365 ACADEMY — Fix Security & Performance Lints
-- รัน SQL นี้ใน Supabase SQL Editor ต่อจาก 20260517_setup_new_project.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SECURITY: Fix function_search_path_mutable (WARN)
-- เพิ่ม SET search_path = '' ทุก function เพื่อป้องกัน search_path injection
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_promo_used(promo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = promo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, line_user_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'line_user_id'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name  = EXCLUDED.display_name,
    avatar_url    = EXCLUDED.avatar_url,
    line_user_id  = COALESCE(EXCLUDED.line_user_id, public.profiles.line_user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_next_module(_module_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_course_id  uuid;
  v_sort_order integer;
  v_next_id    uuid;
BEGIN
  SELECT course_id, sort_order INTO v_course_id, v_sort_order
  FROM public.course_modules WHERE id = _module_id;

  SELECT id INTO v_next_id
  FROM public.course_modules
  WHERE course_id = v_course_id AND sort_order > v_sort_order
  ORDER BY sort_order LIMIT 1;

  IF v_next_id IS NOT NULL THEN
    INSERT INTO public.module_progress (user_id, module_id, status)
    VALUES (_user_id, v_next_id, 'unlocked')
    ON CONFLICT (user_id, module_id) DO NOTHING;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- SECURITY: Revoke execute from anon on SECURITY DEFINER functions
-- handle_new_user — trigger only, ไม่ควร call ตรง
-- has_role         — ใช้ใน RLS policy (authenticated ต้องเรียกได้), revoke แค่ anon
-- others           — revoke anon เพื่อป้องกัน unauthenticated call
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)     FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_promo_used(uuid)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.unlock_next_module(uuid, uuid)      FROM anon;

-- ---------------------------------------------------------------------------
-- PERFORMANCE: Add missing indexes on foreign key columns
-- ---------------------------------------------------------------------------

-- assignments
CREATE INDEX IF NOT EXISTS idx_assignments_user_id   ON public.assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments (course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module_id ON public.assignments (module_id) WHERE module_id IS NOT NULL;

-- course_enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_promo_code_id ON public.course_enrollments (promo_code_id) WHERE promo_code_id IS NOT NULL;

-- course_quizzes
CREATE INDEX IF NOT EXISTS idx_course_quizzes_course_id ON public.course_quizzes (course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_course_quizzes_module_id ON public.course_quizzes (module_id) WHERE module_id IS NOT NULL;

-- diagnostic_quiz_results
CREATE INDEX IF NOT EXISTS idx_diag_quiz_results_user_id ON public.diagnostic_quiz_results (user_id) WHERE user_id IS NOT NULL;

-- enrollment_notes
CREATE INDEX IF NOT EXISTS idx_enrollment_notes_enrollment_id ON public.enrollment_notes (enrollment_id);

-- event_registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations (user_id);

-- module_progress
CREATE INDEX IF NOT EXISTS idx_module_progress_module_id ON public.module_progress (module_id);

-- promo_codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_course_id ON public.promo_codes (course_id) WHERE course_id IS NOT NULL;

-- quiz_questions
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions (quiz_id);

-- ---------------------------------------------------------------------------
-- ตรวจสอบผล: นับ indexes ที่เพิ่งสร้าง
-- ---------------------------------------------------------------------------
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
