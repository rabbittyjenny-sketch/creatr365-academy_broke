-- Rubric-based assessment (Templates B/C/D, skill_AI.md): admins currently
-- grade every submission with one blind 0-100 number, with no visibility
-- into the actual rubric criteria the student is supposed to be judged
-- against. The rubric ID was only ever recorded as free text inside `note`
-- (e.g. "Rubric: RUB-01 · Type: submission"), not queryable.
--
-- Adds a structured `rubric_id` column (so AdminAssignments.tsx can look up
-- the real criteria from rubric_master and show them) and `dimension_scores`
-- to keep the admin's per-dimension scores, not just the rolled-up total in
-- the existing `score` column (which stays as the source of truth for
-- pass/fail and unlock_next_module — unchanged).
alter table public.assignments
  add column if not exists rubric_id text,
  add column if not exists dimension_scores jsonb;

comment on column public.assignments.rubric_id is
  'Rubric code from rubric_master (e.g. RUB-01). Populated by save-submission; null for submissions with no rubric.';
comment on column public.assignments.dimension_scores is
  'Per-dimension scores the reviewer gave, e.g. {"Hook (Grabber)": 3, "Value Preview": 4}. The rolled-up total still lives in `score`.';
