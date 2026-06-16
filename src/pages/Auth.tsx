import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { CourseNavbar } from '@/components/CourseNavbar';
import { getAuthErrorMessage, isValidPassword, PASSWORD_REQUIREMENTS_TEXT } from '@/lib/auth';
import { useLiff } from '@/hooks/useLiff';

import logoCreatr from '@/assets/logo-creatr365.png';

const LIFF_CONFIGURED = !!import.meta.env.VITE_LINE_LIFF_ID;

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [liffLoading, setLiffLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();  // ← FIX: was missing destructure
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/dashboard';

  // FIX: call useLiff hook properly (was using liff as bare global)
  const liff = useLiff();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(redirectTo, { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate(redirectTo, { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);

  // Auto sign-in when LIFF is ready
  useEffect(() => {
    if (!LIFF_CONFIGURED || !liff.ready || !liff.loggedIn || !liff.accessToken) return;
    handleLiffSignIn(liff.accessToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liff.ready, liff.loggedIn, liff.accessToken]);

  const handleLiffSignIn = async (accessToken: string) => {
    setLiffLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/liff-auth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'LIFF auth failed');

      const { error } = await supabase.auth.verifyOtp({
        token_hash: body.token_hash,
        type: 'email',
      });
      if (error) throw error;
      toast({ title: 'เข้าสู่ระบบด้วย LINE สำเร็จ', description: `ยินดีต้อนรับ ${body.line_profile?.displayName ?? ''}` });
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด (LINE)', description: String(err?.message ?? err), variant: 'destructive' });
    } finally {
      setLiffLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: 'กรอกอีเมลก่อน', description: 'กรุณากรอกอีเมลที่ใช้สมัครเพื่อรับลิงก์รีเซ็ตรหัสผ่าน', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'ส่งลิงก์แล้ว', description: 'กรุณาตรวจสอบอีเมลเพื่อรีเซ็ตรหัสผ่าน' });
    } catch (error: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: getAuthErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'เข้าสู่ระบบสำเร็จ', description: 'ยินดีต้อนรับกลับมา' });
        // navigate handled by onAuthStateChange
      } else {
        if (!isValidPassword(password)) throw new Error(PASSWORD_REQUIREMENTS_TEXT);
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast({ title: 'สมัครสมาชิกสำเร็จ', description: 'กรุณาตรวจสอบอีเมลและกดยืนยันก่อนเข้าสู่ระบบ' });
      }
    } catch (error: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: getAuthErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CourseNavbar />
      <SEOHead
        title={isLogin ? 'เข้าสู่ระบบ - Creatr365' : 'สมัครสมาชิก - Creatr365'}
        description="เข้าสู่ระบบเพื่อเริ่มเรียนกับ Creatr365"
      />
      <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-block mb-6">
              <img src={logoCreatr} alt="Creatr365" className="h-12 w-auto mx-auto" />
            </Link>
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? 'เข้าสู่ระบบเพื่อเริ่มเรียน' : 'สร้างบัญชีเพื่อเริ่มต้นกับ Creatr365'}
            </p>
          </div>

          {/* LINE Login via LIFF */}
          {LIFF_CONFIGURED && (
            <div className="space-y-3">
              {liff.ready && liff.loggedIn && liff.accessToken ? (
                <button
                  type="button"
                  disabled={liffLoading}
                  onClick={() => handleLiffSignIn(liff.accessToken!)}
                  className="w-full h-12 rounded-lg font-medium flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34d] text-white transition-colors disabled:opacity-50"
                >
                  {liffLoading ? 'กำลังเข้าสู่ระบบ...' : (
                    <>
                      <LineIcon />
                      เข้าสู่ระบบด้วย LINE
                      {liff.profile?.displayName && (
                        <span className="text-xs opacity-80">({liff.profile.displayName})</span>
                      )}
                    </>
                  )}
                </button>
              ) : liff.ready && !liff.loggedIn ? (
                <button
                  type="button"
                  onClick={() => liff.login()}
                  className="w-full h-12 rounded-lg font-medium flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34d] text-white transition-colors"
                >
                  <LineIcon />
                  เข้าสู่ระบบด้วย LINE
                </button>
              ) : !liff.ready && (
                <button disabled className="w-full h-12 rounded-lg font-medium flex items-center justify-center gap-3 bg-[#06C755]/50 text-white cursor-not-allowed">
                  <LineIcon />
                  กำลังโหลด LINE...
                </button>
              )}

              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground">หรือ</span>
                <div className="flex-1 border-t border-border" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="อีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-12 rounded-xl"
            />
            <div>
              <Input
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="h-12 rounded-xl"
                minLength={8}
              />
              <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                <p className="ml-1 text-muted-foreground">{PASSWORD_REQUIREMENTS_TEXT}</p>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="shrink-0 text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full h-12 rounded-lg font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? 'กำลังดำเนินการ...' : isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="hover:text-foreground transition-colors"
            >
              {isLogin ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

function LineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

export default Auth;
