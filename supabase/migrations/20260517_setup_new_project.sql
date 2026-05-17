-- =============================================================================
-- CREATR365 ACADEMY — New Supabase Project Setup
-- รัน SQL นี้ใน Supabase Dashboard > SQL Editor ครั้งเดียว
-- ทุก statement ใช้ IF NOT EXISTS / ADD COLUMN IF NOT EXISTS (idempotent)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) profiles — เพิ่ม line_user_id + avatar_url (จาก migration 20260515120000)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS line_user_id text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Unique constraint (สร้างใหม่ถ้ายังไม่มี)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_line_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_line_user_id_key UNIQUE (line_user_id);
  END IF;
END $$;

-- Index สำหรับ lookup เร็ว
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id
  ON public.profiles (line_user_id)
  WHERE line_user_id IS NOT NULL;

-- RLS: service_role จัดการ profile ได้ (ใช้โดย liff-auth edge function)
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles" ON public.profiles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 2) user_accounts — เก็บ password hash (จาก migration 20260515140000)
--    Google Sheets รู้แค่ has_password=TRUE — ไม่รู้ hash จริง
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id     text        UNIQUE NOT NULL,
  email            text        UNIQUE,
  student_id       text,
  password_hash    text,
  hash_algorithm   text        NOT NULL DEFAULT 'sha256_client',
  is_active        boolean     NOT NULL DEFAULT true,
  registered_at    timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_accounts_line_user_id ON public.user_accounts (line_user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email        ON public.user_accounts (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_accounts_student_id   ON public.user_accounts (student_id) WHERE student_id IS NOT NULL;

-- Auto-update updated_at (ต้องมี function update_updated_at_column อยู่แล้วจาก migration เก่า)
DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON public.user_accounts;
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON public.user_accounts;
CREATE POLICY "Service role only"
  ON public.user_accounts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view user_accounts" ON public.user_accounts;
CREATE POLICY "Admins can view user_accounts"
  ON public.user_accounts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));


-- ---------------------------------------------------------------------------
-- 3) ตรวจสอบสถานะตารางหลังรัน
-- ---------------------------------------------------------------------------
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
