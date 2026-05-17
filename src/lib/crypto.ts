/**
 * Client-side SHA-256 using Web Crypto API (built into all modern browsers)
 * ไม่ต้องติดตั้ง library เพิ่ม — ใช้ browser native API ได้เลย
 *
 * วิธีใช้: sha256(password + lineUserId)
 * เหตุผลที่ใส่ lineUserId เป็น salt: ป้องกัน rainbow table attack เบื้องต้น
 *
 * Production upgrade path:
 *   1. ส่ง sha256 hash ขึ้น server (เหมือนเดิม)
 *   2. Server re-hash ด้วย bcrypt/argon2 แล้วเก็บ bcrypt hash แทน
 *   3. อัปเดต hash_algorithm = 'bcrypt_server'
 *   4. Login: client ส่ง sha256 → server verify bcrypt(sha256, stored_hash)
 */
export async function sha256(message: string): Promise<string> {
  const encoded = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash password for storage: SHA-256(password + lineUserId)
 * lineUserId ทำหน้าที่เป็น per-user salt
 */
export async function hashPassword(password: string, lineUserId: string): Promise<string> {
  return sha256(password + lineUserId);
}

/**
 * ตรวจสอบความแข็งแกร่งของรหัสผ่าน (เหมือน rule ใน auth.ts)
 * อย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข
 */
export function isPasswordStrong(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

export const PASSWORD_HINT = "รหัสผ่านอย่างน้อย 8 ตัว ต้องมีทั้งตัวอักษรและตัวเลข";
