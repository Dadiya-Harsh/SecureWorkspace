import React from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '../common/Reveal';

export const DarkViewerBanner: React.FC = () => {
  return (
    <section className="bg-[#0B1E19] text-white py-12 sm:py-16">
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Already have a vault? Read it in any browser.
          </h2>
          <p className="text-sm text-[#A3B8B0] leading-relaxed">
            Read-only. Files decrypt in your browser tab and no server stores your data.
          </p>
        </div>

        <Link to="/viewer" className="shrink-0">
          <button className="bg-white hover:bg-[#F2F5F2] text-[#0B1E19] px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150 cursor-pointer shadow-sm hover:shadow hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Open web viewer
          </button>
        </Link>
      </Reveal>
    </section>
  );
};
