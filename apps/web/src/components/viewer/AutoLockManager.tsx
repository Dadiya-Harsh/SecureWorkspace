import { useEffect, useRef } from 'react';
import { useSecurityStore } from '../../store/useSecurityStore';
import { useVaultStore } from '../../store/useVaultStore';

export const AutoLockManager: React.FC = () => {
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const lockVault = useVaultStore((s) => s.lockVault);
  const decrement = useSecurityStore((s) => s.decrement);
  const resetTimer = useSecurityStore((s) => s.resetTimer);
  const isPaused = useSecurityStore((s) => s.isPaused);

  const lastActivityRef = useRef<number>(Date.now());

  // Inactivity listener to reset timer on user input
  useEffect(() => {
    if (!isUnlocked) return;

    const handleActivity = () => {
      const now = Date.now();
      // Throttle activity resets to at most once per 2 seconds
      if (now - lastActivityRef.current > 2000) {
        lastActivityRef.current = now;
        resetTimer();
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [isUnlocked, resetTimer]);

  // 1-second countdown interval
  useEffect(() => {
    if (!isUnlocked) return;

    const timer = setInterval(() => {
      if (isPaused) return;
      const remaining = decrement();
      if (remaining <= 0) {
        console.warn('Auto-lock timer expired: Zeroizing memory and locking vault');
        lockVault();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isUnlocked, isPaused, decrement, lockVault]);

  return null;
};
