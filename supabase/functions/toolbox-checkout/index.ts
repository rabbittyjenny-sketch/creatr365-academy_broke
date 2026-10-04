import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

/**
 * Toolbox Premium checkout — same structure as create-checkout (courses):
 * pending row → Stripe Checkout with inline THB price_data → paid via
 * stripe-webhook (metadata.kind = "toolbox") or via action "verify" when the
 * buyer lands on /dashboard?section=resources (covers a delayed webhook).
 * The bought file then appears in Dashboard › เอกสาร, next to course materials.
 *
 * Body:
 *   { action: "create", assetId, email? }  → { url } | { alreadyOwned: true }
 *   { action: "verify", purchaseId }       → { status }
 *
 * Every step is written to purchase_events (toolbox_asset_id /
 * toolbox_purchase_id), the same append-only audit trail courses use.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Admin = ReturnType<typeof createClient>;

async function logPurchase(admin: Admin, row: Record<string, unknown>) {
  try {
    const { error } = await admin.from("purchase_events").insert(row);
    if (error) console.error("purchase_events insert failed:", error.message);
  } catch (e) {
    console.error("purchase_events insert threw:", e);
  }
}

// Only send buyers back to our own site.
function safeOrigin(req: Request): string {
  const origin = req.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
  if (allowed && origin !== allowed && !origin.startsWith("http://localhost")) return allowed;
  return origin || allowed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supaUser = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  let userId: string | null = null;
  let assetIdForLog: string | null = null;

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data } = await supaUser.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("กรุณาเข้าสู่ระบบก่อน");
    userId = user.id;

    const body = await req.json();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-08-27.basil" });

    // ── verify ────────────────────────────────────────────────────────────
    if (body.action === "verify") {
      const { data: p } = await admin.from("toolbox_purchases").select("*")
        .eq("id", body.purchaseId).eq("user_id", user.id).maybeSingle();
      if (!p) throw new Error("ไม่พบรายการสั่งซื้อ");
      if (p.status === "paid") return json({ status: "paid" });
      if (!p.stripe_session_id) return json({ status: p.status });

      const session = await stripe.checkout.sessions.retrieve(p.stripe_session_id);
      if (session.payment_status === "paid") {
        await admin.from("toolbox_purchases")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", p.id).neq("status", "paid");
        await logPurchase(admin, {
          user_id: user.id, toolbox_asset_id: p.asset_id, toolbox_purchase_id: p.id,
          event: "payment_verified", stripe_session_id: session.id, amount_final: p.amount_thb,
        });
        return json({ status: "paid" });
      }
      return json({ status: p.status });
    }

    // ── create ────────────────────────────────────────────────────────────
    if (body.action !== "create") throw new Error("Unknown action");
    const assetId = body.assetId as string;
    if (!assetId) throw new Error("assetId is required");
    assetIdForLog = assetId;
    const ev = (event: string, extra: Record<string, unknown> = {}) =>
      logPurchase(admin, { user_id: user.id, toolbox_asset_id: assetId, event, ...extra });

    await ev("checkout_started");

    const { data: asset } = await admin.from("toolbox_assets").select("*").eq("id", assetId).maybeSingle();
    if (!asset || !asset.is_active) throw new Error("ไม่พบไฟล์นี้หรือปิดการขายแล้ว");
    if (asset.pricing_type !== "paid") throw new Error("ไฟล์นี้แจกฟรี ดาวน์โหลดได้เลย");

    const { data: owned } = await admin.from("toolbox_purchases").select("id")
      .eq("user_id", user.id).eq("asset_id", assetId).eq("status", "paid").maybeSingle();
    if (owned) {
      await ev("already_purchased", { toolbox_purchase_id: owned.id });
      return json({ alreadyOwned: true });
    }

    // Close older unpaid attempts instead of deleting them (audit trail).
    const { data: replaced } = await admin.from("toolbox_purchases")
      .update({ status: "abandoned" })
      .eq("user_id", user.id).eq("asset_id", assetId).eq("status", "pending")
      .select("id, stripe_session_id");
    for (const r of replaced ?? []) {
      await ev("pending_replaced", { toolbox_purchase_id: r.id, stripe_session_id: r.stripe_session_id });
    }

    const price = asset.price_thb as number;
    const promo = asset.promo_price_thb as number | null;
    const finalAmount = promo && promo < price ? promo : price;
    if (!finalAmount || finalAmount <= 0) throw new Error("ยังไม่ได้ตั้งราคาไฟล์นี้");

    const receiptEmail = (typeof body.email === "string" && body.email) ||
      (user.email && !/@line\.creatr365\.com$/i.test(user.email) ? user.email : "");

    const { data: purchase, error: insErr } = await admin.from("toolbox_purchases")
      .insert({ asset_id: assetId, user_id: user.id, status: "pending", amount_thb: finalAmount, receipt_email: receiptEmail || null })
      .select("id").single();
    if (insErr || !purchase) throw new Error(insErr?.message ?? "สร้างรายการสั่งซื้อไม่สำเร็จ");
    await ev("pending_created", {
      toolbox_purchase_id: purchase.id, price_original: price,
      discount_amount: price - finalAmount, amount_final: finalAmount,
    });

    let customerId: string | undefined;
    if (receiptEmail) {
      const customers = await stripe.customers.list({ email: receiptEmail, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const origin = safeOrigin(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : (receiptEmail || undefined),
      line_items: [{
        price_data: {
          currency: "thb",
          product_data: { name: asset.title, description: asset.description || "Creatr365 Toolbox Premium" },
          unit_amount: finalAmount * 100,
        },
        quantity: 1,
      }],
      mode: "payment",
      // Bought files live in Dashboard › เอกสาร (like course materials), so the
      // buyer lands there; Dashboard runs action "verify" in case the webhook is late.
      success_url: `${origin}/dashboard?section=resources&toolbox_purchase=${purchase.id}`,
      cancel_url: `${origin}/toolbox?purchase=${purchase.id}&status=cancelled`,
      metadata: { kind: "toolbox", toolbox_purchase_id: purchase.id, toolbox_asset_id: assetId },
    });

    await admin.from("toolbox_purchases").update({ stripe_session_id: session.id }).eq("id", purchase.id);
    await ev("stripe_session_created", { toolbox_purchase_id: purchase.id, stripe_session_id: session.id, amount_final: finalAmount });

    return json({ url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (userId) {
      await logPurchase(admin, { user_id: userId, toolbox_asset_id: assetIdForLog, event: "error", detail: { message: msg } });
    }
    return json({ error: msg }, 400);
  }
});
