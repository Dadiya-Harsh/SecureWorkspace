import React from 'react';
import { useActiveViewport } from '../../hooks/useActiveViewport';

const Node: React.FC<{ kicker: string; title: string }> = ({ kicker, title }) => (
  <div className="bg-white border border-[#CAD2CD] rounded-xl px-4 py-3.5">
    <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#4A5A54]">
      {kicker}
    </span>
    <b className="block mt-1.5 text-base [overflow-wrap:anywhere]">{title}</b>
  </div>
);

const Lane: React.FC = () => (
  <div aria-hidden="true" className="relative h-14 md:h-10">
    <div className="dash-line" />
  </div>
);

/** "No server of ours": app and viewer both talk straight to Google; our box is empty. */
export const NoServerDiagram: React.FC = () => {
  const [ref, active] = useActiveViewport<HTMLDivElement>(0.2);
  return (
    <div ref={ref} className={active ? '' : 'dash-paused'}>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(50px,80px)_minmax(0,1fr)_minmax(50px,80px)_minmax(0,1fr)] items-center">
        <Node kicker="Desktop app" title="Your PC" />
        <Lane />
        <Node kicker="Google" title="Your Drive" />
        <Lane />
        <Node kicker="Web viewer" title="Your browser" />
      </div>
      <div className="mt-5 border-2 border-dashed border-[#B9C5BE] rounded-xl px-[18px] py-3.5 text-center text-[#4A5A54]">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.05em]">Our server</span>
        <b className="block text-[15px] text-[#14201C]">None</b>
      </div>
    </div>
  );
};
