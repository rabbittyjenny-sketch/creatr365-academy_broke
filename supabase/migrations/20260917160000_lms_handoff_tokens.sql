-- Fixes the known P2-05 security hole: Dashboard.tsx used to hand the LMS
-- (a separate app on a separate origin) a link like
-- `?kid=STU-001&course=signal` — the bare Master Key in plain text in the
-- URL. Anyone who saw/guessed/intercepted that link (browser history,
-- shared screen, copy-pasted message, server logs) could open it and be
-- logged in as that student with zero further verification, because the
-- LMS's auto-login treated "the URL contains a valid Master Key string" as
-- proof of identity.
--
-- Fix follows the same short-lived-token pattern already used elsewhere in
-- this app for exactly this kind of "hand off access without exposing the
-- real credential" problem (Supabase Storage signed URLs,
-- `createSignedUrl(path, 60)`, used by Dashboard/Toolbox downloads): a
-- random opaque token, single-use, expires in 60 seconds, resolved
-- server-side by the `create-lms-handoff` edge function from the caller's
-- own authenticated Supabase session — never from a client-supplied
-- student_id. `redeem-lms-handoff` is the only thing that can read
-- student_id back out of a token, and only once.

CREATE TABLE IF NOT EXISTS public.lms_handoff_tokens (
  token       text        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id  text        NOT NULL,
  course_slug text,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lms_handoff_tokens_expires ON public.lms_handoff_tokens (expires_at);

ALTER TABLE public.lms_handoff_tokens ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated on purpose — only the two edge
-- functions touch this table, using the service role key, which bypasses
-- RLS. A student has no legitimate reason to read or write this table
-- directly (the token itself is the only thing that should ever leave the
-- server, via the create-lms-handoff response).
