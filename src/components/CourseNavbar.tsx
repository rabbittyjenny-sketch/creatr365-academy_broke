import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { MAIN_NAV } from '@/lib/mainNav';

// Nav items now come from src/lib/mainNav.ts, shared with Navbar.tsx (the
// Events-pages variant), so the two can no longer drift out of sync — see
// that file's comment for why this was split out.

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
    await fullSignOut();
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

        {/* Desktop links — base weight is Medium, .nav-link CSS bumps it to
            Bold (plus the underline) on hover/active; see index.css. */}
        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium tracking-[0.06em]">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item.to) ? 'page' : undefined}
              className="nav-link text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" aria-current={isActive('/dashboard') ? 'page' : undefined} className="nav-link text-foreground">MY STUDIO</Link>
              {/* Auth-state-dependent label: SIGN OUT here, LOGIN in the else branch below. */}
              <button onClick={handleLogout} className="nav-link text-foreground">SIGN OUT</button>
            </>
          ) : (
            <Link to="/auth" className="btn-brand px-4 py-2 rounded-md text-[13px] font-bold tracking-[0.06em]">
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
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1 text-[15px] font-medium tracking-[0.04em]">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={close}
                aria-current={isActive(item.to) ? 'page' : undefined}
                className="nav-link py-3 text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={close} className="nav-link py-3 text-foreground">MY STUDIO</Link>
                <button onClick={handleLogout} className="nav-link py-3 text-left text-foreground">SIGN OUT</button>
              </>
            ) : (
              <Link to="/auth" onClick={close} className="btn-brand mt-2 px-4 py-3 rounded-md text-[13px] font-bold tracking-[0.06em] text-center">
                LOGIN
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
