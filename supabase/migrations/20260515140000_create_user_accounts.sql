-- user_accounts: stores hashed credentials for LINE-registered students
-- Google Sheets (tb_students) stores has_password=TRUE only — never the hash
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id     text        UNIQUE NOT NULL,        -- LINE userId (Key ID)
  email            text        UNIQUE,                  -- from registration form
  student_id       text,                                -- tb_students key from Google Sheets
  password_hash    text,                                -- SHA-256(password+line_user_id) from client
  hash_algorithm   text        NOT NULL DEFAULT 'sha256_client',
  -- ^ 'sha256_client'  = current MVP (client-side hash)
  -- ^ 'bcrypt_server'  = future upgrade (server-side bcrypt/argon2)
  is_active        boolean     NOT NULL DEFAULT true,
  registered_at    timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Fast lookups by line_user_id and email
CREATE INDEX IF NOT EXISTS idx_user_accounts_line_user_id ON public.user_accounts (line_user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email        ON public.user_accounts (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_accounts_student_id   ON public.user_accounts (student_id) WHERE student_id IS NOT NULL;

-- Auto-update updated_at
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Only service_role (Edge Functions) can read/write — no direct client access
CREATE POLICY "Service role only"
  ON public.user_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view (for support/debug)
CREATE POLICY "Admins can view user_accounts"
  ON public.user_accounts
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
