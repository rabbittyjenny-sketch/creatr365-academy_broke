-- Lets an admin drop a real header image/video onto the Toolbox / AI Lab /
-- Creator Tools pages (currently text-only placeholders) without a code
-- change each time. One row per page, keyed by a fixed slug; both
-- image_url and video_url are optional — the page falls back to its
-- current text-only header when neither is set, so this ships with zero
-- visible change until an admin actually fills one in.
CREATE TABLE IF NOT EXISTS public.page_banners (
  page_key    text        PRIMARY KEY,
  image_url   text,
  video_url   text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_banners ENABLE ROW LEVEL SECURITY;

-- Decorative content, same as course cover images — public read.
DROP POLICY IF EXISTS "Anyone can view page banners" ON public.page_banners;
CREATE POLICY "Anyone can view page banners" ON public.page_banners FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage page banners" ON public.page_banners;
CREATE POLICY "Admins manage page banners" ON public.page_banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.page_banners (page_key) VALUES ('toolbox'), ('ai-lab'), ('creator-tools')
ON CONFLICT (page_key) DO NOTHING;
