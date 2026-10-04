import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { resolveContentType, sanitizeFileName } from '@/lib/uploadFile';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, ExternalLink, Upload, Users, BarChart3, Link2 } from 'lucide-react';
import { parseYouTubeId, youTubeThumb } from '@/lib/youtube';
import { LiveNoteStatsPanel } from '@/components/admin/LiveNoteStatsPanel';
import { LiveNoteLinkMenu } from '@/components/admin/LiveNoteLinkMenu';
import { EventFormFields } from '@/components/admin/EventFormFields';
import { validateEventForm } from '@/lib/events';
import { EventRegistrantsPanel } from '@/components/admin/EventRegistrantsPanel';

interface Article {
  id: string; slug: string; title: string; summary: string; body: string | null;
  cover_image_url: string | null; kind: string; author: string | null;
  tags: string[] | null; meta_description: string | null; target_url: string;
  is_active: boolean; sort_order: number; created_at: string;
  video_url: string | null; related_course_id: string | null; duration_label: string | null;
}

interface CourseOption { id: string; title: string; is_active: boolean }

interface EventRow {
  id: string; title: string; description: string; date: string; time: string;
  target_date: string; address: string; creator: string; background_image_url: string;
  is_published: boolean;
  ends_at: string | null; capacity: number | null;
  registration_opens_at: string | null; registration_closes_at: string | null;
  location_type: string; venue_name: string; map_url: string;
  price: number | null; early_bird_price: number | null; early_bird_until: string | null;
  price_note: string;
}

type ContentKind = 'blog' | 'video' | 'live_note' | 'news' | 'update' | 'tool' | 'community' | 'quiz' | 'event';
type ContentRow = ({ _kind: 'article' } & Article) | ({ _kind: 'event' } & EventRow);

// The article kinds this page already managed, plus 'event' — one type
// selector covering everywhere content can display: Community (via the
// kind → GROUPS mapping in Articles.tsx), and now Events too, instead of
// a second, disconnected admin page for events.
// 'live_note' = Live Notes on /courses (full knowledge clips, not courses).
// 'video' = activity / atmosphere / news clips on Community.
const ARTICLE_KINDS: Exclude<ContentKind, 'event'>[] = ['live_note', 'blog', 'video', 'news', 'update', 'tool', 'community', 'quiz'];
const isClipKind = (k: ContentKind) => k === 'video' || k === 'live_note';
const TYPE_LABEL: Record<ContentKind, string> = {
  blog: 'บทความ', video: 'คลิปกิจกรรม', live_note: 'Live Notes', news: 'ข่าวสาร', update: 'อัปเดต',
  tool: 'เครื่องมือ', community: 'คอมมูนิตี้', quiz: 'แบบทดสอบ', event: 'กิจกรรม',
};

