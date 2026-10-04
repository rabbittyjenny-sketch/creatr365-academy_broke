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
6. **Before building or changing a feature, trace the existing equivalent
   end-to-end ("360°") and plug into it.** Example from 2026-10-04: Toolbox
   Premium was first built with its own download path on /toolbox; the
   owner pointed out bought course files already live in Dashboard ›
   เอกสาร — bought Toolbox files now go there too. Check Dashboard, Admin
   (payments/students), consent dialogs, refund policy and copy elsewhere
   before adding a parallel piece.

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

## Live Notes / Toolbox Premium / profile — current state (2026-10-04)

Full reference: README §41. Deploy/test checklist: `CHANGELOG_2026-10-04.md`.
Status (2026-10-04, round 2): pushed, migrations applied, `toolbox-checkout`
v1 + `stripe-webhook` v7 deployed. **Edge functions in the repo can lag
production** (stripe-webhook did) — fetch the deployed source and diff before
any redeploy, or you will silently remove live behaviour.

Do not regress:
- **Live Notes ≠ courses.** `articles.kind = 'live_note'`, shown only at the
  bottom of `/courses`. No enrollment, lessons or quiz; never call them
  หลักสูตร/บทเรียน. Community clips are `kind = 'video'` ("คลิปกิจกรรม").
- Course cards / `AdminCourses.tsx` were deliberately untouched; `/courses`
  only gained pagination (6/page) and `<LiveNotesSection/>`.
- Clips play in-site (`LiveNotePlayerDialog`); never link out to YouTube.
- `content_views` is written only via `log_live_note_view()` (SECURITY
  DEFINER, no client insert/update policy). Demographics come from
  `profiles` via DB trigger/RPC — never ask for them again on another page.
- `profiles` is the single source for real names (TH/EN, for the two
  certificate versions), gender, age range, occupation, province. Name
  fields lock once a `completion_records` row exists (trigger) — admin edits.
- **Bought Toolbox Premium files live in Dashboard › เอกสาร** (same pattern
  as `course_resources`). /toolbox only sells; no re-download button there.
- The `toolbox-files` storage policy is the real lock (free: signed-in +
  published; paid: `toolbox_purchases.status = 'paid'`, survives hiding).
  Never revert it to "readable when signed in" or make the bucket public.
- Toolbox payment mirrors courses (inline THB `price_data`, `purchase_events`
  audit). The toolbox branch in `stripe-webhook` must stay before the course
  branch (keyed on `metadata.kind`).
- Post-login return goes through `src/lib/authRedirect.ts` (email, LINE LIFF,
  email-confirm link). Don't hardcode `/dashboard` after login/sign-up.
- Downloads: `createSignedUrl(path, 60, { download })` + `location.assign`;
  `window.open` after an await is blocked in the LINE in-app browser.
- **One accent per region.** `index.css` recolors every p/span/a/button on
  hover (`.site-hover-scope`) and gives every h1–h6 a hover underline; an
  undeclared block falls back to red and clashes with its own colored
  labels. Follow the sharp-card system (commit `19ac127`, Explore/Discover/
  AiLab): `className="section-accent"` + `--hover-accent`/`--section-accent`
  set to one color — also on `DialogContent` (portals sit outside the hover
  scope but h1–h6 rules still apply). Admin keeps `#D4A843` (README §30.3).
  Color = the page/menu's color, not the content type. Only exception: Live
  Notes cards rotate System B (`lib/accentPalette.ts`). Dialog titles have no
  hover (index.css). Never use `data-accent="blue|yellow|green"`.

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
