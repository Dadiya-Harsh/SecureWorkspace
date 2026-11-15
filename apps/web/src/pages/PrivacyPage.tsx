import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ShieldCheck, Lock, EyeOff, ServerOff } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 border border-[#E2E6E3] shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#DCECE6] text-[#0F5C4D] text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14201C] tracking-tight mb-2">
              Privacy Policy
            </h1>
            <p className="text-xs font-mono text-[#5A6662] mb-8 pb-6 border-b border-[#E2E6E3]">
              Last updated: November 2026 · Open Source under Apache 2.0
            </p>

            <div className="space-y-8 text-sm text-[#5A6662] leading-relaxed">
              {/* Highlight Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F2F5F2] border border-[#E2E6E3] text-[#14201C]">
                <div className="flex items-center gap-2.5">
                  <ServerOff className="w-5 h-5 text-[#0F5C4D] shrink-0" />
                  <span className="font-semibold text-xs">Zero Backend Servers</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <EyeOff className="w-5 h-5 text-[#0F5C4D] shrink-0" />
                  <span className="font-semibold text-xs">Zero Tracking or Telemetry</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-[#0F5C4D] shrink-0" />
                  <span className="font-semibold text-xs">100% Client-Side Encryption</span>
                </div>
              </div>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  1. Fundamental Privacy Guarantee
                </h2>
                <p>
                  SecureWorkspace is an open-source, client-side encrypted workspace.
                  We operate <strong>no intermediary web servers, databases, or API proxies</strong>.
                  We do not collect personal data, usage metrics, IP addresses, tracking cookies,
                  or error telemetry. Your files, metadata, and cryptographic keys never reach us.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  2. Google Drive Access & Scope
                </h2>
                <p className="mb-2">
                  When you connect Google Drive, the web app uses the Google Identity Services
                  (GIS) token client to communicate <strong>directly from your browser</strong> to
                  Google Drive API endpoints (<code className="bg-[#EDF0ED] px-1.5 py-0.5 rounded text-xs text-[#14201C]">https://www.googleapis.com</code>).
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Minimal Scope:</strong> We request strictly <code className="bg-[#EDF0ED] px-1.5 py-0.5 rounded text-xs text-[#14201C]">https://www.googleapis.com/auth/drive.file</code>.
                    This restricts access exclusively to files created or opened by SecureWorkspace.
                  </li>
                  <li>
                    <strong>No Proxy:</strong> Access tokens and file transfers pass directly between your browser and Google's servers. No third party ever intercepts these tokens.
                  </li>
                  <li>
                    <strong>Google's View:</strong> Files uploaded to your Google Drive are encrypted before transmission. Google stores only ciphertext blobs, file sizes, and push timestamps.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  3. Memory Hygiene & Local Storage
                </h2>
                <p>
                  In the web viewer, your master password, 24-word recovery phrase, derived
                  keys, and decrypted file contents exist exclusively in volatile browser RAM
                  (<code className="bg-[#EDF0ED] px-1.5 py-0.5 rounded text-xs text-[#14201C]">Uint8Array</code>).
                  Nothing is written to <code className="bg-[#EDF0ED] px-1.5 py-0.5 rounded text-xs text-[#14201C]">localStorage</code>,
                  <code className="bg-[#EDF0ED] px-1.5 py-0.5 rounded text-xs text-[#14201C]">sessionStorage</code>, or
                  <code className="bg-[#EDF0ED] px-1.5 py-0.5 rounded text-xs text-[#14201C]">IndexedDB</code>.
                  When you click <strong>Lock</strong>, when the 10-minute inactivity timer expires,
                  or when you close the browser tab, all key buffers are zeroized (<code className="bg-[#EDF0ED] px-1.5 py-0.5 rounded text-xs text-[#14201C]">buffer.fill(0)</code>)
                  and purged from memory.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  4. Third-Party Services
                </h2>
                <p>
                  The static web application is distributed via Cloudflare Pages edge CDN.
                  Cloudflare provides standard DDoS protection and TLS certificates. We do
                  not use any third-party analytics (no Google Analytics, no Mixpanel, no Sentry).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-[#14201C] mb-2">
                  5. Contact & Auditing
                </h2>
                <p>
                  Because SecureWorkspace is fully open source under the Apache 2.0 license,
                  anyone can inspect and verify our cryptographic implementation and network
                  calls on GitHub. If you have questions regarding privacy or security, please open a discussion or issue via our{' '}
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