const TYPE_GUIDE: Record<ContentKind, {
  target: string;
  url: string;
  media: string;
  required: string;
}> = {
  blog: {
    target: 'แสดงในหน้า Community > หมวดบทความ และเปิดอ่านเป็นหน้า /articles/:slug',
    url: '/articles/[slug]',
    media: 'แนะนำรูปปก 16:9 ขนาดอย่างน้อย 1600x900 ชื่อไฟล์: article-[slug]-cover.jpg',
    required: 'ชื่อเรื่อง, Slug, สรุปย่อ, เนื้อหา HTML',
  },
  video: {
    target: 'แสดงในหน้า Community > หมวดคลิปกิจกรรม (คลิปบรรยากาศ กิจกรรม ข่าว) เล่นในเว็บ ไม่ต้องล็อกอิน',
    url: 'เปิดเป็นหน้าต่างเล่นคลิปในหน้า /articles',
    media: 'ไม่ใส่รูปปกได้ ระบบใช้ภาพจาก YouTube ให้อัตโนมัติ',
    required: 'ชื่อเรื่อง, Slug, สรุปย่อ, YouTube URL',
  },
  live_note: {
    target: 'แสดงในหน้าหลักสูตร (/courses) ส่วน Live Notes ท้ายหน้า ต้องล็อกอินก่อนดู และเก็บสถิติผู้ชม',
    url: '/courses?note=[slug]&src=[แพลตฟอร์ม] ใช้ปุ่ม "ลิงก์" ในตารางคัดลอก',
    media: 'ไม่ใส่รูปปกได้ ระบบใช้ภาพจาก YouTube ให้อัตโนมัติ ถ้าใส่เอง แนะนำ 16:10',
    required: 'ชื่อเรื่อง, Slug, สรุปย่อ, YouTube URL (ตั้งเป็น Unlisted ได้) หลักสูตรที่เกี่ยวข้องไม่บังคับแต่แนะนำ',
  },
  news: {
    target: 'แสดงในหน้า Community > หมวดข่าวกิจกรรม',
    url: '/articles/[slug] หรือ external URL',
    media: 'แนะนำรูปปกข่าว 16:9 ชื่อไฟล์: news-[slug]-cover.jpg',
    required: 'ชื่อเรื่อง, Slug, สรุปย่อ',
  },
  update: {
    target: 'แสดงในหน้า Community > หมวดข่าวกิจกรรม',
    url: '/articles/[slug]',
    media: 'ใช้รูปปกได้แต่ไม่บังคับ ชื่อไฟล์: update-[slug]-cover.jpg',
    required: 'ชื่อเรื่อง, Slug, สรุปย่อ',
  },
  tool: {
    target: 'แสดงในหน้า Community > หมวดบทความ/เครื่องมือ ถ้าเป็นไฟล์ดาวน์โหลดจริงให้ใช้เมนู Toolbox',
    url: '/articles/[slug] หรือ external URL',
    media: 'แนะนำรูปปก 16:9 ชื่อไฟล์: tool-[slug]-cover.jpg',
    required: 'ชื่อเรื่อง, Slug, สรุปย่อ, URL หรือเนื้อหา HTML',
  },
  community: {
    target: 'แสดงในหน้า Community > หมวดข่าวกิจกรรม',
    url: '/articles/[slug]',
    media: 'ใช้รูปปกได้แต่ไม่บังคับ ชื่อไฟล์: community-[slug]-cover.jpg',
    required: 'ชื่อเรื่อง, Slug, สรุปย่อ',
  },
  quiz: {
    target: 'แสดงในหน้า Community > หมวดข่าวกิจกรรม/แบบทดสอบ',
    url: '/articles/diagnostic-quiz หรือ URL ที่กำหนด',
    media: 'ใช้รูปปกได้แต่ไม่บังคับ ชื่อไฟล์: quiz-[slug]-cover.jpg',
    required: 'ชื่อเรื่อง, Slug, สรุปย่อ, Target URL',
  },
  event: {
    target: 'แสดงในหน้า Events และเปิดรายละเอียดเป็น /event/:id',
    url: '/events และ /event/[id]',
    media: 'ควรอัปโหลดภาพ event 1:1 หรือ 4:5 ชื่อไฟล์: event-[title]-cover.jpg',
    required: 'ชื่อกิจกรรม, วันเวลาเริ่ม, สถานที่หรือลิงก์ออนไลน์ — ที่นั่ง/ช่วงรับสมัคร/ราคาไม่บังคับ',
  },
};

// Form state is a loose union of both shapes so one editor component can
// drive either table — only the fields relevant to `_kind` are ever read
// back out when saving.
// `_online_url` / `_attendee_info` live in event_private_details (readable
// only by confirmed attendees), not in the public events row.
type EditorForm = { _kind: ContentKind; id?: string; created_at?: string; _online_url?: string; _attendee_info?: string }
  & Partial<Article> & Partial<EventRow>;

