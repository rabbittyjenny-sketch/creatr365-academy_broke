import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import {
  getConsent,
  acceptAll,
  rejectNonEssential,
  setConsent,
  hasConsentDecision,
  OPEN_PREFERENCES_EVENT,
} from '@/lib/consent';
import { applyConsent } from '@/lib/analytics';

export const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (existing) {
      // Returning visitor with a decision already on file — apply it
      // (loads/keeps GA4/Meta/TikTok consistent with their last choice)
      // instead of loading nothing until they interact again.
      applyConsent(existing);
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    } else {
      setVisible(true);
    }

    const openPreferences = () => {
      const current = getConsent();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
      setExpanded(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
  }, []);

  if (!visible) return null;

  const close = () => setVisible(false);

  const handleAcceptAll = () => {
    applyConsent(acceptAll());
    close();
  };

  const handleRejectAll = () => {
    applyConsent(rejectNonEssential());
    close();
  };

  const handleSavePreferences = () => {
    applyConsent(setConsent({ analytics, marketing }));
    close();
  };

  return (
    <div
      role="dialog"
      aria-label="การตั้งค่าคุกกี้"
      className="c365-cookie"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: '#0D0D0D',
        color: '#F8F8F6',
        borderTop: '1px solid rgba(248,248,246,0.12)',
        padding: 'clamp(16px,3vw,24px)',
        fontFamily: "'IBM Plex Sans Thai', 'Overpass', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Two lines of near-equal length: line 1 = what the cookies are for + "you can accept or
            decline"; line 2 starts at "ระบบ…" and runs to the end. On narrow screens each line
            wraps by itself. Type follows Home.tsx section 10 body copy (clamp(13px,1.2vw,16px), 1.72). */}
        <p className="c365-cookie-text" style={{ margin: 0, fontSize: 'clamp(13px,1.2vw,16px)', lineHeight: 1.72, color: 'rgba(255,255,255,.68)', marginBottom: expanded ? '18px' : '16px' }}>
          เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การใช้งานและปรับปรุงการแสดงโฆษณาให้ตรงกลุ่มเป้าหมายมากขึ้น ท่านสามารถเลือกยอมรับหรือปฏิเสธได้
          <br />
          ระบบจะไม่เก็บคุกกี้ที่ไม่จำเป็นจนกว่าท่านจะกด "ยอมรับ" — อ่านรายละเอียดที่{' '}
          <Link to="/privacy" className="c365-cookie-link">
            นโยบายความเป็นส่วนตัว (PDPA)
          </Link>
        </p>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid rgba(248,248,246,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>คุกกี้ที่จำเป็น</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', margin: 0 }}>สำหรับการล็อกอินและการทำงานพื้นฐานของเว็บ — ปิดไม่ได้</p>
              </div>
              <Switch className="data-[state=checked]:bg-[#CC0033]" checked disabled aria-label="คุกกี้ที่จำเป็น (บังคับเปิด)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>คุกกี้วิเคราะห์ผล (Analytics)</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', margin: 0 }}>ช่วยให้เราเข้าใจว่าผู้เข้าชมใช้งานเว็บอย่างไร (Google Analytics)</p>
              </div>
              <Switch className="data-[state=checked]:bg-[#CC0033]" checked={analytics} onCheckedChange={setAnalytics} aria-label="คุกกี้วิเคราะห์ผล" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>คุกกี้การตลาด (Marketing)</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', margin: 0 }}>ใช้แสดงโฆษณาที่ตรงความสนใจบน Meta และ TikTok</p>
              </div>
              <Switch className="data-[state=checked]:bg-[#CC0033]" checked={marketing} onCheckedChange={setMarketing} aria-label="คุกกี้การตลาด" />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-end' }}>
          {expanded ? (
            <button onClick={handleSavePreferences} className="c365-cookie-btn c365-cookie-btn--primary">
              บันทึกการตั้งค่า
            </button>
          ) : (
            <>
              <button onClick={() => setExpanded(true)} className="c365-cookie-btn">
                จัดการการตั้งค่า
              </button>
              <button onClick={handleRejectAll} className="c365-cookie-btn">
                ปฏิเสธที่ไม่จำเป็น
              </button>
              <button onClick={handleAcceptAll} className="c365-cookie-btn c365-cookie-btn--primary">
                ยอมรับทั้งหมด
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        /* Scoped to the banner. Look = the hero's CTAs: red #CC0033 solid for the main action,
           thin white-ghost for the others, 4px corners, same dark #0D0D0D ground. */
        .c365-cookie p:hover, .c365-cookie p:hover span { color: inherit; }
        .c365-cookie .c365-cookie-text { text-wrap: balance; }
        .c365-cookie .c365-cookie-text:hover { color: rgba(255,255,255,.68); }
        .c365-cookie .c365-cookie-link { color: #fff; font-weight: 700; text-decoration: none; border-bottom: 2px solid #CC0033; padding-bottom: 1px; transition: border-color .28s ease; }
        .c365-cookie a.c365-cookie-link:hover { color: #fff; border-bottom-color: #fff; }
        .c365-cookie-btn {
          font-family: inherit; font-size: 13px; font-weight: 600; letter-spacing: .04em; line-height: 1.2;
          padding: 13px clamp(16px,2.2vw,28px); border-radius: 4px; cursor: pointer;
          background: transparent; color: rgba(255,255,255,.72); border: 1px solid rgba(255,255,255,.22);
          transition: color .28s ease, border-color .28s ease, background-color .28s ease, transform .28s ease;
        }
        .c365-cookie button.c365-cookie-btn:hover { color: #fff; border-color: rgba(255,255,255,.55); transform: translateY(-1px); }
        .c365-cookie button.c365-cookie-btn--primary { background: #CC0033; border-color: #CC0033; color: #fff; font-weight: 700; }
        .c365-cookie button.c365-cookie-btn--primary:hover { background: #E0083F; border-color: #E0083F; color: #fff; }
        .c365-cookie-btn:focus-visible, .c365-cookie-link:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
        @media (hover: none) { .c365-cookie button.c365-cookie-btn:hover { transform: none; } }
      `}</style>
    </div>
  );
};

/** True once the visitor has made (and stored) a cookie choice — exported
 *  so other code can check without importing from lib/consent directly. */
export const hasStoredConsent = hasConsentDecision;
