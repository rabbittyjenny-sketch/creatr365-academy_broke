import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// slug → LMS course ID mapping (matches COURSES object in Creatr365_LMS_v2.jsx)
const SLUG_TO_LMS: Record<string, string> = {
  "micro-express": "MICRO_EXPRESS",
  "signal":        "SIGNAL",
  "matrix":        "MATRIX",
  "stage":         "STAGE",
  "blueprint":     "BLUEPRINT",
  "frontier":      "FRONTIER",
};

// Free / lead-magnet course always visible to every registered student
const FREE_COURSE_SLUG = "micro-express";

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

    // 1. Find user_account by student_id
    const { data: account } = await supabase
      .from("user_accounts")
      .select("line_user_id")
      .eq("student_id", sid)
      .maybeSingle();

    if (!account?.line_user_id) {
      // student_id not found — return only the free course so login still works
      return new Response(
        JSON.stringify({ display_name: null, courses: [SLUG_TO_LMS[FREE_COURSE_SLUG]] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Find Supabase user_id — web users use "web:<uuid>" as line_user_id
    let userId: string | null = null;
    let displayName: string | null = null;

    if (account.line_user_id.startsWith("web:")) {
      // Email-signup user: user_id is embedded in line_user_id
      userId = account.line_user_id.replace("web:", "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userId)
        .maybeSingle();
      displayName = profile?.display_name ?? null;
    } else {
      // LINE user: find via profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("line_user_id", account.line_user_id)
        .maybeSingle();
      userId = profile?.user_id ?? null;
      displayName = profile?.display_name ?? null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ display_name: null, courses: [SLUG_TO_LMS[FREE_COURSE_SLUG]] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const profile = { user_id: userId, display_name: displayName };

    // 3. Get paid/free enrollments
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id, status, courses(slug)")
      .eq("user_id", profile.user_id)
      .in("status", ["paid", "free", "active"]);

    // 4. Map to LMS course IDs
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
        display_name: profile.display_name ?? null,
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
