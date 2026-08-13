import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: u } = await supaUser.auth.getUser(auth.replace("Bearer ", ""));
    if (!u.user) throw new Error("Not authenticated");

    const { enrollmentId } = await req.json();
    if (!enrollmentId) throw new Error("enrollmentId required");

    const supaAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: enr } = await supaAdmin
      .from("course_enrollments")
      .select("*")
      .eq("id", enrollmentId)
      .eq("user_id", u.user.id)
      .single();
    if (!enr) throw new Error("Enrollment not found");

    // Already confirmed — nothing to do
    if (enr.status === "paid" || enr.status === "free") {
      return new Response(JSON.stringify({ status: enr.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-08-27.basil",
    });

    // Prefer direct retrieval using stored stripe_session_id (set at checkout creation)
    // Fall back to metadata search if the column is missing for older enrollments
    let stripeSession: Stripe.Checkout.Session | null = null;

    if (enr.stripe_session_id) {
      stripeSession = await stripe.checkout.sessions.retrieve(enr.stripe_session_id);
    } else {
      // Fallback: list recent sessions and find by metadata
      const sessions = await stripe.checkout.sessions.list({ limit: 25 });
      stripeSession = sessions.data.find(
        (s) => s.metadata?.enrollment_id === enrollmentId
      ) ?? null;
    }

    if (!stripeSession) throw new Error("Stripe session not found");

    if (stripeSession.payment_status === "paid") {
      await supaAdmin
        .from("course_enrollments")
        .update({ status: "paid", stripe_session_id: stripeSession.id })
        .eq("id", enrollmentId);

      // Unlock first module
      const { data: firstModule } = await supaAdmin
        .from("course_modules")
        .select("id")
        .eq("course_id", enr.course_id)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstModule) {
        await supaAdmin
          .from("module_progress")
          .upsert(
            { user_id: u.user.id, module_id: firstModule.id, status: "unlocked" },
            { onConflict: "user_id,module_id" }
          );
      }

      return new Response(JSON.stringify({ status: "paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: enr.status }), {
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
