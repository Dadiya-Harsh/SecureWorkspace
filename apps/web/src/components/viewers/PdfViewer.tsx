import React, { useEffect, useState } from 'react';
import { ExternalLink, Download, FileText } from 'lucide-react';

interface PdfViewerProps {
  bytes: Uint8Array;
  fileName: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ bytes, fileName }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // Create ephemeral blob url in memory with explicit PDF MIME type
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      // Memory hygiene: revoke blob url on unmount after a short delay so open tabs can read it
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    };
  }, [bytes]);

  const handleOpenDedicatedTab = (e: React.MouseEvent) => {
    e.preventDefault();
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!blobUrl) {
    return <div className="text-sm text-[#5A6662] py-8">Loading PDF document...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E6E3] overflow-hidden shadow-xs flex flex-col h-[750px]">
      {/* Top action toolbar */}
      <div className="p-3 bg-[#F8FAF8] border-b border-[#E2E6E3] flex items-center justify-between text-xs text-[#5A6662]">
        <div className="flex items-center gap-2 font-medium text-[#14201C] truncate">
          <FileText className="w-4 h-4 text-[#9B2F1F] shrink-0" />
          <span className="truncate">{fileName}</span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 text-[#5A6662] hover:text-[#14201C] font-medium transition-colors cursor-pointer"
            title="Download decrypted PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleOpenDedicatedTab}
            className="inline-flex items-center gap-1.5 text-[#0F5C4D] hover:underline font-medium cursor-pointer"
            title="Open in a full browser tab"
          >
            <span>Open in dedicated tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded PDF Viewer with Object / Iframe fallback */}
      <object
        data={`${blobUrl}#toolbar=1&navpanes=0`}
        type="application/pdf"
        className="w-full flex-1 border-0"
      >
        <iframe
          src={`${blobUrl}#toolbar=1&navpanes=0`}
          title={fileName}
          className="w-full h-full border-0"
        >
          <div className="p-8 text-center text-sm text-[#5A6662] space-y-3">
            <p>Your browser could not embed this PDF directly.</p>
            <button
              onClick={handleOpenDedicatedTab}
              className="px-4 py-2 bg-[#0F5C4D] text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Open PDF in Dedicated Tab
            </button>
          </div>
        </iframe>
      </object>
    </div>
  );
};
