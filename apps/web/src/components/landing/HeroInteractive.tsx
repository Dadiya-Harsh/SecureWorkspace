import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_FILES, type FileCardData } from '../common/fileCardData';
import { FileCard } from '../common/FileCard';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface SpotCard {
  file: FileCardData;
  sx: number;
  sy: number;
  r: number;
  d: number;
  dx: number;
  dy: number;
  isDragging: boolean;
  currentRot: number;
}

const SPOTS: [number, number, number, number][] = [
  [0.12, 0.24, -8, 0.6],
  [0.84, 0.2, 7, 1.0],
  [0.08, 0.7, 5, 0.8],
  [0.9, 0.66, -6, 0.5],
  [0.28, 0.86, -3, 0.9],
  [0.72, 0.88, 4, 0.7],
];

export const HeroInteractive: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const [cards, setCards] = useState<SpotCard[]>(() =>
    SAMPLE_FILES.map((file, i) => ({
      file,
      sx: SPOTS[i][0],
      sy: SPOTS[i][1],
      r: SPOTS[i][2],
      d: SPOTS[i][3],
      dx: 0,
      dy: 0,
      isDragging: false,
      currentRot: SPOTS[i][2],
    }))
  );

  const mouseRef = useRef({ mx: 0, my: 0 });
  const cardsRef = useRef<SpotCard[]>(cards);
  cardsRef.current = cards;

  // Track pointermove over hero for parallax tilt
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    mouseRef.current = {
      mx: (e.clientX - r.left) / r.width - 0.5,
      my: (e.clientY - r.top) / r.height - 0.5,
    };
  };

  // Card dragging handlers with setPointerCapture
  const handleCardPointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const initialCard = cardsRef.current[index];
    const startX = e.clientX - initialCard.dx;
    const startY = e.clientY - initialCard.dy;

    setCards((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, isDragging: true, currentRot: 0 } : c
      )
    );

    const onPointerMove = (ev: PointerEvent) => {
      const newDx = ev.clientX - startX;
      const newDy = ev.clientY - startY;
      setCards((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, dx: newDx, dy: newDy } : c
        )
      );
    };

    const onPointerUp = (ev: PointerEvent) => {
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        // pointer capture already lost
      }
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);

      const randomRot = Math.floor(Math.random() * 10 - 5);
      setCards((prev) =>
        prev.map((c, i) =>
          i === index
            ? { ...c, isDragging: false, currentRot: randomRot }
            : c
        )
      );
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp, { once: true });
  };

  // Animation frame loop for floating & bobbing
  const cardElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animId: number;
    let tick = 0;

    const frame = () => {
      if (!heroRef.current || document.hidden) {
        animId = requestAnimationFrame(frame);
        return;
      }

      tick++;
      const w = heroRef.current.clientWidth;
      const h = heroRef.current.clientHeight;
      const isMobile = w <= 640;
      const k = isMobile ? Math.min(1, Math.max(0.48, w / 750)) : Math.min(1, Math.max(0.65, w / 900));
      const cardWidth = 150 * k;

      cardsRef.current.forEach((o, i) => {
        const el = cardElementsRef.current[i];
        if (!el) return;

        const bob = reduced ? 0 : Math.sin(tick / 60 + o.d * 7) * 6;
        const targetX = o.sx * w - 75 + o.dx + mouseRef.current.mx * o.d * 22;
        const targetY = o.sy * h - 54 + o.dy + mouseRef.current.my * o.d * 22 + bob;

        // Keep cards nicely bounded within the screen width on phones
        const minX = 6;
        const maxX = Math.max(minX, w - cardWidth - 6);
        const boundedX = isMobile && !o.isDragging ? Math.max(minX, Math.min(maxX, targetX)) : targetX;

        el.style.transform = `translate(${boundedX}px, ${targetY}px) rotate(${o.currentRot}deg) scale(${k})`;
        el.style.zIndex = o.isDragging ? '20' : '1';
      });

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [reduced]);

  return (
    <section
      ref={heroRef}
      onPointerMove={handlePointerMove}
      className="relative min-h-[92vh] sm:min-h-screen px-4 py-28 sm:py-36 grid place-items-center overflow-hidden select-none"
      data-a="Your files"
      data-b="Drag them around. They’re yours."
    >
      {/* Centered Hero Headline & CTA */}
      <div className="relative z-10 text-center max-w-3xl mx-auto pointer-events-none">
        <h1 className="text-[clamp(38px,6.8vw,80px)] font-extrabold tracking-tight text-[#14201C] leading-[1.02] text-balance">
          Google Drive storage that Google can’t read.
        </h1>
        <p className="mt-5 max-w-[540px] mx-auto text-[#4A5A54] text-lg sm:text-[19px] leading-relaxed">
          Your files get sealed on your PC before they upload. You keep the password
          and the 24-word recovery key.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5 pointer-events-auto">
          <Link
            to="/download"
            className="inline-flex items-center justify-center min-h-[46px] px-6 bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white font-semibold text-base rounded-lg transition-all shadow-sm hover:shadow"
          >
            Download for Windows
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center justify-center min-h-[46px] px-6 bg-transparent hover:bg-[#D3DAD5]/40 text-[#14201C] font-semibold text-base rounded-lg border border-[#D3DAD5] transition-all"
          >
            See how it works
          </Link>
        </div>
      </div>

      {/* Floating 3D Draggable File Cards */}
      {cards.map((card, i) => (
        <div
          key={card.file.name}
          ref={(el) => {
            cardElementsRef.current[i] = el;
          }}
          onPointerDown={(e) => handleCardPointerDown(i, e)}
          className="absolute left-0 top-0 cursor-grab active:cursor-grabbing pointer-events-auto touch-none"
          style={{
            width: '150px',
            height: '108px',
            willChange: 'transform',
          }}
        >
          <FileCard file={card.file} flipped={false} />
        </div>
      ))}

      {/* Hint at bottom */}
      <p className="absolute bottom-7 inset-x-0 text-center text-[13px] text-[#4A5A54] pointer-events-none select-none">
        Drag the files · scroll to seal them
      </p>
    </section>
  );
};
