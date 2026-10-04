import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("Webhook signature verification failed:", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Toolbox Premium (created by toolbox-checkout). Course sessions never
    // carry metadata.kind, so the course branch below is unaffected.
    if (session.metadata?.kind === "toolbox") {
      const purchaseId = session.metadata.toolbox_purchase_id;
      if (purchaseId && session.payment_status === "paid") {
        const { data: tp } = await supabaseAdmin
          .from("toolbox_purchases")
          .update({ status: "paid", paid_at: new Date().toISOString(), stripe_session_id: session.id })
          .eq("id", purchaseId)
          .neq("status", "paid")
          .select("user_id, asset_id, amount_thb")
          .maybeSingle();
        if (tp) {
          await supabaseAdmin.from("purchase_events").insert({
            user_id: tp.user_id,
            toolbox_asset_id: tp.asset_id,
            toolbox_purchase_id: purchaseId,
            event: "webhook_paid",
            stripe_session_id: session.id,
            amount_final: tp.amount_thb,
          });
        }
      }
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const enrollmentId = session.metadata?.enrollment_id;
    const promoCodeId = session.metadata?.promo_code_id;

    if (enrollmentId) {
      // Update enrollment to paid
      const { data: enr } = await supabaseAdmin
        .from("course_enrollments")
        .update({ status: "paid", stripe_session_id: session.id })
        .eq("id", enrollmentId)
        .select("user_id, course_id")
        .single();

      // Unlock first module for the student
      if (enr?.course_id && enr?.user_id) {
        const { data: firstModule } = await supabaseAdmin
          .from("course_modules")
          .select("id")
          .eq("course_id", enr.course_id)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (firstModule) {
          await supabaseAdmin
            .from("module_progress")
            .upsert(
              { user_id: enr.user_id, module_id: firstModule.id, status: "unlocked" },
              { onConflict: "user_id,module_id" }
            );
        }
      }

      // Increment promo usage
      if (promoCodeId) {
        await supabaseAdmin.rpc("increment_promo_used", { promo_id: promoCodeId });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
