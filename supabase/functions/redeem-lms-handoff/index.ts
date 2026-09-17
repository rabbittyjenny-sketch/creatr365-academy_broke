/**
 * redeem-lms-handoff — called by the LMS app (6course-quiz, a separate
 * origin with no Supabase Auth session of its own) to exchange a
 * short-lived handoff token (from create-lms-handoff) for the student_id
 * it was issued for.
 *
 * Public/anonymous like get-enrollment and save-score (verify_jwt = false
 * in supabase/config.toml, same as those two) — the token itself, not a
 * Supabase session, is the credential here. It is:
 *   - single-use: the UPDATE below only succeeds if used_at is still null,
 *     so a token cannot be redeemed twice even under a race
 *   - short-lived: rejected once expires_at has passed (60s from issuance)
 * A token that fails either check reveals nothing beyond "invalid" — never
 * which check failed, so an attacker got nothing from a leaked/expired
 * token except a login screen.
 *
 * Request body (JSON):  { token: string }
 * Response:             { student_id: string, course_slug: string | null }
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") throw new Error("invalid token");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: row } = await admin
      .from("lms_handoff_tokens")
      .select("student_id, course_slug, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();

    if (!row) throw new Error("invalid token");
    if (row.used_at) throw new Error("invalid token");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("invalid token");

    // Atomic single-use claim: only succeeds if still unused at this instant.
    const { data: claimed, error: claimErr } = await admin
      .from("lms_handoff_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token)
      .is("used_at", null)
      .select("student_id, course_slug")
      .maybeSingle();

    if (claimErr || !claimed) throw new Error("invalid token");

    return jsonResp({ student_id: claimed.student_id, course_slug: claimed.course_slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return jsonResp({ error: msg }, 400);
  }
});
