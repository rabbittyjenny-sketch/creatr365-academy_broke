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
        fontFamily: 'inherit',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(248,248,246,0.85)', marginBottom: expanded ? '18px' : '14px' }}>
          เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การใช้งานและปรับปรุงการแสดงโฆษณาให้ตรงกลุ่มเป้าหมายมากขึ้น
          ท่านสามารถเลือกยอมรับหรือปฏิเสธได้ ระบบจะไม่เก็บคุกกี้ที่ไม่จำเป็นจนกว่าท่านจะกด "ยอมรับ" —
          อ่านรายละเอียดที่{' '}
          <Link to="/privacy" style={{ color: '#F8F8F6', textDecoration: 'underline' }}>
            นโยบายความเป็นส่วนตัว (PDPA)
          </Link>
        </p>

        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid rgba(248,248,246,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700 }}>คุกกี้ที่จำเป็น</p>
                <p style={{ fontSize: '13px', color: 'rgba(248,248,246,0.6)' }}>สำหรับการล็อกอินและการทำงานพื้นฐานของเว็บ — ปิดไม่ได้</p>
              </div>
              <Switch checked disabled aria-label="คุกกี้ที่จำเป็น (บังคับเปิด)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700 }}>คุกกี้วิเคราะห์ผล (Analytics)</p>
                <p style={{ fontSize: '13px', color: 'rgba(248,248,246,0.6)' }}>ช่วยให้เราเข้าใจว่าผู้เข้าชมใช้งานเว็บอย่างไร (Google Analytics)</p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="คุกกี้วิเคราะห์ผล" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700 }}>คุกกี้การตลาด (Marketing)</p>
                <p style={{ fontSize: '13px', color: 'rgba(248,248,246,0.6)' }}>ใช้แสดงโฆษณาที่ตรงความสนใจบน Meta และ TikTok</p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="คุกกี้การตลาด" />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-end' }}>
          {expanded ? (
            <button onClick={handleSavePreferences} className="btn-outline" style={{ borderColor: '#C1121F', color: '#F8F8F6' }}>
              บันทึกการตั้งค่า
            </button>
          ) : (
            <>
              <button onClick={() => setExpanded(true)} className="btn-outline">
                จัดการการตั้งค่า
              </button>
              <button onClick={handleRejectAll} className="btn-outline">
                ปฏิเสธที่ไม่จำเป็น
              </button>
              <button
                onClick={handleAcceptAll}
                className="btn-outline"
                style={{ borderColor: '#C1121F', color: '#F8F8F6', fontWeight: 700 }}
              >
                ยอมรับทั้งหมด
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/** True once the visitor has made (and stored) a cookie choice — exported
 *  so other code can check without importing from lib/consent directly. */
export const hasStoredConsent = hasConsentDecision;
