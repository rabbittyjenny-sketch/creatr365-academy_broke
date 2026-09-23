# Creatr365 Academy — working notes for Claude

Read this before touching anything related to scoring, evaluation, QG codes,
the diagnostic system, or the Completion Record / Mandatory Knowledge Gate.
It exists because a single session spent an entire day re-deriving this from
scratch, made a real mistake from it (see the QG-08/09/10 case study below),
and the person running that session asked for it to never happen again.

## Process rules (non-negotiable)

1. **Never edit a file (Edit/Write) without an explicit instruction to do so
   in THIS turn.** Explaining why something is wrong and fixing it are two
   separate steps — always stop after the explanation and wait, no matter
   how confident the diagnosis is. This applies even when the user's
   previous message asked you to "investigate" or "find out why" — that is
   not authorization to also fix it.
2. **Check a document's actual file-modification timestamp before treating
   it as current** (`ls -la`, not the filename). Newer documents supersede
   older ones; do not average or reconcile an old doc against a new one —
   the new one wins.
3. **Check whether a referenced PR was actually merged** before treating its
   proposal as accepted design. A closed-but-unmerged PR is a rejected
   draft, not truth.
4. **Never commit or push without an explicit instruction** for that
   specific push, even if a change was already discussed.
5. Don't create a new file to hold information that already has a home
   (e.g. a second QG→PPACT mapping file when `RADAR_DIMS` /
   `src/lib/ppact.ts` already are that mapping) — duplicated sources of
   truth are what caused most of the confusion documented below.

## The 3 repos, how they relate

| Repo | What it is | Talks to Supabase? |
|---|---|---|
| `creatr365-academy_broke` (this repo) | Main website: course pages, enrollment, Dashboard, Admin, all Supabase edge functions + migrations | Yes — this is where the DB schema lives |
| `6course-quiz` | The actual LMS students log into — lesson video, Pre-test, Knowledge Check, Diagnostic Quiz | Yes, via edge functions in this repo (`save-score`, `get-enrollment`, etc.) — no direct table writes except reading `quiz_bank` |
| `diagnostic-test-creatr365` | Standalone pre-enrollment lead-magnet quiz (~30 questions, marketing) | **No — zero Supabase code.** Fully separate, client-only app |

## ⚠️ Two "diagnostic" things that are NOT the same system

This naming collision caused a full day of confusion in one session. Do not
conflate these:

| | `diagnostic_quiz_results` | `diagnostic_attempts` |
|---|---|---|
| What | Pre-enrollment marketing survey + external quiz result | In-course, end-of-course skill snapshot |
| When | Before a learner buys anything | Last lesson of a purchased course |
| Fed by | `DiagnosticQuiz.tsx` (this repo) → redirects to `diagnostic-test-creatr365`; also LINE OA via `make-webhook` edge function | `6course-quiz`'s `getDiagnosticQuiz()` → `save-score` edge function |
| Feeds into | Nothing — pure marketing/lead data | `completion_records`, via `accept_diagnostic_attempt()` |

"Diagnostic Quiz" in code/UI always means the **in-course, end-of-course**
one (`diagnostic_attempts`), unless a file path clearly says otherwise.

## Course completion logic — the real 5 independent layers

None of these average into each other. Verified by reading the actual SQL
functions, not just docs (`accept_diagnostic_attempt`,
`issue_completion_record`, `has_passed_mandatory_gate` — live in Supabase,
not all tracked in a migration file, check the DB directly with
`information_schema.routines` / `pg_get_functiondef` if unsure).

| Layer | Where | Gate? | Threshold |
|---|---|---|---|
| Knowledge Check | per lesson (except last), `6course-quiz` | Blocks next lesson | 70% |
| Rubric (`src/lib/rubrics.ts`) | practical submissions / onsite scoring | Separate pass, never averaged with quiz score (Dual-Gate / Conjunctive per BIBLE D9.5, ISO/IEC 17024 pattern) | varies per RUB-xx |
| Diagnostic Quiz | last lesson, `6course-quiz` | **Never blocks anything** — informational Radar/Host Level snapshot only | none |
| Mandatory Knowledge Gate | `mandatory_topics`/`mandatory_topic_attempts`, **account-level, not per-course** | Blocks `completion_records` issuance | binary, 90% per topic, currently 0 active topics (intentionally inert — ships empty until legal/ethics content is reviewed) |
| Upsell Guard | computed from quiz scores | Blocks nothing, just recommends a course | 80% |

