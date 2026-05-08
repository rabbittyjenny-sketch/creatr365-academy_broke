import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import logoCreatr from '@/assets/logo-creatr365.png';

export const CourseNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logoCreatr} alt="Creatr365" className="h-8 w-auto" />
        </Link>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hidden md:inline-block text-muted-foreground"><span className="hover-shift" data-accent="blue">หน้าแรก</span></Link>
          <Link to="/courses" className="hidden md:inline-block text-muted-foreground"><span className="hover-shift" data-accent="red">หลักสูตร</span></Link>
          <Link to="/articles" className="hidden md:inline-block text-muted-foreground"><span className="hover-shift" data-accent="yellow">บทความ</span></Link>
          <Link to="/contact" className="hidden md:inline-block text-muted-foreground"><span className="hover-shift" data-accent="green">ติดต่อ</span></Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hidden md:inline-block text-muted-foreground"><span className="hover-shift" data-accent="yellow">Dashboard</span></Link>
              <button onClick={handleLogout} className="text-muted-foreground text-sm"><span className="hover-shift" data-accent="red">ออกจากระบบ</span></button>
            </>
          ) : (
            <Link to="/auth" className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
