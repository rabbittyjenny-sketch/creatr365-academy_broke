/**
 * Profile fields — single source of truth.
 *
 * Profile.tsx (the form), Dashboard.tsx (the "complete your profile" nudge)
 * and the admin statistics all read these lists, so a label changed here
 * changes everywhere. Demographics for statistics are copied from `profiles`
 * by the database (content_views / toolbox_downloads triggers) — nothing in
 * the browser asks for them a second time.
 */

export const GENDERS = ['หญิง', 'ชาย', 'อื่น ๆ'] as const;
export const AGE_RANGES = ['ต่ำกว่า 18', '18-24', '25-34', '35-44', '45-54', '55+'] as const;

/** A fixed list keeps occupation countable; "อื่น ๆ" lets people type their own. */
export const OCCUPATIONS = [
  'ครีเอเตอร์ / อินฟลูเอนเซอร์',
  'โฮสต์ไลฟ์ / นักไลฟ์สด',
  'เจ้าของธุรกิจ / แบรนด์',
  'แม่ค้าออนไลน์ / ผู้ขายอิสระ',
  'นักการตลาด / ดิจิทัลมาร์เก็ตติ้ง',
  'พนักงานบริษัท',
  'ฟรีแลนซ์',
  'นักเรียน / นักศึกษา',
  'ข้าราชการ / รัฐวิสาหกิจ',
] as const;
export const OCCUPATION_OTHER = 'อื่น ๆ';

export const PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี',
  'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด',
  'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี',
  'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี',
  'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์',
  'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง',
  'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล',
  'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย',
  'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ',
  'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี',
] as const;
export const PROVINCE_ABROAD = 'ต่างประเทศ';

const THAI_NAME = /^[\u0E00-\u0E7F][\u0E00-\u0E7F\s.'-]*$/;
const EN_NAME = /^[A-Za-z][A-Za-z\s.'-]*$/;

export const isThaiName = (s: string) => THAI_NAME.test(s.trim());
export const isEnglishName = (s: string) => EN_NAME.test(s.trim());

export interface ProfileIdentity {
  display_name?: string | null;
  first_name_th?: string | null;
  last_name_th?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
  gender?: string | null;
  age_range?: string | null;
  occupation?: string | null;
  province?: string | null;
}

/** Columns to select when checking completeness. */
export const PROFILE_REQUIRED_SELECT =
  'display_name,first_name_th,last_name_th,first_name_en,last_name_en,gender,age_range,occupation,province';

/** Thai labels of required fields that are still empty or invalid. */
export function missingProfileFields(p: ProfileIdentity | null | undefined): string[] {
  const v = (x?: string | null) => (x ?? '').trim();
  const missing: string[] = [];
  if (!v(p?.first_name_th) || !isThaiName(v(p?.first_name_th))) missing.push('ชื่อจริง (ไทย)');
  if (!v(p?.last_name_th) || !isThaiName(v(p?.last_name_th))) missing.push('นามสกุล (ไทย)');
  if (!v(p?.first_name_en) || !isEnglishName(v(p?.first_name_en))) missing.push('ชื่อจริง (อังกฤษ)');
  if (!v(p?.last_name_en) || !isEnglishName(v(p?.last_name_en))) missing.push('นามสกุล (อังกฤษ)');
  if (!v(p?.display_name)) missing.push('ชื่อที่แสดงในระบบ');
  if (!v(p?.gender)) missing.push('เพศ');
  if (!v(p?.age_range)) missing.push('ช่วงอายุ');
  if (!v(p?.occupation)) missing.push('อาชีพ');
  if (!v(p?.province)) missing.push('จังหวัด');
  return missing;
}

export const isProfileComplete = (p: ProfileIdentity | null | undefined) => missingProfileFields(p).length === 0;

/** For statistics: anything not in the fixed list counts as "อื่น ๆ". */
export const occupationBucket = (o: string | null | undefined) =>
  !o ? 'ไม่ระบุ' : (OCCUPATIONS as readonly string[]).includes(o) ? o : OCCUPATION_OTHER;
