import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface ExcelViewerProps {
  bytes: Uint8Array;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({ bytes }) => {
  const workbook = useMemo(() => {
    try {
      return XLSX.read(bytes, { type: 'array' });
    } catch (err) {
      console.error('Failed to parse workbook:', err);
      return null;
    }
  }, [bytes]);

  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  if (!workbook || workbook.SheetNames.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-[#E2E6E3] text-sm text-[#5A6662]">
        Unable to parse spreadsheet data.
      </div>
    );
  }

  const sheetNames = workbook.SheetNames;
  const currentSheetName = sheetNames[activeSheetIndex] || sheetNames[0];
  const currentSheet = workbook.Sheets[currentSheetName];

  // Convert sheet to JSON matrix
  const sheetRows = XLSX.utils.sheet_to_json<string[]>(currentSheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  return (
    <div className="bg-white rounded-xl border border-[#E2E6E3] overflow-hidden shadow-xs flex flex-col">
      {/* Sheet Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-[#F8FAF8] border-b border-[#E2E6E3] overflow-x-auto">
        {sheetNames.map((name, idx) => (
          <button
            key={name}
            onClick={() => setActiveSheetIndex(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeSheetIndex === idx
                ? 'bg-white text-[#0F5C4D] shadow-2xs border border-[#D5DDD7] font-semibold'
                : 'text-[#5A6662] hover:text-[#14201C] hover:bg-[#EAEFEA]'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <tbody>
            {sheetRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={
                  rowIdx === 0
                    ? 'bg-[#F2F5F3] font-bold text-[#14201C] sticky top-0 border-b border-[#D5DDD7]'
                    : 'hover:bg-[#F9FAF9] border-b border-[#EDF0ED]'
                }
              >
                {/* Row number index */}
                <td className="py-2.5 px-3 bg-[#F2F5F3] text-[#8E9A96] font-mono text-[10px] w-10 border-r border-[#E2E6E3] select-none text-right">
                  {rowIdx + 1}
                </td>

                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className="py-2.5 px-3.5 border-r border-[#EDF0ED] text-[#14201C] font-mono whitespace-nowrap"
                  >
                    {String(cell ?? '')}
                  </td>
                ))}
              </tr>
            ))}

            {sheetRows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#5A6662]">
                  This worksheet is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
