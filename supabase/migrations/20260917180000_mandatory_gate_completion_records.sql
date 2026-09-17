-- Completion Record engine (Phase 1) — adapted from the earlier
-- "Completion Record Framework" planning doc into the current live schema.
-- Two ideas from that doc drive this migration:
--
-- 1. Two-tier honesty: a "Completion Record" is NOT a professional
--    certification — it just states "finished the course + passed the
--    mandatory compliance/ethics content". A real paid, third-party-open
--    Certification exam is an explicit future phase (not built here). This
--    keeps us from overclaiming what an internal completion record means,
--    the same distinction Coursera draws between a plain "Course
--    Certificate" and a proctored "Professional Certificate".
--
-- 2. The Mandatory Knowledge Gate's topic list must never be hardcoded.
--    mandatory_topics is a live, admin-editable table; the pass check reads
--    "however many rows are is_active right now", so adding/removing a
--    compliance topic later needs zero code changes or redeploys.
--
-- IMPORTANT — ships inert on purpose: no mandatory_topics rows are seeded
-- active. With zero active topics, has_passed_mandatory_gate() is
-- vacuously true for everyone, so this migration cannot block a single
-- existing student. The gate only starts doing anything once someone adds
-- real, reviewed compliance content (e.g. PDPA, อย. advertising rules) and
-- flips is_active — deliberately NOT invented here, since compliance/legal
-- question content needs subject-matter review before it can gate a real
-- credential.

-- 1) mandatory_topics — the admin-editable "Slots" from the framework doc.
-- Account-level, not per-course: compliance/ethics content (PDPA, product
-- advertising rules, professional ethics) doesn't change per course tier,
-- so a student clears it once rather than re-proving it for every course.
CREATE TABLE IF NOT EXISTS public.mandatory_topics (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_code         text        NOT NULL UNIQUE,
  title             text        NOT NULL,
  reference_source  text        NOT NULL,
  is_active         boolean     NOT NULL DEFAULT false,
  min_pass_pct      numeric     NOT NULL DEFAULT 90,
  sort_order        int         NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandatory_topics_active ON public.mandatory_topics (is_active);

ALTER TABLE public.mandatory_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active mandatory topics are public" ON public.mandatory_topics;
CREATE POLICY "Active mandatory topics are public" ON public.mandatory_topics
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage mandatory topics" ON public.mandatory_topics;
CREATE POLICY "Admins manage mandatory topics" ON public.mandatory_topics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_mandatory_topics_updated ON public.mandatory_topics;
CREATE TRIGGER trg_mandatory_topics_updated BEFORE UPDATE ON public.mandatory_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) mandatory_topic_attempts — binary pass/fail per topic (criterion-
-- referenced, not averaged — the doc is explicit that compliance content
-- has no "half understood" that's acceptable). Written server-side only
-- (SECURITY DEFINER function below), never directly by the client, so a
-- student can't insert their own "passed" row.
CREATE TABLE IF NOT EXISTS public.mandatory_topic_attempts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id        uuid        NOT NULL REFERENCES public.mandatory_topics(id) ON DELETE CASCADE,
  attempt_number  int         NOT NULL,
  score_pct       numeric     NOT NULL,
  passed          boolean     NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandatory_attempts_user_topic ON public.mandatory_topic_attempts (user_id, topic_id);

ALTER TABLE public.mandatory_topic_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own mandatory attempts" ON public.mandatory_topic_attempts;
CREATE POLICY "Users view own mandatory attempts" ON public.mandatory_topic_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all mandatory attempts" ON public.mandatory_topic_attempts;
CREATE POLICY "Admins view all mandatory attempts" ON public.mandatory_topic_attempts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 3) diagnostic_attempts — every Diagnostic Quiz (the end-of-course skill
-- assessment already in the LMS) submission, per course, supporting
-- retakes. `accepted` mirrors what the current LMS UI actually does today:
-- the diagnostic has no pass/fail threshold and no retake button, so the
-- single attempt a student makes is what "counts" — accepted defaults to
-- true. A real accept-or-retake confirmation step (per the framework doc's
-- §4.1) is a follow-up LMS UI change, not invented here without that UI.
CREATE TABLE IF NOT EXISTS public.diagnostic_attempts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id        uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  attempt_number   int         NOT NULL,
  score_pct        numeric     NOT NULL,
  radar_breakdown  jsonb,
  accepted         boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_attempts_user_course ON public.diagnostic_attempts (user_id, course_id);

