import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useDarkPage } from '@/hooks/useDarkPage';
import { ArrowRight, Newspaper, Wrench, Users, ClipboardCheck, Rss, ExternalLink, PlayCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface ArticleRow {
  id:string; slug:string; title:string; summary:string;
  cover_image_url:string|null; kind:string; target_url:string;
  body:string|null; author:string|null; tags:string[]|null; created_at:string;
}

const KIND_META: Record<string,{ label:string; Icon:React.FC<{className?:string}> }> = {
  video:     { label:'คลิปความรู้', Icon:PlayCircle },
  blog:      { label:'บทความ',      Icon:Rss },
  news:      { label:'ข่าวกิจกรรม', Icon:Newspaper },
  update:    { label:'ข่าวกิจกรรม', Icon:Newspaper },
  tool:      { label:'TOOL',        Icon:Wrench },
  community: { label:'COMMUNITY',   Icon:Users },
  quiz:      { label:'DIAGNOSTIC',  Icon:ClipboardCheck },
};

// Groups this page is organized into, in display order — separate,
// explicit sections (not one flat filtered grid) per request, each reusing
// this site's existing per-section wayfinding accent colors (same system
// Explore.tsx/Toolbox.tsx already use) so this page reads as part of the
// same site rather than a bolted-on forum layout.
const GROUPS: { label:string; accent:string; kinds:string[] }[] = [
  { label:'คลิปความรู้', accent:'#4A7FB5', kinds:['video'] },
  { label:'บทความ',      accent:'#C0A060', kinds:['blog', 'tool'] },
  { label:'ข่าวกิจกรรม', accent:'#B87333', kinds:['news', 'update', 'community', 'quiz'] },
];

const Articles: React.FC = () => {
  useDarkPage();
  const [items, setItems] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('articles').select('*').eq('is_active',true).order('sort_order')
      .then(({ data }) => { setItems((data as unknown as ArticleRow[])||[]); setLoading(false); });
  }, []);

  const renderCard = (a: ArticleRow, accent: string) => {
    const meta = KIND_META[a.kind] || KIND_META.news;
    const Icon = meta.Icon;
    const isInternal = !!a.body || a.target_url.startsWith('/');
    const href = isInternal ? `/articles/${a.slug}` : a.target_url;

    const CardContent = (
      <div className="group sharp-card border border-border bg-card overflow-hidden h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5">
        {a.cover_image_url && (
          <div className="aspect-video overflow-hidden bg-muted">
            <img src={a.cover_image_url} alt={a.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest px-2 py-1 rounded-full"
              style={{ background:accent+'18', color:accent, border:`1px solid ${accent}40` }}>
              <Icon className="w-2.5 h-2.5" /> {meta.label}
            </span>
            {!isInternal && <ExternalLink className="w-3 h-3 text-muted-foreground/40" />}
          </div>
          <h3 className="font-bold text-sm leading-tight mb-1.5 line-clamp-2">{a.title}</h3>
          <p className="text-muted-foreground text-xs leading-relaxed mb-3 flex-1 line-clamp-3">{a.summary}</p>
          <div className="mt-auto pt-2.5 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all" style={{ color:accent }}>
              {isInternal ? 'อ่านต่อ' : 'ดูเพิ่มเติม'}
              <ArrowRight className="w-3 h-3" />
            </span>
            {a.author && <span className="text-muted-foreground/50 text-[10px]">{a.author}</span>}
          </div>
        </div>
      </div>
    );

    return isInternal ? (
      <Link key={a.id} to={href}>{CardContent}</Link>
    ) : (
      <a key={a.id} href={href} target="_blank" rel="noopener noreferrer">{CardContent}</a>
    );
  };

  return (
    <>
      <SEOHead
        title="Community — CREATR365"
        description="คลิปความรู้ บทความ และข่าวกิจกรรมของ Creatr365"
      />
      <CourseNavbar />

      <section className="pt-28 pb-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground" aria-current="page">Community</span>
          </nav>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3" data-accent="red">Community</h1>
          <p className="text-muted-foreground text-base md:text-lg mb-12 max-w-xl">
            พื้นที่รวมคลิปความรู้ บทความ และข่าวกิจกรรมของ Creatr365 — อัปเดตให้ทันทุกความเคลื่อนไหว
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(n=><div key={n} className="h-64 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-12">
              {GROUPS.map(group => {
                const groupItems = items.filter(i => group.kinds.includes(i.kind));
                return (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: group.accent }} aria-hidden="true" />
                      <h2 className="text-lg font-bold tracking-tight">{group.label}</h2>
                    </div>
                    {groupItems.length === 0 ? (
                      <div className="sharp-tile border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        ยังไม่มีเนื้อหาในหมวดนี้ — กลับมาดูใหม่เร็ว ๆ นี้
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupItems.map(a => renderCard(a, group.accent))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};
export default Articles;
