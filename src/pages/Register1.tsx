/**
 * /register — LIFF Registration Page
 *
 * Flow (ไม่ต้อง Make.com):
 *  1. liff.init() → liff.login() อัตโนมัติ
 *  2. liff.getAccessToken() → POST → liff-auth Edge Function
 *     → สร้าง Supabase account + profiles row อัตโนมัติ
 *     → คืน token_hash (magic link)
 *  3. supabase.auth.verifyOtp(token_hash) → session สร้างทันที (login แล้ว)
 *  4. User กรอก email (optional) + student_id (optional)
 *  5. Upsert user_accounts โดยตรงผ่าน Supabase client (authenticated)
 *  6. Redirect → /dashboard
 *
 * ต้องตั้งค่าใน Vercel:
 *   VITE_LINE_LIFF_ID = LIFF App ID จาก LINE Developers Console
 *
 * LINE คือ authentication — ไม่ต้องใช้ password
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import liff from "@line/liff";
import { SEOHead } from "@/components/SEOHead";
import { CourseNavbar } from "@/components/CourseNavbar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoCreatr from "@/assets/logo-creatr365.png";

const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID as string;
const LIFF_AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/liff-auth`;

type Step = "loading" | "authing" | "form" | "saving" | "success" | "error";

interface LineProfile { userId: string; displayName: string; pictureUrl?: string }

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep]               = useState<Step>("loading");
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);

  const [email, setEmail]         = useState("");
  const [studentId, setStudentId] = useState("");

  // ── Init LIFF → liff-auth → Supabase session ────────────────────────────────
  useEffect(() => {
    if (!LIFF_ID) {
      setErrorMsg("VITE_LINE_LIFF_ID ยังไม่ได้ตั้งค่าใน Vercel");
      setStep("error");
      return;
    }

    liff.init({ liffId: LIFF_ID }).then(async () => {
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      // ดึง LINE profile + access token
      const [profile, accessToken] = await Promise.all([
        liff.getProfile(),
        Promise.resolve(liff.getAccessToken()),
      ]);
      setLineProfile(profile);
      setStep("authing");

      // POST access_token → liff-auth → ได้ token_hash + LINE profile confirmed
      const res = await fetch(LIFF_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "liff-auth failed");
      }
      const { token_hash } = await res.json();

      // ใช้ token_hash สร้าง Supabase session (login แล้ว ณ จุดนี้)
      const { error: otpErr } = await supabase.auth.verifyOtp({
        token_hash,
        type: "email",
      });
      if (otpErr) throw new Error(otpErr.message);

      setStep("form");
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStep("error");
    });
  }, []);

  // ── Submit: upsert user_accounts โดยตรง (ไม่ผ่าน Make.com) ─────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineProfile) return;
    setStep("saving");

    try {
      const { error } = await supabase.from("user_accounts").upsert({
        line_user_id: lineProfile.userId,
        email:        email.trim().toLowerCase() || null,
        student_id:   studentId.trim().toUpperCase() || null,
      }, { onConflict: "line_user_id" });

      if (error) throw new Error(error.message);

      toast({ title: "สมัครสมาชิกสำเร็จ!", description: `ยินดีต้อนรับ ${lineProfile.displayName}` });
      setStep("success");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "เกิดข้อผิดพลาด", description: msg, variant: "destructive" });
      setStep("form");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <SEOHead title="สมัครสมาชิก - Creatr365" description="สมัครสมาชิกด้วย LINE" />
      <CourseNavbar />
      <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-16">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center">
            <Link to="/" className="inline-block mb-6">
              <img src={logoCreatr} alt="Creatr365" className="h-12 w-auto mx-auto" />
            </Link>
            <h2 className="text-2xl font-bold" data-accent="green">สมัครสมาชิก Creatr365</h2>
            <p className="mt-2 text-sm text-muted-foreground">เข้าสู่ระบบด้วยบัญชี LINE ของคุณ</p>
          </div>

          {/* Loading / Authing */}
          {(step === "loading" || step === "authing") && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <div className="w-8 h-8 border-2 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              {step === "loading" ? "กำลังเชื่อมต่อ LINE..." : "กำลังยืนยันตัวตน..."}
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <p className="text-sm text-destructive font-medium">ไม่สามารถเชื่อมต่อ LINE ได้</p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
              <p className="text-xs text-muted-foreground">กรุณาเปิดลิงก์นี้ผ่านแอป LINE</p>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-[#06C755] rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-green-800">สมัครสมาชิกสำเร็จ!</p>
              <p className="text-sm text-green-600">กำลังพาไปยัง Dashboard...</p>
            </div>
          )}

          {/* Form */}
          {(step === "form" || step === "saving") && lineProfile && (
            <>
              {/* LINE Profile */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#06C755]/30 bg-[#06C755]/5">
                {lineProfile.pictureUrl && (
                  <img src={lineProfile.pictureUrl} alt="" className="w-10 h-10 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{lineProfile.displayName}</p>
                  <p className="text-xs text-muted-foreground">เชื่อมต่อ LINE สำเร็จ</p>
                </div>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#06C755] text-white shrink-0">
                  ✓ LINE
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1.5">
                    อีเมล <span className="font-normal text-muted-foreground">(ไม่บังคับ — ใช้สำหรับรับข่าวสาร)</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1.5">
                    Key ID <span className="font-normal text-muted-foreground">(ไม่บังคับ — กรอกถ้ามีจากทีมงาน)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="STU-XXXX"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    className="h-12 rounded-xl font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Key ID ใช้สำหรับเข้าระบบ LMS — รับจาก LINE OA หลังซื้อคอร์ส
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">🔒 LINE คือรหัสผ่านของคุณ</p>
                  <p>ระบบใช้ LINE ยืนยันตัวตน — ไม่ต้องจำรหัสผ่านเพิ่ม เข้าระบบครั้งต่อไปผ่าน LINE ได้เลย</p>
                </div>

                <button
                  type="submit"
                  disabled={step === "saving"}
                  data-accent="green"
                  className="btn-brand w-full h-12 rounded-lg font-medium disabled:opacity-50"
                >
                  {step === "saving" ? "กำลังบันทึก..." : "เริ่มต้นใช้งาน"}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                มีบัญชีอยู่แล้ว?{" "}
                <Link to="/auth" data-accent="green" className="underline">เข้าสู่ระบบ</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default Register;
