import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight mb-3">
            Terms and conditions
          </h1>

          <p className="text-base text-[#5A6662] mb-12">
            Plain-language terms for an open-source, client-side encryption tool.
          </p>

          <div className="space-y-10 text-sm text-[#5A6662] leading-relaxed">
            {/* Beta software */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Beta software
              </h2>
              <p>
                Provided as is, without warranty of any kind. Keep your original files backed up until you have tested and verified a restore.
              </p>
            </section>

            {/* Your password and recovery key */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Your password and recovery key
              </h2>
              <p>
                They are yours alone. Because SecureWorkspace operates with zero server infrastructure, we cannot reset, unwrap, or recover your keys. If you lose both your master password and your 24-word recovery phrase, your data is mathematically unrecoverable.
              </p>
            </section>

            {/* Open source */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Open source
              </h2>
              <p>
                The source code is licensed under the Apache License 2.0. The license text governs your use, modification, and distribution of the code.
              </p>
            </section>

            {/* Google services */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Google services
              </h2>
              <p>
                Your use of Google Drive and Google OAuth authentication is governed by Google's own terms of service and privacy policies.
              </p>
            </section>

            {/* Acceptable use */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Acceptable use
              </h2>
              <p>
                Do not use the desktop app or web viewer to store, transmit, or access data you are not legally authorized to access.
              </p>
            </section>

            {/* Liability */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Limitation of liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, the authors and contributors of SecureWorkspace shall not be liable for any direct, indirect, incidental, or consequential damages, including loss of data, arising out of the use or inability to use this software.
              </p>
            </section>

            {/* Changes and contact */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]">
              <h2 className="text-lg font-bold text-[#14201C]">
                Changes &amp; Inquiries
              </h2>
              <p>
                These terms may be updated alongside open-source releases. For inquiries, please participate via{' '}
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F5C4D] font-medium hover:underline"
                >
                  GitHub Discussions
                </a>.
              </p>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};