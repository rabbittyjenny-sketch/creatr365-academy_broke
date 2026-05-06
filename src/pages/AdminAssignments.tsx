import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }
    const { data: roles } = await supabase.from('user_roles').select('role')
      .eq('user_id', session.user.id).eq('role','admin').maybeSingle();
    if (!roles) { toast({ title:'ไม่มีสิทธิ์', variant:'destructive' }); navigate('/'); return; }
    let q = supabase.from('assignments').select('*, courses(title), course_modules(code,name)').order('created_at',{ascending:false});
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRows((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const review = async (r: Row, status: 'approved'|'rejected', score?: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('assignments').update({
      status, score: score ?? null, reviewer_id: session!.user.id, reviewed_at: new Date().toISOString(),
    }).eq('id', r.id);
    if (error) { toast({ title:'Error', description:error.message, variant:'destructive' }); return; }
    if (status === 'approved' && r.module_id) {
      await supabase.rpc('unlock_next_module', { _user_id: r.user_id, _module_id: r.module_id });
    }
    toast({ title: status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว' });
    load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/courses"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1"/>กลับ</Button></Link>
          <h1 className="text-2xl font-bold">รายการงานส่ง</h1>
        </div>
        <div className="flex gap-2 mb-4">
          {(['pending','approved','rejected','all'] as const).map(f=>(
            <Button key={f} size="sm" variant={filter===f?'default':'outline'} onClick={()=>setFilter(f)}>{f}</Button>
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
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-muted border border-border">{r.status}</span>
              </div>
              {r.video_url && <video src={r.video_url} controls className="w-full max-h-72 rounded-lg bg-foreground mb-3" />}
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={()=>{ const s = prompt('คะแนน 0-100', '80'); review(r,'approved', s ? Number(s):undefined); }}>อนุมัติ + ปลดล็อคบทถัดไป</Button>
                  <Button size="sm" variant="outline" onClick={()=>review(r,'rejected')}>ปฏิเสธ</Button>
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
