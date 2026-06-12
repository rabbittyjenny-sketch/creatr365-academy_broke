import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowLeft, Save, X, ExternalLink } from 'lucide-react';

interface Article {
  id: string; slug: string; title: string; summary: string; body: string | null;
  cover_image_url: string | null; kind: string; author: string | null;
  tags: string[] | null; meta_description: string | null; target_url: string;
  is_active: boolean; sort_order: number; created_at: string;
}

const KINDS = ['blog', 'news', 'update', 'tool', 'community', 'quiz'];
const EMPTY: Partial<Article> = {
  title: '', slug: '', summary: '', body: '', cover_image_url: '',
  kind: 'blog', author: 'CREATR365 Team', tags: [], meta_description: '',
  target_url: '', is_active: true, sort_order: 0,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9ก-๙\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

/* ─── Editor modal ─────────────────────────────────────── */
const ArticleEditor: React.FC<{
  initial: Partial<Article> | null;
  onSave: (data: Partial<Article>) => Promise<void>;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Article>>(initial ?? EMPTY);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState((initial?.tags || []).join(', '));

  const set = (k: keyof Article, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleTitle = (v: string) => {
    set('title', v);
    if (!initial?.id) set('slug', slugify(v));
  };

  const handleSave = async () => {
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    await onSave({ ...form, tags });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111] border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">{initial?.id ? 'แก้ไขบทความ' : 'สร้างบทความใหม่'}</h2>
          <div className="flex gap-2">
            <button onClick={() => setPreview(!preview)} className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/50 hover:text-white transition-colors flex items-center gap-1">
              <Eye className="w-3 h-3" /> {preview ? 'Editor' : 'Preview'}
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {preview ? (
          <div className="p-6">
            <p className="text-[10px] text-white/30 mb-4 uppercase tracking-widest">Preview</p>
            {form.cover_image_url && <img src={form.cover_image_url} alt="" className="w-full rounded-xl mb-4 max-h-48 object-cover opacity-70" />}
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/25 uppercase">{form.kind}</span>
            <h1 className="text-2xl font-bold text-white mt-3 mb-2">{form.title || '(ชื่อบทความ)'}</h1>
            <p className="text-white/50 text-sm mb-6">{form.summary}</p>
            {form.body && (
              <div className="text-white/70 text-sm leading-relaxed article-body" dangerouslySetInnerHTML={{ __html: form.body }} />
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs text-white/40 font-medium block mb-1">ชื่อบทความ *</label>
              <input
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                placeholder="ชื่อบทความ..."
                value={form.title || ''}
                onChange={e => handleTitle(e.target.value)}
              />
            </div>
            {/* Slug */}
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
            {/* Kind + Author row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">ประเภท (Kind)</label>
                <select
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                  value={form.kind || 'blog'}
                  onChange={e => set('kind', e.target.value)}
                >
                  {KINDS.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">ผู้เขียน</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                  value={form.author || ''}
                  onChange={e => set('author', e.target.value)}
                />
              </div>
            </div>
            {/* Summary */}
            <div>
              <label className="text-xs text-white/40 font-medium block mb-1">สรุปย่อ / Excerpt *</label>
              <textarea
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20 resize-none"
                rows={3}
                placeholder="สรุปเนื้อหาบทความ 1-2 ประโยค..."
                value={form.summary || ''}
                onChange={e => set('summary', e.target.value)}
              />
            </div>
            {/* Body */}
            <div>
              <label className="text-xs text-white/40 font-medium block mb-1">
                เนื้อหาบทความ (HTML) — ใส่เนื้อหาเต็มที่นี่
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
            {/* External URL */}
            <div>
              <label className="text-xs text-white/40 font-medium block mb-1">External URL (ถ้าลิ้งค์ไปภายนอก)</label>
              <input
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                placeholder="https://..."
                value={form.target_url || ''}
                onChange={e => set('target_url', e.target.value)}
              />
            </div>
            {/* Cover image */}
            <div>
              <label className="text-xs text-white/40 font-medium block mb-1">URL รูปปก</label>
              <input
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                placeholder="https://..."
                value={form.cover_image_url || ''}
                onChange={e => set('cover_image_url', e.target.value)}
              />
            </div>
            {/* Tags + Sort + Active row */}
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
            {/* Meta description */}
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
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#111] border-t border-white/8 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white transition-colors">ยกเลิก</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title || !form.slug}
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Partial<Article> | null | false>(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('articles').select('*').order('sort_order');
    setArticles((data as unknown as Article[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    load();
    return () => document.documentElement.classList.remove('dark');
  }, [load]);

  const handleSave = async (form: Partial<Article>) => {
    if (form.id) {
      const { id, created_at, ...rest } = form as Article;
      await supabase.from('articles').update(rest).eq('id', id);
      setMsg('อัปเดตบทความเรียบร้อย');
    } else {
      await supabase.from('articles').insert([{ ...form, target_url: form.target_url || '/' }]);
      setMsg('สร้างบทความใหม่เรียบร้อย');
    }
    setEditing(false);
    load();
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleActive = async (a: Article) => {
    await supabase.from('articles').update({ is_active: !a.is_active }).eq('id', a.id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบบทความนี้?')) return;
    await supabase.from('articles').delete().eq('id', id);
    load();
  };

  return (
    <>
      <CourseNavbar />
      <main className="bg-[#080808] min-h-screen pt-24 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin/courses" className="text-white/30 hover:text-white/60 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">Admin</span>
                <h1 className="text-2xl font-bold text-white">จัดการบทความ</h1>
              </div>
            </div>
            <button
              onClick={() => setEditing(EMPTY)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4A843] text-black hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> บทความใหม่
            </button>
          </div>

          {msg && (
            <div className="mb-4 p-3 rounded-xl bg-[#34A853]/15 border border-[#34A853]/25 text-[#34A853] text-sm">{msg}</div>
          )}

          {/* Table */}
          {loading ? (
            <div className="text-white/30 text-sm py-12 text-center">กำลังโหลด...</div>
          ) : (
            <div className="rounded-2xl border border-white/8 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#111] border-b border-white/8">
                    <th className="text-left px-5 py-3 text-white/30 text-xs font-semibold tracking-widest uppercase">ชื่อบทความ</th>
                    <th className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase hidden md:table-cell">ประเภท</th>
                    <th className="text-center px-4 py-3 text-white/30 text-xs font-semibold uppercase hidden sm:table-cell">สถานะ</th>
                    <th className="text-right px-5 py-3 text-white/30 text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {articles.map(a => (
                    <tr key={a.id} className="bg-[#0D0D0D] hover:bg-[#131313] transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-white font-medium text-sm line-clamp-1">{a.title}</p>
                        <p className="text-white/30 text-xs mt-0.5 font-mono">/articles/{a.slug}</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/8 text-white/50 uppercase">{a.kind}</span>
                      </td>
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${a.is_active ? 'text-[#34A853]' : 'text-white/30'}`}>
                          {a.is_active ? '● เผยแพร่' : '○ ฉบับร่าง'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {a.body && (
                            <a href={`/articles/${a.slug}`} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button onClick={() => toggleActive(a)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                            {a.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setEditing(a)} className="p-1.5 rounded-lg text-white/30 hover:text-[#D4A843] hover:bg-[#D4A843]/10 transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-white/30 hover:text-[#CC0033] hover:bg-[#CC0033]/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {articles.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-12 text-white/20">ยังไม่มีบทความ — กด "+ บทความใหม่" เพื่อเริ่ม</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {/* Admin nav */}
          <div className="mt-8 flex gap-4 text-xs text-white/25">
            <Link to="/admin/courses" className="hover:text-white/50 transition-colors">จัดการคอร์ส</Link>
            <Link to="/admin/payments" className="hover:text-white/50 transition-colors">การชำระเงิน</Link>
            <Link to="/admin/assignments" className="hover:text-white/50 transition-colors">งานที่ส่งมา</Link>
          </div>
        </div>
      </main>

      {editing !== false && (
        <ArticleEditor
          initial={editing}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
};
export default AdminArticles;
