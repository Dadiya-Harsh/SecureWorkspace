import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Loader2, AlertCircle } from 'lucide-react';

interface DocxViewerProps {
  bytes: Uint8Array;
  fileName: string;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ bytes, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderDocx() {
      if (!containerRef.current) return;

      setLoading(true);
      setError(null);
      containerRef.current.innerHTML = '';

      try {
        await renderAsync(bytes, containerRef.current, undefined, {
          className: 'docx-rendered-document',
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderEndnotes: true,
        });

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Docx render error:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to render Word document in browser.'
          );
          setLoading(false);
        }
      }
    }

    renderDocx();

    return () => {
      isCancelled = true;
    };
  }, [bytes]);

  return (
    <div className="bg-white rounded-xl border border-[#E2E6E3] overflow-hidden shadow-xs flex flex-col">
      {/* Header bar */}
      <div className="p-3 bg-[#F8FAF8] border-b border-[#E2E6E3] flex items-center justify-between text-xs text-[#5A6662]">
        <span className="font-medium text-[#14201C]">{fileName}</span>
        <span className="font-mono text-[11px] text-[#8E9A96]">Microsoft Word (.docx)</span>
      </div>

      {loading && (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#0F5C4D]" />
          <p className="text-xs text-[#5A6662]">Rendering Word document formatting...</p>
        </div>
      )}

      {error && (
        <div className="m-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Render Note: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Document DOM Host */}
      <div
        ref={containerRef}
        className="p-8 sm:p-14 overflow-x-auto min-h-[500px] text-sm text-[#14201C] leading-relaxed [&_.docx-rendered-document]:max-w-3xl [&_.docx-rendered-document]:mx-auto"
      />
    </div>
  );
};
