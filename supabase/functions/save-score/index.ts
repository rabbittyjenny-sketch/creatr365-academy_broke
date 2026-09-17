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

// Diagnostic Quiz has no pass/fail (per the Completion Record framework —
// it's a skill-radar snapshot, not a gate), so the LMS always sends
// passed=true for it. Recording it here — separately from module_progress
// — is what lets a real Completion Record ever be issued: completion
// requires a diagnostic_attempts row, and issue_completion_record checks
// that plus the Mandatory Knowledge Gate (inert today — see the
// mandatory_gate_completion_records migration for why) plus every module
// in the course being "completed".
async function recordDiagnosticAndMaybeIssueRecord(
  supabase: ReturnType<typeof createClient>,
  authUserId: string,
  courseId: string,
  scorePct: number,
) {
  const { count } = await supabase
    .from("diagnostic_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authUserId)
    .eq("course_id", courseId);

  const { data: attempt, error: attemptErr } = await supabase
    .from("diagnostic_attempts")
    .insert({
      user_id: authUserId,
      course_id: courseId,
      attempt_number: (count ?? 0) + 1,
      score_pct: scorePct,
      accepted: true,
    })
    .select("id")
    .single();
  if (attemptErr) {
    console.error("diagnostic_attempts insert failed:", attemptErr.message);
    return;
  }

  const { error: issueErr } = await supabase.rpc("issue_completion_record", {
    _user_id: authUserId,
    _course_id: courseId,
    _diagnostic_attempt_id: attempt.id,
  });
  // Expected to fail with "course modules not all completed" if this
  // diagnostic attempt's own module_progress upsert (below, same request)
  // hasn't committed yet in another identity's loop iteration, or if the
  // Mandatory Knowledge Gate has real active topics this student hasn't
  // passed — neither is an error worth surfacing to the student mid-quiz.
  if (issueErr) console.warn("issue_completion_record not issued yet:", issueErr.message);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { student_id, course_slug, module_code, score, passed, quiz_type } = await req.json();
    if (!student_id || !module_code) throw new Error("student_id and module_code required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sid = student_id.trim().toUpperCase();
    const authUserIds = await resolveLinkedUserIds(supabase, sid);
    if (authUserIds.length === 0) throw new Error("student_id not found: " + student_id);

    // หา module: ลอง course_slug + module_code ก่อน, fallback ด้วย module_code เดียว
    let mod: { id: string; course_id: string } | null = null;

    if (course_slug) {
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", course_slug)
        .maybeSingle();

      if (course?.id) {
        const { data: m } = await supabase
          .from("course_modules")
          .select("id, course_id")
          .eq("course_id", course.id)
          .eq("code", module_code)
          .maybeSingle();
        mod = m ?? null;
      }
    }

    // fallback: หา module_code โดยไม่สนใจ course
    if (!mod) {
      const { data: m, error: modErr } = await supabase
        .from("course_modules")
        .select("id, course_id")
        .eq("code", module_code)
        .maybeSingle();
      if (modErr) throw new Error("course_modules lookup failed: " + modErr.message);
      mod = m ?? null;
    }

    if (!mod) {
      // module ไม่เจอ — log แต่ไม่ fail (อาจเป็น qg ที่ยังไม่ได้ตั้งค่าใน DB)
      console.warn(`module_code "${module_code}" not found in course_modules, skipping progress update`);
      return new Response(JSON.stringify({ ok: true, warning: "module not found, score not saved to progress" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        { onConflict: "user_id,module_id" }
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

      if (quiz_type === "diagnostic" && passed && typeof score === "number") {
        await recordDiagnosticAndMaybeIssueRecord(supabase, authUserId, mod.course_id, score);
      }
    }

    return new Response(JSON.stringify({ ok: true, linked_users_updated: authUserIds.length }), {
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
