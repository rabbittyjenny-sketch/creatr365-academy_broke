import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useDarkPage } from '@/hooks/useDarkPage';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { ToolboxDownloadConsentDialog } from '@/components/ToolboxDownloadConsentDialog';

interface ToolboxAsset {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image_url: string | null;
  file_path: string;
  file_name: string | null;
  file_type: string | null;
  download_count: number;
}

// Free-text category, same convention as course_resources.resource_type —
// these are quick-pick presets for the admin form and filter chips here,
// not an enum. A new value typed in admin just shows up as its own chip.
const CATEGORY_LABELS: Record<string, string> = {
  template: 'เทมเพลต',
  document: 'ไฟล์เอกสาร',
  graphic: 'รูปภาพ/กราฟิก',
  downloadable: 'ดาวน์โหลดทั่วไป',
};
const categoryLabel = (c: string) => CATEGORY_LABELS[c] || c;

const AGE_RANGES = ['ต่ำกว่า 18', '18-24', '25-34', '35-44', '45-54', '55+'];

async function ensureStudentId(email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('ensure_master_student_account', { _email: email });
  if (error) { console.error('ensure_master_student_account failed', error); return null; }
  return typeof data === 'string' && data.trim() ? data.trim() : null;
}

const Toolbox: React.FC = () => {
  useDarkPage();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<ToolboxAsset[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ gender: string | null; age_range: string | null; occupation: string | null; line_user_id?: string | null } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pendingAsset, setPendingAsset] = useState<ToolboxAsset | null>(null);
  const [form, setForm] = useState({ gender: '', age_range: '', occupation: '' });
  const [saving, setSaving] = useState(false);
  // Which assets this user already accepted the free-file license for —
  // ToolboxDownloadConsentDialog only needs to show once per asset, same
  // "ask once, log every time" pattern as DownloadConsentDialog uses for
  // course resources (see consentedResourceIds in Dashboard.tsx).
  const [consentedAssetIds, setConsentedAssetIds] = useState<Set<string>>(new Set());
  const [pendingConsentAsset, setPendingConsentAsset] = useState<ToolboxAsset | null>(null);
  const [pendingConsentDemo, setPendingConsentDemo] = useState<{ gender: string; age_range: string; occupation: string } | null>(null);

  useEffect(() => {
    supabase
      .from('toolbox_assets')
      .select('id,title,description,category,cover_image_url,file_path,file_name,file_type,download_count')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setAssets((data as unknown as ToolboxAsset[]) || []));

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        supabase.from('profiles').select('gender,age_range,occupation,line_user_id')
          .eq('user_id', session.user.id).maybeSingle()
          .then(({ data }) => setProfile(data || null));
        supabase.from('toolbox_downloads').select('asset_id')
          .eq('user_id', session.user.id).eq('consented', true)
          .then(({ data }) => setConsentedAssetIds(new Set((data || []).map(d => d.asset_id))));
      }
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set(assets.map(a => a.category));
    return Array.from(set);
  }, [assets]);

  const filtered = useMemo(() => (
    activeCategory === 'all' ? assets : assets.filter(a => a.category === activeCategory)
  ), [assets, activeCategory]);

  const needsProfileInfo = (p: typeof profile) => !p || !p.gender || !p.age_range || !p.occupation;

  const resolveStudentId = async (u: { id: string; email?: string }, p: typeof profile): Promise<string | null> => {
    if (p?.line_user_id) {
      const { data } = await supabase.from('user_accounts').select('student_id').eq('line_user_id', p.line_user_id).maybeSingle();
      if (data?.student_id) return data.student_id;
    }
    if (u.email) {
      const { data } = await supabase.from('user_accounts').select('student_id').eq('email', u.email.toLowerCase()).maybeSingle();
      if (data?.student_id) return data.student_id;
      return ensureStudentId(u.email);
    }
    return null;
  };

  const performDownload = async (asset: ToolboxAsset, demo: { gender: string; age_range: string; occupation: string }) => {
    if (!user) return;
    setDownloadingId(asset.id);
    try {
      const { data, error } = await supabase.storage.from('toolbox-files').createSignedUrl(asset.file_path, 60);
      if (error || !data?.signedUrl) {
        console.error('createSignedUrl failed', error);
        alert('ดาวน์โหลดไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');

      const studentId = await resolveStudentId(user, profile);
      await supabase.from('toolbox_downloads').insert({
        asset_id: asset.id,
        user_id: user.id,
        student_id: studentId,
        gender: demo.gender || null,
        age_range: demo.age_range || null,
        occupation: demo.occupation || null,
        consented: true,
      });
      await supabase.rpc('increment_toolbox_download', { _asset_id: asset.id });
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, download_count: a.download_count + 1 } : a));
    } finally {
      setDownloadingId(null);
    }
  };

  // Free-file license consent (ToolboxDownloadConsentDialog) is a separate
  // gate from the one-time demographic form below — different purpose
  // (legal acceptance vs. business planning data), different wording, and
  // checked independently via consentedAssetIds so it's only asked once per
  // asset, not re-asked on every repeat download of the same file.
  const proceedToDownload = (asset: ToolboxAsset, demo: { gender: string; age_range: string; occupation: string }) => {
    if (consentedAssetIds.has(asset.id)) {
      performDownload(asset, demo);
      return;
    }
    setPendingConsentDemo(demo);
    setPendingConsentAsset(asset);
  };

  const handleDownloadClick = (asset: ToolboxAsset) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent('/toolbox')}`);
      return;
    }
    if (needsProfileInfo(profile)) {
      setForm({
        gender: profile?.gender || '',
        age_range: profile?.age_range || '',
        occupation: profile?.occupation || '',
      });
      setPendingAsset(asset);
      return;
    }
    proceedToDownload(asset, {
      gender: profile?.gender || '',
      age_range: profile?.age_range || '',
      occupation: profile?.occupation || '',
    });
  };

  const submitProfileAndDownload = async () => {
    if (!user || !pendingAsset) return;
    if (!form.gender || !form.age_range || !form.occupation.trim()) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        gender: form.gender,
        age_range: form.age_range,
        occupation: form.occupation.trim(),
      }).eq('user_id', user.id);
      setProfile(prev => ({ ...(prev || { line_user_id: null }), ...form }));
      const asset = pendingAsset;
      setPendingAsset(null);
      proceedToDownload(asset, form);
    } finally {
      setSaving(false);
    }
  };

  const confirmLicenseAndDownload = async () => {
    if (!pendingConsentAsset || !pendingConsentDemo) return;
    const asset = pendingConsentAsset;
    const demo = pendingConsentDemo;
    setConsentedAssetIds(prev => new Set(prev).add(asset.id));
    setPendingConsentAsset(null);
    setPendingConsentDemo(null);
    await performDownload(asset, demo);
  };

  const cancelLicenseConsent = () => {
    setPendingConsentAsset(null);
    setPendingConsentDemo(null);
  };

  return (
    <>
      <SEOHead title="Toolbox - Creatr365" description="เทมเพลต ไฟล์ และของฟรีให้ creator โหลดไปใช้งานได้ทันที" />
      <CourseNavbar />

      <section className="pt-28 pb-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground" aria-current="page">Toolbox</span>
          </nav>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3" data-accent="red">Toolbox</h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-xl">
            หยิบ template ไปใช้ต่อ แล้วกลับมาเรียนรู้ให้ลึกขึ้นเมื่อคุณพร้อม — ของฟรีทั้งหมด ล็อกอินเพื่อโหลด
          </p>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setActiveCategory('all')}
                className={`sharp-btn text-[11px] font-bold tracking-wide px-3 py-1.5 border ${activeCategory === 'all' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
              >
                ทั้งหมด
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`sharp-btn text-[11px] font-bold tracking-wide px-3 py-1.5 border ${activeCategory === c ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
                >
                  {categoryLabel(c)}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="sharp-tile border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              ยังไม่มีของให้โหลดในหมวดนี้ — กลับมาดูใหม่เร็ว ๆ นี้
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(asset => (
                <div key={asset.id} className="sharp-card border border-border bg-card overflow-hidden flex flex-col">
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {asset.cover_image_url ? (
                      <img src={asset.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center">
                        <FileText className="w-8 h-8 text-muted-foreground/40" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{categoryLabel(asset.category)}</span>
                      {asset.file_type && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground uppercase">{asset.file_type}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-base leading-tight mb-1">{asset.title}</h3>
                    {asset.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{asset.description}</p>
                    )}
                    <button
                      onClick={() => handleDownloadClick(asset)}
                      disabled={downloadingId === asset.id}
                      className="sharp-btn mt-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold tracking-wide px-4 py-2.5 bg-[#C0A060] text-[#0D0D0D] disabled:opacity-50"
                    >
                      {downloadingId === asset.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        : <Download className="w-3.5 h-3.5" aria-hidden="true" />}
                      ดาวน์โหลด
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* One-time demographic capture — asked once ever (saved to profile),
          not per download. Required fields keep the data usable for
          business planning without turning into a long form. */}
      {pendingAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true" aria-labelledby="toolbox-demo-title">
          <div className="sharp-tile bg-card border border-border max-w-sm w-full p-6 relative">
            <button
              onClick={() => setPendingAsset(null)}
              aria-label="ปิด"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 id="toolbox-demo-title" className="text-lg font-bold mb-1">ก่อนโหลดครั้งแรก</h2>
            <p className="text-xs text-muted-foreground mb-5">ขอข้อมูลเบื้องต้นแค่ครั้งเดียว ใช้เพื่อวางแผนพัฒนา Toolbox เท่านั้น</p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase block mb-1.5">เพศ</label>
                <div className="flex gap-2">
                  {['หญิง', 'ชาย', 'อื่น ๆ'].map(g => (
                    <button
                      key={g}
                      onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={`sharp-btn text-xs px-3 py-1.5 border flex-1 ${form.gender === g ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
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
                      onClick={() => setForm(f => ({ ...f, age_range: a }))}
                      className={`sharp-btn text-xs px-2.5 py-1.5 border ${form.age_range === a ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="toolbox-occupation" className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase block mb-1.5">อาชีพ</label>
                <input
                  id="toolbox-occupation"
                  value={form.occupation}
                  onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                  placeholder="เช่น ครีเอเตอร์, นักการตลาด, ฟรีแลนซ์"
                  className="w-full text-sm px-3 py-2 border border-border bg-background"
                />
              </div>
            </div>

            <button
              onClick={submitProfileAndDownload}
              disabled={saving || !form.gender || !form.age_range || !form.occupation.trim()}
              className="sharp-btn w-full mt-5 inline-flex items-center justify-center gap-1.5 text-sm font-bold tracking-wide px-4 py-3 bg-[#C0A060] text-[#0D0D0D] disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              บันทึกและดาวน์โหลด
            </button>
          </div>
        </div>
      )}

      <ToolboxDownloadConsentDialog
        open={pendingConsentAsset !== null}
        assetTitle={pendingConsentAsset?.title || ''}
        onConfirm={confirmLicenseAndDownload}
        onCancel={cancelLicenseConsent}
      />
    </>
  );
};

export default Toolbox;
