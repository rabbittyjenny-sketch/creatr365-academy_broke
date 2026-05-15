/**
 * Make.com Webhook Endpoint
 *
 * Make.com scenario ส่ง POST request มาที่นี่ พร้อม Authorization: Bearer <MAKE_WEBHOOK_SECRET>
 *
 * Supported event_types:
 *  - user_lookup      : ดึงข้อมูลผู้ใช้จาก line_user_id
 *  - enrollment_check : เช็คว่า LINE user ลงทะเบียนคอร์สใดบ้าง
 *  - quiz_result_save : บันทึกผล quiz จาก LINE OA
 *  - send_notification: ส่ง payload กลับให้ Make.com เพื่อแจ้งเตือนผ่าน LINE
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

type EventType =
  | "user_lookup"
  | "enrollment_check"
  | "quiz_result_save"
  | "send_notification";

interface WebhookPayload {
  event_type: EventType;
  line_user_id: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request from Make.com using the shared secret
  const webhookSecret = Deno.env.get("MAKE_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!webhookSecret || token !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const payload: WebhookPayload = await req.json();
    const { event_type, line_user_id, data = {} } = payload;

    if (!event_type) throw new Error("event_type is required");
    if (!line_user_id) throw new Error("line_user_id is required");

    // Resolve profile for this LINE user
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .eq("line_user_id", line_user_id)
      .maybeSingle();

    switch (event_type) {
      case "user_lookup": {
        return json({ found: !!profile, profile });
      }

      case "enrollment_check": {
        if (!profile?.user_id) return json({ enrolled: false, courses: [] });
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("course_id, status, courses(title, slug, tag)")
          .eq("user_id", profile.user_id)
          .in("status", ["paid", "free"]);
        return json({ enrolled: (enrollments?.length ?? 0) > 0, courses: enrollments ?? [] });
      }

      case "quiz_result_save": {
        await supabase.from("diagnostic_quiz_results").insert({
          user_id: profile?.user_id ?? null,
          ...data,
          referrer: "line_oa",
        });
        return json({ saved: true });
      }

      case "send_notification": {
        // Return payload for Make.com to use when calling LINE Messaging API
        return json({
          to: line_user_id,
          messages: data.messages ?? [],
          profile,
        });
      }

      default:
        throw new Error(`Unknown event_type: ${event_type}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
