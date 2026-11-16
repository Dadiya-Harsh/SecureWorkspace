import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const LimitsCallout: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h2 className="text-3xl font-bold text-[#14201C] tracking-tight mb-10">
        The honest limits
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {/* Item 1 */}
        <div className="pt-4 border-t border-[#CAD2CD] space-y-1.5">
          <h3 className="text-sm font-bold text-[#14201C]">
            It is a beta.
          </h3>
          <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
            Keep your original files until you have tested a restore.
          </p>
        </div>

        {/* Item 2 */}
        <div className="pt-4 border-t border-[#CAD2CD] space-y-1.5">
          <h3 className="text-sm font-bold text-[#14201C]">
            Google still sees sizes and timing.
          </h3>
          <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
            Never contents, names or folders.
          </p>
        </div>

        {/* Item 3 */}
        <div className="pt-4 border-t border-[#CAD2CD] space-y-1.5">
          <h3 className="text-sm font-bold text-[#14201C]">
            Opened files are plaintext on your PC.
          </h3>
          <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
            Malware on your device can read them.
          </p>
        </div>

        {/* Item 4 */}
        <div className="pt-4 border-t border-[#CAD2CD] space-y-1.5">
          <h3 className="text-sm font-bold text-[#14201C]">
            No password and no recovery key means no files.
          </h3>
          <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
            Nobody can reset them, including us.
          </p>
        </div>
      </div>

      <div className="pt-8">
        <Link
          to="/security"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F5C4D] hover:underline"
        >
          <span>Read the full security model</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};