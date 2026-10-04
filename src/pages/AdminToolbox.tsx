import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Download, Upload, Image as ImageIcon } from 'lucide-react';
import { sanitizeFileName, resolveContentType } from '@/lib/uploadFile';

interface ToolboxAsset {
  id: string; title: string; description: string; category: string;
  cover_image_url: string | null; file_path: string; file_name: string | null;
  file_type: string | null; sort_order: number; is_active: boolean; download_count: number;
  pricing_type: 'free' | 'paid'; price_thb: number | null; promo_price_thb: number | null; paid_details: string | null;
}

/** Returns an error message, or null when the pricing fields are valid. */
function pricingError(f: Partial<ToolboxAsset>): string | null {
  if (f.pricing_type !== 'paid') return null;
  if (!f.price_thb || f.price_thb <= 0) return 'Premium ต้องมีราคามากกว่า 0 บาท';
  if (f.promo_price_thb != null && (f.promo_price_thb <= 0 || f.promo_price_thb >= f.price_thb)) {
    return 'ราคาโปรโมชันต้องมากกว่า 0 และน้อยกว่าราคาปกติ';
  }
  return null;
}

const CATEGORY_PRESETS = [
  { value: 'template', label: 'เทมเพลต (Templates)' },
  { value: 'document', label: 'ไฟล์เอกสาร (Documents)' },
  { value: 'graphic', label: 'รูปภาพ/กราฟิก (Graphics)' },
  { value: 'downloadable', label: 'ดาวน์โหลดทั่วไป (Downloadables)' },
];

const EMPTY: Partial<ToolboxAsset> = {
  title: '', description: '', category: 'downloadable', cover_image_url: '',
  file_path: '', file_name: '', file_type: '', sort_order: 0, is_active: true,
  pricing_type: 'free', price_thb: null, promo_price_thb: null, paid_details: '',
};

