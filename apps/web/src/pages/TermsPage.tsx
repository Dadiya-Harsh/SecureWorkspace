import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        {/* Top Amber Review Banner */}
        <div className="w-full bg-[#FCE7C5] text-[#593610] text-xs py-2 px-4 sm:px-6 font-medium text-left">
          Draft for review. Not legal advice. Items in [brackets] must be confirmed before publishing.
        </div>

        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight mb-3">
            Terms and conditions
          </h1>

          <p className="text-base text-[#5A6662] mb-12">
            Plain-language terms for a beta, open-source tool.
          </p>

          <div className="space-y-10 text-sm text-[#5A6662] leading-relaxed">
            {/* Beta software */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Beta software
              </h2>
              <p>
                Provided as is, without warranty. Keep your original files until you have tested a restore.
              </p>
            </section>

            {/* Your password and recovery key */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Your password and recovery key
              </h2>
              <p>
                They are yours alone. We cannot reset or recover them. If you lose both, your data cannot be opened by anyone.
              </p>
            </section>

            {/* Open source */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Open source
              </h2>
              <p>
                The code is released under Apache 2.0. The license text governs use of the code.
              </p>
            </section>

            {/* Google services */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Google services
              </h2>
              <p>
                Your use of Google Drive and Google sign-in is under Google's own terms.
              </p>
            </section>

            {/* Acceptable use */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Acceptable use
              </h2>
              <p>
                Do not use the software or the viewer to access data you are not allowed to access.
              </p>
            </section>

            {/* Liability */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Liability
              </h2>
              <p>
                To the extent the law allows, [name] is not liable for lost data or other damages from using the software. [Have this clause reviewed.]
              </p>
            </section>

            {/* Changes and contact */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]">
              <h2 className="text-lg font-bold text-[#14201C]">
                Changes and contact
              </h2>
              <p>
                Terms may change; the date is shown at the top.{' '}
                <a
                  href="mailto:contact@secureworkspace.local"
                  className="text-[#0F5C4D] font-medium hover:underline"
                >
                  [contact email]
                </a>
              </p>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};