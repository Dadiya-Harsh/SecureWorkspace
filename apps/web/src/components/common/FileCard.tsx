import React from 'react';
import { type FileCardData, SAMPLE_FILES } from './fileCardData';

export { type FileCardData, SAMPLE_FILES };

export interface FileCardProps {
  file: FileCardData;
  flipped?: boolean;
  flipAngle?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  draggable?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  flipped = false,
  flipAngle,
  className = '',
  style = {},
  onClick,
  draggable = false,
  onPointerDown,
}) => {
  // If flipAngle is specified use that, otherwise flipped boolean dictates 0deg vs 180deg
  const currentAngle = flipAngle !== undefined ? flipAngle : flipped ? 180 : 0;
  const isCurrentlyFlipped = (currentAngle % 360 >= 90 && currentAngle % 360 <= 270) || (currentAngle % 360 <= -90 && currentAngle % 360 >= -270);

  const baseCardStyle: React.CSSProperties = {
    position: 'relative',
    width: '150px',
    height: '108px',
    transformStyle: 'preserve-3d',
    willChange: 'transform',
    transform: `rotateY(${currentAngle}deg)`,
    transition: flipAngle !== undefined ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
    ...style,
  };

  const commonFaceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '10px',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    boxShadow:
      '0 1px 0 rgba(255,255,255,.5) inset, 0 10px 24px rgba(15,29,25,.18), 0 2px 4px rgba(15,29,25,.12)',
    overflow: 'hidden',
  };

  return (
    <div
      className={`file-card-root select-none ${className}`}
      style={baseCardStyle}
      onClick={onClick}
      draggable={draggable}
      onPointerDown={onPointerDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`File ${file.name}, ${isCurrentlyFlipped ? 'sealed ciphertext' : 'readable document'}, ${file.size}`}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Front Face */}
      {file.kind === 'photo' ? (
        <div
          className="face photo"
          style={{
            ...commonFaceStyle,
            backgroundColor: '#fff',
            padding: '7px 7px 22px',
          }}
        >
          <div
            className="pic relative h-full rounded-[3px]"
            style={{
              background:
                'linear-gradient(#8EC5E8, #CFE7F3 55%, #E9C46A 56%, #D4A24A)',
            }}
          >
            <div
              className="absolute w-[18px] h-[18px] rounded-full bg-[#FFE08A]"
              style={{ right: '16px', top: '10px' }}
            />
          </div>
          <div
            className="nm absolute text-[11px] font-bold text-[#14201C] truncate"
            style={{ left: '9px', bottom: '5px', maxWidth: '130px' }}
          >
            {file.name}
          </div>
        </div>
      ) : file.kind === 'pass' ? (
        <div
          className="face pass"
          style={{
            ...commonFaceStyle,
            backgroundColor: '#2B4C6F',
            color: '#E6EEF5',
            padding: '12px',
          }}
        >
          <div className="nm text-[12px] font-bold leading-[1.2] truncate">
            {file.name}
          </div>
          <div
            className="ln h-[5px] rounded-[3px] bg-white/25 mt-[7px]"
            style={{ width: '80%' }}
          />
          <div
            className="ln h-[5px] rounded-[3px] bg-white/25 mt-[7px]"
            style={{ width: '62%' }}
          />
          <div
            className="ln h-[5px] rounded-[3px] bg-white/25 mt-[7px]"
            style={{ width: '72%' }}
          />
          <span
            className="tag absolute right-[10px] bottom-[9px] text-[10px] font-bold px-[6px] py-[2px] rounded-[4px] bg-white/15"
          >
            {file.tag}
          </span>
        </div>
      ) : file.kind === 'note' ? (
        <div
          className="face note"
          style={{
            ...commonFaceStyle,
            backgroundColor: '#FFF1A8',
            color: '#14201C',
            padding: '12px',
          }}
        >
          <div className="nm text-[12px] font-medium leading-[1.2] truncate mono">
            {file.name}
          </div>
          <div
            className="ln h-[5px] rounded-[3px] bg-[rgba(20,32,28,.18)] mt-[7px]"
            style={{ width: '80%' }}
          />
          <div
            className="ln h-[5px] rounded-[3px] bg-[rgba(20,32,28,.18)] mt-[7px]"
            style={{ width: '62%' }}
          />
          <div
            className="ln h-[5px] rounded-[3px] bg-[rgba(20,32,28,.18)] mt-[7px]"
            style={{ width: '72%' }}
          />
          <span
            className="tag absolute right-[10px] bottom-[9px] text-[10px] font-bold px-[6px] py-[2px] rounded-[4px] bg-[rgba(20,32,28,.1)]"
          >
            {file.tag}
          </span>
        </div>
      ) : (
        <div
          className="face doc"
          style={{
            ...commonFaceStyle,
            backgroundColor: file.color,
            color: '#14201C',
            padding: '12px',
          }}
        >
          <div className="nm text-[12px] font-bold leading-[1.2] truncate">
            {file.name}
          </div>
          <div
            className="ln h-[5px] rounded-[3px] bg-[rgba(20,32,28,.18)] mt-[7px]"
            style={{ width: '80%' }}
          />
          <div
            className="ln h-[5px] rounded-[3px] bg-[rgba(20,32,28,.18)] mt-[7px]"
            style={{ width: '62%' }}
          />
          <div
            className="ln h-[5px] rounded-[3px] bg-[rgba(20,32,28,.18)] mt-[7px]"
            style={{ width: '72%' }}
          />
          <span
            className="tag absolute right-[10px] bottom-[9px] text-[10px] font-bold px-[6px] py-[2px] rounded-[4px] bg-[rgba(20,32,28,.1)]"
          >
            {file.tag}
          </span>
        </div>
      )}

      {/* Back Face (Sealed) */}
      <div
        className="face back flex flex-col justify-between"
        style={{
          ...commonFaceStyle,
          backgroundColor: '#2B3833',
          color: '#6FD0B8',
          padding: '12px',
          transform: 'rotateY(180deg)',
        }}
      >
        <div className="hx font-mono text-[12px] font-medium text-[#6FD0B8] truncate">
          {file.hash}
        </div>
        <div className="bx flex items-center gap-[6px] text-[11px] text-[#9DB2AA]">
          <svg
            width="12"
            height="14"
            viewBox="0 0 12 14"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="M3 6V4a3 3 0 0 1 6 0v2"
              stroke="#6FD0B8"
              strokeWidth="1.6"
              fill="none"
            />
            <rect x="1" y="6" width="10" height="8" rx="2" fill="#6FD0B8" />
          </svg>
          <span>sealed · {file.size}</span>
        </div>
      </div>
    </div>
  );
};
