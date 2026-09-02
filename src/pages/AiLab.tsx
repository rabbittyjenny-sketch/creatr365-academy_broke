import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';
import { Sparkles } from 'lucide-react';

/**
 * /ai-lab — honest "coming soon" placeholder. Real route (not a dead link
 * from the Explore tile), but no fabricated tool list: the navigation
 * research this redesign is based on explicitly warns against claiming
 * tools/content that don't exist yet. Green (#6AAA7A) matches this tile's
 * slot in Explore.tsx's System B wayfinding rotation.
 */
const AiLab: React.FC = () => {
  useDarkPage();
  return (
    <>
      <SEOHead title="AI Lab - Creatr365" description="AI Lab กำลังจัดเตรียม — เครื่องมือ AI ที่คัดสรรสำหรับ creator" />
      <CourseNavbar />

      <section className="pt-28 pb-24 px-4 bg-background min-h-[70vh]">
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
            <span className="text-[10px] font-bold tracking-widest text-[#6AAA7A] flex items-center gap-1.5">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#6AAA7A] inline-block" aria-hidden="true" />
              AI LAB
            </span>
            <h1 className="text-3xl md:text-5xl font-bold leading-[0.95] mt-3 mb-4">Coming soon</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg">
              กำลังคัดเลือก AI ที่ใช้งานได้จริงตามขั้นตอนงานของ creator (เขียน / ออกแบบ / วิจัย / จัดการ / ทดลองไอเดีย)
              พร้อม review date และไม่ใช่แค่รายชื่อเครื่องมือที่กระแสดี — เร็ว ๆ นี้ค่ะ
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm">
            <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <p className="text-muted-foreground">
              ระหว่างรอ ลองดู{' '}
              <Link to="/toolbox" className="underline hover-shift" data-accent="red">Toolbox</Link>{' '}
              หรือ{' '}
              <Link to="/courses" className="underline hover-shift" data-accent="red">Courses</Link>{' '}
              ก่อนได้ค่ะ
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AiLab;
