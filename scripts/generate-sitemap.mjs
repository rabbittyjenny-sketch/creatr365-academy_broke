// @ts-check
import { writeFileSync } from 'node:fs';
import { getAllRoutes, SITE_URL } from './get-routes.mjs';

async function main() {
  const routes = await getAllRoutes();
  const today = new Date().toISOString().slice(0, 10);

  const body = routes
    .map(
      (route) => `  <url>
    <loc>${SITE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  writeFileSync('dist/sitemap.xml', xml, 'utf-8');
  console.log(`[generate-sitemap] wrote dist/sitemap.xml with ${routes.length} URLs`);
}

main().catch((err) => {
  // A broken sitemap is a lost SEO signal, not a broken site — never fail
  // the deploy over this.
  console.error('[generate-sitemap] failed, continuing build without an updated sitemap:', err);
});
