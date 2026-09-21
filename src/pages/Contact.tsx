import React, { useEffect } from 'react';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Mail, Globe, MessageCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';

const LINE_QR_URL = 'https://ik.imagekit.io/ideas365logo/L_926gxgxq_BW-1.png?updatedAt=1774500421226';

// Icon files live at /public/images/<name> — drop each PNG in there with
// these exact names and the button picks it up automatically.
const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://www.instagram.com/creatr365/', icon: '/images/icon-ig-w.png' },
  { name: 'Facebook', href: 'https://www.facebook.com/creatr365/', icon: '/images/icon-fb-w.png' },
  { name: 'YouTube', href: 'https://www.youtube.com/@Creatr365-Family', icon: '/images/icon-yt-w.png' },
  { name: 'TikTok', href: 'https://www.tiktok.com/@creatr365', icon: '/images/icon-tt-w.png' },
] as const;

const Contact: React.FC = () => {
  /* Cinematic dark tone — matches the landing page. Cleanup on unmount
     so the dark scope never leaks to the next route. */
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <>
      <SEOHead title="ติดต่อสอบถาม - Creatr365" description="ติดต่อ Creatr365 Live Streamer Academy" />
      <CourseNavbar />

      <section className="page-shell pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="section-title mb-4" data-accent="blue">ติดต่อสอบถาม</h1>
          <p className="section-subtitle mb-12" data-accent="blue">สนใจหลักสูตรหรือมีคำถาม? ติดต่อเราได้เลยค่ะ</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LINE Official */}
            <div className="card-water surface-card p-8 text-center" data-accent="green">
              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-foreground/70" />
              </div>
              <h2 className="text-xl font-bold mb-4 hover-shift" data-accent="green">LINE Official</h2>
              <img src={LINE_QR_URL} alt="LINE QR Code" className="w-36 h-36 mx-auto rounded-lg mb-4" />
              <a href="https://lin.ee/9Mw97Rc" target="_blank" rel="noopener noreferrer" className="btn-outline">
                เพิ่มเพื่อน
              </a>
            </div>

            {/* Other contacts */}
            <div className="space-y-6">
              <div className="card-water surface-card p-6" data-accent="blue">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold mb-1">Email</h2>
                    <a href="mailto:c365-support@ideas365.space" className="text-sm text-muted-foreground hover:text-foreground transition-colors">c365-support@ideas365.space</a>
                  </div>
                </div>
              </div>

              <div className="card-water surface-card p-6" data-accent="red">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold mb-1">Website</h2>
                    <a href="https://creatr365.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">creatr365.com</a>
                  </div>
                </div>
              </div>

              <div className="warm-card p-6">
                <span className="warm-badge block mb-3">Visit Us</span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Creatr365 Live Streamer Academy</strong><br />
                  Bangkok, Thailand<br /><br />
                  เปิดรับสมัครตลอดทั้งปี<br />
                  ทีมงานพร้อมช่วยเหลือคุณ 7 วัน 9.00–21.00 น.
                </p>
              </div>
            </div>
          </div>

          {/* Social channels */}
          <div className="card-water surface-card p-8 mt-8 text-center">
            <h2 className="text-lg font-bold mb-6">ช่องทางโซเชียลมีเดีย</h2>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className="w-14 h-14 rounded-full bg-foreground/8 hover:bg-foreground/15 flex items-center justify-center transition-colors hover-shift"
                >
                  <img src={s.icon} alt={s.name} className="w-6 h-6 object-contain" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Contact;
