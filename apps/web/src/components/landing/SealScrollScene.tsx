import React, { useRef, useEffect, useState } from 'react';
import { SAMPLE_FILES } from '../common/fileCardData';
import { FileCard } from '../common/FileCard';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const sstep = (a: number, b: number, t: number) => {
  t = clamp((t - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const CAPS = [
  [
    'Your files. Readable on your PC.',
    'Keep scrolling to send them to Google Drive.',
  ],
  [
    'Each file is sealed before it leaves your PC.',
    'Encrypted locally. The name, contents and type all disappear.',
  ],
  [
    'Google Drive only gets sealed boxes.',
    'Same look, random names. Nothing to read, scan or train on.',
  ],
];

const QR = [-6, 4, -3, 5, -4, 3];

export const SealScrollScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<SVGSVGElement>(null);
  const lockShackleRef = useRef<SVGPathElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cardElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [capStep, setCapStep] = useState(0);
  const [cardAngles, setCardAngles] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let animId: number;

    const onScrollOrResize = () => {
      if (!containerRef.current || !stageRef.current) return;

      const r = containerRef.current.getBoundingClientRect();
      const tot = containerRef.current.offsetHeight - window.innerHeight;
      const p = clamp(-r.top / Math.max(1, tot));

      const W = stageRef.current.clientWidth;
      const Hh = stageRef.current.clientHeight;
      const isMobile = W <= 640;
      const k = isMobile ? Math.min(1, Math.max(0.44, W / 800)) : Math.min(1, Math.max(0.5, W / 1000));
      const cw = 150 * k;
      const ch = 108 * k;
      const cy = Hh * (isMobile ? 0.60 : 0.58);

      const qx = isMobile ? W * 0.18 : W * 0.14;
      const lx = W * 0.5;
      const tx = isMobile ? W * 0.82 : W * 0.84;
      const gap = Math.min(62, Hh * 0.08) * k;

      if (lockRef.current) {
        lockRef.current.style.left = `${lx}px`;
        lockRef.current.style.top = `${cy}px`;
        lockRef.current.style.width = `${112 * k}px`;
        lockRef.current.style.height = `${132 * k}px`;
      }

      if (trayRef.current) {
        trayRef.current.style.left = `${tx}px`;
        trayRef.current.style.top = `${cy}px`;
        trayRef.current.style.width = `${cw * (isMobile ? 1.5 : 1.75)}px`;
        trayRef.current.style.height = `${ch * (isMobile ? 2.5 : 2.75)}px`;
      }

      if (queueRef.current) {
        queueRef.current.style.left = `${qx - cw / 2}px`;
        queueRef.current.style.top = `${cy - gap * 2.5 - ch / 2 - 6}px`;
      }

      let lockActive = false;
      const nextAngles: number[] = [];

      SAMPLE_FILES.forEach((_, i) => {
        const el = cardElementsRef.current[i];
        if (!el) return;

        let t = clamp((p - 0.1 - i * 0.1) / 0.3);
        if (reduced) {
          t = 1; // Finished state for reduced motion
        }

        let x: number, y: number, rot: number, s: number;
        const qy = cy + (i - 2.5) * gap;
        const col = i % 2;
        const row = Math.floor(i / 2);
        const ty = cy + (row - 1) * ch * 0.85;
        const txx = tx + (col - 0.5) * cw * 0.8;

        if (t < 0.5) {
          const u = ease(t / 0.5);
          x = lerp(qx, lx, u);
          y = lerp(qy, cy, u);
          rot = lerp(QR[i], 0, u);
          s = lerp(1, 0.8, u);
        } else {
          const u = ease((t - 0.5) / 0.5);
          x = lerp(lx, txx, u);
          y = lerp(cy, ty, u);
          rot = 0;
          s = lerp(0.8, 0.72, u);
        }

        if (t > 0.35 && t < 0.65) {
          lockActive = true;
        }

        const fl = reduced ? 180 : sstep(0.44, 0.56, t) * 180;
        nextAngles.push(fl);

        el.style.zIndex = t > 0 && t < 1 ? '6' : t >= 1 ? '2' : `${1 + i}`;
        el.style.transform = `translate(${x - 75}px, ${y - 54}px) rotate(${rot}deg) scale(${s * k})`;
      });

      setCardAngles(nextAngles);

      if (lockRef.current && lockShackleRef.current) {
        if (lockActive && !reduced) {
          lockRef.current.style.filter = 'drop-shadow(0 0 22px rgba(111,208,184,.9))';
          lockShackleRef.current.style.transform = 'translateY(8px)';
        } else {
          lockRef.current.style.filter = 'none';
          lockShackleRef.current.style.transform = 'none';
        }
      }

      if (progressRef.current) {
        progressRef.current.style.width = `${p * 100}%`;
      }

      const st = p < 0.12 ? 0 : p < 0.88 ? 1 : 2;
      setCapStep(st);
    };

    const loop = () => {
      onScrollOrResize();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [reduced]);

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: '420vh' }}
      data-a="Locking"
      data-b="Encrypted before it leaves your PC."
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-screen overflow-hidden select-none"
        style={{ perspective: '1100px' }}
      >
        {/* Dynamic Headings */}
        <div className="absolute inset-x-0 top-[92px] text-center px-4 z-10">
          <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
            {CAPS[capStep][0]}
          </h2>
          <p className="text-[#4A5A54] mt-2 text-[17px]">
            {CAPS[capStep][1]}
          </p>
        </div>

        {/* Queue Box: On your PC */}
        <div
          ref={queueRef}
          className="absolute z-0 pointer-events-none"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <span className="absolute -top-[30px] left-0 text-[13px] font-semibold text-[#4A5A54] whitespace-nowrap">
            On your PC
          </span>
        </div>

        {/* Central Lock */}
        <svg
          ref={lockRef}
          viewBox="0 0 112 132"
          className="absolute z-10 transition-[filter] duration-250 pointer-events-none"
          style={{
            transform: 'translate(-50%, -50%)',
            width: '112px',
            height: '132px',
          }}
          aria-hidden="true"
        >
          <path
            ref={lockShackleRef}
            d="M30 58 V40 a26 26 0 0 1 52 0 V58"
            fill="none"
            stroke="#0F5C4D"
            strokeWidth="12"
            strokeLinecap="round"
            className="transition-transform duration-350"
          />
          <rect x="10" y="56" width="92" height="72" rx="16" fill="#0F5C4D" />
          <rect x="10" y="56" width="92" height="10" rx="5" fill="#1E8F78" />
          <circle cx="56" cy="88" r="9" fill="#EDF0ED" />
          <path d="M52 92 L49 112 H63 L60 92 Z" fill="#EDF0ED" />
        </svg>

        {/* Tray Box: Your Google Drive */}
        <div
          ref={trayRef}
          className="absolute border-2 border-dashed border-[#D3DAD5] rounded-2xl z-0 pointer-events-none"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <span className="absolute -top-[30px] left-0 text-[13px] font-semibold text-[#4A5A54] whitespace-nowrap">
            Your Google Drive
          </span>
        </div>

        {/* 6 Traveling 3D Animated File Cards */}
        {SAMPLE_FILES.map((file, i) => (
          <div
            key={file.name}
            ref={(el) => {
              cardElementsRef.current[i] = el;
            }}
            className="absolute left-0 top-0 pointer-events-none"
            style={{
              width: '150px',
              height: '108px',
              willChange: 'transform',
            }}
          >
            <FileCard file={file} flipAngle={cardAngles[i] ?? 0} />
          </div>
        ))}

        {/* Scroll Progress Bar at Bottom */}
        <div className="absolute left-1/2 bottom-[34px] -translate-x-1/2 w-[min(320px,60vw)] h-1 rounded-full bg-[#D3DAD5] overflow-hidden">
          <div
            ref={progressRef}
            className="h-full bg-[#0F5C4D] transition-all duration-75"
            style={{ width: '0%' }}
          />
        </div>
      </div>

      {/* Screen reader static twin */}
      <div className="sr-only">
        <h3>File Sealing Process</h3>
        <p>
          As files are pushed, they move from your PC through the client-side encryption lock.
          Before entering Google Drive, their names, types, and plaintext contents are fully
          transformed into encrypted ciphertext objects with random hashes.
        </p>
      </div>
    </section>
  );
};
