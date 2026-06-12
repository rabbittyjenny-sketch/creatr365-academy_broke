import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';

interface Article {
  id: string; slug: string; title: string; summary: string; body: string | null;
  cover_image_url: string | null; kind: string; author: string | null;
  tags: string[] | null; meta_description: string | null; target_url: string;
  created_at: string; updated_at: string;
}

const KIND_LABEL: Record<string, string> = {
  news: 'NEWS', tool: 'TOOL', community: 'COMMUNITY', quiz: 'DIAGNOSTIC',
  blog: 'BLOG', update: 'UPDATE',
};

// Simple HTML renderer with safe inline styles
const ArticleBody: React.FC<{ html: string }> = ({ html }) => (
  <div
    className="article-body text-white/70 leading-relaxed"
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setArticle(data as unknown as Article);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return (
    <div className="bg-[#080808] min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#D4A843]/40 border-t-[#D4A843] animate-spin" />
    </div>
  );

  if (notFound || !article) return (
    <>
      <CourseNavbar />
      <div className="bg-[#080808] min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-white/40 text-sm mb-4">ไม่พบบทความนี้</p>
        <Link to="/articles" className="text-[#D4A843] text-sm hover:opacity-80">← กลับไปหน้าบทความ</Link>
      </div>
    </>
  );

  const kindLabel = KIND_LABEL[article.kind] || article.kind?.toUpperCase() || 'ARTICLE';
  const dateStr = new Date(article.updated_at || article.created_at).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <SEOHead
        title={`${article.title} — CREATR365`}
        description={article.meta_description || article.summary}
      />
      <CourseNavbar />

      <main className="bg-[#080808] min-h-screen pt-24 pb-24">
        {/* Hero */}
        {article.cover_image_url && (
          <div className="relative w-full max-h-[480px] overflow-hidden">
            <img src={article.cover_image_url} alt={article.title} className="w-full object-cover max-h-[480px] opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/30" />
          </div>
        )}

        <div className="max-w-2xl mx-auto px-6">
          {/* Back */}
          <Link to="/articles" className="inline-flex items-center gap-2 text-white/30 text-sm hover:text-white/60 transition-colors mt-6 mb-8">
            <ArrowLeft className="w-4 h-4" /> กลับไปหน้าบทความ
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/25">
              {kindLabel}
            </span>
            <span className="flex items-center gap-1 text-white/30 text-xs">
              <Calendar className="w-3 h-3" /> {dateStr}
            </span>
            {article.author && (
              <span className="flex items-center gap-1 text-white/30 text-xs">
                <User className="w-3 h-3" /> {article.author}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
            {article.title}
          </h1>
          <p className="text-white/50 text-base leading-relaxed mb-10 pb-8 border-b border-white/8">
            {article.summary}
          </p>

          {/* Body content */}
          {article.body ? (
            <ArticleBody html={article.body} />
          ) : article.target_url ? (
            <div className="p-6 rounded-2xl border border-white/8 bg-[#111] text-center">
              <p className="text-white/50 text-sm mb-4">บทความนี้อยู่บนแพลตฟอร์มภายนอก</p>
              <a
                href={article.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#D4A843] hover:opacity-90 transition-opacity"
              >
                อ่านบทความต้นฉบับ
              </a>
            </div>
          ) : null}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/8">
              <Tag className="w-3 h-3 text-white/30 mt-1" />
              {article.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs text-white/40 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-12 flex justify-between items-center">
            <Link to="/articles" className="text-[#D4A843] text-sm hover:opacity-80 transition-opacity flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> บทความทั้งหมด
            </Link>
            <Link to="/courses" className="text-white/30 text-sm hover:text-white/60 transition-colors">
              ดูหลักสูตร →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};
export default ArticleDetail;
