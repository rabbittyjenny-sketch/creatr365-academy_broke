-- ─────────────────────────────────────────────────────────────────────────
-- Podcast (audio version) for articles + listening statistics
--
-- An article may carry one MP3 (articles.audio_url, uploaded by an admin to
-- the existing public `course-media` bucket under podcasts/ — same bucket and
-- admin-write policy as article covers, so no new bucket or storage policy).
-- /articles/:slug shows a single "ฟังเป็น Podcast" button only when
-- audio_url is set; it opens the floating cassette player (not a modal).
--
-- Articles are readable without login, so listening is logged for visitors
-- too. podcast_plays is written only through log_podcast_play() (SECURITY
-- DEFINER) so the browser can never set demographics or touch other rows,
-- and read only by admins — the same shape as content_views (Live Notes),
-- which is deliberately left untouched (it requires login, user_id NOT NULL).
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS audio_url          text,
  ADD COLUMN IF NOT EXISTS audio_title        text,   -- shown on the cassette label; empty = use the article title (never the file name)
  ADD COLUMN IF NOT EXISTS audio_image_url    text,   -- small sticker picture on the cassette label
  ADD COLUMN IF NOT EXISTS audio_duration_sec integer
    CHECK (audio_duration_sec IS NULL OR audio_duration_sec > 0);

COMMENT ON COLUMN public.articles.audio_url IS 'MP3/M4A public URL (course-media/podcasts/…) — enables the "ฟังเป็น Podcast" button on /articles/:slug';
COMMENT ON COLUMN public.articles.audio_duration_sec IS 'Read from the file by the browser at upload; display only';

CREATE TABLE IF NOT EXISTS public.podcast_plays (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id       uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  play_session     uuid NOT NULL UNIQUE,            -- one per player open, generated in the browser
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL = not logged in
  max_progress_pct smallint NOT NULL DEFAULT 0 CHECK (max_progress_pct BETWEEN 0 AND 100),
  listened_seconds integer  NOT NULL DEFAULT 0 CHECK (listened_seconds >= 0),
  completed        boolean  NOT NULL DEFAULT false, -- reached 90%
  started_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  -- snapshot from profiles at first play (logged-in listeners only)
  gender           text,
  age_range        text,
  occupation       text,
  province         text
);

CREATE INDEX IF NOT EXISTS podcast_plays_article_idx ON public.podcast_plays (article_id, started_at DESC);

ALTER TABLE public.podcast_plays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read podcast plays" ON public.podcast_plays;
CREATE POLICY "Admins read podcast plays" ON public.podcast_plays
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- No INSERT/UPDATE/DELETE policies on purpose: writes go through the RPC below.

CREATE OR REPLACE FUNCTION public.log_podcast_play(
  _article_id       uuid,
  _play_session     uuid,
  _progress_pct     integer DEFAULT 0,
  _listened_seconds integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid  uuid := auth.uid();
  _pct  smallint := LEAST(100, GREATEST(0, COALESCE(_progress_pct, 0)));
  _secs integer  := LEAST(86400, GREATEST(0, COALESCE(_listened_seconds, 0)));
  _gender text; _age text; _occ text; _prov text;  -- stay NULL for visitors
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.articles
    WHERE id = _article_id AND is_active = true AND audio_url IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'PODCAST_NOT_FOUND';
  END IF;

  IF _uid IS NOT NULL THEN
    SELECT gender, age_range, occupation, province INTO _gender, _age, _occ, _prov
    FROM public.profiles WHERE user_id = _uid;
  END IF;

  INSERT INTO public.podcast_plays AS pp
    (article_id, play_session, user_id, max_progress_pct, listened_seconds, completed,
     gender, age_range, occupation, province)
  VALUES
    (_article_id, _play_session, _uid, _pct, _secs, _pct >= 90,
     _gender, _age, _occ, _prov)
  ON CONFLICT (play_session) DO UPDATE
    SET max_progress_pct = GREATEST(pp.max_progress_pct, EXCLUDED.max_progress_pct),
        listened_seconds = GREATEST(pp.listened_seconds, EXCLUDED.listened_seconds),
        completed        = pp.completed OR EXCLUDED.completed,
        last_seen_at     = now()
    WHERE pp.article_id = _article_id AND pp.user_id IS NOT DISTINCT FROM _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.log_podcast_play(uuid, uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_podcast_play(uuid, uuid, integer, integer) TO anon, authenticated;
