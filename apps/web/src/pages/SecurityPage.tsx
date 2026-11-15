import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, Layers, Cpu } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 border border-[#E2E6E3] shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#DCECE6] text-[#0F5C4D] text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographic Architecture & Threat Model</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#14201C] tracking-tight mb-2">
              Security Model
            </h1>
            <p className="text-xs font-mono text-[#5A6662] mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-[#E2E6E3]">
              Specification Version 1.0 · Verified Bit-for-Bit Against Cross-Platform Test Vectors
            </p>

            <div className="space-y-8 sm:space-y-10 text-sm text-[#5A6662] leading-relaxed">
              {/* Core Philosophy */}
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-[#14201C] mb-3 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#0F5C4D] shrink-0" />
                  1. Zero-Knowledge Invariant
                </h2>
                <p className="mb-3">
                  In SecureWorkspace, cryptography is executed <strong>strictly on your local device</strong> (on your PC via the Python sidecar daemon or in your browser tab via WebAssembly).
                </p>
                <div className="p-4 rounded-xl bg-[#F2F5F2] border border-[#E2E6E3] text-xs space-y-2.5 text-[#14201C]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5C4D] shrink-0 mt-0.5" />
                    <span><strong>No Server Stores Your Data:</strong> We operate no proprietary databases, backend vaults, or API proxies.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5C4D] shrink-0 mt-0.5" />
                    <span><strong>No Key Custody:</strong> We never receive, store, or hold your master password or recovery phrase.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5C4D] shrink-0 mt-0.5" />
                    <span><strong>Ephemeral RAM Hygiene:</strong> In the browser viewer, decrypted buffers and keys exist only in volatile RAM and are zeroed upon lock or tab close.</span>
                  </div>
                </div>
              </section>

              {/* Cryptographic Primitives Table */}
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-[#14201C] mb-3 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#0F5C4D] shrink-0" />
                  2. Cryptographic Primitives
                </h2>
                <p className="mb-4">
                  Every primitive was chosen for modern side-channel resistance, memory-hardness, and formal verification:
                </p>

                <div className="overflow-x-auto -mx-1 sm:mx-0 border border-[#E2E6E3] rounded-xl">
                  <table className="w-full text-left text-xs min-w-[540px]">
                    <thead className="bg-[#EDF0ED] text-[#14201C] font-mono uppercase">
                      <tr>
                        <th className="p-3 border-b border-[#E2E6E3]">Purpose</th>
                        <th className="p-3 border-b border-[#E2E6E3]">Algorithm</th>
                        <th className="p-3 border-b border-[#E2E6E3]">Parameters / Spec</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E6E3]">
                      <tr>
                        <td className="p-3 font-semibold text-[#14201C]">Key Derivation (KDF)</td>
                        <td className="p-3 font-mono text-[#0F5C4D]">Argon2id</td>
                        <td className="p-3">64 MB RAM, 2 iterations, 256-bit derived KEK</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[#14201C]">Key Wrapping (KEK)</td>
                        <td className="p-3 font-mono text-[#0F5C4D]">XChaCha20-Poly1305</td>
                        <td className="p-3">SecretBox with 24-byte nonce, 16-byte Poly1305 MAC</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[#14201C]">Subkey Derivation</td>
                        <td className="p-3 font-mono text-[#0F5C4D]">BLAKE2b Keyed Hash</td>
                        <td className="p-3 font-mono text-[11px]">Personalization: 'SW_FKEY_', 'SW_INDX_', 'SW_META_'</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[#14201C]">File Encryption</td>
                        <td className="p-3 font-mono text-[#0F5C4D]">SecretStream (XChaCha20-Poly1305)</td>
                        <td className="p-3">64 KB chunks, TAG_MESSAGE / TAG_FINAL truncation protection</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[#14201C]">Recovery Key</td>
                        <td className="p-3 font-mono text-[#0F5C4D]">BIP-39 Mnemonic</td>
                        <td className="p-3">24 English words, 256-bit entropy + 8-bit SHA-256 checksum</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Key Hierarchy */}
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-[#14201C] mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0F5C4D] shrink-0" />
                  3. Key Hierarchy & Envelope
                </h2>
                <p className="mb-4">
                  SecureWorkspace uses an envelope encryption model with a root 256-bit <strong>Workspace Master Key (WMK)</strong>:
                </p>
                <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#E2E6E3] font-mono text-xs space-y-1.5 text-[#14201C] overflow-x-auto">
                  <div className="whitespace-nowrap">Master Password + 16B Salt ──► [Argon2id] ──► Password KEK</div>
                  <div className="whitespace-nowrap">24-Word Recovery + 16B Salt ──► [Argon2id] ──► Recovery KEK</div>
                  <div className="text-[#0F5C4D] pt-1 whitespace-nowrap">Either KEK unwraps the 246-byte header ──► Workspace Master Key (WMK)</div>
                  <div className="pl-4 pt-1 text-[#5A6662] whitespace-nowrap">├─► BLAKE2b('SW_FKEY_', file_id) ──► File Key (unique per file)</div>
                  <div className="pl-4 text-[#5A6662] whitespace-nowrap">└─► BLAKE2b('SW_INDX_') ──► Index Key (encrypts manifests)</div>
                </div>
              </section>

              {/* Honest Limits & Threat Model */}
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-[#14201C] mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                  4. Honest Threat Model & Known Limits
                </h2>
                <p className="mb-3">
                  We believe in zero security theater. Here is exactly what our security model protects against, and what it does not:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#E6F4F1] border border-emerald-200/60">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F5C4D] mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0F5C4D] shrink-0" />
                      Protected Against
                    </h3>
                    <ul className="space-y-1.5 text-xs text-[#14201C]">
                      <li>• Google or unauthorized third parties reading file contents.</li>
                      <li>• Exposure of file names, folder hierarchy, or paths.</li>
                      <li>• Cloud database breaches or rogue employees at cloud providers.</li>
                      <li>• Replay or chunk reordering attacks (prevented by SecretStream).</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      Known Metadata Limits
                    </h3>
                    <ul className="space-y-1.5 text-xs text-amber-900">
                      <li>• Google sees approximate file sizes (within 64KB chunk padding).</li>
                      <li>• Google sees push timestamps and frequency of updates.</li>
                      <li>• Local malware or physical access to an unlocked PC can read plaintext files.</li>
                      <li>• Losing both password and recovery phrase causes permanent loss.</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
