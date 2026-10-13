import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';
import { PageBanner } from '@/components/PageBanner';
import { Sparkles, ExternalLink } from 'lucide-react';

/**
 * /ai-lab — home of Creatr365's AI tools. Only tools that actually exist are
 * listed (the navigation research this redesign is based on warns against
 * claiming tools/content that don't exist yet), so there are no placeholder
 * category tiles. Green (#6AAA7A) matches this tile's slot in Explore.tsx's
 * System B wayfinding rotation.
 *
 * Host Compass is currently a link-out card to its own deployment
 * (live-host-tracking.vercel.app): a standalone client-side app that keeps
 * its history in the visitor's browser (no login, no Supabase). It opens in a
 * new tab rather than an iframe — an embed would depend on that deployment's
 * framing headers and on third-party storage staying available (Safari / the
 * LINE in-app browser partition or block it), which can't be verified from
 * this repo. Moving it fully in-site means porting its source into this repo.
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

          {/* Host Compass — opens its own deployment in a new tab (see the
              file comment above for why this is not an iframe). */}
          <a
            href="https://live-host-tracking.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="sharp-card section-accent group mt-6 flex items-center justify-between gap-4 p-6 bg-card border border-border border-t-4 border-t-[#6AAA7A]"
            style={{ '--hover-accent': '#6AAA7A', '--section-accent': '#6AAA7A' } as React.CSSProperties}
          >
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#6AAA7A] flex items-center gap-1.5 mb-2">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#6AAA7A] inline-block" aria-hidden="true" />
                กำลังทดสอบ
              </span>
              <div className="font-bold text-lg">Host Compass</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
               นำตัวเลขสรุปหลังการไลฟ์มาใช้ เพื่อเป็นแนวทางและการพัฒนาการไลฟ์ในครั้งต่อไป
              </p>
              <span className="text-[11px] text-muted-foreground mt-2 block">เปิดในแท็บใหม่</span>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-[#6AAA7A] transition-colors" aria-hidden="true" />
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AiLab;
