import React from 'react';
import {
  formatTHB, formatThaiDateTime, priceInfo, registrationWindow, WINDOW_TH,
  type EventTimingAndPrice,
} from '@/lib/events';

/** Price, seats and registration window — same section style as EventLocation. */
export const EventTicketInfo: React.FC<{
  event: EventTimingAndPrice & { price_note: string };
  confirmed: number;
}> = ({ event, confirmed }) => {
  const p = priceInfo(event);
  const w = registrationWindow(event, confirmed);
  const seatsLeft = event.capacity != null ? Math.max(0, event.capacity - confirmed) : null;

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-6 py-2 border-b border-[#1A1A1A]/10 last:border-b-0">
      <dt className="text-[11px] uppercase text-[#1A1A1A]/60 shrink-0">{label}</dt>
      <dd className="text-[15px] text-[#1A1A1A] text-right">{value}</dd>
    </div>
  );

  return (
    <section className="flex flex-col items-start gap-4 self-stretch relative">
      <div className="flex flex-col items-start gap-5 self-stretch relative">
        <hr className="h-px self-stretch relative bg-[#1A1A1A] border-0" />
        <h2 className="self-stretch text-[#1A1A1A] text-[11px] font-normal uppercase relative">TICKETS</h2>
      </div>
      <dl className="self-stretch">
        {row('ราคา', p.isFree ? 'ฟรี' : (
          <>
            {p.earlyActive && p.regular != null && p.current !== p.regular && (
              <s className="mr-2 text-[#1A1A1A]/40">{formatTHB(p.regular)}</s>
            )}
            <span className="font-medium">{formatTHB(p.current ?? 0)}</span>
            {p.earlyActive && (
              <span className="block text-[11px] uppercase text-[#FA76FF]">
                Early Bird{p.earlyUntil ? ` ถึง ${formatThaiDateTime(p.earlyUntil)}` : ''}
              </span>
            )}
          </>
        ))}
        {event.price_note && row('โปรโมชัน', event.price_note)}
        {row('ที่นั่ง', seatsLeft == null ? 'ไม่จำกัด' : seatsLeft === 0 ? 'เต็มแล้ว' : `เหลือ ${seatsLeft} จาก ${event.capacity}`)}
        {row('รับสมัคร', w === 'open'
          ? (event.registration_closes_at ? `เปิดถึง ${formatThaiDateTime(event.registration_closes_at)}` : 'เปิดรับสมัคร')
          : w === 'not_open' && event.registration_opens_at
            ? `เปิด ${formatThaiDateTime(event.registration_opens_at)}`
            : WINDOW_TH[w])}
      </dl>
      {!p.isFree && (
        <p className="text-[12px] text-[#1A1A1A]/60">ชำระเงินผ่าน LINE กับแอดมินหลังส่งคำขอ — ที่นั่งยืนยันเมื่อแอดมินได้รับยอดแล้ว</p>
      )}
    </section>
  );
};
