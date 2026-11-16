import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight mb-3">
            Privacy policy
          </h1>

          <p className="text-base text-[#5A6662] mb-12">
            Short version: we run no server and collect nothing about you.
          </p>

          <div className="space-y-10 text-sm text-[#5A6662] leading-relaxed">
            {/* What the desktop app handles */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                What the desktop app handles
              </h2>
              <p>
                Your files stay on your PC and, encrypted, in your own Google Drive. The Google sign-in token is stored strictly on your device. The app sends no analytics, telemetry, or crash reports.
              </p>
            </section>

            {/* The web viewer */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                The web viewer
              </h2>
              <p>
                No accounts, no cookies, no analytics. Keys and decrypted files stay in your browser tab's volatile RAM. The viewer communicates directly with Google's APIs via client-side OAuth tokens. The site is hosted statically and maintains zero user databases.
              </p>
            </section>

            {/* Google data we access */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Google data we access
              </h2>
              <p>
                Only the <code className="text-xs bg-[#E2E6E3] px-1.5 py-0.5 rounded font-mono text-[#14201C]">drive.file</code> permission: files this app created or you choose to open with it. Your Google account email is used purely on screen for account identification and is never transmitted to any third party.
              </p>
            </section>

            {/* What we do not collect */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                What we do not collect
              </h2>
              <p>
                File contents, file names, passwords, recovery keys, personal identities, or usage analytics.
              </p>
            </section>

            {/* Your choices */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Your choices
              </h2>
              <p>
                Disconnect Google in Settings, remove access in your Google account security settings, or delete the SecureWorkspace folder in your Google Drive at any time.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]">
              <h2 className="text-lg font-bold text-[#14201C]">
                Contact &amp; Questions
              </h2>
              <p>
                Questions or concerns? Please open a discussion or issue on our{' '}
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