/**
 * Event rules shared by the public event page, My Events and Admin, so the
 * three never disagree about whether registration is open or what an event
 * costs. The database enforces the same window/capacity rules in
 * request_event_registration(); these helpers only decide what to show.
 */

/** LINE OA chat link — requests are finalised (and paid) with a real admin there. */
export const LINE_CONTACT_URL = 'https://lin.ee/9Mw97Rc';

/**
 * LINE ID of the Official Account (the "@xxxx" shown in LINE Official
 * Account Manager). When set (Vercel env VITE_LINE_OA_ID), registration uses
 * LINE's URL scheme `https://line.me/R/oaMessage/{ID}/?{text}`, which opens
 * the OA chat with the request text already typed in — no copy/paste.
 * On desktop the same URL is shown as a QR code: scanning it carries the
 * text to the phone, so the person never has to reopen the event on mobile.
 * Unset → falls back to the old copy + lin.ee flow.
 */
export const LINE_OA_ID = (import.meta.env.VITE_LINE_OA_ID as string | undefined)?.trim() || '';

export const lineOaMessageUrl = (text: string) =>
  LINE_OA_ID ? `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${encodeURIComponent(text)}` : '';

/** Phones/tablets open line.me/R links in the LINE app; desktops need the QR. */
export const isMobileDevice = () =>
  typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Line\//i.test(navigator.userAgent);

export type RegistrationStatus = 'requested' | 'confirmed' | 'rejected' | 'cancelled';

export const REG_STATUS_TH: Record<RegistrationStatus, string> = {
  requested: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  rejected: 'ไม่ผ่าน',
  cancelled: 'ยกเลิกแล้ว',
};

export interface EventTimingAndPrice {
  target_date: string;
  ends_at: string | null;
  capacity: number | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  price: number | null;
  early_bird_price: number | null;
  early_bird_until: string | null;
}

export const formatTHB = (n: number) =>
  `${n.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;

export const formatThaiDateTime = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
};

export function priceInfo(ev: EventTimingAndPrice, now = new Date()) {
  const regular = ev.price != null ? Number(ev.price) : null;
  const early = ev.early_bird_price != null ? Number(ev.early_bird_price) : null;
  const earlyActive = early != null
    && (!ev.early_bird_until || now <= new Date(ev.early_bird_until));
  const current = earlyActive ? early : regular;
  return {
    isFree: current == null || current === 0,
    current,
    regular,
    earlyActive,
    earlyUntil: ev.early_bird_until,
  };
}

export type RegistrationWindow = 'open' | 'not_open' | 'closed' | 'full' | 'ended';

/** Why (or whether) a new request can be made right now. */
export function registrationWindow(
  ev: EventTimingAndPrice,
  confirmed: number,
  now = new Date(),
): RegistrationWindow {
  const end = ev.ends_at ? new Date(ev.ends_at) : ev.target_date ? new Date(ev.target_date) : null;
  if (end && !isNaN(end.getTime()) && now > end) return 'ended';
  if (ev.registration_opens_at && now < new Date(ev.registration_opens_at)) return 'not_open';
  if (ev.registration_closes_at && now > new Date(ev.registration_closes_at)) return 'closed';
  if (ev.capacity != null && confirmed >= ev.capacity) return 'full';
  return 'open';
}

export const WINDOW_TH: Record<Exclude<RegistrationWindow, 'open'>, string> = {
  not_open: 'ยังไม่เปิดรับสมัคร',
  closed: 'ปิดรับสมัครแล้ว',
  full: 'ที่นั่งเต็มแล้ว',
  ended: 'กิจกรรมจบแล้ว',
};

/** The message the learner pastes into LINE so the admin knows who and what. */
export function lineRequestMessage(
  eventTitle: string,
  eventDate: string,
  reg: { full_name: string; phone: string; email?: string; line_name?: string },
) {
  return [
    `ขอเข้าร่วมกิจกรรม: ${eventTitle}`,
    eventDate ? `วันที่: ${eventDate}` : '',
    `ชื่อ: ${reg.full_name}`,
    `เบอร์: ${reg.phone}`,
    reg.email ? `อีเมล: ${reg.email}` : '',
    reg.line_name ? `ชื่อ LINE: ${reg.line_name}` : '',
  ].filter(Boolean).join('\n');
}

/** Fields of the admin event editor (`_`-prefixed ones go to event_private_details). */
export interface EventFormValues {
  target_date?: string;
  ends_at?: string | null;
  date?: string;
  time?: string;
  location_type?: string;
  venue_name?: string;
  address?: string;
  map_url?: string;
  capacity?: number | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  price?: number | null;
  early_bird_price?: number | null;
  early_bird_until?: string | null;
  price_note?: string;
  _online_url?: string;
  _attendee_info?: string;
}

/** Client-side mirror of the DB CHECK constraints, in Thai. */
export function validateEventForm(f: EventFormValues): string | null {
  if (!f.target_date) return 'ระบุวันเวลาเริ่มกิจกรรม';
  if (f.ends_at && new Date(f.ends_at) <= new Date(f.target_date)) return 'เวลาสิ้นสุดต้องหลังเวลาเริ่ม';
  if (f.capacity != null && (!Number.isInteger(f.capacity) || f.capacity < 1)) return 'จำนวนที่นั่งต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป (เว้นว่าง = ไม่จำกัด)';
  if (f.registration_opens_at && f.registration_closes_at
    && new Date(f.registration_opens_at) >= new Date(f.registration_closes_at)) return 'วันปิดรับสมัครต้องหลังวันเปิดรับสมัคร';
  if (f.price != null && f.price < 0) return 'ราคาต้องไม่ติดลบ';
  if (f.early_bird_price != null) {
    if (f.early_bird_price < 0) return 'ราคา Early Bird ต้องไม่ติดลบ';
    if (f.price != null && f.early_bird_price > f.price) return 'ราคา Early Bird ต้องไม่สูงกว่าราคาปกติ';
  }
  if (f.map_url && !/^https:\/\//i.test(f.map_url)) return 'ลิงก์แผนที่ต้องขึ้นต้นด้วย https://';
  if (f._online_url && !/^https:\/\//i.test(f._online_url)) return 'ลิงก์ห้องออนไลน์ต้องขึ้นต้นด้วย https://';
  return null;
}
