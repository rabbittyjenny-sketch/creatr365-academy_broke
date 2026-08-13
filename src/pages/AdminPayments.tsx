import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface Row {
  id: string; user_id: string; course_id: string; status: string;
  amount_paid: number | null; full_name: string | null; phone: string | null;
  stripe_session_id: string | null; created_at: string;
  courses?: { title: string } | null;
}

const AdminPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<'all'|'pending'|'paid'|'free'>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    // Auth + admin role are enforced centrally by <RequireAdmin> in App.tsx.
    let q = supabase.from('course_enrollments').select('*, courses(title)').order('created_at',{ascending:false});
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRows((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1"/>หน้าหลัก
          </Button>
          <h1 className="text-2xl font-bold">รายการการชำระเงิน</h1>
        </div>

        {/* Admin navigation */}
        <div className="flex gap-1 flex-wrap mb-6 border-b pb-4">
          <Link to="/admin/courses"><Button variant="outline" size="sm">หลักสูตร</Button></Link>
          <Link to="/admin/assignments"><Button variant="outline" size="sm">งานส่ง</Button></Link>
          <Button variant="default" size="sm">การชำระเงิน (นี่คือ)</Button>
          <Link to="/admin"><Button variant="outline" size="sm">Event CMS</Button></Link>
        </div>
        <div className="flex gap-2 mb-4">
          {(['all','pending','paid','free'] as const).map(f=>(
            <Button key={f} size="sm" variant={filter===f?'default':'outline'} onClick={()=>setFilter(f)}>{f}</Button>
          ))}
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
                  <td className="p-3">{r.amount_paid ? `${r.amount_paid} ฿` : 'ฟรี'}</td>
                  <td className="p-3"><span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-muted border border-border">{r.status}</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{r.stripe_session_id ? r.stripe_session_id.slice(0,16)+'...' : '—'}</td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">ไม่มีรายการ</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