**`issue_completion_record()` / `accept_diagnostic_attempt()` never read
`diagnostic_attempts.score_pct` to decide anything.** They only check: (a)
every module in `module_progress` is `completed`, and (b)
`has_passed_mandatory_gate()`. The diagnostic score is just carried along on
the record for display — it is not a criterion.

## QG taxonomy — current state and a cautionary case study

Canonical QG list lives in **`6course-quiz/src/Creatr365_LMS_v2.jsx`**
(`RADAR_DIMS`) — keep `src/lib/ppact.ts` (`PPACT[].qgs`) in sync with it,
always.

**Current state (2026-09-23): QG-01 through QG-10.** The owner confirmed
the QG-08/09/10 split as the final spec in the 35-lesson table. QG-08 is
F02/S01/S06/BH4, QG-09 is F03/BH1 (includes 5 Hidden Souls), and QG-10 is
MG03. All three roll up into PPACT Trust. The split is merged on main in
both repos. `quiz_groups` and `quiz_bank` hold the questions: imported
2026-09-23, with 3 rows `is_active=false` pending content review. The case
study below describes an *earlier* revert and is kept only as a
process lesson. Its conclusion about the split is superseded.

Ethics/legal questions in QG-08 are Knowledge Check content for those
lessons. They do **not** replace the Mandatory Knowledge Gate
(`mandatory_topics`), which is still a separate, account-level,
completion-blocking system.

**Case study — the process lesson still applies:** a session found an abandoned,
closed-without-merge PR (`6course-quiz` #14) proposing QG-08 (Ethics/Legal),
QG-09/10 (two Host Identity splits), based on a Sept-3 content audit. It
implemented that split, only to later find the BIBLE's own course-lesson
table documents all 7 affected lessons as QG-06 — the split was never
accepted into canonical docs — **and** that real ethics/legal content
belongs in the Mandatory Knowledge Gate (a completely separate, account-
level system), not as a new QG feeding the Diagnostic Quiz radar. The
change was reverted. Lesson: an abandoned PR's proposal is not truth; check
the current BIBLE's actual lesson table before retagging any QG.

## Audit logs + deploy state (2026-09-23)

- `quiz_attempts` is an append-only row for **every** quiz submission
  (pretest, knowledge_check, diagnostic, no_quiz). It is written only by
  `save-score`. `module_progress` still holds just the latest state per
  lesson, and that is what unlocking and completion read.
- `purchase_events` is an append-only log of every checkout step. It is
  written only by `create-checkout` / `verify-payment` / `stripe-webhook`.
  `create-checkout` no longer deletes stale `pending` enrollments; it
  marks them `abandoned`. `course_enrollments.status` can therefore be
  `pending | paid | free | active | abandoned`.
- A diagnostic attempt with `accepted=false` that is the latest for its
  course counts as "unanswered". `get-progress` returns it as
  `pending_diagnostics`, and the LMS reopens the accept/retake prompt until
  the learner chooses. Never auto-accept.
- `my_linked_user_ids()` plus SELECT policies let a signed-in learner read
  rows from every auth identity under the same Master Key. The Dashboard
  queries with `.in('user_id', ids)`.
- As of 2026-09-23 the deployed edge functions match this repo for
  save-score, get-progress, lms-state (first deploy, `verify_jwt=false`),
  create-checkout, verify-payment and stripe-webhook. Before that,
  production still ran the pre-2026-09-20 `save-score`, which auto-accepted
  diagnostics. Check `list_edge_functions` rather than assuming the repo is
  what's live.

## Document authority — check timestamps, this changes

As of 2026-09-21, in descending order of trust for anything about current
system state:
1. `47ffe6a6-fixed_version-CREATR365-BIBLE.md` (check its own timestamp —
   it's explicitly the most current synthesis, sourced from real code +
   migrations + the Completion Record Framework)
2. The Completion Record Framework doc it's sourced from
3. Actual code / live Supabase schema (always the tiebreaker over any doc)

Do **not** use as current-state evidence: `888QuizEngine_PRD.docx.md`
(describes the old 6-course scheme — MICRO EXPRESS/SIGNAL/MATRIX/STAGE/
BLUEPRINT/FRONTIER — superseded), `Creatr365_Curriculum_v2_Updated.docx.md`
(same era), or any closed-unmerged PR's diff/description.
