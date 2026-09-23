import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { resolveContentType } from '@/lib/uploadFile';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, ExternalLink, Upload } from 'lucide-react';

interface Article {
  id: string; slug: string; title: string; summary: string; body: string | null;
  cover_image_url: string | null; kind: string; author: string | null;
  tags: string[] | null; meta_description: string | null; target_url: string;
  is_active: boolean; sort_order: number; created_at: string;
}

interface EventRow {
  id: string; title: string; description: string; date: string; time: string;
  target_date: string; address: string; creator: string; background_image_url: string;
}

type ContentKind = 'blog' | 'video' | 'news' | 'update' | 'tool' | 'community' | 'quiz' | 'event';
type ContentRow = ({ _kind: 'article' } & Article) | ({ _kind: 'event' } & EventRow);

// The article kinds this page already managed, plus 'event' — one type
// selector covering everywhere content can display: Community (via the
// kind → GROUPS mapping in Articles.tsx), and now Events too, instead of
// a second, disconnected admin page for events.
const ARTICLE_KINDS: Exclude<ContentKind, 'event'>[] = ['blog', 'video', 'news', 'update', 'tool', 'community', 'quiz'];
const TYPE_LABEL: Record<ContentKind, string> = {
  blog: 'บทความ', video: 'วิดีโอ', news: 'ข่าวสาร', update: 'อัปเดต',
  tool: 'เครื่องมือ', community: 'คอมมูนิตี้', quiz: 'แบบทดสอบ', event: 'กิจกรรม',
};

// Form state is a loose union of both shapes so one editor component can
// drive either table — only the fields relevant to `_kind` are ever read
// back out when saving.
type EditorForm = { _kind: ContentKind; id?: string; created_at?: string } & Partial<Article> & Partial<EventRow>;

const EMPTY_ARTICLE: EditorForm = {
  _kind: 'blog', title: '', slug: '', summary: '', body: '', cover_image_url: '',
  author: 'CREATR365 Team', tags: [], meta_description: '', target_url: '',
  is_active: true, sort_order: 0,
};
const EMPTY_EVENT: EditorForm = {
  _kind: 'event', title: '', creator: '', description: '', date: '', time: '',
  address: '', target_date: '', background_image_url: '',
};

