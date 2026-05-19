-- Prevent duplicate paid/free enrollments for same user+course
-- (pending rows are allowed multiple times; they're cleaned up on new checkout attempt)
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique_paid
  ON public.course_enrollments (user_id, course_id)
  WHERE status IN ('paid', 'free');

-- Ensure service_role can bypass RLS on module_progress
-- (Supabase service_role bypasses RLS by default, but this is an explicit safety policy)
DROP POLICY IF EXISTS "Service role manages progress" ON public.module_progress;
CREATE POLICY "Service role manages progress" ON public.module_progress
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Same for course_enrollments updates from Edge Functions
DROP POLICY IF EXISTS "Service role manages enrollments" ON public.course_enrollments;
CREATE POLICY "Service role manages enrollments" ON public.course_enrollments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
