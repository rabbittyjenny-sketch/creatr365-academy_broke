import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { student_id, module_code, score, passed } = await req.json();
    if (!student_id || !module_code) throw new Error("student_id and module_code required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // หา line_user_id จาก student_id
    const { data: acct, error: acctErr } = await supabase
      .from("user_accounts")
      .select("line_user_id")
      .eq("student_id", student_id.trim().toUpperCase())
      .maybeSingle();
    if (acctErr) throw new Error("user_accounts lookup failed: " + acctErr.message);
    if (!acct) throw new Error("student_id not found: " + student_id);

    // แปลง line_user_id → auth.users.id
    let authUserId: string;
    if (acct.line_user_id.startsWith("web:")) {
      authUserId = acct.line_user_id.replace("web:", "");
    } else {
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("line_user_id", acct.line_user_id)
        .maybeSingle();
      if (profErr) throw new Error("profiles lookup failed: " + profErr.message);
      if (!profile) throw new Error("profile not found for LINE user");
      authUserId = profile.user_id;
    }

    // หา module_id จาก code
    const { data: mod, error: modErr } = await supabase
      .from("course_modules")
      .select("id")
      .eq("code", module_code)
      .maybeSingle();
    if (modErr) throw new Error("course_modules lookup failed: " + modErr.message);
    if (!mod) throw new Error("module_code not found: " + module_code);

    // บันทึก progress พร้อม score
    const { error: upsertErr } = await supabase.from("module_progress").upsert(
      {
        user_id: authUserId,
        module_id: mod.id,
        score: typeof score === "number" ? score : null,
        status: passed ? "completed" : "in_progress",
        completed_at: passed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,module_id" }
    );
    if (upsertErr) throw new Error("module_progress upsert failed: " + upsertErr.message);

    // ถ้าผ่าน → ปลดล็อคบทถัดไป
    if (passed) {
      await supabase.rpc("unlock_next_module", {
        _module_id: mod.id,
        _user_id: authUserId,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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
