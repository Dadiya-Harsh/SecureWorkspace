import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full pb-12 sm:pb-16 pt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-[#5A6662]">
          <Link
            to="/privacy"
            className="hover:text-[#14201C] transition-colors font-medium py-0.5"
          >
            Privacy policy
          </Link>
          <span className="text-[#CAD2CD] select-none">·</span>
          <Link
            to="/terms"
            className="hover:text-[#14201C] transition-colors font-medium py-0.5"
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
            className="hover:text-[#14201C] transition-colors font-medium py-0.5"
          >
            Security model
          </Link>
          <span className="text-[#CAD2CD] select-none">·</span>
          <Link
            to="/contact"
            className="hover:text-[#14201C] transition-colors font-medium py-0.5"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};
