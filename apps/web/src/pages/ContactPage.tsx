import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { MessageSquare, ShieldAlert, Globe, Code2, ExternalLink } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 border border-[#E2E6E3] shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#DCECE6] text-[#0F5C4D] text-xs font-medium mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Community & Support</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#14201C] tracking-tight mb-2">
              Contact & Support
            </h1>
            <p className="text-sm text-[#5A6662] mb-8 pb-6 border-b border-[#E2E6E3] max-w-xl">
              SecureWorkspace is an open-source project maintained on GitHub. We handle all bug reports, feature discussions, and support requests directly through GitHub Issues.
            </p>

            {/* Primary GitHub Issues Card */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#F8FAF8] border border-[#E2E6E3] mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-lg">
                <div className="w-12 h-12 rounded-lg bg-[#E6F4F1] flex items-center justify-center text-[#0F5C4D] mb-3">
                  <Code2 className="w-6 h-6" />
                </div>
                <h2 className="font-bold text-lg text-[#14201C]">
                  GitHub Issues & Discussions
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
                  Have a question, encountered a bug, or want to suggest an improvement? Open an issue or discussion on the official GitHub repository.
                </p>
              </div>

              <div className="shrink-0">
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open GitHub Issue
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>

            {/* Responsible Security Disclosure Section */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#F2F5F2] border border-[#E2E6E3] space-y-3 mb-8">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#0F5C4D] shrink-0" />
                <h3 className="font-bold text-sm text-[#14201C]">
                  Security Vulnerability Reporting
                </h3>
              </div>
              <p className="text-xs text-[#5A6662] leading-relaxed">
                If you discover a potential vulnerability in our cryptographic implementation, Web Worker memory isolation, or Google Drive integration, please submit a report through{' '}
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace/security/advisories/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F5C4D] font-semibold hover:underline"
                >
                  GitHub Private Vulnerability Reporting
                </a>{' '}
                or open a confidential issue.
              </p>
            </div>

            {/* Author Profile Link */}
            <div className="pt-6 border-t border-[#E2E6E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5A6662]">
              <span>Maintained by Harsh Dadiya · Open Source under Apache 2.0</span>
              <a
                href="https://harshdadiya.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#0F5C4D] font-semibold hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                harshdadiya.in
              </a>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
