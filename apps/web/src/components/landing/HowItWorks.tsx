import React from 'react';

export const HowItWorks: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-24 border-y border-[#E2E6E3] scroll-mt-12" id="how-it-works">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-[#14201C] tracking-tight mb-12">
          How it works
        </h2>

        {/* 3-Step Flow Diagram */}
        <div className="mb-14">
          <div className="flex flex-col md:flex-row items-stretch w-full">
            {/* Card 1: Your PC */}
            <div className="w-full md:flex-1 bg-white rounded-2xl p-6 border border-[#CAD2CD] shadow-sm flex flex-col justify-center">
              <div className="text-[11px] font-mono font-bold tracking-wider text-[#5A6662] uppercase mb-2">
                YOUR PC
              </div>
              <div className="text-base font-bold text-[#14201C] mb-1 font-mono">
                tax-return.xlsx
              </div>
              <div className="text-xs text-[#5A6662]">
                Readable only here
              </div>
            </div>

            {/* Connector 1: Double Dashed Green Line with Plain Text in the Middle */}
            <div className="w-full md:w-36 lg:w-44 flex items-center justify-center relative py-4 md:py-0 shrink-0">
              {/* Double dashed horizontal green tracks */}
              <div className="hidden md:flex flex-col justify-between w-full h-[46px] absolute inset-x-0 pointer-events-none">
                <div className="w-full border-t border-dashed border-[#0F5C4D]"></div>
                <div className="w-full border-b border-dashed border-[#0F5C4D]"></div>
              </div>
              {/* Plain text floating between the dashed lines on clean white bg (no box, no border) */}
              <div className="relative z-10 bg-white px-2 py-0.5 text-center">
                <span className="text-[11px] font-medium text-[#0F5C4D] leading-tight block whitespace-nowrap">
                  Locked on your<br />PC
                </span>
              </div>
            </div>

            {/* Card 2: Your Google Drive */}
            <div className="w-full md:flex-1 bg-white rounded-2xl p-6 border border-[#CAD2CD] shadow-sm flex flex-col justify-center">
              <div className="text-[11px] font-mono font-bold tracking-wider text-[#5A6662] uppercase mb-2">
                YOUR GOOGLE DRIVE
              </div>
              <div className="text-base font-bold text-[#14201C] mb-1 font-mono truncate">
                objects/9f3a...c1.bin
              </div>
              <div className="text-xs text-[#5A6662]">
                Random-looking to Google
              </div>
            </div>

            {/* Connector 2: Double Dashed Green Line with Plain Text in the Middle */}
            <div className="w-full md:w-36 lg:w-44 flex items-center justify-center relative py-4 md:py-0 shrink-0">
              {/* Double dashed horizontal green tracks */}
              <div className="hidden md:flex flex-col justify-between w-full h-[46px] absolute inset-x-0 pointer-events-none">
                <div className="w-full border-t border-dashed border-[#0F5C4D]"></div>
                <div className="w-full border-b border-dashed border-[#0F5C4D]"></div>
              </div>
              {/* Plain text floating between the dashed lines on clean white bg (no box, no border) */}
              <div className="relative z-10 bg-white px-2 py-0.5 text-center">
                <span className="text-[11px] font-medium text-[#0F5C4D] leading-tight block whitespace-nowrap">
                  Unlocked in your<br />browser
                </span>
              </div>
            </div>

            {/* Card 3: Browser Tab */}
            <div className="w-full md:flex-1 bg-white rounded-2xl p-6 border border-[#CAD2CD] shadow-sm flex flex-col justify-center">
              <div className="text-[11px] font-mono font-bold tracking-wider text-[#5A6662] uppercase mb-2">
                BROWSER TAB
              </div>
              <div className="text-base font-bold text-[#14201C] mb-1">
                Read-only view
              </div>
              <div className="text-xs text-[#5A6662]">
                Gone when you lock
              </div>
            </div>
          </div>
        </div>

        {/* 3 Step Explanations Underneath */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div>
            <h3 className="text-sm font-bold text-[#14201C] mb-1.5">
              1. Create a vault
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
              Pick a folder, set a password, save your recovery key.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#14201C] mb-1.5">
              2. Push to your Drive
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
              Each push is a numbered version you can go back to.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#14201C] mb-1.5">
              3. Read anywhere
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
              Pull on another PC or open the web viewer. Edits stay in the desktop app.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};