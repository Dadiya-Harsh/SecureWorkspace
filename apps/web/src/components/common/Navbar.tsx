import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export interface HeaderProps {
  currentSectionTitle?: string;
  currentSectionSubtitle?: string;
}

export const Navbar: React.FC<HeaderProps> = ({
  currentSectionTitle,
  currentSectionSubtitle,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [labelA, setLabelA] = useState(currentSectionTitle || '');
  const [labelB, setLabelB] = useState(currentSectionSubtitle || '');
  const location = useLocation();

  const closeMenu = () => setMobileMenuOpen(false);

  // Live section label via IntersectionObserver with rootMargin: '-45% 0px -50% 0px'
  useEffect(() => {
    if (currentSectionTitle || currentSectionSubtitle) {
      setLabelA(currentSectionTitle || '');
      setLabelB(currentSectionSubtitle || '');
      return;
    }

    const sections = document.querySelectorAll<HTMLElement>('[data-a]');
    if (sections.length === 0) {
      setLabelA('');
      setLabelB('');
      return;
    }

    // Set initial label to first section
    const first = sections[0];
    if (first && first.dataset.a) {
      setLabelA(first.dataset.a);
      setLabelB(first.dataset.b || '');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            if (el.dataset.a) {
              setLabelA(el.dataset.a);
              setLabelB(el.dataset.b || '');
            }
          }
        }
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, [location.pathname, currentSectionTitle, currentSectionSubtitle]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 h-16 flex items-center justify-between gap-4 border-b border-[#D3DAD5] backdrop-blur-[8px]"
        style={{
          backgroundColor: 'rgba(237, 240, 237, 0.82)',
          padding: '0 max(4vw, 16px)',
        }}
      >
        {/* Left: Brand Logo & Title */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-[10px] font-bold text-[17px] text-[#14201C] whitespace-nowrap no-underline focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 128 128"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="128" height="128" rx="28" fill="#0F5C4D" />
            <path
              d="M26 44 H50 a6 6 0 0 1 6 6 V52 H98 a10 10 0 0 1 10 10 V94 a10 10 0 0 1 -10 10 H30 a10 10 0 0 1 -10 -10 V50 a6 6 0 0 1 6 -6 Z M64 65 a9 9 0 0 1 4.5 16.8 L72 94 H56 L59.5 81.8 A9 9 0 0 1 64 65 Z"
              fill="#EDF0ED"
              fillRule="evenodd"
            />
          </svg>
          <span>SecureWorkspace</span>
        </Link>

        {/* Desktop Nav (hidden <= 760px) */}
        <nav
          className="hidden md:flex items-center text-[15px]"
          style={{ gap: '22px' }}
          aria-label="Main"
        >
          <Link
            to="/how-it-works"
            aria-current={isActive('/how-it-works') ? 'page' : undefined}
            className={`py-2 text-[#14201C] no-underline border-b-2 transition-colors hover:text-[#0F5C4D] ${
              isActive('/how-it-works')
                ? 'font-bold border-[#0F5C4D]'
                : 'font-medium border-transparent'
            }`}
          >
            How it works
          </Link>
          <Link
            to="/security"
            aria-current={isActive('/security') ? 'page' : undefined}
            className={`py-2 text-[#14201C] no-underline border-b-2 transition-colors hover:text-[#0F5C4D] ${
              isActive('/security')
                ? 'font-bold border-[#0F5C4D]'
                : 'font-medium border-transparent'
            }`}
          >
            Security
          </Link>
          <Link
            to="/docs"
            aria-current={isActive('/docs') ? 'page' : undefined}
            className={`py-2 text-[#14201C] no-underline border-b-2 transition-colors hover:text-[#0F5C4D] ${
              isActive('/docs')
                ? 'font-bold border-[#0F5C4D]'
                : 'font-medium border-transparent'
            }`}
          >
            Docs
          </Link>
          <a
            href="https://github.com/Dadiya-Harsh/SecureWorkspace"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 text-[#14201C] font-medium no-underline border-b-2 border-transparent transition-colors hover:text-[#0F5C4D]"
          >
            GitHub
          </a>
          <Link
            to="/viewer"
            aria-current={isActive('/viewer') ? 'page' : undefined}
            className={`py-2 text-[#14201C] no-underline border-b-2 transition-colors hover:text-[#0F5C4D] ${
              isActive('/viewer')
                ? 'font-bold border-[#0F5C4D]'
                : 'font-medium border-transparent'
            }`}
          >
            Web viewer
          </Link>
        </nav>

        {/* Centre: Live section label (hidden < 1280px) */}
        <div
          className="hidden xl:flex items-center gap-[10px] text-[15px] text-[#4A5A54] overflow-hidden whitespace-nowrap"
          aria-live="polite"
        >
          {labelA && (
            <>
              <b className="text-[#14201C] font-bold">{labelA}</b>
              <span className="text-[#4A5A54] transition-opacity duration-300">
                {labelB}
              </span>
            </>
          )}
        </div>

        {/* Right: CTA & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <Link
            to="/download"
            className="hidden sm:inline-flex items-center justify-center h-11 px-[18px] bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white text-[15px] font-semibold rounded-lg no-underline transition-all duration-150 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
          >
            Download beta
          </Link>

          {/* Mobile Menu Button (tap target min 44x44px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-[#14201C] hover:bg-[#D3DAD5]/40 transition-colors focus-visible:outline-2 focus-visible:outline-[#0F5C4D]"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[#14201C]" />
            ) : (
              <Menu className="w-6 h-6 text-[#14201C]" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-[#EDF0ED]/95 backdrop-blur-md md:hidden flex flex-col p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <nav className="flex flex-col gap-2 text-base font-medium">
            <Link
              to="/how-it-works"
              onClick={closeMenu}
              className={`flex items-center min-h-[44px] px-3 rounded-lg text-[#14201C] ${
                isActive('/how-it-works')
                  ? 'font-bold bg-[#D3DAD5]/50 text-[#0F5C4D]'
                  : 'hover:bg-[#D3DAD5]/30'
              }`}
            >
              How it works
            </Link>
            <Link
              to="/security"
              onClick={closeMenu}
              className={`flex items-center min-h-[44px] px-3 rounded-lg text-[#14201C] ${
                isActive('/security')
                  ? 'font-bold bg-[#D3DAD5]/50 text-[#0F5C4D]'
                  : 'hover:bg-[#D3DAD5]/30'
              }`}
            >
              Security
            </Link>
            <Link
              to="/docs"
              onClick={closeMenu}
              className={`flex items-center min-h-[44px] px-3 rounded-lg text-[#14201C] ${
                isActive('/docs')
                  ? 'font-bold bg-[#D3DAD5]/50 text-[#0F5C4D]'
                  : 'hover:bg-[#D3DAD5]/30'
              }`}
            >
              Docs
            </Link>
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="flex items-center min-h-[44px] px-3 rounded-lg text-[#14201C] hover:bg-[#D3DAD5]/30"
            >
              GitHub
            </a>
            <Link
              to="/viewer"
              onClick={closeMenu}
              className={`flex items-center min-h-[44px] px-3 rounded-lg text-[#14201C] ${
                isActive('/viewer')
                  ? 'font-bold bg-[#D3DAD5]/50 text-[#0F5C4D]'
                  : 'hover:bg-[#D3DAD5]/30'
              }`}
            >
              Web viewer
            </Link>
          </nav>

          <div className="mt-6 pt-6 border-t border-[#D3DAD5] flex flex-col gap-3">
            <Link
              to="/download"
              onClick={closeMenu}
              className="flex items-center justify-center min-h-[44px] px-5 bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white font-semibold rounded-lg text-center"
            >
              Download beta
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export const Header = Navbar;
