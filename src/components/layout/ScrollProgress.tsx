import { useEffect, useState } from 'react';

/**
 * Thin vermilion line pinned to the top of the viewport that fills
 * from 0 to 1 as the user scrolls. Pure magazine cue.
 */
export default function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="scroll-progress-rail" aria-hidden="true">
      <div className="scroll-progress-fill" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
