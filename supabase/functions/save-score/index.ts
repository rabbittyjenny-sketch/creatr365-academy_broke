import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveCourseSlug } from "../_shared/courseMap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Every auth identity linked to a Master Key. Used to fan out module_progress
 * writes so a score lands no matter which identity (LINE or email) the
 * learner happened to log in with. */
async function resolveLinkedUserIds(supabase: ReturnType<typeof createClient>, studentId: string) {
  const { data: accounts, error: acctErr } = await supabase
    .from("user_accounts")
    .select("line_user_id")
    .eq("student_id", studentId)
    .eq("is_active", true)
    .order("registered_at", { ascending: true });

  if (acctErr) throw new Error("user_accounts lookup failed: " + acctErr.message);

  const userIds = new Set<string>();
  const lineUserIds: string[] = [];

  (accounts ?? []).forEach((account: { line_user_id: string }) => {
    if (account.line_user_id.startsWith("web:")) {
      userIds.add(account.line_user_id.replace("web:", ""));
    } else {
      lineUserIds.push(account.line_user_id);
    }
  });

  if (lineUserIds.length > 0) {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id")
      .in("line_user_id", lineUserIds);
    if (profErr) throw new Error("profiles lookup failed: " + profErr.message);
    (profiles ?? []).forEach((profile: { user_id: string }) => userIds.add(profile.user_id));
  }

  return [...userIds];
}

/**
 * The single auth identity that owns diagnostic_attempts / completion_records
 * for a Master Key.
 *
 * Why this exists: module_progress is fanned out to every linked identity
 * (harmless — it's the same fact written N times), but diagnostic_attempts
 * and completion_records are NOT idempotent that way. Before this, the
 * diagnostic-recording loop ran once per linked identity, so a learner who
 * had both a LINE identity and a web identity linked to one Master Key could
 * end up with two separate diagnostic_attempts rows and two separate
 * completion_records rows (different auth.users.id, different record_code)
 * for the same course — an ambiguity the Completion Record Framework's
 * "record_id ตรวจสอบย้อนหลังได้" requirement cannot tolerate.
 *
 * "Canonical" = the identity linked first (oldest `registered_at`), so the
 * choice is stable across requests rather than depending on Set iteration
 * order, which Postgres does not guarantee without an ORDER BY.
 */
