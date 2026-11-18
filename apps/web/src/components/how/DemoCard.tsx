import React, { type ReactNode } from 'react';

export const DemoCard: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`bg-white border border-[#D3DAD5] rounded-[14px] p-5 lift ${className}`}>
    {children}
  </div>
);

export const DemoButton: React.FC<{
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
}> = ({ onClick, children, variant = 'primary' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-h-[36px] rounded-lg text-sm font-semibold cursor-pointer transition-[transform,box-shadow,background-color,color] duration-200 ${
      variant === 'primary'
        ? 'px-4 bg-[#0F5C4D] text-white border border-[#0F5C4D] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,92,77,0.27)]'
        : 'px-3 text-xs bg-white text-[#14201C] border border-[#D3DAD5] hover:bg-[#0F5C4D] hover:text-white'
    }`}
  >
    {children}
  </button>
);
