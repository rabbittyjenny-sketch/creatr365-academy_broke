import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { ChevronDown } from 'lucide-react';

interface FAQItem { q: string; a: React.ReactNode }
interface FAQGroup { section: string; items: FAQItem[] }

const FAQS: FAQGroup[] = [
  {
    section: 'การสมัครและการเข้าเรียน',
    items: [
      { q: 'สมัครเรียนแล้วเข้าเรียนได้ทันทีหรือไม่?', a: 'หลังจากชำระเงินสำเร็จ ระบบจะเปิดสิทธิ์ให้เข้าเรียนทันทีในหน้า "คอร์สของฉัน" หากยังไม่เห็นคอร์สภายใน 5 นาที กรุณาติดต่อทีมสนับสนุนผ่านแชทสด' },
      { q: 'ฉันเข้าเรียนได้กี่อุปกรณ์?', a: '1 บัญชีผู้ใช้สามารถเรียนได้พร้อมกัน 1 อุปกรณ์ในเวลาเดียวกัน เพื่อป้องกันการแชร์บัญชี ท่านสามารถสลับอุปกรณ์ได้ตามต้องการ' },
      { q: 'อายุการเข้าถึงคอร์สเรียนมีจำกัดหรือไม่?', a: 'ทุกคอร์สให้สิทธิ์เข้าถึงตลอดชีพ (Lifetime Access) ตราบใดที่บัญชีผู้ใช้ยังคงใช้งานได้และ CREATR365 ยังให้บริการแพลตฟอร์ม' },
    ],
  },
  {
    section: 'การชำระเงิน',
    items: [
      { q: 'รองรับช่องทางการชำระเงินอะไรบ้าง?', a: 'เรารองรับบัตรเครดิต/เดบิต (Visa, Mastercard), PromptPay, QR PromptPay และ Truemoney Wallet' },
      { q: 'มีโปรโมชันหรือโค้ดส่วนลดไหม?', a: 'CREATR365 จะประกาศโปรโมชัน Early Bird และโค้ดพิเศษผ่านช่องทาง Social Media และ Newsletter เป็นครั้งคราว' },
    ],
  },
  {
    section: 'ใบเสร็จและภาษี',
    items: [
      { q: 'ขอใบเสร็จรับเงิน / ใบกำกับภาษีได้หรือไม่?', a: 'ได้ ท่านสามารถขอใบเสร็จรับเงินได้ภายใน 15 วัน นับจากวันชำระเงิน โดยระบุข้อมูลในหน้า "คำขอของฉัน" ทางเราจะออกเอกสาร e-Receipt ให้ภายใน 7 วันทำการ' },
    ],
  },
  {
    section: 'การคืนเงิน / เปลี่ยนคอร์ส',
    items: [
      { q: 'นโยบายคืนเงินเป็นอย่างไร?', a: (<>สามารถขอคืนเงินได้ภายใน 7 วัน หลังจากซื้อ โดยต้องเรียนไปแล้วไม่เกิน 20% ของคอร์ส ดูรายละเอียดเพิ่มเติมที่ <Link to="/refund-policy" className="text-[#D4A843] underline">นโยบายการคืนเงิน</Link></>) },
      { q: 'สามารถเปลี่ยนคอร์สได้ไหม?', a: 'สามารถเปลี่ยนเป็นคอร์สอื่นที่มีมูลค่าเท่ากันหรือน้อยกว่าได้ 1 ครั้งต่อการซื้อ ต้องดำเนินการภายใน 3 วัน หลังซื้อและเรียนไปแล้วไม่เกิน 15%' },
    ],
  },
  {
    section: 'Certificate และผลลัพธ์',
    items: [
      { q: 'ได้รับ Certificate เมื่อไร?', a: 'Certificate จะพร้อมให้ดาวน์โหลดเมื่อท่านผ่านทุกโมดูลในคอร์สนั้น ๆ โดยจะปรากฏในหน้า Dashboard ของท่าน' },
      { q: 'Creator Transformation System™ คืออะไร?', a: 'ระบบการเรียนรู้ 5 มิติของ CREATR365: Presence (P), Psychology (P), Authority (A), Communication (C), Trust (T) — ครบทุกมิติที่ Host มืออาชีพต้องมี' },
    ],
  },
  {
    section: 'ข้อมูลส่วนตัวและความปลอดภัย',
    items: [
      { q: 'ข้อมูลของฉันปลอดภัยไหม?', a: (<>เราใช้การเข้ารหัส SSL/TLS และการควบคุมการเข้าถึงตามบทบาท ดูรายละเอียดที่ <Link to="/privacy" className="text-[#D4A843] underline">นโยบายความเป็นส่วนตัว (PDPA)</Link></>) },
      { q: 'จะยกเลิกบัญชีหรือลบข้อมูลได้อย่างไร?', a: 'ท่านมีสิทธิ์ขอลบข้อมูลได้ตาม พ.ร.บ. PDPA โดยติดต่อได้ที่ hello@creatr365.com ทีมงานจะดำเนินการภายใน 30 วัน' },
    ],
  },
];

const FAQAccordion: React.FC<{ item: FAQItem }> = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 last:border-0">
      <button className="w-full text-left py-5 flex items-center justify-between gap-4 group" onClick={() => setOpen(!open)}>
        <span className="text-white/80 text-sm font-medium leading-relaxed group-hover:text-white transition-colors">{item.q}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-white/30 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-5 text-white/50 text-sm leading-relaxed pr-6">{item.a}</div>}
    </div>
  );
};

const FAQ: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <>
      <SEOHead title="คำถามที่พบบ่อย (FAQ) — CREATR365" description="คำถามและคำตอบเกี่ยวกับหลักสูตร การชำระเงิน การคืนเงิน และนโยบายต่าง ๆ ของ CREATR365" />
      <CourseNavbar />
      <main className="bg-[#080808] min-h-screen pt-24 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16">
            <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">Support</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">คำถามที่พบบ่อย</h1>
            <p className="text-white/40">หากไม่พบคำตอบที่ต้องการ ติดต่อเราได้ที่ <a href="mailto:hello@creatr365.com" className="text-[#D4A843] hover:opacity-80">hello@creatr365.com</a></p>
          </div>
          <div className="space-y-10">
            {FAQS.map((group) => (
              <div key={group.section}>
                <h2 className="text-xs font-bold tracking-[0.2em] text-[#CC0033] uppercase mb-2">{group.section}</h2>
                <div className="rounded-2xl border border-white/8 bg-[#111] px-6">
                  {group.items.map((item) => <FAQAccordion key={item.q} item={item} />)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14 p-6 rounded-2xl border border-white/8 bg-[#111] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm mb-1">ยังมีคำถามเพิ่มเติม?</p>
              <p className="text-white/40 text-xs">ทีมงานพร้อมช่วยเหลือคุณ 7 วัน 9.00–21.00 น.</p>
            </div>
            <a href="mailto:hello@creatr365.com" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20 hover:border-[#D4A843]/50 hover:text-[#D4A843] transition-all">
              ติดต่อเรา
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-xs text-white/25">
            <Link to="/privacy" className="hover:text-white/50 transition-colors">นโยบายความเป็นส่วนตัว</Link>
            <Link to="/terms" className="hover:text-white/50 transition-colors">ข้อกำหนดการใช้บริการ</Link>
            <Link to="/refund-policy" className="hover:text-white/50 transition-colors">นโยบายการคืนเงิน</Link>
          </div>
        </div>
      </main>
    </>
  );
};
export default FAQ;
