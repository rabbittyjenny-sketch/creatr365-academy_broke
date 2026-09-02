import { useEffect } from 'react';

/**
 * Marks the page dark by toggling the site's shared `.dark` class on
 * <html> — the same mechanism RequireAdmin.tsx already uses for the admin
 * console, so CourseNavbar's logo swap and every --background/--foreground/
 * --border/--card token flip correctly with zero extra wiring. Removed on
 * unmount so every other (light) page is unaffected.
 */
export function useDarkPage() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);
}
