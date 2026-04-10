import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const LOGO_URL = 'https://ik.imagekit.io/ideas365logo/LOGO_iDEAS365Black.png?updatedAt=1772818424343';

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
          <img src={LOGO_URL} alt="iDEAS365" className="h-8 w-auto" />
        </Link>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors hidden md:block">หน้าแรก</Link>
          <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors hidden md:block">หลักสูตร</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors hidden md:block">ติดต่อ</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors hidden md:block">Dashboard</Link>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors text-sm">ออกจากระบบ</button>
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
