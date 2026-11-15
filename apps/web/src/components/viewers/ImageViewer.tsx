import React, { useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageViewerProps {
  bytes: Uint8Array;
  fileName: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ bytes, fileName }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    let mime = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
    else if (ext === 'webp') mime = 'image/webp';
    else if (ext === 'svg') mime = 'image/svg+xml';

    const blob = new Blob([bytes as BlobPart], { type: mime });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [bytes, fileName]);

  if (!blobUrl) {
    return <div className="text-sm text-[#5A6662] py-8">Loading image...</div>;
  }

  return (
    <div className="bg-[#14201C] rounded-xl overflow-hidden shadow-xs flex flex-col items-center">
      {/* Controls */}
      <div className="w-full bg-[#0A1612] px-4 py-2 flex items-center justify-between text-xs text-[#8E9A96]">
        <span>{fileName}</span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setScale((s) => Math.max(0.2, s - 0.2))}
            className="hover:text-white transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="hover:text-white transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="hover:text-white transition-colors cursor-pointer ml-2"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Preview Canvas */}
      <div className="p-8 flex items-center justify-center min-h-[400px] max-h-[700px] overflow-auto w-full">
        <img
          src={blobUrl}
          alt={fileName}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
          className="max-w-full max-h-[600px] object-contain rounded shadow-lg"
        />
      </div>
    </div>
  );
};
