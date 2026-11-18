import React, { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useInView } from '../../hooks/useInView';
import { useTimers } from '../../hooks/useTimers';
import { DemoCard, DemoButton } from './DemoCard';

const ITEMS = [
  'Pick a folder on your PC',
  'Set a master password',
  'Save your 24-word recovery key',
  'Type it back',
];
const WORD_COUNT = 24;

/** Checklist ticks off while 24 recovery-word slots fill. Mock only: no real key is shown. */
export const CreateVaultDemo: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.5);
  const { seq } = useTimers();
  const [done, setDone] = useState<number>(reduced ? ITEMS.length : 0);
  const [filled, setFilled] = useState<number>(reduced ? WORD_COUNT : 0);

  const play = () => {
    setDone(0);
    setFilled(0);
    if (reduced) {
      setDone(ITEMS.length);
      setFilled(WORD_COUNT);
      return;
    }
    seq([
      [300, () => setDone(1)],
      [1000, () => setDone(2)],
      ...Array.from({ length: WORD_COUNT }, (_, i): [number, () => void] => [
        1700 + i * 55,
        () => setFilled(i + 1),
      ]),
      [3100, () => setDone(3)],
      [3900, () => setDone(4)],
    ]);
  };

  useEffect(() => {
    if (inView && !reduced) seq([[0, play]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced]);

  return (
    <DemoCard>
      <div ref={ref}>
        <ul className="list-none p-0 m-0">
          {ITEMS.map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-2.5 py-[7px] text-sm transition-colors duration-300 ${
                i < done ? 'text-[#14201C]' : 'text-[#4A5A54]'
              }`}
            >
              <i
                aria-hidden="true"
                className={`not-italic w-[22px] h-[22px] rounded-full border-2 grid place-items-center text-xs shrink-0 transition-all duration-300 ${
                  i < done
                    ? 'bg-[#0F5C4D] border-[#0F5C4D] text-white'
                    : 'border-[#D3DAD5] text-transparent'
                }`}
              >
                ✓
              </i>
              {label}
            </li>
          ))}
        </ul>
        <div aria-hidden="true" className="grid grid-cols-4 sm:grid-cols-6 gap-[5px] mt-3">
          {Array.from({ length: WORD_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-[26px] rounded-[5px] font-mono text-[10px] flex items-center gap-[5px] px-1.5 transition-colors duration-300 ${
                i < filled ? 'bg-[#D9EADF] text-[#0B4F40]' : 'bg-[#E4E9E5] text-[#4A5A54]'
              }`}
            >
              {i + 1}
              <b
                className={`block h-1.5 flex-1 rounded-[3px] bg-current transition-opacity duration-300 ${
                  i < filled ? 'opacity-55' : 'opacity-0'
                }`}
              />
            </span>
          ))}
        </div>
        <span className="sr-only">24 recovery key slots, hidden in this mock</span>
        <p className="text-xs text-[#4A5A54] mt-2.5">
          Mock only. Your real key is shown once, inside the app.
        </p>
        <div className="mt-3">
          <DemoButton variant="ghost" onClick={play}>
            ↻ Replay
          </DemoButton>
        </div>
      </div>
    </DemoCard>
  );
};
