-- =============================================================================
-- Creatr365 Master Key unification
-- One student_id can belong to multiple identities (web + LINE), while
-- line_user_id stays unique per identity.
-- =============================================================================

ALTER TABLE public.user_accounts
  DROP CONSTRAINT IF EXISTS user_accounts_email_key;

CREATE INDEX IF NOT EXISTS idx_user_accounts_email
  ON public.user_accounts (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_accounts_student_id
  ON public.user_accounts (student_id)
  WHERE student_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_master_student_id(_student_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN NULLIF(trim(COALESCE(_student_id, '')), '') IS NULL THEN NULL
    ELSE upper(regexp_replace(trim(_student_id), '\s+', '', 'g'))
  END
$$;

CREATE OR REPLACE FUNCTION public.generate_master_student_id(_seed text)
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT 'STU-' || upper(substr(md5(COALESCE(NULLIF(trim(_seed), ''), gen_random_uuid()::text)), 1, 8))
$$;

CREATE OR REPLACE FUNCTION public.ensure_master_student_account_for_identity(
  _line_user_id text,
  _email text DEFAULT NULL,
  _student_id text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line_user_id text := NULLIF(trim(_line_user_id), '');
  v_email text := lower(NULLIF(trim(_email), ''));
  v_requested_sid text := public.normalize_master_student_id(_student_id);
  v_current_sid text;
  v_email_sid text;
  v_master_sid text;
BEGIN
  IF v_line_user_id IS NULL THEN
    RAISE EXCEPTION 'line_user_id is required';
  END IF;

  SELECT student_id
    INTO v_current_sid
  FROM public.user_accounts
  WHERE line_user_id = v_line_user_id
    AND student_id IS NOT NULL
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    SELECT student_id
      INTO v_email_sid
    FROM public.user_accounts
    WHERE email = v_email
      AND student_id IS NOT NULL
    ORDER BY registered_at ASC
    LIMIT 1;
  END IF;

  v_master_sid := COALESCE(
    v_requested_sid,
    v_email_sid,
    v_current_sid,
    public.generate_master_student_id(v_line_user_id)
  );

  INSERT INTO public.user_accounts (
    line_user_id,
    email,
    student_id,
    is_active
  )
  VALUES (
    v_line_user_id,
    v_email,
    v_master_sid,
    true
  )
  ON CONFLICT (line_user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.user_accounts.email),
    student_id = EXCLUDED.student_id,
    is_active = true,
    updated_at = now()
  RETURNING student_id INTO v_master_sid;

  RETURN v_master_sid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_master_student_account_for_identity(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_master_student_account_for_identity(text, text, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.ensure_master_student_account(_email text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN public.ensure_master_student_account_for_identity(
    'web:' || v_user_id::text,
    _email,
    NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_master_student_account(text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.link_line_master_student_account(
  _line_user_id text,
  _email text DEFAULT NULL,
  _student_id text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile_line_user_id text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT line_user_id
    INTO v_profile_line_user_id
  FROM public.profiles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_profile_line_user_id IS NULL OR v_profile_line_user_id <> NULLIF(trim(_line_user_id), '') THEN
    RAISE EXCEPTION 'LINE identity does not match the signed-in user';
  END IF;

  RETURN public.ensure_master_student_account_for_identity(
    _line_user_id,
    _email,
    _student_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_line_master_student_account(text, text, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line_identity text;
  v_profile_line_user_id text;
BEGIN
  v_profile_line_user_id := NEW.raw_user_meta_data->>'line_user_id';
  v_line_identity := COALESCE(v_profile_line_user_id, 'web:' || NEW.id::text);

  INSERT INTO public.profiles (user_id, display_name, avatar_url, line_user_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    v_profile_line_user_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    line_user_id = COALESCE(EXCLUDED.line_user_id, public.profiles.line_user_id);

  PERFORM public.ensure_master_student_account_for_identity(
    v_line_identity,
    NEW.email,
    NULL
  );

  RETURN NEW;
END;
$$;

WITH auth_identities AS (
  SELECT DISTINCT ON (COALESCE(u.raw_user_meta_data->>'line_user_id', 'web:' || u.id::text))
    COALESCE(u.raw_user_meta_data->>'line_user_id', 'web:' || u.id::text) AS line_user_id,
    lower(NULLIF(u.email, '')) AS email,
    u.created_at
  FROM auth.users u
  ORDER BY COALESCE(u.raw_user_meta_data->>'line_user_id', 'web:' || u.id::text), u.created_at ASC
)
INSERT INTO public.user_accounts (line_user_id, email, student_id, is_active)
SELECT
  ai.line_user_id,
  ai.email,
  COALESCE(
    email_match.student_id,
    line_match.student_id,
    public.generate_master_student_id(ai.line_user_id)
  ) AS student_id,
  true AS is_active
FROM auth_identities ai
LEFT JOIN public.user_accounts line_match
  ON line_match.line_user_id = ai.line_user_id
LEFT JOIN LATERAL (
  SELECT ua.student_id
  FROM public.user_accounts ua
  WHERE ua.email = ai.email
    AND ua.student_id IS NOT NULL
  ORDER BY ua.registered_at ASC
  LIMIT 1
) email_match ON ai.email IS NOT NULL
ON CONFLICT (line_user_id) DO UPDATE SET
  email = COALESCE(EXCLUDED.email, public.user_accounts.email),
  student_id = COALESCE(public.user_accounts.student_id, EXCLUDED.student_id),
  is_active = true,
  updated_at = now();
