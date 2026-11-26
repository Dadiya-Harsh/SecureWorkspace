import React, { useState } from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { FileCard, SAMPLE_FILES } from '../components/common/FileCard';
import { KeyLens } from '../components/common/KeyLens';
import { TextDecode } from '../components/common/TextDecode';
import { MarchingDash } from '../components/common/MarchingDash';

export const PrototypeDemoPage: React.FC = () => {
  // FileCard demo state
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [allFlipped, setAllFlipped] = useState(false);

  const toggleCard = (index: number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleAllCards = () => {
    const next = !allFlipped;
    setAllFlipped(next);
    const updated: Record<number, boolean> = {};
    SAMPLE_FILES.forEach((_, i) => {
      updated[i] = next;
    });
    setFlippedCards(updated);
  };

  // TextDecode demo state
  const [isDecoded, setIsDecoded] = useState(false);
  const sampleLines = [
    'Q3_tax_return.xlsx',
    'Passport_scan.pdf',
    'Lease_agreement.pdf',
  ];

  // MarchingDash demo state
  const [dashActive, setDashActive] = useState(true);
  const [showDot, setShowDot] = useState(true);

  return (
    <PageLayout>
      <main className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-12 flex flex-col gap-16">
        {/* Intro */}
        <section
          className="space-y-4"
          data-a="Design System"
          data-b="Reusable pieces matching prototype"
        >
          <div className="inline-block text-[12px] font-bold px-[10px] py-[3px] rounded-[4px] bg-[#D9EADF] text-[#0B4F40]">
            Prototype Components
          </div>
          <h1 className="text-[clamp(32px,5vw,52px)] font-extrabold tracking-tight text-[#14201C] leading-[1.05]">
            Shared Prototype Components
          </h1>
          <p className="text-[17px] text-[#4A5A54] max-w-[680px]">
            The exact design tokens, header, footer, and four reusable motion
            primitives built according to the prototype specification.
          </p>
        </section>

        {/* 1. FileCard */}
        <section
          className="space-y-6 bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-6 sm:p-8 shadow-[0_10px_24px_rgba(15,29,25,.06)]"
          data-a="1. FileCard"
          data-b="150x108px tactile cards with 3D flip"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D3DAD5] pb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#14201C]">1. FileCard</h2>
              <p className="text-sm text-[#4A5A54] mt-1">
                150x108 px, 10 px radius, 3D flip to dark #2B3833 sealed back
                with mint hash. Click any card to flip.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAllCards}
              className="h-10 px-4 bg-[#0F5C4D] hover:bg-[#0C4B3E] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {allFlipped ? 'Show Plaintext (Front)' : 'Seal All (Back)'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center py-4">
            {SAMPLE_FILES.map((file, i) => (
              <div key={file.name} className="flex flex-col items-center gap-2">
                <FileCard
                  file={file}
                  flipped={flippedCards[i] ?? allFlipped}
                  onClick={() => toggleCard(i)}
                  className="cursor-pointer hover:-translate-y-1 transition-transform"
                />
                <span className="text-[11px] text-[#4A5A54] font-medium">
                  {file.kind.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. KeyLens */}
        <section
          className="space-y-6"
          data-a="2. KeyLens"
          data-b="Interactive circular lens reveals sealed files"
        >
          <div className="border-b border-[#D3DAD5] pb-4">
            <h2 className="text-2xl font-bold text-[#14201C]">2. KeyLens</h2>
            <p className="text-sm text-[#4A5A54] mt-1">
              Framed area with dark sealed tiles on the bottom and readable tiles
              on top clipped to 90px circle. 180px ring with &ldquo;your key&rdquo;
              pill. Drifts in an oval when idle; touch-action: pan-y preserves vertical
              scroll.
            </p>
          </div>

          <KeyLens
            heading="Google stores sealed boxes. Only your key reads them."
            lead="Move your cursor (or touch/drag) over the folder. The key shows what is inside. To anyone else, every file is the same random-looking box."
          />
        </section>

        {/* 3. TextDecode */}
        <section
          className="space-y-6 bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-6 sm:p-8 shadow-[0_10px_24px_rgba(15,29,25,.06)]"
          data-a="3. TextDecode"
          data-b="Scrambled characters resolve left-to-right"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D3DAD5] pb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#14201C]">3. TextDecode</h2>
              <p className="text-sm text-[#4A5A54] mt-1">
                Scrambled a-z0-9 characters decode left to right at 28 ms per
                character. Rows staggered by ~110 ms. Running backwards
                re-scrambles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDecoded(!isDecoded)}
              className="h-10 px-5 bg-[#0F5C4D] hover:bg-[#0C4B3E] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isDecoded ? '🔒 Scramble Files' : '🔓 Decrypt / Unlock'}
            </button>
          </div>

          <div className="bg-[#EDF0ED] border border-[#D3DAD5] rounded-xl p-5 max-w-lg space-y-3">
            <div className="text-xs font-bold text-[#4A5A54] uppercase tracking-wider mb-2">
              Encrypted Folder Manifest
            </div>
            {sampleLines.map((line, idx) => (
              <div
                key={line}
                className="flex items-center justify-between bg-[#F8FAF8] p-3 rounded-lg border border-[#D3DAD5]"
              >
                <TextDecode
                  text={line}
                  decoded={isDecoded}
                  rowIndex={idx}
                  charDurationMs={28}
                  rowDelayMs={110}
                  className="text-sm font-semibold text-[#14201C]"
                />
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    isDecoded
                      ? 'bg-[#D9EADF] text-[#0B4F40]'
                      : 'bg-[#2B3833] text-[#6FD0B8]'
                  }`}
                >
                  {isDecoded ? 'open' : 'sealed'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. MarchingDash */}
        <section
          className="space-y-6 bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-6 sm:p-8 shadow-[0_10px_24px_rgba(15,29,25,.06)]"
          data-a="4. MarchingDash"
          data-b="2px dashed line with travelling dot"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D3DAD5] pb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#14201C]">
                4. MarchingDash
              </h2>
              <p className="text-sm text-[#4A5A54] mt-1">
                2px dashed line (6px dash, 6px gap) pattern moving 12px every 0.7s.
                Green when active, muted when inactive. Optional 8px mint dot
                travelling every 1.5s.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDashActive(!dashActive)}
                className={`h-10 px-4 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                  dashActive
                    ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                    : 'bg-transparent text-[#14201C] border-[#D3DAD5]'
                }`}
              >
                {dashActive ? 'Active (Green)' : 'Inactive (Muted)'}
              </button>
              <button
                type="button"
                onClick={() => setShowDot(!showDot)}
                className="h-10 px-4 bg-transparent border border-[#D3DAD5] text-[#14201C] text-sm font-semibold rounded-lg hover:bg-[#D3DAD5]/30 transition-colors cursor-pointer"
              >
                {showDot ? 'Hide Mint Dot' : 'Show Mint Dot'}
              </button>
            </div>
          </div>

          <div className="space-y-8 py-4">
            {/* Horizontal Line Demo */}
            <div>
              <span className="text-xs font-bold text-[#4A5A54] block mb-4">
                HORIZONTAL ORIENTATION (DESKTOP FLOW)
              </span>
              <div className="flex items-center gap-4 bg-[#EDF0ED] p-6 rounded-xl border border-[#D3DAD5]">
                <div className="px-4 py-2 bg-[#F8FAF8] border border-[#D3DAD5] rounded-lg font-bold text-sm text-[#14201C]">
                  Your Password
                </div>
                <div className="flex-1 min-w-[120px]">
                  <MarchingDash
                    active={dashActive}
                    orientation="horizontal"
                    hasDot={showDot}
                    label="Argon2id"
                  />
                </div>
                <div className="px-4 py-2 bg-[#F8FAF8] border border-[#D3DAD5] rounded-lg font-bold text-sm text-[#14201C]">
                  Master Key
                </div>
                <div className="flex-1 min-w-[120px]">
                  <MarchingDash
                    active={dashActive}
                    orientation="horizontal"
                    hasDot={showDot}
                    label="XChaCha20-Poly1305"
                  />
                </div>
                <div className="px-4 py-2 bg-[#2B3833] text-[#6FD0B8] border border-[#2B3833] rounded-lg font-bold text-sm">
                  Encrypted Files
                </div>
              </div>
            </div>

            {/* Vertical Line Demo */}
            <div>
              <span className="text-xs font-bold text-[#4A5A54] block mb-4">
                VERTICAL ORIENTATION (MOBILE FLOW)
              </span>
              <div className="flex flex-col items-center gap-2 bg-[#EDF0ED] p-6 rounded-xl border border-[#D3DAD5] max-w-xs mx-auto">
                <div className="px-4 py-2 bg-[#F8FAF8] border border-[#D3DAD5] rounded-lg font-bold text-sm text-[#14201C]">
                  Desktop App (PC)
                </div>
                <div className="h-16 py-1">
                  <MarchingDash
                    active={dashActive}
                    orientation="vertical"
                    hasDot={showDot}
                  />
                </div>
                <div className="px-4 py-2 bg-[#F8FAF8] border border-[#D3DAD5] rounded-lg font-bold text-sm text-[#14201C]">
                  Google Drive (Encrypted)
                </div>
                <div className="h-16 py-1">
                  <MarchingDash
                    active={dashActive}
                    orientation="vertical"
                    hasDot={showDot}
                  />
                </div>
                <div className="px-4 py-2 bg-[#F8FAF8] border border-[#D3DAD5] rounded-lg font-bold text-sm text-[#14201C]">
                  Web Viewer (Decrypted in RAM)
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageLayout>
  );
};
