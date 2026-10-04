/**
 * Where to send someone after they sign in.
 *
 * The target travels two ways at once, because each login path can drop one:
 *  - `?redirect=` on /auth — survives normal email login and LINE (LIFF)
 *    login, since liff.login() returns to the exact /auth URL it left from.
 *  - localStorage — survives the cases where the URL is lost: the email
 *    confirmation link opened later, or a LIFF redirect that rewrites the
 *    query string. Stored with a timestamp and ignored after 30 minutes so a
 *    stale target from last week never hijacks a fresh login.
 *
 * Only same-site paths are accepted (`/x`, never `//evil.com` or `/\evil`).
 */

const KEY = 'c365_post_auth_target';
const TTL_MS = 30 * 60 * 1000;

export const isSafePath = (p: string | null | undefined): p is string =>
  !!p && /^\/(?![/\\])/.test(p);

export function rememberPostAuthTarget(path: string) {
  if (!isSafePath(path)) return;
  try { localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() })); } catch { /* storage blocked */ }
}

export function peekPostAuthTarget(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw) as { path?: string; at?: number };
    if (!isSafePath(path) || !at || Date.now() - at > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return path;
  } catch {
    return null;
  }
}

export function clearPostAuthTarget() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Read and clear in one step. */
export function takePostAuthTarget(): string | null {
  const p = peekPostAuthTarget();
  clearPostAuthTarget();
  return p;
}

export const loginUrlFor = (path: string) => `/auth?redirect=${encodeURIComponent(path)}`;

/** Remember `path`, then go to /auth with it attached. */
export function goToLogin(navigate: (to: string) => void, path: string) {
  rememberPostAuthTarget(path);
  navigate(loginUrlFor(path));
}

/** Current page as a same-site path (for "come back here after login"). */
export const currentPath = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;
