import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MAIN_NAV = [
  { to: '/', label: 'หน้าแรก', accent: 'blue' },
  { to: '/courses', label: 'หลักสูตร', accent: 'red' },
  { to: '/articles/diagnostic-quiz', label: 'แบบทดสอบ', accent: 'green' },
  { to: '/articles', label: 'บทความ', accent: 'yellow' },
  { to: '/contact', label: 'ติดต่อ', accent: 'blue' },
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
          <img src="https://ik.imagekit.io/ideas365logo/C365-Logo1_1%20(2).png" alt="Creatr365" className="h-7 w-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
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
              <Link to="/dashboard" data-accent="green" aria-current={isActive('/dashboard') ? 'page' : undefined} className="nav-link text-foreground">ห้องเรียน</Link>
              <button onClick={handleLogout} data-accent="red" className="nav-link text-foreground">ออกจากระบบ</button>
            </>
          ) : (
            <Link to="/auth" data-accent="green" className="btn-brand px-4 py-2 rounded-md text-sm font-medium">
              เข้าสู่ระบบ
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
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1 text-base font-medium">
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
                <Link to="/dashboard" onClick={close} data-accent="green" className="nav-link py-3 text-foreground">ห้องเรียน</Link>
                <button onClick={handleLogout} data-accent="red" className="nav-link py-3 text-left text-foreground">ออกจากระบบ</button>
              </>
            ) : (
              <Link to="/auth" onClick={close} data-accent="green" className="btn-brand mt-2 px-4 py-3 rounded-md text-sm font-medium text-center">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
