import React, { useState, useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useActiveViewport } from '../../hooks/useActiveViewport';

const HEX_CHARS = '0123456789abcdef';
function getRandomHex(len: number): string {
  let res = '';
  for (let i = 0; i < len; i++) {
    res += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
  }
  return res;
}

const ORIGINAL_CARD2_TEXT = 'objects/9f3a...c1.bin';

export const HowItWorks: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [sectionRef, isSectionActive] = useActiveViewport<HTMLElement>(0.1);

  const [step, setStep] = useState<number>(0);
  const [timerKey, setTimerKey] = useState<number>(0);
  const [scrambleSeed, setScrambleSeed] = useState<string>('');

  const isSectionActiveRef = useRef(isSectionActive);
  useEffect(() => {
    isSectionActiveRef.current = isSectionActive;
  }, [isSectionActive]);

  // Step auto-advance timer: 3300 ms interval
  useEffect(() => {
    if (prefersReducedMotion || !isSectionActive) return;

    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
      setTimerKey((prev) => prev + 1);
    }, 3300);

    return () => clearInterval(interval);
  }, [prefersReducedMotion, isSectionActive, timerKey]);

  // Card 2 scramble effect when step becomes 1
  useEffect(() => {
    if (step !== 1 || prefersReducedMotion) return;

    let frame = 0;
    const maxFrames = 9;
    const interval = setInterval(() => {
      frame++;
      if (frame >= maxFrames) {
        setScrambleSeed('');
        clearInterval(interval);
      } else {
        setScrambleSeed(`objects/${getRandomHex(4)}...${getRandomHex(2)}.bin`);
      }
    }, 60);

    return () => {
      clearInterval(interval);
    };
  }, [step, prefersReducedMotion]);

  const displayedCard2Text =
    step === 1 && scrambleSeed ? scrambleSeed : ORIGINAL_CARD2_TEXT;

  const handleStepClick = (newStep: number) => {
    setStep(newStep);
    setTimerKey((k) => k + 1);
  };

  return (
    <section
      ref={sectionRef}
      className="bg-white py-16 sm:py-24 border-y border-[#E2E6E3] scroll-mt-12"
      id="how-it-works"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-[#14201C] tracking-tight mb-12">
          How it works
        </h2>

        {/* 3-Step Flow Diagram */}
        <div className="mb-14">
          <div className="flex flex-col md:flex-row items-stretch w-full">
            {/* Card 1: Your PC */}
            <div
              onClick={() => handleStepClick(0)}
              className={`w-full md:flex-1 bg-white rounded-2xl p-6 border flex flex-col justify-center cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                step === 0
                  ? prefersReducedMotion
                    ? 'border-[#0F5C4D] shadow-sm'
                    : 'border-[#0F5C4D] -translate-y-1.5 shadow-[0_12px_30px_rgba(15,92,77,0.13)]'
                  : 'border-[#CAD2CD] translate-y-0 shadow-sm'
              }`}
            >
              <div className="text-[11px] font-mono font-bold tracking-wider text-[#5A6662] uppercase mb-2">
                YOUR PC
              </div>
              <div className="text-base font-bold text-[#14201C] mb-1 font-mono">
                tax-return.xlsx
              </div>
              <div className="text-xs text-[#5A6662]">Readable only here</div>
            </div>

            {/* Connector 1 */}
            <div
              className={`w-full md:w-36 lg:w-44 flex items-center justify-center relative py-4 md:py-0 shrink-0 transition-opacity duration-300 ${
                step > 0 ? 'opacity-100' : 'opacity-35'
              }`}
            >
              {/* Desktop: Double horizontal dashed lines */}
              <div className="hidden md:flex flex-col justify-between w-full h-[46px] absolute inset-x-0 pointer-events-none">
                <div
                  className="w-full h-[1px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, #0F5C4D 0 6px, transparent 6px 12px)',
                    backgroundSize: '12px 1px',
                    animation: prefersReducedMotion
                      ? 'none'
                      : 'march-x 1s linear infinite',
                    animationPlayState: isSectionActive ? 'running' : 'paused',
                  }}
                />
                <div
                  className="w-full h-[1px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, #0F5C4D 0 6px, transparent 6px 12px)',
                    backgroundSize: '12px 1px',
                    animation: prefersReducedMotion
                      ? 'none'
                      : 'march-x 1s linear infinite',
                    animationPlayState: isSectionActive ? 'running' : 'paused',
                  }}
                />
              </div>

              {/* Mobile: Single vertical dashed line with label to the right */}
              <div className="flex md:hidden items-center justify-center gap-3 py-2 w-full">
                <div
                  className="w-[1px] h-[34px] shrink-0"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(180deg, #0F5C4D 0 6px, transparent 6px 12px)',
                    backgroundSize: '1px 12px',
                    animation: prefersReducedMotion
                      ? 'none'
                      : 'march-y 1s linear infinite',
                    animationPlayState: isSectionActive ? 'running' : 'paused',
                  }}
                />
                <div className="bg-white px-2 py-0.5 text-left">
                  <span className="text-[11px] font-medium text-[#0F5C4D] leading-tight block">
                    Locked on your
                    <br />
                    PC
                  </span>
                </div>
              </div>

              {/* Desktop label */}
              <div className="hidden md:block relative z-10 bg-white px-2 py-0.5 text-center">
                <span className="text-[11px] font-medium text-[#0F5C4D] leading-tight block whitespace-nowrap">
                  Locked on your
                  <br />
                  PC
                </span>
              </div>
            </div>

            {/* Card 2: Your Google Drive */}
            <div
              onClick={() => handleStepClick(1)}
              className={`w-full md:flex-1 bg-white rounded-2xl p-6 border flex flex-col justify-center cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                step === 1
                  ? prefersReducedMotion
                    ? 'border-[#0F5C4D] shadow-sm'
                    : 'border-[#0F5C4D] -translate-y-1.5 shadow-[0_12px_30px_rgba(15,92,77,0.13)]'
                  : step > 1
                  ? 'border-[#0F5C4D] translate-y-0 shadow-sm'
                  : 'border-[#CAD2CD] translate-y-0 shadow-sm'
              }`}
            >
              <div className="text-[11px] font-mono font-bold tracking-wider text-[#5A6662] uppercase mb-2">
                YOUR GOOGLE DRIVE
              </div>
              <div
                className="text-base font-bold text-[#14201C] mb-1 font-mono truncate"
                aria-label={ORIGINAL_CARD2_TEXT}
              >
                <span aria-hidden="true">{displayedCard2Text}</span>
              </div>
              <div className="text-xs text-[#5A6662]">
                Random-looking to Google
              </div>
            </div>

            {/* Connector 2 */}
            <div
              className={`w-full md:w-36 lg:w-44 flex items-center justify-center relative py-4 md:py-0 shrink-0 transition-opacity duration-300 ${
                step > 1 ? 'opacity-100' : 'opacity-35'
              }`}
            >
              {/* Desktop: Double horizontal dashed lines */}
              <div className="hidden md:flex flex-col justify-between w-full h-[46px] absolute inset-x-0 pointer-events-none">
                <div
                  className="w-full h-[1px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, #0F5C4D 0 6px, transparent 6px 12px)',
                    backgroundSize: '12px 1px',
                    animation: prefersReducedMotion
                      ? 'none'
                      : 'march-x 1s linear infinite',
                    animationPlayState: isSectionActive ? 'running' : 'paused',
                  }}
                />
                <div
                  className="w-full h-[1px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, #0F5C4D 0 6px, transparent 6px 12px)',
                    backgroundSize: '12px 1px',
                    animation: prefersReducedMotion
                      ? 'none'
                      : 'march-x 1s linear infinite',
                    animationPlayState: isSectionActive ? 'running' : 'paused',
                  }}
                />
              </div>

              {/* Mobile: Single vertical dashed line with label to the right */}
              <div className="flex md:hidden items-center justify-center gap-3 py-2 w-full">
                <div
                  className="w-[1px] h-[34px] shrink-0"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(180deg, #0F5C4D 0 6px, transparent 6px 12px)',
                    backgroundSize: '1px 12px',
                    animation: prefersReducedMotion
                      ? 'none'
                      : 'march-y 1s linear infinite',
                    animationPlayState: isSectionActive ? 'running' : 'paused',
                  }}
                />
                <div className="bg-white px-2 py-0.5 text-left">
                  <span className="text-[11px] font-medium text-[#0F5C4D] leading-tight block">
                    Unlocked in your
                    <br />
                    browser
                  </span>
                </div>
              </div>

              {/* Desktop label */}
              <div className="hidden md:block relative z-10 bg-white px-2 py-0.5 text-center">
                <span className="text-[11px] font-medium text-[#0F5C4D] leading-tight block whitespace-nowrap">
                  Unlocked in your
                  <br />
                  browser
                </span>
              </div>
            </div>

            {/* Card 3: Browser Tab */}
            <div
              onClick={() => handleStepClick(2)}
              className={`w-full md:flex-1 bg-white rounded-2xl p-6 border flex flex-col justify-center cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                step === 2
                  ? prefersReducedMotion
                    ? 'border-[#0F5C4D] shadow-sm'
                    : 'border-[#0F5C4D] -translate-y-1.5 shadow-[0_12px_30px_rgba(15,92,77,0.13)]'
                  : 'border-[#CAD2CD] translate-y-0 shadow-sm'
              }`}
            >
              <div className="text-[11px] font-mono font-bold tracking-wider text-[#5A6662] uppercase mb-2">
                BROWSER TAB
              </div>
              <div className="text-base font-bold text-[#14201C] mb-1">
                Read-only view
              </div>
              <div className="text-xs text-[#5A6662]">Gone when you lock</div>
            </div>
          </div>
        </div>

        {/* 3 Step Explanations Underneath (Interactive Buttons) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Step 1 Button */}
          <button
            type="button"
            onClick={() => handleStepClick(0)}
            aria-current={step === 0 ? 'step' : undefined}
            className="w-full text-left relative pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C4D] rounded-sm cursor-pointer"
          >
            {/* Top 3px Track */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-[#E2E6E3]" />
            {/* Active Progress Bar */}
            {step === 0 && (
              <div
                key={`progress-0-${timerKey}`}
                className="absolute top-0 left-0 right-0 h-[3px] bg-[#0F5C4D] origin-left"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        animation: 'progress-fill 3200ms linear forwards',
                        animationPlayState: isSectionActive
                          ? 'running'
                          : 'paused',
                      }
                }
              />
            )}
            <h3 className="text-sm font-bold text-[#14201C] mb-1.5">
              1. Create a vault
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
              Pick a folder, set a password, save your recovery key.
            </p>
          </button>

          {/* Step 2 Button */}
          <button
            type="button"
            onClick={() => handleStepClick(1)}
            aria-current={step === 1 ? 'step' : undefined}
            className="w-full text-left relative pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C4D] rounded-sm cursor-pointer"
          >
            {/* Top 3px Track */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-[#E2E6E3]" />
            {/* Active Progress Bar */}
            {step === 1 && (
              <div
                key={`progress-1-${timerKey}`}
                className="absolute top-0 left-0 right-0 h-[3px] bg-[#0F5C4D] origin-left"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        animation: 'progress-fill 3200ms linear forwards',
                        animationPlayState: isSectionActive
                          ? 'running'
                          : 'paused',
                      }
                }
              />
            )}
            <h3 className="text-sm font-bold text-[#14201C] mb-1.5">
              2. Push to your Drive
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
              Each push is a numbered version you can go back to.
            </p>
          </button>

          {/* Step 3 Button */}
          <button
            type="button"
            onClick={() => handleStepClick(2)}
            aria-current={step === 2 ? 'step' : undefined}
            className="w-full text-left relative pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C4D] rounded-sm cursor-pointer"
          >
            {/* Top 3px Track */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-[#E2E6E3]" />
            {/* Active Progress Bar */}
            {step === 2 && (
              <div
                key={`progress-2-${timerKey}`}
                className="absolute top-0 left-0 right-0 h-[3px] bg-[#0F5C4D] origin-left"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        animation: 'progress-fill 3200ms linear forwards',
                        animationPlayState: isSectionActive
                          ? 'running'
                          : 'paused',
                      }
                }
              />
            )}
            <h3 className="text-sm font-bold text-[#14201C] mb-1.5">
              3. Read anywhere
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
              Pull on another PC or open the web viewer. Edits stay in the desktop app.
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};
