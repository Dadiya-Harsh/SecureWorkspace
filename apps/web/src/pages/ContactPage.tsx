import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight mb-3">
            Contact
          </h1>

          <p className="text-base text-[#5A6662] mb-12">
            SecureWorkspace is an open-source project maintained on GitHub.
          </p>

          <div className="space-y-10 text-sm text-[#5A6662] leading-relaxed">
            {/* Discussions & Community */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                GitHub Discussions &amp; Issues
              </h2>
              <p>
                Have a question, need assistance, or encountered an issue? Join the community conversation on{' '}
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F5C4D] font-medium hover:underline"
                >
                  GitHub Discussions
                </a>{' '}
                or open a{' '}
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F5C4D] font-medium hover:underline"
                >
                  GitHub Issue
                </a>.
              </p>
            </section>

            {/* Source Code */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]">
              <h2 className="text-lg font-bold text-[#14201C]">
                Source code &amp; contributions
              </h2>
              <p>
                The complete cryptographic core, desktop application, and web viewer are public and open source under Apache 2.0 on{' '}
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F5C4D] font-medium hover:underline"
                >
                  GitHub
                </a>.
              </p>
            </section>

            {/* Maintainer */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]">
              <h2 className="text-lg font-bold text-[#14201C]">
                Maintainer
              </h2>
              <p>
                Maintained by Harsh Dadiya ({' '}
                <a
                  href="https://harshdadiya.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F5C4D] font-medium hover:underline"
                >
                  harshdadiya.in
                </a>{' '}
                ).
              </p>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};