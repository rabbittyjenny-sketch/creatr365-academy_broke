import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Section } from '@/components/Section';
import { SEOHead } from '@/components/SEOHead';
import { marketStats, targetAudience } from '@/data/courseData';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';
import logoCreatr from '@/assets/logo-creatr365.png';

interface CourseRow {
  id: string;
  slug: string;
  tag: string;
  title: string;
  subtitle: string;
  duration: string;
  price: string;
  color: string;
}

const ACCENT_CYCLE = ['blue', 'red', 'yellow', 'green'] as const;

const Home: React.FC = () => {
  const [previewCourses, setPreviewCourses] = useState<CourseRow[]>([]);

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, slug, tag, title, subtitle, duration, price, color')
      .eq('is_active', true)
      .order('sort_order')
      .limit(3)
      .then(({ data }) => setPreviewCourses((data as unknown as CourseRow[]) || []));
  }, []);

  return (
    <>
      <SEOHead
        title="Creatr365 - Live Streamer Academy"
        description="เราไม่สร้างนักขายออนไลน์ — เราสร้าง Livestreamer ที่แบรนด์ระดับโลกเลือกหา Psychology · Data · AI"
      />
      <CourseNavbar />

      {/* Hero - White background (logo is dark) */}
      <section className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 pt-16">
        <div className="max-w-5xl mx-auto text-center">
          <div className="opacity-0 animate-fade-in [animation-delay:200ms] mb-10 inline-block">
            <img src={logoCreatr} alt="Creatr365" className="h-24 md:h-36 lg:h-44 w-auto mx-auto" />
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 opacity-0 animate-fade-in [animation-delay:400ms] leading-[0.95]">
            LIVE STREAMER<br />ACADEMY
          </h1>
          <p className="text-lg md:text-2xl text-foreground/70 max-w-3xl mx-auto mb-4 opacity-0 animate-fade-in [animation-delay:600ms] leading-relaxed">
            Anyone can go live. Not everyone earns a global brand's trust.<br className="hidden md:block" />
            We build the ones who do.
          </p>
          <p className="text-sm md:text-base font-light text-foreground/50 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-in [animation-delay:800ms]">
            จากศูนย์สู่แสน ใน 2 ชั่วโมงแรก · สอนจากประสบการณ์จริง · ไม่มีสคริปต์สำเร็จรูป
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in [animation-delay:1000ms]">
            <Link to="/courses" className="group px-8 py-4 bg-foreground text-background rounded-full text-base font-medium hover:opacity-90 transition-all inline-flex items-center justify-center gap-2">
              <span className="hover-shift" data-accent="blue">ดูหลักสูตรทั้งหมด</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/auth" className="px-8 py-4 border border-foreground/30 text-foreground rounded-full text-base font-medium hover:bg-foreground/5 transition-all text-center">
              <span className="hover-shift" data-accent="yellow">สมัครเรียน</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Market Opportunity - light grey */}
      <Section title="THE OPPORTUNITY" subtitle="แพลตฟอร์มโตขึ้น ความต้องการ Professional Host ก็สูงขึ้น แต่ตลาดส่วนใหญ่ยังไลฟ์แบบไม่มีทิศทาง" className="bg-muted/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketStats.map((stat, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-3xl md:text-4xl font-bold mb-3 text-foreground hover-shift" data-accent={ACCENT_CYCLE[i % 4]}>{stat.value}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{stat.label}</p>
              <p className="text-xs text-muted-foreground/60 italic">{stat.source}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* The Problem - dark */}
      <Section title="THE PROBLEM" subtitle="ปัญหาที่แบรนด์ชั้นนำหาคำตอบไม่ได้" dark>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-background/90 text-lg md:text-xl leading-relaxed mb-10">
            แบรนด์ต้องการ Live Streamer ที่เข้าใจทั้ง <span className="font-bold">Brand CI + Sales Psychology + Data</span> พร้อมกัน
            <br />แต่สิ่งที่มีในตลาดคือ <span className="italic">"คนพูดหน้ากล้อง"</span> ที่ขาด 3 สิ่งนี้ทั้งหมด
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { t: 'Conversion ต่ำ', d: 'ไม่ถึงเกณฑ์มาตรฐาน', a: 'yellow' },
              { t: 'Return Rate สูง', d: 'กระทบกำไรระยะยาว', a: 'blue' },
              { t: 'Brand Damage', d: 'วัดไม่ได้แต่รู้สึกได้', a: 'green' },
            ].map((it, i) => (
              <div key={i} className="group bg-background/5 border border-background/10 rounded-2xl p-6 transition-all duration-500 hover:bg-background/10">
                <p className="font-bold text-background mb-1 hover-shift" data-accent={it.a}>{it.t}</p>
                <p className="text-background/70 text-sm">{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 3 Pillars - white */}
      <Section title="THE SOLUTION" subtitle="3 Pillars ที่ทำให้ Creatr365 แตกต่าง">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Psychology-First', desc: 'S-O-R Framework + PAD Theory + 8 ศาสตร์หลัก ลงมือปฏิบัติจริงในไลฟ์', result: 'Conversion +150-400%', accent: 'blue' as const },
            { title: 'Data-Driven', desc: 'ทุกเทคนิคอ้างอิงสถิติจริง วัดผล GMV · CVR · AOV · KPI 8 ตัว', result: 'Return Rate <15%', accent: 'red' as const },
            { title: 'AI-Ready & Global', desc: 'ทำงานร่วม AI ตั้งแต่วันแรก + Cross-border Strategy สู่เวทีสากล', result: 'Smart Lazy Style', accent: 'green' as const },
          ].map((pillar, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
            >
              <h3 className="text-2xl font-bold mb-3 text-foreground hover-shift" data-accent={pillar.accent}>{pillar.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{pillar.desc}</p>
              <p className="text-xs font-medium text-foreground/60 pt-3 border-t border-border">ผลลัพธ์: {pillar.result}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Courses Preview - dark */}
      <Section title="VALUE LADDER" subtitle="จากมือใหม่สู่ Global Professional" dark>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewCourses.map((course, i) => (
            <Link key={course.id} to={`/course/${course.slug}`} className="group">
              <div className="rounded-2xl bg-background/5 border border-background/15 p-6 h-full transition-all duration-500 hover:bg-background/10 hover:-translate-y-1">
                <span className="text-xs font-medium tracking-widest uppercase text-background/60 mb-2 block">{course.tag}</span>
                <h3 className="text-xl font-bold text-background mb-1 hover-shift" data-accent={ACCENT_CYCLE[i % 4]}>{course.title}</h3>
                <p className="text-background/70 text-sm mb-4">{course.subtitle}</p>
                <div className="pt-4 border-t border-background/10 flex items-center justify-between">
                  <p className="text-background/80 text-sm">{course.duration}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-background font-medium">
                    {course.price?.trim() ? course.price : 'ดูรายละเอียด'} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/courses" className="group inline-flex items-center gap-2 px-6 py-3 border border-background/30 text-background rounded-full hover:bg-background/10 transition-all text-sm font-medium">
            <span className="hover-shift" data-accent="yellow">ดูหลักสูตรทั้งหมด</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      {/* Target Audience - light grey */}
      <Section title="ใครควรเรียน?" subtitle="กลุ่มเป้าหมาย" className="bg-muted/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {targetAudience.map((item, i) => (
            <div key={i} className="group rounded-2xl bg-card border border-border p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-lg font-bold text-foreground mb-2 hover-shift" data-accent={ACCENT_CYCLE[i % 4]}>{item.title}</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{item.desc}</p>
              <p className="text-xs font-semibold text-foreground/70 pt-3 border-t border-border">แนะนำ: {item.recommend}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Why Us - white */}
      <Section title="WHY US" subtitle='สอนโดย "ผู้ลงมือทำจริง" — ไม่ใช่แค่ทฤษฎี'>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { stat: '6 หลัก', label: 'ยอดขายใน 2 ชั่วโมง — Conversion 12.3% สูงกว่าตลาด 4-6 เท่า', accent: 'blue' as const },
            { stat: '20+', label: 'แบรนด์ชั้นนำ — Big C · BBL · Shopee · TikTok LIVE', accent: 'red' as const },
            { stat: 'World-Class', label: 'มาตรฐานชัดเจนและแข็งแรง — ต่อยอดจากประสบการณ์ระดับสากล (Michelin VIP Service & Operations)', accent: 'yellow' as const },
            { stat: 'DPC', label: 'Demonstrate → Practice → Critique เรียนผ่านสถานการณ์จริง', accent: 'green' as const },
          ].map((item, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-3xl font-bold mb-2 text-foreground hover-shift" data-accent={item.accent}>
                {item.stat}
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA - dark */}
      <section className="py-20 md:py-28 bg-foreground text-background px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            "เราไม่สร้างนักขายออนไลน์"
          </h2>
          <p className="text-background/80 text-lg md:text-xl mb-4 leading-relaxed">
            เราสร้าง Live Streamer ที่แบรนด์ระดับโลกเลือกหา
          </p>
          <p className="text-background/60 text-base md:text-lg mb-10 italic">
            — ด้วยมาตรฐานวิชาชีพที่ยั่งยืนไปกับทุกเวที
          </p>
          <Link
            to="/courses"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground rounded-full text-base font-medium transition-all hover:bg-background/90"
          >
            <span className="hover-shift" data-accent="green">เริ่มเรียนเลย</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-background/40 text-sm">hello@creatr365.com · Bangkok, Thailand</p>
        </div>
      </section>
    </>
  );
};

export default Home;
