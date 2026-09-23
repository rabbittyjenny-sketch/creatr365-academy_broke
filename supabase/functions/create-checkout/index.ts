import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Admin = ReturnType<typeof createClient>;

/**
 * Append-only purchase audit (purchase_events). Every step of a checkout is
 * recorded so a "paid but got nothing" / "never bought it" dispute can be
 * checked against what actually happened, not just the latest enrollment row.
 * Never throws — logging must not break a real checkout.
 */
async function logPurchase(admin: Admin, row: Record<string, unknown>) {
  try {
    const { error } = await admin.from("purchase_events").insert(row);
    if (error) console.error("purchase_events insert failed:", error.message);
  } catch (e) {
    console.error("purchase_events insert threw:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  let logUserId: string | null = null;
  let logCourseId: string | null = null;
  let alreadyLogged = false; // set when a specific event already explains the failure

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { courseId, fullName, phone, promoCode, email: submittedEmail } = await req.json();
    if (!courseId) throw new Error("courseId is required");
    // Use submitted real email for Stripe receipts; fall back to Supabase auth email (may be synthetic LINE email)
    const receiptEmail = (submittedEmail as string | null) || user.email || "";

    logUserId = user.id;
    logCourseId = courseId;
    const ev = (event: string, extra: Record<string, unknown> = {}) =>
      logPurchase(supabaseAdmin, { user_id: user.id, course_id: courseId, event, ...extra });
    await ev("checkout_started", { detail: { promo_code_entered: promoCode || null } });

    // Get course
    const { data: course, error: courseErr } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();
    if (courseErr || !course) throw new Error("Course not found");

    // Prevent duplicate paid/free enrollment
    const { data: existingPaid } = await supabaseAdmin
      .from("course_enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .in("status", ["paid", "free"])
      .maybeSingle();
    if (existingPaid) {
      await ev("already_enrolled", { enrollment_id: existingPaid.id });
      alreadyLogged = true;
      throw new Error("คุณลงทะเบียนคอร์สนี้แล้ว กรุณาไปที่ Dashboard");
    }

    // An earlier unpaid attempt for this course is closed as "abandoned"
    // instead of being deleted (it used to be DELETEd here, which erased the
    // only trace that the learner had tried to buy). Keeping the row also
    // means that if the learner still completes the *old* Stripe tab later,
    // stripe-webhook finds the enrollment it points at instead of nothing.
    const { data: replaced } = await supabaseAdmin
      .from("course_enrollments")
      .update({ status: "abandoned" })
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("status", "pending")
      .select("id, stripe_session_id");
    for (const r of replaced ?? []) {
      await ev("pending_replaced", { enrollment_id: r.id, stripe_session_id: r.stripe_session_id });
    }

    // Check enrollment capacity
    if (course.max_slots) {
      const { count } = await supabaseAdmin
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId)
        .in("status", ["paid", "free"]);
      if ((count || 0) >= course.max_slots) {
        await ev("course_full", { detail: { max_slots: course.max_slots, taken: count } });
        alreadyLogged = true;
        throw new Error("Course is full");
      }
    }

    // Handle promo code
    let discount = 0;
    let promoId: string | null = null;
    let isFree = false;
    let promoDiscountType: string | null = null;

    if (promoCode) {
      const { data: promo } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("course_id", courseId)
        .eq("is_active", true)
        .single();

      if (promo && promo.used_count < promo.max_uses) {
        promoId = promo.id;
        promoDiscountType = promo.discount_type;
        if (promo.discount_type === "free") {
          isFree = true;
        } else if (promo.discount_type === "percent") {
          discount = promo.discount_value;
        } else if (promo.discount_type === "amount") {
          discount = promo.discount_value;
        }
        await ev("promo_applied", {
          promo_code_id: promo.id,
          detail: { code: promo.code, discount_type: promo.discount_type, discount_value: promo.discount_value },
        });
      } else {
        await ev("promo_rejected", {
          detail: { code: String(promoCode).toUpperCase(), reason: promo ? "max_uses reached" : "not found / inactive / other course" },
        });
      }
    }

    // A course marked "free" in Admin enrolls directly, with no price to
    // parse and no Stripe session — skip straight to the free-enrollment
    // path below instead of failing on an unparseable/zero price.
    if (course.status === "free") {
      isFree = true;
    }

    // Parse price (e.g. "25,000 - 45,000 ฿" → take first number)
    let priceAmount = 0;
    if (!isFree) {
      const priceMatch = (course.price || "").replace(/,/g, "").match(/(\d+)/);
      priceAmount = priceMatch ? parseInt(priceMatch[1]) : 0;
      if (!priceAmount) throw new Error("Course price not configured");
    }

    if (isFree) {
      // Free enrollment
      const { data: freeEnr, error: enrollErr } = await supabaseAdmin
        .from("course_enrollments")
        .insert({
          course_id: courseId,
          user_id: user.id,
          status: "free",
          promo_code_id: promoId,
          amount_paid: 0,
          full_name: fullName,
          phone: phone,
        })
        .select("id")
        .single();
      if (enrollErr) throw new Error(enrollErr.message);
      await ev("free_enrolled", {
        enrollment_id: freeEnr.id, promo_code_id: promoId, amount_final: 0,
        price_original: priceAmount || null,
        detail: { reason: course.status === "free" ? "free course" : "promo made it free" },
      });

      // Increment promo used_count
      if (promoId) {
        await supabaseAdmin.rpc("increment_promo_used", { promo_id: promoId });
      }

      return new Response(
        JSON.stringify({ free: true, message: "Enrolled for free" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate final price in satang (THB cents)
    let finalAmount = priceAmount;
    if (discount > 0) {
      if (promoDiscountType === "percent") {
        finalAmount = Math.round(priceAmount * (1 - discount / 100));
      } else {
        finalAmount = Math.max(0, priceAmount - discount);
      }
    }

    if (finalAmount <= 0) {
      // Effectively free
      const { data: freeEnr, error: enrollErr } = await supabaseAdmin
        .from("course_enrollments")
        .insert({
          course_id: courseId,
          user_id: user.id,
          status: "free",
          promo_code_id: promoId,
          amount_paid: 0,
          full_name: fullName,
          phone: phone,
        })
        .select("id")
        .single();
      if (enrollErr) throw new Error(enrollErr.message);
      await ev("free_enrolled", {
        enrollment_id: freeEnr.id, promo_code_id: promoId, amount_final: 0,
        price_original: priceAmount || null,
        detail: { reason: course.status === "free" ? "free course" : "promo made it free" },
      });
      if (promoId) {
        await supabaseAdmin.rpc("increment_promo_used", { promo_id: promoId });
      }
      return new Response(
        JSON.stringify({ free: true, message: "Enrolled for free" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountInSatang = finalAmount * 100;

    // Create enrollment record as pending
    const { data: enrollment, error: enrollErr } = await supabaseAdmin
      .from("course_enrollments")
      .insert({
        course_id: courseId,
        user_id: user.id,
        status: "pending",
        promo_code_id: promoId,
        amount_paid: finalAmount,
        full_name: fullName,
        phone: phone,
      })
      .select("id")
      .single();
    if (enrollErr) throw new Error(enrollErr.message);
    await ev("pending_created", {
      enrollment_id: enrollment.id, promo_code_id: promoId,
      price_original: priceAmount, discount_amount: priceAmount - finalAmount, amount_final: finalAmount,
    });

    // Stripe checkout
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: receiptEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : receiptEmail,
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: course.title,
              description: `${course.subtitle} · ${course.duration}`,
            },
            unit_amount: amountInSatang,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/enroll/${course.slug}?success=true&enrollment_id=${enrollment.id}`,
      cancel_url: `${req.headers.get("origin")}/enroll/${course.slug}?cancelled=true&enrollment_id=${enrollment.id}`,
      metadata: {
        enrollment_id: enrollment.id,
        course_id: courseId,
        promo_code_id: promoId || "",
      },
    });

    // Save stripe_session_id to enrollment immediately so verify-payment can retrieve directly
    await supabaseAdmin
      .from("course_enrollments")
      .update({ stripe_session_id: session.id })
      .eq("id", enrollment.id);
    await ev("stripe_session_created", { enrollment_id: enrollment.id, stripe_session_id: session.id, amount_final: finalAmount });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (logUserId && !alreadyLogged) {
      await logPurchase(supabaseAdmin, { user_id: logUserId, course_id: logCourseId, event: "error", detail: { message: msg } });
    }
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
