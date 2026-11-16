import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* Left Column: Value Proposition */}
        <div className="lg:col-span-6 pr-0 lg:pr-4 space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#DCECE6] text-[#0F5C4D] text-xs font-medium">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Free · Open source · Windows beta</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#111816] tracking-tight leading-[1.1]">
            Google Drive storage<br />
            that Google can't<br />
            read.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#5A6662] leading-relaxed max-w-lg">
            SecureWorkspace encrypts your files on your PC before they reach Drive. You keep the password and a 24-word recovery key. No account with us, and no server that stores your data.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
            <Link to="/download">
              <button className="w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white px-6 py-3 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm text-center">
                Download beta for Windows
              </button>
            </Link>
            <Link to="/how-it-works">
              <button className="w-full sm:w-auto bg-[#E5E9E5] hover:bg-[#DCE1DC] text-[#14201C] px-6 py-3 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer text-center">
                See how it works
              </button>
            </Link>
          </div>

          {/* Platform Caption */}
          <p className="text-xs text-[#5A6662] pt-1">
            v0.1.0 beta · Windows 11 · Apache 2.0
          </p>
        </div>

        {/* Right Column: App Window Screenshot / Preview Mockup */}
        <div className="lg:col-span-6 w-full">
          <div className="relative rounded-2xl overflow-hidden border border-[#D5DDD6] shadow-xl bg-white text-xs select-none">
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
                    <span className="font-bold text-[13px] text-white tracking-tight">SecureWorkspace</span>
                  </div>

                  <div className="space-y-0.5 text-[11px] font-medium text-[#8EA39C]">
                    <div className="px-2 py-1 rounded hover:text-white cursor-pointer">Dashboard</div>
                    <div className="px-2 py-1 rounded bg-[#1B2F29] text-white font-semibold cursor-pointer">Files</div>
                    <div className="px-2 py-1 rounded hover:text-white cursor-pointer">Sync</div>
                    <div className="px-2 py-1 rounded hover:text-white cursor-pointer">History</div>
                    <div className="px-2 py-1 rounded hover:text-white cursor-pointer">Backups</div>
                    <div className="px-2 py-1 rounded hover:text-white cursor-pointer">Workspaces</div>
                    <div className="px-2 py-1 rounded hover:text-white cursor-pointer">Settings</div>
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
                    <span className="font-bold text-sm text-[#14201C]">Workspace Files</span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded border border-[#CAD2CD] text-[#5A6662] bg-[#F8FAF8]">
                        + Open folder
                      </span>
                    </div>
                  </div>

                  {/* Mock Table */}
                  <div className="w-full">
                    <div className="grid grid-cols-12 text-[10px] font-semibold text-[#5A6662] pb-1.5 border-b border-[#F2F5F2]">
                      <span className="col-span-5">Name</span>
                      <span className="col-span-2">Size</span>
                      <span className="col-span-2">Modified</span>
                      <span className="col-span-3 text-right">Status</span>
                    </div>

                    <div className="divide-y divide-[#F2F5F2] text-[11px] font-mono">
                      <div className="grid grid-cols-12 py-2 items-center">
                        <span className="col-span-5 font-sans font-medium text-[#14201C] truncate">tax-return.xlsx</span>
                        <span className="col-span-2 text-[#5A6662]">1.2 MB</span>
                        <span className="col-span-2 text-[#5A6662]">14 Nov</span>
                        <span className="col-span-3 text-right">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans bg-[#E6F4EA] text-[#137333]">
                            ✓ In Drive
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-12 py-2 items-center">
                        <span className="col-span-5 font-sans font-medium text-[#14201C] truncate">test-100.docx</span>
                        <span className="col-span-2 text-[#5A6662]">2.1 MB</span>
                        <span className="col-span-2 text-[#5A6662]">14 Nov</span>
                        <span className="col-span-3 text-right">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans bg-[#E6F4EA] text-[#137333]">
                            ✓ In Drive
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-12 py-2 items-center">
                        <span className="col-span-5 font-sans font-medium text-[#14201C] truncate">test-101.pdf</span>
                        <span className="col-span-2 text-[#5A6662]">740 KB</span>
                        <span className="col-span-2 text-[#5A6662]">14 Nov</span>
                        <span className="col-span-3 text-right">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans bg-[#E6F4EA] text-[#137333]">
                            ✓ In Drive
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-12 py-2 items-center">
                        <span className="col-span-5 font-sans font-medium text-[#14201C] truncate">test-102.pdf</span>
                        <span className="col-span-2 text-[#5A6662]">1.5 MB</span>
                        <span className="col-span-2 text-[#5A6662]">14 Nov</span>
                        <span className="col-span-3 text-right">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans bg-[#E6F4EA] text-[#137333]">
                            ✓ In Drive
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#5A6662] flex items-center justify-between pt-2 border-t border-[#F2F5F2]">
                  <span>4 files · 5.54 MB total</span>
                  <span className="text-[#0F5C4D] font-medium font-sans">Synced with Google Drive</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};