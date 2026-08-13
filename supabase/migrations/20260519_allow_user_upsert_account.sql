-- Allow authenticated users to INSERT their own user_account row (on first register)
-- and UPDATE it later (e.g. update email or student_id)
-- Auth link: auth.uid() → profiles.user_id → profiles.line_user_id → user_accounts.line_user_id

DROP POLICY IF EXISTS "Users can insert own user_account" ON public.user_accounts;
CREATE POLICY "Users can insert own user_account" ON public.user_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    line_user_id = (
      SELECT line_user_id FROM public.profiles
      WHERE user_id = auth.uid() AND line_user_id IS NOT NULL
      LIMIT 1
    )
  );

DROP POLICY IF EXISTS "Users can update own user_account" ON public.user_accounts;
CREATE POLICY "Users can update own user_account" ON public.user_accounts
  FOR UPDATE TO authenticated
  USING (
    line_user_id = (
      SELECT line_user_id FROM public.profiles
      WHERE user_id = auth.uid() AND line_user_id IS NOT NULL
      LIMIT 1
    )
  )
  WITH CHECK (
    line_user_id = (
      SELECT line_user_id FROM public.profiles
      WHERE user_id = auth.uid() AND line_user_id IS NOT NULL
      LIMIT 1
    )
  );
