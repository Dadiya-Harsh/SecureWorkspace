import React, { type ElementType, type ReactNode } from 'react';
import { useInView } from '../../hooks/useInView';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface RevealProps {
  as?: ElementType;
  delay?: number;
  /** Direction the content travels from. Defaults to rising from below. */
  from?: 'up' | 'left' | 'right';
  className?: string;
  children: ReactNode;
}

const HIDDEN: Record<NonNullable<RevealProps['from']>, string> = {
  up: 'opacity-0 translate-y-8',
  left: 'opacity-0 -translate-x-7',
  right: 'opacity-0 translate-x-7',
};

/**
 * Fades and rises content into view once. Hidden from the first paint (no flash),
 * and always shown when IntersectionObserver is missing or reduced motion is on.
 */
export const Reveal: React.FC<RevealProps> = ({
  as: Component = 'div',
  delay = 0,
  from = 'up',
  className = '',
  children,
}) => {
  const [ref, inView] = useInView<HTMLElement>(0.15);
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-[800ms] ${
        inView ? 'opacity-100 translate-x-0 translate-y-0' : HIDDEN[from]
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Component>
  );
};
