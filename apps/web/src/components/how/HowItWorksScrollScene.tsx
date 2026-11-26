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

const HW_CAPS = [
  ['Locked on your PC', 'tax-return.xlsx is readable only here.'],
  [
    'Stored in your Drive',
    'Random-looking to Google. Each push is a numbered version.',
  ],
  ['Unlocked in your browser tab', 'Read-only. Gone when you lock.'],
];

export const HowItWorksScrollScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progRef = useRef<HTMLDivElement>(null);

  const [activeStation, setActiveStation] = useState(0);
  const [flipAngle, setFlipAngle] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let animId: number;

    const onScrollOrResize = () => {
      if (!containerRef.current || !stageRef.current || !cardRef.current) return;

      const r = containerRef.current.getBoundingClientRect();
      const tot = containerRef.current.offsetHeight - window.innerHeight;
      const rawP = clamp(-r.top / Math.max(1, tot));
      const p = reduced ? 1 : rawP;

      const sr = stageRef.current.getBoundingClientRect();
      const isCol = window.innerWidth <= 700;

      const coords = boxRefs.current.map((b) => {
        if (!b) return { x: 0, y: 0 };
        const q = b.getBoundingClientRect();
        return isCol
          ? {
              x: q.right - q.left > 0 ? q.right - sr.left - 58 : 0,
              y: q.top - sr.top + q.height / 2,
            }
          : {
              x: q.left - sr.left + q.width / 2,
              y: q.top - sr.top + q.height / 2 - 8,
            };
      });

      const firstBox = boxRefs.current[0];
      const s = isCol
        ? 0.55
        : clamp((firstBox ? firstBox.offsetWidth : 200) / 200, 0.6, 0.95);

      const a = ease(clamp((p - 0.1) / 0.3));
      const b = ease(clamp((p - 0.55) / 0.3));

      const c0 = coords[0] || { x: 0, y: 0 };
      const c1 = coords[1] || { x: 0, y: 0 };
      const c2 = coords[2] || { x: 0, y: 0 };

      const x =
        lerp(lerp(c0.x, c1.x, a), c2.x, b);
      const y =
        lerp(lerp(c0.y, c1.y, a), c2.y, b) -
        (reduced ? 0 : Math.sin(Math.PI * a) * 28 + Math.sin(Math.PI * b) * 28);

      const fl = reduced ? 360 : sstep(0.22, 0.34, p) * 180 + sstep(0.66, 0.78, p) * 180;
      setFlipAngle(fl);

      cardRef.current.style.transform = `translate(${x - 75}px, ${y - 54}px) scale(${s})`;

      const act = p < 0.25 ? 0 : p < 0.62 ? 1 : 2;
      setActiveStation(act);

      if (progRef.current) {
        progRef.current.style.width = `${p * 100}%`;
      }
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
      style={{ height: '300vh' }}
      data-a="Follow one file"
      data-b="PC, then Drive, then browser."
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-screen overflow-hidden select-none"
        style={{ perspective: '1100px' }}
      >
        {/* Dynamic Caption */}
        <div className="absolute inset-x-0 top-[92px] text-center px-4 z-10 pointer-events-none">
          <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
            {HW_CAPS[activeStation][0]}
          </h2>
          <p className="text-[#4A5A54] mt-2 text-[17px]">
            {HW_CAPS[activeStation][1]}
          </p>
        </div>

        {/* 3 Stations with Dashed Connection */}
        <div
          className="absolute left-1/2 top-[62%] sm:top-[60%] -translate-x-1/2 -translate-y-1/2 w-[min(1000px,92vw)] flex flex-col sm:flex-row gap-3.5 sm:gap-[clamp(24px,8vw,90px)] items-stretch justify-between"
        >
          {/* Dashed rail (desktop) */}
          <div
            className="hidden sm:block absolute left-[8%] right-[8%] top-1/2 border-t-2 border-dashed border-[#D3DAD5] pointer-events-none"
            style={{ zIndex: 0 }}
          />

          {/* Station 1: Your PC */}
          <div
            ref={(el) => {
              boxRefs.current[0] = el;
            }}
            className={`relative z-10 flex-1 min-h-[105px] sm:min-h-[240px] pr-[46%] sm:pr-4 bg-[#F8FAF8] border rounded-xl p-4 flex flex-col justify-between transition-all duration-250 ${
              activeStation === 0
                ? 'border-[#0F5C4D] shadow-[0_0_0_3px_rgba(111,208,184,.55)]'
                : 'border-[#D3DAD5]'
            }`}
          >
            <span className="text-xs font-bold text-[#4A5A54]">YOUR PC</span>
            <div>
              <div className="font-bold text-[#14201C] text-sm sm:text-base">tax-return.xlsx</div>
              <div className="text-xs sm:text-sm text-[#4A5A54] mt-0.5">
                Readable only here
              </div>
            </div>
          </div>

          {/* Station 2: Google Drive */}
          <div
            ref={(el) => {
              boxRefs.current[1] = el;
            }}
            className={`relative z-10 flex-1 min-h-[105px] sm:min-h-[240px] pr-[46%] sm:pr-4 bg-[#F8FAF8] border rounded-xl p-4 flex flex-col justify-between transition-all duration-250 ${
              activeStation === 1
                ? 'border-[#0F5C4D] shadow-[0_0_0_3px_rgba(111,208,184,.55)]'
                : 'border-[#D3DAD5]'
            }`}
          >
            <span className="text-xs font-bold text-[#4A5A54]">
              YOUR GOOGLE DRIVE
            </span>
            <div>
              <div className="font-bold text-[#14201C] mono text-xs sm:text-sm truncate">
                objects/9f3a…c1.bin
              </div>
              <div className="text-xs sm:text-sm text-[#4A5A54] mt-0.5">
                Random-looking to Google
              </div>
            </div>
          </div>

          {/* Station 3: Browser Tab */}
          <div
            ref={(el) => {
              boxRefs.current[2] = el;
            }}
            className={`relative z-10 flex-1 min-h-[105px] sm:min-h-[240px] pr-[46%] sm:pr-4 bg-[#F8FAF8] border rounded-xl p-4 flex flex-col justify-between transition-all duration-250 ${
              activeStation === 2
                ? 'border-[#0F5C4D] shadow-[0_0_0_3px_rgba(111,208,184,.55)]'
                : 'border-[#D3DAD5]'
            }`}
          >
            <span className="text-xs font-bold text-[#4A5A54]">
              BROWSER TAB
            </span>
            <div>
              <div className="font-bold text-[#14201C] text-sm sm:text-base">Read-only view</div>
              <div className="text-xs sm:text-sm text-[#4A5A54] mt-0.5">
                Gone when you lock
              </div>
            </div>
          </div>
        </div>

        {/* The 3D Traveling File Card */}
        <div
          ref={cardRef}
          className="absolute left-0 top-0 pointer-events-none z-20"
          style={{ width: '150px', height: '108px', willChange: 'transform' }}
        >
          <FileCard file={SAMPLE_FILES[0]} flipAngle={flipAngle} />
        </div>

        {/* Progress bar */}
        <div className="absolute left-1/2 bottom-[34px] -translate-x-1/2 w-[min(320px,60vw)] h-1 rounded-full bg-[#D3DAD5] overflow-hidden">
          <div
            ref={progRef}
            className="h-full bg-[#0F5C4D] transition-all duration-75"
            style={{ width: '0%' }}
          />
        </div>
      </div>
    </section>
  );
};
