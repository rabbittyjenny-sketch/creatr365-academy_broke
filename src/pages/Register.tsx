/**
 * /register — LIFF Registration Page
 *
 * Flow:
 *  1. liff.init() → ดึง LINE profile อัตโนมัติ (line_user_id, displayName)
 *  2. User กรอก email + password
 *  3. SHA-256(password + line_user_id) บน browser ก่อนส่ง
 *  4. POST → Make.com Webhook URL (VITE_MAKE_REGISTER_WEBHOOK_URL)
 *     Make.com จะ: อัปเดต tb_students → POST /functions/v1/auth-register
 *
 * ต้องตั้งค่า:
 *   VITE_LINE_LIFF_ID          = LIFF App ID จาก LINE Developers
 *   VITE_MAKE_REGISTER_WEBHOOK_URL = Make.com webhook URL ของ scenario
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import liff from "@line/liff";
import { hashPassword, isPasswordStrong, PASSWORD_HINT } from "@/lib/crypto";
import { SEOHead } from "@/components/SEOHead";
import { CourseNavbar } from "@/components/CourseNavbar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logoCreatr from "@/assets/logo-creatr365.png";

const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID as string;
const MAKE_WEBHOOK = import.meta.env.VITE_MAKE_REGISTER_WEBHOOK_URL as string;

type Step = "loading" | "form" | "success" | "error";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

const Register = () => {
  const [step, setStep] = useState<Step>("loading");
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [busy, setBusy] = useState(false);

  const { toast } = useToast();

  // ── Init LIFF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!LIFF_ID) {
      setLiffError("VITE_LINE_LIFF_ID ยังไม่ได้ตั้งค่า");
      setStep("error");
      return;
    }

    liff
      .init({ liffId: LIFF_ID })
      .then(async () => {
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        const profile = await liff.getProfile();
        setLineProfile(profile);
        setStep("form");
      })
      .catch((err: Error) => {
        setLiffError(err.message);
        setStep("error");
      });
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineProfile) return;

    // Validate password
    if (!isPasswordStrong(password)) {
      toast({ title: "รหัสผ่านไม่แข็งแกร่งพอ", description: PASSWORD_HINT, variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "รหัสผ่านไม่ตรงกัน", variant: "destructive" });
      return;
    }
    if (!MAKE_WEBHOOK) {
      toast({ title: "ระบบยังไม่พร้อม", description: "MAKE_REGISTER_WEBHOOK_URL ยังไม่ได้ตั้งค่า", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      // SHA-256(password + line_user_id) — hash บน browser ก่อนออกจาก browser
      const password_hash = await hashPassword(password, lineProfile.userId);

      // POST → Make.com Webhook (Make.com จะ relay ไปที่ auth-register)
      const res = await fetch(MAKE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_user_id: lineProfile.userId,
          display_name: lineProfile.displayName,
          email: email.trim().toLowerCase(),
          password_hash,             // SHA-256 hex string (64 chars)
          student_id: studentId.trim() || undefined,
          source: "liff_register",
          registered_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Make.com error ${res.status}: ${errText}`);
      }

      setStep("success");
      toast({ title: "สมัครสมาชิกสำเร็จ!", description: `ยินดีต้อนรับ ${lineProfile.displayName}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "เกิดข้อผิดพลาด", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
            <p className="mt-2 text-sm text-muted-foreground">ลงทะเบียนด้วยบัญชี LINE ของคุณ</p>
          </div>

          {/* Loading */}
          {step === "loading" && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <div className="w-8 h-8 border-2 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              กำลังเชื่อมต่อ LINE...
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <p className="text-sm text-destructive font-medium">ไม่สามารถเชื่อมต่อ LINE ได้</p>
              <p className="text-xs text-muted-foreground">{liffError}</p>
              <p className="text-xs text-muted-foreground">
                กรุณาเปิดลิงก์นี้ผ่านแอป LINE หรือตรวจสอบ LIFF ID
              </p>
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
              <div>
                <p className="font-bold text-green-800">สมัครสมาชิกสำเร็จ!</p>
                <p className="text-sm text-green-600 mt-1">
                  ยินดีต้อนรับ {lineProfile?.displayName} — ระบบกำลังบันทึกข้อมูลของคุณ
                </p>
              </div>
              <Link to="/auth" data-accent="green"
                className="btn-brand inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm">
                เข้าสู่ระบบ
              </Link>
            </div>
          )}

          {/* Registration Form */}
          {step === "form" && lineProfile && (
            <>
              {/* LINE Profile Preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#06C755]/30 bg-[#06C755]/5">
                {lineProfile.pictureUrl && (
                  <img src={lineProfile.pictureUrl} alt="" className="w-10 h-10 rounded-full" />
                )}
                <div>
                  <p className="text-sm font-semibold">{lineProfile.displayName}</p>
                  <p className="text-xs text-muted-foreground">LINE ID: {lineProfile.userId.slice(0, 12)}…</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#06C755] text-white">
                    ✓ LINE
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1.5">อีเมล</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1.5">รหัสผ่าน</label>
                  <Input
                    type="password"
                    placeholder="อย่างน้อย 8 ตัว (มีตัวอักษร + ตัวเลข)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground mt-1 ml-1">{PASSWORD_HINT}</p>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1.5">ยืนยันรหัสผ่าน</label>
                  <Input
                    type="password"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1.5">
                    รหัสนักเรียน <span className="font-normal text-muted-foreground">(ถ้ามี)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="STU-XXXX"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>

                {/* Security note */}
                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">🔒 ความปลอดภัย</p>
                  <p>รหัสผ่านจะถูก hash ด้วย SHA-256 บน browser ของคุณก่อนส่งออกไป — เซิร์ฟเวอร์ไม่เคยรับรหัสผ่านจริงๆ</p>
                  <p>ส่งข้อมูลผ่าน HTTPS เท่านั้น</p>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  data-accent="green"
                  className="btn-brand w-full h-12 rounded-lg font-medium disabled:opacity-50"
                >
                  {busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}
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
