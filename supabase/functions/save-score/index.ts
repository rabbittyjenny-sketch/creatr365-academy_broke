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
    const { data: acct } = await supabase
      .from("user_accounts")
      .select("line_user_id")
      .eq("student_id", student_id)
      .single();
    if (!acct) throw new Error("student_id not found");

    // แปลง line_user_id → auth.users.id
    let authUserId: string;
    if (acct.line_user_id.startsWith("web:")) {
      authUserId = acct.line_user_id.replace("web:", "");
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("line_user_id", acct.line_user_id)
        .single();
      if (!profile) throw new Error("profile not found for LINE user");
      authUserId = profile.user_id;
    }

    // หา module_id จาก code
    const { data: mod } = await supabase
      .from("course_modules")
      .select("id")
      .eq("code", module_code)
      .single();
    if (!mod) throw new Error("module_code not found");

    // บันทึก progress
    await supabase.from("module_progress").upsert(
      {
        user_id: authUserId,
        module_id: mod.id,
        status: passed ? "completed" : "in_progress",
        completed_at: passed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,module_id" }
    );

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
