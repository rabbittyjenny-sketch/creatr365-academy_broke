import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Newspaper, Wrench, Users, ClipboardCheck } from 'lucide-react';

interface ArticleRow {
  id: string; slug: string; title: string; summary: string;
  cover_image_url: string | null; kind: string; target_url: string;
}

const KIND_META: Record<string, { label: string; Icon: typeof Newspaper }> = {
  news:      { label: 'NEWS',       Icon: Newspaper },
  tool:      { label: 'TOOL',       Icon: Wrench },
  community: { label: 'COMMUNITY',  Icon: Users },
  quiz:      { label: 'DIAGNOSTIC', Icon: ClipboardCheck },
};

const ACCENT_CYCLE = ['blue', 'red', 'yellow', 'green'] as const;

const Articles: React.FC = () => {
  const [items, setItems] = useState<ArticleRow[]>([]);

  useEffect(() => {
    supabase.from('articles').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setItems((data as any) || []));
  }, []);

  return (
    <>
      <SEOHead title="บทความ - Creatr365" description="ข่าวสาร เครื่องมือ และชุมชนของชาว Live Commerce" />
      <CourseNavbar />

      <section className="pt-28 pb-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" data-accent="yellow">บทความ</h1>
          <p className="text-muted-foreground text-lg mb-12" data-accent="yellow">ข่าวสาร · เครื่องมือ · ชุมชน</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((a, idx) => {
              const meta = KIND_META[a.kind] || KIND_META.news;
              const Icon = meta.Icon;
              const accent = ACCENT_CYCLE[idx % 4];
              const internal = a.target_url.startsWith('/');
              const Wrapper: any = internal ? Link : 'a';
              const wrapperProps = internal
                ? { to: a.target_url }
                : { href: a.target_url, target: '_blank', rel: 'noopener noreferrer' };
              return (
                <Wrapper key={a.id} {...wrapperProps} className="group">
                  <div className="card-water border border-border bg-card h-full flex flex-col" data-accent={accent}>
                    {a.cover_image_url && (
                      <img src={a.cover_image_url} alt={a.title} className="w-full aspect-video object-cover border-b border-border" />
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest px-2 py-1 rounded-full bg-foreground/5 text-foreground/70">
                          <Icon className="w-3 h-3" /> {meta.label}
                        </span>
                      </div>
                      <h3 className="card-water-title text-xl font-bold mb-2 transition-colors">{a.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1" data-accent={accent}>{a.summary}</p>
                      <div className="mt-auto pt-4 border-t border-border flex items-center gap-1 text-sm font-medium text-foreground/80">
                        <span data-accent={accent}>เข้าใช้งาน</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Wrapper>
              );
            })}
            {items.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-12">ยังไม่มีบทความ</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Articles;
