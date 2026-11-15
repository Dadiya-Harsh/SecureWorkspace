import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures anchor links (#download, #how-it-works) scroll smoothly to target elements
 * both on initial page load, hash change, and client-side navigation.
 */
export const ScrollToAnchor: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const scrollToElement = () => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return true;
        }
        return false;
      };

      // Try immediately
      if (scrollToElement()) {
        return;
      }

      // If not yet rendered (e.g. initial SPA mount), poll up to 1.5s
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (scrollToElement() || attempts >= 30) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
};
