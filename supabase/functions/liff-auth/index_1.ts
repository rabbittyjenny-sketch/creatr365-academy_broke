import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token } = await req.json();
    if (!access_token) throw new Error("access_token is required");

    // Verify the LIFF access token by fetching the LINE profile
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) {
      const errText = await profileRes.text();
      throw new Error(`LINE API error ${profileRes.status}: ${errText}`);
    }
    const lineProfile = await profileRes.json() as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };
    if (!lineProfile.userId) throw new Error("Invalid LINE profile response");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Synthetic email — one unique email per LINE user, never changes
    const syntheticEmail = `line_${lineProfile.userId}@line.creatr365.com`;

    // Step 1: Check if this LINE user already has a linked profile
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("line_user_id", lineProfile.userId)
      .maybeSingle();

    if (!existingProfile?.user_id) {
      // Step 2: New user — create Supabase account (idempotent: ignore duplicate-email error)
      const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
        email: syntheticEmail,
        email_confirm: true,
        user_metadata: {
          line_user_id: lineProfile.userId,
          display_name: lineProfile.displayName,
          avatar_url: lineProfile.pictureUrl,
          provider: "line",
        },
      });

      if (newUser?.user?.id) {
        const uid = newUser.user.id;

        const { error: profErr } = await supabaseAdmin.from("profiles").upsert({
          user_id: uid,
          line_user_id: lineProfile.userId,
          display_name: lineProfile.displayName,
          avatar_url: lineProfile.pictureUrl ?? null,
        }, { onConflict: "user_id" });
        if (profErr) throw new Error("profiles upsert failed: " + profErr.message);

        // สร้าง user_accounts พร้อม student_id สำหรับเข้า LMS
        const student_id = "STU-" + uid.slice(0, 6).toUpperCase();
        const { error: acctErr } = await supabaseAdmin.from("user_accounts").upsert({
          line_user_id: lineProfile.userId,
          email: syntheticEmail,
          student_id,
          is_active: true,
        }, { onConflict: "line_user_id" });
        if (acctErr) throw new Error("user_accounts upsert failed: " + acctErr.message);
      }
      // If createUser failed (email already exists from a partial prior run),
      // generateLink below will still work because syntheticEmail exists in auth.users
    }

    // Step 3: Generate a one-time magic-link token (works for both new & existing users)
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: syntheticEmail,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      throw new Error(linkErr?.message ?? "Failed to generate login token");
    }

    return new Response(
      JSON.stringify({
        token_hash: linkData.properties.hashed_token,
        type: "email",
        line_profile: {
          userId: lineProfile.userId,
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
