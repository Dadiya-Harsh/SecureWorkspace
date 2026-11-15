import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20" id="security">
      {/* 3 Feature Cards in One Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 sm:mb-8">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E6E3] shadow-xs hover:border-[#CAD2CD] hover:shadow-sm hover:-translate-y-1 transition-all duration-200">
          <div className="text-xs font-mono text-[#0F5C4D] font-semibold mb-2">
            GIT-LIKE COMMITS
          </div>
          <h3 className="text-base font-bold text-[#14201C] mb-2">
            Version history
          </h3>
          <p className="text-sm text-[#5A6662] leading-relaxed">
            Go back to any push. Nothing is overwritten without a safety snapshot.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E6E3] shadow-xs hover:border-[#CAD2CD] hover:shadow-sm hover:-translate-y-1 transition-all duration-200">
          <div className="text-xs font-mono text-[#0F5C4D] font-semibold mb-2">
            PORTABLE VAULTS
          </div>
          <h3 className="text-base font-bold text-[#14201C] mb-2">
            Offline backup
          </h3>
          <p className="text-sm text-[#5A6662] leading-relaxed">
            Encrypted copy on your own external drive or USB stick without touching the cloud.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E6E3] shadow-xs hover:border-[#CAD2CD] hover:shadow-sm hover:-translate-y-1 transition-all duration-200">
          <div className="text-xs font-mono text-amber-700 font-semibold mb-2">
            TRANSPARENT PRIVACY
          </div>
          <h3 className="text-base font-bold text-[#14201C] mb-2">
            Honest limits
          </h3>
          <p className="text-sm text-[#5A6662] leading-relaxed">
            Drive still sees sizes and timing. Open files are plaintext on your
            PC. No security theater.
          </p>
        </div>
      </div>

      {/* Horizontal Web Viewer Callout Card */}
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 md:p-9 border border-[#E2E6E3] shadow-xs hover:border-[#CAD2CD] hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#0F5C4D]">
            <ShieldCheck className="w-4 h-4 text-[#0F5C4D]" />
            <span>ZERO SERVERS · CLIENT-SIDE WASM</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#14201C]">
            Read-only web viewer
          </h3>
          <p className="text-sm text-[#5A6662] leading-relaxed">
            Unlock and decrypt spreadsheets, PDFs, Word docs, code, and images in
            your browser RAM. Nothing is stored on a server.
          </p>
        </div>

        <Link to="/viewer" className="w-full sm:w-auto shrink-0">
          <button className="w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white px-6 py-3.5 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm hover:-translate-y-0.5 whitespace-nowrap text-center flex items-center justify-center gap-2">
            <span>Open web viewer</span>
            <ArrowRight className="w-4 h-4 text-[#3FB89A]" />
          </button>
        </Link>
      </div>
    </section>
  );
};
