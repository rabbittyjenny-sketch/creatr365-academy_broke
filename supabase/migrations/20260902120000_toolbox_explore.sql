-- Explore > Toolbox: free downloadable tools/files/templates, managed from
-- /admin/toolbox. Downloads require login (product decision — lets the
-- business see which master key downloaded what, for planning) so the
-- files bucket is private and served via short-lived signed URLs, the same
-- pattern Dashboard.tsx already uses for course-resources downloads.

-- 1) toolbox_assets — the catalog admins manage
CREATE TABLE IF NOT EXISTS public.toolbox_assets (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NOT NULL,
  description     text        NOT NULL DEFAULT '',
  category        text        NOT NULL DEFAULT 'downloadable',
  cover_image_url text,
  file_path       text        NOT NULL,
  file_name       text,
  file_type       text,
  sort_order      int         NOT NULL DEFAULT 0,
  is_active       boolean     NOT NULL DEFAULT true,
  download_count  int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_toolbox_assets_active_sort
  ON public.toolbox_assets (is_active, sort_order);

ALTER TABLE public.toolbox_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active toolbox assets are public" ON public.toolbox_assets;
CREATE POLICY "Active toolbox assets are public" ON public.toolbox_assets
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins view all toolbox assets" ON public.toolbox_assets;
CREATE POLICY "Admins view all toolbox assets" ON public.toolbox_assets
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage toolbox assets" ON public.toolbox_assets;
CREATE POLICY "Admins manage toolbox assets" ON public.toolbox_assets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_toolbox_assets_updated ON public.toolbox_assets;
CREATE TRIGGER trg_toolbox_assets_updated BEFORE UPDATE ON public.toolbox_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) toolbox_downloads — insert-only log for business planning ("who
-- downloaded what, how many, what kind of creator are they"). Never
-- updated or deleted from the app; that's what makes it usable as a
-- record, not just a live counter.
CREATE TABLE IF NOT EXISTS public.toolbox_downloads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      uuid        NOT NULL REFERENCES public.toolbox_assets(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id    text,
  gender        text,
  age_range     text,
  occupation    text,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_toolbox_downloads_asset ON public.toolbox_downloads (asset_id);
CREATE INDEX IF NOT EXISTS idx_toolbox_downloads_user  ON public.toolbox_downloads (user_id);

ALTER TABLE public.toolbox_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users log own downloads" ON public.toolbox_downloads;
CREATE POLICY "Users log own downloads" ON public.toolbox_downloads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view download log" ON public.toolbox_downloads;
CREATE POLICY "Admins view download log" ON public.toolbox_downloads
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 3) Increment the denormalized counter safely (definer function so the
-- INSERT-only client role doesn't also need UPDATE on toolbox_assets).
CREATE OR REPLACE FUNCTION public.increment_toolbox_download(_asset_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.toolbox_assets SET download_count = download_count + 1 WHERE id = _asset_id;
END;
$$;

-- 4) Lightweight, optional demographic fields on profiles — asked once
-- (first toolbox download), reused everywhere afterwards instead of
-- re-asking per download.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS occupation text;

-- 5) Storage: cover images are public (shown on the public /toolbox page
-- to convince people to log in and download); the files themselves are
-- private and only ever reachable via a signed URL requested after login.
INSERT INTO storage.buckets (id, name, public) VALUES ('toolbox-covers', 'toolbox-covers', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('toolbox-files', 'toolbox-files', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Toolbox covers public read" ON storage.objects;
CREATE POLICY "Toolbox covers public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'toolbox-covers');
DROP POLICY IF EXISTS "Admins manage toolbox covers" ON storage.objects;
CREATE POLICY "Admins manage toolbox covers" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'toolbox-covers' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'toolbox-covers' AND has_role(auth.uid(), 'admin'));

-- Files: readable only by logged-in users (enforces "must log in to
-- download" even against a leaked direct storage URL, not just at the UI
-- layer) and writable only by admins.
DROP POLICY IF EXISTS "Toolbox files readable when signed in" ON storage.objects;
CREATE POLICY "Toolbox files readable when signed in" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'toolbox-files');
DROP POLICY IF EXISTS "Admins manage toolbox files" ON storage.objects;
CREATE POLICY "Admins manage toolbox files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'toolbox-files' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'toolbox-files' AND has_role(auth.uid(), 'admin'));
