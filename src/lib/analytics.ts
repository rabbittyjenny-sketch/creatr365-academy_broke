import type { ConsentState } from './consent';

/**
 * Consent-gated loader for GA4 / Meta Pixel / TikTok Pixel.
 *
 * Nothing here runs at import time. `applyConsent()` is the only entry
 * point, called once after the banner records a choice (and again if the
 * person changes it later via "จัดการคุกกี้"). Each tracker is skipped
 * silently if its env var isn't set yet — so this is safe to ship before
 * real IDs exist; add them to .env when ready and nothing else changes.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
    _fbq?: unknown;
    ttq?: any;
    TiktokAnalyticsObject?: string;
  }
}

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID as string | undefined;

const loadedScripts = new Set<string>();

function loadScriptOnce(src: string, extra?: (s: HTMLScriptElement) => void) {
  if (loadedScripts.has(src)) return;
  loadedScripts.add(src);
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  extra?.(s);
  document.head.appendChild(s);
}

function updateConsentMode(state: ConsentState) {
  // index.html already defined window.gtag with the default-denied stub
  // before this module ever runs; this just records the real choice.
  window.gtag?.('consent', 'update', {
    analytics_storage: state.analytics ? 'granted' : 'denied',
    ad_storage: state.marketing ? 'granted' : 'denied',
    ad_user_data: state.marketing ? 'granted' : 'denied',
    ad_personalization: state.marketing ? 'granted' : 'denied',
  });
}

let ga4Initialized = false;
function initGA4() {
  if (!GA4_ID || ga4Initialized) return;
  ga4Initialized = true;
  loadScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`);
  window.gtag?.('js', new Date());
  window.gtag?.('config', GA4_ID);
}

let metaInitialized = false;
function initMetaPixel() {
  if (!META_PIXEL_ID) return;
  if (!metaInitialized) {
    metaInitialized = true;
    // Standard Meta Pixel base code, condensed.
    (function (f: Window, b: Document, e: string, v: string) {
      if (f.fbq) return;
      const n: any = (f.fbq = function (...args: unknown[]) {
        n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      const t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s.parentNode?.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq?.('init', META_PIXEL_ID);
  }
  window.fbq?.('consent', 'grant');
  window.fbq?.('track', 'PageView');
}

function revokeMetaPixel() {
  window.fbq?.('consent', 'revoke');
}

let tiktokInitialized = false;
function initTikTokPixel() {
  // TikTok's pixel has no documented runtime "revoke" call, which is
  // exactly why it must only ever be loaded after marketing consent is
  // already true — never load-then-deny for this one.
  if (!TIKTOK_PIXEL_ID || tiktokInitialized) return;
  tiktokInitialized = true;
  // Mirrors TikTok's own base code exactly. Critically, `ttq` must be
  // initialized as an ARRAY (`w[t] || []`), not a plain object — the
  // queued-call shim below does `target.push(...)`, which only exists on
  // arrays. Getting this wrong (an earlier version of this file used `{}`)
  // makes both this shim AND TikTok's own events.js throw immediately.
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq: any = (w[t] = w[t] || []);
    ttq.methods = [
      'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once',
      'ready', 'alias', 'group', 'enableCookie', 'disableCookie',
      'holdConsent', 'revokeConsent', 'grantConsent',
    ];
    ttq.setAndDefer = function (target: any, method: string) {
      target[method] = function (...args: unknown[]) {
        target.push([method, ...args]);
      };
    };
    for (const m of ttq.methods) ttq.setAndDefer(ttq, m);
    ttq.instance = function (id: string) {
      const e = ttq._i[id] || [];
      for (const m of ttq.methods) ttq.setAndDefer(e, m);
      return e;
    };
    ttq.load = function (id: string, options?: { partner?: string }) {
      const url = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = url;
      ttq._t = ttq._t || {};
      ttq._t[id] = Date.now();
      ttq._o = ttq._o || {};
      ttq._o[id] = options || {};
      const script = d.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `${url}?sdkid=${id}&lib=${t}`;
      const first = d.getElementsByTagName('script')[0];
      first.parentNode?.insertBefore(script, first);
    };
    ttq.load(TIKTOK_PIXEL_ID);
    ttq.page();
  })(window, document, 'ttq');
}

/**
 * Call once after the banner records (or the person updates) a choice.
 * Idempotent — safe to call again on every consent change.
 */
export function applyConsent(state: ConsentState) {
  updateConsentMode(state);

  if (state.analytics) initGA4();

  if (state.marketing) {
    initMetaPixel();
    initTikTokPixel();
  } else if (metaInitialized) {
    revokeMetaPixel();
  }
}
