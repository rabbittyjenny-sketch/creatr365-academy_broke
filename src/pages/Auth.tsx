import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { CourseNavbar } from '@/components/CourseNavbar';
import { getAuthErrorMessage, isValidPassword, PASSWORD_REQUIREMENTS_TEXT } from '@/lib/auth';

import logoCreatr from '@/assets/logo-creatr365.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate('/dashboard');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

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
        toast({ title: 'สำเร็จ', description: 'เข้าสู่ระบบเรียบร้อยแล้ว' });
      } else {
        if (!isValidPassword(password)) {
          throw new Error(PASSWORD_REQUIREMENTS_TEXT);
        }

        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: 'สำเร็จ', description: 'สร้างบัญชีเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลและกดยืนยันก่อนเข้าสู่ระบบ' });
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
      <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-16">
        <SEOHead 
          title={isLogin ? 'เข้าสู่ระบบ - Creatr365' : 'สมัครสมาชิก - Creatr365'}
          description="เข้าสู่ระบบเพื่อเริ่มเรียนกับ Creatr365"
        />
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
            <div>
              <Input type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" minLength={8} />
              <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                <p className="ml-1 text-muted-foreground">{PASSWORD_REQUIREMENTS_TEXT}</p>
                {isLogin && (
                  <button type="button" onClick={handleForgotPassword} disabled={loading} className="shrink-0 text-foreground/70 hover:text-foreground transition-opacity disabled:opacity-50">
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full h-12 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-all disabled:opacity-50">
              {loading ? 'กำลังดำเนินการ...' : isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <button onClick={() => setIsLogin(!isLogin)} className="hover:text-foreground transition-colors">
              {isLogin ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
