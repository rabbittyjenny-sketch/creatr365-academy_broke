import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { CourseNavbar } from '@/components/CourseNavbar';

const LOGO_URL = 'https://ik.imagekit.io/ideas365logo/LOGO_iDEAS365Black.png?updatedAt=1772818424343';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'สำเร็จ', description: 'เข้าสู่ระบบเรียบร้อยแล้ว' });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast({ title: 'สำเร็จ', description: 'สร้างบัญชีเรียบร้อยแล้ว กรุณาตรวจสอบอีเมล' });
      }
    } catch (error: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CourseNavbar />
      <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-16">
        <SEOHead 
          title={isLogin ? 'เข้าสู่ระบบ - iDEAS365' : 'สมัครสมาชิก - iDEAS365'}
          description="เข้าสู่ระบบเพื่อเริ่มเรียนกับ iDEAS365"
        />
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-block mb-6">
              <img src={LOGO_URL} alt="iDEAS365" className="h-10 w-auto mx-auto" />
            </Link>
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? 'เข้าสู่ระบบเพื่อเริ่มเรียน' : 'สร้างบัญชีเพื่อเริ่มต้นกับ iDEAS365'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
            <Input type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
            <button type="submit" disabled={loading} className="w-full h-12 bg-google-blue text-white rounded-full font-medium hover:opacity-90 transition-all disabled:opacity-50">
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
