import React, { useState, useEffect, useRef } from 'react';
import { SAMPLE_FILES } from '../common/fileCardData';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

const getRandomChars = (len: number) => {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += CHARS[(Math.random() * 36) | 0];
  }
  return s;
};

export const UnlockInteractive: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Locked. File names are encrypted too.');
  const [messageTone, setMessageTone] = useState<'normal' | 'ok' | 'err'>('normal');
  const [isShaking, setIsShaking] = useState(false);
  const [displayNames, setDisplayNames] = useState<string[]>(() =>
    SAMPLE_FILES.map((f) => getRandomChars(f.name.length))
  );

  const reduced = usePrefersReducedMotion();
  const animRef = useRef<number | null>(null);

  // Periodic random idle flicker for encrypted names when locked
  useEffect(() => {
    if (isUnlocked || reduced) return;

    const interval = setInterval(() => {
      setDisplayNames((prev) =>
        prev.map((name, i) => {
          if (Math.random() < 0.35) {
            return getRandomChars(SAMPLE_FILES[i].name.length);
          }
          return name;
        })
      );
    }, 900);

    return () => clearInterval(interval);
  }, [isUnlocked, reduced]);

  // Scramble / Unscramble animation runner
  const runScramble = (targetOpen: boolean) => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    if (reduced) {
      setDisplayNames(
        SAMPLE_FILES.map((f) => (targetOpen ? f.name : getRandomChars(f.name.length)))
      );
      return;
    }

    const t0 = performance.now();

    const frame = (now: number) => {
      const el = now - t0;
      let allDone = true;

      const updated = SAMPLE_FILES.map((file, i) => {
        const real = file.name;
        let s = '';
        for (let j = 0; j < real.length; j++) {
          const at = 150 + i * 90 + j * 22;
          if (targetOpen ? el > at : el < at) {
            s += targetOpen ? real[j] : CHARS[(Math.random() * 36) | 0];
          } else {
            s += targetOpen ? CHARS[(Math.random() * 36) | 0] : real[j];
            allDone = false;
          }
        }
        return s;
      });

      setDisplayNames(updated);

      if (!allDone) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        setDisplayNames(
          SAMPLE_FILES.map((f) => (targetOpen ? f.name : getRandomChars(f.name.length)))
        );
      }
    };

    animRef.current = requestAnimationFrame(frame);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isUnlocked) {
      setIsUnlocked(false);
      runScramble(false);
      setMessageTone('normal');
      setStatusMessage('Locked again. Nothing is left in the tab.');
      setPassword('');
      return;
    }

    if (password.trim().toLowerCase() === 'letmein') {
      setIsUnlocked(true);
      runScramble(true);
      setMessageTone('ok');
      setStatusMessage('Unlocked in this tab only. Read-only.');
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      setMessageTone('err');
      setStatusMessage('Wrong password. Nothing decrypts, the files stay sealed.');
    }
  };

  return (
    <section
      className="py-14 sm:py-20 px-4 sm:px-6"
      data-a="Unlocking"
      data-b="Read your files in a browser tab."
    >
      <div className="max-w-[1180px] mx-auto">
        <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
          Unlock in your browser. Wrong password, nothing opens.
        </h2>
        <p className="text-[#4A5A54] text-[17px] mt-2.5 max-w-[620px]">
          Type the demo password <span className="mono font-semibold text-[#14201C]">letmein</span>, or try a wrong one.
        </p>

        {/* Table Box */}
        <div
          className={`mt-8 bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl overflow-hidden shadow-xs transition-transform ${
            isShaking ? 'animate-[shake_0.45s_ease-in-out]' : ''
          }`}
        >
          {/* Controls Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-3 p-4 sm:p-[18px] border-b border-[#D3DAD5]"
          >
            <label
              htmlFor="demo-pw"
              className="text-xs font-semibold text-[#14201C]"
            >
              Password
            </label>
            <input
              id="demo-pw"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="letmein"
              className="min-h-[44px] text-base border border-[#D3DAD5] rounded-lg px-3 bg-[#EDF0ED] flex-1 min-w-[130px] max-w-xs focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-[18px] bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
            >
              {isUnlocked ? 'Lock' : 'Unlock'}
            </button>
            <span
              className={`w-full sm:w-auto text-sm transition-colors ${
                messageTone === 'ok'
                  ? 'text-[#0F5C4D] font-semibold'
                  : messageTone === 'err'
                  ? 'text-[#80261A] font-semibold'
                  : 'text-[#4A5A54]'
              }`}
              role="status"
            >
              {statusMessage}
            </span>
          </form>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#D3DAD5] text-left text-[13px] font-semibold text-[#4A5A54]">
                  <th className="py-2.5 px-4 sm:px-[18px]">Name</th>
                  <th className="py-2.5 px-4 sm:px-[18px]">Size</th>
                  <th className="py-2.5 px-4 sm:px-[18px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_FILES.map((file, i) => (
                  <tr
                    key={file.name}
                    className="border-b border-[#D3DAD5] last:border-b-0 whitespace-nowrap text-sm"
                  >
                    <td className="py-3 px-4 sm:px-[18px] mono text-[14px]">
                      {displayNames[i]}
                    </td>
                    <td className="py-3 px-4 sm:px-[18px] text-[#4A5A54]">
                      {file.size}
                    </td>
                    <td className="py-3 px-4 sm:px-[18px]">
                      <span
                        className={`text-[12px] font-bold px-2 py-0.5 rounded ${
                          isUnlocked
                            ? 'bg-[#D9EADF] text-[#0B4F40]'
                            : 'bg-[#2B3833] text-[#6FD0B8]'
                        }`}
                      >
                        {isUnlocked ? 'open' : 'sealed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
