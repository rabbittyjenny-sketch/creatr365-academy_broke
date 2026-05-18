-- ---------------------------------------------------------------------------
-- Fix: Allow authenticated users to read their own student_id from user_accounts
-- The join path is: auth.uid() → profiles.user_id → profiles.line_user_id → user_accounts.line_user_id
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own user_account" ON public.user_accounts;
CREATE POLICY "Users can view own user_account" ON public.user_accounts
  FOR SELECT TO authenticated
  USING (
    line_user_id = (
      SELECT line_user_id FROM public.profiles
      WHERE user_id = auth.uid()
        AND line_user_id IS NOT NULL
      LIMIT 1
    )
  );