ALTER TABLE public.diagnostic_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own diagnostic attempts" ON public.diagnostic_attempts;
CREATE POLICY "Users view own diagnostic attempts" ON public.diagnostic_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all diagnostic attempts" ON public.diagnostic_attempts;
CREATE POLICY "Admins view all diagnostic attempts" ON public.diagnostic_attempts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 4) completion_records — the actual issued record. record_code is a
-- short human-shareable code (not the uuid) for a future "verify this
-- record" lookup page for third parties (brand partners), per the doc's
-- §5.2 note that this needs to be checkable later without a rebuild.
CREATE TABLE IF NOT EXISTS public.completion_records (
  id                            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id                     uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  all_mandatory_passed          boolean     NOT NULL,
  accepted_diagnostic_attempt_id uuid       REFERENCES public.diagnostic_attempts(id),
  record_code                   text        NOT NULL UNIQUE,
  issued_at                     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.completion_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own completion records" ON public.completion_records;
CREATE POLICY "Users view own completion records" ON public.completion_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all completion records" ON public.completion_records;
CREATE POLICY "Admins view all completion records" ON public.completion_records
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 5) has_passed_mandatory_gate(_user_id) — reads is_active rows live, per
-- the doc's explicit instruction not to hardcode a topic count anywhere.
CREATE OR REPLACE FUNCTION public.has_passed_mandatory_gate(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_missing int;
BEGIN
  SELECT count(*) INTO v_missing
  FROM public.mandatory_topics mt
  WHERE mt.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.mandatory_topic_attempts a
      WHERE a.user_id = _user_id AND a.topic_id = mt.id AND a.passed = true
    );
  RETURN v_missing = 0;
END;
$$;

-- 6) issue_completion_record — the one place that decides whether a record
-- can be issued, kept as a standalone SECURITY DEFINER function (not
-- inlined in a client query) specifically so Phase 2 Certification can call
-- the same gate-check logic later without duplicating it, per the doc's
-- §5.2/§6.2 "engine separate from UI, reusable later" requirement.
-- Idempotent: calling it again for an already-issued course just returns
-- the existing row (UNIQUE(user_id, course_id) below backs this).
CREATE OR REPLACE FUNCTION public.issue_completion_record(_user_id uuid, _course_id uuid, _diagnostic_attempt_id uuid)
RETURNS public.completion_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing     public.completion_records;
  v_total_mods   int;
  v_done_mods    int;
  v_gate_passed  boolean;
  v_record       public.completion_records;
  v_code         text;
BEGIN
  SELECT * INTO v_existing FROM public.completion_records
  WHERE user_id = _user_id AND course_id = _course_id;
  IF FOUND THEN
    RETURN v_existing;
  END IF;

  SELECT count(*) INTO v_total_mods FROM public.course_modules WHERE course_id = _course_id;

  SELECT count(*) INTO v_done_mods
  FROM public.course_modules cm
  JOIN public.module_progress mp ON mp.module_id = cm.id AND mp.user_id = _user_id AND mp.status = 'completed'
  WHERE cm.course_id = _course_id;

  IF v_total_mods = 0 OR v_done_mods < v_total_mods THEN
    RAISE EXCEPTION 'course modules not all completed (% of %)', v_done_mods, v_total_mods;
  END IF;

  v_gate_passed := public.has_passed_mandatory_gate(_user_id);
  IF NOT v_gate_passed THEN
    RAISE EXCEPTION 'mandatory knowledge gate not passed';
  END IF;

  IF _diagnostic_attempt_id IS NOT NULL THEN
    PERFORM 1 FROM public.diagnostic_attempts
    WHERE id = _diagnostic_attempt_id AND user_id = _user_id AND course_id = _course_id AND accepted = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'diagnostic attempt does not belong to this user/course or is not accepted';
    END IF;
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO public.completion_records (user_id, course_id, all_mandatory_passed, accepted_diagnostic_attempt_id, record_code)
  VALUES (_user_id, _course_id, v_gate_passed, _diagnostic_attempt_id, v_code)
  RETURNING * INTO v_record;

  RETURN v_record;
END;
$$;
