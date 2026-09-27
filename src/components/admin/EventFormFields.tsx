import React from 'react';
import type { EventFormValues } from '@/lib/events';

/**
 * Schedule / location / seats / price / attendee-only fields of the admin
 * event editor. Everything here is display + rules only — payment happens
 * on LINE, so prices are what the page shows, not what anything charges.
 */

const inputCls = 'w-full bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 placeholder-white/20';
const labelCls = 'text-xs text-white/40 font-medium block mb-1';

// timestamptz ⇄ <input type="datetime-local"> (local wall-clock time).
function isoToLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
const localInputToIso = (v: string) => (v ? new Date(v).toISOString() : null);
const numOrNull = (v: string) => (v === '' ? null : Number(v));

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="border border-white/10 p-4 space-y-3">
    <legend className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A843]">{title}</legend>
    {children}
  </fieldset>
);

const Choice: React.FC<{
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
  label: string;
}> = ({ options, value, onChange, label }) => (
  <div className="inline-flex border border-white/10" role="group" aria-label={label}>
    {options.map(([v, l]) => (
      <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v}
        className={`px-4 py-2 text-xs font-semibold transition-colors ${value === v ? 'bg-[#D4A843] text-black' : 'text-white/40 hover:text-white'}`}>
        {l}
      </button>
    ))}
  </div>
);

