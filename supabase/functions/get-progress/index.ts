/**
 * get-progress — returns a student's real module completion status, so the
 * LMS can rebuild its lesson-lock state on login instead of starting blank.
 *
 * Root cause this fixes: the LMS's lessonStatus/lessonScores are plain
 * React state with nothing that ever reads module_progress back on mount —
 * every login (even the same student, same course, minutes later) started
 * every lesson "locked" again from lesson 1, even though save-score had
 * already correctly written real "completed" rows to module_progress.
 * Verified against production: module_progress accumulates correctly
 * server-side, but nothing ever read it back into the LMS UI.
 *
 * Request body (JSON):  { student_id: string }
 * Response: {
 *   progress: { [course_slug]: { [module_code]: { status, score } } },
 *   pending_diagnostics: { [course_slug]: { attempt_id, attempt_number, score_pct, radar_breakdown, created_at } },
 * }
 *
 * pending_diagnostics — the latest diagnostic attempt per course when the
 * learner has not yet pressed "ยืนยันรับผล" or "ทำแบบประเมินใหม่" on it
 * (Completion Record Framework §4.1). The LMS reopens that review screen on
 * the next visit instead of losing the decision to a closed tab: the
 * attempt row itself is the saved state, so this works across devices too.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

async function resolveLinkedUserIds(supabase: ReturnType<typeof createClient>, studentId: string) {
  const { data: accounts, error: acctErr } = await supabase
    .from("user_accounts")
    .select("line_user_id")
    .eq("student_id", studentId)
    .eq("is_active", true);

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { student_id } = await req.json();
    if (!student_id) throw new Error("student_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const sid = student_id.trim().toUpperCase();
    const authUserIds = await resolveLinkedUserIds(supabase, sid);
    if (authUserIds.length === 0) {
      return jsonResp({ progress: {}, pending_diagnostics: {} });
    }

    const { data: rows, error } = await supabase
      .from("module_progress")
      .select("status, score, module_id, course_modules(code, courses(slug))")
      .in("user_id", authUserIds)
      .in("status", ["completed", "in_progress"]);

    if (error) throw new Error("module_progress lookup failed: " + error.message);

    const progress: Record<string, Record<string, { status: string; score: number | null }>> = {};

    for (const row of (rows ?? []) as any[]) {
      const slug = row.course_modules?.courses?.slug;
      const code = row.course_modules?.code;
      if (!slug || !code) continue;
      if (!progress[slug]) progress[slug] = {};
      // Prefer "completed" over "in_progress" if somehow both linked
      // identities have a row for the same module (shouldn't normally
      // happen, but "completed" is always the more correct answer).
      const existing = progress[slug][code];
      if (!existing || (existing.status !== "completed" && row.status === "completed")) {
        progress[slug][code] = { status: row.status, score: row.score ?? null };
      }
    }

    const { data: attempts, error: diagErr } = await supabase
      .from("diagnostic_attempts")
      .select("id, attempt_number, score_pct, accepted, radar_breakdown, created_at, courses(slug)")
      .in("user_id", authUserIds);
    // Never let this extra lookup take lesson progress down with it.
    if (diagErr) console.error("diagnostic_attempts lookup failed:", diagErr.message);

    const latestBySlug: Record<string, any> = {};
    for (const a of (attempts ?? []) as any[]) {
      const slug = a.courses?.slug;
      if (!slug) continue;
      const cur = latestBySlug[slug];
      if (!cur || a.attempt_number > cur.attempt_number
          || (a.attempt_number === cur.attempt_number && a.created_at > cur.created_at)) {
        latestBySlug[slug] = a;
      }
    }
    const pending_diagnostics: Record<string, unknown> = {};
    for (const [slug, a] of Object.entries(latestBySlug)) {
      if (a.accepted) continue;
      pending_diagnostics[slug] = {
        attempt_id: a.id,
        attempt_number: a.attempt_number,
        score_pct: a.score_pct,
        radar_breakdown: a.radar_breakdown ?? null,
        created_at: a.created_at,
      };
    }

    return jsonResp({ progress, pending_diagnostics });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return jsonResp({ error: msg }, 400);
  }
});
