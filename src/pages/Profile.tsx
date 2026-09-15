import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useDarkPage } from '@/hooks/useDarkPage';
import { Loader2, Check } from 'lucide-react';

/**
 * Student-facing account page. Scope deliberately kept tight:
 *
 * - Only fields this codebase already collects elsewhere stay here
 *   (display name, gender/age_range/occupation — same fields + same
 *   pill-button UI as the Toolbox download-gate form in Toolbox.tsx, so
 *   the two forms don't drift into different conventions for the same
 *   data) plus email, which every account already has.
 * - No new sensitive personal data (no phone, ID number, address,
 *   payment info) — none of that is collected anywhere else in this
 *   system, and this page isn't the place to start.
 * - Email is required and enforced: a LINE sign-up gets a synthetic
 *   placeholder address (`line_<id>@line.creatr365.com`, set in
 *   supabase/functions/liff-auth/index.ts) that isn't reachable by the
 *   student — this page detects that pattern and blocks saving until a
 *   real address is entered. Changing to a new email goes through
 *   Supabase Auth's own `updateUser({ email })`, which requires
 *   confirmation before it takes effect — not a raw table write.
 */

const AGE_RANGES = ['ต่ำกว่า 18', '18-24', '25-34', '35-44', '45-54', '55+'];
const GENDERS = ['หญิง', 'ชาย', 'อื่น ๆ'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isSyntheticEmail = (email: string) => /^line_.+@line\.creatr365\.com$/i.test(email);

interface ProfileRow {
  display_name: string | null;
  gender: string | null;
  age_range: string | null;
  occupation: string | null;
}

const Profile: React.FC = () => {
  useDarkPage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [occupation, setOccupation] = useState('');
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

      const [{ data: prof }, { data: acct }] = await Promise.all([
        supabase.from('profiles').select('display_name,gender,age_range,occupation').eq('user_id', session.user.id).maybeSingle(),
        supabase.from('user_accounts').select('student_id').eq('email', email.toLowerCase()).maybeSingle(),
      ]);
      const p = prof as ProfileRow | null;
      setDisplayName(p?.display_name || '');
      setGender(p?.gender || '');
      setAgeRange(p?.age_range || '');
      setOccupation(p?.occupation || '');
      setStudentId((acct as { student_id: string } | null)?.student_id ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  const emailNeedsReplacement = isSyntheticEmail(currentEmail);
  const emailChanged = emailInput.trim().toLowerCase() !== currentEmail.trim().toLowerCase();

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

    setSaving(true);
    try {
      const { error: profErr } = await supabase.from('profiles').update({
        display_name: displayName.trim() || null,
        gender: gender || null,
        age_range: ageRange || null,
        occupation: occupation.trim() || null,
      }).eq('user_id', userId);
      if (profErr) throw profErr;

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

  return (
    <>
      <SEOHead title="โปรไฟล์ - Creatr365" description="จัดการข้อมูลบัญชีผู้ใช้ Creatr365" />
      <CourseNavbar />

      <main className="max-w-2xl mx-auto px-4 py-6 pt-24 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-accent="red">โปรไฟล์</h1>
          {studentId && (
            <p className="text-xs font-mono bg-muted border border-border inline-block px-2 py-0.5 rounded-md mt-2">{studentId}</p>
          )}
        </div>

        <div className="space-y-5 sharp-card border border-border bg-card p-5">
          <div>
            <label htmlFor="profile-email" className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase block mb-1.5">
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
              className="w-full text-sm px-3 py-2 border border-border bg-background"
            />
          </div>

          <div>
            <label htmlFor="profile-name" className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase block mb-1.5">ชื่อที่แสดง</label>
            <input
              id="profile-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="ชื่อที่แสดงในระบบ"
              className="w-full text-sm px-3 py-2 border border-border bg-background"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase block mb-1.5">เพศ</label>
            <div className="flex gap-2">
              {GENDERS.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`sharp-btn text-xs px-3 py-1.5 border flex-1 ${gender === g ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase block mb-1.5">ช่วงอายุ</label>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAgeRange(a)}
                  className={`sharp-btn text-xs px-2.5 py-1.5 border ${ageRange === a ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="profile-occupation" className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase block mb-1.5">อาชีพ</label>
            <input
              id="profile-occupation"
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
              placeholder="เช่น ครีเอเตอร์, นักการตลาด, ฟรีแลนซ์"
              className="w-full text-sm px-3 py-2 border border-border bg-background"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {savedMessage && (
            <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {savedMessage}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="sharp-btn w-full inline-flex items-center justify-center gap-1.5 text-sm font-bold tracking-wide px-4 py-3 bg-[#C0A060] text-[#0D0D0D] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            บันทึกข้อมูล
          </button>
        </div>

        <Link to="/dashboard" className="inline-block mt-5 text-sm underline">กลับไปหน้า Dashboard</Link>
      </main>
      <Footer />
    </>
  );
};

export default Profile;
