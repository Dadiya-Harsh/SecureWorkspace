import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';

export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight mb-3">
            Security model
          </h1>

          <p className="text-base text-[#5A6662] mb-12">
            What is protected, what is not, and what you are trusting.
          </p>

          <div className="space-y-10 text-sm text-[#5A6662] leading-relaxed">
            {/* What Google can see */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                What Google can see
              </h2>
              <p>
                File sizes, timing, your account, and a folder called SecureWorkspace. It <strong>cannot</strong> see file contents, file names, folders, your password or your keys.
              </p>
            </section>

            {/* How the keys work */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                How the keys work
              </h2>
              <p>
                Your password goes through Argon2id to unlock a random master key. The 24-word recovery phrase unlocks the same key. Files use XChaCha20-Poly1305 from libsodium. No home-made crypto.
              </p>
            </section>

            {/* No server of ours */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                No server of ours
              </h2>
              <p>
                No accounts, no database. The app and the viewer talk to Google directly.
              </p>
            </section>

            {/* Web viewer: what you trust */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[#14201C]">
                Web viewer: what you trust
              </h2>
              <p>
                The page decrypts in your browser, but its code comes from this site on every visit. If the site were ever compromised, a bad script could steal your password. We use static hosting, a strict content policy and pinned builds to reduce that. Use the viewer on a device you trust.
              </p>
            </section>

            {/* Known limits */}
            <section className="space-y-2" id="limits">
              <h2 className="text-lg font-bold text-[#14201C]">
                Known limits
              </h2>
              <p>
                Opened files are plaintext on your screen and in memory. Malware on your device can read them. Chrome's PDF viewer has its own Download and Print buttons. This is beta software and has not had an independent security review.
              </p>
            </section>

            {/* Report a problem */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]">
              <h2 className="text-lg font-bold text-[#14201C]">
                Report a problem
              </h2>
              <p>
                Report problems and join the discussion on{' '}
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