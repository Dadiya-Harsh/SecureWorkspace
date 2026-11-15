import React, { useState } from 'react';
import { Download, Check, Copy, ShieldAlert, Monitor, Terminal, FileCode2, ExternalLink } from 'lucide-react';

export const DownloadBar: React.FC = () => {
  const [copiedExe, setCopiedExe] = useState(false);
  const [copiedMsi, setCopiedMsi] = useState(false);

  const exeHash = '0694728e2dd0ab5a259667efe2db34af37347e900ca819fdf35dbecd209eea94';
  const msiHash = '79f8efeb8a3cd74f889f7d209693d942ea28eaf892ff439752abf80c745134e1';

  const handleCopy = (text: string, type: 'exe' | 'msi') => {
    navigator.clipboard.writeText(text);
    if (type === 'exe') {
      setCopiedExe(true);
      setTimeout(() => setCopiedExe(false), 2000);
    } else {
      setCopiedMsi(true);
      setTimeout(() => setCopiedMsi(false), 2000);
    }
  };

  return (
    <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-12" id="download">
      <div className="bg-white rounded-3xl border border-[#E2E6E3] shadow-xs p-8 sm:p-12 lg:p-14">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4F1] text-xs font-mono font-semibold text-[#0F5C4D] mb-4">
            <Monitor className="w-3.5 h-3.5" />
            <span>OFFICIAL DESKTOP RELEASE · WINDOWS 64-BIT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#14201C] tracking-tight mb-4">
            Download SecureWorkspace for Windows
          </h2>

          <p className="text-base text-[#5A6662] leading-relaxed">
            Full-featured authoring, automatic Git-style background sync, and offline backup
            for your local filesystem. Requires Windows 10 or Windows 11 (64-bit).
          </p>
        </div>

        {/* 2 Package Cards: EXE and MSI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Setup Installer (.exe) */}
          <div className="rounded-2xl border-2 border-[#0F5C4D]/30 bg-[#F8FAF8] p-6 sm:p-7 flex flex-col justify-between hover:border-[#0F5C4D] transition-colors relative">
            <div className="absolute top-4 right-4 bg-[#DCECE6] text-[#0F5C4D] text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full">
              RECOMMENDED
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#0F5C4D] text-white flex items-center justify-center font-bold">
                  .exe
                </div>
                <div>
                  <h3 className="font-bold text-[#14201C] text-lg">
                    Setup Installer
                  </h3>
                  <span className="text-xs font-mono text-[#5A6662]">
                    v0.1.0 · 19.08 MB · Windows 10 / 11 (x64)
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#5A6662] leading-relaxed mb-5">
                Standard setup wizard with automatic updates and desktop shortcuts. Single binary sidecar daemon included.
              </p>

              {/* SHA-256 Checksum Box */}
              <div className="bg-white border border-[#E2E6E3] rounded-lg p-2.5 mb-5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#5A6662]">
                  <span>SHA-256 Checksum</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(exeHash, 'exe')}
                    className="inline-flex items-center gap-1 text-[#0F5C4D] hover:underline font-mono text-[10px] cursor-pointer"
                  >
                    {copiedExe ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedExe ? 'Copied' : 'Copy hash'}</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] text-[#14201C] break-all select-all bg-[#F2F5F2] p-1.5 rounded">
                  {exeHash}
                </div>
              </div>
            </div>

            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases/download/v0.1.0/SecureWorkspace_0.1.0_x64-setup.exe"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white py-3.5 px-4 rounded-xl font-medium text-sm transition-all shadow-xs cursor-pointer hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4 text-[#3FB89A]" />
              <span>Download Setup (.exe)</span>
            </a>
          </div>

          {/* Card 2: MSI Package (.msi) */}
          <div className="rounded-2xl border border-[#E2E6E3] bg-[#F8FAF8] p-6 sm:p-7 flex flex-col justify-between hover:border-[#CAD2CD] transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#25362F] text-white flex items-center justify-center font-bold">
                  .msi
                </div>
                <div>
                  <h3 className="font-bold text-[#14201C] text-lg">
                    Enterprise MSI Package
                  </h3>
                  <span className="text-xs font-mono text-[#5A6662]">
                    v0.1.0 · 19.82 MB · Windows 10 / 11 (x64)
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#5A6662] leading-relaxed mb-5">
                Windows Installer package designed for enterprise deployment, automated group policies, and IT provisioning.
              </p>

              {/* SHA-256 Checksum Box */}
              <div className="bg-white border border-[#E2E6E3] rounded-lg p-2.5 mb-5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#5A6662]">
                  <span>SHA-256 Checksum</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(msiHash, 'msi')}
                    className="inline-flex items-center gap-1 text-[#0F5C4D] hover:underline font-mono text-[10px] cursor-pointer"
                  >
                    {copiedMsi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMsi ? 'Copied' : 'Copy hash'}</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] text-[#14201C] break-all select-all bg-[#F2F5F2] p-1.5 rounded">
                  {msiHash}
                </div>
              </div>
            </div>

            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases/download/v0.1.0/SecureWorkspace_0.1.0_x64_en-US.msi"
              className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F2F5F2] border border-[#CAD2CD] text-[#14201C] py-3.5 px-4 rounded-xl font-medium text-sm transition-all shadow-xs cursor-pointer hover:-translate-y-0.5"
            >
              <FileCode2 className="w-4 h-4 text-[#0F5C4D]" />
              <span>Download Package (.msi)</span>
            </a>
          </div>
        </div>

        {/* Windows SmartScreen & Unsigned Installer Notice */}
        <div className="rounded-2xl bg-amber-50/80 border border-amber-200/90 p-5 sm:p-6 text-xs text-amber-950 space-y-2.5 mb-6">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Windows SmartScreen Note for New Open-Source Software</span>
          </div>
          <p className="leading-relaxed text-amber-900/90">
            SecureWorkspace is free and open-source software built independently without corporate commercial code-signing certificates.
            When you run the installer for the first time, Windows SmartScreen may display a prompt stating <em>&quot;Windows protected your PC&quot;</em>.
            This is normal for newly released open-source tools: click <strong>&quot;More info&quot;</strong> and select <strong>&quot;Run anyway&quot;</strong>.
          </p>
          <div className="pt-2 border-t border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-amber-800">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Verify in PowerShell: Get-FileHash -Algorithm SHA256 .\SecureWorkspace_0.1.0_x64-setup.exe</span>
            </div>
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases/tag/v0.1.0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline font-sans font-semibold text-amber-950 hover:text-amber-800"
            >
              <span>View GitHub Release Notes</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
