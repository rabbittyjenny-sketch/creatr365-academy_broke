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

  // Append-only purchase audit (see create-checkout). Never throws.
  const logPurchase = async (row: Record<string, unknown>) => {
    try {
      const { error } = await supabaseAdmin.from("purchase_events").insert(row);
      if (error) console.error("purchase_events insert failed:", error.message);
    } catch (e) { console.error("purchase_events insert threw:", e); }
  };

  // Stripe sends this when an unpaid Checkout Session times out (24h by
  // default). Only delivered if the event is enabled on the webhook endpoint
  // in the Stripe Dashboard; harmless otherwise.
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const enrollmentId = session.metadata?.enrollment_id;
    if (enrollmentId) {
      const { data: enr } = await supabaseAdmin
        .from("course_enrollments")
        .update({ status: "abandoned" })
        .eq("id", enrollmentId)
        .eq("status", "pending")
        .select("user_id, course_id")
        .maybeSingle();
      await logPurchase({
        user_id: enr?.user_id ?? null, course_id: enr?.course_id ?? session.metadata?.course_id ?? null,
        enrollment_id: enrollmentId, stripe_session_id: session.id, event: "checkout_expired",
      });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
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

      await logPurchase({
        user_id: enr?.user_id ?? null, course_id: enr?.course_id ?? session.metadata?.course_id ?? null,
        enrollment_id: enrollmentId, stripe_session_id: session.id, event: "webhook_paid",
        promo_code_id: promoCodeId || null,
        amount_final: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
        detail: { payment_status: session.payment_status, event_id: event.id },
      });

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
