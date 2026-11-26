import React, { useState, useEffect } from 'react';
import { MarchingDash } from '../common/MarchingDash';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export const SecurityKeyDiagram: React.FC = () => {
  const [activePath, setActivePath] = useState<'pw' | 'rk'>('pw');
  const reduced = usePrefersReducedMotion();

  // Auto-switch path every 4.5s unless user clicks or reduced motion
  useEffect(() => {
    if (reduced) return;

    const timer = setInterval(() => {
      setActivePath((prev) => (prev === 'pw' ? 'rk' : 'pw'));
    }, 4500);

    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <div className="w-full">
      {/* Desktop Grid Layout (hidden on <= 800px) */}
      <div className="hidden lg:grid grid-cols-[minmax(0,1.2fr)_minmax(90px,.6fr)_22px_minmax(0,1fr)_minmax(110px,.6fr)_minmax(0,1fr)] items-center gap-y-4 mt-8">
        {/* Button 1: Your Password */}
        <button
          type="button"
          onClick={() => setActivePath('pw')}
          className={`text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
            activePath === 'pw'
              ? 'bg-[#F8FAF8] border-[#0F5C4D] shadow-[0_0_0_3px_rgba(111,208,184,.4)]'
              : 'bg-[#F8FAF8]/70 border-[#D3DAD5] opacity-65'
          }`}
          style={{ gridArea: '1 / 1' }}
          aria-pressed={activePath === 'pw'}
        >
          <small className="block text-xs font-bold text-[#4A5A54]">
            UNLOCK WITH
          </small>
          <b className="block text-lg text-[#14201C] mt-0.5">Your password</b>
        </button>

        {/* Button 2: 24-word recovery phrase */}
        <button
          type="button"
          onClick={() => setActivePath('rk')}
          className={`text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
            activePath === 'rk'
              ? 'bg-[#F8FAF8] border-[#0F5C4D] shadow-[0_0_0_3px_rgba(111,208,184,.4)]'
              : 'bg-[#F8FAF8]/70 border-[#D3DAD5] opacity-65'
          }`}
          style={{ gridArea: '2 / 1' }}
          aria-pressed={activePath === 'rk'}
        >
          <small className="block text-xs font-bold text-[#4A5A54]">
            OR UNLOCK WITH
          </small>
          <b className="block text-lg text-[#14201C] mt-0.5">
            24-word recovery phrase
          </b>
        </button>

        {/* Dash from Password */}
        <div style={{ gridArea: '1 / 2' }} className="px-2">
          <MarchingDash
            active={activePath === 'pw'}
            orientation="horizontal"
            hasDot={activePath === 'pw'}
            label="Argon2id"
          />
        </div>

        {/* Dash from Recovery Phrase */}
        <div style={{ gridArea: '2 / 2' }} className="px-2">
          <MarchingDash
            active={activePath === 'rk'}
            orientation="horizontal"
            hasDot={activePath === 'rk'}
            label="Same key"
          />
        </div>

        {/* Joiner */}
        <div
          style={{ gridArea: '1 / 3 / 3 / 4' }}
          className="relative h-full self-stretch"
        >
          {/* Vertical bar */}
          <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] -ml-[1px] bg-[#0F5C4D]" />
          {/* Horizontal branch */}
          <div className="absolute left-0 right-0 top-1/2 h-[2px] -mt-[1px] bg-[#0F5C4D]" />
        </div>

        {/* Master Key Card */}
        <div
          style={{ gridArea: '1 / 4 / 3 / 5' }}
          className="p-4 rounded-xl border border-[#0F5C4D] bg-[#F8FAF8] self-center shadow-xs"
        >
          <small className="block text-xs font-bold text-[#4A5A54]">
            RANDOM
          </small>
          <b className="block text-lg text-[#14201C] mt-0.5">Master key</b>
        </div>

        {/* Dash to Files */}
        <div style={{ gridArea: '1 / 5 / 3 / 6' }} className="px-2">
          <MarchingDash
            active={true}
            orientation="horizontal"
            hasDot={true}
            label="XChaCha20-Poly1305"
          />
        </div>

        {/* Encrypted Files Card */}
        <div
          style={{ gridArea: '1 / 6 / 3 / 7' }}
          className="p-4 rounded-xl border border-[#0F5C4D] bg-[#2B3833] text-[#6FD0B8] self-center shadow-xs"
        >
          <small className="block text-xs font-bold text-[#9DB2AA]">
            LIBSODIUM
          </small>
          <b className="block text-lg text-[#E3EBE7] mt-0.5">
            Your files, encrypted
          </b>
        </div>
      </div>

      {/* Mobile Stacked Layout (displayed on <= 800px) */}
      <div className="lg:hidden flex flex-col gap-3 mt-8 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setActivePath('pw')}
          className={`text-left p-4 rounded-xl border transition-all ${
            activePath === 'pw'
              ? 'bg-[#F8FAF8] border-[#0F5C4D] shadow-[0_0_0_3px_rgba(111,208,184,.4)]'
              : 'bg-[#F8FAF8]/70 border-[#D3DAD5] opacity-65'
          }`}
        >
          <small className="block text-xs font-bold text-[#4A5A54]">
            UNLOCK WITH
          </small>
          <b className="block text-base text-[#14201C]">Your password</b>
        </button>

        <button
          type="button"
          onClick={() => setActivePath('rk')}
          className={`text-left p-4 rounded-xl border transition-all ${
            activePath === 'rk'
              ? 'bg-[#F8FAF8] border-[#0F5C4D] shadow-[0_0_0_3px_rgba(111,208,184,.4)]'
              : 'bg-[#F8FAF8]/70 border-[#D3DAD5] opacity-65'
          }`}
        >
          <small className="block text-xs font-bold text-[#4A5A54]">
            OR UNLOCK WITH
          </small>
          <b className="block text-base text-[#14201C]">
            24-word recovery phrase
          </b>
        </button>

        <div className="h-10 py-1">
          <MarchingDash
            active={true}
            orientation="vertical"
            hasDot={true}
            label={activePath === 'pw' ? 'Argon2id' : 'Same key'}
          />
        </div>

        <div className="p-4 rounded-xl border border-[#0F5C4D] bg-[#F8FAF8]">
          <small className="block text-xs font-bold text-[#4A5A54]">
            RANDOM
          </small>
          <b className="block text-base text-[#14201C]">Master key</b>
        </div>

        <div className="h-10 py-1">
          <MarchingDash
            active={true}
            orientation="vertical"
            hasDot={true}
            label="XChaCha20-Poly1305"
          />
        </div>

        <div className="p-4 rounded-xl border border-[#0F5C4D] bg-[#2B3833] text-[#6FD0B8]">
          <small className="block text-xs font-bold text-[#9DB2AA]">
            LIBSODIUM
          </small>
          <b className="block text-base text-[#E3EBE7]">Your files, encrypted</b>
        </div>
      </div>

      <p className="text-[13px] text-[#4A5A54] mt-4">
        Tap or click a key to follow that path. Both lead to the same master key.
      </p>
    </div>
  );
};
