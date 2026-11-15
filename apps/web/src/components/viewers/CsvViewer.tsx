import React, { useState } from 'react';
import Papa from 'papaparse';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface CsvViewerProps {
  csvText: string;
}

export const CsvViewer: React.FC<CsvViewerProps> = ({ csvText }) => {
  const [revealedRows, setRevealedRows] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const parsed = Papa.parse<string[]>(csvText.trim(), { skipEmptyLines: true });
  const data = parsed.data || [];

  if (data.length === 0) {
    return <div className="text-sm text-[#5A6662] py-8">File is empty.</div>;
  }

  const headers = data[0];
  const rows = data.slice(1);

  // Check if this CSV has password columns
  const passwordColIdx = headers.findIndex((h) =>
    h.toLowerCase().includes('password') || h.toLowerCase().includes('secret')
  );

  const toggleReveal = (rowIdx: number) => {
    setRevealedRows((prev) => ({ ...prev, [rowIdx]: !prev[rowIdx] }));
  };

  const handleCopy = (rowIdx: number, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedIndex(rowIdx);
    setTimeout(() => {
      setCopiedIndex((curr) => (curr === rowIdx ? null : curr));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#D8DFDA] text-xs font-medium text-[#5A6662]">
              {headers.map((header, idx) => (
                <th key={idx} className="py-3 px-4 font-normal">
                  {header}
                </th>
              ))}
              {passwordColIdx !== -1 && (
                <th className="py-3 px-4 font-normal w-40 text-right"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E6E1]">
            {rows.map((row, rowIdx) => {
              const isRevealed = !!revealedRows[rowIdx];
              const secretVal = passwordColIdx !== -1 ? row[passwordColIdx] : '';

              return (
                <tr key={rowIdx} className="hover:bg-[#E5EAE6]/50 transition-colors">
                  {row.map((cell, colIdx) => {
                    const isSecretCell = colIdx === passwordColIdx;

                    return (
                      <td key={colIdx} className="py-4 px-4 text-[#14201C] font-mono text-xs sm:text-sm">
                        {isSecretCell ? (
                          isRevealed ? (
                            <span className="font-semibold text-[#0F5C4D]">{cell}</span>
                          ) : (
                            <span className="tracking-widest text-[#5A6662]">••••••••••</span>
                          )
                        ) : (
                          <span>{cell}</span>
                        )}
                      </td>
                    );
                  })}

                  {passwordColIdx !== -1 && (
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleReveal(rowIdx)}
                          className="bg-white border border-[#D5DDD7] hover:border-[#BAC5BD] text-[#14201C] text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          {isRevealed ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-[#5A6662]" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-[#5A6662]" />
                              <span>Reveal</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(rowIdx, secretVal)}
                          className="bg-white border border-[#D5DDD7] hover:border-[#BAC5BD] text-[#14201C] text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          {copiedIndex === rowIdx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#0F5C4D]" />
                              <span className="text-[#0F5C4D]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#5A6662]" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {passwordColIdx !== -1 && (
        <p className="text-xs text-[#5A6662]">
          Values stay hidden until you reveal them. Copy clears your clipboard after 30 seconds (proposed). Example data only.
        </p>
      )}
    </div>
  );
};
