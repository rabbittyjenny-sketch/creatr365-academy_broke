import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';
import { PageBanner } from '@/components/PageBanner';
import { Sparkles, ArrowUpRight, Search } from 'lucide-react';

/**
 * /ai-lab — home of Creatr365's AI tools. Only tools that actually exist are
 * listed (the navigation research this redesign is based on warns against
 * claiming tools/content that don't exist yet), so there are no placeholder
 * category tiles. Green (#6AAA7A) matches this tile's slot in Explore.tsx's
 * System B wayfinding rotation.
 *
 * Host Compass opens inside this site at /ai-lab/host-compass
 * (src/pages/HostCompass.tsx — an iframe onto the static build in
 * public/host-compass-app/). The Abbreviation Search Tool opens at
 * /ai-lab/abbreviation-search (src/pages/AbbreviationSearch.tsx — an iframe
 * onto the tool's own hosted app).
 */
const AiLab: React.FC = () => {
  useDarkPage();
  return (
    <>
      <SEOHead title="AI Lab - Creatr365" description="AI Lab — เครื่องมือ AI สำหรับ creator และ live host จาก Creatr365" />
      <CourseNavbar />

      <section className="pt-28 pb-24 px-4 bg-background min-h-[70vh]">
        {/* Full section width, not the narrower reading column below — was
            trapped inside max-w-3xl, so it rendered far short of the page. */}
        <div className="max-w-6xl mx-auto mb-8">
          <PageBanner pageKey="ai-lab" accent="#6AAA7A" />
        </div>

        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground" aria-current="page">AI Lab</span>
          </nav>

          <div
            className="sharp-tile p-8 md:p-12 bg-card border border-border border-t-4 border-t-[#6AAA7A] text-foreground"
            style={{
              backgroundImage: 'radial-gradient(rgba(240,236,228,.07) 1px, transparent 1px)',
              backgroundSize: '11px 11px',
            }}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold tracking-widest text-[#6AAA7A] flex items-center gap-1.5">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#6AAA7A] inline-block" aria-hidden="true" />
                AI LAB
              </span>
              <Sparkles className="w-5 h-5 text-[#6AAA7A]" aria-hidden="true" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-[0.95] mt-3 mb-4">AI Lab</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg">
              เครื่องมือ AI สำหรับ creator และ live host ที่ Creatr365 พัฒนาขึ้น — เลือกเครื่องมือที่เปิดให้ใช้ได้ด้านล่าง
            </p>
          </div>

          {/* Host Compass — opens inside the site (internal route, same tab). */}
          <Link
            to="/ai-lab/host-compass"
            className="sharp-card section-accent group mt-6 flex flex-col sm:flex-row sm:items-center gap-5 p-4 sm:p-5 bg-card border border-border border-t-4 border-t-[#6AAA7A]"
            style={{ '--hover-accent': '#6AAA7A', '--section-accent': '#6AAA7A' } as React.CSSProperties}
          >
            <img
              src="/images/pro-AI-tech.png"
              alt="Host Compass"
              className="w-full sm:w-52 shrink-0 aspect-square object-cover"
            />
            <div className="flex-1">
              <span className="text-[10px] font-bold tracking-widest text-[#6AAA7A] flex items-center gap-1.5 mb-2">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#6AAA7A] inline-block" aria-hidden="true" />
                กำลังทดสอบ
              </span>
              <div className="font-bold text-lg">Host Compass</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                นำตัวเลขสรุปหลังการไลฟ์มาใช้ เพื่อเป็นแนวทางและการพัฒนาการไลฟ์ในครั้งต่อไป
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-[#6AAA7A] transition-colors" aria-hidden="true" />
          </Link>

          {/* Abbreviation Search Tool — also opens inside the site. */}
          <Link
            to="/ai-lab/abbreviation-search"
            className="sharp-card section-accent group mt-6 flex flex-col sm:flex-row sm:items-center gap-5 p-4 sm:p-5 bg-card border border-border border-t-4 border-t-[#6AAA7A]"
            style={{ '--hover-accent': '#6AAA7A', '--section-accent': '#6AAA7A' } as React.CSSProperties}
          >
            <div className="w-full sm:w-52 shrink-0 aspect-square sm:aspect-auto sm:h-32 grid place-items-center bg-background border border-border">
              <Search className="w-12 h-12 text-[#6AAA7A]" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">Abbreviation Search Tool</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                เครื่องมือค้นหาคำย่อของ Creatr365
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-[#6AAA7A] transition-colors" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AiLab;
