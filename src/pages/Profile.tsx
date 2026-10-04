import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useDarkPage } from '@/hooks/useDarkPage';
import { sanitizeFileName, resolveContentType } from '@/lib/uploadFile';
import { Loader2, Check, User, Upload, Lock } from 'lucide-react';
import {
  GENDERS, AGE_RANGES, OCCUPATIONS, OCCUPATION_OTHER, PROVINCES, PROVINCE_ABROAD,
  isThaiName, isEnglishName, missingProfileFields,
} from '@/lib/profileFields';

/**
 * Student-facing account page.
 *
 * What's here and why:
 * - Avatar, display name, email — the baseline every mainstream account
 *   page carries (GitHub, Google, Discord all show exactly these three
 *   before anything else).
 * - Real names in Thai and English — printed on the Thai / English
 *   certificates. Locked once a completion record exists (DB trigger
 *   lock_certificate_names); after that only an admin can change them.
 * - Gender, age range, occupation, province — required, and the ONLY place
 *   they are collected. Live Notes / Toolbox statistics copy them from
 *   profiles on the database side; no other page asks for them again.
 *   Date of birth stays optional (statistics use age range).
 * - A member ID, shown under a plain, student-facing label ("รหัสสมาชิก"),
 *   never as "Master Key" — that term is internal/back-office only. This
 *   is the same identifier already used everywhere else (student_id), just
 *   named for a student audience here, with a short explanation of what
 *   it's for.
 *
 * What's deliberately NOT here: a password field. Password reset already
 * happens via emailed link from the login page (Supabase Auth's standard
 * flow) — a separate change-password form on this page would be a second,
 * redundant path to the same thing. Email changes go through
 * `supabase.auth.updateUser({ email })`, which requires confirming the new
 * address before it takes effect (Supabase Auth's own flow, not a raw
 * table write) — the same pattern GitHub/Google use for email changes:
 * never silently swapped, always confirmed at the new address first.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isSyntheticEmail = (email: string) => /^line_.+@line\.creatr365\.com$/i.test(email);

const Profile: React.FC = () => {
  useDarkPage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [occupationChoice, setOccupationChoice] = useState('');
  const [occupationOther, setOccupationOther] = useState('');
  const [province, setProvince] = useState('');
  const [firstNameTh, setFirstNameTh] = useState('');
  const [lastNameTh, setLastNameTh] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [namesLocked, setNamesLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate('/auth?redirect=/profile'); return; }

      setUserId(session.user.id);
      const email = session.user.email || '';
      setCurrentEmail(email);
      setEmailInput(isSyntheticEmail(email) ? '' : email);

      const [{ data: prof }, { data: acct }, { count: certCount }] = await Promise.all([
        supabase.from('profiles')
          .select('display_name,avatar_url,date_of_birth,gender,age_range,occupation,province,first_name_th,last_name_th,first_name_en,last_name_en')
          .eq('user_id', session.user.id).maybeSingle(),
        supabase.from('user_accounts').select('student_id,registered_at').eq('email', email.toLowerCase()).maybeSingle(),
        supabase.from('completion_records').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id),
      ]);
      const p = prof as {
        display_name: string | null; avatar_url: string | null; date_of_birth: string | null;
        gender: string | null; age_range: string | null; occupation: string | null; province: string | null;
        first_name_th: string | null; last_name_th: string | null; first_name_en: string | null; last_name_en: string | null;
      } | null;
      setDisplayName(p?.display_name || '');
      setAvatarUrl(p?.avatar_url || null);
      setDob(p?.date_of_birth || '');
      setGender(p?.gender || '');
      setAgeRange(p?.age_range || '');
      const occ = p?.occupation || '';
      if ((OCCUPATIONS as readonly string[]).includes(occ)) setOccupationChoice(occ);
      else if (occ) { setOccupationChoice(OCCUPATION_OTHER); setOccupationOther(occ); }
      setProvince(p?.province || '');
      setFirstNameTh(p?.first_name_th || '');
      setLastNameTh(p?.last_name_th || '');
      setFirstNameEn(p?.first_name_en || '');
      setLastNameEn(p?.last_name_en || '');
      setNamesLocked((certCount ?? 0) > 0);
      const acctRow = acct as { student_id: string; registered_at: string } | null;
      setStudentId(acctRow?.student_id ?? null);
      setRegisteredAt(acctRow?.registered_at ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  const emailNeedsReplacement = isSyntheticEmail(currentEmail);
  const emailChanged = emailInput.trim().toLowerCase() !== currentEmail.trim().toLowerCase();

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !userId) return;
    setUploadingAvatar(true);
    try {
      const path = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: false,
        contentType: resolveContentType(file),
      });
      if (upErr) { setError('อัปโหลดรูปไม่สำเร็จ: ' + upErr.message); return; }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: saveErr } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('user_id', userId);
      if (saveErr) { setError('บันทึกรูปไม่สำเร็จ: ' + saveErr.message); return; }
      setAvatarUrl(data.publicUrl);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setError(null);
    setSavedMessage(null);

    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      setError('กรุณากรอกอีเมลที่ถูกต้อง — ต้องมีอีเมลเสมออย่างน้อย 1 ช่องทางติดต่อ');
      return;
    }
    if (isSyntheticEmail(trimmedEmail)) {
      setError('กรุณาใช้อีเมลจริงของท่าน ไม่ใช่อีเมลที่ระบบสร้างให้อัตโนมัติ');
      return;
    }

    const occupation = occupationChoice === OCCUPATION_OTHER ? occupationOther.trim() : occupationChoice;
    const missing = missingProfileFields({
      display_name: displayName, first_name_th: firstNameTh, last_name_th: lastNameTh,
      first_name_en: firstNameEn, last_name_en: lastNameEn,
      gender, age_range: ageRange, occupation, province,
    });
    if (missing.length) {
      setError('กรุณากรอกให้ครบและถูกต้อง: ' + missing.join(', '));
      return;
    }

    setSaving(true);
    try {
      const update: Record<string, string | null> = {
        display_name: displayName.trim() || null,
        date_of_birth: dob || null,
        gender: gender || null,
        age_range: ageRange || null,
        occupation: occupation || null,
        province: province || null,
      };
      // Locked names are left out entirely, so saving other fields never
      // trips the database lock.
      if (!namesLocked) {
        update.first_name_th = firstNameTh.trim();
        update.last_name_th = lastNameTh.trim();
        update.first_name_en = firstNameEn.trim();
        update.last_name_en = lastNameEn.trim();
      }
      const { error: profErr } = await supabase.from('profiles').update(update).eq('user_id', userId);
      if (profErr) {
        if (profErr.message.includes('CERT_NAME_LOCKED')) {
          setNamesLocked(true);
          throw new Error('ชื่อนี้ใช้ออกใบประกาศแล้ว กรุณาติดต่อทีมงานเพื่อแก้ไข');
        }
        throw profErr;
      }

      if (emailChanged) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: trimmedEmail });
        if (emailErr) throw emailErr;
        setSavedMessage('บันทึกข้อมูลแล้ว — กรุณาตรวจอีเมลใหม่เพื่อยืนยันการเปลี่ยนแปลง');
      } else {
        setSavedMessage('บันทึกข้อมูลเรียบร้อยแล้ว');
      }
    } catch (e) {
      setError('บันทึกไม่สำเร็จ: ' + (e instanceof Error ? e.message : 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <CourseNavbar />
        <main className="max-w-2xl mx-auto px-4 py-24 flex justify-center">
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        </main>
      </>
    );
  }

  const fieldLabel = "text-[11px] font-bold tracking-wide text-muted-foreground uppercase block mb-1.5";
  const fieldInput = "w-full text-sm px-3 py-2 border border-border bg-background";
  const chipBtn = (active: boolean) =>
    `sharp-btn text-xs px-3 py-1.5 border ${active ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`;

  return (
    <>
      <SEOHead title="โปรไฟล์ - Creatr365" description="จัดการข้อมูลบัญชีผู้ใช้ Creatr365" />
      <CourseNavbar />

      <main className="max-w-2xl mx-auto px-4 py-6 pt-24 pb-24 space-y-5">
        <div className="mb-1">
          <h1 className="text-2xl font-bold" data-accent="red">โปรไฟล์</h1>
        </div>

        {/* Avatar + identity header */}
        <div className="sharp-card border border-border bg-card p-5 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-9 h-9 text-muted-foreground/40" aria-hidden="true" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center border-2 border-background disabled:opacity-50"
              aria-label="เปลี่ยนรูปโปรไฟล์"
            >
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg truncate">{displayName || 'ยังไม่ได้ตั้งชื่อที่แสดง'}</p>
            <p className="text-sm text-muted-foreground truncate">{currentEmail}</p>
            {registeredAt && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                สมาชิกตั้งแต่ {new Date(registeredAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Account: email + display name */}
        <div className="space-y-5 sharp-card border border-border bg-card p-5">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">บัญชี</p>

          <div>
            <label htmlFor="profile-email" className={fieldLabel}>
              อีเมล <span className="text-destructive">*</span>
            </label>
            {emailNeedsReplacement && (
              <p className="text-xs text-destructive mb-1.5">
                บัญชีนี้สมัครผ่าน LINE และยังไม่มีอีเมลจริง — กรุณากรอกอีเมลที่ติดต่อได้จริงเพื่อใช้กู้คืนบัญชีและรับการแจ้งเตือน
              </p>
            )}
            <input
              id="profile-email"
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="your@email.com"
              className={fieldInput}
            />
            <p className="text-[11px] text-muted-foreground/70 mt-1.5">
              เปลี่ยนอีเมลได้ตลอด — ระบบจะส่งลิงก์ยืนยันไปที่อีเมลใหม่ก่อนเปลี่ยนจริง (ยังใช้อีเมลเดิมได้จนกว่าจะกดยืนยัน)
            </p>
          </div>

          <div>
            <label htmlFor="profile-name" className={fieldLabel}>
              ชื่อที่แสดงในระบบ <span className="text-destructive">*</span>
            </label>
            <input
              id="profile-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="ชื่อที่แสดงในระบบ"
              className={fieldInput}
            />
          </div>

          <div>
            <label className={fieldLabel}>ลืมรหัสผ่าน?</label>
            <p className="text-xs text-muted-foreground">
              ไปที่หน้า{' '}
              <Link to="/auth" className="underline hover-shift" data-accent="red">เข้าสู่ระบบ</Link>{' '}
              แล้วกด "ลืมรหัสผ่าน" — ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลของท่าน
            </p>
          </div>
        </div>

        {/* Certificate names */}
        <div className="space-y-4 sharp-card border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ชื่อสำหรับใบประกาศ</p>
            {namesLocked && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="w-3 h-3" aria-hidden="true" /> ล็อกแล้ว
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
            {namesLocked
              ? 'ชื่อนี้ใช้ออกใบประกาศแล้ว หากต้องแก้ไขกรุณาติดต่อทีมงาน'
              : 'ใช้พิมพ์บนใบประกาศฉบับภาษาไทยและภาษาอังกฤษ กรอกตามบัตรประชาชนหรือพาสปอร์ต เมื่อออกใบประกาศแล้วจะแก้เองไม่ได้'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ['profile-fn-th', 'ชื่อจริง (ไทย)', firstNameTh, setFirstNameTh, 'สมชาย', isThaiName, 'ใช้อักษรไทย'],
              ['profile-ln-th', 'นามสกุล (ไทย)', lastNameTh, setLastNameTh, 'ใจดี', isThaiName, 'ใช้อักษรไทย'],
              ['profile-fn-en', 'First name (English)', firstNameEn, setFirstNameEn, 'Somchai', isEnglishName, 'ใช้อักษรอังกฤษ'],
              ['profile-ln-en', 'Last name (English)', lastNameEn, setLastNameEn, 'Jaidee', isEnglishName, 'ใช้อักษรอังกฤษ'],
            ] as const).map(([id, label, value, setter, ph, valid, hint]) => {
              const invalid = !!value.trim() && !valid(value);
              return (
                <div key={id}>
                  <label htmlFor={id} className={fieldLabel}>
                    {label} <span className="text-destructive">*</span>
                  </label>
                  <input
                    id={id}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={ph}
                    disabled={namesLocked}
                    aria-invalid={invalid}
                    className={`${fieldInput} disabled:opacity-60 ${invalid ? 'border-destructive' : ''}`}
                  />
                  {invalid && <p className="text-[11px] text-destructive mt-1">{hint}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal info */}
        <div className="space-y-4 sharp-card border border-border bg-card p-5">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ข้อมูลส่วนตัว</p>

          <div>
            <label htmlFor="profile-dob" className={fieldLabel}>วันเกิด (ไม่บังคับ)</label>
            <input
              id="profile-dob"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className={fieldInput}
            />
          </div>

          <div>
            <label className={fieldLabel}>เพศ <span className="text-destructive">*</span></label>
            <div className="flex gap-2">
              {GENDERS.map(g => (
                <button key={g} onClick={() => setGender(g)} className={`${chipBtn(gender === g)} flex-1`}>{g}</button>
              ))}
            </div>
          </div>

          <div>
            <label className={fieldLabel}>ช่วงอายุ <span className="text-destructive">*</span></label>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map(a => (
                <button key={a} onClick={() => setAgeRange(a)} className={chipBtn(ageRange === a)}>{a}</button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="profile-occupation" className={fieldLabel}>อาชีพ <span className="text-destructive">*</span></label>
            <select
              id="profile-occupation"
              value={occupationChoice}
              onChange={e => setOccupationChoice(e.target.value)}
              className={fieldInput}
            >
              <option value="">เลือกอาชีพ</option>
              {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
              <option value={OCCUPATION_OTHER}>อื่น ๆ (ระบุเอง)</option>
            </select>
            {occupationChoice === OCCUPATION_OTHER && (
              <input
                aria-label="ระบุอาชีพ"
                value={occupationOther}
                onChange={e => setOccupationOther(e.target.value)}
                placeholder="ระบุอาชีพของคุณ"
                className={`${fieldInput} mt-2`}
              />
            )}
          </div>

          <div>
            <label htmlFor="profile-province" className={fieldLabel}>จังหวัด <span className="text-destructive">*</span></label>
            <select
              id="profile-province"
              value={province}
              onChange={e => setProvince(e.target.value)}
              className={fieldInput}
            >
              <option value="">เลือกจังหวัด</option>
              {PROVINCES.map(pv => <option key={pv} value={pv}>{pv}</option>)}
              <option value={PROVINCE_ABROAD}>{PROVINCE_ABROAD}</option>
            </select>
          </div>
        </div>

        {/* Member ID */}
        {studentId && (
          <div className="sharp-card border border-border bg-card p-5">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1.5">รหัสสมาชิกของฉัน</p>
            <p className="text-base font-mono font-bold bg-muted border border-border inline-block px-3 py-1 rounded-md">{studentId}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
              รหัสนี้ผูกคอร์สและความคืบหน้าการเรียนของท่านไว้ในบัญชีเดียวกัน ไม่ว่าจะเข้าระบบผ่านอีเมลหรือ LINE —
              ใช้อ้างอิงเวลาติดต่อทีมงาน Creatr365 เท่านั้น ไม่ควรเผยแพร่ต่อสาธารณะ
              (ข้อมูลนี้เก็บไว้ภายในระบบเพื่อยืนยันตัวตนของท่าน ไม่ถูกเปิดเผยให้บุคคลภายนอก)
            </p>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        {savedMessage && (
          <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {savedMessage}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-brand sharp-btn w-full inline-flex items-center justify-center gap-1.5 text-sm font-bold tracking-wide px-4 py-3 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          บันทึกข้อมูล
        </button>

        <Link to="/dashboard" className="inline-block text-sm underline">กลับไปหน้า Dashboard</Link>
      </main>
      <Footer />
    </>
  );
};

export default Profile;
