import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useInView } from '../../hooks/useInView';
import { useTimers } from '../../hooks/useTimers';
import { useScramble } from '../../hooks/useScramble';
import { DemoCard, DemoButton } from './DemoCard';

const OBJECTS: Array<[string, string]> = [
  ['9f3a', 'c1'],
  ['b71d', '44'],
  ['04ce', 'a9'],
  ['e2a8', '7f'],
];

const Label: React.FC<{ children: string }> = ({ children }) => (
  <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4A5A54]">
    {children}
  </span>
);

/** A dot travels PC -> Drive, the object name scrambles then settles, and version pills pile up. */
export const PushDemo: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.5);
  const { seq } = useTimers();
  const [objectText, runScramble] = useScramble('—');
  const [srText, setSrText] = useState('Nothing pushed yet');
  const [count, setCount] = useState(0);
  const [dotKey, setDotKey] = useState(0);
  const [dist, setDist] = useState(80);
  const lineRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const countRef = useRef(0);

  const push = () => {
    if (busy.current) return;
    busy.current = true;
    const next = countRef.current >= 4 ? 1 : countRef.current + 1;
    countRef.current = next;
    const [a, b] = OBJECTS[next - 1];
    const name = `objects/${a}...${b}.bin`;

    const settle = () => {
      runScramble(name);
      setSrText(name);
      setCount(next);
    };

    if (reduced) {
      settle();
      busy.current = false;
      return;
    }
    setDist((lineRef.current?.clientWidth ?? 90) - 10);
    setDotKey((k) => k + 1);
    seq([
      [900, settle],
      [
        1600,
        () => {
          busy.current = false;
        },
      ],
    ]);
  };

  useEffect(() => {
    if (inView) seq([[0, push]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <DemoCard>
      <div ref={ref}>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(36px,0.45fr)_minmax(0,1fr)] items-center gap-2">
          <div className="border border-[#CAD2CD] rounded-[10px] p-3 bg-[#F8FAF8] min-h-[74px]">
            <Label>Your PC</Label>
            <b className="block mt-1 text-sm [overflow-wrap:anywhere]">tax-return.xlsx</b>
          </div>
          <div ref={lineRef} aria-hidden="true" className="relative h-5">
            <div className="absolute inset-x-0 top-[9px] border-t-2 border-dashed border-[#B9C5BE]" />
            {dotKey > 0 && (
              <div
                key={dotKey}
                className="absolute left-0 top-[5px] w-2.5 h-2.5 rounded-full bg-[#0F5C4D] animate-travel"
                style={{ ['--dist' as string]: `${dist}px` }}
              />
            )}
          </div>
          <div className="border border-[#CAD2CD] rounded-[10px] p-3 bg-[#F8FAF8] min-h-[74px]">
            <Label>Your Google Drive</Label>
            <b className="block mt-1 font-mono text-xs [overflow-wrap:anywhere]">
              <span className="sr-only">{srText}</span>
              <span aria-hidden="true">{objectText}</span>
            </b>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex flex-wrap gap-1.5 min-h-[26px]" role="status" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
              <span
                key={`${count}-${i}`}
                className={`animate-pop inline-flex items-center px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap ${
                  i === count - 1 ? 'bg-[#D9EADF] text-[#0B4F40]' : 'bg-[#DCE2DE] text-[#2F3C37]'
                }`}
              >
                v{i + 1}
              </span>
            ))}
          </div>
          <DemoButton onClick={push}>Push to your Drive</DemoButton>
        </div>
      </div>
    </DemoCard>
  );
};
