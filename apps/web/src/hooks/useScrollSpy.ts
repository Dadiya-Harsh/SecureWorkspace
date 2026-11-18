import { useEffect, useState } from 'react';

/**
 * Returns the id of the section currently "in focus" while scrolling.
 * A section counts as active when it crosses the band between 15% and 30%
 * from the top of the viewport (rootMargin '-15% 0px -70% 0px').
 */
export function useScrollSpy(ids: readonly string[]): [string, (id: string) => void] {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '');
  const key = ids.join('|');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );

    key.split('|').forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [key]);

  return [activeId, setActiveId];
}
