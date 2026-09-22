// @ts-check
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getAllRoutes } from './get-routes.mjs';

const DIST_DIR = path.resolve('dist');
const PORT = 4173;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
  '.txt': 'text/plain', '.xml': 'application/xml',
};

/** Minimal static file server with SPA fallback — mirrors how Vercel/
 *  Netlify serve this build in production (real file first, index.html
 *  fallback for client-side routes), so the crawl sees exactly what a
 *  real visitor's first request would see. */
function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const candidate = path.join(DIST_DIR, urlPath);
      const filePath = existsSync(candidate) && !candidate.endsWith(path.sep) && candidate.startsWith(DIST_DIR)
        ? candidate
        : path.join(DIST_DIR, 'index.html');
      try {
        const data = await readFile(filePath);
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(PORT, () => resolve(server));
  });
}

/** Where a route's prerendered snapshot gets written. "/" -> dist/index.html
 *  (the file that already exists — this is the one file we deliberately
 *  overwrite). "/courses" -> dist/courses/index.html, matching how static
 *  hosts resolve a directory request to its index.html. */
function outputPathFor(route) {
  if (route === '/') return path.join(DIST_DIR, 'index.html');
  return path.join(DIST_DIR, route, 'index.html');
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error('[prerender] dist/ not found — run `vite build` first. Skipping prerender.');
    return;
  }

  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.warn(
      '[prerender] puppeteer is not installed — skipping prerender. ' +
        'Run `npm install` (it is already in devDependencies) to enable this step.',
    );
    return;
  }

  // Hard ceiling on the whole pass. A stuck browser launch or a route that
  // never settles must never block a real CI build indefinitely — this is
  // a best-effort enhancement, not the build itself, so it fails open.
  const WATCHDOG_MS = 120_000;
  const watchdog = setTimeout(() => {
    console.warn(`[prerender] exceeded ${WATCHDOG_MS}ms overall — bailing out, leaving remaining routes as plain SPA shells.`);
    process.exit(0);
  }, WATCHDOG_MS);
  watchdog.unref?.();

  const routes = await getAllRoutes();
  const server = await startServer();
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      timeout: 20000,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.warn('[prerender] could not launch a browser — skipping prerender:', err.message);
    server.close();
    clearTimeout(watchdog);
    return;
  }

  let ok = 0;
  let failed = 0;

  for (const route of routes) {
    const page = await browser.newPage();
    try {
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 15000 });
      // react-helmet-async updates <head> synchronously during render, and
      // Supabase-backed pages fetch on mount — networkidle0 above already
      // waits for that fetch's request to settle, so no arbitrary sleep here.
      const html = await page.content();
      const outPath = outputPathFor(route);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html, 'utf-8');
      ok++;
    } catch (err) {
      failed++;
      console.warn(`[prerender] failed on ${route}, leaving the plain SPA shell for this route:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();
  clearTimeout(watchdog);

  console.log(`[prerender] done — ${ok} route(s) prerendered, ${failed} failed (see warnings above).`);
  console.log(
    '[prerender] note: this replaces dist/index.html and dist/<route>/index.html with fully-rendered ' +
      'snapshots for crawlers; the app still mounts client-side on top for real visitors (no hydrateRoot ' +
      'migration in this pass, so there is a brief re-render on load — see CHANGELOG).',
  );
}

main().catch((err) => {
  // A failed prerender pass must not block deployment — the site still
  // works as a plain SPA, it just loses this pass's crawler-visibility gain.
  console.error('[prerender] unexpected failure, continuing build without prerendered pages:', err);
});
