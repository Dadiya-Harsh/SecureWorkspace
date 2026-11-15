import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface PdfViewerProps {
  bytes: Uint8Array;
  fileName: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ bytes, fileName }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // Create ephemeral blob url in memory
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      // Memory hygiene: revoke blob url on unmount
      URL.revokeObjectURL(url);
    };
  }, [bytes]);

  if (!blobUrl) {
    return <div className="text-sm text-[#5A6662] py-8">Loading PDF document...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E6E3] overflow-hidden shadow-xs flex flex-col h-[750px]">
      <div className="p-3 bg-[#F8FAF8] border-b border-[#E2E6E3] flex items-center justify-between text-xs text-[#5A6662]">
        <span>{fileName}</span>
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[#0F5C4D] hover:underline font-medium"
        >
          <span>Open in dedicated tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <iframe
        src={`${blobUrl}#toolbar=1&navpanes=0`}
        title={fileName}
        className="w-full flex-1 border-0"
      />
    </div>
  );
};
