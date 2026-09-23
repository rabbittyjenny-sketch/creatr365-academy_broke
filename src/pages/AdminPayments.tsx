import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';

interface Row {
  id: string; user_id: string; course_id: string; status: string;
  amount_paid: number | null; full_name: string | null; phone: string | null;
  stripe_session_id: string | null; created_at: string;
  courses?: { title: string } | null;
}

interface Buyer { studentId: string | null; email: string | null }

type Filter = 'all' | 'pending' | 'paid' | 'free' | 'abandoned';

const FILTER_LABEL: Record<Filter, string> = {
  all: 'ทั้งหมด', pending: 'รอชำระ', paid: 'ชำระแล้ว', free: 'ฟรี', abandoned: 'ไม่ได้ชำระ/ยกเลิก',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'ชำระแล้ว', free: 'ฟรี', pending: 'รอชำระ', abandoned: 'ไม่ได้ชำระ/ยกเลิก', active: 'ใช้งานอยู่',
};

// amount_paid is set when the checkout is created, so a pending / abandoned
// row carries the amount that WOULD have been paid — never label it "ฟรี".
const amountLabel = (r: Row) => {
  if (r.status === 'free') return 'ฟรี';
  if (r.amount_paid == null) return '-';
  const n = `${Number(r.amount_paid).toLocaleString('th-TH')} ฿`;
  return r.status === 'paid' ? n : `(${n})`;
};

const AdminPayments = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [buyers, setBuyers] = useState<Record<string, Buyer>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    // Auth + admin role are enforced centrally by <RequireAdmin> in App.tsx.
    setLoading(true);
    let q = supabase.from('course_enrollments').select('*, courses(title)').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    const list = (data as unknown as Row[]) || [];
    setRows(list);

    // Resolve each buyer's Master Key + email so a row can be matched to the
    // student audit page (same identity mapping as save-score:
    // user_accounts.line_user_id is "web:<auth uid>" or a LINE id → profiles).
    const userIds = [...new Set(list.map(r => r.user_id))];
    if (userIds.length > 0) {
      const [{ data: profs }, { data: accts }] = await Promise.all([
        supabase.from('profiles').select('user_id,line_user_id').in('user_id', userIds),
        supabase.from('user_accounts').select('student_id,email,line_user_id').eq('is_active', true),
      ]);
      const byLine = new Map<string, { student_id: string | null; email: string | null }>();
      ((accts as { student_id: string | null; email: string | null; line_user_id: string }[] | null) || [])
        .forEach(a => byLine.set(a.line_user_id, a));
      const lineOf = new Map<string, string | null>(
        ((profs as { user_id: string; line_user_id: string | null }[] | null) || []).map(p => [p.user_id, p.line_user_id]),
      );
      const out: Record<string, Buyer> = {};
      userIds.forEach(uid => {
        const a = byLine.get(`web:${uid}`) || (lineOf.get(uid) ? byLine.get(lineOf.get(uid)!) : undefined);
        out[uid] = { studentId: a?.student_id ?? null, email: a?.email ?? null };
      });
      setBuyers(out);
    } else {
      setBuyers({});
    }
    setLoading(false);
  };
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  return (
    <AdminLayout title="รายการการชำระเงิน" onSignOut={() => fullSignOut().then(() => navigate('/auth'))}>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(FILTER_LABEL) as Filter[]).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>{FILTER_LABEL[f]}</Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          ยอดในวงเล็บ = ยอดที่จะต้องชำระ (ยังไม่ได้รับเงิน) · ขั้นตอนการซื้อแต่ละครั้งอย่างละเอียดดูได้ที่หน้า "ตรวจสอบนักเรียน"
        </p>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left p-3">วันที่</th>
                <th className="text-left p-3">หลักสูตร</th>
                <th className="text-left p-3">ผู้สมัคร</th>
                <th className="text-left p-3">Master Key / อีเมล</th>
                <th className="text-left p-3">ยอด</th>
                <th className="text-left p-3">สถานะ</th>
                <th className="text-left p-3">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const b = buyers[r.user_id];
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString('th-TH')}</td>
                    <td className="p-3">{r.courses?.title}</td>
                    <td className="p-3 text-xs">{r.full_name || '-'}<br /><span className="text-muted-foreground">{r.phone || ''}</span></td>
                    <td className="p-3 text-xs">
                      {b?.studentId
                        ? <Link to={`/admin/students?q=${encodeURIComponent(b.studentId)}`} className="font-mono text-[#D4A843] hover:underline">{b.studentId}</Link>
                        : <span className="text-muted-foreground">ไม่พบ Master Key</span>}
                      <br /><span className="text-muted-foreground">{b?.email || ''}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{amountLabel(r)}</td>
                    <td className="p-3"><span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-muted border border-border whitespace-nowrap">{STATUS_LABEL[r.status] || r.status}</span></td>
                    <td className="p-3 text-xs text-muted-foreground">{r.stripe_session_id ? r.stripe_session_id.slice(0, 16) + '...' : '—'}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">ไม่มีรายการ</td></tr>}
            </tbody>
          </table>
        </div>
        )}
    </AdminLayout>
  );
};

export default AdminPayments;
