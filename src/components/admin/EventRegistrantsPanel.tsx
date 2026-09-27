import React, { useCallback, useEffect, useState } from 'react';
import { X, Download, Check, Ban, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { REG_STATUS_TH, formatThaiDateTime, type RegistrationStatus } from '@/lib/events';

/**
 * One event's sign-up sheet: every request, approve / reject in place, and a
 * CSV download that opens straight in Google Sheets or Excel. The system
 * stays the source of truth (the learner sees the status this sets), so
 * there is no second copy in a live Sheet to drift out of sync.
 */

interface Registrant {
  id: string;
  user_id: string;
  status: RegistrationStatus;
  full_name: string;
  phone: string;
  line_name: string;
  email: string;
  note: string;
  admin_note: string;
  registered_at: string;
  decided_at: string | null;
}

const STATUS_STYLE: Record<RegistrationStatus, string> = {
  requested: 'bg-[#D4A843]/15 border-[#D4A843]/30 text-[#D4A843]',
  confirmed: 'bg-[#34A853]/15 border-[#34A853]/30 text-[#34A853]',
  rejected: 'bg-[#CC0033]/15 border-[#CC0033]/30 text-[#FF6B7F]',
  cancelled: 'bg-white/5 border-white/10 text-white/40',
};

type Filter = 'all' | RegistrationStatus;

function toCsv(rows: Registrant[], title: string) {
  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const head = ['ชื่อ', 'เบอร์', 'LINE', 'อีเมล', 'หมายเหตุผู้สมัคร', 'สถานะ', 'เวลาที่ขอ', 'เวลาที่ตัดสิน', 'หมายเหตุแอดมิน'];
  const body = rows.map(r => [
    r.full_name, r.phone, r.line_name, r.email, r.note, REG_STATUS_TH[r.status],
    formatThaiDateTime(r.registered_at), formatThaiDateTime(r.decided_at), r.admin_note,
  ].map(esc).join(','));
  // BOM so Excel reads Thai as UTF-8; Google Sheets ignores it.
  const blob = new Blob(['﻿' + [head.map(esc).join(','), ...body].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  // ASCII only — Chromium falls back to "download" for a Thai filename.
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event';
  a.download = `registrants-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  // Attached + revoked later: a detached link or an immediate revoke makes
  // some browsers drop the filename (or the download).
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

export const EventRegistrantsPanel: React.FC<{
  eventId: string;
  eventTitle: string;
  capacity: number | null;
  onClose: () => void;
  onChanged: () => void;
}> = ({ eventId, eventTitle, capacity, onClose, onChanged }) => {
  const [rows, setRows] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('event_registrations')
      .select('id, user_id, status, full_name, phone, line_name, email, note, admin_note, registered_at, decided_at')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: true });
    if (err) setError('โหลดรายชื่อไม่สำเร็จ: ' + err.message);
    setRows((data as Registrant[]) || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const confirmedCount = rows.filter(r => r.status === 'confirmed').length;

  const setStatus = async (r: Registrant, status: RegistrationStatus) => {
    let admin_note = r.admin_note;
    if (status === 'confirmed' && capacity != null && confirmedCount >= capacity
      && !confirm(`ที่นั่งเต็มแล้ว (${confirmedCount}/${capacity}) — ยืนยันเกินจำนวนหรือไม่?`)) return;
    if (status === 'rejected') {
      const reason = prompt('เหตุผล (ไม่บังคับ — ผู้สมัครจะไม่เห็น ใช้บันทึกภายใน)', r.admin_note);
      if (reason === null) return;
      admin_note = reason.trim();
    }
    setBusyId(r.id);
    setError('');
    const { error: err } = await supabase
      .from('event_registrations')
      .update({ status, admin_note, decided_at: status === 'requested' ? null : new Date().toISOString() })
      .eq('id', r.id);
    setBusyId(null);
    if (err) { setError('เปลี่ยนสถานะไม่สำเร็จ: ' + err.message); return; }
    await load();
    onChanged();
  };

  const counts: Record<Filter, number> = {
    all: rows.length,
    requested: rows.filter(r => r.status === 'requested').length,
    confirmed: confirmedCount,
    rejected: rows.filter(r => r.status === 'rejected').length,
    cancelled: rows.filter(r => r.status === 'cancelled').length,
  };
  const visible = rows.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="admin-modal-surface fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[#111] border border-white/10 w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={`ผู้สมัคร ${eventTitle}`}>
        <div className="border-b border-white/8 px-6 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#D4A843] uppercase">ผู้สมัคร</p>
            <h2 className="text-white font-semibold text-base truncate">{eventTitle}</h2>
            <p className="text-white/40 text-xs mt-0.5">
              ยืนยันแล้ว {confirmedCount}{capacity != null ? ` / ${capacity} ที่นั่ง` : ' คน (ไม่จำกัดที่นั่ง)'}
            </p>
          </div>
          <button onClick={() => toCsv(visible, eventTitle)} disabled={!visible.length}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-white/15 text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30">
            <Download className="w-3.5 h-3.5" /> ดาวน์โหลด CSV
          </button>
          <button onClick={onClose} aria-label="ปิด" className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4 flex flex-wrap gap-2" role="tablist" aria-label="กรองสถานะ">
          {(['all', 'requested', 'confirmed', 'rejected', 'cancelled'] as const).map(k => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 text-xs font-semibold border transition-colors ${filter === k
                ? 'bg-[#D4A843] text-black border-[#D4A843]' : 'border-white/10 text-white/50 hover:text-white'}`}>
              {k === 'all' ? 'ทั้งหมด' : REG_STATUS_TH[k]} <span className="opacity-60">({counts[k]})</span>
            </button>
          ))}
        </div>

        {error && <p className="mx-6 mt-3 p-3 text-xs border bg-[#CC0033]/15 border-[#CC0033]/30 text-[#FF6B7F]" role="alert">{error}</p>}

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <p className="text-white/30 text-sm text-center py-10">กำลังโหลด...</p>
          ) : visible.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-10">ยังไม่มีผู้สมัครในหมวดนี้</p>
          ) : (
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-white/8 text-left text-white/30 text-[10px] uppercase tracking-wider">
                  <th className="py-2 pr-3 font-semibold">ผู้สมัคร</th>
                  <th className="py-2 pr-3 font-semibold">ติดต่อ</th>
                  <th className="py-2 pr-3 font-semibold">หมายเหตุ</th>
                  <th className="py-2 pr-3 font-semibold">ขอเมื่อ</th>
                  <th className="py-2 pr-3 font-semibold">สถานะ</th>
                  <th className="py-2 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visible.map(r => (
                  <tr key={r.id} className="align-top">
                    <td className="py-3 pr-3">
                      <p className="text-white font-medium">{r.full_name || '—'}</p>
                      {r.line_name && <p className="text-white/40 text-xs">LINE: {r.line_name}</p>}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {r.phone && <a href={`tel:${r.phone}`} className="block text-white/70 hover:text-white">{r.phone}</a>}
                      {r.email && <a href={`mailto:${r.email}`} className="block text-white/40 hover:text-white break-all">{r.email}</a>}
                    </td>
                    <td className="py-3 pr-3 text-xs text-white/50 max-w-[220px]">
                      {r.note && <p className="whitespace-pre-line">{r.note}</p>}
                      {r.admin_note && <p className="mt-1 text-white/30">แอดมิน: {r.admin_note}</p>}
                    </td>
                    <td className="py-3 pr-3 text-xs text-white/40 whitespace-nowrap">{formatThaiDateTime(r.registered_at)}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold border ${STATUS_STYLE[r.status]}`}>
                        {REG_STATUS_TH[r.status]}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        {r.status !== 'confirmed' && r.status !== 'cancelled' && (
                          <button onClick={() => setStatus(r, 'confirmed')} disabled={busyId === r.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#34A853] text-black disabled:opacity-40">
                            <Check className="w-3.5 h-3.5" /> ยืนยัน
                          </button>
                        )}
                        {r.status === 'requested' && (
                          <button onClick={() => setStatus(r, 'rejected')} disabled={busyId === r.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-white/15 text-white/60 hover:text-[#FF6B7F] hover:border-[#CC0033]/40 disabled:opacity-40">
                            <Ban className="w-3.5 h-3.5" /> ไม่ผ่าน
                          </button>
                        )}
                        {r.status === 'confirmed' && (
                          <button onClick={() => confirm(`ยกเลิกที่นั่งของ ${r.full_name}? (เช่น ผู้สมัครขอยกเลิกผ่าน LINE)`) && setStatus(r, 'cancelled')}
                            disabled={busyId === r.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-white/15 text-white/60 hover:text-white disabled:opacity-40">
                            <Ban className="w-3.5 h-3.5" /> ยกเลิกที่นั่ง
                          </button>
                        )}
                        {(r.status === 'rejected' || r.status === 'cancelled') && (
                          <button onClick={() => setStatus(r, 'requested')} disabled={busyId === r.id}
                            title="กลับไปเป็นรอยืนยัน"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-white/15 text-white/60 hover:text-white disabled:opacity-40">
                            <RotateCcw className="w-3.5 h-3.5" /> รอยืนยัน
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
