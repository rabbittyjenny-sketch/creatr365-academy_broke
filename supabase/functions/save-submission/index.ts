/**
 * save-submission — records a student's assignment submission (a URL to
 * their work, e.g. a Hook script/video link) into the same `assignments`
 * table AdminAssignments.tsx already reads from.
 *
 * Root cause this fixes: the LMS's "ส่งงาน" (submit) button on FOUNDATION/
 * SIGNAL/STAGE only ever posted to the legacy Google Apps Script backend
 * (a separate spreadsheet), which the admin panel's "รายการงานส่ง" page has
 * never read from — so every real submission was invisible to review there.
 * This does not remove the Apps Script call (kept as-is, no behavior change
 * for the student-facing "ส่งแล้ว" confirmation); it adds the missing write
 * to the system admins actually check.
 *
 * These submissions are course-level (not tied to a specific lesson) in the
 * live LMS config today, so module_id is always null here — matching how
 * AdminAssignments.tsx already treats a null module_id (approval just
 * records status/score, no unlock_next_module call).
 *
 * Request body (JSON): { student_id, course_slug, rubric_id, sub_type, url }
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { student_id, course_slug, rubric_id, sub_type, url } = await req.json();
    if (!student_id || !course_slug || !url) {
      throw new Error("student_id, course_slug and url required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sid = student_id.trim().toUpperCase();
    const authUserIds = await resolveLinkedUserIds(supabase, sid);
    if (authUserIds.length === 0) throw new Error("student_id not found: " + student_id);

    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", course_slug)
      .maybeSingle();
    if (courseErr) throw new Error("courses lookup failed: " + courseErr.message);
    if (!course?.id) throw new Error("course not found: " + course_slug);

    const note = [rubric_id ? `Rubric: ${rubric_id}` : null, sub_type ? `Type: ${sub_type}` : null]
      .filter(Boolean)
      .join(" · ") || null;

    const rows = authUserIds.map((userId) => ({
      user_id: userId,
      course_id: course.id,
      module_id: null,
      status: "pending",
      video_url: url,
      note,
    }));

    const { error: insertErr } = await supabase.from("assignments").insert(rows);
    if (insertErr) throw new Error("assignments insert failed: " + insertErr.message);

    return new Response(JSON.stringify({ ok: true, linked_users_recorded: authUserIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
