import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="w-full relative z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4 flex items-center justify-between">
        {/* Brand Official Vector Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.01]"
        >
          <img
            src="/branding/logo-horizontal.svg"
            alt="SecureWorkspace"
            className="h-8 sm:h-9 w-auto"
          />
        </Link>

        {/* Desktop Navigation Links and CTA */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-7 text-sm font-medium text-[#14201C]">
            <a
              href="/#how-it-works"
              className="hover:text-[#0F5C4D] transition-colors py-1"
            >
              How it works
            </a>
            <Link
              to="/security"
              className={`hover:text-[#0F5C4D] transition-colors py-1 ${
                location.pathname === '/security' ? 'text-[#0F5C4D] font-semibold' : ''
              }`}
            >
              Security
            </Link>
            <a
              href="/#download"
              className="hover:text-[#0F5C4D] transition-colors py-1"
            >
              Download
            </a>
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0F5C4D] transition-colors py-1"
            >
              GitHub
            </a>
          </nav>

          <Link to="/viewer">
            <button className="bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm hover:-translate-y-0.5">
              Open web viewer
            </button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-3 md:hidden">
          <Link to="/viewer" onClick={closeMenu}>
            <button className="bg-[#0F5C4D] text-white px-3.5 py-1.5 rounded-lg font-medium text-xs shadow-xs">
              Web viewer
            </button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#14201C] hover:bg-[#E2E6E3]/60 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E6E3] shadow-md px-6 py-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3 font-medium text-sm text-[#14201C]">
            <a
              href="/#how-it-works"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              How it works
            </a>
            <Link
              to="/security"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Security Model
            </Link>
            <a
              href="/#download"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Download for Windows
            </a>
            <Link
              to="/privacy"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/contact"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Contact & Support
            </Link>
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Source on GitHub ↗
            </a>
          </nav>

          <div className="pt-2">
            <Link to="/viewer" onClick={closeMenu} className="block w-full">
              <button className="w-full bg-[#0F5C4D] hover:bg-[#0C4B3E] text-white py-3 rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-xs text-center">
                Open web viewer
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
