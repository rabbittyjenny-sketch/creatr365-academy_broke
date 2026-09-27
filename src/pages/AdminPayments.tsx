import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Row {
  id: string; user_id: string; course_id: string; status: string;
  amount_paid: number | null; full_name: string | null; phone: string | null;
  stripe_session_id: string | null; created_at: string;
  courses?: { title: string } | null;
}

// "abandoned" = an unpaid checkout that create-checkout closed when the
// learner started a new one (kept for the audit trail, never revenue).
const FILTER_TH = { all: 'ทั้งหมด', paid: 'ชำระแล้ว', free: 'ฟรี', pending: 'ค้างชำระ', abandoned: 'ยกเลิก/ไม่ชำระ' } as const;

const AdminPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<keyof typeof FILTER_TH>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    // Auth + admin role are enforced centrally by <RequireAdmin> in App.tsx.
    let q = supabase.from('course_enrollments').select('*, courses(title)').order('created_at',{ascending:false});
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    if (error) toast({ title: 'โหลดรายการไม่สำเร็จ', description: error.message, variant: 'destructive' });
    setRows((data as unknown as Row[]) || []);
    setLoading(false);
  };

  // "pending" = checkout opened but not paid (create-checkout inserts it
  // before redirecting to Stripe) — never counted as revenue.
  const paidRows = rows.filter(r => r.status === 'paid');
  const revenue = paidRows.reduce((s, r) => s + (Number(r.amount_paid) || 0), 0);
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  if (loading) return <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">Loading...</div>;

  return (
    <AdminLayout title="รายการการชำระเงิน" onSignOut={() => fullSignOut().then(() => navigate('/auth'))}>
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all','paid','free','pending','abandoned'] as const).map(f=>(
            <Button key={f} size="sm" variant={filter===f?'default':'outline'} onClick={()=>setFilter(f)}>{FILTER_TH[f]}</Button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 border border-border mb-4 divide-x divide-border">
          <div className="p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">รายการในมุมมองนี้</p><p className="text-lg font-bold font-mono">{rows.length}</p></div>
          <div className="p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">ชำระแล้ว</p><p className="text-lg font-bold font-mono">{paidRows.length}</p></div>
          <div className="p-3 col-span-2 sm:col-span-1 border-t sm:border-t-0 border-border"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">ยอดรับจริง (เฉพาะชำระแล้ว)</p><p className="text-lg font-bold font-mono">{revenue.toLocaleString('th-TH')} ฿</p></div>
        </div>
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left p-3">วันที่</th>
                <th className="text-left p-3">หลักสูตร</th>
                <th className="text-left p-3">ผู้สมัคร</th>
                <th className="text-left p-3">ยอด</th>
                <th className="text-left p-3">สถานะ</th>
                <th className="text-left p-3">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString('th-TH')}</td>
                  <td className="p-3">{r.courses?.title}</td>
                  <td className="p-3 text-xs">{r.full_name||'-'}<br/><span className="text-muted-foreground">{r.phone||''}</span></td>
                  <td className="p-3">{r.amount_paid ? `${Number(r.amount_paid).toLocaleString('th-TH')} ฿` : 'ฟรี'}</td>
                  <td className="p-3"><span className={`text-[10px] tracking-wider px-2 py-1 border ${
                    r.status === 'paid' ? 'bg-[#34A853]/15 border-[#34A853]/30 text-[#34A853]'
                    : r.status === 'pending' ? 'bg-[#D4A843]/15 border-[#D4A843]/30 text-[#D4A843]'
                    : 'bg-muted border-border'}`}>{FILTER_TH[r.status as keyof typeof FILTER_TH] || r.status}</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{r.stripe_session_id ? r.stripe_session_id.slice(0,16)+'...' : '—'}</td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">ไม่มีรายการ</td></tr>}
            </tbody>
          </table>
        </div>
    </AdminLayout>
  );
};

export default AdminPayments;
