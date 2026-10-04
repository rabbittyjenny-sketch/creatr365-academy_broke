-- ─────────────────────────────────────────────────────────────────────────
-- Live Notes (full-length knowledge clips on /courses) + viewer statistics
--
-- Live Notes reuse the existing `articles` table and the existing Admin
-- "เนื้อหา" page, as a new kind = 'live_note'. They are NOT courses: no
-- lessons, no quiz, no enrollment. Community keeps kind = 'video' for
-- activity / atmosphere / news clips.
--
-- content_views is written only through log_live_note_view() (SECURITY
-- DEFINER) so the browser can never set or alter the demographic snapshot;
-- it is read only by admins.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS video_url         text,
  ADD COLUMN IF NOT EXISTS related_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_label    text;

COMMENT ON COLUMN public.articles.video_url IS 'YouTube URL (watch / youtu.be / shorts / embed) — played inside the site, never linked out';
COMMENT ON COLUMN public.articles.related_course_id IS 'Live Notes only: course suggested on the end card';

CREATE INDEX IF NOT EXISTS articles_kind_active_idx ON public.articles (kind, is_active, sort_order);

-- Drafts used to be readable by anyone ("Articles are public" USING true).
-- Admins keep full access through the existing "Admins manage articles".
DROP POLICY IF EXISTS "Articles are public" ON public.articles;
DROP POLICY IF EXISTS "Published articles are public" ON public.articles;
CREATE POLICY "Published articles are public" ON public.articles
  FOR SELECT USING (is_active = true);

-- ── Viewer log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_views (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id       uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  view_session     uuid NOT NULL UNIQUE,          -- one per player open, generated in the browser
  source           text,                          -- ?src= from the promo link (tiktok, facebook, ...)
  max_progress_pct smallint NOT NULL DEFAULT 0 CHECK (max_progress_pct BETWEEN 0 AND 100),
  completed        boolean NOT NULL DEFAULT false, -- reached 90%
  started_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  -- snapshot from profiles at first play
  gender           text,
  age_range        text,
  occupation       text,
  province         text
);

CREATE INDEX IF NOT EXISTS content_views_article_idx ON public.content_views (article_id, started_at DESC);
CREATE INDEX IF NOT EXISTS content_views_user_idx    ON public.content_views (user_id);

ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read content views" ON public.content_views;
CREATE POLICY "Admins read content views" ON public.content_views
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- No INSERT/UPDATE/DELETE policies on purpose: writes go through the RPC below.

CREATE OR REPLACE FUNCTION public.log_live_note_view(
  _article_id   uuid,
  _view_session uuid,
  _progress_pct integer DEFAULT 0,
  _source       text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _pct smallint := LEAST(100, GREATEST(0, COALESCE(_progress_pct, 0)));
  _src text := NULLIF(left(regexp_replace(lower(COALESCE(_source, '')), '[^a-z0-9_-]', '', 'g'), 40), '');
  p record;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.articles
    WHERE id = _article_id AND kind = 'live_note' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'LIVE_NOTE_NOT_FOUND';
  END IF;

  SELECT gender, age_range, occupation, province INTO p
  FROM public.profiles WHERE user_id = _uid;

  INSERT INTO public.content_views AS cv
    (article_id, user_id, view_session, source, max_progress_pct, completed,
     gender, age_range, occupation, province)
  VALUES
    (_article_id, _uid, _view_session, _src, _pct, _pct >= 90,
     p.gender, p.age_range, p.occupation, p.province)
  ON CONFLICT (view_session) DO UPDATE
    SET max_progress_pct = GREATEST(cv.max_progress_pct, EXCLUDED.max_progress_pct),
        completed        = cv.completed OR EXCLUDED.completed,
        last_seen_at     = now()
    WHERE cv.user_id = _uid AND cv.article_id = _article_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_live_note_view(uuid, uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_live_note_view(uuid, uuid, integer, text) TO authenticated;
