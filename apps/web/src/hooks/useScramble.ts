import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const HEX = '0123456789abcdef';
const hex = (n: number) =>
  Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join('');

/**
 * Text that briefly scrambles (random object names) before settling on `final`.
 * run(target) starts the effect; with reduced motion it settles immediately.
 */
export function useScramble(initial: string): [string, (target: string) => void] {
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState(initial);
  const id = useRef<number | null>(null);

  const stop = () => {
    if (id.current !== null) clearInterval(id.current);
    id.current = null;
  };

  const run = useCallback(
    (target: string) => {
      stop();
      if (reduced) {
        setText(target);
        return;
      }
      let frame = 0;
      id.current = window.setInterval(() => {
        frame += 1;
        if (frame > 9) {
          stop();
          setText(target);
        } else {
          setText(`objects/${hex(4)}...${hex(2)}.bin`);
        }
      }, 60);
    },
    [reduced]
  );

  useEffect(() => stop, []);

  return [text, run];
}
