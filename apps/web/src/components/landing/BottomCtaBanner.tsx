import React from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '../common/Reveal';

export const BottomCtaBanner: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <Reveal className="bg-[#0F5C4D] text-white rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Try the beta.
        </h2>

        <p className="text-sm sm:text-base text-white/80 max-w-md">
          Free and open source. About 19 MB.
        </p>

        <div className="pt-2">
          <Link to="/download">
            <button className="bg-white hover:bg-[#F2F5F2] text-[#0F5C4D] px-8 py-3.5 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm hover:shadow hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Download for Windows
            </button>
          </Link>
        </div>

        <div className="pt-2">
          <Link
            to="/download"
            className="text-xs text-white/70 hover:text-white underline font-medium transition-colors"
          >
            v0.1.0 · Windows 11 · Checksums and install notes →
          </Link>
        </div>
      </Reveal>
    </section>
  );
};