/* ─── Editor modal ─────────────────────────────────────── */
const AssetEditor: React.FC<{
  initial: Partial<ToolboxAsset> | null;
  onSave: (data: Partial<ToolboxAsset>) => Promise<void>;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<ToolboxAsset>>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const set = (k: keyof ToolboxAsset, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const path = `${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from('toolbox-covers').upload(path, file, {
        upsert: false,
        contentType: resolveContentType(file),
      });
      if (error) { alert('อัปโหลดรูปปกไม่สำเร็จ: ' + error.message); return; }
      const { data } = supabase.storage.from('toolbox-covers').getPublicUrl(path);
      set('cover_image_url', data.publicUrl);
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const path = `${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from('toolbox-files').upload(path, file, {
        upsert: false,
        contentType: resolveContentType(file),
      });
      if (error) { alert('อัปโหลดไฟล์ไม่สำเร็จ: ' + error.message); return; }
      set('file_path', path);
      set('file_name', file.name);
      set('file_type', (file.name.split('.').pop() || '').toUpperCase());
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="admin-modal-surface fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-[#111] border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">{initial?.id ? 'แก้ไขไฟล์ Toolbox' : 'เพิ่มไฟล์ Toolbox ใหม่'}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1">ชื่อ *</label>
            <input
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
              value={form.title || ''}
              onChange={e => set('title', e.target.value)}
              placeholder="เช่น เทมเพลต Caption สำหรับ Live"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 font-medium block mb-1">คำอธิบายสั้น</label>
            <textarea
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 resize-none"
              rows={2}
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="1 บรรทัด — หน้า Toolbox เน้นภาพ ไม่เน้นข้อความ"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 font-medium block mb-1">หมวดหมู่</label>
            <input
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
              list="toolbox-category-presets"
              value={form.category || ''}
              onChange={e => set('category', e.target.value)}
              placeholder="downloadable"
            />
            <datalist id="toolbox-category-presets">
              {CATEGORY_PRESETS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </datalist>
          </div>

          {/* Cover image */}
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1">รูปปก (แสดงบนการ์ดหน้า Toolbox)</label>
            <div className="flex items-center gap-3">
              {form.cover_image_url ? (
                <img src={form.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-white/15 grid place-items-center">
                  <ImageIcon className="w-5 h-5 text-white/20" />
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-white/60 hover:text-white text-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {uploadingCover ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปปก'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadCover} disabled={uploadingCover} />
              </label>
            </div>
          </div>

          {/* File */}
          <div>
            <label className="text-xs text-white/40 font-medium block mb-1">ไฟล์ที่ให้โหลด (เอกสาร/รูปภาพ/zip ฯลฯ) *</label>
            <div className="flex items-center gap-3">
              <span className="flex-1 text-xs text-white/50 truncate bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5">
                {form.file_name || 'ยังไม่ได้อัปโหลดไฟล์'}
              </span>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-white/60 hover:text-white text-xs cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5" />
                {uploadingFile ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}
                <input type="file" className="hidden" onChange={uploadFile} disabled={uploadingFile} />
              </label>
            </div>
            <p className="text-white/20 text-xs mt-1">ไฟล์อยู่ใน private bucket ผู้ใช้ต้องล็อกอินก่อน และถ้าเป็น Premium ต้องชำระเงินก่อนจึงจะโหลดได้</p>
          </div>

          {/* Free / Premium — the one switch that decides who can download.
              Enforced by the toolbox-files storage policy, not just this UI. */}
          <div className="border border-white/10 p-4 space-y-3">
            <div>
              <p className="text-xs text-white/40 font-medium mb-2">รูปแบบการให้ดาวน์โหลด</p>
              <div className="inline-flex border border-white/10" role="group" aria-label="รูปแบบการให้ดาวน์โหลด">
                {([['free', 'แจกฟรี'], ['paid', 'Premium (ชำระเงิน)']] as const).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={form.pricing_type === v}
                    onClick={() => set('pricing_type', v)}
                    className={`px-4 py-2 text-xs font-semibold transition-colors ${form.pricing_type === v
                      ? (v === 'paid' ? 'bg-[#D4A843] text-[#0D0D0D]' : 'bg-white/15 text-white')
                      : 'text-white/40 hover:text-white'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-white/25 text-xs mt-1.5">
                {form.pricing_type === 'paid'
                  ? 'ขายผ่าน Stripe เมื่อชำระแล้ว ไฟล์จะเข้าไปอยู่ในแดชบอร์ดผู้ซื้อ เมนู "เอกสาร" (ที่เดียวกับเอกสารหลักสูตร) ผู้ซื้อยังโหลดได้แม้ภายหลังจะซ่อนไฟล์นี้จาก Toolbox'
                  : 'ผู้ใช้ต้องล็อกอินก่อนจึงจะโหลดได้'}
              </p>
            </div>

            {form.pricing_type === 'paid' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 font-medium block mb-1">ราคาปกติ (บาท) *</label>
                    <input
                      type="number" min={1} inputMode="numeric"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                      value={form.price_thb ?? ''}
                      onChange={e => set('price_thb', e.target.value === '' ? null : Math.round(Number(e.target.value)))}
                      placeholder="290"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 font-medium block mb-1">ราคาโปรโมชัน (บาท)</label>
                    <input
                      type="number" min={1} inputMode="numeric"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                      value={form.promo_price_thb ?? ''}
                      onChange={e => set('promo_price_thb', e.target.value === '' ? null : Math.round(Number(e.target.value)))}
                      placeholder="ไม่บังคับ"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 font-medium block mb-1">รายละเอียดที่ผู้ซื้อเห็นก่อนชำระเงิน</label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 resize-none"
                    value={form.paid_details || ''}
                    onChange={e => set('paid_details', e.target.value)}
                    placeholder={'เช่น ไฟล์ Canva 12 หน้า + PDF คู่มือ\nใช้ได้ในธุรกิจของคุณเอง ห้ามขายต่อ'}
                  />
                </div>
                {pricingError(form) && <p className="text-xs text-[#FF6B7F]">{pricingError(form)}</p>}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 font-medium block mb-1">Sort Order</label>
              <input
                type="number"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                value={form.sort_order ?? 0}
                onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => set('is_active', !form.is_active)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-[#34A853]' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-white/50 text-sm">{form.is_active ? 'เผยแพร่แล้ว' : 'ซ่อนอยู่'}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#111] border-t border-white/8 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white transition-colors">ยกเลิก</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title || !form.file_path || !!pricingError(form)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#D4A843] text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main page ─────────────────────────────────────────── */
const AdminToolbox: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<ToolboxAsset[]>([]);
  const [editing, setEditing] = useState<Partial<ToolboxAsset> | null | false>(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), ok ? 3000 : 6000); };

  const load = useCallback(async () => {
    const { data } = await supabase.from('toolbox_assets').select('*').order('sort_order');
    setAssets((data as unknown as ToolboxAsset[]) || []);
    setLoading(false);
  }, []);

  // Auth + admin role are enforced centrally by <RequireAdmin> in App.tsx.
  useEffect(() => { load(); }, [load]);

  const handleSignOut = async () => {
    await fullSignOut();
    navigate('/auth');
  };

  const handleSave = async (form: Partial<ToolboxAsset>) => {
    if (!form.title || !form.file_path) return;
    const pErr = pricingError(form);
    if (pErr) { flash(pErr, false); return; }
    const isPaid = form.pricing_type === 'paid';
    const payload = {
      title: form.title, description: form.description ?? '', category: form.category || 'downloadable',
      cover_image_url: form.cover_image_url || null, file_path: form.file_path,
      file_name: form.file_name || null, file_type: form.file_type || null,
      sort_order: form.sort_order ?? 0, is_active: form.is_active ?? true,
      // Free items never keep stale price fields around.
      pricing_type: isPaid ? 'paid' : 'free',
      price_thb: isPaid ? form.price_thb ?? null : null,
      promo_price_thb: isPaid ? form.promo_price_thb ?? null : null,
      paid_details: isPaid ? (form.paid_details || '').trim() || null : null,
    };
    const { error } = form.id
      ? await supabase.from('toolbox_assets').update(payload).eq('id', form.id)
      : await supabase.from('toolbox_assets').insert([payload]);
    if (error) { flash('บันทึกไม่สำเร็จ: ' + error.message, false); return; }
    flash(form.id ? 'อัปเดตเรียบร้อย' : 'เพิ่มไฟล์ใหม่เรียบร้อย');
    setEditing(false);
    load();
  };

  const toggleActive = async (a: ToolboxAsset) => {
    const { error } = await supabase.from('toolbox_assets').update({ is_active: !a.is_active }).eq('id', a.id);
    if (error) flash('เปลี่ยนสถานะไม่สำเร็จ: ' + error.message, false);
    load();
  };

  const handleDelete = async (a: ToolboxAsset) => {
    if (!confirm(`ลบ "${a.title}"? ประวัติการดาวน์โหลดของไฟล์นี้จะถูกลบไปด้วย — ถ้าแค่ต้องการซ่อน ให้ใช้ปุ่มซ่อนแทน`)) return;
    const { error } = await supabase.from('toolbox_assets').delete().eq('id', a.id);
    if (error) {
      // toolbox_purchases.asset_id is ON DELETE RESTRICT: sold files keep their purchase records.
      flash(error.code === '23503'
        ? 'ลบไม่ได้เพราะมีผู้ซื้อไฟล์นี้แล้ว ใช้ปุ่มซ่อนแทน (ผู้ที่ซื้อแล้วจะยังมีประวัติการซื้อ)'
        : 'ลบไม่สำเร็จ: ' + error.message, false);
      return;
    }
    await supabase.storage.from('toolbox-files').remove([a.file_path]); // best-effort cleanup
    load();
  };

  return (
    <>
      <AdminLayout
        title="Toolbox"
        eyebrow="Explore"
        onSignOut={handleSignOut}
        actions={
          <button
            onClick={() => setEditing(EMPTY)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4A843] text-black hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> เพิ่มไฟล์ใหม่
          </button>
        }
      >
        {msg && (
          <div role="status" className={`mb-4 p-3 border text-sm ${msg.ok
            ? 'bg-[#34A853]/15 border-[#34A853]/25 text-[#34A853]'
            : 'bg-[#CC0033]/15 border-[#CC0033]/30 text-[#FF6B7F]'}`}>{msg.text}</div>
        )}

        {loading ? (
          <div className="text-white/30 text-sm py-12 text-center">กำลังโหลด...</div>
        ) : (
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111] border-b border-white/8">
                  <th className="text-left px-5 py-3 text-white/30 text-xs font-semibold tracking-widest uppercase">ชื่อ</th>
                  <th className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase hidden md:table-cell">หมวดหมู่</th>
                  <th className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase hidden sm:table-cell">รูปแบบ</th>
                  <th className="text-center px-4 py-3 text-white/30 text-xs font-semibold uppercase hidden sm:table-cell">ยอดโหลด</th>
                  <th className="text-center px-4 py-3 text-white/30 text-xs font-semibold uppercase hidden sm:table-cell">สถานะ</th>
                  <th className="text-right px-5 py-3 text-white/30 text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assets.map(a => (
                  <tr key={a.id} className="bg-[#0D0D0D] hover:bg-[#131313] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {a.cover_image_url ? (
                          <img src={a.cover_image_url} alt="" className="w-9 h-9 object-cover rounded-lg border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg border border-white/10 grid place-items-center shrink-0">
                            <ImageIcon className="w-3.5 h-3.5 text-white/20" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm line-clamp-1">{a.title}</p>
                          <p className="text-white/30 text-xs mt-0.5 truncate">{a.file_name || a.file_path}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/8 text-white/50 uppercase">{a.category}</span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      {a.pricing_type === 'paid' ? (
                        <span className="text-xs font-semibold text-[#D4A843]">
                          Premium ฿{(a.promo_price_thb ?? a.price_thb ?? 0).toLocaleString('th-TH')}
                        </span>
                      ) : (
                        <span className="text-xs text-white/40">แจกฟรี</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-white/50">
                        <Download className="w-3 h-3" /> {a.download_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${a.is_active ? 'text-[#34A853]' : 'text-white/30'}`}>
                        {a.is_active ? '● เผยแพร่' : '○ ซ่อนอยู่'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleActive(a)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                          {a.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditing(a)} className="p-1.5 rounded-lg text-white/30 hover:text-[#D4A843] hover:bg-[#D4A843]/10 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg text-white/30 hover:text-[#CC0033] hover:bg-[#CC0033]/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-white/20">ยังไม่มีไฟล์ — กด "+ เพิ่มไฟล์ใหม่" เพื่อเริ่ม</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminLayout>

      {editing !== false && (
        <AssetEditor
          initial={editing}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
};

export default AdminToolbox;
