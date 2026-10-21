import React, { useEffect, useRef } from 'react';

/**
 * Renders an article's `body` HTML (the one "เนื้อหาเต็ม (HTML)" field in
 * Admin → เนื้อหา). Used by /articles/:slug and by the Admin preview so both
 * show the same thing.
 *
 * Two kinds of body come through that one field:
 * - Plain HTML (h2/p/ul/img…): styled by the site's dark `.article-body` CSS,
 *   exactly as before.
 * - HTML that carries its own design — e.g. the finished export of the
 *   Creatr365 article design tool (`<div id="dc-root">`, inline styles, light
 *   background) or a whole page with <style>/<html>. Dropped into
 *   `.article-body` it broke both ways: the site CSS forced every h2/h3 white
 *   (invisible on the design's light background) and squeezed it to 624px,
 *   and the design's own <style> (e.g. `a{color:#C1121F;underline}`) leaked
 *   onto the navbar. These render full width inside a Shadow DOM, which keeps
 *   site CSS out and the design's CSS in.
 *
 * Scripts never run (innerHTML doesn't execute them; they're stripped
 * anyway, along with on* handlers and javascript: URLs). A design-tool
 * *template* (`{{ meta.title }}`, <sc-if>) still needs its finished export —
 * its content lives in a separate .js file this page never sees.
 */

export function isDesignedHtml(html: string | null | undefined): boolean {
  if (!html) return false;
  return /id=["']dc-root["']|<html[\s>]|<body[\s>]|<style[\s>]|<x-dc[\s>]/i.test(html);
}

function sanitize(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, noscript').forEach(el => el.remove());
  doc.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      else if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  });
  // <head> holds the design's <link>/<style>; keep them with the body so the
  // shadow root still gets its fonts and scoped CSS.
  return doc.head.innerHTML + doc.body.innerHTML;
}

// @font-face inside a shadow root is ignored by browsers, so a design's
// Google Fonts stylesheet is also added once to the page <head>.
function hoistFontLinks(root: ShadowRoot) {
  root.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href*="fonts.googleapis.com"]').forEach(link => {
    if (!document.head.querySelector(`link[rel="stylesheet"][href="${CSS.escape(link.href)}"]`)) {
      const copy = document.createElement('link');
      copy.rel = 'stylesheet';
      copy.href = link.href;
      document.head.appendChild(copy);
    }
  });
}

const SHADOW_BASE_CSS = ':host{display:block}img{max-width:100%}';

const DesignedBody: React.FC<{ html: string; scrollOffset: number }> = ({ html, scrollOffset }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${SHADOW_BASE_CSS}</style>${sanitize(html)}`;
    hoistFontLinks(root);

    // In-page links (e.g. the design's สารบัญ → #ch-1) look up ids in the
    // document, which can't see inside the shadow root — scroll manually,
    // clearing the fixed navbar.
    const onClick = (e: Event) => {
      const a = (e.composedPath() as Element[]).find(el => el instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
      const hash = a?.getAttribute('href');
      if (!hash || !hash.startsWith('#') || hash.length < 2) return;
      const target = root.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - scrollOffset, behavior: 'smooth' });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [html, scrollOffset]);

  return <div ref={hostRef} className="article-designed" />;
};

export const ArticleBody: React.FC<{ html: string; className?: string; scrollOffset?: number }> = ({
  html, className = 'text-white/70 leading-relaxed', scrollOffset = 80,
}) => {
  if (isDesignedHtml(html)) return <DesignedBody html={html} scrollOffset={scrollOffset} />;
  return <div className={`article-body ${className}`} dangerouslySetInnerHTML={{ __html: sanitize(html) }} />;
};

export default ArticleBody;
