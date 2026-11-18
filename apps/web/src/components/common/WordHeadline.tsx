import React, { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface WordHeadlineProps {
  children: string;
  className?: string;
}

/**
 * Page <h1> whose words rise in one by one (90ms stagger).
 * Screen readers get the full text via aria-label; the animated spans are aria-hidden.
 * With reduced motion the plain heading is rendered.
 */
export const WordHeadline: React.FC<WordHeadlineProps> = ({ children, className = '' }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Double rAF so the hidden state paints before the transition starts.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const baseClass = `text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight ${className}`;

  if (prefersReducedMotion) {
    return <h1 className={baseClass}>{children}</h1>;
  }

  const words = children.trim().split(/\s+/);

  return (
    <h1 className={baseClass} aria-label={children}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden="true"
          className={`inline-block mr-[0.26em] last:mr-0 transition-[opacity,transform] duration-700 ${
            shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            transitionDelay: `${i * 90}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </h1>
  );
};
