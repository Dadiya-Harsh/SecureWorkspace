import React, { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useActiveViewport } from '../../hooks/useActiveViewport';
import { useScramble } from '../../hooks/useScramble';

const OBJECT_NAME = 'objects/9f3a...c1.bin';
const STEP_MS = 3300;

const nodeClass = (i: number, step: number, reduced: boolean) =>
  `block w-full text-left bg-white border rounded-xl p-[18px] cursor-pointer transition-[border-color,transform,box-shadow] duration-[400ms] ${
    i === step
      ? `border-[#0F5C4D] shadow-[0_12px_30px_rgba(15,92,77,0.13)] ${reduced ? '' : '-translate-y-1.5'}`
      : i < step
        ? 'border-[#0F5C4D]'
        : 'border-[#CAD2CD]'
  }`;

const Kicker: React.FC<{ children: string }> = ({ children }) => (
  <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#4A5A54]">
    {children}
  </span>
);

const Connector: React.FC<{ on: boolean; label: string }> = ({ on, label }) => (
  <div
    aria-hidden="true"
    className={`relative flex items-center justify-center h-[76px] md:h-[100px] transition-opacity duration-300 ${
      on ? 'opacity-100' : 'opacity-35'
    }`}
  >
    <div className="dash-line md:top-[calc(50%-23px)]!" />
    <div className="dash-line max-md:hidden md:top-[calc(50%+23px)]!" />
    <span className="relative bg-[#EDF0ED] px-2 py-0.5 rounded-md text-[11px] leading-tight text-[#4A5A54] text-center max-w-[calc(100%-8px)] max-md:absolute max-md:left-[calc(50%+14px)] max-md:top-1/2 max-md:-translate-y-1/2 max-md:text-left max-md:max-w-none max-md:px-0">
      {label}
    </span>
  </div>
);

/** Your PC -> Google Drive -> Browser. Auto-advances; click a node to jump. */
export const OverviewFlow: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, active] = useActiveViewport<HTMLDivElement>(0.2);
  const [step, setStep] = useState(0);
  const [tick, setTick] = useState(0); // bumping restarts the interval
  const [objectText, runScramble] = useScramble(OBJECT_NAME);

  useEffect(() => {
    if (reduced || !active) return;
    const id = setInterval(() => {
      setStep((s) => {
        const n = (s + 1) % 3;
        if (n === 1) runScramble(OBJECT_NAME);
        return n;
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, [reduced, active, tick, runScramble]);

  const jump = (n: number) => {
    setStep(n);
    if (n === 1) runScramble(OBJECT_NAME);
    setTick((t) => t + 1);
  };

  const current = reduced ? 0 : step;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(76px,104px)_minmax(0,1fr)_minmax(76px,104px)_minmax(0,1fr)] items-center pt-2 ${
        active ? '' : 'dash-paused'
      }`}
    >
      <button
        type="button"
        onClick={() => jump(0)}
        aria-current={current === 0 ? 'step' : undefined}
        className={nodeClass(0, current, reduced)}
      >
        <Kicker>Your PC</Kicker>
        <b className="block mt-1.5 text-base [overflow-wrap:anywhere]">tax-return.xlsx</b>
        <small className="block text-[13px] text-[#4A5A54] mt-0.5">Readable only here</small>
      </button>

      <Connector on={current > 0} label="Locked on your PC" />

      <button
        type="button"
        onClick={() => jump(1)}
        aria-current={current === 1 ? 'step' : undefined}
        className={nodeClass(1, current, reduced)}
      >
        <Kicker>Your Google Drive</Kicker>
        <b className="block mt-1.5 font-mono text-[12.5px] [overflow-wrap:anywhere]">
          <span className="sr-only">{OBJECT_NAME}</span>
          <span aria-hidden="true">{objectText}</span>
        </b>
        <small className="block text-[13px] text-[#4A5A54] mt-0.5">Random-looking to Google</small>
      </button>

      <Connector on={current > 1} label="Unlocked in your browser" />

      <button
        type="button"
        onClick={() => jump(2)}
        aria-current={current === 2 ? 'step' : undefined}
        className={nodeClass(2, current, reduced)}
      >
        <Kicker>Browser tab</Kicker>
        <b className="block mt-1.5 text-base">Read-only view</b>
        <small className="block text-[13px] text-[#4A5A54] mt-0.5">Gone when you lock</small>
      </button>
    </div>
  );
};
