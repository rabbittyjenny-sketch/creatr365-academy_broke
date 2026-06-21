import React, { useEffect } from 'react';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Mail, Globe, MessageCircle } from 'lucide-react';

const LINE_QR_URL = 'https://ik.imagekit.io/ideas365logo/L_926gxgxq_BW-1.png?updatedAt=1774500421226';

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
              <p className="text-sm font-semibold text-foreground mb-4">LINE ID: @creatr365</p>
              <a href="https://line.me/R/ti/p/@creatr365" target="_blank" rel="noopener noreferrer" className="btn-outline">
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
                    <a href="mailto:hello@creatr365.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">hello@creatr365.com</a>
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
        </div>
      </section>
    </>
  );
};

export default Contact;
