import React, { type ElementType, type ReactNode, useEffect, useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface RevealProps {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
}

export const Reveal: React.FC<RevealProps> = ({
  as: Component = 'div',
  delay = 0,
  className = '',
  children,
}) => {
  const [ref, inView] = useInView<HTMLElement>(0.15);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  // Content never depends on JS to be visible:
  // Before mount, elements are rendered visible.
  // After mount, elements below fold hide until inView triggers.
  const isVisible = !mounted || inView;

  return (
    <Component
      ref={ref}
      className={`${className} ${
        mounted
          ? 'transition-[opacity,transform] duration-[800ms]'
          : ''
      } ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={
        mounted
          ? {
              transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
              transitionDelay: `${delay}ms`,
            }
          : undefined
      }
    >
      {children}
    </Component>
  );
};
