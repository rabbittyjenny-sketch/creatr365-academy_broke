/**
 * redeem-session-code — validates the 4-digit code a trainer reads aloud in
 * an onsite (STAGE/BRAND_HOST_ARCHITECT) classroom before a student can
 * start that lesson's exam.
 *
 * Root cause this fixes: this check previously went entirely to a legacy
 * Google Apps Script/Sheet outside all three repos — there was no admin UI
 * anywhere in this system to set or rotate the code, and no way to audit
 * who actually entered it. The code now lives on course_modules
 * (onsite_unlock_code, editable from AdminCourses.tsx's module editor), and
 * every successful redemption is logged to onsite_code_redemptions.
 *
 * Request body (JSON): { student_id, course_slug, module_code, code }
 * Response: { success: boolean }
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
    const { student_id, course_slug, module_code, code } = await req.json();
    if (!student_id || !course_slug || !module_code || !code) {
      throw new Error("student_id, course_slug, module_code and code required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sid = student_id.trim().toUpperCase();
    const authUserIds = await resolveLinkedUserIds(supabase, sid);
    if (authUserIds.length === 0) return jsonResp({ success: false });

    const { data: course } = await supabase.from("courses").select("id").eq("slug", course_slug).maybeSingle();
    if (!course?.id) return jsonResp({ success: false });

    const { data: mod } = await supabase
      .from("course_modules")
      .select("id, onsite_unlock_code")
      .eq("course_id", course.id)
      .eq("code", module_code)
      .maybeSingle();
    if (!mod?.onsite_unlock_code) return jsonResp({ success: false });

    if (String(code).trim() !== mod.onsite_unlock_code.trim()) {
      return jsonResp({ success: false });
    }

    const { error: logErr } = await supabase.from("onsite_code_redemptions").insert(
      authUserIds.map((userId) => ({ user_id: userId, module_id: mod.id }))
    );
    if (logErr) console.error("onsite_code_redemptions insert failed:", logErr.message);

    return jsonResp({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return jsonResp({ error: msg }, 400);
  }
});
