import React, { useState, useRef, useEffect } from 'react';

interface AiBadgeProps {
  className?: string;
  showTooltip?: boolean;
}

export const AiBadge: React.FC<AiBadgeProps> = ({
  className = '',
  showTooltip = true,
}) => {
  const [hovered, setHovered] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hovered) return;

    const handleOutsidePointerDown = (e: PointerEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
        setHovered(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHovered(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hovered]);

  return (
    <div
      ref={badgeRef}
      className="relative inline-flex items-center"
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHovered(false);
      }}
      onClick={(e) => {
        if (!showTooltip) return;
        e.stopPropagation();
        setHovered((prev) => !prev);
      }}
    >
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.72rem] font-bold bg-primary-cyan/15 text-primary-cyan border border-primary-cyan/30 cursor-help transition-all duration-200 select-none shadow-xs hover:bg-primary-cyan/25 hover:border-primary-cyan/50 ${className}`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-cyan animate-pulse"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
        AI 분석관
      </span>

      {showTooltip && hovered && (
        <div className="absolute left-0 bottom-full mb-2 w-60 sm:w-64 max-w-[calc(100vw-32px)] p-3 rounded-xl bg-card border border-glass-border shadow-2xl backdrop-blur-md text-[0.7rem] text-main leading-relaxed z-50 animate-fade-in pointer-events-none">
          <p className="font-bold text-primary-cyan mb-1 flex items-center gap-1">
            <span>핵또 공식 AI 데이터 브리핑</span>
          </p>
          <p className="text-muted whitespace-normal">
            본 게시글은 핵또 통계 알고리즘과 생성형 AI가 공공 회차 데이터를
            기반으로 작성한 데이터 분석 리포트입니다. 모든 추첨은 독립 시행이며
            당첨을 보장하지 않습니다.
          </p>
        </div>
      )}
    </div>
  );
};
