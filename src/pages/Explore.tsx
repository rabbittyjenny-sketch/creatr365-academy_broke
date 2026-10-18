import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { useDarkPage } from '@/hooks/useDarkPage';

/**
 * Explore — video desk scene with 5 clickable post-its.
 * Background: public/videos/Exploer-Submenu.mp4 (muted, looping, inline).
 * Each post-it is a transparent <Link> laid over the paper in the video:
 * no added text, icon, emoji, border or effect — the paper IS the button.
 * Positions are % of the video frame (reference frame 1344x768), so they stay
 * aligned at every size as long as the video keeps that aspect ratio.
 * All styles scoped to .explore-desk-*.
 */
const DESK_VIDEO = '/videos/Exploer-Submenu.mp4';

type Hotspot = { key: string; href: string; label: string; l: number; t: number; w: number; h: number };

const HOTSPOTS: Hotspot[] = [
  { key: 'courses',       href: '/courses',       label: 'Courses',       l: 40.0, t: 18.5, w: 8.6,  h: 14.6 },
  { key: 'creator-tools', href: '/creator-tools', label: 'Creator Tools', l: 38.8, t: 35.9, w: 9.2,  h: 15.7 },
  { key: 'events',        href: '/events',        label: 'Events',        l: 40.8, t: 56.8, w: 8.3,  h: 14.2 },
  { key: 'toolbox',       href: '/toolbox',       label: 'Toolbox',       l: 84.5, t: 10.7, w: 10.1, h: 16.9 },
  { key: 'ai-lab',        href: '/ai-lab',        label: 'AI Lab',        l: 85.0, t: 30.2, w: 10.6, h: 16.4 },
];

const Explore: React.FC = () => {
  useDarkPage();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Respect "reduce motion": keep the clip on screen but paused on its first frame.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      videoRef.current?.pause();
    }
  }, []);

  return (
    <>
      <SEOHead
        title="Explore - Creatr365"
        description="เลือกเส้นทางของคุณ: Courses, Toolbox, AI Lab, Creator Tools และ Events ของ Creatr365"
      />
      <CourseNavbar />

      <main className="explore-desk-view">
        <h1 className="explore-desk-sr">Explore Creatr365</h1>
        <div className="explore-desk-stage">
          <video
            ref={videoRef}
            className="explore-desk-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={DESK_VIDEO} type="video/mp4" />
          </video>

          <nav className="explore-desk-nav" aria-label="Explore">
            {HOTSPOTS.map((h) => (
              <Link
                key={h.key}
                to={h.href}
                aria-label={h.label}
                className="explore-desk-hit"
                style={{ left: `${h.l}%`, top: `${h.t}%`, width: `${h.w}%`, height: `${h.h}%` }}
              />
            ))}
          </nav>
        </div>
      </main>

      <Footer />

      <style>{`
        .explore-desk-view { position: relative; width: 100%; overflow: hidden; background: #15110d; }
        .explore-desk-stage { position: relative; width: 100%; aspect-ratio: 1344 / 768; background: #15110d; }
        .explore-desk-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .explore-desk-nav { position: absolute; inset: 0; }
        .explore-desk-hit { position: absolute; display: block; background: transparent; -webkit-tap-highlight-color: transparent; }
        .explore-desk-hit:focus-visible { outline: 2px dashed #fff; outline-offset: 3px; }
        .explore-desk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

        /* Phones: show the two post-it columns (x≈39–94%) by enlarging the frame and centring it on x≈67%. */
        @media (max-width: 767px) {
          .explore-desk-view { height: calc(175vw / 1.75); }
          .explore-desk-stage { width: 175vw; left: -67.25vw; }
        }

      `}</style>
    </>
  );
};

export default Explore;
