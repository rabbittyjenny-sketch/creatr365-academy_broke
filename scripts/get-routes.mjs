// @ts-check
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://c365.ideas365.space';

/** Static, code-defined public routes (see src/App.tsx). Auth, dashboard,
 *  admin, and account-management routes are deliberately excluded — they
 *  require a session and have nothing for a crawler to index (also
 *  disallowed in robots.txt). */
export const STATIC_ROUTES = [
  '/',
  '/courses',
  '/articles',
  '/faq',
  '/contact',
  '/privacy',
  '/terms',
  '/refund-policy',
];

/**
 * Dynamic routes: published courses and articles, straight from Supabase.
 * `is_active = true` is the one publish switch for both tables — see the
 * comment in src/pages/Courses.tsx confirming this; nothing here re-derives
 * or guesses a different rule.
 *
 * Returns [] (never throws) if Supabase isn't reachable or isn't
 * configured — a missing/failing DB call must never fail the whole build.
 * The site still ships with the static routes prerendered and a smaller
 * sitemap; only the dynamic course/article URLs are absent until this can
 * run somewhere with real credentials and network access.
 */
export async function getDynamicRoutes() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.warn(
      '[get-routes] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set — ' +
        'skipping course/article routes (static routes only).',
    );
    return [];
  }

  try {
    const supabase = createClient(url, key);

    const [coursesRes, articlesRes] = await Promise.all([
      supabase.from('courses').select('slug').eq('is_active', true),
      supabase.from('articles').select('slug').eq('is_active', true),
    ]);

    if (coursesRes.error) console.warn('[get-routes] courses query failed:', coursesRes.error.message);
    if (articlesRes.error) console.warn('[get-routes] articles query failed:', articlesRes.error.message);

    const courseRoutes = (coursesRes.data || []).map((c) => `/course/${c.slug}`);
    const articleRoutes = (articlesRes.data || []).map((a) => `/articles/${a.slug}`);

    return [...courseRoutes, ...articleRoutes];
  } catch (err) {
    console.warn('[get-routes] Supabase unreachable — skipping course/article routes:', err.message);
    return [];
  }
}

export async function getAllRoutes() {
  const dynamic = await getDynamicRoutes();
  return [...STATIC_ROUTES, ...dynamic];
}

export { SITE_URL };
