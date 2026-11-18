import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Reveal } from '../common/Reveal';

export interface TimelineStep {
  heading: string;
  text: string;
  demo: ReactNode;
}

/**
 * Vertical line that fills as you scroll; each step number turns green once the
 * 60%-of-viewport mark passes it. Fully filled under reduced motion.
 */
export const ScrollTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const numRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [reached, setReached] = useState<number>(reduced ? steps.length : 0);

  useEffect(() => {
    if (reduced) return;
    let queued = false;

    const update = () => {
      queued = false;
      const wrap = wrapRef.current;
      const fill = fillRef.current;
      if (!wrap || !fill) return;
      const mark = window.innerHeight * 0.6;
      const rect = wrap.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (mark - rect.top) / (rect.height - 80)));
      fill.style.transform = `scaleY(${f})`;
      const n = numRefs.current.filter((el) => el && el.getBoundingClientRect().top <= mark).length;
      setReached((prev) => (prev === n ? prev : n));
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced]);

  return (
    <div ref={wrapRef} className="relative pl-12 md:pl-16">
      <div
        aria-hidden="true"
        className="absolute left-[17px] md:left-[19px] top-2 bottom-20 w-0.5 bg-[#D3DAD5]"
      >
        <div
          ref={fillRef}
          className="h-full bg-[#0F5C4D] origin-top"
          style={{ transform: reduced ? 'scaleY(1)' : 'scaleY(0)' }}
        />
      </div>

      {steps.map((step, i) => (
        <article key={step.heading} className="relative pb-16">
          <div
            ref={(el) => {
              numRefs.current[i] = el;
            }}
            aria-hidden="true"
            className={`absolute -left-12 md:-left-16 top-0 w-9 h-9 md:w-10 md:h-10 rounded-full border-2 grid place-items-center font-bold z-[1] transition-[background-color,color,border-color,transform] duration-[400ms] ${
              i < reached
                ? 'bg-[#0F5C4D] border-[#0F5C4D] text-white scale-110'
                : 'bg-[#EDF0ED] border-[#D3DAD5] text-[#14201C]'
            }`}
          >
            {i + 1}
          </div>
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 items-start">
            <Reveal>
              <h2 className="text-[21px] sm:text-2xl font-bold tracking-tight text-[#14201C] mb-2">
                {step.heading}
              </h2>
              <p className="text-[15px] text-[#4A5A54] leading-relaxed">{step.text}</p>
            </Reveal>
            <Reveal delay={120}>{step.demo}</Reveal>
          </div>
        </article>
      ))}
    </div>
  );
};
