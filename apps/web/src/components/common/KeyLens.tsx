import React, { useRef, useState, useEffect } from 'react';
import { SAMPLE_FILES, type FileCardData } from './fileCardData';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface KeyLensProps {
  files?: FileCardData[];
  className?: string;
  heading?: string;
  lead?: string;
}

const DEFAULT_EXTENDED_FILES: FileCardData[] = [
  ...SAMPLE_FILES,
  {
    name: 'Resume_2026.pdf',
    color: '#D8E6F0',
    kind: 'doc',
    tag: 'PDF',
    hash: '5be1…20.bin',
    size: '140 KB',
  },
  {
    name: 'Bank_statement.csv',
    color: '#E6DDF2',
    kind: 'doc',
    tag: 'CSV',
    hash: 'c903…7f.bin',
    size: '22 KB',
  },
];

export const KeyLens: React.FC<KeyLensProps> = ({
  files = DEFAULT_EXTENDED_FILES,
  className = '',
  heading,
  lead,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plainLayerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [isUserActive, setIsUserActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 200, y: 150 });
  const [radius, setRadius] = useState(90);

  // Update lens visual position and clip path
  const setLens = (x: number, y: number, rad: number) => {
    setLensPos({ x, y });
    setRadius(rad);

    if (plainLayerRef.current && containerRef.current) {
      const lay = plainLayerRef.current.getBoundingClientRect();
      const dr = containerRef.current.getBoundingClientRect();
      const cx = x - (lay.left - dr.left);
      const cy = y - (lay.top - dr.top);
      plainLayerRef.current.style.setProperty('--x', `${cx}px`);
      plainLayerRef.current.style.setProperty('--y', `${cy}px`);
      plainLayerRef.current.style.setProperty('--r', `${rad}px`);
      plainLayerRef.current.style.clipPath = `circle(${rad}px at ${cx}px ${cy}px)`;
    }

    if (ringRef.current) {
      ringRef.current.style.transform = `translate(${x}px, ${y}px)`;
      ringRef.current.style.opacity = rad > 0 ? '1' : '0';
    }
  };

  // Pointer event handlers with touch-action: pan-y (doesn't block vertical scrolling)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setIsUserActive(true);
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLens(x, y, 90);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setIsUserActive(true);
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLens(x, y, 90);
  };

  const handlePointerLeave = () => {
    setIsUserActive(false);
  };

  // Idle drift animation loop: slow oval (~30% of width by 22% of height, ~9s lap)
  useEffect(() => {
    let animId: number;
    let tick = 0;

    const loop = () => {
      if (!isUserActive && containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;

        if (reducedMotion) {
          // Park in the middle with reduced motion
          setLens(w / 2, h / 2, 90);
        } else if (!document.hidden) {
          tick++;
          const angle = tick / 90; // ~9s lap at 60fps
          const x = w / 2 + Math.cos(angle) * w * 0.3;
          const y = h / 2 + 20 + Math.sin(angle * 1.3) * h * 0.22;
          setLens(x, y, 90);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isUserActive, reducedMotion]);

  // Initial layout sizing
  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      setLens(w / 2, h / 2, 90);
    }
  }, []);

  return (
    <div className={`key-lens-container ${className}`}>
      {heading && (
        <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] text-balance">
          {heading}
        </h2>
      )}
      {lead && (
        <p className="text-[17px] text-[#4A5A54] mt-[10px] max-w-[620px]">
          {lead}
        </p>
      )}

      {/* Frame: hides cursor, touch-action: pan-y */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
        className="relative mt-9 bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl shadow-[0_24px_60px_rgba(15,29,25,.12)] overflow-hidden select-none"
        style={{
          cursor: 'none',
          touchAction: 'pan-y',
        }}
        tabIndex={0}
        role="region"
        aria-label="Interactive vault lens. Move pointer or finger over tiles to reveal files with your key."
      >
        {/* Top Drive Bar */}
        <div className="flex items-center gap-[10px] px-[18px] py-[14px] border-b border-[#D3DAD5] text-[14px] text-[#4A5A54]">
          <b className="text-[#14201C] font-bold">My Drive</b> › SecureWorkspace ›
          objects
        </div>

        {/* Stacked Layers */}
        <div className="relative">
          {/* Bottom Layer: Dark Sealed Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3.5 sm:p-[22px]">
            {files.map((f, i) => (
              <div
                key={`cipher-${i}`}
                className="rounded-xl p-3 sm:p-[14px] min-h-[110px] sm:min-h-[118px] flex flex-col justify-between"
                style={{
                  backgroundColor: '#2B3833',
                  color: '#6FD0B8',
                }}
              >
                <span className="mono text-xs sm:text-[13px] font-medium break-all">
                  {f.hash}
                </span>
                <small className="text-[#9DB2AA] text-[11px] sm:text-[12px]">
                  sealed · {f.size}
                </small>
              </div>
            ))}
          </div>

          {/* Top Layer: Readable Tiles (Clipped with Circle) */}
          <div
            ref={plainLayerRef}
            className="absolute inset-0 bg-[#F8FAF8] pointer-events-none"
            style={{
              clipPath: `circle(${radius}px at ${lensPos.x}px ${lensPos.y}px)`,
              WebkitClipPath: `circle(${radius}px at ${lensPos.x}px ${lensPos.y}px)`,
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3.5 sm:p-[22px]">
              {files.map((f, i) => {
                const tileBg =
                  f.kind === 'pass'
                    ? '#D8E6F0'
                    : f.kind === 'photo'
                    ? '#CFE7F3'
                    : f.color;
                return (
                  <div
                    key={`plain-${i}`}
                    className="rounded-xl p-3 sm:p-[14px] min-h-[110px] sm:min-h-[118px] flex flex-col justify-between text-[#14201C]"
                    style={{ backgroundColor: tileBg }}
                  >
                    <b className="text-[13px] sm:text-[14px] font-bold leading-[1.25] truncate">
                      {f.name}
                    </b>
                    <small className="text-[11px] sm:text-[12px] opacity-75">
                      {f.size} · readable with your key
                    </small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* The 180px Ring with "your key" Pill */}
        <div
          ref={ringRef}
          className="absolute left-0 top-0 w-[180px] h-[180px] pointer-events-none z-10 transition-opacity duration-200"
          style={{
            margin: '-90px 0 0 -90px',
            borderRadius: '50%',
            border: '3px solid #0F5C4D',
            boxShadow:
              '0 0 0 6px rgba(15, 92, 77, 0.18), 0 18px 40px rgba(15,29,25,.25)',
            transform: `translate(${lensPos.x}px, ${lensPos.y}px)`,
          }}
          aria-hidden="true"
        >
          <em
            className="absolute font-semibold text-[12px] text-white bg-[#0F5C4D] px-[10px] py-[4px] rounded-full whitespace-nowrap not-italic"
            style={{
              bottom: '-34px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Hanken Grotesk', sans-serif",
            }}
          >
            your key
          </em>
        </div>
      </div>

      {/* Accessible Static Twin for Screen Readers */}
      <div className="sr-only">
        <h3>Encrypted Files vs Decrypted View</h3>
        <p>
          Without your key, Google Drive sees only random ciphertext hashes. With
          your key lens, each file's real name and contents are revealed:
        </p>
        <ul>
          {files.map((f, i) => (
            <li key={`sr-${i}`}>
              {f.name} (sealed hash: {f.hash}, size: {f.size})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