const EMPTY_ARTICLE: EditorForm = {
  _kind: 'blog', title: '', slug: '', summary: '', body: '', cover_image_url: '',
  author: 'CREATR365 Team', tags: [], meta_description: '', target_url: '',
  is_active: true, sort_order: 0, video_url: '', related_course_id: null, duration_label: '',
};
const EMPTY_LIVE_NOTE: EditorForm = { ...EMPTY_ARTICLE, _kind: 'live_note', kind: 'live_note' };
const EMPTY_EVENT: EditorForm = {
  _kind: 'event', title: '', creator: '', description: '', date: '', time: '',
  address: '', target_date: '', background_image_url: '', is_published: true,
  ends_at: null, capacity: null, registration_opens_at: null, registration_closes_at: null,
  location_type: 'onsite', venue_name: '', map_url: '',
  price: null, early_bird_price: null, early_bird_until: null, price_note: '',
  _online_url: '', _attendee_info: '',
};

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type FilterKey = 'all' | 'articles' | 'live_notes' | 'events';

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

/* ─── Shared publish switch (articles + events) ──────────── */
const PublishToggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; hint?: string }> = ({ value, onChange, hint }) => (
  <div>
    <div className="inline-flex border border-white/10" role="group" aria-label="สถานะการเผยแพร่">
      <button type="button" onClick={() => onChange(true)} aria-pressed={value}
        className={`px-4 py-2 text-xs font-semibold transition-colors ${value ? 'bg-[#34A853] text-black' : 'text-white/40 hover:text-white'}`}>
        เผยแพร่
      </button>
      <button type="button" onClick={() => onChange(false)} aria-pressed={!value}
        className={`px-4 py-2 text-xs font-semibold transition-colors ${!value ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}>
        ฉบับร่าง
      </button>
    </div>
    {hint && <p className="text-white/25 text-xs mt-1.5">{hint}</p>}
  </div>
);

/* ─── Editor modal ─────────────────────────────────────── */
const ContentEditor: React.FC<{
  initial: EditorForm | null;
  courses: CourseOption[];
  /** Resolves to an error message, or null on success. */
  onSave: (data: EditorForm) => Promise<string | null>;
  onClose: () => void;
}> = ({ initial, courses, onSave, onClose }) => {
  const [form, setForm] = useState<EditorForm>(initial ?? EMPTY_ARTICLE);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState((initial?.tags || []).join(', '));

  const isEditingExisting = !!initial?.id;
  const isEvent = form._kind === 'event';

  useEffect(() => {
    if (!initial?.id || initial._kind !== 'event') return;
    supabase.from('event_private_details').select('online_url, attendee_info').eq('event_id', initial.id).maybeSingle()
      .then(({ data }) => {
        if (data) setForm(f => ({ ...f, _online_url: data.online_url, _attendee_info: data.attendee_info }));
      });
  }, [initial?.id, initial?._kind]);
  const guide = TYPE_GUIDE[form._kind] || TYPE_GUIDE.blog;

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const pickType = (k: ContentKind) => {
    if (isEditingExisting) return; // switching table for an existing row isn't a simple update
    setForm(k === 'event' ? { ...EMPTY_EVENT } : { ...EMPTY_ARTICLE, kind: k, _kind: k });
    setTagInput('');
  };

  const handleTitle = (v: string) => {
    set('title', v);
    if (!initial?.id && !isEvent) set('slug', slugify(v));
  };

  // Both article covers and event images go to the public course-media
  // bucket (admin-write, public-read). There is no `event-images` bucket in
  // this project — uploads there failed with "bucket not found".
  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: 'articles' | 'events',
    field: 'cover_image_url' | 'background_image_url',
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!IMAGE_TYPES.includes(file.type)) { setError('รองรับเฉพาะไฟล์ JPG, PNG, GIF หรือ WebP'); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError('ไฟล์ใหญ่เกิน 5MB'); return; }
    setUploading(true);
    try {
      const path = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('course-media')
        .upload(path, file, { upsert: false, contentType: resolveContentType(file) });
      if (uploadError) { setError('อัปโหลดไม่สำเร็จ: ' + uploadError.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('course-media').getPublicUrl(path);
      set(field, publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const err = await onSave(isEvent ? form : { ...form, tags });
    if (err) setError(err);
    setSaving(false);
  };

  const isClip = isClipKind(form._kind);
  const videoId = parseYouTubeId(form.video_url);
  const canSave = isEvent
    ? !!form.title && !!form.date && !!form.target_date
    : !!form.title && !!form.slug && !!form.summary && (!isClip || !!videoId);

  return (
    <div className="admin-modal-surface fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
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
            <label htmlFor="content-kind" className="text-xs text-white/40 font-medium block mb-2">
              เลือกหน้า/ประเภทที่จะแสดงผล
            </label>
            <select
              id="content-kind"
              disabled={isEditingExisting}
              value={form._kind}
              onChange={e => pickType(e.target.value as ContentKind)}
              className="w-full bg-[#1a1a1a] border border-white/10 px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-[#D4A843]/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {[...ARTICLE_KINDS, 'event' as const].map(k => (
                <option key={k} value={k}>{TYPE_LABEL[k]}</option>
              ))}
            </select>
            {isEditingExisting && (
              <p className="text-white/20 text-xs mt-1.5">แก้ไขประเภทไม่ได้หลังสร้างแล้ว — ลบแล้วสร้างใหม่ถ้าต้องการเปลี่ยน</p>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A843] mb-1">แสดงที่</p>
                <p className="text-xs text-white/55 leading-relaxed">{guide.target}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A843] mb-1">ต้องเตรียม</p>
                <p className="text-xs text-white/55 leading-relaxed">{guide.required}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A843] mb-1">URL</p>
                <p className="text-xs text-white/55 leading-relaxed font-mono">{guide.url}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A843] mb-1">รูป/ไฟล์</p>
                <p className="text-xs text-white/55 leading-relaxed">{guide.media}</p>
              </div>
            </div>
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
              <EventFormFields form={form} set={set} />
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">ภาพพื้นหลัง</label>
                {form.background_image_url && (
                  <img src={form.background_image_url} alt="" className="w-full h-32 object-cover mb-2 rounded-xl" />
                )}
                <label className="flex items-center gap-2 w-full bg-[#1a1a1a] border border-dashed border-white/15 rounded-xl px-4 py-3 text-white/40 text-sm cursor-pointer hover:text-white hover:border-white/30 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพ (JPG/PNG/GIF/WebP, สูงสุด 5MB)'}
                  <input type="file" accept="image/*" onChange={e => uploadImage(e, 'events', 'background_image_url')} disabled={uploading} className="hidden" />
                </label>
              </div>
              <PublishToggle
                value={form.is_published ?? true}
                onChange={v => set('is_published', v)}
                hint="ฉบับร่าง = ไม่แสดงในหน้า Events และเปิดลิงก์ /event/:id ไม่ได้"
              />
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
                <p className="text-white/20 text-xs mt-1">
                  URL: {form._kind === 'live_note' ? `/courses?note=${form.slug || 'slug'}` : `/articles/${form.slug || 'slug'}`}
                </p>
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
              {isClip && (
                <div className="border border-white/10 p-4 space-y-3">
                  <div>
                    <label htmlFor="clip-url" className="text-xs text-white/40 font-medium block mb-1">YouTube URL *</label>
                    <input
                      id="clip-url"
                      className="w-full bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                      placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                      value={form.video_url || ''}
                      onChange={e => set('video_url', e.target.value.trim())}
                    />
                    {form.video_url && !videoId && (
                      <p className="text-xs text-[#FF6B7F] mt-1">อ่านลิงก์นี้ไม่ได้ ใช้ลิงก์จากปุ่มแชร์ของ YouTube</p>
                    )}
                    {videoId && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={form.cover_image_url || youTubeThumb(videoId)} alt="" className="w-28 aspect-video object-cover border border-white/10" />
                        <p className="text-xs text-white/40">คลิปจะเล่นในเว็บ ไม่พาผู้ชมออกไป YouTube</p>
                      </div>
                    )}
                  </div>
                  {form._kind === 'live_note' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="clip-course" className="text-xs text-white/40 font-medium block mb-1">หลักสูตรที่ชวนไปต่อเมื่อดูจบ</label>
                        <select
                          id="clip-course"
                          className="w-full bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50"
                          value={form.related_course_id || ''}
                          onChange={e => set('related_course_id', e.target.value || null)}
                        >
                          <option value="">ไม่ผูกหลักสูตร</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}{c.is_active ? '' : ' (ยังไม่เปิดแสดง)'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="clip-duration" className="text-xs text-white/40 font-medium block mb-1">ความยาวคลิป</label>
                        <input
                          id="clip-duration"
                          className="w-full bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                          placeholder="เช่น 12 นาที"
                          value={form.duration_label || ''}
                          onChange={e => set('duration_label', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">
                  {isClip ? 'รายละเอียดใต้คลิป (HTML, ไม่บังคับ)' : 'เนื้อหาเต็ม (HTML) — ใส่เนื้อหาเต็มที่นี่'}
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
              {!isClip && <div>
                <label className="text-xs text-white/40 font-medium block mb-1">External URL (ถ้าลิ้งค์ไปภายนอก)</label>
                <input
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                  placeholder="https://..."
                  value={form.target_url || ''}
                  onChange={e => set('target_url', e.target.value)}
                />
              </div>}
              <div>
                <label className="text-xs text-white/40 font-medium block mb-1">รูปปก</label>
                {form.cover_image_url && (
                  <img src={form.cover_image_url} alt="" className="w-full h-32 object-cover mb-2 border border-white/10" />
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="inline-flex items-center justify-center gap-2 bg-[#1a1a1a] border border-dashed border-white/15 px-4 py-3 text-white/40 text-sm cursor-pointer hover:text-white hover:border-white/30 transition-colors sm:w-56">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปปก'}
                    <input type="file" accept="image/*" onChange={e => uploadImage(e, 'articles', 'cover_image_url')} disabled={uploading} className="hidden" />
                  </label>
                  <input
                    className="flex-1 bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20"
                    placeholder="หรือวาง URL รูปปกจากภายนอก..."
                    value={form.cover_image_url || ''}
                    onChange={e => set('cover_image_url', e.target.value)}
                  />
                </div>
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
                <div className="flex items-end">
                  <PublishToggle value={form.is_active ?? true} onChange={v => set('is_active', v)} />
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
        <div className="sticky bottom-0 bg-[#111] border-t border-white/8 px-6 py-4 flex items-center justify-end gap-3">
          {error && <p className="mr-auto text-xs text-[#FF6B7F]" role="alert">{error}</p>}
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
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  // event_id → { requested, confirmed } for the list's "ผู้สมัคร" button.
  const [regCounts, setRegCounts] = useState<Record<string, { requested: number; confirmed: number }>>({});
  const [registrantsOf, setRegistrantsOf] = useState<EventRow | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  // article_id → unique viewers (Live Notes)
  const [viewers, setViewers] = useState<Record<string, number>>({});
  const [statsOf, setStatsOf] = useState<Article | null>(null);

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), ok ? 3000 : 6000);
  };

  const load = useCallback(async () => {
    const [{ data: articleData }, { data: eventData }, { data: regData }, { data: courseData }, { data: viewData }] = await Promise.all([
      supabase.from('articles').select('*').order('sort_order'),
      supabase.from('events').select('*').order('target_date', { ascending: false }),
      supabase.from('event_registrations').select('event_id, status').in('status', ['requested', 'confirmed']),
      supabase.from('courses').select('id,title,is_active').order('sort_order'),
      supabase.from('content_views').select('article_id,user_id'),
    ]);
    setCourses((courseData as unknown as CourseOption[]) || []);
    const uniq: Record<string, Set<string>> = {};
    for (const v of (viewData as unknown as { article_id: string; user_id: string }[]) || []) {
      (uniq[v.article_id] ??= new Set()).add(v.user_id);
    }
    setViewers(Object.fromEntries(Object.entries(uniq).map(([k, set]) => [k, set.size])));
    const rc: Record<string, { requested: number; confirmed: number }> = {};
    for (const r of regData || []) {
      const c = (rc[r.event_id] ??= { requested: 0, confirmed: 0 });
      if (r.status === 'requested') c.requested++; else c.confirmed++;
    }
    setRegCounts(rc);
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

  const handleSave = async (form: EditorForm): Promise<string | null> => {
    if (form._kind === 'event') {
      if (!form.title || !form.date) return 'กรอกชื่อกิจกรรมและวันที่';
      const invalid = validateEventForm(form);
      if (invalid) return invalid;
      const isOnline = form.location_type === 'online';
      const payload = {
        title: form.title.trim(),
        creator: (form.creator ?? '').trim(),
        description: (form.description ?? '').trim(),
        date: (form.date ?? '').trim(),
        time: (form.time ?? '').trim(),
        address: (form.address ?? '').trim(),
        target_date: form.target_date ?? '',
        background_image_url: form.background_image_url ?? '',
        is_published: form.is_published ?? true,
        ends_at: form.ends_at || null,
        capacity: form.capacity ?? null,
        registration_opens_at: form.registration_opens_at || null,
        registration_closes_at: form.registration_closes_at || null,
        location_type: isOnline ? 'online' : 'onsite',
        venue_name: isOnline ? '' : (form.venue_name ?? '').trim(),
        map_url: isOnline ? '' : (form.map_url ?? '').trim(),
        price: form.price ?? null,
        early_bird_price: form.price == null ? null : form.early_bird_price ?? null,
        early_bird_until: form.price == null ? null : form.early_bird_until || null,
        price_note: (form.price_note ?? '').trim(),
      };
      const { data: saved, error } = form.id
        ? await supabase.from('events').update(payload).eq('id', form.id).select('id').single()
        : await supabase.from('events').insert([payload]).select('id').single();
      if (error || !saved) return 'บันทึกไม่สำเร็จ: ' + (error?.message ?? 'ไม่พบกิจกรรม');
      const { error: privErr } = await supabase.from('event_private_details').upsert({
        event_id: saved.id,
        online_url: isOnline ? (form._online_url ?? '').trim() : '',
        attendee_info: (form._attendee_info ?? '').trim(),
        updated_at: new Date().toISOString(),
      });
      if (privErr) return 'บันทึกกิจกรรมแล้ว แต่บันทึกลิงก์/ข้อมูลผู้เข้าร่วมไม่สำเร็จ: ' + privErr.message;
      flash(form.id ? 'อัปเดตกิจกรรมเรียบร้อย' : 'สร้างกิจกรรมใหม่เรียบร้อย');
    } else {
      // Save button is disabled until title+slug are filled (see canSave in
      // ContentEditor), so both are guaranteed present here.
      if (!form.title || !form.slug) return 'กรอกชื่อเรื่องและ Slug';
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
        target_url: form._kind === 'live_note' ? `/courses?note=${form.slug}` : (form.target_url || '/'),
        is_active: form.is_active ?? true,
        sort_order: form.sort_order ?? 0,
        kind: form._kind,
        video_url: isClipKind(form._kind) ? (form.video_url || null) : null,
        related_course_id: form._kind === 'live_note' ? (form.related_course_id || null) : null,
        duration_label: form._kind === 'live_note' ? ((form.duration_label || '').trim() || null) : null,
      };
      if (isClipKind(form._kind) && !parseYouTubeId(payload.video_url)) return 'ใส่ YouTube URL ให้ถูกต้อง';
      const { error } = form.id
        ? await supabase.from('articles').update(payload).eq('id', form.id)
        : await supabase.from('articles').insert([payload]);
      if (error) {
        // Unique slug is the one constraint admins actually hit.
        if (error.code === '23505') return 'Slug นี้มีอยู่แล้ว — เปลี่ยน Slug ใหม่';
        return 'บันทึกไม่สำเร็จ: ' + error.message;
      }
      flash(form.id ? 'อัปเดตเนื้อหาเรียบร้อย' : 'สร้างเนื้อหาใหม่เรียบร้อย');
    }
    setEditing(false);
    load();
    return null;
  };

  const togglePublished = async (row: ContentRow) => {
    const { error } = row._kind === 'event'
      ? await supabase.from('events').update({ is_published: !row.is_published }).eq('id', row.id)
      : await supabase.from('articles').update({ is_active: !row.is_active }).eq('id', row.id);
    if (error) flash('เปลี่ยนสถานะไม่สำเร็จ: ' + error.message, false);
    load();
  };

  const handleDelete = async (row: ContentRow) => {
    const warn = row._kind === 'event'
      ? `ลบกิจกรรม "${row.title}"? รายชื่อผู้ลงทะเบียนของกิจกรรมนี้จะถูกลบไปด้วย — ถ้าแค่ต้องการซ่อน ให้ใช้ "ฉบับร่าง" แทน`
      : `ลบ "${row.title}"? ถ้าแค่ต้องการซ่อน ให้ใช้ "ฉบับร่าง" แทน`;
    if (!confirm(warn)) return;
    const { error } = await supabase.from(row._kind === 'event' ? 'events' : 'articles').delete().eq('id', row.id);
    if (error) flash('ลบไม่สำเร็จ: ' + error.message, false);
    load();
  };

  const isPublished = (row: ContentRow) => row._kind === 'event' ? row.is_published : row.is_active;
  const isLiveNoteRow = (r: ContentRow) => r._kind === 'article' && r.kind === 'live_note';
  const counts = {
    all: rows.length,
    articles: rows.filter(r => r._kind === 'article' && !isLiveNoteRow(r)).length,
    live_notes: rows.filter(isLiveNoteRow).length,
    events: rows.filter(r => r._kind === 'event').length,
  };
  const visibleRows = rows.filter(r =>
    filter === 'all' ? true
      : filter === 'events' ? r._kind === 'event'
      : filter === 'live_notes' ? isLiveNoteRow(r)
      : r._kind === 'article' && !isLiveNoteRow(r));

  return (
    <>
      <AdminLayout
        title="จัดการเนื้อหา"
        onSignOut={handleSignOut}
        actions={
          <button
            onClick={() => setEditing(filter === 'events' ? EMPTY_EVENT : filter === 'live_notes' ? EMPTY_LIVE_NOTE : EMPTY_ARTICLE)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D4A843] text-black hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> สร้างเนื้อหาใหม่
          </button>
        }
      >
          {msg && (
            <div role="status" className={`mb-4 p-3 border text-sm ${msg.ok
              ? 'bg-[#34A853]/15 border-[#34A853]/25 text-[#34A853]'
              : 'bg-[#CC0033]/15 border-[#CC0033]/30 text-[#FF6B7F]'}`}>{msg.text}</div>
          )}

          <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="กรองประเภทเนื้อหา">
            {([['all', 'ทั้งหมด'], ['live_notes', 'Live Notes (หน้าหลักสูตร)'], ['articles', 'Community: บทความ / ข่าว / คลิปกิจกรรม'], ['events', 'กิจกรรม']] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                className={`px-4 py-2 text-xs font-semibold border transition-colors ${filter === k
                  ? 'bg-[#D4A843] text-black border-[#D4A843]'
                  : 'border-white/10 text-white/50 hover:text-white'}`}>
                {l} <span className="opacity-60">({counts[k]})</span>
              </button>
            ))}
          </div>

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
                {visibleRows.map(row => (
                  <tr key={`${row._kind}-${row.id}`} className="bg-[#0D0D0D] hover:bg-[#131313] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-sm line-clamp-1">{row.title}</p>
                      <p className="text-white/30 text-xs mt-0.5 font-mono">
                        {row._kind === 'article'
                          ? (row.kind === 'live_note' ? `/courses?note=${row.slug}` : `/articles/${row.slug}`)
                          : `กิจกรรม · ${row.date || 'ยังไม่ระบุวันที่'}`}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/8 text-white/50 uppercase">
                        {TYPE_LABEL[row._kind === 'event' ? 'event' : (row.kind as ContentKind) || 'blog']}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${isPublished(row) ? 'text-[#34A853]' : 'text-white/30'}`}>
                        {isPublished(row) ? '● เผยแพร่' : '○ ฉบับร่าง'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {row._kind === 'article' && row.kind === 'live_note' && (
                          <>
                            <button onClick={() => setStatsOf(row)}
                              aria-label="ดูสถิติผู้ชม"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors">
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">ผู้ชม</span>
                              <span className="font-mono">{viewers[row.id] ?? 0}</span>
                            </button>
                            <LiveNoteLinkMenu slug={row.slug} disabled={!row.is_active}>
                              <Link2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">ลิงก์</span>
                            </LiveNoteLinkMenu>
                          </>
                        )}
                        {row._kind === 'article' && row.kind !== 'live_note' && row.body && (
                          <a href={`/articles/${row.slug}`} target="_blank" rel="noopener noreferrer" aria-label="เปิดดูหน้าเว็บ"
                            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {row._kind === 'event' && (
                          <button onClick={() => setRegistrantsOf(row)}
                            aria-label="ดูผู้สมัคร"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors">
                            <Users className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ผู้สมัคร</span>
                            <span className="font-mono">{regCounts[row.id]?.confirmed ?? 0}{row.capacity != null ? `/${row.capacity}` : ''}</span>
                            {(regCounts[row.id]?.requested ?? 0) > 0 && (
                              <span className="px-1.5 bg-[#D4A843] text-black text-[10px]" title="รอยืนยัน">
                                +{regCounts[row.id].requested}
                              </span>
                            )}
                          </button>
                        )}
                        {row._kind === 'event' && row.is_published && (
                          <a href={`/event/${row.id}`} target="_blank" rel="noopener noreferrer" aria-label="เปิดดูหน้าเว็บ"
                            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => togglePublished(row)}
                          aria-label={isPublished(row) ? 'เปลี่ยนเป็นฉบับร่าง' : 'เผยแพร่'}
                          title={isPublished(row) ? 'เปลี่ยนเป็นฉบับร่าง' : 'เผยแพร่'}
                          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                          {isPublished(row) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditing(toEditorForm(row))} aria-label="แก้ไข" className="p-1.5 rounded-lg text-white/30 hover:text-[#D4A843] hover:bg-[#D4A843]/10 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(row)} aria-label="ลบ" className="p-1.5 rounded-lg text-white/30 hover:text-[#CC0033] hover:bg-[#CC0033]/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-white/20">ยังไม่มีเนื้อหาในหมวดนี้ — กด "+ สร้างเนื้อหาใหม่" เพื่อเริ่ม</td></tr>
                )}
              </tbody>
            </table>
          </div>
      </AdminLayout>

      {registrantsOf && (
        <EventRegistrantsPanel
          eventId={registrantsOf.id}
          eventTitle={registrantsOf.title}
          capacity={registrantsOf.capacity}
          onClose={() => setRegistrantsOf(null)}
          onChanged={load}
        />
      )}

      {statsOf && (
        <LiveNoteStatsPanel articleId={statsOf.id} title={statsOf.title} onClose={() => setStatsOf(null)} />
      )}

      {editing !== false && (
        <ContentEditor
          initial={editing}
          courses={courses}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
};
export default AdminArticles;
