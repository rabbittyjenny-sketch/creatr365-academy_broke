import { supabase } from '@/integrations/supabase/client';
import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID as string | undefined;

// ออกจากระบบทั้งฝั่ง Supabase (ทุกอุปกรณ์ — scope 'global' คือค่าเริ่มต้นของ
// signOut() อยู่แล้ว แต่ระบุไว้ชัดเจนกันสับสน) และฝั่ง LINE LIFF: ถ้าไม่เคลียร์
// สถานะล็อกอินของ LIFF ด้วย เวลาเปิดหน้าเว็บนี้อีกครั้งจากในแอป LINE ระบบจะ
// auto sign-in กลับเข้าบัญชีเดิมทันทีเพราะ liff.isLoggedIn() ยังเป็น true อยู่
export async function fullSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    console.error('fullSignOut: supabase signOut failed:', error.message);
  }

  if (LIFF_ID) {
    try {
      if (!liff.id) await liff.init({ liffId: LIFF_ID });
      if (liff.isLoggedIn()) liff.logout();
    } catch (err) {
      console.error('fullSignOut: liff logout failed:', err);
    }
  }
}
