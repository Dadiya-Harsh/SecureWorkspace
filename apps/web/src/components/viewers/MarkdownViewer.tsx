import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const sanitizedHtml = useMemo(() => {
    const rawHtml = marked.parse(content, { gfm: true, breaks: true }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  return (
    <div className="bg-white rounded-xl p-6 sm:p-8 border border-[#E2E6E3] shadow-xs">
      <div
        className="prose prose-slate max-w-none text-sm leading-relaxed text-[#14201C] 
          prose-headings:text-[#14201C] prose-headings:font-bold 
          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base 
          prose-a:text-[#0F5C4D] prose-a:underline hover:prose-a:text-[#0C4B3E]
          prose-pre:bg-[#14201C] prose-pre:text-[#EDF0ED] prose-pre:p-4 prose-pre:rounded-lg
          prose-code:bg-[#E2E6E3] prose-code:text-[#0F5C4D] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs
          prose-ul:list-disc prose-ul:pl-5
          prose-li:my-1"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};
