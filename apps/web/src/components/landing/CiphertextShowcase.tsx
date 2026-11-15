import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Folder,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const CiphertextShowcase: React.FC = () => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6" id="security">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge variant="mineral" className="mb-3">
          Zero-Knowledge Threat Model
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#14201C] tracking-tight">
          What Google sees vs. What you see
        </h2>
        <p className="text-sm text-[#5A6662] mt-2">
          Google Drive stores raw encrypted objects. Your file names, folder
          structure, and file contents exist exclusively in decrypted browser
          memory.
        </p>
      </div>

      {/* Interactive Toggle for Mobile & Quick Comparison */}
      <div className="flex justify-center mb-6 sm:hidden">
        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EDF0ED] border border-[#E2E6E3] text-sm font-medium text-[#14201C]"
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-4 h-4 text-[#0F5C4D]" />
              Show Google's View (Ciphertext)
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-[#0F5C4D]" />
              Show Your View (Decrypted)
            </>
          )}
        </button>
      </div>

      {/* Dual Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: What Google Drive Sees */}
        <div
          className={`bg-[#0F1D19] text-[#EDF0ED] rounded-xl border border-[#25362F] p-5 flex flex-col justify-between shadow-md transition-all ${
            isRevealed ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2C27] mb-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                  Google Drive Storage View
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/80 bg-[#1A2C27] px-2 py-0.5 rounded">
                Raw Ciphertext
              </span>
            </div>

            {/* Ciphertext File List */}
            <div className="space-y-2.5 font-mono text-xs text-[#A0ACA8]">
              <div className="flex items-center justify-between p-2 rounded bg-[#142420]/80 border border-[#1A2C27]">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-white">workspace.header</span>
                </div>
                <span className="text-stone-400 text-[11px]">246 B</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#142420]/80 border border-[#1A2C27]">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-white">HEAD</span>
                </div>
                <span className="text-stone-400 text-[11px]">2 B</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#142420]/80 border border-[#1A2C27]">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-200">versions/000014.manifest</span>
                </div>
                <span className="text-stone-400 text-[11px]">1.2 KB</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#142420]/80 border border-[#1A2C27]">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-stone-300">objects/9f3a7c2b4e...</span>
                </div>
                <span className="text-stone-400 text-[11px]">45.2 KB</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#142420]/80 border border-[#1A2C27]">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-stone-300">objects/e812d0a471...</span>
                </div>
                <span className="text-stone-400 text-[11px]">128.4 KB</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#1A2C27] text-[11px] text-[#A0ACA8] flex items-start gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Google sees only pseudorandom blobs, their sizes, and push times.
              Zero filenames. Zero folder tree. Zero readable data.
            </span>
          </div>
        </div>

        {/* Right Card: What You See */}
        <div
          className={`bg-white rounded-xl border border-[#E2E6E3] p-5 flex flex-col justify-between shadow-xs transition-all ${
            !isRevealed ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6E3] mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#0F5C4D]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#0F5C4D] font-semibold">
                  Your Decrypted View
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#0F5C4D] bg-[#E6F4F1] px-2 py-0.5 rounded font-medium">
                In-Memory Plaintext
              </span>
            </div>

            {/* Plaintext File Tree */}
            <div className="space-y-2.5 font-sans text-xs text-[#14201C]">
              <div className="p-2 rounded bg-[#F8FAF8] border border-[#E2E6E3]">
                <div className="flex items-center gap-2 font-semibold text-[#0F5C4D] mb-1.5">
                  <Folder className="w-3.5 h-3.5" />
                  <span>Tax & Legal /</span>
                </div>
                <div className="pl-5 space-y-1.5 border-l border-[#E2E6E3] ml-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="font-medium">Q3_tax_return.xlsx</span>
                    </div>
                    <span className="font-mono text-[#5A6662] text-[11px]">45.2 KB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-red-700" />
                      <span className="font-medium">contract_signed.pdf</span>
                    </div>
                    <span className="font-mono text-[#5A6662] text-[11px]">128.4 KB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAF8] border border-[#E2E6E3]">
                <div className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-blue-700" />
                  <span className="font-medium">private_notes.md</span>
                </div>
                <span className="font-mono text-[#5A6662] text-[11px]">1.2 KB</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAF8] border border-[#E2E6E3]">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#5A6662]" />
                  <span className="font-medium">passwords_export.csv</span>
                </div>
                <span className="font-mono text-[#5A6662] text-[11px]">2.4 KB</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#E2E6E3] text-[11px] text-[#5A6662] flex items-start gap-2">
            <Unlock className="w-4 h-4 text-[#0F5C4D] shrink-0 mt-0.5" />
            <span>
              Decrypted directly in browser RAM with WebAssembly. No server stores
              your data, and no files or keys are ever written to browser disk.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
