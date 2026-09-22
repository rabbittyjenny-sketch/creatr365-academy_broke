/**
 * Single source of truth for the main site nav, shared by CourseNavbar.tsx
 * (the default navbar) and Navbar.tsx (the transparent-on-scroll variant used
 * only on the /events pages). Before this file existed, MAIN_NAV was copied
 * verbatim into both components with a comment saying "keep both in sync" —
 * this makes that automatic instead of a thing to remember.
 *
 * EVENTS is added here per the Bible's Z4 decision: "เปิดระบบ Events" — the
 * pages already existed and worked, they just had no link pointing at them
 * from anywhere in the main nav.
 */
export const MAIN_NAV = [
  { to: '/', label: 'HOME' },
  { to: '/explore', label: 'EXPLORE' },
  { to: '/events', label: 'EVENTS' },
  { to: '/articles/diagnostic-quiz', label: 'TEST YOURSELF' },
  { to: '/articles', label: 'COMMUNITY' },
  { to: '/contact', label: 'C365' },
] as const;
