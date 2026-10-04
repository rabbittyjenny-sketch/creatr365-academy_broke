import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useDarkPage } from '@/hooks/useDarkPage';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Loader2, ShoppingBag, Check, FolderOpen } from 'lucide-react';
import { ToolboxDownloadConsentDialog } from '@/components/ToolboxDownloadConsentDialog';
import { PageBanner } from '@/components/PageBanner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { goToLogin } from '@/lib/authRedirect';

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
  pricing_type: 'free' | 'paid';
  price_thb: number | null;
  promo_price_thb: number | null;
  paid_details: string | null;
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

const thb = (n: number) => `฿${n.toLocaleString('th-TH')}`;
const finalPrice = (a: ToolboxAsset) =>
  a.promo_price_thb && a.price_thb && a.promo_price_thb < a.price_thb ? a.promo_price_thb : (a.price_thb ?? 0);

async function ensureStudentId(email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('ensure_master_student_account', { _email: email });
  if (error) { console.error('ensure_master_student_account failed', error); return null; }
  return typeof data === 'string' && data.trim() ? data.trim() : null;
}

async function invokeError(error: unknown): Promise<string> {
  let msg = error instanceof Error ? error.message : String(error);
  try { const b = await (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.(); if (b?.error) msg = b.error; } catch { /* keep msg */ }
  return msg;
}

/**
 * /toolbox — free files and Premium files.
 *
 * Free files: sign in, then download here. Signed-out visitors go to /auth
 * and come straight back.
 * Premium files: this page only sells them (Stripe via toolbox-checkout,
 * same pattern as course checkout). After payment the buyer lands in
 * Dashboard › เอกสาร, where bought files sit next to course materials and
 * can be downloaded again any time — the same home course manuals use.
 * The toolbox-files storage policy refuses a Premium file to anyone without
 * a paid purchase row, so the Dashboard button is the only way in.
 * Demographics are never asked here: toolbox_downloads copies them from
 * profiles on the database side.
 */
const Toolbox: React.FC = () => {
  useDarkPage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [assets, setAssets] = useState<ToolboxAsset[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState<ToolboxAsset | null>(null);
  // License consent is asked once per asset, logged on every download.
  const [consentedAssetIds, setConsentedAssetIds] = useState<Set<string>>(new Set());
  const [pendingConsentAsset, setPendingConsentAsset] = useState<ToolboxAsset | null>(null);

  const loadOwned = async (uid: string) => {
    const { data } = await supabase.from('toolbox_purchases').select('asset_id').eq('user_id', uid).eq('status', 'paid');
    setOwnedIds(new Set((data || []).map(d => d.asset_id)));
  };

  useEffect(() => {
    supabase
      .from('toolbox_assets')
      .select('id,title,description,category,cover_image_url,file_path,file_name,file_type,download_count,pricing_type,price_thb,promo_price_thb,paid_details')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setAssets((data as unknown as ToolboxAsset[]) || []));

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      setUser({ id: session.user.id, email: session.user.email });
      supabase.from('profiles').select('line_user_id').eq('user_id', session.user.id).maybeSingle()
        .then(({ data }) => setLineUserId(data?.line_user_id ?? null));
      supabase.from('toolbox_downloads').select('asset_id')
        .eq('user_id', session.user.id).eq('consented', true)
        .then(({ data }) => setConsentedAssetIds(new Set((data || []).map(d => d.asset_id))));
      loadOwned(session.user.id);
    });
  }, []);

  // Cancelled checkout returns here (?purchase=<id>&status=cancelled).
  // A successful one returns to Dashboard › เอกสาร instead.
  useEffect(() => {
    if (!params.get('purchase')) return;
    if (params.get('status') === 'cancelled') {
      toast({ title: 'ยกเลิกการชำระเงินแล้ว', description: 'ยังไม่มีการตัดเงิน เลือกซื้อใหม่ได้ทุกเมื่อ' });
    }
    const next = new URLSearchParams(params);
    next.delete('purchase'); next.delete('status');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => Array.from(new Set(assets.map(a => a.category))), [assets]);
  const filtered = useMemo(() => (
    activeCategory === 'all' ? assets : assets.filter(a => a.category === activeCategory)
  ), [assets, activeCategory]);

  const resolveStudentId = async (u: { id: string; email?: string }): Promise<string | null> => {
    if (lineUserId) {
      const { data } = await supabase.from('user_accounts').select('student_id').eq('line_user_id', lineUserId).maybeSingle();
      if (data?.student_id) return data.student_id;
    }
    if (u.email) {
      const { data } = await supabase.from('user_accounts').select('student_id').eq('email', u.email.toLowerCase()).maybeSingle();
      if (data?.student_id) return data.student_id;
      return ensureStudentId(u.email);
    }
    return null;
  };

  const performDownload = async (asset: ToolboxAsset) => {
    if (!user) return;
    setBusyId(asset.id);
    try {
      // `download` makes the link save the file instead of opening a new tab
      // — new tabs are blocked in the LINE in-app browser and on iOS after an await.
      const { data, error } = await supabase.storage.from('toolbox-files')
        .createSignedUrl(asset.file_path, 60, { download: asset.file_name || true });
      if (error || !data?.signedUrl) {
        console.error('createSignedUrl failed', error);
        toast({
          title: 'ดาวน์โหลดไม่สำเร็จ',
          description: asset.pricing_type === 'paid' ? 'ยังไม่พบการซื้อไฟล์นี้ในบัญชีของคุณ' : 'ลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
        return;
      }
      // Demographics are filled by the database from profiles.
      await supabase.from('toolbox_downloads').insert({
        asset_id: asset.id,
        user_id: user.id,
        student_id: await resolveStudentId(user),
        consented: true,
      });
      await supabase.rpc('increment_toolbox_download', { _asset_id: asset.id });
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, download_count: a.download_count + 1 } : a));
      window.location.assign(data.signedUrl);
    } finally {
      setBusyId(null);
    }
  };

  const proceedToDownload = (asset: ToolboxAsset) => {
    if (consentedAssetIds.has(asset.id)) { performDownload(asset); return; }
    setPendingConsentAsset(asset);
  };

  const handleCardAction = (asset: ToolboxAsset) => {
    if (!user) { goToLogin(navigate, '/toolbox'); return; }
    if (asset.pricing_type === 'paid') {
      // Bought files are downloaded from Dashboard › เอกสาร, not here.
      if (ownedIds.has(asset.id)) navigate('/dashboard?section=resources');
      else setBuying(asset);
      return;
    }
    proceedToDownload(asset);
  };

  const startCheckout = async () => {
    if (!buying) return;
    const asset = buying;
    setBusyId(asset.id);
    try {
      const { data, error } = await supabase.functions.invoke('toolbox-checkout', { body: { action: 'create', assetId: asset.id } });
      if (error) throw new Error(await invokeError(error));
      if (data?.error) throw new Error(data.error);
      if (data?.alreadyOwned) {
        setOwnedIds(prev => new Set(prev).add(asset.id));
        setBuying(null);
        toast({ title: 'คุณซื้อไฟล์นี้แล้ว', description: 'ดาวน์โหลดได้ที่แดชบอร์ด เมนู "เอกสาร"' });
        return;
      }
      if (data?.url) window.location.href = data.url; // same tab: works in the LINE browser too
    } catch (e) {
      toast({ title: 'เริ่มชำระเงินไม่สำเร็จ', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const confirmLicenseAndDownload = async () => {
    if (!pendingConsentAsset) return;
    const asset = pendingConsentAsset;
    setConsentedAssetIds(prev => new Set(prev).add(asset.id));
    setPendingConsentAsset(null);
    await performDownload(asset);
  };

  return (
    <>
      <SEOHead title="Toolbox - Creatr365" description="เทมเพลตและไฟล์สำหรับ creator ทั้งแจกฟรีและ Premium" />
      <CourseNavbar />

      {/* One accent for the page (Toolbox = #4A7FB5, same as its Explore tile):
          without this, hover text/headings fell back to the site-wide red while
          the buttons were blue. */}
      <section
        className="section-accent pt-28 pb-20 px-4 bg-background"
        style={{ '--hover-accent': '#4A7FB5', '--section-accent': '#4A7FB5' } as React.CSSProperties}
      >
        <div className="max-w-6xl mx-auto">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground" aria-current="page">Toolbox</span>
          </nav>

          <PageBanner pageKey="toolbox" accent="#4A7FB5" />

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3">Toolbox</h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-xl">
            หยิบ template ไปใช้ต่อ แล้วกลับมาเรียนรู้ให้ลึกขึ้นเมื่อคุณพร้อม มีทั้งไฟล์แจกฟรีและไฟล์ Premium เข้าสู่ระบบก่อนดาวน์โหลด
          </p>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {['all', ...categories].map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`sharp-btn text-[11px] font-bold tracking-wide px-3 py-1.5 border ${activeCategory === c ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
                >
                  {c === 'all' ? 'ทั้งหมด' : categoryLabel(c)}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="sharp-tile border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              ยังไม่มีไฟล์ในหมวดนี้ กลับมาดูใหม่เร็ว ๆ นี้
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(asset => {
                const isPaid = asset.pricing_type === 'paid';
                const owned = ownedIds.has(asset.id);
                const price = finalPrice(asset);
                const hasPromo = isPaid && !!asset.promo_price_thb && price < (asset.price_thb ?? 0);
                const needsPurchase = isPaid && !owned;
                const ownedPremium = isPaid && owned;
                return (
                  <div key={asset.id} className="sharp-card border border-border bg-card overflow-hidden flex flex-col">
                    <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                      {asset.cover_image_url ? (
                        <img src={asset.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center">
                          <FileText className="w-6 h-6 text-muted-foreground/40" aria-hidden="true" />
                        </div>
                      )}
                      {isPaid && (
                        <span className="absolute top-2 left-2 text-[9px] font-bold tracking-wider px-1.5 py-0.5 bg-section-toolbox text-[#0D0D0D]">
                          PREMIUM
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">{categoryLabel(asset.category)}</span>
                        {asset.file_type && (
                          <span className="text-[8px] font-bold px-1 py-0.5 bg-muted text-muted-foreground uppercase">{asset.file_type}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{asset.title}</h3>
                      {asset.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">{asset.description}</p>
                      )}
                      {isPaid && (
                        <div className="flex items-baseline gap-1.5 mb-2">
                          {owned ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-section-toolbox">
                              <Check className="w-3 h-3" aria-hidden="true" /> ซื้อแล้ว
                            </span>
                          ) : (
                            <>
                              <span className="text-sm font-bold">{thb(price)}</span>
                              {hasPromo && <span className="text-[10px] text-muted-foreground line-through">{thb(asset.price_thb!)}</span>}
                            </>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleCardAction(asset)}
                        disabled={busyId === asset.id}
                        className={`sharp-btn mt-auto inline-flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-wide px-3 py-2 text-[#0D0D0D] disabled:opacity-50 ${needsPurchase ? 'bg-[#F0ECE4]' : 'bg-section-toolbox'}`}
                      >
                        {busyId === asset.id
                          ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                          : needsPurchase ? <ShoppingBag className="w-3 h-3" aria-hidden="true" />
                          : ownedPremium ? <FolderOpen className="w-3 h-3" aria-hidden="true" />
                          : <Download className="w-3 h-3" aria-hidden="true" />}
                        {needsPurchase ? `ซื้อ ${thb(price)}`
                          : ownedPremium ? 'ดาวน์โหลดที่แดชบอร์ด'
                          : user ? 'ดาวน์โหลด' : 'เข้าสู่ระบบเพื่อดาวน์โหลด'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Premium purchase confirmation */}
      <Dialog open={!!buying} onOpenChange={o => { if (!o) setBuying(null); }}>
        <DialogContent
          className="section-accent max-w-md rounded-none sm:rounded-none"
          style={{ '--hover-accent': '#4A7FB5', '--section-accent': '#4A7FB5' } as React.CSSProperties}
        >
          <DialogTitle>{buying?.title}</DialogTitle>
          <DialogDescription className="text-left space-y-3">
            <span className="block text-2xl font-bold text-foreground">
              {buying && thb(finalPrice(buying))}
              {buying && buying.promo_price_thb && finalPrice(buying) < (buying.price_thb ?? 0) && (
                <span className="ml-2 text-sm font-normal text-muted-foreground line-through">{thb(buying.price_thb!)}</span>
              )}
            </span>
            {buying?.paid_details && <span className="block whitespace-pre-line">{buying.paid_details}</span>}
            <span className="block text-xs">
              ชำระผ่าน Stripe เมื่อชำระสำเร็จ ไฟล์จะอยู่ในแดชบอร์ดของคุณ เมนู "เอกสาร" (ที่เดียวกับเอกสารประกอบหลักสูตร) ดาวน์โหลดซ้ำได้ทุกเมื่อ
            </span>
          </DialogDescription>
          <button
            onClick={startCheckout}
            disabled={!!busyId}
            className="sharp-btn w-full inline-flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-3 bg-section-toolbox text-[#0D0D0D] disabled:opacity-50"
          >
            {busyId ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ShoppingBag className="w-4 h-4" aria-hidden="true" />}
            ไปชำระเงิน
          </button>
        </DialogContent>
      </Dialog>

      <ToolboxDownloadConsentDialog
        open={pendingConsentAsset !== null}
        assetTitle={pendingConsentAsset?.title || ''}
        isPremium={pendingConsentAsset?.pricing_type === 'paid'}
        onConfirm={confirmLicenseAndDownload}
        onCancel={() => setPendingConsentAsset(null)}
      />
    </>
  );
};

export default Toolbox;
