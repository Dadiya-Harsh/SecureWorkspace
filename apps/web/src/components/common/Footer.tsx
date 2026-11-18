import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const { pathname } = useLocation();
  const cur = (path: string) =>
    pathname === path ? 'text-[#14201C] font-bold' : 'text-[#5A6662]';
  return (
    <footer className="w-full pb-12 sm:pb-16 pt-6 border-t border-[#CAD2CD]/60 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 text-xs sm:text-sm text-[#5A6662] text-center">
          <Link
            to="/docs"
            aria-current={pathname === '/docs' ? 'page' : undefined}
            className={`hover:text-[#14201C] transition-colors font-medium py-0.5 ${cur('/docs')}`}
          >
            Docs
          </Link>
          <span className="text-[#CAD2CD] select-none">·</span>
          <Link
            to="/privacy"
            aria-current={pathname === '/privacy' ? 'page' : undefined}
            className={`hover:text-[#14201C] transition-colors font-medium py-0.5 ${cur('/privacy')}`}
          >
            Privacy policy
          </Link>
          <span className="text-[#CAD2CD] select-none">·</span>
          <Link
            to="/terms"
            aria-current={pathname === '/terms' ? 'page' : undefined}
            className={`hover:text-[#14201C] transition-colors font-medium py-0.5 ${cur('/terms')}`}
          >
            Terms
          </Link>
          <span className="text-[#CAD2CD] select-none">·</span>
          <a
            href="https://github.com/Dadiya-Harsh/SecureWorkspace"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#14201C] transition-colors py-0.5"
          >
            Source on GitHub
          </a>
          <span className="text-[#CAD2CD] select-none">·</span>
          <Link
            to="/security"
            aria-current={pathname === '/security' ? 'page' : undefined}
            className={`hover:text-[#14201C] transition-colors font-medium py-0.5 ${cur('/security')}`}
          >
            Security model
          </Link>
          <span className="text-[#CAD2CD] select-none">·</span>
          <Link
            to="/contact"
            aria-current={pathname === '/contact' ? 'page' : undefined}
            className={`hover:text-[#14201C] transition-colors font-medium py-0.5 ${cur('/contact')}`}
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};
