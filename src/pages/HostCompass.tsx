import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';
import { supabase } from '@/integrations/supabase/client';
import { goToLogin } from '@/lib/authRedirect';

/**
 * /ai-lab/host-compass — opens Host Compass with the visitor's Creatr365 account.
 *
 * Host Compass runs as its own app (live-host-tracking, Next.js + Neon) and keeps each
 * host's rounds under their Creatr365 account, so one login works on every device.
 *  - Not signed in → the site's own login, then back here.
 *  - Signed in → go to the app with the access token in the URL fragment (never sent to
 *    any server as part of the address). The app removes it from the address bar at once
 *    and asks Creatr365's Supabase who owns it before setting its own cookie.
 * The app opens as a full page rather than in an iframe: Safari and other browsers block
 * the app's sign-in cookie inside an iframe from another site.
 * location.replace keeps this hand-over page out of the Back history.
 */
const APP_URL = 'https://live-host-tracking.vercel.app/';

const HostCompass: React.FC = () => {
  useDarkPage();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        if (!session) { goToLogin(navigate, '/ai-lab/host-compass'); return; }
        window.location.replace(`${APP_URL}#c365_token=${encodeURIComponent(session.access_token)}`);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <>
      <SEOHead title="Host Compass - AI Lab - Creatr365" description="Host Compass — เครื่องมือช่วย live host ทบทวนรอบไลฟ์และเลือกสิ่งที่จะทดสอบต่อ" />
      <CourseNavbar />

      <main className="pt-16 bg-background min-h-[60vh]">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 h-10 px-4 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
        >
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/ai-lab" className="hover:text-foreground transition-colors">AI Lab</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground" aria-current="page">Host Compass</span>
        </nav>

        <div className="px-4 py-16 text-center text-sm text-muted-foreground" role="status">
          {failed
            ? <>ตรวจการเข้าสู่ระบบไม่สำเร็จ · <a href={APP_URL} className="underline text-foreground">เปิด Host Compass</a></>
            : 'กำลังเปิด Host Compass ด้วยบัญชี Creatr365…'}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default HostCompass;
