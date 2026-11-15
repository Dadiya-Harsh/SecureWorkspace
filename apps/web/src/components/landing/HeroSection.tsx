import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Unlock } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const [isDecrypted, setIsDecrypted] = useState(false);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16 sm:pt-16 sm:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
        {/* Left Column: Value Proposition */}
        <div className="lg:col-span-7 pr-0 lg:pr-6">
          {/* Eyebrow Pill with subtle pulse */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#DCECE6] text-[#0F5C4D] text-xs font-medium mb-5 sm:mb-6 shadow-2xs hover:bg-[#D4E8E1] transition-colors">
            <span className="font-bold text-xs">✓</span>
            <span>Open source, no account with us</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-[#14201C] tracking-tight leading-[1.12] mb-5 sm:mb-6">
            Your files, encrypted before they reach Google Drive.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#5A6662] leading-relaxed mb-6 sm:mb-8 max-w-xl">
            Google stores ciphertext only. You keep the password and a 24-word
            recovery key. No server stores your data, and we hold no keys.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-4 max-w-md sm:max-w-none">
            <a
              href="#download"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', '#download');
              }}
              className="w-full sm:w-auto"
            >
              <button className="w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white px-6 py-3 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm hover:-translate-y-0.5 text-center">
                Download for Windows
              </button>
            </a>
            <Link to="/viewer" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-white hover:bg-[#F8FAF8] border border-[#CAD2CD] text-[#14201C] px-6 py-3 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm hover:-translate-y-0.5 text-center">
                Open web viewer
              </button>
            </Link>
          </div>

          {/* Platform Caption */}
          <p className="text-xs text-[#5A6662]">
            Android and Ubuntu are planned. The web viewer is read-only.
          </p>
        </div>

        {/* Right Column: Interactive Animated "What Google Sees" Preview Card */}
        <div className="lg:col-span-5 w-full pt-2 relative group">
          {/* Subtle Ambient Background Aura */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />

          <div
            onClick={() => setIsDecrypted(!isDecrypted)}
            className="relative bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E6E3] shadow-xs hover:border-[#CAD2CD] transition-all duration-300 flex flex-col justify-between min-h-[220px] cursor-pointer select-none"
            title="Click to toggle between Google's view and your decrypted view"
          >
            {/* Top Bar with Live Beacon & Toggle Trigger */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F2F5F2]">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5A6662]">
                  {isDecrypted ? 'Decrypted in RAM' : 'Google Drive View'}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono text-[#0F5C4D] bg-[#E6F4F1] hover:bg-[#D4E8E1] px-2 py-0.5 rounded transition-colors">
                {isDecrypted ? (
                  <>
                    <Unlock className="w-3 h-3 text-[#0F5C4D]" />
                    <span>Plaintext</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-[#0F5C4D]" />
                    <span>Ciphertext</span>
                  </>
                )}
                <span className="opacity-50 ml-1">⇄</span>
              </div>
            </div>

            {/* Content Lines (Smooth Ciphertext vs Plaintext Switch) */}
            <div className="space-y-2.5 font-mono text-xs sm:text-sm overflow-hidden py-1 transition-all duration-200">
              {isDecrypted ? (
                <>
                  <div className="text-emerald-700 font-semibold tracking-wide truncate flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="text-[#3FB89A]">📊</span>
                    <span>Tax & Legal/Q3_tax_return.xlsx</span>
                  </div>
                  <div className="text-[#14201C] font-medium tracking-wide truncate flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="text-[#5A6662]">🔑</span>
                    <span>SWH1 256-bit Master Key Envelope</span>
                  </div>
                  <div className="text-[#5A6662] tracking-wide truncate flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="text-[#5A6662]">📋</span>
                    <span>Version 14 Manifest (12 files)</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[#3FB89A] font-medium tracking-wide truncate animate-in fade-in duration-200">
                    objects/9f3a...c1.bin
                  </div>
                  <div className="text-[#A0ACA8] tracking-wide truncate animate-in fade-in duration-200">
                    workspace.header
                  </div>
                  <div className="text-[#A0ACA8] tracking-wide truncate animate-in fade-in duration-200">
                    versions/0014.manifest
                  </div>
                </>
              )}
            </div>

            {/* Bottom Explainer Note */}
            <div className="mt-8 pt-3 border-t border-[#F2F5F2] flex items-center justify-between text-xs text-[#8E9A96]">
              <span>
                {isDecrypted
                  ? 'Decrypted 100% in browser RAM with WebAssembly.'
                  : 'What Google sees: random-looking files, sizes, and timing.'}
              </span>
              <span className="text-[10px] font-mono text-[#0F5C4D] underline opacity-70 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                Tap to toggle
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
