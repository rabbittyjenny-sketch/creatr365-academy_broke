import React from 'react';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { Mail, Globe, MessageCircle } from 'lucide-react';

const LINE_QR_URL = 'https://ik.imagekit.io/ideas365logo/L_926gxgxq_BW-1.png?updatedAt=1774500421226';

const Contact: React.FC = () => {
  return (
    <>
      <SEOHead title="ติดต่อสอบถาม - Creatr365" description="ติดต่อ Creatr365 Live Streamer Academy" />
      <CourseNavbar />

      <section className="pt-28 pb-16 px-4 bg-background min-h-screen">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" data-accent="blue">ติดต่อสอบถาม</h1>
          <p className="text-muted-foreground text-lg mb-12" data-accent="blue">สนใจหลักสูตรหรือมีคำถาม? ติดต่อเราได้เลยค่ะ</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LINE Official */}
            <div className="card-water border border-border bg-card p-8 text-center" data-accent="green">
              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-foreground/70" />
              </div>
              <h2 className="text-xl font-bold mb-4 hover-shift" data-accent="green">LINE Official</h2>
              <img
                src={LINE_QR_URL}
                alt="LINE Official QR Code"
                className="w-48 h-48 mx-auto rounded-xl object-contain mb-4"
              />
              <p className="text-sm text-muted-foreground">สแกน QR Code เพื่อเพิ่มเพื่อน</p>
            </div>

            {/* Other contacts */}
            <div className="space-y-6">
              <div className="card-water border border-border bg-card p-6" data-accent="blue">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 hover-shift" data-accent="blue">Email</h3>
                    <a href="mailto:hello@creatr365.com" className="text-foreground/70 hover:text-foreground text-sm">
                      hello@creatr365.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="card-water border border-border bg-card p-6" data-accent="red">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 hover-shift" data-accent="red">Website</h3>
                    <a href="https://www.creatr365.com" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-foreground text-sm">
                      www.creatr365.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="card-water border border-border bg-card p-6" data-accent="yellow">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Creatr365 Live Streamer Academy</strong><br />
                  Bangkok, Thailand<br /><br />
                  เปิดรับสมัครตลอดทั้งปี<br />
                  ตอบกลับภายใน 24 ชั่วโมง
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
