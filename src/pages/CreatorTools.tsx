import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';
import { PageBanner } from '@/components/PageBanner';
import { Wrench } from 'lucide-react';

/**
 * /creator-tools — honest "coming soon" placeholder, same reasoning as
 * AiLab.tsx: a real destination, no fabricated utilities. Copper (#B87333)
 * matches this tile's slot in Explore.tsx's System B wayfinding rotation.
 */
const CreatorTools: React.FC = () => {
  useDarkPage();
  return (
    <>
      <SEOHead title="Creator Tools - Creatr365" description="Creator Tools กำลังจัดเตรียม — utility สำหรับสมาชิก Creatr365" />
      <CourseNavbar />

      <section className="section-accent pt-28 pb-24 px-4 bg-background min-h-[70vh]" style={{ '--hover-accent': '#B87333', '--section-accent': '#B87333' } as React.CSSProperties}>
        {/* Same fix as AiLab.tsx: banner gets the section's full width, not
            the narrower max-w-3xl reading column below it. */}
        <div className="max-w-6xl mx-auto mb-8">
          <PageBanner pageKey="creator-tools" accent="#B87333" />
        </div>

        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground" aria-current="page">Creator Tools</span>
          </nav>

          <div className="sharp-tile p-8 md:p-12 bg-card border border-border border-t-4 border-t-[#B87333]">
            <span className="text-[10px] font-bold tracking-widest text-[#B87333] block">CREATOR TOOLS</span>
            <h1 className="text-3xl md:text-5xl font-bold leading-[0.95] mt-3 mb-4">Coming soon</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg">
              กำลังจัดเตรียม utility ของ Creatr365 สำหรับสมาชิก — จะเปิดใช้งานทีละชิ้นเมื่อพร้อมจริง
              ไม่มีการโฆษณาว่ามีเครื่องมือที่ยังไม่พร้อมใช้งาน
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm">
            <Wrench className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <p className="text-muted-foreground">
              ระหว่างรอ ลองดู{' '}
              <Link to="/toolbox" className="underline hover-shift">Toolbox</Link>{' '}
              หรือ{' '}
              <Link to="/courses" className="underline hover-shift">Courses</Link>{' '}
              ก่อนได้ค่ะ
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CreatorTools;
