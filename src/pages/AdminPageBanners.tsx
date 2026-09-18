import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeFileName, resolveContentType } from '@/lib/uploadFile';
import { Upload, Save, Image as ImageIcon, Video, X } from 'lucide-react';

interface Banner {
  page_key: string;
  image_url: string | null;
  video_url: string | null;
}

const PAGES: { key: string; label: string; accent: string }[] = [
  { key: 'toolbox', label: 'Toolbox', accent: '#4A7FB5' },
  { key: 'ai-lab', label: 'AI Lab', accent: '#6AAA7A' },
  { key: 'creator-tools', label: 'Creator Tools', accent: '#B87333' },
];

const AdminPageBanners: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Record<string, Banner>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await supabase.from('page_banners').select('page_key,image_url,video_url');
    const byKey: Record<string, Banner> = {};
    (data as Banner[] | null || []).forEach(b => { byKey[b.page_key] = b; });
    PAGES.forEach(p => { if (!byKey[p.key]) byKey[p.key] = { page_key: p.key, image_url: null, video_url: null }; });
    setBanners(byKey);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (key: string, patch: Partial<Banner>) =>
    setBanners(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const uploadMedia = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingKey(key);
    try {
      const path = `page-banners/${key}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from('course-media').upload(path, file, {
        upsert: false,
        contentType: resolveContentType(file),
      });
      if (error) { alert('อัปโหลดไม่สำเร็จ: ' + error.message); return; }
      const { data } = supabase.storage.from('course-media').getPublicUrl(path);
      const isVideo = file.type.startsWith('video/');
      set(key, isVideo ? { video_url: data.publicUrl, image_url: null } : { image_url: data.publicUrl, video_url: null });
    } finally {
      setUploadingKey(null);
    }
  };

  const save = async (key: string) => {
    setSavingKey(key);
    try {
      const b = banners[key];
      const { error } = await supabase.from('page_banners').upsert({
        page_key: key, image_url: b.image_url || null, video_url: b.video_url || null,
      });
      if (error) { alert('บันทึกไม่สำเร็จ: ' + error.message); return; }
      setMsg(`บันทึก ${PAGES.find(p => p.key === key)?.label} เรียบร้อย`);
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setSavingKey(null);
    }
  };

  const clear = (key: string) => set(key, { image_url: null, video_url: null });

  return (
    <AdminLayout
      title="Banner หน้า Explore"
      eyebrow="Explore"
      onSignOut={() => supabase.auth.signOut().then(() => navigate('/auth'))}
    >
      <p className="text-white/30 text-xs mb-6">
        รูปหรือวิดีโอที่แสดงเป็น header ด้านบนของหน้า Toolbox / AI Lab / Creator Tools — เว้นว่างได้ ถ้าไม่ตั้งค่า หน้านั้นจะแสดงแบบข้อความล้วนเหมือนปัจจุบัน
      </p>

      {msg && (
        <div className="mb-4 p-3 rounded-xl bg-[#34A853]/15 border border-[#34A853]/25 text-[#34A853] text-sm">{msg}</div>
      )}

      {loading ? (
        <div className="text-white/30 text-sm py-12 text-center">กำลังโหลด...</div>
      ) : (
        <div className="space-y-4">
          {PAGES.map(p => {
            const b = banners[p.key];
            const media = b?.video_url || b?.image_url;
            return (
              <div key={p.key} className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-5" style={{ borderTopColor: p.accent, borderTopWidth: 3 }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">{p.label}</h3>
                  <span className="text-[10px] font-mono text-white/30">/{p.key}</span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-40 aspect-[16/9] rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center">
                    {b?.video_url ? (
                      <video src={b.video_url} muted className="w-full h-full object-cover" />
                    ) : b?.image_url ? (
                      <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-white/20" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-white/60 hover:text-white text-xs cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingKey === p.key ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป/วิดีโอ'}
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={e => uploadMedia(p.key, e)} disabled={uploadingKey === p.key} />
                      </label>
                      {media && (
                        <button onClick={() => clear(p.key)} className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-white/30 hover:text-[#CC0033] text-xs">
                          <X className="w-3.5 h-3.5" /> ล้าง
                        </button>
                      )}
                    </div>
                    <p className="text-white/20 text-[11px] flex items-center gap-1.5">
                      {b?.video_url ? <><Video className="w-3 h-3" /> วิดีโอ</> : b?.image_url ? <><ImageIcon className="w-3 h-3" /> รูปภาพ</> : 'ยังไม่ได้ตั้งค่า'}
                    </p>
                    <button
                      onClick={() => save(p.key)}
                      disabled={savingKey === p.key}
                      className="self-start flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#D4A843] text-black disabled:opacity-40 hover:opacity-90 transition-opacity mt-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingKey === p.key ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPageBanners;
