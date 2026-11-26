import React, { useRef, useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const WORDS =
  'orbit maple quiet harbor velvet tiger salad gentle copper ribbon island frost canvas lemon walnut ember pilot meadow saddle violin oyster thunder pencil garden'.split(
    ' '
  );

export const RecoveryWordsSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [reduced]);

  return (
    <section
      ref={containerRef}
      className="py-14 sm:py-20 px-4 sm:px-6"
      data-a="Recovery key"
      data-b="24 words. Only you have them."
    >
      <div className="max-w-[1180px] mx-auto">
        <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
          Forget the password? Your 24 words get you back in.
        </h2>
        <p className="text-[#4A5A54] text-[17px] mt-2.5 max-w-[620px]">
          We never see them and can’t reset them. Write them down somewhere safe.
        </p>

        {/* 24 Words Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mt-8">
          {WORDS.map((word, i) => (
            <div
              key={word}
              className={`bg-[#F8FAF8] border border-[#D3DAD5] rounded-xl p-2 sm:p-3 font-semibold text-xs sm:text-sm text-[#14201C] flex items-baseline gap-1.5 sm:gap-2 shadow-2xs ${
                isInView || reduced ? 'opacity-100 translate-y-0 rotate-0' : 'opacity-0 -translate-y-10 -rotate-6'
              }`}
              style={{
                transition: reduced
                  ? 'none'
                  : 'opacity 0.45s ease-out, transform 0.55s cubic-bezier(0.2, 1.4, 0.4, 1)',
                transitionDelay: reduced ? '0ms' : `${i * 45}ms`,
              }}
            >
              <small className="mono text-[10px] sm:text-xs text-[#4A5A54] font-medium shrink-0">
                {i + 1}
              </small>
              <span className="truncate">{word}</span>
            </div>
          ))}
        </div>

        <p className="text-[13px] text-[#4A5A54] mt-3.5">
          Example words for this mock-up. A real key is generated on your PC.
        </p>
      </div>
    </section>
  );
};
