import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  LINE_CONTACT_URL, REG_STATUS_TH, WINDOW_TH, lineRequestMessage,
  type RegistrationStatus, type RegistrationWindow,
} from '@/lib/events';

/**
 * "Request to join" for an event (phase 1). The request is recorded here so
 * the learner can see its status and the admin sees it in Admin → กิจกรรม;
 * payment and details are then settled with a real admin on LINE, who
 * confirms the seat in Admin. Rules (window, seats, one request per
 * person) are enforced by request_event_registration() in the database.
 */

interface MyRegistration {
  status: RegistrationStatus;
  full_name: string;
  phone: string;
  line_name: string;
  email: string;
  note: string;
}

interface Props {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  window: RegistrationWindow;
  onChanged: () => void;
  onAuthRequired: () => void;
  className?: string;
}

const isSyntheticEmail = (email: string) => /^line_.+@line\.creatr365\.com$/i.test(email);

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older in-app browsers (LINE's own included) may block the clipboard API.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

const inputCls = 'w-full border border-[#1A1A1A] bg-white px-3 py-2.5 text-[15px] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FA76FF]';

export const EventRegistration: React.FC<Props> = ({
  eventId, eventTitle, eventDate, window: regWindow, onChanged, onAuthRequired, className = '',
}) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [mine, setMine] = useState<MyRegistration | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', line_name: '', email: '', note: '' });

  const loadMine = useCallback(async (u: User | null) => {
    if (!u) { setMine(null); return; }
    const { data } = await supabase
      .from('event_registrations')
      .select('status, full_name, phone, line_name, email, note')
      .eq('event_id', eventId)
      .eq('user_id', u.id)
      .maybeSingle();
    setMine((data as MyRegistration | null) ?? null);
  }, [eventId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadMine(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      loadMine(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [loadMine]);

  const openForm = async () => {
    if (!user) { onAuthRequired(); return; }
    setFormError('');
    if (mine) {
      setForm({ full_name: mine.full_name, phone: mine.phone, line_name: mine.line_name, email: mine.email, note: mine.note });
    } else {
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();
      setForm({
        full_name: profile?.display_name ?? '',
        phone: '',
        line_name: '',
        email: user.email && !isSyntheticEmail(user.email) ? user.email : '',
        note: '',
      });
    }
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) { setFormError('กรุณากรอกชื่อและเบอร์โทร'); return; }
    setSaving(true);
    setFormError('');
    const { error } = await supabase.rpc('request_event_registration', {
      _event_id: eventId,
      _full_name: form.full_name,
      _phone: form.phone,
      _line_name: form.line_name,
      _email: form.email,
      _note: form.note,
    });
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    await loadMine(user);
    onChanged();
    setFormOpen(false);
    setCopied(false);
    setLineOpen(true);
  };

  const cancelRequest = async () => {
    if (!confirm('ยกเลิกคำขอเข้าร่วมกิจกรรมนี้?')) return;
    const { error } = await supabase.rpc('cancel_event_registration', { _event_id: eventId });
    if (error) { toast({ title: 'ยกเลิกไม่สำเร็จ', description: error.message, variant: 'destructive' }); return; }
    await loadMine(user);
    onChanged();
    toast({ title: 'ยกเลิกคำขอแล้ว' });
  };

  const lineMessage = lineRequestMessage(eventTitle, eventDate, mine ?? form);

  const copyAndOpenLine = async () => {
    setCopied(await copyText(lineMessage));
    window.open(LINE_CONTACT_URL, '_blank', 'noopener,noreferrer');
  };

  // ── Which call to action to show ──
  const status = mine?.status;
  const active = status === 'requested' || status === 'confirmed' || status === 'rejected';
  const canRequest = regWindow === 'open' && !active;

  const primary = (label: string, onClick: () => void, disabled = false) => (
    <div className={`group flex items-center self-stretch relative overflow-hidden ${className}`}>
      <button onClick={onClick} disabled={disabled}
        className={`flex h-[50px] justify-center items-center gap-2.5 border relative px-2.5 py-3.5 border-solid transition-all duration-300 ease-in-out w-[calc(100%-50px)] z-10 ${disabled
          ? 'bg-gray-400 border-gray-400 cursor-not-allowed w-full'
          : 'bg-[#1A1A1A] border-[#1A1A1A] group-hover:w-full group-hover:bg-[#FA76FF] group-hover:border-[#FA76FF]'}`}>
        <span className={`text-white text-[13px] font-normal uppercase relative transition-colors duration-300 ${!disabled && 'group-hover:text-black'}`}>
          {label}
        </span>
      </button>
      {!disabled && (
        <div className="flex w-[50px] h-[50px] justify-center items-center border absolute right-0 bg-white rounded-[99px] border-solid border-[#1A1A1A] transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:scale-50 pointer-events-none z-0" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M0.857178 6H10.3929" stroke="#1A1A1A" strokeWidth="1.5" />
            <path d="M6.39282 10L10.3928 6L6.39282 2" stroke="#1A1A1A" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );

  const secondaryBtn = 'flex-1 h-[42px] border border-[#1A1A1A] text-[12px] uppercase text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors';

  let body: React.ReactNode;
  if (status === 'requested') {
    body = (
      <div className="flex flex-col gap-2 w-full">
        <p className="text-[13px] text-[#1A1A1A]">
          <span className="inline-block px-2 py-0.5 mr-2 bg-[#FA76FF] text-black text-[11px] uppercase">{REG_STATUS_TH.requested}</span>
          แอดมินจะยืนยันหลังคุยรายละเอียดทาง LINE
        </p>
        {primary('ส่งข้อความหาแอดมินทาง LINE', () => { setCopied(false); setLineOpen(true); })}
        <div className="flex gap-2">
          <button onClick={openForm} className={secondaryBtn}>แก้ไขข้อมูล</button>
          <button onClick={cancelRequest} className={secondaryBtn}>ยกเลิกคำขอ</button>
        </div>
      </div>
    );
  } else if (status === 'confirmed') {
    body = (
      <div className="flex flex-col gap-2 w-full">
        <p className="text-[13px] text-[#1A1A1A]">
          <span className="inline-block px-2 py-0.5 mr-2 bg-[#34A853] text-black text-[11px] uppercase">{REG_STATUS_TH.confirmed}</span>
          คุณได้รับการยืนยันที่นั่งแล้ว
        </p>
        <Link to="/my-events" className="h-[50px] flex items-center justify-center bg-[#1A1A1A] text-white text-[13px] uppercase hover:bg-[#FA76FF] hover:text-black transition-colors">
          ดูรายละเอียดใน กิจกรรมของฉัน
        </Link>
      </div>
    );
  } else if (status === 'rejected') {
    body = (
      <div className="flex flex-col gap-2 w-full">
        <p className="text-[13px] text-[#1A1A1A]">คำขอนี้ไม่ผ่านการยืนยัน — สอบถามเพิ่มเติมได้ทาง LINE</p>
        {primary('ติดต่อแอดมินทาง LINE', () => window.open(LINE_CONTACT_URL, '_blank', 'noopener,noreferrer'))}
      </div>
    );
  } else if (canRequest) {
    body = primary(user ? 'ขอเข้าร่วม' : 'เข้าสู่ระบบเพื่อขอเข้าร่วม', openForm);
  } else {
    body = primary(regWindow === 'open' ? 'ขอเข้าร่วม' : WINDOW_TH[regWindow], () => {}, true);
  }

  return (
    <>
      {body}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-none border-[#1A1A1A] bg-white text-[#1A1A1A] max-w-md">
          <DialogHeader>
            <DialogTitle>ขอเข้าร่วม: {eventTitle}</DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/60">
              กรอกข้อมูลให้แอดมินติดต่อกลับ จากนั้นส่งข้อความหาแอดมินทาง LINE เพื่อยืนยันที่นั่ง{mine ? '' : ' (ชำระเงินผ่าน LINE หากมีค่าใช้จ่าย)'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-[12px] uppercase">ชื่อ-นามสกุล *
              <input className={inputCls} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} autoComplete="name" required />
            </label>
            <label className="text-[12px] uppercase">เบอร์โทร *
              <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} type="tel" autoComplete="tel" required />
            </label>
            <label className="text-[12px] uppercase">ชื่อที่ใช้ใน LINE
              <input className={inputCls} value={form.line_name} onChange={e => setForm(f => ({ ...f, line_name: e.target.value }))} />
            </label>
            <label className="text-[12px] uppercase">อีเมล
              <input className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" autoComplete="email" />
            </label>
            <label className="text-[12px] uppercase">หมายเหตุถึงแอดมิน
              <textarea className={`${inputCls} resize-none`} rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </label>
            {formError && <p className="text-[13px] text-red-600" role="alert">{formError}</p>}
            <button type="submit" disabled={saving}
              className="h-[50px] bg-[#1A1A1A] text-white text-[13px] uppercase hover:bg-[#FA76FF] hover:text-black transition-colors disabled:opacity-50">
              {saving ? 'กำลังส่ง...' : mine?.status === 'requested' ? 'บันทึกการแก้ไข' : 'ส่งคำขอเข้าร่วม'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={lineOpen} onOpenChange={setLineOpen}>
        <DialogContent className="rounded-none border-[#1A1A1A] bg-white text-[#1A1A1A] max-w-md">
          <DialogHeader>
            <DialogTitle>บันทึกคำขอแล้ว — ขั้นต่อไป: ส่งข้อความหาแอดมิน</DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/60">
              กดปุ่มด้านล่างเพื่อคัดลอกข้อความและเปิด LINE แล้ว <b>วางข้อความในแชต</b> แอดมินจะยืนยันที่นั่งให้หลังคุยรายละเอียด
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap border border-[#1A1A1A]/20 bg-[#F5F5F5] p-3 text-[13px] font-sans">{lineMessage}</pre>
          <button onClick={copyAndOpenLine}
            className="h-[50px] bg-[#06C755] text-white text-[13px] uppercase hover:opacity-90 transition-opacity">
            คัดลอกข้อความ + เปิด LINE
          </button>
          {copied && <p className="text-[13px] text-[#1A1A1A]" role="status">คัดลอกแล้ว — วางในแชต LINE ได้เลย</p>}
          <button onClick={async () => setCopied(await copyText(lineMessage))}
            className="h-[42px] border border-[#1A1A1A] text-[12px] uppercase hover:bg-[#1A1A1A] hover:text-white transition-colors">
            คัดลอกข้อความอย่างเดียว
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};
