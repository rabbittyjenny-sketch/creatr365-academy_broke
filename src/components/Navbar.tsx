import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Kept in sync with CourseNavbar.tsx's MAIN_NAV labels (same 5 routes, same
// English copy) — this component exists separately only for the scroll
// transparency→glass behavior the Events pages need, not for different nav
// content. If these ever need to diverge in wording, that's the signal to
// stop copy-pasting and share one nav-items source instead.
const MAIN_NAV = [
  { to: '/', label: 'HOME' },
  { to: '/courses', label: 'EXPLORE' },
  { to: '/articles/diagnostic-quiz', label: 'TEST YOURSELF' },
  { to: '/articles', label: 'COMMUNITY' },
  { to: '/contact', label: 'C365' },
] as const;


export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser]       = useState<any>(null);
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ── Auth listener ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  /* ── Scroll listener — transparent → white glass at 80px ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll(); // check on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  /* ── Colors: white when transparent, dark when scrolled ── */
  const linkColor   = scrolled ? undefined : 'rgba(255,255,255,0.9)';
  const buttonColor = scrolled ? undefined : 'rgba(255,255,255,0.9)';
  const borderColor = scrolled ? undefined : 'rgba(255,255,255,0.35)';

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" onClick={close} className="flex items-center gap-2">
          <img
            src="https://ik.imagekit.io/ideas365logo/C365-Logo1_1%20(2).png"
            alt="Creatr365"
            className="h-7 w-auto"
            style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
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
              className="nav-link"
              style={{ color: linkColor }}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/dashboard"
                aria-current={isActive('/dashboard') ? 'page' : undefined}
                className="nav-link"
                style={{ color: linkColor }}
              >
                MY STUDIO
              </Link>
              {/* Auth-state-dependent label: SIGN OUT here, LOGIN in the else branch below. */}
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{ color: buttonColor }}
              >
                SIGN OUT
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="btn-brand px-4 py-2 rounded-md text-[13px] font-bold tracking-[0.06em]"
            >
              LOGIN
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md"
          style={{
            border: `1px solid ${borderColor ?? 'hsl(var(--border))'}`,
            color: buttonColor ?? 'hsl(var(--foreground))',
          }}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer — always white background for readability */}
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1 text-[15px] font-medium tracking-[0.04em]">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={close}
                aria-current={isActive(item.to) ? 'page' : undefined}
                className="nav-link py-3"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={close} className="nav-link py-3">MY STUDIO</Link>
                <button onClick={handleLogout} className="nav-link py-3 text-left">SIGN OUT</button>
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
