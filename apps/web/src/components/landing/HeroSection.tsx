import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useActiveViewport } from '../../hooks/useActiveViewport';

interface FileRowData {
  name: string;
  size: string;
  modified: string;
}

const FILE_ROWS: FileRowData[] = [
  { name: 'tax-return.xlsx', size: '1.2 MB', modified: '14 Nov' },
  { name: 'test-100.docx', size: '2.1 MB', modified: '14 Nov' },
  { name: 'test-101.pdf', size: '740 KB', modified: '14 Nov' },
  { name: 'test-102.pdf', size: '1.5 MB', modified: '14 Nov' },
];

const HEADLINE_LINES = [
  ['Google', 'Drive', 'storage'],
  ['that', 'Google', "can't"],
  ['read.'],
];

export const HeroSection: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [sectionRef, isHeroActive] = useActiveViewport<HTMLElement>(0.1);

  // Fine pointer / hover check for 3D tilt
  const [canHover, setCanHover] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else {
      mq.addListener(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  // Headline & Hero intro reveal
  const [isIntroReady, setIsIntroReady] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsIntroReady(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Table rows entrance & status pills
  const [rowStates, setRowStates] = useState<
    Array<{ entered: boolean; status: 'encrypting' | 'in-drive' }>
  >(() =>
    FILE_ROWS.map(() => ({
      entered: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      status: 'in-drive',
    }))
  );

  const isHeroActiveRef = useRef(isHeroActive);
  useEffect(() => {
    isHeroActiveRef.current = isHeroActive;
  }, [isHeroActive]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const timeouts: Array<ReturnType<typeof setTimeout>> = [];

    // Staggered entrance starting at 900ms, each spaced by 600ms
    // Row 0: 900ms, flip at 2500ms
    // Row 1: 1500ms, flip at 3100ms
    // Row 2: 2100ms, flip at 3700ms
    // Row 3: 2700ms, flip at 4300ms
    FILE_ROWS.forEach((_, index) => {
      const enterDelay = 900 + index * 600;
      const flipDelay = enterDelay + 1600;

      timeouts.push(
        setTimeout(() => {
          setRowStates((prev) => {
            const next = [...prev];
            if (next[index]) {
              next[index] = { entered: true, status: 'encrypting' };
            }
            return next;
          });
        }, enterDelay)
      );

      timeouts.push(
        setTimeout(() => {
          setRowStates((prev) => {
            const next = [...prev];
            if (next[index]) {
              next[index] = { entered: true, status: 'in-drive' };
            }
            return next;
          });
        }, flipDelay)
      );
    });

    // Idle loop: every 7-9 s, pick one random row and replay Encrypting -> In Drive
    // Starts after the initial entrance settles (~5000ms)
    let idleInterval: ReturnType<typeof setInterval> | null = null;
    const idleStartTimeout = setTimeout(() => {
      idleInterval = setInterval(() => {
        if (!isHeroActiveRef.current) return;
        const targetIndex = Math.floor(Math.random() * FILE_ROWS.length);

        setRowStates((prev) => {
          const next = [...prev];
          if (next[targetIndex]) {
            next[targetIndex] = { ...next[targetIndex], status: 'encrypting' };
          }
          return next;
        });

        timeouts.push(
          setTimeout(() => {
            setRowStates((prev) => {
              const next = [...prev];
              if (next[targetIndex]) {
                next[targetIndex] = { ...next[targetIndex], status: 'in-drive' };
              }
              return next;
            });
          }, 1600)
        );
      }, 8000);
    }, 5000);

    timeouts.push(idleStartTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
      if (idleInterval) clearInterval(idleInterval);
    };
  }, [prefersReducedMotion]);

  // Pointer move inside app card for 3D tilt
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canHover || prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * 12; // -6 to +6 deg
    const rotX = (0.5 - y) * 12; // -6 to +6 deg
    setTilt({ x: rotX, y: rotY });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      ref={sectionRef}
      className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* Left Column: Value Proposition */}
        <div className="lg:col-span-6 pr-0 lg:pr-4 space-y-6">
          {/* Eyebrow Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#DCECE6] text-[#0F5C4D] text-xs font-medium transition-[opacity,transform] duration-[800ms] ${
              prefersReducedMotion || isIntroReady
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={
              prefersReducedMotion
                ? undefined
                : {
                    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                    transitionDelay: '700ms',
                  }
            }
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Free · Open source · Windows beta</span>
          </div>

          {/* Main Headline with word-by-word reveal */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#111816] tracking-tight leading-[1.1]">
            {HEADLINE_LINES.map((words, lineIndex) => {
              const lineOffset = HEADLINE_LINES.slice(0, lineIndex).reduce(
                (sum, arr) => sum + arr.length,
                0
              );
              return (
                <React.Fragment key={lineIndex}>
                  {words.map((word, wordIndexInLine) => {
                    const currentWordIndex = lineOffset + wordIndexInLine;
                    const isLastInLine = wordIndexInLine === words.length - 1;
                    return (
                      <span
                        key={word}
                        className={`inline-block ${
                          isLastInLine ? '' : 'mr-[0.28em]'
                        } transition-[opacity,transform] duration-[700ms] ${
                          prefersReducedMotion || isIntroReady
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-6'
                        }`}
                        style={
                          prefersReducedMotion
                            ? undefined
                            : {
                                transitionTimingFunction:
                                  'cubic-bezier(0.2, 0.8, 0.2, 1)',
                                transitionDelay: `${currentWordIndex * 90}ms`,
                              }
                        }
                      >
                        {word}
                      </span>
                    );
                  })}
                  {lineIndex < HEADLINE_LINES.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </h1>

          {/* Subtitle */}
          <p
            className={`text-base sm:text-lg text-[#5A6662] leading-relaxed max-w-lg transition-[opacity,transform] duration-[800ms] ${
              prefersReducedMotion || isIntroReady
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={
              prefersReducedMotion
                ? undefined
                : {
                    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                    transitionDelay: '700ms',
                  }
            }
          >
            SecureWorkspace encrypts your files on your PC before they reach Drive. You keep the password and a 24-word recovery key. No account with us, and no server that stores your data.
          </p>

          {/* Action Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1 transition-[opacity,transform] duration-[800ms] ${
              prefersReducedMotion || isIntroReady
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={
              prefersReducedMotion
                ? undefined
                : {
                    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                    transitionDelay: '700ms',
                  }
            }
          >
            <Link to="/download">
              <button className="w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer shadow-xs hover:shadow-[0_8px_20px_rgba(15,92,77,0.27)] hover:-translate-y-0.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C4D]">
                Download beta for Windows
              </button>
            </Link>
            <Link to="/how-it-works">
              <button className="w-full sm:w-auto bg-[#E5E9E5] hover:bg-[#DCE1DC] text-[#14201C] px-6 py-3 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C4D]">
                See how it works
              </button>
            </Link>
          </div>

          {/* Platform Caption */}
          <p
            className={`text-xs text-[#5A6662] pt-1 transition-[opacity,transform] duration-[800ms] ${
              prefersReducedMotion || isIntroReady
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={
              prefersReducedMotion
                ? undefined
                : {
                    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                    transitionDelay: '700ms',
                  }
            }
          >
            v0.1.0 beta · Windows 11 · Apache 2.0
          </p>
        </div>

        {/* Right Column: App Window Screenshot / Preview Mockup */}
        <div className="lg:col-span-6 w-full">
          {/* Outer float wrapper (paused when offscreen/backgrounded) */}
          <div
            className={`w-full ${
              prefersReducedMotion ? '' : 'animate-float'
            }`}
            style={{
              animationPlayState: isHeroActive ? 'running' : 'paused',
            }}
          >
            {/* Inner 3D tilt element */}
            <div
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="relative rounded-2xl overflow-hidden border border-[#D5DDD6] shadow-xl bg-white text-xs select-none will-change-transform"
              style={{
                transform:
                  canHover && !prefersReducedMotion
                    ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
                    : undefined,
                transition:
                  tilt.x === 0 && tilt.y === 0
                    ? 'transform 400ms ease-out'
                    : 'transform 100ms ease-out',
              }}
            >
              <div className="flex h-[320px] sm:h-[340px]">
                {/* Left Dark Sidebar */}
                <div className="w-36 sm:w-44 bg-[#0F1D19] text-[#E6EFEA] p-3 flex flex-col justify-between shrink-0 border-r border-[#1B2F29]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <img
                        src="/branding/mark-on-dark.svg"
                        alt="SecureWorkspace"
                        className="w-5 h-5 rounded object-contain"
                      />
                      <span className="font-bold text-[13px] text-white tracking-tight">
                        SecureWorkspace
                      </span>
                    </div>

                    <div className="space-y-0.5 text-[11px] font-medium text-[#8EA39C]">
                      <div className="px-2 py-1 rounded hover:text-white cursor-pointer">
                        Dashboard
                      </div>
                      <div className="px-2 py-1 rounded bg-[#1B2F29] text-white font-semibold cursor-pointer">
                        Files
                      </div>
                      <div className="px-2 py-1 rounded hover:text-white cursor-pointer">
                        Sync
                      </div>
                      <div className="px-2 py-1 rounded hover:text-white cursor-pointer">
                        History
                      </div>
                      <div className="px-2 py-1 rounded hover:text-white cursor-pointer">
                        Backups
                      </div>
                      <div className="px-2 py-1 rounded hover:text-white cursor-pointer">
                        Workspaces
                      </div>
                      <div className="px-2 py-1 rounded hover:text-white cursor-pointer">
                        Settings
                      </div>
                    </div>
                  </div>

                  <div className="px-2 py-1 text-[10px] text-[#5C756D] border-t border-[#1B2F29] pt-2">
                    v0.1.0 · Locked
                  </div>
                </div>

                {/* Right Main Table Content */}
                <div className="flex-1 bg-white p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EDF0ED]">
                      <span className="font-bold text-sm text-[#14201C]">
                        Workspace Files
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded border border-[#CAD2CD] text-[#5A6662] bg-[#F8FAF8]">
                          + Open folder
                        </span>
                      </div>
                    </div>

                    {/* Mock Table - Fixed Height prevents layout shift */}
                    <div className="w-full">
                      <div className="grid grid-cols-12 text-[10px] font-semibold text-[#5A6662] pb-1.5 border-b border-[#F2F5F2]">
                        <span className="col-span-5">Name</span>
                        <span className="col-span-2">Size</span>
                        <span className="col-span-2">Modified</span>
                        <span className="col-span-3 text-right">Status</span>
                      </div>

                      <div className="divide-y divide-[#F2F5F2] text-[11px] font-mono">
                        {FILE_ROWS.map((file, idx) => {
                          const state = rowStates[idx] || {
                            entered: true,
                            status: 'in-drive',
                          };
                          return (
                            <div
                              key={file.name}
                              className={`grid grid-cols-12 py-2 items-center transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                                state.entered
                                  ? 'opacity-100 translate-x-0'
                                  : 'opacity-0 translate-x-[14px]'
                              }`}
                            >
                              <span className="col-span-5 font-sans font-medium text-[#14201C] truncate">
                                {file.name}
                              </span>
                              <span className="col-span-2 text-[#5A6662]">
                                {file.size}
                              </span>
                              <span className="col-span-2 text-[#5A6662]">
                                {file.modified}
                              </span>
                              <span className="col-span-3 text-right">
                                {state.status === 'encrypting' ? (
                                  <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans bg-amber-100 text-amber-800 transition-colors duration-300">
                                    <span
                                      className="w-2 h-2 rounded-full border-2 border-amber-800 border-r-transparent animate-spin-fast shrink-0"
                                      aria-hidden="true"
                                    />
                                    Encrypting…
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans bg-[#E6F4EA] text-[#137333] transition-colors duration-300">
                                    ✓ In Drive
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#5A6662] flex items-center justify-between pt-2 border-t border-[#F2F5F2]">
                    <span>4 files · 5.54 MB total</span>
                    <span className="text-[#0F5C4D] font-medium font-sans">
                      Synced with Google Drive
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
