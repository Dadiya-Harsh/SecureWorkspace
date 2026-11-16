import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight mb-3">
            How it works
          </h1>

          <p className="text-base text-[#5A6662] mb-12">
            Three steps. No account with us and no server.
          </p>

          <div className="space-y-10 text-sm text-[#5A6662] leading-relaxed">
            {/* Step 1 */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                1. Create a vault
              </h2>
              <p>
                Pick a folder on your PC, set a master password, and save your 24-word recovery key. The app makes you type it back to prove you saved it.
              </p>
            </section>

            {/* Step 2 */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                2. Push to your Google Drive
              </h2>
              <p>
                Files are encrypted on your PC before upload. Each push becomes a numbered version. Google stores encrypted files and never gets your password or key.
              </p>
            </section>

            {/* Step 3 */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                3. Read it anywhere
              </h2>
              <p>
                Pull on another PC, or open the read-only web viewer: sign in with Google, enter your password, and your browser decrypts the file. Changes are made in the desktop app.
              </p>
            </section>

            {/* Going back */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]" id="going-back">
              <h2 className="text-lg font-bold text-[#14201C]">
                Going back
              </h2>
              <p>
                Every push is a version you can return to. Before anything is overwritten, the app saves a local safety snapshot.
              </p>
            </section>

            {/* If you lose both */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]">
              <h2 className="text-lg font-bold text-[#14201C]">
                If you lose both
              </h2>
              <p>
                If you lose your password and your recovery key, nobody can open your files. That is the price of zero knowledge.
              </p>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};