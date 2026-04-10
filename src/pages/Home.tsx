import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Section } from '@/components/Section';
import { RevealCard } from '@/components/RevealCard';
import { SEOHead } from '@/components/SEOHead';
import { courses, marketStats, targetAudience, colorMap } from '@/data/courseData';
import { ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="iDEAS365 - Live Shopping Host Academy"
        description="สร้างโฮสต์มืออาชีพระดับโลก Data-Driven, Psychology-First, AI-Ready"
      />
      <CourseNavbar />

      {/* Hero - Black */}
      <section className="min-h-screen flex items-center justify-center bg-foreground text-background px-4 pt-16">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex gap-2 mb-8 opacity-0 animate-fade-in">
            <span className="px-3 py-1 rounded-full bg-google-blue/20 text-google-blue text-xs font-medium">Data-Driven</span>
            <span className="px-3 py-1 rounded-full bg-google-red/20 text-google-red text-xs font-medium">Psychology-First</span>
            <span className="px-3 py-1 rounded-full bg-google-green/20 text-google-green text-xs font-medium">AI-Ready</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-6 opacity-0 animate-fade-in [animation-delay:200ms]">
            <span className="text-google-blue">i</span>
            <span className="text-google-red">D</span>
            <span className="text-google-yellow">E</span>
            <span className="text-google-green">A</span>
            <span className="text-background">S</span>
            <span className="text-background/50">365</span>
          </h1>
          <p className="text-xl md:text-2xl font-light text-background/70 mb-4 opacity-0 animate-fade-in [animation-delay:400ms]">
            LIVE SHOPPING HOST ACADEMY
          </p>
          <p className="text-lg md:text-xl text-background/50 mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in [animation-delay:600ms]">
            สร้างโฮสต์มืออาชีพที่แบรนด์ใหญ่ต้องการ<br />ไม่ใช่แค่คนพูดเก่ง
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in [animation-delay:800ms]">
            <Link to="/courses" className="group px-8 py-4 bg-google-blue text-white rounded-full text-base font-medium hover:opacity-90 transition-all inline-flex items-center gap-2">
              ดูหลักสูตรทั้งหมด
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/auth" className="px-8 py-4 border border-background/30 text-background rounded-full text-base font-medium hover:bg-background/10 transition-all">
              สมัครเรียน
            </Link>
          </div>
        </div>
      </section>

      {/* Market Stats - Blue section */}
      <Section color="blue" title="ทำไมต้อง iDEAS365?" subtitle="ตลาดกำลังโหยหามืออาชีพ">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketStats.map((stat, i) => (
            <RevealCard 
              key={i} 
              color={stat.color}
              revealContent={<p className="text-sm opacity-90">{stat.source}</p>}
            >
              <p className={`text-4xl md:text-5xl font-bold mb-2 ${colorMap[stat.color].text}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </RevealCard>
          ))}
        </div>
      </Section>

      {/* Courses Preview - Red section */}
      <Section color="red" title="หลักสูตร iDEAS365" subtitle="5 หลักสูตร ครอบคลุมทุกระดับ" dark>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course) => (
            <Link key={course.id} to={`/course/${course.id}`} className="group">
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

      {/* 3 Pillars - Green section */}
      <Section color="green" title="จุดแข็งที่ไม่มีที่ไหน" subtitle="3 Pillars">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Psychology-First', desc: 'S-O-R Framework, PAD Theory, FOMO Ladder 4 ขั้น', result: 'Conversion Rate +150-400%', color: 'blue' as const },
            { title: 'Data-Driven', desc: 'ทุกเทคนิคอ้างอิงสถิติจริง KPI ที่ต้องอ่านเป็น', result: 'โฮสต์ที่แบรนด์ใหญ่ต้องการ', color: 'red' as const },
            { title: 'AI-Ready', desc: 'AI Clipping Tools, Sentiment Analysis, Content Automation', result: 'Smart Lazy Strategy', color: 'green' as const },
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

      {/* Target Audience - Yellow section */}
      <Section color="yellow" title="ใครควรเรียน?" subtitle="กลุ่มเป้าหมาย" dark>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {targetAudience.map((item, i) => (
            <div key={i} className="group reveal-slide rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 transition-all duration-500 hover:bg-white/20">
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-white/70 text-sm mb-4 leading-relaxed">{item.desc}</p>
              <div className="relative overflow-hidden h-8">
                <p className="text-white/50 text-xs transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-4">เลื่อนเพื่อดูคำแนะนำ</p>
                <div className="absolute inset-0 translate-y-full transition-transform duration-500 group-hover:translate-y-0">
                  <p className="text-sm font-semibold text-white">แนะนำ: {item.recommend}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA - Black */}
      <section className="py-20 md:py-28 bg-foreground text-background px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            พร้อมเปลี่ยนอาชีพ<br />ของคุณ?
          </h2>
          <p className="text-background/60 text-lg mb-8">เริ่มต้นวันนี้กับ iDEAS365</p>
          <Link to="/courses" className="inline-flex items-center gap-2 px-8 py-4 bg-google-blue text-white rounded-full text-base font-medium hover:opacity-90 transition-all">
            เริ่มเรียนเลย <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-8 text-background/40 text-sm">contact@ideas365.academy · Bangkok, Thailand</p>
        </div>
      </section>
    </>
  );
};

export default Home;
