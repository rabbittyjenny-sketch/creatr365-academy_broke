import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { isCurrentUserAdmin } from '@/lib/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Row {
  id: string; user_id: string; course_id: string; module_id: string | null;
  video_url: string | null; note: string | null; status: string;
  score: number | null; created_at: string;
  courses?: { title: string } | null;
  course_modules?: { code: string; name: string } | null;
}

const FILTERS = [
  { value: 'pending', label: 'รอตรวจ' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'rejected', label: 'ปฏิเสธ' },
  { value: 'all', label: 'ทั้งหมด' },
] as const;

const AdminAssignments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('pending');
  const [loading, setLoading] = useState(true);
  // Map of assignment id → score input value (for pending items)
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});

  const load = async () => {
    let q = supabase.from('assignments').select('*, courses(title), course_modules(code,name)').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRows((data as any) || []);
    setLoading(false);
  };

  // Same proven checkAuth pattern as Admin.tsx / AdminArticles.tsx
  // (isCurrentUserAdmin → has_role RPC). Previously this page relied on a
  // comment claiming a <RequireAdmin> wrapper in App.tsx enforced this —
  // that component doesn't exist anywhere in the codebase, so the page had
  // no client-side admin check at all (RLS on assignments still blocked
  // non-admin reads/writes at the database level, but the page shell
  // itself was reachable by anyone).
  useEffect(() => {
    document.documentElement.classList.add('dark');
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?redirect=/admin/assignments'); return; }
      const allowed = await isCurrentUserAdmin(session.user.id);
      if (!allowed) { navigate('/'); return; }
      setIsAdmin(true);
    })();
    return () => document.documentElement.classList.remove('dark');
  }, [navigate]);

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [filter, isAdmin]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const review = async (r: Row, status: 'approved' | 'rejected') => {
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
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (status === 'approved' && r.module_id) {
      await supabase.rpc('unlock_next_module', { _user_id: r.user_id, _module_id: r.module_id });
    }
    toast({ title: status === 'approved' ? 'อนุมัติแล้ว ปลดล็อคบทถัดไป' : 'ปฏิเสธแล้ว' });
    setScoreInputs(prev => { const n = { ...prev }; delete n[r.id]; return n; });
    load();
  };

  if (!isAdmin) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" /></div>;
  }

  return (
    <AdminLayout title="งานที่ส่ง" onSignOut={handleSignOut}>
      <div className="flex items-center gap-1.5 bg-[#111] border border-white/10 rounded-xl p-1 mb-5 w-fit flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f.value ? 'bg-[#D4A843] text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          กำลังโหลด...
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="bg-[#111] border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{r.courses?.title} · {r.course_modules?.code} {r.course_modules?.name}</p>
                  <p className="text-xs text-white/30">user: {r.user_id.slice(0, 8)} · {new Date(r.created_at).toLocaleString('th-TH')}</p>
                  {r.note && <p className="text-xs mt-1 text-white/60">หมายเหตุ: {r.note}</p>}
                  {r.score !== null && <p className="text-xs mt-0.5 font-medium text-white/70">คะแนน: {r.score}/100</p>}
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap font-bold ${
                  r.status === 'approved' ? 'bg-[#34A853]/15 text-[#34A853]' :
                  r.status === 'rejected' ? 'bg-[#CC0033]/15 text-[#CC0033]' :
                  'bg-white/8 text-white/50'
                }`}>{r.status}</span>
              </div>

              {r.video_url && (
                <video src={r.video_url} controls className="w-full max-h-72 rounded-xl bg-black mb-3" />
              )}

              {r.status === 'pending' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-white/40 whitespace-nowrap">คะแนน (0–100):</label>
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
                  <Button size="sm" className="bg-[#34A853] text-white hover:opacity-90" onClick={() => review(r, 'approved')}>
                    ✓ อนุมัติ + ปลดล็อคบทถัดไป
                  </Button>
                  <Button size="sm" variant="outline" className="text-[#CC0033] border-[#CC0033]/30 hover:bg-[#CC0033]/10" onClick={() => review(r, 'rejected')}>
                    ✗ ปฏิเสธ
                  </Button>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-white/25 text-center py-12">ไม่มีรายการ</p>}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAssignments;
