import React, { useState, useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface TextDecodeProps {
  text: string;
  decoded: boolean;
  rowIndex?: number;
  charDurationMs?: number;
  rowDelayMs?: number;
  className?: string;
  onComplete?: () => void;
}

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

const getRandomChars = (length: number): string => {
  let res = '';
  for (let i = 0; i < length; i++) {
    res += CHARS[(Math.random() * 36) | 0];
  }
  return res;
};

export const TextDecode: React.FC<TextDecodeProps> = ({
  text,
  decoded,
  rowIndex = 0,
  charDurationMs = 28,
  rowDelayMs = 110,
  className = '',
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState<string>(() =>
    decoded ? text : getRandomChars(text.length)
  );
  const reducedMotion = usePrefersReducedMotion();
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayText(decoded ? text : getRandomChars(text.length));
      onComplete?.();
      return;
    }

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    const t0 = performance.now() + rowIndex * rowDelayMs;
    const len = text.length;

    const step = (now: number) => {
      const elapsed = now - t0;
      if (elapsed < 0) {
        animRef.current = requestAnimationFrame(step);
        return;
      }

      let current = '';
      let isDone = true;

      for (let j = 0; j < len; j++) {
        const threshold = j * charDurationMs;
        if (decoded) {
          if (elapsed > threshold) {
            current += text[j];
          } else {
            current += CHARS[(Math.random() * 36) | 0];
            isDone = false;
          }
        } else {
          // Re-scrambling backwards
          if (elapsed > threshold) {
            current += CHARS[(Math.random() * 36) | 0];
          } else {
            current += text[j];
            isDone = false;
          }
        }
      }

      setDisplayText(current);

      if (!isDone && elapsed < len * charDurationMs + 40) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayText(decoded ? text : getRandomChars(len));
        onComplete?.();
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [decoded, text, rowIndex, charDurationMs, rowDelayMs, reducedMotion, onComplete]);

  return (
    <span
      className={`text-decode-span inline-block font-mono ${className}`}
      aria-label={text}
    >
      <span aria-hidden="true">{displayText}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
};
