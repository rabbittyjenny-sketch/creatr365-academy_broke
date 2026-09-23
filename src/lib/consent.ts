/**
 * PDPA-compliant cookie consent state.
 *
 * Only two categories exist because that's all this site currently has any
 * use for:
 *   - "necessary"  — always on. Login session, cart/enrollment state, CSRF
 *                    tokens. Never asked about, per PDPA §24/26 exemption
 *                    for cookies strictly necessary to provide the service.
 *   - "analytics"  — GA4. Understanding traffic and drop-off.
 *   - "marketing"  — Meta Pixel + TikTok Pixel. Ad targeting/retargeting.
 *
 * Nothing in analytics.ts loads *anything* until this module reports an
 * explicit "accepted" choice for that category — opt-in, not opt-out, and
 * no script fires before the choice is recorded (see index.html's Consent
 * Mode default-denied stub, which covers the gap between page load and
 * this module initializing).
 */

export type ConsentCategory = 'analytics' | 'marketing';

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of when this choice was recorded. */
  timestamp: string;
  /** Bump this if the categories or the banner copy ever change materially
   *  — a version bump re-prompts everyone instead of silently reinterpreting
   *  an old "yes" under new terms. */
  version: number;
}

const STORAGE_KEY = 'creatr365_cookie_consent_v1';
const CURRENT_VERSION = 1;

type Listener = (state: ConsentState | null) => void;
const listeners = new Set<Listener>();

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CURRENT_VERSION) return null; // re-prompt on version bump
    return parsed;
  } catch {
    return null; // storage blocked or corrupted — treat as "no decision yet"
  }
}

export function hasConsentDecision(): boolean {
  return getConsent() !== null;
}

function persist(state: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota, etc). The choice still
    // applies for this page view via the in-memory listeners below; it
    // just won't be remembered on the next visit.
  }
  listeners.forEach((fn) => fn(state));
}

export function setConsent(choice: { analytics: boolean; marketing: boolean }) {
  const state: ConsentState = {
    analytics: choice.analytics,
    marketing: choice.marketing,
    timestamp: new Date().toISOString(),
    version: CURRENT_VERSION,
  };
  persist(state);
  return state;
}

export function acceptAll() {
  return setConsent({ analytics: true, marketing: true });
}

export function rejectNonEssential() {
  return setConsent({ analytics: false, marketing: false });
}

export function onConsentChange(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Footer's "จัดการคุกกี้" link fires this; CookieConsentBanner listens
 *  for it and reopens the manage panel regardless of a decision already
 *  on file — PDPA requires withdrawal to be as easy as giving consent. */
export const OPEN_PREFERENCES_EVENT = 'creatr365:open-cookie-preferences';

export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
}
