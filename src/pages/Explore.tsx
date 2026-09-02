import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { ArrowUpRight, GraduationCap, Package, Sparkles, Wrench } from 'lucide-react';

/**
 * /explore — the ecosystem landing page. Replaces "EXPLORE = /courses" with
 * four destinations (Courses / Toolbox / AI Lab / Creator Tools) as giant,
 * whole-card tiles. Courses stays the largest/primary tile (business
 * anchor); AI Lab and Creator Tools are real routes but honestly labelled
 * "Coming soon" until there's real content behind them — no dropdown, no
 * nested interactive elements inside a tile (one <Link> per tile, DOM order
 * matches the visual priority so keyboard/tab order stays meaningful).
 */
const Explore: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Explore - Creatr365"
        description="เลือกเส้นทางของคุณ: เรียนรู้กับ Courses, หยิบของจาก Toolbox, ทดลอง AI Lab หรือใช้ Creator Tools"
      />
      <CourseNavbar />

      <section className="pt-28 pb-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground" aria-current="page">Explore</span>
          </nav>

          {/* Editorial hero */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" data-accent="red">
            เลือกเส้นทางที่ตรงกับงานของคุณ
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-xl">
            ไม่ใช่แค่หัวข้อที่น่าสนใจ — เรียนรู้เป็นลำดับ หยิบของไปใช้ทันที ทดลอง AI หรือใช้เครื่องมือของ Creatr365
          </p>

          {/* 4 giant tiles — DOM order: Courses, Toolbox, AI Lab, Creator Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[220px_220px_160px] gap-3">
            <Link
              to="/courses"
              className="sharp-card sharp-tile md:col-start-1 md:row-start-1 md:row-span-2 relative flex flex-col justify-between p-6 md:p-8 bg-foreground text-background border border-foreground overflow-hidden group"
            >
              <div className="flex items-start justify-between relative z-10">
                <span className="text-[10px] font-bold tracking-widest opacity-70">01 / COURSES</span>
                <GraduationCap className="w-5 h-5 opacity-70" aria-hidden="true" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold leading-[0.95] mb-3">Courses</h2>
                <p className="text-sm opacity-80 max-w-xs">เส้นทางเรียนรู้ที่เป็นลำดับ — ฟรีและชำระเงิน พร้อม progress ของคุณ</p>
              </div>
              <span className="absolute right-4 bottom-4 md:right-6 md:bottom-6 w-9 h-9 grid place-items-center bg-background text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </Link>

            <Link
              to="/toolbox"
              className="sharp-card sharp-tile md:col-start-2 md:row-start-1 relative flex flex-col justify-between p-6 bg-card border border-border overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground">02 / TOOLBOX</span>
                <Package className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold leading-[0.95] mb-2" data-accent="red">Toolbox</h2>
                <p className="text-xs text-muted-foreground max-w-xs">เทมเพลต ไฟล์ และของฟรีให้โหลดไปใช้งานได้ทันที</p>
              </div>
              <span className="absolute right-4 bottom-4 w-8 h-8 grid place-items-center bg-foreground text-background group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </Link>

            <Link
              to="/ai-lab"
              className="sharp-card sharp-tile md:col-start-2 md:row-start-2 relative flex flex-col justify-between p-6 text-white overflow-hidden group"
              style={{
                background: 'hsl(var(--google-blue))',
                backgroundImage: 'radial-gradient(rgba(255,255,255,.35) 1px, transparent 1px)',
                backgroundSize: '11px 11px',
              }}
            >
              <div className="flex items-start justify-between relative z-10">
                <span className="text-[10px] font-bold tracking-widest opacity-80 inline-flex items-center gap-1.5">
                  <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-white inline-block" aria-hidden="true" />
                  03 / AI LAB
                </span>
                <Sparkles className="w-5 h-5 opacity-80" aria-hidden="true" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold leading-[0.95] mb-2">AI Lab</h2>
                <p className="text-xs opacity-85 max-w-xs">Coming soon — กำลังคัดเลือกเครื่องมือ AI ที่ใช้งานได้จริงสำหรับ creator</p>
              </div>
            </Link>

            <Link
              to="/creator-tools"
              className="sharp-card sharp-tile md:col-span-2 md:row-start-3 relative flex items-center justify-between p-6 bg-muted border border-border overflow-hidden group"
            >
              <div>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground">04 / CREATOR TOOLS</span>
                <h2 className="text-xl md:text-2xl font-bold leading-[0.95] mt-1">Creator Tools</h2>
                <p className="text-xs text-muted-foreground mt-1">Coming soon — utility ที่ Creatr365 กำลังจัดเตรียมสำหรับสมาชิก</p>
              </div>
              <Wrench className="w-6 h-6 text-muted-foreground shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Explore;
