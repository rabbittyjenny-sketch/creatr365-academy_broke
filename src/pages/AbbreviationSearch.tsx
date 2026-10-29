import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';
import { ExternalLink } from 'lucide-react';

/**
 * /ai-lab/abbreviation-search — KUM-TEM (คำเต็ม), the Creatr365 abbreviation
 * search tool, shown inside the site.
 *
 * The tool is its own app (repo Cretr365-abbreviation-search-tool, hosted at
 * TOOL_URL). It has two display modes by design: opened on its own on a
 * computer it draws a phone frame on a dotted desk; inside an iframe (or with
 * ?embed=1) it drops the frame and fills whatever box it is given. Its README
 * ("ฝังในเว็บอื่น") prescribes the embed: ?embed=1, max-width 420px, height
 * 760px, centered — followed here. The "open full page" link opens the tool
 * on its own, i.e. the desk-and-phone look.
 */
export const TOOL_URL = 'https://kamtem.vercel.app/';
const EMBED_URL = `${TOOL_URL}?embed=1`;

const AbbreviationSearch: React.FC = () => {
  useDarkPage();
  return (
    <>
      <SEOHead title="KUM-TEM (คำเต็ม) - AI Lab - Creatr365" description="KUM-TEM (คำเต็ม) — ยืดตัวย่อให้เป็นคำเต็ม พร้อมคำอ่านและปุ่มฟังเสียงเฉพาะคำ" />
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
            <span className="text-foreground" aria-current="page">KUM-TEM</span>
          </nav>
          <a
            href={TOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
          >
            เปิดแบบเต็มหน้า <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>

        <iframe
          title="KUM-TEM คำเต็ม"
          src={EMBED_URL}
          allow="clipboard-write"
          className="block mx-auto w-full max-w-[420px] border-0 h-[min(760px,calc(100dvh-7rem))] min-h-[560px]"
        />
        <div className="h-8" aria-hidden="true" />
      </main>

      <Footer />
    </>
  );
};

export default AbbreviationSearch;
