import React from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';

/**
 * /ai-lab/host-compass — the Host Compass tool shown inside the site.
 *
 * The tool itself is the original standalone app, built unchanged to static
 * files in public/host-compass-app/ and displayed here in an iframe. It has
 * its own styles and keeps its history in the visitor's browser (localStorage),
 * so nothing here touches the site's CSS or data.
 */
const HostCompass: React.FC = () => {
  useDarkPage();
  return (
    <>
      <SEOHead title="Host Compass - AI Lab - Creatr365" description="Host Compass — เครื่องมือช่วย live host ทบทวนรอบไลฟ์และเลือกสิ่งที่จะทดสอบต่อ" />
      <CourseNavbar />

      <main className="pt-16 bg-background">
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

        <iframe
          title="Host Compass"
          src="/host-compass-app/index.html"
          className="block w-full border-0 h-[calc(100dvh-6.5rem)] min-h-[640px]"
        />
      </main>

      <Footer />
    </>
  );
};

export default HostCompass;
