import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isCurrentUserAdmin } from '@/lib/admin';

type Status = 'checking' | 'allowed' | 'denied';

/**
 * Single auth+role gate for every /admin/* route.
 *
 * Before this component existed, each admin page rolled its own copy of
 * this check — and three pages (AdminCourses, AdminAssignments,
 * AdminPayments) had comments claiming a gate "in App.tsx" that was never
 * actually written, so those pages rendered for anyone, logged in or not.
 * Wrap every /admin/* route element with this instead of duplicating the
 * check per page.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    document.documentElement.classList.add('dark');

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
        return;
      }
      const allowed = await isCurrentUserAdmin(session.user.id);
      if (cancelled) return;
      if (!allowed) { navigate('/', { replace: true }); return; }
      setStatus('allowed');
    })();

    return () => {
      cancelled = true;
      document.documentElement.classList.remove('dark');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (status !== 'allowed') {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireAdmin;
