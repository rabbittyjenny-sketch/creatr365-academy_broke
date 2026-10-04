import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { occupationBucket } from '@/lib/profileFields';
import { X, Download } from 'lucide-react';

interface ViewRow {
  user_id: string;
  max_progress_pct: number;
  completed: boolean;
  started_at: string;
  gender: string | null;
  age_range: string | null;
  occupation: string | null;
  province: string | null;
  source: string | null;
}

type Range = '30d' | 'all';

const NONE = 'ไม่ระบุ';

function tally(values: (string | null)[], top?: number) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v || NONE, (m.get(v || NONE) ?? 0) + 1);
  let rows = [...m.entries()].sort((a, b) => b[1] - a[1]);
  if (top && rows.length > top) {
    const rest = rows.slice(top).reduce((s, [, n]) => s + n, 0);
    rows = [...rows.slice(0, top), ['อื่น ๆ', rest]];
  }
  return rows;
}

const Breakdown: React.FC<{ title: string; rows: [string, number][]; total: number }> = ({ title, rows, total }) => (
  <div className="border border-white/10 p-4">
    <p className="text-xs font-semibold text-white/50 mb-3">{title}</p>
    {rows.length === 0 ? (
      <p className="text-xs text-white/25">ยังไม่มีข้อมูล</p>
    ) : (
      <ul className="space-y-2">
        {rows.map(([label, n]) => (
          <li key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/70 truncate pr-2">{label}</span>
              <span className="text-white/40 font-mono shrink-0">{n} · {Math.round((n / total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/5">
              <div className="h-full bg-[#D4A843]" style={{ width: `${(n / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/**
 * Viewer statistics for one Live Note — admin only (content_views RLS).
 * Demographics are the snapshot the database copied from the viewer's
 * profile at first play; counted once per person (their latest view).
 */
export const LiveNoteStatsPanel: React.FC<{ articleId: string; title: string; onClose: () => void }> = ({ articleId, title, onClose }) => {
  const [rows, setRows] = useState<ViewRow[] | null>(null);
  const [range, setRange] = useState<Range>('30d');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('content_views')
      .select('user_id,max_progress_pct,completed,started_at,gender,age_range,occupation,province,source')
      .eq('article_id', articleId)
      .order('started_at', { ascending: false })
      .then(({ data, error: e }) => {
        if (e) setError(e.message);
        setRows((data as unknown as ViewRow[]) || []);
      });
  }, [articleId]);

  const stats = useMemo(() => {
    if (!rows) return null;
    const since = range === '30d' ? Date.now() - 30 * 86400000 : 0;
    const sessions = rows.filter(r => new Date(r.started_at).getTime() >= since);
    // One entry per person: latest snapshot + best progress across sessions.
    const people = new Map<string, ViewRow & { best: number; done: boolean; firstSource: string | null }>();
    for (const r of sessions) { // newest first
      const p = people.get(r.user_id);
      if (!p) people.set(r.user_id, { ...r, best: r.max_progress_pct, done: r.completed, firstSource: r.source });
      else {
        p.best = Math.max(p.best, r.max_progress_pct);
        p.done = p.done || r.completed;
        p.firstSource = r.source ?? p.firstSource; // ends on the oldest session's source
      }
    }
    const list = [...people.values()];
    const n = list.length;
    return {
      sessions: sessions.length,
      viewers: n,
      completedPct: n ? Math.round((list.filter(p => p.done).length / n) * 100) : 0,
      avgProgress: n ? Math.round(list.reduce((s, p) => s + p.best, 0) / n) : 0,
      gender: tally(list.map(p => p.gender)),
      age: tally(list.map(p => p.age_range)),
      occupation: tally(list.map(p => (p.occupation ? occupationBucket(p.occupation) : null))),
      province: tally(list.map(p => p.province), 10),
      source: tally(list.map(p => p.firstSource)),
      sessionRows: sessions,
    };
  }, [rows, range]);

  const exportCsv = () => {
    if (!stats) return;
    const head = ['started_at', 'max_progress_pct', 'completed', 'gender', 'age_range', 'occupation', 'province', 'source'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.join(','), ...stats.sessionRows.map(r =>
      [r.started_at, r.max_progress_pct, r.completed, r.gender, r.age_range, r.occupation, r.province, r.source].map(esc).join(','))];
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }); // BOM: Thai opens correctly in Excel
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `live-note-views-${articleId.slice(0, 8)}-${range}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="admin-modal-surface fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[#111] border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="ln-stats-title">
        <div className="sticky top-0 z-10 bg-[#111] border-b border-white/8 px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-white/40">สถิติผู้ชม Live Notes</p>
            <h2 id="ln-stats-title" className="text-white font-semibold text-base truncate">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="ปิด" className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex border border-white/10" role="group" aria-label="ช่วงเวลา">
              {([['30d', '30 วันล่าสุด'], ['all', 'ทั้งหมด']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setRange(k)} aria-pressed={range === k}
                  className={`px-4 py-2 text-xs font-semibold ${range === k ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={exportCsv} disabled={!stats?.sessions}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-white/10 text-white/60 hover:text-white disabled:opacity-30">
              <Download className="w-3.5 h-3.5" /> ส่งออก CSV
            </button>
          </div>

          {error && <p className="text-xs text-[#FF6B7F]">โหลดสถิติไม่สำเร็จ: {error}</p>}

          {!stats ? (
            <p className="text-white/30 text-sm py-8 text-center">กำลังโหลด...</p>
          ) : stats.viewers === 0 ? (
            <p className="text-white/30 text-sm py-8 text-center">ยังไม่มีผู้ชมในช่วงเวลานี้</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['ผู้ชม (คน)', stats.viewers],
                  ['เปิดดู (ครั้ง)', stats.sessions],
                  ['ดูจบ (90%+)', `${stats.completedPct}%`],
                  ['ดูเฉลี่ยถึง', `${stats.avgProgress}%`],
                ].map(([l, v]) => (
                  <div key={l as string} className="border border-white/10 p-4">
                    <p className="text-2xl font-bold text-white">{v}</p>
                    <p className="text-[11px] text-white/40 mt-1">{l}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Breakdown title="มาจากแพลตฟอร์ม" rows={stats.source} total={stats.viewers} />
                <Breakdown title="เพศ" rows={stats.gender} total={stats.viewers} />
                <Breakdown title="ช่วงอายุ" rows={stats.age} total={stats.viewers} />
                <Breakdown title="อาชีพ" rows={stats.occupation} total={stats.viewers} />
                <Breakdown title="จังหวัด (10 อันดับแรก)" rows={stats.province} total={stats.viewers} />
              </div>
              <p className="text-[11px] text-white/25">
                นับ 1 คนต่อ 1 บัญชี ข้อมูลประชากรดึงจากโปรไฟล์ตอนเริ่มดู "ไม่ระบุ" คือผู้ชมที่ยังกรอกโปรไฟล์ไม่ครบ
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
