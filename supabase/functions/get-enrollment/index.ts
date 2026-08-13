import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// slug -> LMS course ID mapping (matches the updated 5-course LMS catalog)
const SLUG_TO_LMS: Record<string, string> = {
  "magnet": "FR_MAGNET",
  "foundation": "COURSE_0_FOUNDATION",
  "signal": "COURSE_1_SIGNAL",
  "stage": "COURSE_2_STAGE",
  "brand-host-architect": "COURSE_3_BRAND_HOST",
};

// Free / lead-magnet course always visible to every registered student.
const FREE_COURSE_SLUG = "magnet";

async function resolveLinkedUsers(supabase: ReturnType<typeof createClient>, studentId: string) {
  const { data: accounts, error: accountErr } = await supabase
    .from("user_accounts")
    .select("line_user_id")
    .eq("student_id", studentId)
    .eq("is_active", true);

  if (accountErr) throw new Error("user_accounts lookup failed: " + accountErr.message);

  const userIds = new Set<string>();
  const lineUserIds: string[] = [];

  (accounts ?? []).forEach((account: { line_user_id: string }) => {
    if (account.line_user_id.startsWith("web:")) {
      userIds.add(account.line_user_id.replace("web:", ""));
    } else {
      lineUserIds.push(account.line_user_id);
    }
  });

  let displayName: string | null = null;

  if (lineUserIds.length > 0) {
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("user_id, display_name, line_user_id")
      .in("line_user_id", lineUserIds);

    if (profileErr) throw new Error("profiles lookup failed: " + profileErr.message);

    (profiles ?? []).forEach((profile: { user_id: string; display_name: string | null }) => {
      userIds.add(profile.user_id);
      if (!displayName && profile.display_name) displayName = profile.display_name;
    });
  }

  if (!displayName && userIds.size > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .in("user_id", [...userIds])
      .not("display_name", "is", null)
      .limit(1)
      .maybeSingle();
    displayName = profile?.display_name ?? null;
  }

  return { userIds: [...userIds], displayName };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student_id } = await req.json();
    if (!student_id || typeof student_id !== "string") {
      return new Response(JSON.stringify({ error: "student_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sid = student_id.trim().toUpperCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Resolve every web/LINE identity attached to this Master Key.
    const { userIds, displayName } = await resolveLinkedUsers(supabase, sid);

    if (userIds.length === 0) {
      // student_id not found — return only the free course so login still works
      return new Response(
        JSON.stringify({ display_name: null, courses: [SLUG_TO_LMS[FREE_COURSE_SLUG]] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Get paid/free enrollments across every linked identity.
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id, status, courses(slug)")
      .in("user_id", userIds)
      .in("status", ["paid", "free", "active"]);

    // 3. Map to LMS course IDs
    const enrolledLmsIds = new Set<string>();

    // Always include the free lead-magnet course
    enrolledLmsIds.add(SLUG_TO_LMS[FREE_COURSE_SLUG]);

    (enrollments ?? []).forEach((e: any) => {
      const slug: string = e.courses?.slug ?? "";
      const lmsId = SLUG_TO_LMS[slug];
      if (lmsId) enrolledLmsIds.add(lmsId);
    });

    return new Response(
      JSON.stringify({
        display_name: displayName ?? null,
        courses: [...enrolledLmsIds],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
