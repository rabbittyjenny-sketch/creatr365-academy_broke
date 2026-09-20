import { Link } from 'react-router-dom';

const LOGO = '/images/w-logo-side.png';

export const Footer = () => (
  <footer style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(40px,5vw,60px) clamp(20px,4vw,48px) clamp(24px,3vw,40px)', fontFamily: 'inherit' }}>
    <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'clamp(24px,4vw,48px)', marginBottom: 'clamp(28px,3vw,40px)' }}>
        <div>
          <img src={LOGO} alt="Creatr365" style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: '260px', fontFamily: 'inherit' }}>
            A Creative House for the Future of Live Commerce.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'clamp(28px,4vw,56px)', flexWrap: 'wrap' }}>
          {Object.entries({
            'หลักสูตร': [['/courses','ดูทั้งหมด'],['/course/magnet','THE MAGNET'],['/course/foundation','THE FOUNDATION'],['/course/signal','SIGNAL'],['/course/stage','STAGE'],['/course/brand-host-architect','BRAND HOST ARCHITECT']],
            'ชุมชน': [['/events','กิจกรรม'],['/my-events','กิจกรรมของฉัน'],['/articles','บทความ']],
            'ข้อมูล': [['/contact','ติดต่อ'],['/faq','คำถามที่พบบ่อย']],
          }).map(([title, links]) => (
            <div key={title}>
              <p style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '14px', fontFamily: 'inherit' }}>{title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(links as string[][]).map(([href, label]) => (
                  <Link key={href} to={href} style={{ fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color .2s', fontFamily: 'inherit' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '22px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
        <p>© {new Date().getFullYear()} CREATR365. All rights reserved.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
          {[['นโยบายความเป็นส่วนตัว', '/privacy'], ['ข้อกำหนดการใช้บริการ', '/terms'], ['นโยบายการคืนเงิน', '/refund-policy'], ['คำถามที่พบบ่อย', '/faq']].map(([l, h]) => (
            <Link key={l} to={h} style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontFamily: 'inherit', fontSize: '13px' }}>
              {l}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </footer>
);
