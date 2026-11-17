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
        <div className="hidden md:flex items-center gap-7">
          <nav className="flex items-center gap-7 text-sm font-medium text-[#14201C]">
            <Link
              to="/how-it-works"
              className={`relative group hover:text-[#0F5C4D] transition-colors py-1 ${
                location.pathname === '/how-it-works' ? 'text-[#0F5C4D] font-semibold' : ''
              }`}
            >
              How it works
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F5C4D] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out pointer-events-none" />
            </Link>
            <Link
              to="/security"
              className={`relative group hover:text-[#0F5C4D] transition-colors py-1 ${
                location.pathname === '/security' ? 'text-[#0F5C4D] font-semibold' : ''
              }`}
            >
              Security
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F5C4D] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out pointer-events-none" />
            </Link>
            <Link
              to="/docs"
              className={`relative group hover:text-[#0F5C4D] transition-colors py-1 ${
                location.pathname === '/docs' ? 'text-[#0F5C4D] font-semibold' : ''
              }`}
            >
              Docs
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F5C4D] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out pointer-events-none" />
            </Link>
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group hover:text-[#0F5C4D] transition-colors py-1"
            >
              GitHub
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F5C4D] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out pointer-events-none" />
            </a>
            <Link
              to="/viewer"
              className={`relative group hover:text-[#0F5C4D] transition-colors py-1 ${
                location.pathname === '/viewer' ? 'text-[#0F5C4D] font-semibold' : ''
              }`}
            >
              Web viewer
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F5C4D] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out pointer-events-none" />
            </Link>
          </nav>

          <Link to="/download">
            <button className="bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white px-5 py-2 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm hover:-translate-y-0.5">
              Download
            </button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2.5 md:hidden">
          <Link to="/download" onClick={closeMenu}>
            <button className="bg-[#0F5C4D] text-white px-3 py-1.5 rounded-lg font-medium text-xs shadow-xs">
              Download
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
            <Link
              to="/how-it-works"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              How it works
            </Link>
            <Link
              to="/security"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Security
            </Link>
            <Link
              to="/docs"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Docs
            </Link>
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              GitHub ↗
            </a>
            <Link
              to="/viewer"
              onClick={closeMenu}
              className="py-1.5 hover:text-[#0F5C4D] transition-colors"
            >
              Web viewer
            </Link>
            <Link
              to="/download"
              onClick={closeMenu}
              className="py-1.5 text-[#0F5C4D] font-semibold"
            >
              Download for Windows
            </Link>
          </nav>

          <div className="pt-2 border-t border-[#E2E6E3] flex gap-3 text-xs text-[#5A6662]">
            <Link to="/privacy" onClick={closeMenu}>Privacy</Link>
            <span>·</span>
            <Link to="/terms" onClick={closeMenu}>Terms</Link>
            <span>·</span>
            <Link to="/contact" onClick={closeMenu}>Contact</Link>
          </div>
        </div>
      )}
    </header>
  );
};
