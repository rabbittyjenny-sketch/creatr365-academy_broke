import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { HoverLetters } from '@/components/HoverLetters';

export const CourseNavbar: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" onClick={close} className="flex items-center gap-2">
          <img src="/favicon.png" alt="Creatr365" className="h-9 w-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link to="/" className="text-foreground"><HoverLetters text="หน้าแรก" accent="blue" /></Link>
          <Link to="/courses" className="text-foreground"><HoverLetters text="หลักสูตร" accent="red" /></Link>
          <Link to="/articles" className="text-foreground"><HoverLetters text="บทความ" accent="yellow" /></Link>
          <Link to="/contact" className="text-foreground"><HoverLetters text="ติดต่อ" accent="green" /></Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-foreground"><HoverLetters text="Dashboard" accent="yellow" /></Link>
              <button onClick={handleLogout} className="text-foreground"><HoverLetters text="ออกจากระบบ" accent="red" /></button>
            </>
          ) : (
            <Link to="/auth" className="px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
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
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 text-base font-medium">
            <Link to="/" onClick={close} className="py-2 text-foreground"><HoverLetters text="หน้าแรก" accent="blue" /></Link>
            <Link to="/courses" onClick={close} className="py-2 text-foreground"><HoverLetters text="หลักสูตร" accent="red" /></Link>
            <Link to="/articles" onClick={close} className="py-2 text-foreground"><HoverLetters text="บทความ" accent="yellow" /></Link>
            <Link to="/contact" onClick={close} className="py-2 text-foreground"><HoverLetters text="ติดต่อ" accent="green" /></Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={close} className="py-2 text-foreground"><HoverLetters text="Dashboard" accent="yellow" /></Link>
                <button onClick={handleLogout} className="py-2 text-left text-foreground"><HoverLetters text="ออกจากระบบ" accent="red" /></button>
              </>
            ) : (
              <Link to="/auth" onClick={close} className="mt-1 px-4 py-2.5 bg-foreground text-background rounded-md text-sm font-medium text-center">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
