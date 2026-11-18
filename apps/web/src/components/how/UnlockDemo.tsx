import React, { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useInView } from '../../hooks/useInView';
import { useTimers } from '../../hooks/useTimers';
import { DemoCard, DemoButton } from './DemoCard';

const DOTS = 8;

/** Password dots fill, then the mock browser card opens. Button toggles Unlock / Lock. */
export const UnlockDemo: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>(0.5);
  const { seq, clear } = useTimers();
  const [filled, setFilled] = useState<number>(reduced ? DOTS : 0);
  const [open, setOpen] = useState<boolean>(reduced);
  const host = typeof window !== 'undefined' ? window.location.host : '';

  const lock = () => {
    setOpen(false);
    setFilled(0);
  };

  const play = () => {
    lock();
    if (reduced) {
      setFilled(DOTS);
      setOpen(true);
      return;
    }
    seq([
      ...Array.from({ length: DOTS }, (_, i): [number, () => void] => [
        300 + i * 130,
        () => setFilled(i + 1),
      ]),
      [300 + DOTS * 130 + 400, () => setOpen(true)],
    ]);
  };

  useEffect(() => {
    if (inView && !reduced) seq([[0, play]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced]);

  const toggle = () => {
    clear();
    if (open) lock();
    else play();
  };

  const screen = (visible: boolean) =>
    `absolute inset-0 p-[18px] transition-[opacity,transform,visibility] duration-[400ms] ${
      visible ? 'opacity-100 translate-y-0 visible' : 'opacity-0 invisible'
    }`;

  return (
    <DemoCard>
      <div ref={ref}>
        <div className="border border-[#CAD2CD] rounded-[10px] overflow-hidden bg-white">
          <div className="flex items-center gap-1.5 px-2.5 py-2 bg-[#EEF1EE] border-b border-[#D3DAD5]">
            <i className="w-[9px] h-[9px] rounded-full bg-[#C5CEC8]" />
            <i className="w-[9px] h-[9px] rounded-full bg-[#C5CEC8]" />
            <i className="w-[9px] h-[9px] rounded-full bg-[#C5CEC8]" />
            <div className="flex-1 ml-2 bg-white rounded-md px-2.5 py-[3px] text-[11px] text-[#4A5A54] truncate">
              {host}
            </div>
          </div>
          <div className="relative h-[172px]">
            <div className={`${screen(!open)} ${open ? '-translate-y-2' : ''}`}>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4A5A54]">
                Master password
              </span>
              <div aria-hidden="true" className="flex gap-[7px] my-2">
                {Array.from({ length: DOTS }, (_, i) => (
                  <i
                    key={i}
                    className={`w-[13px] h-[13px] rounded-full border-2 transition-colors duration-200 ${
                      i < filled ? 'bg-[#14201C] border-[#14201C]' : 'border-[#B9C5BE]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[13px] text-[#4A5A54]">
                Your browser decrypts the file. Nothing is sent to us.
              </p>
            </div>
            <div className={`${screen(open)} ${open ? '' : 'translate-y-2'}`}>
              <div className="flex items-center gap-2.5">
                <b>tax-return.xlsx</b>
                <span className="inline-flex px-2.5 py-1 rounded text-xs font-bold bg-[#D8E6F0] text-[#1F4B6B]">
                  Read-only
                </span>
              </div>
              <p className="text-[13px] text-[#4A5A54] mt-2 mb-3.5">
                Changes are made in the desktop app.
              </p>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="min-h-[36px] px-4 rounded-lg text-sm font-semibold bg-[#F8FAF8] border border-[#B9C5BE] text-[#14201C] opacity-55 cursor-not-allowed"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <span className="text-[13px] text-[#4A5A54]" role="status" aria-live="polite">
            {open ? 'Unlocked in your browser' : 'Locked'}
          </span>
          <DemoButton onClick={toggle}>{open ? 'Lock' : 'Unlock'}</DemoButton>
        </div>
      </div>
    </DemoCard>
  );
};
