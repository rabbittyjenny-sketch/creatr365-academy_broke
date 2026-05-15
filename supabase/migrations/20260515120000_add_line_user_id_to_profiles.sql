-- Add LINE user ID and avatar URL to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS line_user_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Index for fast LINE user ID lookups (used by make-webhook & liff-auth)
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON public.profiles (line_user_id)
  WHERE line_user_id IS NOT NULL;

-- Allow service role to upsert profiles (needed by liff-auth edge function)
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles" ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
