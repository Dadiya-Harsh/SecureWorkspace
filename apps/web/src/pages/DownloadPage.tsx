import React, { useState } from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { Check, Copy, CheckCircle2 } from 'lucide-react';

export const DownloadPage: React.FC = () => {
  const [copiedSha, setCopiedSha] = useState(false);

  const exeSha = '0694728e2dd0ab5a259667efe2db34af37347e900ca819fdf35dbecd209eea94';

  const handleCopySha = () => {
    navigator.clipboard.writeText(exeSha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  return (
    <PageLayout>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Beta Badge */}
          <div className="mb-4">
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FCE7C5] text-[#8C4A00]">
              ! Beta
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight mb-2">
            Download SecureWorkspace
          </h1>

          <p className="text-sm text-[#5A6662] mb-8">
            Version 0.1.0 · Windows 11 (64-bit). Keep your original files while it is in beta.
          </p>

          <div className="space-y-4 mb-12">
            {/* Installer (.exe) Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#D5DDD6] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#14201C]">
                    Installer (.exe)
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCECE6] text-[#0F5C4D]">
                    <Check className="w-3 h-3 stroke-[3]" /> Recommended
                  </span>
                </div>

                <p className="text-xs text-[#5A6662]">
                  Standard installer, about 19 MB
                </p>

                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-[#5A6662] mb-1">
                    SHA-256
                  </div>
                  <div
                    onClick={handleCopySha}
                    className="group bg-[#F2F5F2] hover:bg-[#E8EDE8] text-[#14201C] font-mono text-[11px] p-2.5 rounded-lg border border-[#E2E6E3] flex items-center justify-between cursor-pointer transition-colors max-w-xl"
                    title="Click to copy SHA-256 hash"
                  >
                    <span className="truncate">{exeSha}</span>
                    <span className="ml-2 text-xs text-[#5A6662] group-hover:text-[#0F5C4D] shrink-0 flex items-center gap-1 font-sans font-medium">
                      {copiedSha ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C4D]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto shrink-0"
              >
                <button className="w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white px-7 py-3 rounded-lg font-bold text-sm transition-all duration-150 cursor-pointer shadow-xs text-center">
                  Download
                </button>
              </a>
            </div>

            {/* MSI Package Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#D5DDD6] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[#14201C]">
                  MSI package
                </h2>
                <p className="text-xs text-[#5A6662]">
                  The same app as an MSI, for scripted or managed installs. About 20 MB
                </p>
              </div>

              <a
                href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto shrink-0"
              >
                <button className="w-full sm:w-auto bg-white hover:bg-[#F2F5F2] border border-[#CAD2CD] text-[#14201C] px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 cursor-pointer text-center">
                  Download .msi
                </button>
              </a>
            </div>
          </div>

          {/* Section: If Windows shows "Windows protected your PC" */}
          <div className="space-y-3 mb-10 text-sm">
            <h3 className="text-lg font-bold text-[#14201C]">
              If Windows shows "Windows protected your PC"
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
              The installer is not signed with a paid certificate yet, so SmartScreen warns about new apps. Check the checksum below first, then:
            </p>
            <ol className="list-decimal list-inside text-xs sm:text-sm text-[#5A6662] space-y-1 pl-1">
              <li>Click <strong>More info</strong>.</li>
              <li>Click <strong>Run anyway</strong>.</li>
            </ol>
          </div>

          {/* Section: Check your download */}
          <div className="space-y-3 mb-10 text-sm">
            <h3 className="text-lg font-bold text-[#14201C]">
              Check your download
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662]">
              In PowerShell, from the folder you downloaded to:
            </p>
            <div className="bg-[#111F1C] text-[#E6EFEA] font-mono text-xs sm:text-[13px] p-4 rounded-xl overflow-x-auto shadow-inner">
              <code>Get-FileHash -Algorithm SHA256 .\SecureWorkspace_0.1.0_x64-setup.exe</code>
            </div>
            <p className="text-xs text-[#5A6662]">
              The result must match the SHA-256 above exactly.
            </p>
          </div>

          {/* Section: Planned */}
          <div className="space-y-3 pt-4 border-t border-[#CAD2CD]">
            <h3 className="text-lg font-bold text-[#14201C]">
              Planned
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6662]">
              Android and Ubuntu. No dates yet.
            </p>
            <div>
              <a
                href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#0F5C4D] hover:underline"
              >
                Release notes on GitHub →
              </a>
            </div>
          </div>
        </main>
    </PageLayout>
  );
};