// A loaded row's `_kind` is the table it came from ('article' | 'event'),
// but the editor's `_kind` is the content type — for articles that's the
// row's own `kind` (blog, video, ...). Passing the row through unchanged
// made saving an edit overwrite every article's kind with "article", which
// drops it out of its Community/Articles group.
function toEditorForm(row: ContentRow): EditorForm {
  if (row._kind === 'event') return { ...row };
  return { ...row, _kind: (row.kind || 'blog') as ContentKind };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9ก-๙\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

/* ─── Editor modal ─────────────────────────────────────── */
const ContentEditor: React.FC<{
  initial: EditorForm | null;
  onSave: (data: EditorForm) => Promise<void>;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState<EditorForm>(initial ?? EMPTY_ARTICLE);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState((initial?.tags || []).join(', '));

  const isEditingExisting = !!initial?.id;
  const isEvent = form._kind === 'event';

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const pickType = (k: ContentKind) => {
    if (isEditingExisting) return; // switching table for an existing row isn't a simple update
    setForm(k === 'event' ? { ...EMPTY_EVENT } : { ...EMPTY_ARTICLE, kind: k, _kind: k });
  };

  const handleTitle = (v: string) => {
    set('title', v);
    if (!initial?.id && !isEvent) set('slug', slugify(v));
  };

  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, { upsert: true, contentType: resolveContentType(file) });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(fileName);
      set('background_image_url', publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    await onSave(isEvent ? form : { ...form, tags });
    setSaving(false);
  };

  const canSave = isEvent
    ? !!form.title && !!form.date
    : !!form.title && !!form.slug;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111] border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">{initial?.id ? 'แก้ไขเนื้อหา' : 'สร้างเนื้อหาใหม่'}</h2>
          <div className="flex gap-2">
            {!isEvent && (
              <button onClick={() => setPreview(!preview)} className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/50 hover:text-white transition-colors flex items-center gap-1">
                <Eye className="w-3 h-3" /> {preview ? 'Editor' : 'Preview'}
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Type selector — this + "display targets" below is the single
              form the whole content pipeline goes through, instead of one
              page for articles and a separate one for events. */}
          <div>
            <label className="text-xs text-white/40 font-medium block mb-2">ประเภทเนื้อหา — กำหนดว่าจะไปแสดงที่หน้าไหน</label>
            <div className="grid grid-cols-4 gap-2">
              {[...ARTICLE_KINDS, 'event' as const].map(k => (
                <button
                  key={k}
                  type="button"
                  disabled={isEditingExisting}
                  onClick={() => pickType(k)}
                  className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    form._kind === k
                      ? 'bg-[#D4A843] text-black border-[#D4A843]'
                      : 'bg-[#1a1a1a] text-white/50 border-white/10 hover:text-white'
                  }`}
                >
                  {TYPE_LABEL[k]}
                </button>
              ))}
            </div>
            {isEditingExisting && (
              <p className="text-white/20 text-xs mt-1.5">แก้ไขประเภทไม่ได้หลังสร้างแล้ว — ลบแล้วสร้างใหม่ถ้าต้องการเปลี่ยน</p>
            )}
          </div>

          {isEvent ? (
            <>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">ชื่อกิจกรรม *</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                  placeholder="ชื่อกิจกรรม..."
                  value={form.title || ''}
                  onChange={e => handleTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">ผู้จัด / วิทยากร</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                  value={form.creator || ''}
                  onChange={e => set('creator', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">รายละเอียด</label>
                <textarea
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 resize-none"
                  rows={4}
                  value={form.description || ''}
                  onChange={e => set('description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 font-medium block mb-1">วันที่ (แสดงผล) *</label>
                  <input
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                    placeholder="เช่น 2 ต.ค. 2569"
                    value={form.date || ''}
                    onChange={e => set('date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-medium block mb-1">เวลา</label>
                  <input
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                    placeholder="เช่น 13:00 น."
                    value={form.time || ''}
                    onChange={e => set('time', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">สถานที่</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                  value={form.address || ''}
                  onChange={e => set('address', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">วัน-เวลาจริงสำหรับนับถอยหลัง (ISO, เช่น 2026-10-02T13:00:00+07:00)</label>
                <input
                  type="datetime-local"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                  value={form.target_date ? form.target_date.slice(0, 16) : ''}
                  onChange={e => set('target_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">ภาพพื้นหลัง</label>
                {form.background_image_url && (
                  <img src={form.background_image_url} alt="" className="w-full h-32 object-cover mb-2 rounded-xl" />
                )}
                <label className="flex items-center gap-2 w-full bg-[#1a1a1a] border border-dashed border-white/15 rounded-xl px-4 py-3 text-white/40 text-sm cursor-pointer hover:text-white hover:border-white/30 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพ (JPG/PNG/GIF/WebP, สูงสุด 5MB)'}
                  <input type="file" accept="image/*" onChange={handleEventImageUpload} disabled={uploading} className="hidden" />
                </label>
              </div>
            </>
          ) : preview ? (
            <div>
              <p className="text-[10px] text-white/30 mb-4 uppercase tracking-widest">Preview</p>
              {form.cover_image_url && <img src={form.cover_image_url} alt="" className="w-full rounded-xl mb-4 max-h-48 object-cover opacity-70" />}
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/25 uppercase">{TYPE_LABEL[form._kind]}</span>
              <h1 className="text-2xl font-bold text-white mt-3 mb-2">{form.title || '(ชื่อเนื้อหา)'}</h1>
              <p className="text-white/50 text-sm mb-6">{form.summary}</p>
              {form.body && (
                <div className="text-white/70 text-sm leading-relaxed article-body" dangerouslySetInnerHTML={{ __html: form.body }} />
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">ชื่อเรื่อง *</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                  placeholder="ชื่อเนื้อหา..."
                  value={form.title || ''}
                  onChange={e => handleTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">Slug (URL) *</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#D4A843]/50"
                  placeholder="article-slug"
                  value={form.slug || ''}
                  onChange={e => set('slug', slugify(e.target.value))}
                />
                <p className="text-white/20 text-xs mt-1">URL: /articles/{form.slug || 'slug'}</p>
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">ผู้เขียน</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                  value={form.author || ''}
                  onChange={e => set('author', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">สรุปย่อ / Excerpt *</label>
                <textarea
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20 resize-none"
                  rows={3}
                  placeholder="สรุปเนื้อหา 1-2 ประโยค..."
                  value={form.summary || ''}
                  onChange={e => set('summary', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">
                  เนื้อหาเต็ม (HTML) — ใส่เนื้อหาเต็มที่นี่
                </label>
                <textarea
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#D4A843]/50 placeholder-white/15 resize-y"
                  rows={12}
                  placeholder={`<h2>หัวข้อ</h2>\n<p>เนื้อหา...</p>\n<ul>\n  <li>รายการ 1</li>\n</ul>`}
                  value={form.body || ''}
                  onChange={e => set('body', e.target.value)}
                />
                <p className="text-white/20 text-xs mt-1">รองรับ HTML tags: h1-h4, p, ul/ol/li, a, strong, em, blockquote, img</p>
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">External URL (ถ้าลิ้งค์ไปภายนอก)</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                  placeholder="https://..."
                  value={form.target_url || ''}
                  onChange={e => set('target_url', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">URL รูปปก</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                  placeholder="https://..."
                  value={form.cover_image_url || ''}
                  onChange={e => set('cover_image_url', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs text-white/40 font-medium block mb-1">Tags (คั่นด้วย ,)</label>
                  <input
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                    placeholder="live commerce, tips"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                  />
                </div>
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
                    <span className="text-white/50 text-sm">{form.is_active ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">Meta Description (SEO)</label>
                <textarea
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 resize-none"
                  rows={2}
                  placeholder="คำอธิบายสำหรับ Google (150-160 ตัวอักษร)"
                  value={form.meta_description || ''}
                  onChange={e => set('meta_description', e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#111] border-t border-white/8 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white transition-colors">ยกเลิก</button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
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
const AdminArticles: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [editing, setEditing] = useState<EditorForm | null | false>(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [{ data: articleData }, { data: eventData }] = await Promise.all([
      supabase.from('articles').select('*').order('sort_order'),
      supabase.from('events').select('*'),
    ]);
    const articleRows: ContentRow[] = ((articleData as unknown as Article[]) || [])
      .map(a => ({ _kind: 'article' as const, ...a }));
    const eventRows: ContentRow[] = ((eventData as unknown as EventRow[]) || [])
      .map(e => ({ _kind: 'event' as const, ...e }));
    setRows([...articleRows, ...eventRows]);
    setLoading(false);
  }, []);

  // Auth + admin role are enforced centrally by <RequireAdmin> in App.tsx —
  // this page only loads data once it's already known to be allowed here.
  useEffect(() => { load(); }, [load]);

  const handleSignOut = async () => {
    await fullSignOut();
    navigate('/auth');
  };

  if (loading) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" /></div>;
  }

  const handleSave = async (form: EditorForm) => {
    if (form._kind === 'event') {
      if (!form.title || !form.date) return;
      const payload = {
        title: form.title.trim(),
        creator: (form.creator ?? '').trim(),
        description: (form.description ?? '').trim(),
        date: (form.date ?? '').trim(),
        time: (form.time ?? '').trim(),
        address: (form.address ?? '').trim(),
        target_date: form.target_date ?? '',
        background_image_url: form.background_image_url ?? '',
      };
      if (form.id) {
        await supabase.from('events').update(payload).eq('id', form.id);
        setMsg('อัปเดตกิจกรรมเรียบร้อย');
      } else {
        await supabase.from('events').insert([payload]);
        setMsg('สร้างกิจกรรมใหม่เรียบร้อย');
      }
    } else {
      // Save button is disabled until title+slug are filled (see canSave in
      // ContentEditor), so both are guaranteed present here.
      if (!form.title || !form.slug) return;
      // Only article columns go to the articles table — the form type also
      // carries the event fields, which don't exist there.
      const payload = {
        title: form.title,
        slug: form.slug,
        summary: form.summary ?? '',
        body: form.body ?? null,
        cover_image_url: form.cover_image_url ?? null,
        author: form.author ?? null,
        tags: form.tags ?? null,
        meta_description: form.meta_description ?? null,
        target_url: form.target_url || '/',
        is_active: form.is_active ?? true,
        sort_order: form.sort_order ?? 0,
        kind: form._kind,
      };
      if (form.id) {
        await supabase.from('articles').update(payload).eq('id', form.id);
        setMsg('อัปเดตเนื้อหาเรียบร้อย');
      } else {
        await supabase.from('articles').insert([payload]);
        setMsg('สร้างเนื้อหาใหม่เรียบร้อย');
      }
    }
    setEditing(false);
    load();
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleActive = async (a: Article) => {
    await supabase.from('articles').update({ is_active: !a.is_active }).eq('id', a.id);
    load();
  };

  const handleDelete = async (row: ContentRow) => {
    if (!confirm(row._kind === 'event' ? 'ลบกิจกรรมนี้?' : 'ลบเนื้อหานี้?')) return;
    await supabase.from(row._kind === 'event' ? 'events' : 'articles').delete().eq('id', row.id);
    load();
  };

  return (
    <>
      <AdminLayout
        title="จัดการเนื้อหา"
        onSignOut={handleSignOut}
        actions={
          <button
            onClick={() => setEditing(EMPTY_ARTICLE)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4A843] text-black hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> สร้างเนื้อหาใหม่
          </button>
        }
      >
          {msg && (
            <div className="mb-4 p-3 rounded-xl bg-[#34A853]/15 border border-[#34A853]/25 text-[#34A853] text-sm">{msg}</div>
          )}

          {/* Table — articles and events together: one place to manage
              everything that goes out on the site, instead of articles
              here and events only editable (one at a time) on a separate
              page. */}
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111] border-b border-white/8">
                  <th className="text-left px-5 py-3 text-white/30 text-xs font-semibold tracking-widest uppercase">ชื่อ</th>
                  <th className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase hidden md:table-cell">ประเภท</th>
                  <th className="text-center px-4 py-3 text-white/30 text-xs font-semibold uppercase hidden sm:table-cell">สถานะ</th>
                  <th className="text-right px-5 py-3 text-white/30 text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map(row => (
                  <tr key={`${row._kind}-${row.id}`} className="bg-[#0D0D0D] hover:bg-[#131313] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-sm line-clamp-1">{row.title}</p>
                      <p className="text-white/30 text-xs mt-0.5 font-mono">
                        {row._kind === 'article' ? `/articles/${row.slug}` : `กิจกรรม · ${row.date || 'ยังไม่ระบุวันที่'}`}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/8 text-white/50 uppercase">
                        {TYPE_LABEL[row._kind === 'event' ? 'event' : (row.kind as ContentKind) || 'blog']}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      {row._kind === 'article' ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${row.is_active ? 'text-[#34A853]' : 'text-white/30'}`}>
                          {row.is_active ? '● เผยแพร่' : '○ ฉบับร่าง'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {row._kind === 'article' && (
                          <>
                            {row.body && (
                              <a href={`/articles/${row.slug}`} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button onClick={() => toggleActive(row)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                              {row.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                        {row._kind === 'event' && (
                          <a href={`/event/${row.id}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => setEditing(toEditorForm(row))} className="p-1.5 rounded-lg text-white/30 hover:text-[#D4A843] hover:bg-[#D4A843]/10 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg text-white/30 hover:text-[#CC0033] hover:bg-[#CC0033]/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-white/20">ยังไม่มีเนื้อหา — กด "+ สร้างเนื้อหาใหม่" เพื่อเริ่ม</td></tr>
                )}
              </tbody>
            </table>
          </div>
      </AdminLayout>

      {editing !== false && (
        <ContentEditor
          initial={editing}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
};
export default AdminArticles;
