import React, { useRef, useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const VERSIONS = [10, 11, 12, 13, 14];

export const VersionsScrollScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [upIndex, setUpIndex] = useState<number>(-1);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let animId: number;

    const onScrollOrResize = () => {
      if (!containerRef.current || !stageRef.current) return;

      const r = containerRef.current.getBoundingClientRect();
      const tot = containerRef.current.offsetHeight - window.innerHeight;
      const rawP = clamp(-r.top / Math.max(1, tot) * 1.4);
      const p = reduced ? 1 : ease(rawP);

      const W = stageRef.current.clientWidth;
      const isMobile = W <= 640;
      const k = isMobile ? Math.min(1, Math.max(0.48, W / 750)) : Math.min(1, Math.max(0.55, W / 1000));
      const spread = isMobile ? Math.min(62, W * 0.15) : 170 * k;

      VERSIONS.forEach((_, i) => {
        const b = sheetRefs.current[i];
        if (!b) return;

        const o = i - 2;
        const lift = upIndex === i;

        b.style.zIndex = lift ? '20' : `${i}`;
        const x = o * spread * p;
        const y = Math.abs(o) * (isMobile ? 14 : 22) * p + (lift ? -40 : 0);
        const rot = o * (isMobile ? 6 : 9) * p + (1 - p) * (o * 1.5);
        const scale = k * (lift ? 1.06 : 1);

        b.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
      });
    };

    const loop = () => {
      onScrollOrResize();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [upIndex, reduced]);

  const toggleLift = (i: number) => {
    setUpIndex((prev) => (prev === i ? -1 : i));
  };

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: '260vh' }}
      data-a="Versions"
      data-b="Every push is a numbered version."
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-screen overflow-hidden select-none"
      >
        {/* Caption */}
        <div className="absolute inset-x-0 top-[92px] text-center px-4 z-10 pointer-events-none">
          <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
            Every push is a version you can go back to.
          </h2>
          <p className="text-[#4A5A54] mt-2 text-[17px]">
            Scroll to fan them out. Click one to pull it forward.
          </p>
        </div>

        {/* 5 Version Sheets */}
        <div className="absolute inset-0">
          {VERSIONS.map((v, i) => {
            const isLifted = upIndex === i;
            return (
              <button
                key={v}
                ref={(el) => {
                  sheetRefs.current[i] = el;
                }}
                type="button"
                onClick={() => toggleLift(i)}
                aria-label={`Version 00${v}`}
                className={`absolute left-1/2 top-[55%] w-[240px] h-[300px] -ml-[120px] -mt-[150px] bg-[#F8FAF8] border border-[#D3DAD5] rounded-xl p-5 text-left cursor-pointer transition-shadow duration-200 select-none ${
                  isLifted
                    ? 'shadow-[0_30px_60px_rgba(15,29,25,.3)] ring-2 ring-[#0F5C4D]'
                    : 'shadow-[0_14px_34px_rgba(15,29,25,.16)] hover:shadow-[0_20px_40px_rgba(15,29,25,.22)]'
                }`}
              >
                <b className="text-xl font-bold text-[#14201C] block">
                  Version 00{v}
                </b>
                <span className="text-[13px] text-[#4A5A54] block mt-0.5">
                  {i === 4 ? 'Latest push' : `Push #${v}`}
                </span>

                <div
                  className="h-[6px] rounded-[3px] bg-[#D3DAD5] mt-4"
                  style={{ width: '90%' }}
                />
                <div
                  className="h-[6px] rounded-[3px] bg-[#D3DAD5] mt-2.5"
                  style={{ width: '70%' }}
                />
                <div
                  className="h-[6px] rounded-[3px] bg-[#D3DAD5] mt-2.5"
                  style={{ width: '82%' }}
                />
                <div
                  className="h-[6px] rounded-[3px] bg-[#D3DAD5] mt-2.5"
                  style={{ width: '55%' }}
                />

                <span
                  className="absolute right-4 bottom-4 font-mono text-xs font-semibold text-[#0F5C4D] border-2 border-[#0F5C4D] rounded-md px-2 py-0.5"
                  style={{ transform: 'rotate(-8deg)' }}
                >
                  #00{v}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
