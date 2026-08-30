import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isCurrentUserAdmin } from '@/lib/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Row {
  id: string; user_id: string; course_id: string; status: string;
  amount_paid: number | null; full_name: string | null; phone: string | null;
  stripe_session_id: string | null; created_at: string;
  courses?: { title: string } | null;
}

const FILTERS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'pending', label: 'รอชำระ' },
  { value: 'paid', label: 'ชำระแล้ว' },
  { value: 'free', label: 'ฟรี' },
] as const;

const AdminPayments = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    let q = supabase.from('course_enrollments').select('*, courses(title)').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRows((data as any) || []);
    setLoading(false);
  };

  // Same proven checkAuth pattern as Admin.tsx / AdminArticles.tsx
  // (isCurrentUserAdmin → has_role RPC). Previously this page relied on a
  // comment claiming a <RequireAdmin> wrapper in App.tsx enforced this —
  // that component doesn't exist anywhere in the codebase, so the page had
  // no client-side admin check at all (RLS on course_enrollments still
  // blocked non-admin reads/writes at the database level, but the page
  // shell itself was reachable by anyone).
  useEffect(() => {
    document.documentElement.classList.add('dark');
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?redirect=/admin/payments'); return; }
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

  if (!isAdmin) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" /></div>;
  }

  return (
    <AdminLayout title="การชำระเงิน" onSignOut={handleSignOut}>
      <div className="flex items-center gap-1.5 bg-[#111] border border-white/10 rounded-xl p-1 mb-5 w-fit">
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
        <div className="rounded-2xl border border-white/8 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#111] border-b border-white/8">
                <th className="text-left px-5 py-3 text-white/30 text-xs font-semibold tracking-widest uppercase">วันที่</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase">หลักสูตร</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase">ผู้สมัคร</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase">ยอด</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase">สถานะ</th>
                <th className="text-left px-5 py-3 text-white/30 text-xs font-semibold uppercase">Stripe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(r => (
                <tr key={r.id} className="bg-[#0D0D0D] hover:bg-[#131313] transition-colors">
                  <td className="px-5 py-4 text-xs text-white/50">{new Date(r.created_at).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-4 text-white/80">{r.courses?.title}</td>
                  <td className="px-4 py-4 text-xs text-white/50">{r.full_name || '-'}<br /><span className="text-white/25">{r.phone || ''}</span></td>
                  <td className="px-4 py-4 text-white/80">{r.amount_paid ? `${r.amount_paid} ฿` : 'ฟรี'}</td>
                  <td className="px-4 py-4">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/8 text-white/50 font-bold">{r.status}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-white/30 font-mono">{r.stripe_session_id ? r.stripe_session_id.slice(0, 16) + '...' : '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-white/20">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPayments;
