import React from 'react';
import { PageLayout } from '../components/common/PageLayout';

export const ContactPage: React.FC = () => {
  return (
    <PageLayout>
      <main className="overflow-x-clip">
        {/* Top Header */}
        <section
          className="pt-16 sm:pt-24 pb-8 px-4 sm:px-6 border-b border-[#D3DAD5] bg-[#D3DAD5]/20"
          data-a="Contact"
          data-b="Open source, maintained on GitHub."
        >
          <div className="max-w-[1100px] mx-auto">
            <h1 className="text-[clamp(36px,5.4vw,60px)] font-extrabold tracking-tight text-[#14201C] leading-[1.05]">
              Contact
            </h1>
            <p className="text-[#4A5A54] text-lg sm:text-[19px] mt-2.5 max-w-[620px]">
              SecureWorkspace is an open source project maintained on GitHub.
            </p>
          </div>
        </section>

        {/* 3 Contact Cards */}
        <section
          className="py-14 sm:py-20 px-4 sm:px-6"
          data-a="Contact"
          data-b="Open source, maintained on GitHub."
        >
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Discussions & Issues */}
              <div className="bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-6 flex flex-col gap-3 shadow-2xs">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0F5C4D"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
                </svg>
                <h2 className="text-xl font-bold text-[#14201C] m-0">
                  GitHub Discussions &amp; Issues
                </h2>
                <p className="text-[#4A5A54] text-sm leading-relaxed flex-1">
                  Have a question, need assistance, or encountered an issue? Join the
                  community conversation on GitHub Discussions or open a GitHub Issue.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <a
                    href="https://github.com/Dadiya-Harsh/SecureWorkspace/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white font-semibold rounded-lg text-sm inline-flex items-center transition-colors"
                  >
                    GitHub Discussions
                  </a>
                  <a
                    href="https://github.com/Dadiya-Harsh/SecureWorkspace/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 bg-transparent hover:bg-[#D3DAD5]/40 text-[#14201C] border border-[#D3DAD5] font-semibold rounded-lg text-sm inline-flex items-center transition-colors"
                  >
                    GitHub Issue
                  </a>
                </div>
              </div>

              {/* Card 2: Source code */}
              <div className="bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-6 flex flex-col gap-3 shadow-2xs">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0F5C4D"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
                </svg>
                <h2 className="text-xl font-bold text-[#14201C] m-0">
                  Source code &amp; contributions
                </h2>
                <p className="text-[#4A5A54] text-sm leading-relaxed flex-1">
                  The complete cryptographic core, desktop application, and web
                  viewer are public and open source under Apache 2.0 on GitHub.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <a
                    href="https://github.com/Dadiya-Harsh/SecureWorkspace"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-5 bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white font-semibold rounded-lg text-sm inline-flex items-center transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>

              {/* Card 3: Maintainer */}
              <div className="bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-6 flex flex-col gap-3 shadow-2xs">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0F5C4D"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
                </svg>
                <h2 className="text-xl font-bold text-[#14201C] m-0">
                  Maintainer
                </h2>
                <p className="text-[#4A5A54] text-sm leading-relaxed flex-1">
                  Maintained by Harsh Dadiya.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <a
                    href="https://harshdadiya.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-5 bg-transparent hover:bg-[#D3DAD5]/40 text-[#14201C] border border-[#D3DAD5] font-semibold rounded-lg text-sm inline-flex items-center transition-colors"
                  >
                    harshdadiya.in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageLayout>
  );
};
