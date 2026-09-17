/**
 * create-lms-handoff — issues a short-lived, single-use token so
 * Dashboard.tsx can send a student into the separate LMS app
 * (6course-quiz.vercel.app) without ever putting their Master Key in a URL.
 *
 * Replaces the old `?kid=<masterKey>&course=<slug>` link, which let anyone
 * who saw that URL (history, shared screen, copied message) log in as that
 * student with zero further proof — the LMS's auto-login treated "URL has a
 * valid Master Key string" as identity.
 *
 * Caller must be an authenticated Supabase session (verify_jwt = true,
 * platform-enforced — see supabase/config.toml). The Master Key is resolved
 * server-side from that session's own profile/user_accounts row, exactly
 * the same lookup Dashboard.tsx already does client-side to show the key —
 * never accepted from the request body, so a caller cannot mint a token for
 * someone else's account.
 *
 * Token: 32 random bytes, hex-encoded, single-use (redeem-lms-handoff marks
 * it used atomically), expires in 60s — matching the TTL this codebase
 * already uses for Storage signed URLs (createSignedUrl(path, 60)).
 *
 * Request body (JSON):  { course_slug?: string }
 * Response:             { token: string }
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

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { course_slug } = await req.json().catch(() => ({}));

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Same resolution order Dashboard.tsx uses to display the Master Key:
    // profiles.line_user_id -> user_accounts, falling back to email.
    let studentId: string | null = null;

    const { data: profile } = await admin
      .from("profiles")
      .select("line_user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.line_user_id) {
      const { data: acct } = await admin
        .from("user_accounts")
        .select("student_id")
        .eq("line_user_id", profile.line_user_id)
        .maybeSingle();
      studentId = acct?.student_id ?? null;
    }

    if (!studentId && user.email) {
      const { data: acct } = await admin
        .from("user_accounts")
        .select("student_id")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
      studentId = acct?.student_id ?? null;
    }

    if (!studentId) throw new Error("No Master Key linked to this account");

    const handoffToken = randomToken();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    const { error: insertErr } = await admin.from("lms_handoff_tokens").insert({
      token: handoffToken,
      user_id: user.id,
      student_id: studentId,
      course_slug: typeof course_slug === "string" ? course_slug : null,
      expires_at: expiresAt,
    });
    if (insertErr) throw new Error("Failed to create handoff token: " + insertErr.message);

    return jsonResp({ token: handoffToken });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return jsonResp({ error: msg }, 400);
  }
});
