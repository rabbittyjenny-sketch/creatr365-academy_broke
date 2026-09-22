import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position on navigation — clicking a
// footer link while scrolled to the bottom of a long page (e.g. Home) leaves
// the browser at that same scroll position on the new page, which lands the
// visitor somewhere in the middle/end of it instead of at the top.
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
