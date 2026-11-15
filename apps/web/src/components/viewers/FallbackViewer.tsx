import React from 'react';
import { Download, ShieldCheck, FileQuestion } from 'lucide-react';

interface FallbackViewerProps {
  bytes: Uint8Array;
  fileName: string;
  sha256?: string;
}

export const FallbackViewer: React.FC<FallbackViewerProps> = ({ bytes, fileName, sha256 }) => {
  const handleDownload = () => {
    const blob = new Blob([bytes as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="bg-white rounded-xl p-8 border border-[#E2E6E3] shadow-xs max-w-xl mx-auto space-y-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#EDF0ED] text-[#0F5C4D] flex items-center justify-center mx-auto">
        <FileQuestion className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-[#14201C]">{fileName}</h3>
        <p className="text-xs text-[#5A6662] max-w-md mx-auto">
          In-browser preview is not available for this file format. You can safely download the decrypted file to your local machine.
        </p>
      </div>

      {sha256 && (
        <div className="p-3 bg-[#F8FAF8] border border-[#E2E6E3] rounded-lg text-left space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F5C4D]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SHA-256 Verified Plaintext Hash</span>
          </div>
          <div className="font-mono text-[11px] text-[#5A6662] break-all">
            {sha256}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleDownload}
        className="w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white py-2.5 px-6 rounded-lg font-medium text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>Download Decrypted File ({Math.round(bytes.length / 1024)} KB)</span>
      </button>
    </div>
  );
};
