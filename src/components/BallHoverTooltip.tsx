import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { getBallStyle, getTemperatureMeta } from '../utils';

interface BallHoverTooltipProps {
  ball: number;
  children: React.ReactNode;
  disabled?: boolean;
}

export function BallHoverTooltip({
  ball,
  children,
  disabled = false,
}: BallHoverTooltipProps) {
  const { ballStatsMap } = useApp();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    placeBelow: boolean;
  }>({
    left: 0,
    top: 0,
    placeBelow: false,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const stat = ball >= 1 && ball <= 45 ? ballStatsMap[ball] : undefined;

  const clearHideTimer = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipEstimatedHeight = 130;
    const tooltipHalfWidth = 115;

    const placeBelow = rect.top < tooltipEstimatedHeight + 16;
    const rawLeft = rect.left + rect.width / 2;
    const clampedLeft = Math.max(
      tooltipHalfWidth + 12,
      Math.min(window.innerWidth - tooltipHalfWidth - 12, rawLeft),
    );

    setCoords({
      left: clampedLeft,
      top: placeBelow ? rect.bottom + 10 : rect.top - 10,
      placeBelow,
    });
  }, []);

  const handleOpen = useCallback(() => {
    if (disabled || !stat) return;
    clearHideTimer();
    updatePosition();
    setVisible(true);
  }, [clearHideTimer, disabled, stat, updatePosition]);

  const handleDelayedClose = useCallback(() => {
    clearHideTimer();
    hideTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 90);
  }, [clearHideTimer]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };

    const handleScrollOrResize = () => {
      setVisible(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [visible]);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  if (ball < 1 || ball > 45) {
    return <>{children}</>;
  }

  const tempMeta = getTemperatureMeta(stat?.status);

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex items-center"
        onMouseEnter={handleOpen}
        onMouseLeave={handleDelayedClose}
        onFocus={handleOpen}
        onBlur={handleDelayedClose}
      >
        {children}
      </div>

      {visible &&
        stat &&
        createPortal(
          <div
            onMouseEnter={clearHideTimer}
            onMouseLeave={handleDelayedClose}
            className={`pointer-events-auto fixed z-[99999] min-w-[215px] rounded-xl border border-primary-cyan/35 bg-modal px-3.5 py-2.5 text-[0.78rem] leading-[1.45] text-main shadow-glass backdrop-blur-md ${
              coords.placeBelow
                ? '-translate-x-1/2 translate-y-0'
                : '-translate-x-1/2 -translate-y-full'
            }`}
            style={{
              left: `${coords.left}px`,
              top: `${coords.top}px`,
            }}
          >
            {/* Header: Ball + Rank + Temperature */}
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-glass-border pb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[0.72rem] font-extrabold"
                  style={getBallStyle(ball)}
                >
                  {ball}
                </span>
                <span className="text-[0.82rem] font-bold">{ball}번</span>
                <span className="text-[0.68rem] text-dim">({stat.rank}위)</span>
              </div>

              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-bold"
                style={{
                  color: tempMeta.color,
                  background: tempMeta.bg,
                  borderColor: tempMeta.border,
                }}
              >
                <span>{tempMeta.icon}</span>
                <span>{tempMeta.shortLabel}</span>
              </span>
            </div>

            {/* Body Metrics */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-dim">등장 확률</span>
                <span className="font-bold text-primary-cyan">
                  {stat.appearanceRate.toFixed(2)}%{' '}
                  <span className="text-[0.72rem] font-normal text-muted">
                    ({stat.totalCount}/{stat.totalEpisodes}회)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2.5">
                <span className="text-dim">현재 온도</span>
                <span
                  className="font-semibold"
                  style={{ color: tempMeta.color }}
                >
                  {tempMeta.label}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2.5">
                <span className="text-dim">미출현 간격</span>
                <span className="font-semibold text-main">
                  {stat.skip === 0 ? '최근 회차 당첨' : `${stat.skip}주 미출현`}{' '}
                  <span className="text-[0.7rem] font-normal text-muted">
                    (최근 {stat.latestEpisode}회)
                  </span>
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
export default BallHoverTooltip;
