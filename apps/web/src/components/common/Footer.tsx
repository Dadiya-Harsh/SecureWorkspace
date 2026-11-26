import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface FooterProps {
  compact?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ compact }) => {
  const { pathname } = useLocation();
  const isCompact = compact ?? pathname === '/viewer';

  return (
    <footer
      className="relative overflow-hidden border-t border-[#D3DAD5] bg-[#EDF0ED]"
      style={{
        padding: isCompact
          ? '24px max(5vw, 16px) 24px'
          : '70px max(5vw, 16px) 40px',
      }}
      data-a="SecureWorkspace"
      data-b="Free · Open source · Windows beta"
    >
      {/* Seal Badge - Scaled and positioned responsively so it never overlaps mobile text */}
      {!isCompact && (
        <div
          className="absolute z-0 sm:z-10 pointer-events-none select-none right-4 sm:right-[max(6vw,20px)] top-6 sm:top-[34px] w-16 h-16 sm:w-28 sm:h-28 rounded-full opacity-35 sm:opacity-100"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #1E8F78, #0F5C4D 60%, #0A4237)',
            display: 'grid',
            placeItems: 'center',
            boxShadow:
              '0 10px 24px rgba(15,29,25,.3), inset 0 -6px 10px rgba(0,0,0,.25)',
            transform: 'rotate(-12deg)',
          }}
          aria-hidden="true"
        >
          <svg className="w-8 h-8 sm:w-14 sm:h-14" viewBox="20 30 90 80" aria-hidden="true">
            <path
              d="M26 44 H50 a6 6 0 0 1 6 6 V52 H98 a10 10 0 0 1 10 10 V94 a10 10 0 0 1 -10 10 H30 a10 10 0 0 1 -10 -10 V50 a6 6 0 0 1 6 -6 Z M64 65 a9 9 0 0 1 4.5 16.8 L72 94 H56 L59.5 81.8 A9 9 0 0 1 64 65 Z"
              fill="#EDF0ED"
              fillRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* First line (13px muted) - only when not compact */}
      {!isCompact && (
        <p className="relative z-10 text-[13px] text-[#4A5A54] m-0 font-normal pr-16 sm:pr-0">
          Free · Open source · Apache 2.0 · Windows beta
        </p>
      )}

      {/* Link row: 15px semibold, 44px min height, 28px gap, wraps on phones */}
      <nav
        className="relative z-10 flex flex-wrap items-center text-[15px] font-semibold text-[#14201C] gap-x-6 sm:gap-x-7 gap-y-1"
        style={{ margin: isCompact ? '0' : '14px 0 22px' }}
        aria-label="Footer"
      >
        <Link
          to="/docs"
          className="inline-flex items-center min-h-[44px] text-[#14201C] hover:text-[#0F5C4D] hover:underline no-underline transition-colors focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
        >
          Docs
        </Link>
        <Link
          to="/privacy"
          className="inline-flex items-center min-h-[44px] text-[#14201C] hover:text-[#0F5C4D] hover:underline no-underline transition-colors focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
        >
          Privacy policy
        </Link>
        <Link
          to="/terms"
          className="inline-flex items-center min-h-[44px] text-[#14201C] hover:text-[#0F5C4D] hover:underline no-underline transition-colors focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
        >
          Terms
        </Link>
        <a
          href="https://github.com/Dadiya-Harsh/SecureWorkspace"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center min-h-[44px] text-[#14201C] hover:text-[#0F5C4D] hover:underline no-underline transition-colors focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
        >
          Source on GitHub
        </a>
        <Link
          to="/security"
          className="inline-flex items-center min-h-[44px] text-[#14201C] hover:text-[#0F5C4D] hover:underline no-underline transition-colors focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
        >
          Security model
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center min-h-[44px] text-[#14201C] hover:text-[#0F5C4D] hover:underline no-underline transition-colors focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
        >
          Contact
        </Link>
      </nav>

      {/* Giant wordmark "SecureWorkspace" - Decorative, aria-hidden, hidden in compact */}
      {!isCompact && (
        <div
          className="select-none pointer-events-none"
          style={{
            fontSize: 'clamp(48px, 12.5vw, 190px)',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            whiteSpace: 'nowrap',
            color: '#D3DAD5',
          }}
          aria-hidden="true"
        >
          SecureWorkspace
        </div>
      )}
    </footer>
  );
};
