import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { FileText, AlertTriangle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 border border-[#E2E6E3] shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#DCECE6] text-[#0F5C4D] text-xs font-medium mb-4">
              <FileText className="w-3.5 h-3.5" />
              <span>Legal Terms</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14201C] tracking-tight mb-2">
              Terms of Service
            </h1>
            <p className="text-xs font-mono text-[#5A6662] mb-8 pb-6 border-b border-[#E2E6E3]">
              Last updated: November 2026 · Licensed under Apache License 2.0
            </p>

            <div className="space-y-8 text-sm text-[#5A6662] leading-relaxed">
              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  1. Agreement & Open Source License
                </h2>
                <p>
                  By using the SecureWorkspace desktop application, web viewer, or related
                  services, you agree to these Terms of Service. SecureWorkspace is provided
                  free and open-source under the{' '}
                  <a
                    href="https://github.com/Dadiya-Harsh/SecureWorkspace/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0F5C4D] font-medium hover:underline"
                  >
                    Apache License, Version 2.0
                  </a>.
                </p>
              </section>

              {/* Crucial Zero-Knowledge Notice */}
              <div className="p-5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Important: Your Sole Responsibility for Master Password and Recovery Key</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  SecureWorkspace is built on a <strong>zero-knowledge architecture</strong>.
                  We do not hold copies of your master password, your recovery phrase, or your encryption keys.
                  If you lose both your master password and your 24-word recovery key, your encrypted data
                  cannot be recovered by anyone, including the software authors and contributors.
                </p>
              </div>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  2. User Responsibilities & Key Safety
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Safeguarding Secrets:</strong> You are responsible for maintaining the confidentiality of your master password and securely recording your 24-word recovery phrase.
                  </li>
                  <li>
                    <strong>Device Security:</strong> Because the web viewer decrypts documents inside browser memory, you should only unlock your vault on trusted, malware-free computers.
                  </li>
                  <li>
                    <strong>Third-Party Cloud Terms:</strong> When syncing files to Google Drive, you remain subject to Google's Terms of Service and Acceptable Use Policies.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  3. Disclaimer of Warranties
                </h2>
                <p className="uppercase text-xs tracking-wide font-mono text-[#5A6662]">
                  The software is provided "AS IS", without warranty of any kind, express or
                  implied, including but not limited to the warranties of merchantability,
                  fitness for a particular purpose and noninfringement. In no event shall the
                  authors or copyright holders be liable for any claim, damages or other
                  liability, whether in an action of contract, tort or otherwise, arising from,
                  out of or in connection with the software or the use or other dealings in the software.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  4. Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by applicable law, neither the developers
                  nor any contributors shall be liable for any direct, indirect, incidental,
                  special, consequential, or punitive damages resulting from loss of data,
                  cloud provider outages, corrupted local files, forgotten passwords, or unauthorized
                  device access.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  5. Modifications & Contact
                </h2>
                <p>
                  We may revise these Terms from time to time. The latest version will always
                  be posted on this page with the effective date updated. For questions or discussions, please visit our{' '}
                  <a
                    href="/contact"
                    className="text-[#0F5C4D] font-medium hover:underline"
                  >
                    Contact & Community Support
                  </a>{' '}
                  page.
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
