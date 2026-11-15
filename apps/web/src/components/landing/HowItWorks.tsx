import React from 'react';

export const HowItWorks: React.FC = () => {
  return (
    <section className="bg-[#F2F5F2] py-14 sm:py-20 border-y border-[#E2E6E3]/70 scroll-mt-12" id="how-it-works">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#14201C] tracking-tight">
            How it works
          </h2>
          <span className="hidden sm:inline-block text-xs font-mono text-[#5A6662] uppercase tracking-wider">
            Client-Side · Deterministic · No Server Stores Your Data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white/70 hover:bg-white border border-[#E2E6E3]/80 hover:border-[#CAD2CD] transition-all duration-200 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 space-y-2.5">
            <div className="font-mono text-xs font-bold text-[#0F5C4D] bg-[#E6F4F1] inline-block px-2 py-0.5 rounded">
              STEP 01
            </div>
            <h3 className="text-base font-bold text-[#14201C]">
              1. Create a vault
            </h3>
            <p className="text-sm text-[#5A6662] leading-relaxed">
              Pick a local folder, set a master password, and save your 24-word
              recovery key.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white/70 hover:bg-white border border-[#E2E6E3]/80 hover:border-[#CAD2CD] transition-all duration-200 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 space-y-2.5">
            <div className="font-mono text-xs font-bold text-[#0F5C4D] bg-[#E6F4F1] inline-block px-2 py-0.5 rounded">
              STEP 02
            </div>
            <h3 className="text-base font-bold text-[#14201C]">
              2. Push to your Drive
            </h3>
            <p className="text-sm text-[#5A6662] leading-relaxed">
              Files are encrypted with XChaCha20-Poly1305 on your PC. Each push is
              an immutable numbered version.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white/70 hover:bg-white border border-[#E2E6E3]/80 hover:border-[#CAD2CD] transition-all duration-200 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 space-y-2.5">
            <div className="font-mono text-xs font-bold text-[#0F5C4D] bg-[#E6F4F1] inline-block px-2 py-0.5 rounded">
              STEP 03
            </div>
            <h3 className="text-base font-bold text-[#14201C]">
              3. Read anywhere
            </h3>
            <p className="text-sm text-[#5A6662] leading-relaxed">
              Pull on another device, or view in the browser with WebAssembly.
              Edits stay on the desktop app.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
