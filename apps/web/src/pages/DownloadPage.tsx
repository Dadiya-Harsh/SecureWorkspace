import React, { useState } from 'react';
import { PageLayout } from '../components/common/PageLayout';

const SHA256_HASH = '0694728e2dd0ab5a259667efe2db34af37347e900ca819fdf35dbecd209eea94';
const PS_COMMAND = 'Get-FileHash -Algorithm SHA256 .\\SecureWorkspace_0.1.0_x64-setup.exe';

export const DownloadPage: React.FC = () => {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedPs, setCopiedPs] = useState(false);
  const [pastedHash, setPastedHash] = useState('');

  const copyToClipboard = async (text: string, type: 'sha' | 'ps') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'sha') {
        setCopiedSha(true);
        setTimeout(() => setCopiedSha(false), 1600);
      } else {
        setCopiedPs(true);
        setTimeout(() => setCopiedPs(false), 1600);
      }
    } catch {
      // clipboard fallback
    }
  };

  // Compare pasted input with expected SHA-256
  const getVerificationState = () => {
    const trimmed = pastedHash.trim();
    if (!trimmed) {
      return {
        status: 'empty',
        message: 'Nothing pasted yet. This check runs in your browser only.',
      };
    }
    const match = trimmed.match(/[a-f0-9]{64}/i);
    if (!match) {
      return {
        status: 'invalid',
        message: 'That doesn’t look like a SHA-256. It should be 64 characters, using 0–9 and a–f.',
      };
    }
    if (match[0].toLowerCase() === SHA256_HASH) {
      return {
        status: 'ok',
        message: 'Match. This is the same SHA-256 as the one above.',
      };
    }
    return {
      status: 'bad',
      message: 'Doesn’t match. Don’t run it. Download it again from this page.',
    };
  };

  const ver = getVerificationState();

  return (
    <PageLayout>
      <main className="overflow-x-clip">
        {/* Top Header */}
        <section
          className="pt-16 sm:pt-24 pb-8 px-4 sm:px-6 border-b border-[#D3DAD5] bg-[#D3DAD5]/20"
          data-a="Download"
          data-b="Version 0.1.0 · Windows 11 (64-bit)"
        >
          <div className="max-w-[860px] mx-auto">
            <span className="inline-block text-xs font-bold px-2.5 py-1 rounded bg-[#F4E3BC] text-[#5F4205]">
              Beta
            </span>
            <h1 className="text-[clamp(36px,5.4vw,60px)] font-extrabold tracking-tight text-[#14201C] leading-[1.05] mt-3.5">
              Download SecureWorkspace
            </h1>
            <p className="text-[#4A5A54] text-lg sm:text-[19px] mt-2.5 max-w-[620px]">
              Version 0.1.0 · Windows 11 (64-bit). Keep your original files while it is in beta.
            </p>
          </div>
        </section>

        {/* Downloads & Verification Band */}
        <section
          className="py-14 sm:py-20 px-4 sm:px-6"
          data-a="Download"
          data-b="Installer or MSI."
        >
          <div className="max-w-[860px] mx-auto space-y-6">
            {/* Installer (.exe) Card */}
            <div className="bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-6 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#14201C] flex items-center gap-2">
                    Installer (.exe)
                    <span className="text-xs font-bold bg-[#D9EADF] text-[#0F5C4D] px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  </h2>
                  <p className="text-[#4A5A54] text-sm mt-1">
                    Standard installer, about 19 MB
                  </p>
                </div>
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-6 bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white font-semibold rounded-lg text-sm inline-flex items-center justify-center transition-colors"
                >
                  Download
                </a>
              </div>

              {/* SHA-256 row */}
              <div className="mt-4 pt-3.5 border-t border-[#D3DAD5]">
                <small className="block text-xs font-bold text-[#4A5A54] mb-1.5">
                  SHA-256
                </small>
                <div className="flex items-center justify-between gap-3 bg-[#EDF0ED] border border-[#D3DAD5] rounded-xl p-2.5 sm:p-3">
                  <code className="mono text-xs sm:text-sm text-[#14201C] break-all">
                    {SHA256_HASH}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(SHA256_HASH, 'sha')}
                    className="shrink-0 min-h-[44px] px-4 border border-[#D3DAD5] bg-[#F8FAF8] hover:bg-[#EDF0ED] text-xs font-semibold text-[#14201C] rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedSha ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* MSI Package Card */}
            <div className="bg-[#F8FAF8] border border-[#D3DAD5] rounded-2xl p-6 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#14201C]">
                    MSI package
                  </h2>
                  <p className="text-[#4A5A54] text-sm mt-1">
                    The same app as an MSI, for scripted or managed installs. About 20 MB
                  </p>
                </div>
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-6 bg-transparent hover:bg-[#D3DAD5]/40 text-[#14201C] border border-[#D3DAD5] font-semibold rounded-lg text-sm inline-flex items-center justify-center transition-colors"
                >
                  Download .msi
                </a>
              </div>
            </div>

            {/* SmartScreen Section */}
            <div className="pt-6">
              <h2 className="text-[clamp(22px,2.6vw,28px)] font-bold tracking-tight text-[#14201C]">
                If Windows shows “Windows protected your PC”
              </h2>
              <p className="text-[#4A5A54] text-[17px] mt-2">
                The installer is not signed with a paid certificate yet, so SmartScreen warns about new apps. Check the checksum below first, then:
              </p>
              <div className="flex flex-wrap gap-3 items-stretch mt-4">
                <div className="flex-1 min-w-[200px] bg-[#F8FAF8] border border-[#D3DAD5] rounded-xl p-4 flex items-center gap-3 text-base sm:text-lg">
                  <i className="w-[30px] h-[30px] rounded-full bg-[#0F5C4D] text-white flex items-center justify-center not-italic font-bold text-sm shrink-0">
                    1
                  </i>
                  <span>
                    Click <b>More info</b>.
                  </span>
                </div>
                <span className="hidden sm:flex items-center text-[#4A5A54] text-xl" aria-hidden="true">
                  →
                </span>
                <div className="flex-1 min-w-[200px] bg-[#F8FAF8] border border-[#D3DAD5] rounded-xl p-4 flex items-center gap-3 text-base sm:text-lg">
                  <i className="w-[30px] h-[30px] rounded-full bg-[#0F5C4D] text-white flex items-center justify-center not-italic font-bold text-sm shrink-0">
                    2
                  </i>
                  <span>
                    Click <b>Run anyway</b>.
                  </span>
                </div>
              </div>
            </div>

            {/* Check download & Checksum validator */}
            <div className="pt-6">
              <h2 className="text-[clamp(22px,2.6vw,28px)] font-bold tracking-tight text-[#14201C]">
                Check your download
              </h2>
              <p className="text-[#4A5A54] text-[17px] mt-2">
                In PowerShell, from the folder you downloaded to:
              </p>
              <div className="flex items-center justify-between gap-3 bg-[#0F1D19] text-[#C4D2CC] border border-[#0F1D19] rounded-xl p-3 mt-3">
                <code className="mono text-xs sm:text-sm break-all">
                  {PS_COMMAND}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(PS_COMMAND, 'ps')}
                  className="shrink-0 min-h-[44px] px-4 border border-[#3A4A44] bg-transparent text-[#E3EBE7] text-xs font-semibold rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {copiedPs ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <p className="text-[13px] text-[#4A5A54] mt-2">
                The result must match the SHA-256 above exactly.
              </p>

              {/* Interactive Verifier Textarea */}
              <div
                className={`mt-4 border rounded-xl p-4 transition-colors ${
                  ver.status === 'ok'
                    ? 'border-[#0F5C4D] bg-[#D9EADF]'
                    : ver.status === 'bad' || ver.status === 'invalid'
                    ? 'border-[#80261A] bg-[#F2D3CC]'
                    : 'border-[#D3DAD5] bg-[#F8FAF8]'
                }`}
              >
                <label
                  htmlFor="hash-input"
                  className="block font-bold text-sm text-[#14201C] mb-2"
                >
                  Paste your result here to compare
                </label>
                <textarea
                  id="hash-input"
                  rows={2}
                  spellCheck={false}
                  autoComplete="off"
                  value={pastedHash}
                  onChange={(e) => setPastedHash(e.target.value)}
                  placeholder="Paste the Hash line or just the 64 characters"
                  className="w-full border border-[#D3DAD5] rounded-lg p-2.5 bg-[#EDF0ED] mono text-sm text-[#14201C] resize-y focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
                />
                <p
                  className={`mt-2 font-semibold text-sm ${
                    ver.status === 'ok'
                      ? 'text-[#0B4F40]'
                      : ver.status === 'bad' || ver.status === 'invalid'
                      ? 'text-[#80261A]'
                      : 'text-[#4A5A54]'
                  }`}
                  role="status"
                >
                  {ver.message}
                </p>
              </div>
            </div>

            {/* Planned platforms */}
            <div className="pt-6">
              <h2 className="text-[clamp(22px,2.6vw,28px)] font-bold tracking-tight text-[#14201C]">
                Planned
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="border-2 border-dashed border-[#D3DAD5] rounded-xl p-4 text-[#4A5A54]">
                  <b className="block text-lg text-[#14201C]">Android</b>
                  <span>No dates yet</span>
                </div>
                <div className="border-2 border-dashed border-[#D3DAD5] rounded-xl p-4 text-[#4A5A54]">
                  <b className="block text-lg text-[#14201C]">Ubuntu</b>
                  <span>No dates yet</span>
                </div>
              </div>
              <p className="mt-4">
                <a
                  href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F5C4D] font-bold hover:underline"
                >
                  Release notes on GitHub →
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </PageLayout>
  );
};
