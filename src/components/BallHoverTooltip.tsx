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
        style={{ display: 'inline-flex', alignItems: 'center' }}
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
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              transform: coords.placeBelow
                ? 'translate(-50%, 0)'
                : 'translate(-50%, -100%)',
              zIndex: 99999,
              minWidth: '215px',
              background: 'rgba(10, 15, 30, 0.96)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '12px',
              padding: '10px 13px',
              boxShadow:
                '0 12px 28px rgba(0, 0, 0, 0.75), 0 0 18px rgba(0, 240, 255, 0.15)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              lineHeight: 1.45,
              pointerEvents: 'auto',
            }}
          >
            {/* Header: Ball + Rank + Temperature */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                paddingBottom: '7px',
                marginBottom: '7px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span
                  style={{
                    ...getBallStyle(ball),
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  {ball}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  {ball}번
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-dim)',
                  }}
                >
                  ({stat.rank}위)
                </span>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: tempMeta.color,
                  background: tempMeta.bg,
                  border: `1px solid ${tempMeta.border}`,
                  padding: '2px 7px',
                  borderRadius: '999px',
                }}
              >
                <span>{tempMeta.icon}</span>
                <span>{tempMeta.shortLabel}</span>
              </span>
            </div>

            {/* Body Metrics */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ color: 'var(--text-dim)' }}>등장 확률</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--primary-cyan)',
                  }}
                >
                  {stat.appearanceRate.toFixed(2)}%{' '}
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ({stat.totalCount}/{stat.totalEpisodes}회)
                  </span>
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ color: 'var(--text-dim)' }}>현재 온도</span>
                <span style={{ fontWeight: 600, color: tempMeta.color }}>
                  {tempMeta.label}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ color: 'var(--text-dim)' }}>미출현 간격</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {stat.skip === 0 ? '최근 회차 당첨' : `${stat.skip}주 미출현`}{' '}
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                    }}
                  >
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
