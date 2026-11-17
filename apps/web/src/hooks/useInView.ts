import { useEffect, useRef, useState } from 'react';

/**
 * IntersectionObserver hook that triggers once when element enters viewport (threshold 0.15),
 * then disconnects. Returns [ref, inView].
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || inView || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, inView]);

  return [ref, inView];
}
