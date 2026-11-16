import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History, Laptop, FileText } from 'lucide-react';

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

        {/* Right Column: Two-Column History & Snapshots Window Mockup */}
        <div className="lg:col-span-7 w-full">
          <div className="rounded-2xl border border-[#D5DDD6] bg-white shadow-xl p-5 sm:p-6 text-xs select-none">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EDF0ED]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0F5C4D]" />
                <div>
                  <span className="font-bold text-sm text-[#14201C] block leading-tight">
                    Workspace History &amp; Snapshots
                  </span>
                  <span className="text-[10px] text-[#8EA39C] hidden sm:block">
                    Browse remote versions, rollback whole states, or restore single files from pre-pull snapshots.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F5C4D] text-white">
                  Remote Versions (2)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDF0ED] text-[#5A6662]">
                  Local Safety Snapshots (0)
                </span>
              </div>
            </div>

            {/* Split View: Left Timeline (1/3) + Right Details (2/3) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Version Timeline */}
              <div className="md:col-span-5 space-y-2.5 border-r md:border-[#EDF0ED] pr-0 md:pr-3">
                <div className="text-[10px] font-bold text-[#8EA39C] uppercase tracking-wider px-1">
                  Version Timeline
                </div>

                {/* Selected Version 2 */}
                <div className="p-3 rounded-xl border border-[#CAD2CD] bg-[#F8FAF8] shadow-2xs space-y-2 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#14201C] text-xs">Version 2</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#DCECE6] text-[#0F5C4D]">
                        HEAD
                      </span>
                    </div>
                    <span className="text-[9px] text-[#8EA39C]">14 Nov 11:32 pm</span>
                  </div>

                  <div className="text-[11px] text-[#14201C] font-medium">
                    test changes
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#5A6662] pt-1">
                    <span className="flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-[#8EA39C]" /> desktop
                    </span>
                    <span className="text-[#8EA39C]">3 files</span>
                  </div>
                </div>

                {/* Version 1 */}
                <div className="p-3 rounded-xl border border-[#EDF0ED] bg-white hover:bg-[#F8FAF8] transition-colors space-y-2 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#5A6662] text-xs">Version 1</span>
                    <span className="text-[9px] text-[#8EA39C]">14 Nov 07:55 pm</span>
                  </div>

                  <div className="text-[11px] text-[#5A6662]">
                    Version commit
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#5A6662] pt-1">
                    <span className="flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-[#8EA39C]" /> desktop
                    </span>
                    <span className="text-[#8EA39C]">3 files</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Version Detail */}
              <div className="md:col-span-7 space-y-3.5 pl-0 md:pl-1">
                {/* Header of Version 2 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#14201C] text-sm">Version 2</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCECE6] text-[#0F5C4D]">
                      Current Workspace
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8EA39C]">
                    Committed on 14 Nov, 11:32 pm by device desktop
                  </div>
                </div>

                {/* Commit Message Box */}
                <div className="bg-[#F8FAF8] border border-[#E2E6E3] rounded-lg px-3 py-2 text-[11px] font-mono text-[#14201C]">
                  "test changes"
                </div>

                {/* Snapshot Files Table */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#8EA39C] uppercase tracking-wider px-1">
                    <span>Snapshot Files (3)</span>
                    <span>Action</span>
                  </div>

                  <div className="bg-white rounded-lg border border-[#E2E6E3] divide-y divide-[#F2F5F2]">
                    {/* File 1 */}
                    <div className="flex items-center justify-between p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-[#0F5C4D] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-mono text-[#14201C] text-[11px] truncate">test-101.txt</div>
                          <div className="text-[9px] text-[#8EA39C] font-mono">35 B · sha d05ed695da...</div>
                        </div>
                      </div>
                      <button className="shrink-0 px-2.5 py-1 rounded border border-[#CAD2CD] text-[10px] font-medium text-[#14201C] bg-[#F8FAF8] hover:bg-[#EDF0ED] transition-colors cursor-pointer">
                        ⤺ Restore File
                      </button>
                    </div>

                    {/* File 2 */}
                    <div className="flex items-center justify-between p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-[#0F5C4D] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-mono text-[#14201C] text-[11px] truncate">test-102.docx</div>
                          <div className="text-[9px] text-[#8EA39C] font-mono">5 KB · sha 826d0ee37f...</div>
                        </div>
                      </div>
                      <button className="shrink-0 px-2.5 py-1 rounded border border-[#CAD2CD] text-[10px] font-medium text-[#14201C] bg-[#F8FAF8] hover:bg-[#EDF0ED] transition-colors cursor-pointer">
                        ⤺ Restore File
                      </button>
                    </div>

                    {/* File 3 */}
                    <div className="flex items-center justify-between p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-[#0F5C4D] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-mono text-[#14201C] text-[11px] truncate">test-102.pdf</div>
                          <div className="text-[9px] text-[#8EA39C] font-mono">15 KB · sha b3ca5f5364...</div>
                        </div>
                      </div>
                      <button className="shrink-0 px-2.5 py-1 rounded border border-[#CAD2CD] text-[10px] font-medium text-[#14201C] bg-[#F8FAF8] hover:bg-[#EDF0ED] transition-colors cursor-pointer">
                        ⤺ Restore File
                      </button>
                    </div>
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