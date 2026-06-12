import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Check, X, AlertTriangle } from 'lucide-react';

const RefundPolicy: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);
  return (
    <>
      <SEOHead title="นโยบายการคืนเงิน — CREATR365" description="นโยบายการคืนเงิน เปลี่ยนคอร์ส และโอนสิทธิ์ของ CREATR365" />
      <CourseNavbar />
      <main className="bg-[#080808] min-h-screen pt-24 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-bold tracking-[0.3em] text-[#D4A843] uppercase">Legal</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-2">นโยบายการคืนเงิน</h1>
            <p className="text-white/40 text-sm">Refund, Exchange & Transfer Policy — อัปเดตล่าสุด มิถุนายน 2568</p>
          </div>

          {/* Quick Summary */}
          <div className="rounded-2xl border border-[#D4A843]/25 bg-[#D4A843]/05 p-6 mb-8">
            <p className="text-[#D4A843] font-semibold text-sm mb-3">สรุปหลักสำคัญ</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'คืนเงินได้ภายใน', value: '7 วัน', sub: 'หลังจากซื้อ' },
                { label: 'เรียนไปแล้วไม่เกิน', value: '20%', sub: 'ของเนื้อหาคอร์ส' },
                { label: 'คืนเงินภายใน', value: '14 วัน', sub: 'ทำการ' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-black text-[#D4A843]">{s.value}</p>
                  <p className="text-white/70 text-xs mt-1">{s.label}</p>
                  <p className="text-white/30 text-xs">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Refund */}
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
              <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                <span className="text-xs font-mono text-[#D4A843]/60">01</span> การขอคืนเงิน (Refund)
              </h2>
              <div className="space-y-2 mb-5">
                {[
                  'ขอคืนเงินได้ภายใน 7 วัน นับจากวันที่ซื้อ',
                  'ต้องเรียนไปแล้วไม่เกิน 20% ของเนื้อหาทั้งหมด (นับจากจำนวนบทเรียนที่เปิดดู)',
                  'เงินจะคืนเข้าช่องทางเดิมภายใน 14 วันทำการ',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#34A853] flex-shrink-0 mt-0.5" />
                    <p className="text-white/60 text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/8 pt-4">
                <p className="text-white/40 text-xs font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> ไม่สามารถขอคืนเงินได้ในกรณีต่อไปนี้
                </p>
                {[
                  'คอร์สที่ซื้อในช่วงโปรโมชัน "Flash Sale" หรือที่ระบุว่า "ไม่รับคืนเงิน"',
                  'การซื้อแบบเหมาจ่าย (Bundle) หากเปิดเรียนแล้วมากกว่า 10% ของทั้งชุด',
                  'คอร์สที่มอบเป็นของขวัญ (Gift) หลังจากผู้รับเปิดใช้งานแล้ว',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 mt-2">
                    <X className="w-4 h-4 text-[#CC0033] flex-shrink-0 mt-0.5" />
                    <p className="text-white/40 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Swap */}
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
              <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                <span className="text-xs font-mono text-[#D4A843]/60">02</span> การเปลี่ยนคอร์ส (Course Swap)
              </h2>
              <div className="space-y-2">
                {[
                  'สามารถเปลี่ยนเป็นคอร์สอื่นที่มีมูลค่าเท่ากันหรือน้อยกว่าได้ 1 ครั้งต่อการซื้อ',
                  'ต้องดำเนินการภายใน 3 วัน หลังซื้อ และเรียนไปแล้วไม่เกิน 15%',
                  'หากคอร์สใหม่ราคาถูกกว่า ส่วนต่างจะเก็บเป็นเครดิตในบัญชี (ไม่คืนเป็นเงินสด)',
                  'หากคอร์สใหม่ราคาสูงกว่า ผู้เรียนต้องชำระส่วนต่าง',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#4285F4] flex-shrink-0 mt-0.5" />
                    <p className="text-white/60 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer */}
            <div className="rounded-2xl border border-white/8 bg-[#111] p-6">
              <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
                <span className="text-xs font-mono text-[#D4A843]/60">03</span> การโอนสิทธิ์ (Transfer)
              </h2>
              <div className="flex items-start gap-3">
                <X className="w-4 h-4 text-[#CC0033] flex-shrink-0 mt-0.5" />
                <p className="text-white/60 text-sm">
                  ไม่อนุญาตให้โอนสิทธิ์เข้าถึงคอร์สให้บุคคลอื่น การแชร์บัญชีหรือขายต่อสิทธิ์จะนำไปสู่การระงับบัญชีโดยไม่คืนเงิน
                </p>
              </div>
            </div>

            {/* Abuse Prevention */}
            <div className="rounded-2xl border border-[#CC0033]/20 bg-[#CC0033]/05 p-6">
              <h2 className="text-white/80 font-semibold text-base mb-3 flex items-center gap-2">
                <span className="text-xs font-mono text-[#CC0033]/60">04</span> การป้องกันการใช้งานในทางที่ผิด
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                CREATR365 ขอสงวนสิทธิ์ในการปฏิเสธการคืนเงินหรือเปลี่ยนคอร์ส หากตรวจพบพฤติกรรมการใช้งานในทางที่ผิด เช่น การดาวน์โหลดเนื้อหาจำนวนมากแล้วขอคืนเงิน หรือการขอคืนเงินซ้ำซากโดยมีเจตนาทุจริต
              </p>
            </div>
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-[#111] border border-white/8">
            <p className="text-white/60 text-sm mb-1 font-medium">ต้องการขอคืนเงินหรือเปลี่ยนคอร์ส?</p>
            <p className="text-white/40 text-xs">ติดต่อ <a href="mailto:hello@creatr365.com" className="text-[#D4A843]">hello@creatr365.com</a> พร้อมแนบ Order ID ของท่าน</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-xs text-white/25 pt-8 border-t border-white/8">
            <Link to="/privacy" className="hover:text-white/50 transition-colors">นโยบายความเป็นส่วนตัว</Link>
            <Link to="/terms" className="hover:text-white/50 transition-colors">ข้อกำหนดการใช้บริการ</Link>
            <Link to="/faq" className="hover:text-white/50 transition-colors">FAQ</Link>
          </div>
        </div>
      </main>
    </>
  );
};
export default RefundPolicy;
