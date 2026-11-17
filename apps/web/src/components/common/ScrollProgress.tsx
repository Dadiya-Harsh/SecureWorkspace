import React, { useEffect, useState, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export const ScrollProgress: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [scale, setScale] = useState(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const updateProgress = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      setScale(progress);
      rafIdRef.current = null;
    };

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 h-[3px] bg-[#0F5C4D] z-50 origin-left pointer-events-none"
      style={{ transform: `scaleX(${scale})` }}
      aria-hidden="true"
    />
  );
};
