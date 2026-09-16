import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';

interface Clause { num: string; th: string; en: string; body?: string; bullets?: string[]; note?: string }

const CLAUSES: Clause[] = [
  { num:'01', th:'การยอมรับเงื่อนไข', en:'Acceptance',
    body:'การลงทะเบียนหรือใช้บริการ CREATR365 ถือว่าท่านยอมรับข้อกำหนดนี้ทั้งหมด หากท่านไม่ยอมรับ กรุณาหยุดใช้บริการ' },
  { num:'02', th:'บัญชีผู้ใช้และสิทธิ์การใช้งาน', en:'Account & License Grant',
    body:'CREATR365 ให้สิทธิ์การเข้าถึงเนื้อหาคอร์สแบบไม่ผูกขาด (non-exclusive), ไม่สามารถโอนได้ และจำกัดเฉพาะการใช้งานส่วนบุคคลของผู้ซื้อเท่านั้น ห้ามกระทำการต่อไปนี้โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร:',
    bullets: [
      'แชร์ ให้ยืม หรือโอนบัญชีผู้ใช้งานให้บุคคลอื่น',
      'บันทึกหน้าจอ หรืออัดเสียง/วิดีโอเนื้อหาคอร์ส',
      'ดาวน์โหลด คัดลอก ดัดแปลง เผยแพร่ หรือแจกจ่ายเนื้อหา',
      'เข้าสู่ระบบพร้อมกันเกินจำนวนอุปกรณ์ที่สถาบันกำหนด',
    ] },
  { num:'03', th:'ทรัพย์สินทางปัญญา', en:'Intellectual Property',
    body:'เนื้อหาทั้งหมด (วิดีโอ ไฟล์ประกอบ ข้อความ โลโก้) เป็นกรรมสิทธิ์ของ CREATR365 และ/หรือผู้สอน ห้ามนำไปใช้เชิงพาณิชย์หรืออัปโหลดขึ้นแพลตฟอร์มอื่น' },
  { num:'04', th:'การปฏิบัติตามกฎหมาย', en:'User Conduct',
    body:'ผู้ใช้ต้องไม่ใช้แพลตฟอร์มในการละเมิดกฎหมาย อัปโหลดเนื้อหาผิดกฎหมาย หรือก่อกวนระบบ การกระทำดังกล่าวอาจนำไปสู่การระงับบัญชีทันที' },
  { num:'05', th:'การระงับบัญชีและการโอนสิทธิ์', en:'Account Suspension & Transfer',
    body:'ไม่อนุญาตให้โอนสิทธิ์การเข้าถึงคอร์สให้บุคคลอื่นไม่ว่ากรณีใด บริษัทขอสงวนสิทธิ์ระงับหรือยกเลิกบัญชีผู้ใช้ทันทีโดยไม่คืนเงิน และอาจดำเนินการทางกฎหมายตามสมควร หากพบ:',
    bullets: [
      'การแชร์ ให้ยืม หรือขายต่อสิทธิ์การเข้าถึงบัญชี',
      'การละเมิดลิขสิทธิ์หรือทรัพย์สินทางปัญญาของสถาบัน',
      'การกระทำอันเป็นภัยต่อระบบหรือธุรกิจของ CREATR365',
    ] },
  { num:'06', th:'ข้อจำกัดความรับผิด', en:'Limitation of Liability',
    body:'CREATR365 จะไม่รับผิดชอบต่อความเสียหายทางอ้อมหรือผลพลอยได้ที่เกิดจากการใช้หรือไม่สามารถใช้เนื้อหาได้ ความรับผิดทั้งหมดของเราจะไม่เกินจำนวนเงินที่ท่านจ่ายสำหรับคอร์สที่เป็นประเด็นพิพาท' },
  { num:'07', th:'การเปลี่ยนแปลงข้อกำหนด', en:'Modifications',
    body:'เราอาจแก้ไขข้อกำหนดได้ตลอดเวลา โดยจะแจ้งผ่านอีเมลและหน้าเว็บไซต์ การใช้บริการต่อหลังจากนั้นถือว่ายอมรับข้อกำหนดใหม่' },
  { num:'08', th:'กฎหมายที่ใช้บังคับ', en:'Governing Law',
    body:'ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย และให้ศาลในกรุงเทพมหานครมีเขตอำนาจในการพิจารณาข้อพิพาทที่เกิดขึ้น' },
];

const Terms: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);
  return (
    <>
      <SEOHead title="ข้อกำหนดการใช้บริการ — CREATR365" description="ข้อกำหนดและเงื่อนไขการใช้บริการ CREATR365 Academy" />
      <CourseNavbar />
      <main className="bg-[#080808] min-h-screen pt-24 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">Legal</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-2">ข้อกำหนดการใช้บริการ</h1>
            <p className="text-white/40 text-sm">Terms of Service — อัปเดตล่าสุด กันยายน 2569</p>
          </div>
          <div className="space-y-4">
            {CLAUSES.map((c) => (
              <div key={c.num} className="rounded-2xl border border-white/8 bg-[#111] p-6">
                <div className="flex items-start gap-4">
                  <span className="text-xs font-mono text-[#D4A843]/60 mt-0.5 flex-shrink-0">{c.num}</span>
                  <div>
                    <h2 className="text-white font-semibold text-base mb-0.5">{c.th}</h2>
                    <p className="text-white/30 text-xs mb-3">{c.en}</p>
                    <p className="text-white/55 text-sm leading-relaxed">{c.body}</p>
                    {c.bullets && (
                      <ul className="mt-3 space-y-1.5">
                        {c.bullets.map((b, i) => (
                          <li key={i} className="text-white/50 text-sm leading-relaxed pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-white/25">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-white/8">
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">เอกสารที่เกี่ยวข้อง</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45">
              <Link to="/privacy">นโยบายความเป็นส่วนตัว</Link>
              <Link to="/refund-policy">นโยบายการคืนเงิน</Link>
              <Link to="/faq">คำถามที่พบบ่อย</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
export default Terms;
