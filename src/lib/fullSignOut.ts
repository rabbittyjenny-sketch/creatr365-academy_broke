import liff from "@line/liff";
import { supabase } from "@/integrations/supabase/client";

const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID as string | undefined;

/**
 * Signs the user out completely.
 *
 * supabase.auth.signOut() alone is NOT enough for anyone who arrived via LINE:
 * the LIFF SDK keeps its own login state in localStorage, independent of the
 * Supabase session. If that LIFF state isn't cleared too, the next time this
 * person opens /register, liff.init() sees liff.isLoggedIn() === true and
 * skips straight past the login screen back into the SAME LINE account —
 * which looks like "the system won't let me sign up again."
 *
 * Call this everywhere a logout button currently calls supabase.auth.signOut().
 */
export async function fullSignOut(): Promise<void> {
  await supabase.auth.signOut();

  if (!LIFF_ID) return;

  try {
    await liff.init({ liffId: LIFF_ID });
    if (liff.isLoggedIn()) {
      liff.logout();
    }
  } catch {
    // liff.init() can fail outside of a LINE/LIFF browser context (e.g. a
    // desktop browser session that never touched LINE) — nothing to clear
    // in that case, so it's safe to ignore.
  }
}
