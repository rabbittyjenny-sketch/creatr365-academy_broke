import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';
import { ExternalLink } from 'lucide-react';

/**
 * /ai-lab/abbreviation-search — the Creatr365 Abbreviation Search Tool shown
 * inside the site, same pattern as Host Compass (HostCompass.tsx). The tool is
 * its own app hosted at ABBREVIATION_TOOL_URL and is displayed here in an
 * iframe, so it keeps its own styles and data and nothing here touches the
 * site's CSS. The small "open in a new tab" link is the fallback if the
 * visitor's browser or the tool's host refuses to frame it.
 */
export const ABBREVIATION_TOOL_URL = 'https://kamtem.vercel.app/';

const AbbreviationSearch: React.FC = () => {
  useDarkPage();
  return (
    <>
      <SEOHead title="Abbreviation Search Tool - AI Lab - Creatr365" description="Creatr365 Abbreviation Search Tool — เครื่องมือค้นหาคำย่อ" />
      <CourseNavbar />

      <main className="pt-16 bg-background">
        <div className="flex items-center justify-between gap-3 h-10 px-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
          >
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/ai-lab" className="hover:text-foreground transition-colors">AI Lab</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground" aria-current="page">Abbreviation Search</span>
          </nav>
          <a
            href={ABBREVIATION_TOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
          >
            เปิดในแท็บใหม่ <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>

        <iframe
          title="Creatr365 Abbreviation Search Tool"
          src={ABBREVIATION_TOOL_URL}
          allow="clipboard-write"
          className="block w-full border-0 h-[calc(100dvh-6.5rem)] min-h-[640px]"
        />
      </main>

      <Footer />
    </>
  );
};

export default AbbreviationSearch;
