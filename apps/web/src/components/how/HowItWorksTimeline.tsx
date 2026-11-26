import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TextDecode } from '../common/TextDecode';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const STEP1_CHECKS = [
  'Pick a folder on your PC',
  'Set a master password',
  'Save your 24-word recovery key',
  'Type it back',
];

const STEP2_FILES = [
  { name: 'tax-return.xlsx', size: '1.2 MB' },
  { name: 'test-100.docx', size: '2.1 MB' },
  { name: 'test-101.pdf', size: '740 KB' },
];

export const HowItWorksTimeline: React.FC = () => {
  const tlwRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  // Step 1 state
  const [step1ChecksDone, setStep1ChecksDone] = useState<number>(0);
  const [step1Masked, setStep1Masked] = useState(false);
  const step1TimerRef = useRef<NodeJS.Timeout[]>([]);

  // Step 2 state
  const [step2Statuses, setStep2Statuses] = useState<string[]>(['Local', 'Local', 'Local']);
  const [step2VersionSaved, setStep2VersionSaved] = useState(false);
  const step2TimerRef = useRef<NodeJS.Timeout[]>([]);

  // Step 3 state
  const [step3Unlocked, setStep3Unlocked] = useState(false);

  // Active step highlights
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 1 Runner
  const playStep1 = useCallback(() => {
    step1TimerRef.current.forEach(clearTimeout);
    step1TimerRef.current = [];

    if (reduced) {
      setStep1ChecksDone(4);
      setStep1Masked(true);
      return;
    }

    setStep1ChecksDone(0);
    setStep1Masked(false);

    STEP1_CHECKS.forEach((_, i) => {
      const t = setTimeout(() => {
        setStep1ChecksDone(i + 1);
        if (i === 3) {
          setStep1Masked(true);
        }
      }, i * 750 + 300);
      step1TimerRef.current.push(t);
    });
  }, [reduced]);

  // Step 2 Runner
  const playStep2 = useCallback(() => {
    step2TimerRef.current.forEach(clearTimeout);
    step2TimerRef.current = [];

    if (reduced) {
      setStep2Statuses(['✓ In Drive', '✓ In Drive', '✓ In Drive']);
      setStep2VersionSaved(true);
      return;
    }

    setStep2Statuses(['Local', 'Local', 'Local']);
    setStep2VersionSaved(false);

    STEP2_FILES.forEach((_, i) => {
      const t1 = setTimeout(() => {
        setStep2Statuses((prev) => {
          const next = [...prev];
          next[i] = 'Encrypting…';
          return next;
        });
      }, i * 650 + 200);

      const t2 = setTimeout(() => {
        setStep2Statuses((prev) => {
          const next = [...prev];
          next[i] = '✓ In Drive';
          return next;
        });
      }, i * 650 + 900);

      step2TimerRef.current.push(t1, t2);
    });

    const t3 = setTimeout(() => {
      setStep2VersionSaved(true);
    }, STEP2_FILES.length * 650 + 900);
    step2TimerRef.current.push(t3);
  }, [reduced]);

  // Step 3 Runner
  const playStep3 = useCallback(() => {
    setStep3Unlocked(false);
    setTimeout(() => setStep3Unlocked(true), 400);
  }, []);

  // Rail scroll progress tracking & IntersectionObserver
  useEffect(() => {
    const onScroll = () => {
      if (!tlwRef.current || !railRef.current) return;
      const t = tlwRef.current.getBoundingClientRect();
      const h = Math.min(
        t.height,
        Math.max(0, (window.innerHeight * 0.55 - t.top) / t.height * t.height)
      );
      railRef.current.style.height = `${h}px`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Intersection observer for steps
    const stepEls = document.querySelectorAll<HTMLElement>('.hw-step-item');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const stepNum = Number(e.target.getAttribute('data-n'));
            setActiveStep(stepNum);
            if (!e.target.getAttribute('data-ran')) {
              e.target.setAttribute('data-ran', '1');
              if (stepNum === 1) playStep1();
              else if (stepNum === 2) playStep2();
              else if (stepNum === 3) playStep3();
            }
          }
        }
      },
      { rootMargin: '-25% 0px -25% 0px' }
    );

    stepEls.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [playStep1, playStep2, playStep3]);

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6" data-a="The steps" data-b="Create, push, read.">
      <div className="max-w-[1100px] mx-auto">
        <div ref={tlwRef} className="relative pl-12 sm:pl-16">
          {/* Static Background Rail */}
          <div
            className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-[#D3DAD5]"
            aria-hidden="true"
          />
          {/* Dynamic Green Active Rail */}
          <div
            ref={railRef}
            className="absolute left-[19px] top-0 w-[2px] bg-[#0F5C4D] transition-all duration-75"
            aria-hidden="true"
          />

          {/* STEP 1 */}
          <article
            className="hw-step-item relative grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-9 items-start pb-16 sm:pb-24"
            data-n="1"
          >
            <span
              className={`absolute -left-12 sm:-left-16 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                activeStep === 1
                  ? 'bg-[#0F5C4D] border-[#0F5C4D] text-white'
                  : 'bg-[#F8FAF8] border-[#D3DAD5] text-[#14201C]'
              }`}
            >
              1
            </span>

            <div className="space-y-2">
              <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight text-[#14201C] leading-[1.15]">
                1. Create a vault
              </h2>
              <p className="text-[#4A5A54] text-[17px] leading-relaxed">
                Pick a folder on your PC, set a master password, and save your
                24-word recovery key. The app makes you type it back to prove you
                saved it.
              </p>
            </div>

            <div className="bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-5 sm:p-6 shadow-[0_18px_44px_rgba(15,29,25,.08)]">
              <ul className="space-y-2 font-medium text-sm text-[#14201C]">
                {STEP1_CHECKS.map((text, i) => {
                  const done = step1ChecksDone > i;
                  return (
                    <li key={text} className="flex items-center gap-2.5 py-1">
                      <i
                        className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center not-italic text-xs transition-all duration-250 ${
                          done
                            ? 'bg-[#0F5C4D] border-[#0F5C4D] text-white'
                            : 'border-[#D3DAD5] text-transparent'
                        }`}
                      >
                        ✓
                      </i>
                      <span>{text}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mt-4">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className="bg-[#EDF0ED] border border-[#D3DAD5] rounded px-1 py-1 mono text-[11px] sm:text-xs text-[#4A5A54] text-center truncate"
                  >
                    {step1Masked ? '••••' : i + 1}
                  </span>
                ))}
              </div>

              <p className="text-xs text-[#4A5A54] mt-3">
                Mock only. Your real key is shown once, inside the app.
              </p>

              <button
                type="button"
                onClick={playStep1}
                className="mt-3 min-h-[40px] border border-[#D3DAD5] hover:bg-[#D3DAD5]/30 rounded-lg px-3.5 text-xs font-semibold text-[#14201C] transition-colors cursor-pointer"
              >
                ↻ Replay
              </button>
            </div>
          </article>

          {/* STEP 2 */}
          <article
            className="hw-step-item relative grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-9 items-start pb-16 sm:pb-24"
            data-n="2"
          >
            <span
              className={`absolute -left-12 sm:-left-16 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                activeStep === 2
                  ? 'bg-[#0F5C4D] border-[#0F5C4D] text-white'
                  : 'bg-[#F8FAF8] border-[#D3DAD5] text-[#14201C]'
              }`}
            >
              2
            </span>

            <div className="space-y-2">
              <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight text-[#14201C] leading-[1.15]">
                2. Push to your Drive
              </h2>
              <p className="text-[#4A5A54] text-[17px] leading-relaxed">
                Each push is a numbered version you can go back to.
              </p>
            </div>

            <div className="bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-5 sm:p-6 shadow-[0_18px_44px_rgba(15,29,25,.08)]">
              <table className="w-full text-sm">
                <tbody>
                  {STEP2_FILES.map((f, i) => {
                    const st = step2Statuses[i];
                    return (
                      <tr key={f.name} className="border-b border-[#D3DAD5] last:border-b-0">
                        <td className="py-2.5 mono">{f.name}</td>
                        <td className="py-2.5 mono text-[#4A5A54]">{f.size}</td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                              st === 'Encrypting…'
                                ? 'bg-[#F4E3BC] text-[#5F4205]'
                                : st === '✓ In Drive'
                                ? 'bg-[#D9EADF] text-[#0B4F40]'
                                : 'bg-[#D3DAD5] text-[#4A5A54]'
                            }`}
                          >
                            {st}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-3">
                <span
                  className={`inline-block mono text-xs font-semibold text-[#0F5C4D] border-2 border-[#0F5C4D] rounded px-2.5 py-1 transition-all duration-400 ${
                    step2VersionSaved
                      ? 'opacity-100 scale-100 -rotate-6'
                      : 'opacity-0 scale-75 rotate-0'
                  }`}
                >
                  Version saved
                </span>
              </div>

              <p className="text-xs text-[#4A5A54] mt-2">Mock data.</p>

              <button
                type="button"
                onClick={playStep2}
                className="mt-3 min-h-[40px] border border-[#D3DAD5] hover:bg-[#D3DAD5]/30 rounded-lg px-3.5 text-xs font-semibold text-[#14201C] transition-colors cursor-pointer"
              >
                ↻ Replay
              </button>
            </div>
          </article>

          {/* STEP 3 */}
          <article
            className="hw-step-item relative grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-9 items-start pb-12"
            data-n="3"
          >
            <span
              className={`absolute -left-12 sm:-left-16 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                activeStep === 3
                  ? 'bg-[#0F5C4D] border-[#0F5C4D] text-white'
                  : 'bg-[#F8FAF8] border-[#D3DAD5] text-[#14201C]'
              }`}
            >
              3
            </span>

            <div className="space-y-2">
              <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight text-[#14201C] leading-[1.15]">
                3. Read anywhere
              </h2>
              <p className="text-[#4A5A54] text-[17px] leading-relaxed">
                Pull on another PC or open the web viewer. Edits stay in the
                desktop app.
              </p>
            </div>

            <div className="bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-5 sm:p-6 shadow-[0_18px_44px_rgba(15,29,25,.08)]">
              {/* Browser chrome mockup */}
              <div className="border border-[#D3DAD5] rounded-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#EDF0ED] border-b border-[#D3DAD5]">
                  <i className="w-2.5 h-2.5 rounded-full bg-[#D3DAD5] not-italic block" />
                  <i className="w-2.5 h-2.5 rounded-full bg-[#D3DAD5] not-italic block" />
                  <i className="w-2.5 h-2.5 rounded-full bg-[#D3DAD5] not-italic block" />
                  <span className="ml-2 mono text-xs text-[#4A5A54] truncate">
                    secureworkspace.harshdadiya.in/viewer
                  </span>
                </div>
                <ul className="divide-y divide-[#D3DAD5]">
                  {STEP2_FILES.map((f, i) => (
                    <li key={f.name} className="py-2.5 px-3.5 text-sm">
                      <TextDecode
                        text={f.name}
                        decoded={step3Unlocked}
                        rowIndex={i}
                        charDurationMs={28}
                        rowDelayMs={110}
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-[#4A5A54] mt-2.5">
                {step3Unlocked
                  ? 'Read-only. Decrypted in this tab only.'
                  : 'Locked. File names are encrypted too.'}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setStep3Unlocked(!step3Unlocked)}
                  className="min-h-[40px] bg-[#0F5C4D] hover:bg-[#0C4B3E] text-white rounded-lg px-3.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {step3Unlocked ? 'Lock' : 'Unlock'}
                </button>
                <button
                  type="button"
                  onClick={playStep3}
                  className="min-h-[40px] border border-[#D3DAD5] hover:bg-[#D3DAD5]/30 rounded-lg px-3.5 text-xs font-semibold text-[#14201C] transition-colors cursor-pointer"
                >
                  ↻ Replay
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* Bottom CTA to /security */}
        <div className="mt-12 text-center">
          <Link
            to="/security"
            className="inline-flex items-center justify-center min-h-[44px] px-6 bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white font-semibold rounded-lg text-sm transition-colors shadow-xs"
          >
            Read the full security model
          </Link>
        </div>
      </div>
    </section>
  );
};
