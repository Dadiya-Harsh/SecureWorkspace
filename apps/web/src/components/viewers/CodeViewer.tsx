import React, { useMemo } from 'react';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeViewerProps {
  code: string;
  fileName: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, fileName }) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const language = useMemo(() => {
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'py':
        return 'python';
      case 'html':
        return 'markup';
      case 'css':
        return 'css';
      case 'sh':
      case 'bash':
        return 'bash';
      default:
        return 'text';
    }
  }, [ext]);

  const lines = useMemo(() => code.split('\n'), [code]);

  return (
    <div className="bg-[#14201C] rounded-xl overflow-hidden border border-[#223630] shadow-xs flex flex-col">
      <div className="bg-[#0A1612] px-4 py-2 border-b border-[#223630] flex items-center justify-between text-xs text-[#8E9A96]">
        <span className="font-mono">{fileName}</span>
        <span className="uppercase font-semibold tracking-wider">{language} · {lines.length} lines</span>
      </div>

      <div className="overflow-x-auto max-h-[650px] p-4 text-xs font-mono leading-relaxed text-[#EDF0ED]">
        <pre className="!bg-transparent !p-0 !m-0">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell pr-4 text-right select-none text-[#5A6662] w-10">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
