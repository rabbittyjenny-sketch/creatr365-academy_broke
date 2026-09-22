export const PASSWORD_REQUIREMENTS_TEXT = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และต้องมีตัวอักษรภาษาอังกฤษ 1 ตัวกับตัวเลข 1 ตัว';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const isValidPassword = (password: string) => passwordPattern.test(password);

export const getAuthErrorMessage = (error: { message?: string } | null | undefined) => {
  const message = error?.message?.toLowerCase() ?? '';

  if (message.includes('invalid login credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีนี้ยังไม่ได้ยืนยันอีเมล';
  }

  if (message.includes('email not confirmed')) {
    return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
  }

  if (message.includes('password should be at least')) {
    return PASSWORD_REQUIREMENTS_TEXT;
  }

  if (message.includes('user already registered')) {
    return 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบหรือลองรีเซ็ตรหัสผ่าน';
  }

  return error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
};