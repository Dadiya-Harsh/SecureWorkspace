import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History } from 'lucide-react';

export const MistakesSection: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight leading-tight">
            Mistakes are never final.
          </h2>

          <p className="text-base text-[#5A6662] leading-relaxed">
            Every push is saved as a version. Before the app overwrites anything on your PC, it saves a safety snapshot. Go back to any version, or restore a single file.
          </p>

          <div className="pt-2">
            <Link
              to="/how-it-works#going-back"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F5C4D] hover:underline"
            >
              <span>See version history</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Column: History & Snapshots Window Mockup */}
        <div className="lg:col-span-7 w-full">
          <div className="rounded-2xl border border-[#D5DDD6] bg-white shadow-xl p-5 sm:p-6 text-xs select-none">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EDF0ED]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0F5C4D]" />
                <span className="font-bold text-sm text-[#14201C]">
                  Workspace History &amp; Snapshots
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F5C4D] text-white">
                  Remote Versions (2)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDF0ED] text-[#5A6662]">
                  Local Safety Snapshots (0)
                </span>
              </div>
            </div>

            {/* Version 2 Card */}
            <div className="p-4 rounded-xl border border-[#D5DDD6] bg-[#F8FAF8] mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#14201C] text-xs">Version 2</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#DCECE6] text-[#0F5C4D]">
                      Current Workspace
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5A6662] mt-0.5 font-mono">
                    "test changes"
                  </div>
                </div>
                <span className="text-[10px] text-[#8EA39C]">14 Nov 11:22 pm</span>
              </div>

              {/* Snapshot Files in Version 2 */}
              <div className="bg-white rounded-lg border border-[#E2E6E3] p-2.5 divide-y divide-[#F2F5F2]">
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="font-mono text-[#14201C]">test-100.docx</span>
                  <span className="text-[#0F5C4D] font-medium text-[10px] hover:underline cursor-pointer">
                    • Restore File
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="font-mono text-[#14201C]">test-101.pdf</span>
                  <span className="text-[#0F5C4D] font-medium text-[10px] hover:underline cursor-pointer">
                    • Restore File
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="font-mono text-[#14201C]">test-102.pdf</span>
                  <span className="text-[#0F5C4D] font-medium text-[10px] hover:underline cursor-pointer">
                    • Restore File
                  </span>
                </div>
              </div>
            </div>

            {/* Version 1 Card */}
            <div className="p-3 rounded-xl border border-[#E2E6E3] bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-[#14201C] text-xs">Version 1</span>
                <span className="text-[11px] text-[#5A6662] ml-2 font-mono">
                  Initial commit
                </span>
              </div>
              <span className="text-[10px] text-[#8EA39C]">14 Nov 09:15 pm</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};