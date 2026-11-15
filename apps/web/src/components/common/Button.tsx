import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow-sm',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#0F5C4D] text-white hover:bg-[#0C4B3E] active:bg-[#09392F] focus:ring-[#0F5C4D]',
    secondary:
      'bg-[#EDF0ED] text-[#14201C] hover:bg-[#E2E6E3] active:bg-[#D5DBD7] border border-[#E2E6E3] focus:ring-[#5A6662]',
    outline:
      'bg-white text-[#14201C] hover:bg-[#F8FAF8] border border-[#E2E6E3] hover:border-[#CAD2CD] focus:ring-[#0F5C4D]',
    danger:
      'bg-[#9B2F1F] text-white hover:bg-[#822618] active:bg-[#681E13] focus:ring-[#9B2F1F]',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
