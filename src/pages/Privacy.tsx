import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';

const SECTIONS = [
  {
    num: '01', th: 'ข้อมูลที่เราเก็บรวบรวม', en: 'Data We Collect',
    body: [
      '• ข้อมูลส่วนบุคคล: ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์, ที่อยู่สำหรับออกใบกำกับภาษี',
      '• ข้อมูลการใช้งาน: ประวัติการเข้าดูคอร์ส, คะแนนแบบทดสอบ, ไฟล์งานที่อัปโหลด',
      '• ข้อมูลทางเทคนิค: IP address, ประเภทอุปกรณ์, Browser',
    ],
  },
  {
    num: '02', th: 'วัตถุประสงค์ในการเก็บข้อมูล', en: 'Purposes of Processing',
    body: [
      '• สร้างและจัดการบัญชีผู้เรียน',
      '• ประมวลผลการชำระเงินและออกใบเสร็จ',
      '• ให้บริการคอร์สเรียนและฟีเจอร์ต่าง ๆ',
      '• ปรับปรุงเนื้อหาและประสบการณ์ผู้ใช้',
      '• ส่งข่าวสารทางการตลาด (เมื่อได้รับความยินยอม)',
    ],
  },
  {
    num: '03', th: 'ฐานกฎหมายในการประมวลผล', en: 'Legal Basis',
    body: [
      '• การปฏิบัติตามสัญญา (การให้บริการคอร์สเรียน)',
      '• ความยินยอม (ข่าวสารการตลาด, คุกกี้ที่ไม่จำเป็น)',
      '• ประโยชน์อันชอบธรรม (การป้องกันทุจริต, การปรับปรุงแพลตฟอร์ม)',
    ],
  },
  {
    num: '04', th: 'การเปิดเผยข้อมูลต่อบุคคลภายนอก', en: 'Third-Party Disclosure',
    body: [
      '• เราจะไม่ขายข้อมูลส่วนบุคคลของท่าน',
      '• อาจแบ่งปันข้อมูลเท่าที่จำเป็นแก่ผู้ประมวลผลข้อมูล เช่น ระบบชำระเงิน, ผู้ให้บริการอีเมล และที่ปรึกษากฎหมาย ภายใต้สัญญาประมวลผลข้อมูล (DPA) ที่เข้มงวด',
    ],
  },
  {
    num: '05', th: 'สิทธิ์ของเจ้าของข้อมูล', en: 'Your Rights',
    body: [
      '• สิทธิ์ในการเข้าถึง แก้ไข ลบ หรือโอนย้ายข้อมูล',
      '• สิทธิ์ในการเพิกถอนความยินยอม',
      '• สิทธิ์ในการคัดค้านการประมวลผล',
      '• ใช้สิทธิ์ได้ที่ c365-support@ideas365.space — เราจะตอบกลับภายใน 30 วัน',
    ],
  },
  {
    num: '06', th: 'ระยะเวลาเก็บข้อมูล', en: 'Data Retention',
    body: [
      '• เก็บข้อมูลบัญชีตลอดอายุสมาชิกและ 5 ปีหลังจากปิดบัญชี',
      '• ข้อมูลการสมัครข่าวสารจะถูกเก็บจนกว่าท่านยกเลิก',
    ],
  },
  {
    num: '07', th: 'การรักษาความปลอดภัย', en: 'Security',
    body: [
      '• เราใช้การเข้ารหัส SSL/TLS',
      '• การควบคุมการเข้าถึงตามบทบาท (Role-based Access Control)',
      '• การตรวจสอบความปลอดภัยประจำปี',
    ],
  },
  {
    num: '08', th: 'การเปลี่ยนแปลงนโยบาย', en: 'Policy Changes',
    body: [
      '• หากมีการเปลี่ยนแปลงนโยบายสำคัญ เราจะแจ้งผ่านอีเมลและประกาศบนเว็บไซต์ล่วงหน้า 30 วัน',
    ],
  },
  {
    num: '09', th: 'ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)', en: 'Data Protection Officer',
    body: ['อีเมล: c365-support@ideas365.space'],
  },
];

const Privacy: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <>
      <SEOHead title="นโยบายความเป็นส่วนตัว (PDPA) — CREATR365" description="นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. PDPA ของ CREATR365" />
      <CourseNavbar />
      <main className="section-accent bg-[#080808] min-h-screen pt-24 pb-24 px-6" style={{ '--hover-accent': '#C0A060', '--section-accent': '#C0A060' } as React.CSSProperties}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-bold tracking-[0.3em] text-[#C0A060] uppercase">Legal</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-2">นโยบายความเป็นส่วนตัว</h1>
            <p className="text-white/40 text-sm">Privacy Policy & PDPA Notice — อัปเดตล่าสุด มิถุนายน 2568</p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((s) => (
              <div key={s.num} className="rounded-2xl border border-white/8 bg-[#111] p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-xs font-mono text-[#C0A060]/60 mt-1">{s.num}</span>
                  <div>
                    <h2 className="text-white font-semibold text-base">{s.th}</h2>
                    <p className="text-white/30 text-xs">{s.en}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {s.body.map((line, i) => (
                    <li key={i} className="text-white/55 text-sm leading-relaxed">{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-white/8">
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">เอกสารที่เกี่ยวข้อง</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45">
              <Link to="/terms">ข้อกำหนดการใช้บริการ</Link>
              <Link to="/refund-policy">นโยบายการคืนเงิน</Link>
              <Link to="/faq">คำถามที่พบบ่อย</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
export default Privacy;
