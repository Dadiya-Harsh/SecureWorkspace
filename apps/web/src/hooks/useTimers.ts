import { useCallback, useEffect, useRef } from 'react';

/** Schedule a sequence of [delayMs, fn] steps; a new sequence cancels the old one. Cleans up on unmount. */
export function useTimers() {
  const ids = useRef<number[]>([]);

  const clear = useCallback(() => {
    ids.current.forEach((id) => clearTimeout(id));
    ids.current = [];
  }, []);

  const seq = useCallback(
    (steps: Array<[number, () => void]>) => {
      clear();
      ids.current = steps.map(([ms, fn]) => window.setTimeout(fn, ms));
    },
    [clear]
  );

  useEffect(() => clear, [clear]);

  return { seq, clear };
}
