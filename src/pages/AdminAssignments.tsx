import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface Row {
  id: string; user_id: string; course_id: string; module_id: string | null;
  video_url: string | null; note: string | null; status: string;
  score: number | null; created_at: string;
  courses?: { title: string } | null;
  course_modules?: { code: string; name: string } | null;
}

const AdminAssignments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<'pending'|'approved'|'rejected'|'all'>('pending');
  const [loading, setLoading] = useState(true);
  // Map of assignment id → score input value (for pending items)
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});

  const load = async () => {
    // Auth + admin role are enforced centrally by <RequireAdmin> in App.tsx.
    let q = supabase.from('assignments').select('*, courses(title), course_modules(code,name)').order('created_at',{ascending:false});
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const review = async (r: Row, status: 'approved'|'rejected') => {
    const { data: { session } } = await supabase.auth.getSession();
    const rawScore = scoreInputs[r.id];
    const score = rawScore !== undefined && rawScore !== '' ? Number(rawScore) : null;

    if (status === 'approved' && (score === null || isNaN(score) || score < 0 || score > 100)) {
      toast({ title: 'กรุณากรอกคะแนน 0–100', variant: 'destructive' }); return;
    }

    const { error } = await supabase.from('assignments').update({
      status, score: status === 'approved' ? score : null,
      reviewer_id: session!.user.id, reviewed_at: new Date().toISOString(),
    }).eq('id', r.id);
    if (error) { toast({ title:'Error', description:error.message, variant:'destructive' }); return; }
    if (status === 'approved' && r.module_id) {
      await supabase.rpc('unlock_next_module', { _user_id: r.user_id, _module_id: r.module_id });
    }
    toast({ title: status === 'approved' ? 'อนุมัติแล้ว ปลดล็อคบทถัดไป' : 'ปฏิเสธแล้ว' });
    setScoreInputs(prev => { const n = {...prev}; delete n[r.id]; return n; });
    load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1"/>หน้าหลัก
          </Button>
          <h1 className="text-2xl font-bold">รายการงานส่ง</h1>
        </div>

        {/* Admin navigation */}
        <div className="flex gap-1 flex-wrap mb-6 border-b pb-4">
          <Link to="/admin/courses"><Button variant="outline" size="sm">หลักสูตร</Button></Link>
          <Button variant="default" size="sm">งานส่ง (นี่คือ)</Button>
          <Link to="/admin/payments"><Button variant="outline" size="sm">การชำระเงิน</Button></Link>
          <Link to="/admin"><Button variant="outline" size="sm">Event CMS</Button></Link>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {(['pending','approved','rejected','all'] as const).map(f=>(
            <Button key={f} size="sm" variant={filter===f?'default':'outline'} onClick={()=>setFilter(f)}>
              {f === 'pending' ? 'รอตรวจ' : f === 'approved' ? 'อนุมัติแล้ว' : f === 'rejected' ? 'ปฏิเสธ' : 'ทั้งหมด'}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {rows.map(r=>(
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-semibold">{r.courses?.title} · {r.course_modules?.code} {r.course_modules?.name}</p>
                  <p className="text-xs text-muted-foreground">user: {r.user_id.slice(0,8)} · {new Date(r.created_at).toLocaleString('th-TH')}</p>
                  {r.note && <p className="text-xs mt-1 text-foreground">หมายเหตุ: {r.note}</p>}
                  {r.score !== null && <p className="text-xs mt-0.5 font-medium">คะแนน: {r.score}/100</p>}
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border whitespace-nowrap ${
                  r.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' :
                  r.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-muted border-border'
                }`}>{r.status}</span>
              </div>

              {r.video_url && (
                <video src={r.video_url} controls className="w-full max-h-72 rounded-lg bg-foreground mb-3" />
              )}

              {r.status === 'pending' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">คะแนน (0–100):</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 h-8 text-sm"
                      placeholder="80"
                      value={scoreInputs[r.id] ?? ''}
                      onChange={e => setScoreInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                    />
                  </div>
                  <Button size="sm" onClick={() => review(r, 'approved')}>
                    ✓ อนุมัติ + ปลดล็อคบทถัดไป
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => review(r, 'rejected')}>
                    ✗ ปฏิเสธ
                  </Button>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ไม่มีรายการ</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminAssignments;
