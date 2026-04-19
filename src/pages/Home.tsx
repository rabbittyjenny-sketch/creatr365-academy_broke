import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Section } from '@/components/Section';
import { RevealCard } from '@/components/RevealCard';
import { SEOHead } from '@/components/SEOHead';
import { marketStats, targetAudience, colorMap } from '@/data/courseData';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';
import logoWhite from '@/assets/logo-white.png';

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
        title="iDEAS365 - Live Streamer Academy"
        description="เราไม่สร้างนักขายออนไลน์ — เราสร้าง Livestreamer ที่แบรนด์ระดับโลกเลือกหา Psychology · Data · AI"
      />
      <CourseNavbar />

      {/* Hero - Black */}
      <section className="min-h-screen flex items-center justify-center bg-foreground text-background px-4 pt-16">
        <div className="max-w-5xl mx-auto text-center">
          <div className="opacity-0 animate-fade-in [animation-delay:200ms] mb-10">
            <img src={logoWhite} alt="iDEAS365" className="h-24 md:h-40 lg:h-48 w-auto mx-auto" />
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 opacity-0 animate-fade-in [animation-delay:400ms] leading-[0.95]">
            LIVE STREAMER<br />ACADEMY
          </h1>
          <p className="text-lg md:text-2xl text-background/80 max-w-3xl mx-auto mb-4 opacity-0 animate-fade-in [animation-delay:600ms] leading-relaxed">
            Anyone can go live. Not everyone earns a global brand's trust.<br className="hidden md:block" />
            We build the ones who do.
          </p>
          <p className="text-sm md:text-base font-light text-background/50 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-in [animation-delay:800ms]">
            จากศูนย์สู่แสน ใน 2 ชั่วโมงแรก · สอนจากประสบการณ์จริง · ไม่มีสคริปต์สำเร็จรูป
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in [animation-delay:1000ms]">
            <Link to="/courses" className="group px-8 py-4 bg-background text-foreground rounded-full text-base font-medium hover:opacity-90 transition-all inline-flex items-center gap-2">
              ดูหลักสูตรทั้งหมด
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/auth" className="px-8 py-4 border border-background/30 text-background rounded-full text-base font-medium hover:bg-background/10 transition-all">
              สมัครเรียน
            </Link>
          </div>
        </div>
      </section>

      {/* Market Opportunity - Blue */}
      <Section color="blue" title="THE OPPORTUNITY" subtitle="แพลตฟอร์มโตขึ้น ความต้องการ Professional Host ก็สูงขึ้น แต่ตลาดส่วนใหญ่ยังไลฟ์แบบไม่มีทิศทาง">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketStats.map((stat, i) => (
            <RevealCard 
              key={i} 
              color={stat.color}
              revealContent={<p className="text-sm opacity-90">{stat.source}</p>}
            >
              <p className={`text-3xl md:text-4xl font-bold mb-3 ${colorMap[stat.color].text}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{stat.label}</p>
            </RevealCard>
          ))}
        </div>
      </Section>

      {/* The Problem - Red dark */}
      <Section color="red" title="THE PROBLEM" subtitle="ปัญหาที่แบรนด์ชั้นนำหาคำตอบไม่ได้" dark>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-8">
            แบรนด์ต้องการ Live Streamer ที่เข้าใจทั้ง <span className="font-bold">Brand CI + Sales Psychology + Data</span> พร้อมกัน
            <br />แต่สิ่งที่มีในตลาดคือ <span className="italic">"คนพูดหน้ากล้อง"</span> ที่ขาด 3 สิ่งนี้ทั้งหมด
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white/80 text-sm">
            <div className="bg-white/10 rounded-2xl p-5"><p className="font-bold text-white mb-1">Conversion ต่ำ</p>ไม่ถึงเกณฑ์มาตรฐาน</div>
            <div className="bg-white/10 rounded-2xl p-5"><p className="font-bold text-white mb-1">Return Rate สูง</p>กระทบกำไรระยะยาว</div>
            <div className="bg-white/10 rounded-2xl p-5"><p className="font-bold text-white mb-1">Brand Damage</p>วัดไม่ได้แต่รู้สึกได้</div>
          </div>
        </div>
      </Section>

      {/* 3 Pillars - Green */}
      <Section color="green" title="THE SOLUTION" subtitle="3 Pillars ที่ทำให้ iDEAS365 แตกต่าง">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Psychology-First', desc: 'S-O-R Framework + PAD Theory + 8 ศาสตร์หลัก ลงมือปฏิบัติจริงในไลฟ์', result: 'Conversion +150-400%', color: 'blue' as const },
            { title: 'Data-Driven', desc: 'ทุกเทคนิคอ้างอิงสถิติจริง วัดผล GMV · CVR · AOV · KPI 8 ตัว', result: 'Return Rate <15%', color: 'red' as const },
            { title: 'AI-Ready & Global', desc: 'ทำงานร่วม AI ตั้งแต่วันแรก + Cross-border Strategy สู่เวทีสากล', result: 'Smart Lazy Style', color: 'green' as const },
          ].map((pillar, i) => (
            <RevealCard 
              key={i} 
              color={pillar.color}
              revealContent={<p className="text-sm font-medium">ผลลัพธ์: {pillar.result}</p>}
            >
              <h3 className={`text-2xl font-bold mb-3 ${colorMap[pillar.color].text}`}>{pillar.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pillar.desc}</p>
            </RevealCard>
          ))}
        </div>
      </Section>

      {/* Courses Preview - Black dark */}
      <Section color="black" title="VALUE LADDER" subtitle="จากมือใหม่สู่ Global Professional" dark>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewCourses.map((course) => (
            <Link key={course.id} to={`/course/${course.slug}`} className="group">
              <div className="reveal-slide rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 h-full transition-all duration-500 hover:bg-white/20 hover:shadow-2xl">
                <span className="text-xs font-medium tracking-widest uppercase text-white/60 mb-2 block">{course.tag}</span>
                <h3 className="text-xl font-bold text-white mb-1">{course.title}</h3>
                <p className="text-white/70 text-sm mb-4">{course.subtitle}</p>
                <div className="relative overflow-hidden">
                  <p className="text-white/90 text-sm mb-4 transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-4">{course.duration}</p>
                  <div className="absolute inset-0 translate-y-full transition-transform duration-500 group-hover:translate-y-0">
                    <p className="text-lg font-bold text-white">{course.price}</p>
                    <span className="inline-flex items-center gap-1 text-sm text-white/80 mt-1">
                      ดูรายละเอียด <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/courses" className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white rounded-full hover:bg-white/10 transition-all text-sm font-medium">
            ดูหลักสูตรทั้งหมด <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      {/* Target Audience - Yellow with dark text */}
      <Section color="yellow" title="ใครควรเรียน?" subtitle="กลุ่มเป้าหมาย">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {targetAudience.map((item, i) => (
            <div key={i} className="group reveal-slide rounded-2xl bg-foreground/5 border border-foreground/10 p-6 transition-all duration-500 hover:bg-foreground/10">
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-foreground/70 text-sm mb-4 leading-relaxed">{item.desc}</p>
              <div className="relative overflow-hidden h-8">
                <p className="text-foreground/50 text-xs transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-4">เลื่อนเพื่อดูคำแนะนำ</p>
                <div className="absolute inset-0 translate-y-full transition-transform duration-500 group-hover:translate-y-0">
                  <p className="text-sm font-semibold text-foreground">แนะนำ: {item.recommend}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Why Us - Blue */}
      <Section color="blue" title="WHY US" subtitle='สอนโดย "ผู้ลงมือทำจริง" — ไม่ใช่แค่ทฤษฎี'>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { stat: '6 หลัก', label: 'ยอดขายใน 2 ชั่วโมง — Conversion 12.3% สูงกว่าตลาด 4-6 เท่า', accent: 'blue' as const },
            { stat: '20+', label: 'แบรนด์ชั้นนำ — Big C · BBL · Shopee · TikTok LIVE', accent: 'red' as const },
            { stat: 'World-Class', label: 'มาตรฐานชัดเจนและแข็งแรง — ต่อยอดจากประสบการณ์ระดับสากล (Michelin VIP Service & Operations)', accent: 'yellow' as const },
            { stat: 'DPC', label: 'Demonstrate → Practice → Critique เรียนผ่านสถานการณ์จริง', accent: 'green' as const },
          ].map((item, i) => {
            const c = colorMap[item.accent];
            return (
              <div
                key={i}
                style={{ ['--accent' as any]: c.hex }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-transparent hover:[background:var(--accent)]"
              >
                <p className={`text-3xl font-bold mb-2 ${c.text} transition-colors duration-500 group-hover:text-white`}>
                  {item.stat}
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed transition-colors duration-500 group-hover:text-white/95">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* CTA - Black/White only, hover reveals page accent (blue) */}
      <section className="group/cta py-20 md:py-28 bg-foreground text-background px-4 transition-colors duration-500">
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
            className="inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground rounded-full text-base font-medium transition-all hover:bg-google-blue hover:text-white"
          >
            เริ่มเรียนเลย <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1" />
          </Link>
          <p className="mt-8 text-background/40 text-sm">hello@ideas365.space · Bangkok, Thailand</p>
        </div>
      </section>
    </>
  );
};

export default Home;