async function resolveCanonicalUserId(supabase: ReturnType<typeof createClient>, studentId: string) {
  const { data: account, error } = await supabase
    .from("user_accounts")
    .select("line_user_id")
    .eq("student_id", studentId)
    .eq("is_active", true)
    .order("registered_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("user_accounts lookup failed: " + error.message);
  if (!account) return null;

  if (account.line_user_id.startsWith("web:")) {
    return account.line_user_id.replace("web:", "");
  }
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("line_user_id", account.line_user_id)
    .maybeSingle();
  if (profErr) throw new Error("profiles lookup failed: " + profErr.message);
  return profile?.user_id ?? null;
}

/**
 * Diagnostic Quiz has no pass/fail (per the Completion Record Framework —
 * it's a skill-radar snapshot, not a gate). Recording it here — separately
 * from module_progress — is what lets a real Completion Record ever be
 * issued.
 *
 * Attempts start `accepted:false`. The Framework §4.1 requires the learner
 * to be asked "พอใจกับคะแนนนี้หรือไม่ ต้องการสอบใหม่หรือไม่" and to decide —
 * the LMS shows that prompt right after this call returns (see the LMS
 * patch), and the learner's choice reaches the server via the separate
 * "accept_diagnostic" action below, never automatically.
 *
 * Written only against the canonical identity (see resolveCanonicalUserId)
 * so a learner never ends up with two diagnostic attempts / two completion
 * records for the same course under two different linked identities.
 */
async function recordDiagnosticAttempt(
  supabase: ReturnType<typeof createClient>,
  canonicalUserId: string,
  courseId: string,
  scorePct: number,
  radarBreakdown: unknown,
): Promise<string | null> {
  const { count } = await supabase
    .from("diagnostic_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", canonicalUserId)
    .eq("course_id", courseId);

  const { data: attempt, error: attemptErr } = await supabase
    .from("diagnostic_attempts")
    .insert({
      user_id: canonicalUserId,
      course_id: courseId,
      attempt_number: (count ?? 0) + 1,
      score_pct: scorePct,
      radar_breakdown: radarBreakdown ?? null,
      accepted: false,
    })
    .select("id")
    .single();
  if (attemptErr) {
    console.error("diagnostic_attempts insert failed:", attemptErr.message);
    return null;
  }
  return attempt.id as string;
}

/**
 * Append-only log of every quiz submission (quiz_attempts). module_progress
 * keeps only the latest state per module, so without this a failed Knowledge
 * Check was overwritten by the next try and the pre-test score was never
 * stored anywhere (BIBLE A4 step 8: "บันทึกคะแนนทุกครั้ง"). Never throws —
 * an audit-log failure must not fail the learner's actual score save.
 */
async function logQuizAttempt(
  supabase: ReturnType<typeof createClient>,
  row: {
    student_id: string; user_id: string | null; course_id: string | null; module_id: string | null;
    lesson_code: string | null; quiz_type: string; qg: string | null;
    score_pct: number | null; correct: number | null; total: number | null; passed: boolean | null;
  },
) {
  const QUIZ_TYPES = ["pretest", "knowledge_check", "diagnostic", "no_quiz"];
  if (!QUIZ_TYPES.includes(row.quiz_type)) return;
  const { error } = await supabase.from("quiz_attempts").insert(row);
  if (error) console.error("quiz_attempts insert failed:", error.message);
}

const numOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { student_id, action } = body;
    if (!student_id) throw new Error("student_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const sid = String(student_id).trim().toUpperCase();

    // ── ACTION: accept_diagnostic ─────────────────────────────────────────
    // Learner pressed "ยืนยันรับผล" on the diagnostic results screen.
    // Framework §4.1 step 4: this is the ONLY place a completion record gets
    // issued from a diagnostic score — never automatically at submit time.
    if (action === "accept_diagnostic") {
      const { attempt_id } = body;
      if (!attempt_id) throw new Error("attempt_id required for accept_diagnostic");

      const canonicalUserId = await resolveCanonicalUserId(supabase, sid);
      if (!canonicalUserId) throw new Error("student_id not found: " + student_id);

      const { data: record, error } = await supabase.rpc("accept_diagnostic_attempt", {
        _user_id: canonicalUserId,
        _attempt_id: attempt_id,
      });
      if (error) {
        // Expected, non-fatal case: modules not all completed yet, or the
        // Mandatory Knowledge Gate has active topics this learner hasn't
        // passed. Tell the LMS so it can show *why*, instead of a generic error.
        return jsonResp({ ok: false, accepted: true, issued: false, reason: error.message });
      }
      return jsonResp({ ok: true, accepted: true, issued: true, record });
    }

    // ── Regular score-save path ────────────────────────────────────────────
    const { course_slug, module_code, score, passed, quiz_type, radar_breakdown, correct, total, qg } = body;
    const isPretest = quiz_type === "pretest";
    if (!module_code && !isPretest) throw new Error("module_code required");

    const authUserIds = await resolveLinkedUserIds(supabase, sid);
    if (authUserIds.length === 0) throw new Error("student_id not found: " + student_id);
    const canonicalUserId = await resolveCanonicalUserId(supabase, sid);
    const attemptBase = {
      student_id: sid,
      user_id: canonicalUserId,
      lesson_code: module_code ? String(module_code) : null,
      quiz_type: String(quiz_type || ""),
      qg: qg ? String(qg) : null,
      score_pct: numOrNull(score),
      correct: numOrNull(correct),
      total: numOrNull(total),
      passed: typeof passed === "boolean" ? passed : null,
    };

    // Z3-2 — accept either the DB slug ("signal") or the LMS course code
    // ("COURSE_1_SIGNAL"). The mapping now lives in one shared file instead of
    // being duplicated in the LMS bundle and in each edge function, where the
    // two copies could silently drift apart and drop scores on the floor.
    const slug = resolveCourseSlug(course_slug);

    // Z3-3 — a course context is now REQUIRED. The old code fell back to
    // `course_modules.code = module_code` with no course filter, so the moment
    // two courses ever shared a module code (e.g. two curricula both using
    // "M01") a learner's score could be written against the wrong course's
    // module — silently, with no error anywhere. Module codes are not unique
    // by design, so that fallback was never safe.
    if (!slug) {
      console.warn(
        `save-score rejected: no resolvable course for course_slug="${course_slug}" (module_code="${module_code}")`,
      );
      return jsonResp(
        {
          ok: false,
          error: "course_slug required",
          detail:
            "save-score no longer guesses the course from module_code alone, because module codes are not unique across courses.",
        },
        400,
      );
    }

    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (courseErr) throw new Error("courses lookup failed: " + courseErr.message);

    // The pre-test is course-level (no module, no pass/fail — BIBLE D4.1
    // "วัด Baseline"). It only needs its score kept; it must not touch
    // module_progress or lesson unlocking.
    if (isPretest) {
      await logQuizAttempt(supabase, { ...attemptBase, course_id: course?.id ?? null, module_id: null, lesson_code: null });
      return jsonResp({ ok: true, pretest_saved: true });
    }

    let mod: { id: string; course_id: string } | null = null;
    if (course?.id) {
      const { data: m, error: modErr } = await supabase
        .from("course_modules")
        .select("id, course_id")
        .eq("course_id", course.id)
        .eq("code", module_code)
        .maybeSingle();
      if (modErr) throw new Error("course_modules lookup failed: " + modErr.message);
      mod = m ?? null;
    }

    if (!mod) {
      // module ไม่เจอในคอร์สนี้ — log แต่ไม่ fail (อาจเป็นบทที่ยังไม่ได้ตั้งค่าใน DB)
      console.warn(`module_code "${module_code}" not found in course "${slug}", skipping progress update`);
      await logQuizAttempt(supabase, { ...attemptBase, course_id: course?.id ?? null, module_id: null });
      return jsonResp({ ok: true, warning: "module not found in this course, score not saved to progress" });
    }

    const completedAt = passed ? new Date().toISOString() : null;

    for (const authUserId of authUserIds) {
      const { error: upsertErr } = await supabase.from("module_progress").upsert(
        {
          user_id: authUserId,
          module_id: mod.id,
          score: typeof score === "number" ? score : null,
          status: passed ? "completed" : "in_progress",
          completed_at: completedAt,
        },
        { onConflict: "user_id,module_id" },
      );
      if (upsertErr) throw new Error("module_progress upsert failed: " + upsertErr.message);

      // ถ้าผ่าน → ปลดล็อคบทถัดไปให้ทุก identity ที่ผูกกับ Master Key
      if (passed) {
        const { error: unlockErr } = await supabase.rpc("unlock_next_module", {
          _module_id: mod.id,
          _user_id: authUserId,
        });
        if (unlockErr) console.error("unlock_next_module failed:", unlockErr.message);
      }
    }

    await logQuizAttempt(supabase, { ...attemptBase, course_id: mod.course_id, module_id: mod.id });

    // Diagnostic attempts are written ONCE, against the canonical identity
    // only — not once per linked identity (see resolveCanonicalUserId for
    // why fanning this out like module_progress would be wrong here).
    let diagnosticAttemptId: string | null = null;
    if (quiz_type === "diagnostic" && typeof score === "number") {
      if (canonicalUserId) {
        diagnosticAttemptId = await recordDiagnosticAttempt(
          supabase,
          canonicalUserId,
          mod.course_id,
          score,
          radar_breakdown,
        );
      }
    }

    return jsonResp({
      ok: true,
      linked_users_updated: authUserIds.length,
      diagnostic_attempt_id: diagnosticAttemptId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return jsonResp({ error: msg }, 400);
  }
});
