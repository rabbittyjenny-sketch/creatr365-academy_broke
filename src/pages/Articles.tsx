import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Newspaper, Wrench, Users, ClipboardCheck, Rss, ExternalLink } from 'lucide-react';

interface ArticleRow {
  id:string; slug:string; title:string; summary:string;
  cover_image_url:string|null; kind:string; target_url:string;
  body:string|null; author:string|null; tags:string[]|null; created_at:string;
}

const KIND_META: Record<string,{ label:string; Icon:React.FC<{className?:string}> }> = {
  news:      { label:'NEWS',       Icon:Newspaper },
  tool:      { label:'TOOL',       Icon:Wrench },
  community: { label:'COMMUNITY',  Icon:Users },
  quiz:      { label:'DIAGNOSTIC', Icon:ClipboardCheck },
  blog:      { label:'BLOG',       Icon:Rss },
  update:    { label:'UPDATE',     Icon:Newspaper },
};

const KIND_COLORS: Record<string,string> = {
  news:'#CC0033', tool:'#4285F4', community:'#34A853', quiz:'#9B59B6', blog:'#D4A843', update:'#888',
};

const Articles: React.FC = () => {
  const [items, setItems] = useState<ArticleRow[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    supabase.from('articles').select('*').eq('is_active',true).order('sort_order')
      .then(({ data }) => { setItems((data as any)||[]); setLoading(false); });
  }, []);

  const kinds = ['all', ...Array.from(new Set(items.map(i=>i.kind)))];
  const filtered = filter==='all' ? items : items.filter(i=>i.kind===filter);

  return (
    <>
      <SEOHead
        title="บทความ — CREATR365"
        description="ข่าวสาร บทความ เครื่องมือ และชุมชนของนักสร้างไลฟ์คอมเมิร์ซ"
      />
      <CourseNavbar />

      <main className="bg-[#080808] min-h-screen">
        {/* Header */}
        <div className="pt-28 pb-12 px-6 border-b border-white/5">
          <div className="max-w-5xl mx-auto">
            <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">Knowledge Hub</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-3">บทความ</h1>
            <p className="text-white/40 text-base">ข่าวสาร · เครื่องมือ · ชุมชน Creator</p>

            {/* Filter tabs */}
            {kinds.length > 2 && (
              <div className="flex flex-wrap gap-2 mt-8">
                {kinds.map(k => {
                  const meta = KIND_META[k];
                  const color = KIND_COLORS[k] || '#888';
                  const active = filter===k;
                  return (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: active ? color+'20' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${active ? color+'50' : 'rgba(255,255,255,0.1)'}`,
                        color: active ? color : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {k==='all' ? 'ทั้งหมด' : (meta?.label || k.toUpperCase())}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(n=><div key={n} className="h-72 rounded-2xl bg-white/3 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-white/25 text-center py-16 text-sm">ยังไม่มีบทความในหมวดนี้</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(a => {
                const meta = KIND_META[a.kind] || KIND_META.news;
                const Icon = meta.Icon;
                const color = KIND_COLORS[a.kind] || '#888';
                // Internal article if has body, external if only target_url
                const isInternal = !!a.body || a.target_url.startsWith('/');
                const href = isInternal ? `/articles/${a.slug}` : a.target_url;

                const CardContent = (
                  <div className="group rounded-2xl border border-white/8 bg-[#111] overflow-hidden h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl hover:shadow-black/40">
                    {a.cover_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={a.cover_image_url} alt={a.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80" />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full"
                          style={{ background:color+'15', color, border:`1px solid ${color}30` }}>
                          <Icon className="w-2.5 h-2.5" /> {meta.label}
                        </span>
                        {!isInternal && <ExternalLink className="w-3 h-3 text-white/20" />}
                      </div>
                      <h3 className="text-white font-semibold text-base leading-tight mb-2 line-clamp-2 group-hover:text-white transition-colors">{a.title}</h3>
                      <p className="text-white/40 text-xs leading-relaxed mb-4 flex-1 line-clamp-3">{a.summary}</p>
                      <div className="mt-auto pt-3 border-t border-white/6 flex items-center justify-between">
                        <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all" style={{ color }}>
                          {isInternal ? 'อ่านบทความ' : 'ดูเพิ่มเติม'}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                        {a.author && <span className="text-white/20 text-[10px]">{a.author}</span>}
                      </div>
                    </div>
                  </div>
                );

                return isInternal ? (
                  <Link key={a.id} to={href}>{CardContent}</Link>
                ) : (
                  <a key={a.id} href={href} target="_blank" rel="noopener noreferrer">{CardContent}</a>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
};
export default Articles;
