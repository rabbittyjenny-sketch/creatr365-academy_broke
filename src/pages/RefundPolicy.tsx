import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Check, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

const RefundPolicy: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);
  return (
    <>
      <SEOHead title="นโยบายการคืนเงิน — CREATR365" description="นโยบายการคืนเงิน การเปลี่ยนคอร์ส และการยกเลิกของ CREATR365" />
      <CourseNavbar />
      <main className="section-accent bg-[#080808] min-h-screen pt-24 pb-24 px-6" style={{ '--hover-accent': '#C0A060', '--section-accent': '#C0A060' } as React.CSSProperties}>
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8">
            <ArrowLeft className="w-4 h-4" /> กลับหน้าแรก
          </Link>
          <div className="mb-6">
            <span className="text-xs font-bold tracking-[0.3em] text-[#C0A060] uppercase">Legal</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-2">นโยบายการคืนเงิน และการยกเลิก</h1>
            <p className="text-white/40 text-sm">Refund, Exchange & Cancellation Policy — อัปเดตล่าสุด กันยายน 2569</p>
          </div>
          <p className="text-white/45 text-sm leading-relaxed mb-10">
            นโยบายนี้ใช้กับการซื้อคอร์สเรียนทุกประเภทบนแพลตฟอร์ม CREATR365 ทั้งรูปแบบออนไลน์ (Online) และรูปแบบเรียนในสถานที่ (Offline / Onsite) เงื่อนไขเกี่ยวกับบัญชีผู้ใช้ การใช้งานเนื้อหา และการโอนสิทธิ์ เป็นไปตาม<Link to="/terms" className="text-[#C0A060] underline underline-offset-2">ข้อกำหนดการใช้บริการ</Link>
          </p>

          {/* Quick Summary */}
          <div className="rounded-2xl border border-[#C0A060]/25 bg-[#C0A060]/05 p-6 mb-8">
            <p className="text-[#C0A060] font-semibold text-sm mb-3">สรุปหลักสำคัญ</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'แจ้งขอคืนเงินได้ภายใน', value: '7 วัน', sub: 'นับจากวันชำระเงิน' },
                { label: 'ขอเปลี่ยนคอร์สได้ภายใน', value: '3 วัน', sub: 'เรียนไปแล้วไม่เกิน 20%' },
                { label: 'ดำเนินการคืนเงินภายใน', value: '7–15 วัน', sub: 'ทำการ' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-black text-[#C0A060]">{s.value}</p>
                  <p className="text-white/70 text-xs mt-1">{s.label}</p>
                  <p className="text-white/30 text-xs">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* 01 Eligibility - Online */}
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
              <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                <span className="text-xs font-mono text-[#C0A060]/60">01</span> เงื่อนไขการคืนเงิน — คอร์สเรียนออนไลน์
              </h2>
              <div className="space-y-2 mb-5">
                {[
                  'คืนเงินหรือเปลี่ยนคอร์สได้เฉพาะกรณีสั่งซื้อผิดคอร์ส หรือมีเหตุจำเป็นที่ไม่สามารถเรียนได้เท่านั้น',
                  'ต้องแจ้งภายใน 7 วัน นับจากวันที่ชำระเงิน และยังไม่ได้ดาวน์โหลดเอกสารประกอบการเรียน',
                  'ก่อนดาวน์โหลดเอกสารครั้งแรกของแต่ละคอร์ส ระบบจะให้ท่านยืนยันรับทราบเงื่อนไขข้อนี้ก่อนทุกครั้ง',
                  'ปัญหาที่เกิดขึ้นจากระบบ ไม่ถือเป็นความผิดพลาดของผู้เรียน และไม่นับรวมในเงื่อนไขการปฏิเสธคืนเงิน',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#34A853] flex-shrink-0 mt-0.5" />
                    <p className="text-white/60 text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/8 pt-4">
                <p className="text-white/40 text-xs font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> ไม่สามารถขอคืนเงินหรือเปลี่ยนคอร์สได้ในกรณีต่อไปนี้
                </p>
                {[
                  'เกินกำหนด 7 วัน นับจากวันที่ชำระเงิน',
                  'ได้ทำการดาวน์โหลดเอกสารประกอบการเรียนไปแล้ว',
                  'คอร์สที่ซื้อในช่วงร่วมโปรโมชัน และทำรายการสั่งซื้อสำเร็จแล้ว (สงวนสิทธิ์ทุกกรณี)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 mt-2">
                    <X className="w-4 h-4 text-[#CC0033] flex-shrink-0 mt-0.5" />
                    <p className="text-white/40 text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-white/25 text-xs italic mt-4">* กรณีนอกเหนือจากนี้ สถาบันจะพิจารณาเป็นรายกรณีไป ตามดุลยพินิจของสถาบัน</p>
            </div>

            {/* 02 Course Swap - Online */}
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
              <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                <span className="text-xs font-mono text-[#C0A060]/60">02</span> การเปลี่ยนคอร์สเรียน — คอร์สเรียนออนไลน์
              </h2>
              <div className="space-y-2">
                {[
                  'ขอเปลี่ยนคอร์สเรียนได้ หากพบว่าสั่งซื้อคอร์สไม่ตรงตามที่ต้องการ และคอร์สนั้นยังไม่ได้ดาวน์โหลดเอกสารประกอบการเรียน',
                  'ต้องดำเนินการภายใน 3 วัน นับแต่วันเริ่มเรียนครั้งแรก และเรียนไปแล้วไม่เกิน 20% ของคอร์สทั้งหมด',
                  'เปลี่ยนคอร์สเรียนได้เพียง 1 ครั้ง ต่อการสั่งซื้อ',
                  'หากคอร์สใหม่มีมูลค่าสูงกว่าคอร์สเดิม ผู้เรียนต้องชำระส่วนต่างให้ครบถ้วนก่อนเริ่มเรียน',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#34A853] flex-shrink-0 mt-0.5" />
                    <p className="text-white/60 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 03 Offline / Onsite cancellation table */}
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
              <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                <span className="text-xs font-mono text-[#C0A060]/60">03</span> การยกเลิก — คอร์สเรียนออฟไลน์ (Onsite)
              </h2>
              <div className="overflow-hidden rounded-xl border border-white/8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
                      <th className="text-left font-semibold px-4 py-3">แจ้งยกเลิกล่วงหน้า</th>
                      <th className="text-right font-semibold px-4 py-3">เงินคืน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { window: 'ตั้งแต่ 30 วันขึ้นไป ก่อนวันอบรม', amount: '100%', ok: true },
                      { window: '14–29 วัน ก่อนวันอบรม', amount: '50%', ok: true },
                      { window: 'น้อยกว่า 14 วัน ก่อนวันอบรม', amount: 'ไม่คืนเงิน', ok: false },
                    ].map((row, i) => (
                      <tr key={i} className="border-t border-white/8">
                        <td className="px-4 py-3 text-white/60">{row.window}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${row.ok ? 'text-[#34A853]' : 'text-[#CC0033]'}`}>{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 04 How to request */}
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
              <h2 className="text-white font-semibold text-base mb-5 flex items-center gap-2">
                <span className="text-xs font-mono text-[#C0A060]/60">04</span> ขั้นตอนการขอคืนเงิน / เปลี่ยนคอร์ส
              </h2>
              <div className="space-y-5">
                {[
                  { title: 'ติดต่อทีมงานพร้อม Order ID', desc: 'ส่งอีเมลแจ้งความประสงค์ พร้อมแนบ Order ID และหลักฐานการชำระเงิน (ใบเสร็จ หรืออีเมลยืนยัน)' },
                  { title: 'ทีมงานตรวจสอบเงื่อนไข', desc: 'ตรวจสอบวันที่ชำระเงิน สถานะการดาวน์โหลดเอกสาร และเงื่อนไขตามหมวด 01–03 ข้างต้น' },
                  { title: 'ดำเนินการคืนเงิน', desc: 'หากเข้าเงื่อนไข เงินจะถูกคืนผ่านช่องทางเดียวกับที่ชำระ ภายใน 7–15 วันทำการ' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="w-6 h-6 rounded-full bg-[#C0A060]/15 text-[#C0A060] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-0.5">{step.title}</p>
                      <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 05 Refund method & timeline */}
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
              <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                <span className="text-xs font-mono text-[#C0A060]/60">05</span> วิธีการและระยะเวลาคืนเงิน
              </h2>
              <div className="space-y-2 mb-5">
                {[
                  'การคืนเงินจะดำเนินการผ่านช่องทางเดียวกับที่ชำระเงิน เช่น บัตรเครดิต หรือ QR Payment',
                  'ระยะเวลาดำเนินการ 7–15 วันทำการ นับจากวันที่ได้รับหลักฐานครบถ้วน',
                  'ขอสงวนสิทธิ์ในการหักค่าธรรมเนียมการชำระเงินหรือค่าธนาคาร (ถ้ามี)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#34A853] flex-shrink-0 mt-0.5" />
                    <p className="text-white/60 text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[#34A853]/20 bg-[#34A853]/05 p-4">
                <p className="text-white/60 text-sm leading-relaxed">
                  หากสถาบันไม่สามารถจัดการเรียนการสอนได้ หรือมีเหตุจำเป็นต้องยกเลิกคอร์สเรียน ผู้เรียนจะได้รับ<span className="text-[#34A853] font-medium">เงินคืนเต็มจำนวน</span>ตามที่ชำระไว้
                </p>
              </div>
            </div>

            {/* 06 Abuse Prevention */}
            <div className="rounded-2xl border border-[#CC0033]/20 bg-[#CC0033]/05 p-6">
              <h2 className="text-white/80 font-semibold text-base mb-3 flex items-center gap-2">
                <span className="text-xs font-mono text-[#CC0033]/60">06</span> การป้องกันการใช้งานในทางที่ผิด
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                CREATR365 ขอสงวนสิทธิ์ในการปฏิเสธการคืนเงินหรือเปลี่ยนคอร์ส หากตรวจพบพฤติกรรมการใช้งานในทางที่ผิด เช่น การดาวน์โหลดเนื้อหาจำนวนมากแล้วขอคืนเงิน หรือการขอคืนเงินซ้ำซากโดยมีเจตนาทุจริต
              </p>
            </div>
          </div>

          <p className="text-white/25 text-xs italic mt-6">บริษัทฯ อาจปรับปรุงเงื่อนไขนี้ได้ตามความเหมาะสม โดยจะแจ้งให้ทราบผ่านอีเมลหรือหน้าเว็บไซต์ก่อนการเปลี่ยนแปลงมีผล</p>

          <div className="mt-8 p-5 rounded-2xl bg-[#111] border border-white/8">
            <p className="text-white/60 text-sm mb-1 font-medium">ต้องการขอคืนเงินหรือเปลี่ยนคอร์ส?</p>
            <p className="text-white/40 text-xs">ติดต่อ <a href="mailto:c365-support@ideas365.space" className="text-[#C0A060]">c365-support@ideas365.space</a> พร้อมแนบ Order ID ของท่าน</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45 pt-8 border-t border-white/8">
            <Link to="/privacy">นโยบายความเป็นส่วนตัว</Link>
            <Link to="/terms">ข้อกำหนดการใช้บริการ</Link>
            <Link to="/faq">คำถามที่พบบ่อย</Link>
          </div>
        </div>
      </main>
    </>
  );
};
export default RefundPolicy;
