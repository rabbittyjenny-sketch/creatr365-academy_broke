import { useEffect, useRef } from 'react';

/**
 * useReveal — attaches IntersectionObserver to a container.
 * All children with [data-reveal] will animate in when visible.
 * Supports stagger via data-reveal-delay="200" (ms).
 */
export function useReveal(rootMargin = '0px 0px -80px 0px') {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const targets = container.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.revealDelay ?? '0';
            setTimeout(() => {
              el.classList.add('revealed');
            }, parseInt(delay));
            observer.unobserve(el);
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}
