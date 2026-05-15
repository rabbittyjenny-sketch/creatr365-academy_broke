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
      throw new Error(`LINE API error: ${profileRes.status}`);
    }
    const lineProfile = await profileRes.json() as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Check if this LINE user already has a linked Supabase account
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("line_user_id", lineProfile.userId)
      .maybeSingle();

    let supabaseUserId: string;
    let userEmail: string;

    if (existingProfile?.user_id) {
      // Existing user – get their email to generate a magic link
      supabaseUserId = existingProfile.user_id;
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
      if (!userData?.user?.email) throw new Error("Linked user not found");
      userEmail = userData.user.email;
    } else {
      // New user – create a Supabase account tied to their LINE user ID
      userEmail = `line_${lineProfile.userId}@line.creatr365.com`;
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: {
          line_user_id: lineProfile.userId,
          display_name: lineProfile.displayName,
          avatar_url: lineProfile.pictureUrl,
          provider: "line",
        },
      });
      if (createErr) {
        // User may already exist with this email but without profile row
        const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
        const found = existing?.users?.find(u => u.email === userEmail);
        if (!found) throw new Error(createErr.message);
        supabaseUserId = found.id;
      } else {
        supabaseUserId = newUser.user.id;
      }

      // Create or update profile with line_user_id
      await supabaseAdmin.from("profiles").upsert({
        user_id: supabaseUserId,
        line_user_id: lineProfile.userId,
        display_name: lineProfile.displayName,
        avatar_url: lineProfile.pictureUrl ?? null,
      }, { onConflict: "user_id" });
    }

    // Generate a magic link token for this user
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: userEmail,
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
