import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'vault' | 'mineral' | 'danger' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'vault',
  className = '',
}) => {
  const variantStyles = {
    vault: 'bg-emerald-50 text-[#0F5C4D] border border-emerald-200/60 font-semibold',
    mineral: 'bg-[#EDF0ED] text-[#14201C] border border-[#E2E6E3]',
    danger: 'bg-red-50 text-[#9B2F1F] border border-red-200/60',
    outline: 'bg-transparent text-[#5A6662] border border-[#E2E6E3]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs tracking-wide uppercase font-mono ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
