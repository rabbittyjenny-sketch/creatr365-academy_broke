import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage, isValidPassword, PASSWORD_REQUIREMENTS_TEXT } from '@/lib/auth';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [canReset, setCanReset] = useState(window.location.hash.includes('type=recovery'));

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCanReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPassword(password)) {
      toast({ title: 'รหัสผ่านยังไม่ถูกต้อง', description: PASSWORD_REQUIREMENTS_TEXT, variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'รหัสผ่านไม่ตรงกัน', description: 'กรุณากรอกรหัสผ่านทั้งสองช่องให้ตรงกัน', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: 'เปลี่ยนรหัสผ่านแล้ว', description: 'ตอนนี้คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้' });
      navigate('/auth');
    } catch (error: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: getAuthErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="ตั้งรหัสผ่านใหม่ - Creatr365" description="ตั้งรหัสผ่านใหม่สำหรับบัญชี Creatr365" />
      <CourseNavbar />

      <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-20">
        <div className="card-water w-full max-w-md space-y-6 border border-border bg-card p-8 shadow-sm" data-accent="green">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground" data-accent="green">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-sm text-muted-foreground" data-accent="green">
              {canReset ? 'กรอกรหัสผ่านใหม่เพื่อกลับเข้าสู่ระบบ' : 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ'}
            </p>
          </div>

          {canReset && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  type="password"
                  placeholder="รหัสผ่านใหม่"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12 rounded-xl"
                />
                <p className="text-xs text-muted-foreground ml-1">{PASSWORD_REQUIREMENTS_TEXT}</p>
              </div>

              <Input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="h-12 rounded-xl"
              />

              <button type="submit" disabled={loading} data-accent="green" className="btn-brand w-full h-12 rounded-lg font-medium disabled:opacity-50">
                {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => navigate('/auth')}
            data-accent="green"
            className="w-full text-sm text-muted-foreground"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;