export const EventFormFields: React.FC<{
  form: EventFormValues;
  set: (k: string, v: unknown) => void;
}> = ({ form, set }) => {
  const isOnline = form.location_type === 'online';
  const isPaid = form.price != null;

  // Picking the real start time fills the display date/time the first time,
  // so the admin doesn't type the same thing twice (still editable).
  const setStart = (v: string) => {
    const iso = localInputToIso(v);
    set('target_date', iso ?? '');
    if (iso) {
      const d = new Date(iso);
      if (!form.date) set('date', d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }));
      if (!form.time) set('time', d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.');
    }
  };

  return (
    <>
      <Section title="วันเวลา">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="ev-start" className={labelCls}>เริ่ม *</label>
            <input id="ev-start" type="datetime-local" className={inputCls}
              value={isoToLocalInput(form.target_date)} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ev-end" className={labelCls}>สิ้นสุด</label>
            <input id="ev-end" type="datetime-local" className={inputCls}
              value={isoToLocalInput(form.ends_at)} onChange={e => set('ends_at', localInputToIso(e.target.value))} />
          </div>
          <div>
            <label htmlFor="ev-date" className={labelCls}>วันที่ (ข้อความที่แสดง) *</label>
            <input id="ev-date" className={inputCls} placeholder="เช่น 2 ต.ค. 2569"
              value={form.date || ''} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label htmlFor="ev-time" className={labelCls}>เวลา (ข้อความที่แสดง)</label>
            <input id="ev-time" className={inputCls} placeholder="เช่น 13:00–16:00 น."
              value={form.time || ''} onChange={e => set('time', e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="สถานที่">
        <Choice label="รูปแบบกิจกรรม" value={isOnline ? 'online' : 'onsite'}
          onChange={v => set('location_type', v)}
          options={[['onsite', 'ออนไซต์'], ['online', 'ออนไลน์']]} />
        {isOnline ? (
          <div>
            <label htmlFor="ev-online" className={labelCls}>ลิงก์ห้องออนไลน์ (Zoom / Meet)</label>
            <input id="ev-online" className={inputCls} placeholder="https://..."
              value={form._online_url || ''} onChange={e => set('_online_url', e.target.value)} />
            <p className="text-white/25 text-xs mt-1">แสดงเฉพาะผู้ที่ได้รับการยืนยันแล้ว ในหน้า "กิจกรรมของฉัน"</p>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="ev-venue" className={labelCls}>ชื่อสถานที่</label>
              <input id="ev-venue" className={inputCls} placeholder="เช่น CREATR365 Studio"
                value={form.venue_name || ''} onChange={e => set('venue_name', e.target.value)} />
            </div>
            <div>
              <label htmlFor="ev-address" className={labelCls}>ที่อยู่</label>
              <input id="ev-address" className={inputCls}
                value={form.address || ''} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label htmlFor="ev-map" className={labelCls}>ลิงก์ Google Maps (พิกัด)</label>
              <input id="ev-map" className={inputCls} placeholder="https://maps.app.goo.gl/..."
                value={form.map_url || ''} onChange={e => set('map_url', e.target.value)} />
              <p className="text-white/25 text-xs mt-1">เปิด Google Maps → แชร์ → คัดลอกลิงก์ ถ้าเว้นว่างจะใช้ที่อยู่ค้นหาแผนที่แทน</p>
            </div>
          </>
        )}
      </Section>

      <Section title="ที่นั่งและการรับสมัคร">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="ev-cap" className={labelCls}>จำนวนที่นั่ง</label>
            <input id="ev-cap" type="number" min={1} step={1} className={inputCls} placeholder="ไม่จำกัด"
              value={form.capacity ?? ''} onChange={e => set('capacity', numOrNull(e.target.value))} />
          </div>
          <div>
            <label htmlFor="ev-open" className={labelCls}>เปิดรับสมัคร</label>
            <input id="ev-open" type="datetime-local" className={inputCls}
              value={isoToLocalInput(form.registration_opens_at)} onChange={e => set('registration_opens_at', localInputToIso(e.target.value))} />
          </div>
          <div>
            <label htmlFor="ev-close" className={labelCls}>ปิดรับสมัคร</label>
            <input id="ev-close" type="datetime-local" className={inputCls}
              value={isoToLocalInput(form.registration_closes_at)} onChange={e => set('registration_closes_at', localInputToIso(e.target.value))} />
          </div>
        </div>
        <p className="text-white/25 text-xs">นับที่นั่งเฉพาะผู้ที่แอดมินกดยืนยันแล้ว — เว้นว่างวันเปิด/ปิด = รับสมัครจนกิจกรรมเริ่ม</p>
      </Section>

      <Section title="ราคา (แสดงผล — ชำระผ่าน LINE)">
        <Choice label="ค่าใช้จ่าย" value={isPaid ? 'paid' : 'free'}
          onChange={v => {
            if (v === 'free') { set('price', null); set('early_bird_price', null); set('early_bird_until', null); }
            else set('price', form.price ?? 0);
          }}
          options={[['free', 'ฟรี'], ['paid', 'มีค่าใช้จ่าย']]} />
        {isPaid && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="ev-price" className={labelCls}>ราคาปกติ (บาท)</label>
              <input id="ev-price" type="number" min={0} className={inputCls}
                value={form.price ?? ''} onChange={e => set('price', numOrNull(e.target.value) ?? 0)} />
            </div>
            <div>
              <label htmlFor="ev-eb" className={labelCls}>ราคา Early Bird</label>
              <input id="ev-eb" type="number" min={0} className={inputCls} placeholder="ไม่มี"
                value={form.early_bird_price ?? ''} onChange={e => set('early_bird_price', numOrNull(e.target.value))} />
            </div>
            <div>
              <label htmlFor="ev-eb-until" className={labelCls}>Early Bird ถึง</label>
              <input id="ev-eb-until" type="datetime-local" className={inputCls}
                value={isoToLocalInput(form.early_bird_until)} onChange={e => set('early_bird_until', localInputToIso(e.target.value))} />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="ev-pnote" className={labelCls}>โปรโมชัน / หมายเหตุราคา</label>
          <input id="ev-pnote" className={inputCls} placeholder="เช่น มา 2 คนลด 10% · ศิษย์เก่าลด 500 บาท"
            value={form.price_note || ''} onChange={e => set('price_note', e.target.value)} />
        </div>
      </Section>

      <Section title="ข้อมูลสำหรับผู้ที่ได้รับการยืนยัน">
        <textarea className={`${inputCls} resize-none`} rows={3}
          placeholder="เช่น จุดจอดรถ, สิ่งที่ต้องเตรียม, เบอร์ผู้ประสานงาน"
          aria-label="ข้อมูลสำหรับผู้ที่ได้รับการยืนยัน"
          value={form._attendee_info || ''} onChange={e => set('_attendee_info', e.target.value)} />
        <p className="text-white/25 text-xs">ไม่แสดงบนหน้าเว็บสาธารณะ — เห็นเฉพาะผู้ที่ยืนยันแล้ว</p>
      </Section>
    </>
  );
};
