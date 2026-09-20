/**
 * lms-state — persists the two pieces of learner state that used to live only
 * in React memory and were therefore lost on every logout:
 *
 *   1. "I already did the pre-test for this course"
 *   2. "I already watched the clip for this lesson" (+ how many times I opened it)
 *
 * Root cause this fixes (Bible Z2.2 / Z3-8): `videoWatched` and the
 * `__pretest__` marker were plain React state. `apiSaveProgress` wrote the
 * pre-test flag to the legacy Apps Script only, and nothing wrote the watched
 * flag anywhere at all. A learner who watched a 25-minute clip, closed the
 * tab, and came back had to watch it again before the quiz button unlocked.
 *
 * Deliberately a separate table (lms_lesson_state) rather than new columns on
 * module_progress, because:
 *   - "__pretest__" is not a row in course_modules, so it has no module_id to
 *     hang off; forcing one would mean inventing fake module rows.
 *   - this state is advisory UX state, not assessment data. Keeping it out of
 *     module_progress means it can never corrupt a score or a completion record.
 *
 * Request body (JSON), all actions require student_id:
 *   { action: "get",     student_id }
 *   { action: "pretest", student_id, course_id }
 *   { action: "video",   student_id, course_id, lesson_id, watched?: bool, view?: bool }
 *
 * Response for "get":
 *   { state: { [lms_course_code]: { pretestDone: bool, videos: { [lesson_id]: { watched, views } } } } }
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveCourseSlug, SLUG_TO_LMS } from "../_shared/courseMap.ts";

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

/**
 * A learner can hold several auth identities (LINE + web email) behind one
 * student_id. State is keyed on student_id directly so it is identity-agnostic
 * — the same reason save-score fans out across linked identities.
 */
async function assertStudentExists(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_accounts")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("is_active", true)
    .limit(1);
  if (error) throw new Error("user_accounts lookup failed: " + error.message);
  return (data ?? []).length > 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = String(body.action ?? "get");
    const studentId = String(body.student_id ?? "").trim().toUpperCase();
    if (!studentId) throw new Error("student_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (!(await assertStudentExists(supabase, studentId))) {
      // Unknown key: answer empty rather than 404 so the LMS just falls back
      // to session-only behaviour instead of showing an error to the learner.
      return jsonResp({ state: {} });
    }

    // ── READ ───────────────────────────────────────────────────────────
    if (action === "get") {
      const { data: rows, error } = await supabase
        .from("lms_lesson_state")
        .select("course_slug, lesson_code, pretest_done, video_watched, video_view_count")
        .eq("student_id", studentId);
      if (error) throw new Error("lms_lesson_state read failed: " + error.message);

      const state: Record<string, { pretestDone: boolean; videos: Record<string, { watched: boolean; views: number }> }> = {};

      for (const row of (rows ?? []) as any[]) {
        const lmsCode = SLUG_TO_LMS[row.course_slug];
        if (!lmsCode) continue;
        if (!state[lmsCode]) state[lmsCode] = { pretestDone: false, videos: {} };

        if (row.lesson_code === "__pretest__") {
          if (row.pretest_done) state[lmsCode].pretestDone = true;
          continue;
        }
        state[lmsCode].videos[row.lesson_code] = {
          watched: !!row.video_watched,
          views: row.video_view_count ?? 0,
        };
      }

      return jsonResp({ state });
    }

    // ── WRITE ──────────────────────────────────────────────────────────
    const slug = resolveCourseSlug(body.course_id ?? body.course_slug);
    if (!slug) throw new Error("course_id required (LMS code or slug)");

    if (action === "pretest") {
      const { error } = await supabase
        .from("lms_lesson_state")
        .upsert(
          {
            student_id: studentId,
            course_slug: slug,
            lesson_code: "__pretest__",
            pretest_done: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id,course_slug,lesson_code" },
        );
      if (error) throw new Error("pretest upsert failed: " + error.message);
      return jsonResp({ ok: true });
    }

    if (action === "video") {
      const lessonCode = String(body.lesson_id ?? "").trim();
      if (!lessonCode) throw new Error("lesson_id required");

      // Increment the view counter atomically (two tabs open is a real case)
      // and/or latch the watched flag. `watched` is one-way: once true it
      // never goes back to false, because "already watched" is not something
      // a learner should lose by reopening the player.
      const { error } = await supabase.rpc("lms_touch_lesson_state", {
        _student_id: studentId,
        _course_slug: slug,
        _lesson_code: lessonCode,
        _watched: body.watched === true,
        _increment_view: body.view === true,
      });
      if (error) throw new Error("video state update failed: " + error.message);
      return jsonResp({ ok: true });
    }

    throw new Error("unknown action: " + action);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return jsonResp({ error: msg }, 400);
  }
});
