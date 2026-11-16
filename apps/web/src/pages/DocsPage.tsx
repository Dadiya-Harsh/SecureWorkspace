import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { Link } from 'react-router-dom';

export const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight mb-3">
            Documentation
          </h1>

          <p className="text-base text-[#5A6662] mb-12">
            Guides for setup, daily use, recovery, and offline backups.
          </p>

          <div className="space-y-10 text-sm text-[#5A6662] leading-relaxed">
            {/* Quick start */}
            <section className="space-y-4" id="quick-start">
              <h2 className="text-lg font-bold text-[#14201C]">
                Quick start
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>1. Create your vault:</strong> Download and install the desktop app. Pick a local directory, choose a strong master password, and write down your 24-word BIP-39 recovery key on paper.
                </p>
                <p>
                  <strong>2. Edit files natively:</strong> While your vault is unlocked on your PC, files reside in your local working folder. Open, save, and edit them directly in Microsoft Office, Notepad, or VS Code.
                </p>
                <p>
                  <strong>3. Push to Google Drive:</strong> When you finish editing, click <em>Push Changes</em>. Files are chunked and encrypted with libsodium XChaCha20-Poly1305 before uploading. Google only sees random-looking ciphertext blocks.
                </p>
                <p>
                  <strong>4. Read in any browser:</strong> Open the <Link to="/viewer" className="text-[#0F5C4D] font-medium hover:underline">Web Viewer</Link> on any computer or mobile device. Sign in with Google, enter your password, and read your decrypted documents directly in your browser tab.
                </p>
              </div>
            </section>

            {/* Emergency recovery */}
            <section className="space-y-3 pt-4 border-t border-[#CAD2CD]" id="recovery">
              <h2 className="text-lg font-bold text-[#14201C]">
                Emergency recovery guide
              </h2>
              <p>
                Your <code className="text-xs bg-[#E2E6E3] px-1.5 py-0.5 rounded font-mono text-[#14201C]">workspace.header</code> uses dual-path envelope encryption. Your master key is wrapped twice: once with your password, and once with your 24-word recovery phrase.
              </p>
              <p>
                If you ever lose or forget your master password, or need to restore your vault onto a new computer:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>On the unlock screen (desktop or web viewer), click <strong>"Use recovery key instead"</strong>.</li>
                <li>Enter your 24-word phrase separated by single spaces.</li>
                <li>The app derives the key via Argon2id, verifies the checksum, and unlocks your vault.</li>
              </ol>
            </section>

            {/* Version history & safety snapshots */}
            <section className="space-y-3 pt-4 border-t border-[#CAD2CD]" id="version-history">
              <h2 className="text-lg font-bold text-[#14201C]">
                Version history &amp; snapshots
              </h2>
              <p>
                Every push to Google Drive creates an immutable numbered version. You can roll back your entire workspace to a previous version or restore a single file from the History tab at any time.
              </p>
              <p>
                Before any pull or revert overwrites files on your PC, SecureWorkspace creates a local safety snapshot so you can never accidentally lose unpushed work.
              </p>
            </section>

            {/* Offline backups */}
            <section className="space-y-3 pt-4 border-t border-[#CAD2CD]" id="backups">
              <h2 className="text-lg font-bold text-[#14201C]">
                Offline backups
              </h2>
              <p>
                From the <em>Backups</em> tab in the desktop app, you can export a self-contained encrypted backup package to an external USB drive or local NAS.
              </p>
              <p>
                Every backup bundle contains the encrypted header, manifests, and ciphertext objects with an SHA-256 verification hash, allowing full restoration even if Google Drive is completely unavailable.
              </p>
            </section>

            {/* Community & Discussions */}
            <section className="space-y-2 pt-4 border-t border-[#CAD2CD]">
              <h2 className="text-lg font-bold text-[#14201C]">
                Questions &amp; support
              </h2>
              <p>
                Have questions or need assistance? Join our discussions on{' '}
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