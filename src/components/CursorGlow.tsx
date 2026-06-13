import { useEffect, useRef } from 'react';

/**
 * CursorGlow — cinematic mouse-reactive ambient light
 * Follows cursor with a soft red glow, matching CREATR365 brand (Deep Red primary)
 */
const CursorGlow = () => {
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -999, y: -999 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const tick = () => {
      if (el) {
        el.style.left = `${pos.current.x}px`;
        el.style.top  = `${pos.current.y}px`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="cursor-glow"
    />
  );
};

export default CursorGlow;
