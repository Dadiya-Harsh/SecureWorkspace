import React from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface MarchingDashProps {
  active?: boolean;
  orientation?: 'horizontal' | 'vertical';
  hasDot?: boolean;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MarchingDash: React.FC<MarchingDashProps> = ({
  active = true,
  orientation = 'horizontal',
  hasDot = false,
  label,
  className = '',
  style = {},
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const isHorizontal = orientation === 'horizontal';

  const lineColor = active ? '#0F5C4D' : '#4A5A54';
  const shouldAnimate = active && !reducedMotion;

  const baseStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'relative',
        height: '2px',
        width: '100%',
        minWidth: '24px',
        backgroundImage: `repeating-linear-gradient(90deg, ${lineColor} 0 6px, transparent 6px 12px)`,
        backgroundSize: '12px 2px',
        animation: shouldAnimate ? 'march 0.7s linear infinite' : 'none',
        opacity: active ? 1 : 0.45,
        ...style,
      }
    : {
        position: 'relative',
        width: '2px',
        height: '100%',
        minHeight: '28px',
        backgroundImage: `repeating-linear-gradient(180deg, ${lineColor} 0 6px, transparent 6px 12px)`,
        backgroundSize: '2px 12px',
        animation: shouldAnimate ? 'marchy 0.7s linear infinite' : 'none',
        opacity: active ? 1 : 0.45,
        ...style,
      };

  return (
    <div
      className={`marching-dash-root ${className}`}
      style={baseStyle}
      role="presentation"
      aria-hidden={!label}
    >
      {/* Label pill on top/side of line */}
      {label && (
        <em
          className="absolute font-semibold text-[12px] whitespace-nowrap not-italic transition-colors"
          style={
            isHorizontal
              ? {
                  left: '50%',
                  bottom: '9px',
                  transform: 'translateX(-50%)',
                  color: active ? '#14201C' : '#4A5A54',
                  fontFamily: "'Hanken Grotesk', sans-serif",
                }
              : {
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: active ? '#14201C' : '#4A5A54',
                  fontFamily: "'Hanken Grotesk', sans-serif",
                }
          }
        >
          {label}
        </em>
      )}

      {/* Traveling 8px mint dot */}
      {hasDot && active && !reducedMotion && (
        <i
          className="absolute rounded-full pointer-events-none"
          style={
            isHorizontal
              ? {
                  top: '-3px',
                  left: 0,
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#6FD0B8',
                  animation: 'trv 1.5s linear infinite',
                }
              : {
                  left: '-3px',
                  top: 0,
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#6FD0B8',
                  animation: 'trvy 1.5s linear infinite',
                }
          }
          aria-hidden="true"
        />
      )}
    </div>
  );
};
