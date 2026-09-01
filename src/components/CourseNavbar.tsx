import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// English nav copy (replaces the old Thai labels): Home/Courses/Quiz/Articles/
// Contact map to HOME/EXPLORE/TEST YOURSELF/COMMUNITY/C365 respectively — the
// `to` paths are unchanged, only the displayed label changed. `Navbar.tsx`
// (used only on the Events pages, with its own scroll-transparency style)
// carries the same five labels for the same five routes — keep both in sync
// if either changes, rather than letting them drift back into Thai/English
// mismatch.
const MAIN_NAV = [
  { to: '/', label: 'HOME', accent: 'blue' },
  { to: '/courses', label: 'EXPLORE', accent: 'red' },
  { to: '/articles/diagnostic-quiz', label: 'TEST YOURSELF', accent: 'green' },
  { to: '/articles', label: 'COMMUNITY', accent: 'yellow' },
  { to: '/contact', label: 'C365', accent: 'blue' },
] as const;

export const CourseNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate('/');
  };

  const close = () => setOpen(false);

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    if (to === '/articles') return location.pathname === '/articles';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" onClick={close} className="flex items-center gap-2">
          {/* Two logo variants, one per theme — swapped by pure CSS (.dark ancestor)
              so it never races with the page's own dark-mode toggle effect. */}
          <img
            src="https://ik.imagekit.io/ideas365logo/w-logo-side.png?updatedAt=1781551068906"
            alt="Creatr365"
            className="navbar-logo-dark h-7 w-auto"
          />
          <img
            src="https://ik.imagekit.io/ideas365logo/C365-Logo1_1%20(2).png?updatedAt=1781349328070"
            alt="Creatr365"
            className="navbar-logo-light h-12 w-auto"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-[13px] font-bold tracking-[0.06em]">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              data-accent={item.accent}
              aria-current={isActive(item.to) ? 'page' : undefined}
              className="nav-link text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" data-accent="green" aria-current={isActive('/dashboard') ? 'page' : undefined} className="nav-link text-foreground">MY STUDIO</Link>
              {/* Auth-state-dependent label: SIGN OUT here, LOGIN in the else branch below. */}
              <button onClick={handleLogout} data-accent="red" className="nav-link text-foreground">SIGN OUT</button>
            </>
          ) : (
            <Link to="/auth" data-accent="green" className="btn-brand px-4 py-2 rounded-md text-[13px] font-bold tracking-[0.06em]">
              LOGIN
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-border text-foreground"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1 text-[15px] font-bold tracking-[0.04em]">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={close}
                data-accent={item.accent}
                aria-current={isActive(item.to) ? 'page' : undefined}
                className="nav-link py-3 text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={close} data-accent="green" className="nav-link py-3 text-foreground">MY STUDIO</Link>
                <button onClick={handleLogout} data-accent="red" className="nav-link py-3 text-left text-foreground">SIGN OUT</button>
              </>
            ) : (
              <Link to="/auth" onClick={close} data-accent="green" className="btn-brand mt-2 px-4 py-3 rounded-md text-[13px] font-bold tracking-[0.06em] text-center">
                LOGIN
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
