import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useActiveViewport } from '../../hooks/useActiveViewport';

type Path = 0 | 1;
const STEP_MS = 500;
const TOTAL_STEPS = 5; // input, connector, master key, connector, files

const nodeBase =
  'block w-full text-left bg-white border rounded-xl px-4 py-3.5 transition-[border-color,box-shadow,transform] duration-[400ms]';
const nodeState = (lit: boolean) =>
  lit
    ? 'border-[#0F5C4D] shadow-[0_10px_26px_rgba(15,92,77,0.12)]'
    : 'border-[#CAD2CD]';

const Label: React.FC<{ children: string }> = ({ children }) => (
  <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4A5A54] mb-0.5">
    {children}
  </span>
);

const Connector: React.FC<{ lit: boolean; label: string; className: string }> = ({
  lit,
  label,
  className,
}) => (
  <div
    aria-hidden="true"
    className={`relative flex items-center justify-center h-14 md:h-[46px] transition-opacity duration-300 ${
      lit ? 'opacity-100' : 'opacity-35'
    } ${className}`}
  >
    <div className="dash-line" />
    <span className="relative bg-[#EDF0ED] px-1.5 py-0.5 rounded text-[11px] leading-tight text-[#4A5A54] text-center max-w-[calc(100%-6px)] max-md:absolute max-md:left-[calc(50%+12px)] max-md:top-1/2 max-md:-translate-y-1/2 max-md:text-left max-md:max-w-none max-md:px-0">
      {label}
    </span>
  </div>
);

/**
 * "How the keys work": pick password or recovery phrase and watch the chain
 * input -> Argon2id -> master key -> XChaCha20 -> encrypted files light up.
 */
export const KeysDiagram: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, active] = useActiveViewport<HTMLDivElement>(0.4);
  const [path, setPath] = useState<Path>(0);
  const [lit, setLit] = useState<number>(reduced ? TOTAL_STEPS : 0);
  const timers = useRef<number[]>([]);
  const played = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const play = useCallback(
    (p: Path) => {
      clearTimers();
      setPath(p);
      if (reduced) {
        setLit(TOTAL_STEPS);
        return;
      }
      setLit(0);
      for (let i = 1; i <= TOTAL_STEPS; i++) {
        timers.current.push(window.setTimeout(() => setLit(i), 250 + (i - 1) * STEP_MS));
      }
    },
    [reduced]
  );

  // Auto-play once when first scrolled into view.
  useEffect(() => {
    if (active && !played.current) {
      played.current = true;
      play(0);
    }
  }, [active, play]);

  useEffect(() => clearTimers, []);

  const inputLit = (p: Path) => path === p && lit >= 1;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(70px,104px)_minmax(0,1fr)_minmax(70px,104px)_minmax(0,1.1fr)] md:grid-rows-2 md:gap-y-3.5 items-center ${
        active ? '' : 'dash-paused'
      }`}
    >
      <button
        type="button"
        aria-pressed={path === 0}
        onClick={() => play(0)}
        className={`${nodeBase} ${nodeState(inputLit(0))} cursor-pointer hover:-translate-y-0.5 md:col-start-1 md:row-start-1`}
      >
        <Label>Unlock with</Label>
        <b className="block text-[15px] [overflow-wrap:anywhere]">Your password</b>
      </button>

      <Connector
        lit={path === 0 && lit >= 2}
        label="Argon2id"
        className="md:col-start-2 md:row-start-1"
      />

      <button
        type="button"
        aria-pressed={path === 1}
        onClick={() => play(1)}
        className={`${nodeBase} ${nodeState(inputLit(1))} cursor-pointer hover:-translate-y-0.5 md:col-start-1 md:row-start-2`}
      >
        <Label>Or unlock with</Label>
        <b className="block text-[15px] [overflow-wrap:anywhere]">24-word recovery phrase</b>
      </button>

      <Connector
        lit={path === 1 && lit >= 2}
        label="Same key"
        className="md:col-start-2 md:row-start-2"
      />

      <div className={`${nodeBase} ${nodeState(lit >= 3)} md:col-start-3 md:row-start-1 md:row-span-2 md:self-center`}>
        <Label>Random</Label>
        <b className="block text-[15px]">Master key</b>
      </div>

      <Connector
        lit={lit >= 4}
        label="XChaCha20-Poly1305"
        className="md:col-start-4 md:row-start-1 md:row-span-2"
      />

      <div className={`${nodeBase} ${nodeState(lit >= 5)} md:col-start-5 md:row-start-1 md:row-span-2 md:self-center`}>
        <Label>libsodium</Label>
        <b className="block text-[15px]">Your files, encrypted</b>
      </div>
    </div>
  );
};
