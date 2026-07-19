/**
 * auth-register — รับ POST จาก Make.com หลังจากที่ Make.com อัปเดต tb_students ใน Google Sheets แล้ว
 *
 * ป้องกันด้วย X-API-Key header (REGISTER_API_KEY secret)
 *
 * Request body (JSON):
 *   line_user_id  string  required  — LINE userId
 *   email         string  optional  — อีเมลจาก registration form
 *   password_hash string  required  — SHA-256(password + line_user_id) จาก LIFF frontend
 *   student_id    string  optional  — รหัสนักเรียนจาก tb_students
 *
 * Response:
 *   { success: true, created: boolean }
 *   { error: string }  (status 400/401/500)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-api-key",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── 1. Authenticate with X-API-Key ────────────────────────────────────────
  const apiKey = Deno.env.get("REGISTER_API_KEY");
  const incomingKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key") ?? "";

  if (!apiKey || incomingKey !== apiKey) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }

  // ── 2. Parse & validate body ──────────────────────────────────────────────
  let body: {
    line_user_id?: string;
    email?: string;
    password_hash?: string;
    student_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResp({ error: "Invalid JSON body" }, 400);
  }

  const { line_user_id, email, password_hash, student_id } = body;
  if (!line_user_id)    return jsonResp({ error: "line_user_id is required" }, 400);
  if (!password_hash)   return jsonResp({ error: "password_hash is required" }, 400);

  // Basic sanity: SHA-256 hex string is always 64 chars
  if (!/^[0-9a-f]{64}$/i.test(password_hash)) {
    return jsonResp({ error: "password_hash must be a valid SHA-256 hex string" }, 400);
  }

  // ── 3. Upsert into user_accounts ─────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: existing } = await supabase
    .from("user_accounts")
    .select("id")
    .eq("line_user_id", line_user_id)
    .maybeSingle();

  const isNew = !existing;

  const { error: upsertErr } = await supabase
    .from("user_accounts")
    .upsert({
      line_user_id,
      email: email ?? null,
      student_id: student_id ?? null,
      password_hash,
      hash_algorithm: "sha256_client",
      is_active: true,
    }, { onConflict: "line_user_id" });

  if (upsertErr) {
    console.error("user_accounts upsert error:", upsertErr.message);
    return jsonResp({ error: upsertErr.message }, 500);
  }

  // ── 4. Also keep profiles table in sync (email + line_user_id) ──────────
  if (email) {
    await supabase
      .from("profiles")
      .update({ line_user_id })
      .eq("line_user_id", line_user_id);
  }

  return jsonResp({ success: true, created: isNew });
});
