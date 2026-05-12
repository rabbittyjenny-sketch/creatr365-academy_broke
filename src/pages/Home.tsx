import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Section } from '@/components/Section';
import { SEOHead } from '@/components/SEOHead';
import { marketStats, targetAudience } from '@/data/courseData';
import { ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-live-streamer.png';

const Home: React.FC = () => {

  return (
    <>
      <SEOHead
        title="Creatr365 - Live Streamer Academy"
        description="เราไม่สร้างนักขายออนไลน์ — เราสร้าง Livestreamer ที่แบรนด์ระดับโลกเลือกหา Psychology · Data · AI"
      />
      <CourseNavbar />

      {/* Hero — full-bleed image + 2 CTAs */}
      <section className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground pt-16 pb-12">
        <div className="w-full">
          <img
            src={heroImage}
            alt="Live Streamer Academy — Creatr365"
            className="block w-full h-auto opacity-0 animate-fade-in [animation-delay:200ms]"
          />
        </div>
        <div className="w-full px-4">
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in [animation-delay:600ms]">
            <Link
              to="/courses"
              data-accent="blue"
              className="btn-brand group px-8 py-4 rounded-lg text-base font-medium"
            >
              ดูหลักสูตรทั้งหมด
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/auth"
              data-accent="green"
              className="btn-brand btn-brand--outline px-8 py-4 rounded-lg text-base font-medium text-center"
            >
              สมัครเรียน
            </Link>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <Section
        title="THE OPPORTUNITY"
        subtitle="แพลตฟอร์มโตขึ้น ความต้องการ Professional Host ก็สูงขึ้น แต่ตลาดส่วนใหญ่ยังไลฟ์แบบไม่มีทิศทาง"
        accent="blue"
        className="bg-muted/40"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketStats.map((stat, i) => (
            <div
              key={i}
              className="card-water rounded-2xl border border-border bg-card p-6"
            >
              <p className="text-3xl md:text-4xl font-bold mb-3 text-foreground hover-shift">{stat.value}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{stat.label}</p>
              <p className="text-xs text-muted-foreground/60 italic">{stat.source}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* The Problem */}
      <Section
        title="THE PROBLEM"
        subtitle="ปัญหาที่แบรนด์ชั้นนำหาคำตอบไม่ได้"
        accent="red"
        dark
      >
        <div className="max-w-4xl mx-auto space-y-5 text-background/90 text-lg md:text-xl leading-relaxed">
          <p>วันนี้ Live Commerce ไม่ใช่แค่การไลฟ์ขายของอีกต่อไป</p>
          <p>
            แต่กำลังเปลี่ยนจาก{' '}
            <span className="italic">‘การขายของ Online ไปสู่ อุตสาหกรรมระดับโลก’</span>
          </p>
          <p>
            และอาชีพ <span className="font-semibold">Live Streamer</span> หรือ{' '}
            <span className="font-semibold">Host</span> ก็เป็นหนึ่งในอาชีพที่เติบโตเร็วที่สุดในยุค{' '}
            <span className="whitespace-nowrap">Creator Economy</span>
          </p>
          <p>แต่ในปัจจุบันอาชีพนี้ก็ยังไม่เพียงพอต่อความต้องการของตลาด เพราะแบรนด์ใหญ่...</p>
          <p className="text-background font-semibold text-xl md:text-2xl pt-2">
            “ต้องการ Host ที่มีคุณภาพและมาตรฐาน ไม่ใช่แค่สร้างยอดขายเป็นอย่างเดียว”
          </p>
          <p className="text-background/70 italic pt-2">
            — เพราะคนที่มีทักษะ … คือคนที่มีโอกาสเติบโตมากที่สุด
          </p>
        </div>
      </Section>

      {/* The Solution */}
      <Section
        title="THE SOLUTION"
        subtitle="แนวคิดของเรา"
        accent="green"
      >
        <div className="max-w-4xl mx-auto space-y-5 text-foreground/90 text-lg md:text-xl leading-relaxed">
          <p>
            เพราะเราเชื่อว่า Live Commerce อาจไม่ได้ต้องการคนที่เสียงดัง
            หรือแค่สร้างยอดขายได้เพียง<span className="whitespace-nowrap">อย่างเดียว</span>
          </p>
          <p>
            แต่ควรเติบโตด้วยความเข้าใจผู้บริโภค เข้าใจกฎหมายและความถูกต้อง
            ด้วยมาตรฐานการสื่อสารที่ดี
          </p>
          <p>
            และทั้งหมดนี้คือทักษะ ที่คุณจะนำไปใช้ได้
            ทั้งในธุรกิจ การขาย และโลกของ Creator Economy
          </p>
          <p className="pt-4 text-foreground italic border-l-2 border-foreground/20 pl-5">
            “ด้วยการเรียนรู้ที่เป็นแบบ Learning Flow ที่ภายในระบบการเรียน
            จะมีทั้ง Free Courses และ Foundation Courses สำหรับคนที่เริ่มต้น
            ไปจนถึงหลักสูตรด้าน <span className="whitespace-nowrap">Psychology Communication”</span>
          </p>
        </div>
      </Section>

      {/* Target Audience */}
      <Section
        title="ใครควรเรียน?"
        subtitle="กลุ่มเป้าหมายของหลักสูตร"
        accent="blue"
        dark
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {targetAudience.map((item, i) => (
            <div key={i} className="card-water bg-background/5 border border-background/20 p-6">
              <h3 className="text-lg font-bold text-background mb-2">{item.title}</h3>
              <p className="text-background/70 text-sm mb-4 leading-relaxed">{item.desc}</p>
              <p className="text-xs font-semibold text-background/70 pt-3 border-t border-background/20">แนะนำ: {item.recommend}</p>
            </div>
          ))}
        </div>
        <div className="max-w-2xl mx-auto mt-12 text-background/90 text-lg md:text-xl leading-relaxed">
          <p className="mb-6">ไม่ว่าคุณจะเป็น</p>
          <ul className="space-y-3 mb-8">
            {[
              'คนที่อยากเริ่มสายไลฟ์',
              'Creator ที่อยากเพิ่มรายได้',
              'Host ที่อยากยกระดับตัวเอง',
              'หรือคนที่อยากเข้าสู่ตลาด Global Commerce',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-background/50">✦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-background font-semibold">
            ที่นี่ถูกออกแบบมาเพื่อคุณ
          </p>
        </div>
        <div className="mt-12 text-center">
          <Link
            to="/courses"
            data-accent="blue"
            className="btn-brand btn-brand--outline group px-6 py-3 rounded-lg text-sm font-medium border-background/30 text-background"
          >
            ดูหลักสูตรทั้งหมด <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Section>

      {/* Why Us */}
      <Section
        title="WHY US"
        subtitle='สอนโดย "ผู้ลงมือทำจริง" — ไม่ใช่แค่ทฤษฎี'
        accent="green"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { stat: '6 หลัก', label: 'ยอดขายใน 2 ชั่วโมง — Conversion 12.3% สูงกว่าตลาด 4-6 เท่า' },
            { stat: '20+', label: 'แบรนด์ชั้นนำ — Big C · BBL · Shopee · TikTok LIVE' },
            { stat: 'World-Class', label: 'มาตรฐานชัดเจนและแข็งแรง — ต่อยอดจากประสบการณ์ระดับสากล (Michelin VIP Service & Operations)' },
            { stat: 'DPC', label: 'Demonstrate → Practice → Critique เรียนผ่านสถานการณ์จริง' },
          ].map((item, i) => (
            <div
              key={i}
              className="card-water rounded-2xl border border-border bg-card p-6"
            >
              <p className="text-3xl font-bold mb-2 text-foreground hover-shift">{item.stat}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="max-w-3xl mx-auto mt-12 space-y-5 text-center text-foreground/85 text-lg md:text-xl leading-relaxed">
          <p>
            “เพราะในโลกของ Live Commerce คนที่พูดเก่ง… อาจไม่ใช่คนที่เติบโตที่สุด
          </p>
          <p>
            แต่คนที่เข้าใจผู้ชม เข้าใจแบรนด์ และสร้าง Trust ได้ต่างหาก ที่จะอยู่ในอุตสาหกรรมนี้ได้ระยะยาว”
          </p>
        </div>
      </Section>

      {/* CTA - dark */}
      <section className="py-20 md:py-28 bg-foreground text-background px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            “CREATR365 ไม่ได้สร้างแค่ Host แต่กำลังสร้างมาตรฐานใหม่ของอาชีพนี้”
          </h2>
          <Link
            to="/courses"
            data-accent="green"
            className="btn-brand btn-brand--outline group px-8 py-4 rounded-lg text-base font-medium border-background text-background"
          >
            <span>เริ่มเรียนเลย</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-8 text-background/40 text-sm">hello@creatr365.com · Bangkok, Thailand</p>
        </div>
      </section>
    </>
  );
};

export default Home;
