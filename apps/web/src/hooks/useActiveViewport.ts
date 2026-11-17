import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether an element is currently intersecting the viewport AND the browser tab is visible.
 * Useful for pausing infinite animations or polling intervals when offscreen or tab is backgrounded.
 */
export function useActiveViewport<T extends HTMLElement = HTMLDivElement>(
  threshold = 0
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(() => typeof IntersectionObserver === 'undefined');
  const [isTabVisible, setIsTabVisible] = useState(() => {
    return typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return [ref, isIntersecting && isTabVisible];
}
