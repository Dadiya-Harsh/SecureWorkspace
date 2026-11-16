import React from 'react';

export const HowItWorks: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-24 border-y border-[#E2E6E3] scroll-mt-12" id="how-it-works">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-[#14201C] tracking-tight mb-12">
          How it works
        </h2>

        {/* 3-Step Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center mb-12">
          {/* Node 1: Your PC */}
          <div className="md:col-span-3 bg-white rounded-xl p-5 border border-[#CAD2CD] shadow-2xs">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-[#5A6662] uppercase mb-1">
              YOUR PC
            </div>
            <div className="text-sm font-bold text-[#14201C] mb-1 font-mono">
              tax-return.xlsx
            </div>
            <div className="text-xs text-[#5A6662]">
              Readable only here
            </div>
          </div>

          {/* Connector 1: Locked on your PC */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0">
            <div className="w-full relative flex items-center justify-center">
              <div className="hidden md:block w-full border-t-2 border-dashed border-[#CAD2CD]"></div>
              <span className="md:absolute text-[10px] font-mono font-medium text-[#5A6662] bg-white px-2 py-0.5 whitespace-nowrap text-center">
                Locked on your PC
              </span>
            </div>
          </div>

          {/* Node 2: Your Google Drive */}
          <div className="md:col-span-3 bg-white rounded-xl p-5 border border-[#CAD2CD] shadow-2xs">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-[#5A6662] uppercase mb-1">
              YOUR GOOGLE DRIVE
            </div>
            <div className="text-sm font-bold text-[#14201C] mb-1 font-mono truncate">
              objects/9f3a...c1.bin
            </div>
            <div className="text-xs text-[#5A6662]">
              Random-looking to Google
            </div>
          </div>

          {/* Connector 2: Unlocked in your browser */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0">
            <div className="w-full relative flex items-center justify-center">
              <div className="hidden md:block w-full border-t-2 border-dashed border-[#CAD2CD]"></div>
              <span className="md:absolute text-[10px] font-mono font-medium text-[#5A6662] bg-white px-2 py-0.5 whitespace-nowrap text-center">
                Unlocked in your browser
              </span>
            </div>
          </div>

          {/* Node 3: Browser Tab */}
          <div className="md:col-span-3 bg-white rounded-xl p-5 border border-[#CAD2CD] shadow-2xs">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-[#5A6662] uppercase mb-1">
              BROWSER TAB
            </div>
            <div className="text-sm font-bold text-[#14201C] mb-1">
              Read-only view
            </div>
            <div className="text-xs text-[#5A6662]">
              Gone when you lock
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