import { useState } from 'react';
import type { LottoAnalysis } from '../types';
import { getBallStyle } from '../utils';
import { BallHoverTooltip } from './BallHoverTooltip';

interface LottoAnalysisCardProps {
  numbers: number[];
  analysis?: LottoAnalysis | null;
  title?: string;
}

export function LottoAnalysisCard({
  numbers,
  analysis,
  title,
}: LottoAnalysisCardProps) {
  const [hoveredNumbers, setHoveredNumbers] = useState<Set<number> | null>(
    null,
  );

  if (!numbers || numbers.length === 0) return null;
  if (!analysis) {
    return (
      <div
        style={{
          color: 'var(--text-dim)',
          fontSize: '0.85rem',
          padding: '10px 0',
        }}
      >
        분석 데이터가 존재하지 않습니다.
      </div>
    );
  }

  // Slice to main 6 numbers if 7 (bonus) is passed, as analytical metrics are based on the main 6 numbers
  const mainNumbers = numbers.slice(0, 6);
  const bonusNumber = numbers[6];

  // Helper to check if a number is highlighted
  const isHighlighted = (num: number) => {
    if (hoveredNumbers === null) return true;
    return hoveredNumbers.has(num);
  };

  // Generate decade range numbers
  const getDecadeNumbers = (decadeIndex: number) => {
    switch (decadeIndex) {
      case 0:
        return mainNumbers.filter((n) => n >= 1 && n <= 9);
      case 1:
        return mainNumbers.filter((n) => n >= 10 && n <= 19);
      case 2:
        return mainNumbers.filter((n) => n >= 20 && n <= 29);
      case 3:
        return mainNumbers.filter((n) => n >= 30 && n <= 39);
      case 4:
        return mainNumbers.filter((n) => n >= 40 && n <= 45);
      default:
        return [];
    }
  };

  // Gather last digit groups
  const lastDigits = [
    { digit: 0, nums: analysis.lastDigit0 || [] },
    { digit: 1, nums: analysis.lastDigit1 || [] },
    { digit: 2, nums: analysis.lastDigit2 || [] },
    { digit: 3, nums: analysis.lastDigit3 || [] },
    { digit: 4, nums: analysis.lastDigit4 || [] },
    { digit: 5, nums: analysis.lastDigit5 || [] },
    { digit: 6, nums: analysis.lastDigit6 || [] },
    { digit: 7, nums: analysis.lastDigit7 || [] },
    { digit: 8, nums: analysis.lastDigit8 || [] },
    { digit: 9, nums: analysis.lastDigit9 || [] },
  ].filter((item) => item.nums && item.nums.length > 0);

  // Gather temperature groups
  const getTempNumbers = (temp: 'HOT' | 'WARM' | 'COLD') => {
    if (!analysis.temperatures) return [];
    return mainNumbers.filter((num) => analysis.temperatures?.[num] === temp);
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '20px',
        marginTop: '16px',
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.01)',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </div>
      )}

      {/* Interactive Lotto Balls Display */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.03)',
        }}
      >
        {mainNumbers.map((num, i) => {
          const active = isHighlighted(num);
          const borderStyle = active
            ? '2px solid #ffffff'
            : '1px solid rgba(255, 255, 255, 0.1)';
          const scale = active ? '1.15' : '0.9';
          const opacity = active ? '1' : '0.25';
          const shadow = active ? getBallStyle(num).boxShadow : 'none';

          return (
            <BallHoverTooltip key={i} ball={num}>
              <div
                className="lotto-ball"
                style={{
                  ...getBallStyle(num),
                  boxShadow: shadow,
                  border: borderStyle,
                  transform: `scale(${scale})`,
                  opacity: opacity,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {num}
              </div>
            </BallHoverTooltip>
          );
        })}
        {bonusNumber !== undefined && (
          <>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--text-dim)',
                margin: '0 2px',
                opacity: hoveredNumbers === null ? 1 : 0.25,
                transition: 'opacity 0.25s',
              }}
            >
              +
            </div>
            <BallHoverTooltip ball={bonusNumber}>
              <div
                className="lotto-ball"
                style={{
                  ...getBallStyle(bonusNumber),
                  border:
                    hoveredNumbers === null
                      ? '1px solid rgba(255, 255, 255, 0.15)'
                      : '1px solid rgba(255,255,255,0.05)',
                  transform:
                    hoveredNumbers === null ? 'scale(1)' : 'scale(0.9)',
                  opacity: hoveredNumbers === null ? 1 : 0.25,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {bonusNumber}
              </div>
            </BallHoverTooltip>
          </>
        )}
      </div>

      {/* Grid of Interactive Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          className="feature-item"
          style={{
            padding: '10px 14px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            총합
          </div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              marginTop: '4px',
            }}
          >
            {analysis.sum}
          </div>
        </div>

        <div
          className="feature-item"
          style={{
            padding: '10px 14px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            AC값
          </div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              marginTop: '4px',
            }}
          >
            {analysis.ac}
          </div>
        </div>

        <div
          className="feature-item"
          style={{
            padding: '10px 14px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            끝자리 합
          </div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              marginTop: '4px',
            }}
          >
            {analysis.sumLastDigits}
          </div>
        </div>
      </div>

      {/* Interactive Sections */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '16px',
        }}
      >
        {/* Odd/Even */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              width: '65px',
              flexShrink: 0,
            }}
          >
            홀짝 분석
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(
                  new Set(mainNumbers.filter((n) => n % 2 !== 0)),
                )
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: 'var(--text-main)',
              }}
              onPointerEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              홀수: {analysis.odd}개
            </span>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(
                  new Set(mainNumbers.filter((n) => n % 2 === 0)),
                )
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: 'var(--text-main)',
              }}
              onPointerEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              짝수: {analysis.even}개
            </span>
          </div>
        </div>

        {/* Decades */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              width: '65px',
              flexShrink: 0,
            }}
          >
            번대수 분포
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: '단번대', val: analysis.cnt0s, idx: 0 },
              { label: '10번대', val: analysis.cnt10s, idx: 1 },
              { label: '20번대', val: analysis.cnt20s, idx: 2 },
              { label: '30번대', val: analysis.cnt30s, idx: 3 },
              { label: '40번대', val: analysis.cnt40s, idx: 4 },
            ]
              .filter((d) => d.val > 0)
              .map((d) => (
                <span
                  key={d.idx}
                  onMouseEnter={() =>
                    setHoveredNumbers(new Set(getDecadeNumbers(d.idx)))
                  }
                  onMouseLeave={() => setHoveredNumbers(null)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'var(--text-main)',
                  }}
                  onPointerEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                    e.currentTarget.style.background =
                      'rgba(0, 240, 255, 0.05)';
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  {d.label}: {d.val}개
                </span>
              ))}
          </div>
        </div>

        {/* Last Digits */}
        {lastDigits.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                width: '65px',
                flexShrink: 0,
              }}
            >
              끝자리 그룹
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {lastDigits.map((item) => (
                <span
                  key={item.digit}
                  onMouseEnter={() => setHoveredNumbers(new Set(item.nums))}
                  onMouseLeave={() => setHoveredNumbers(null)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'var(--text-main)',
                  }}
                  onPointerEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                    e.currentTarget.style.background =
                      'rgba(0, 240, 255, 0.05)';
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  끝자리 {item.digit}: {item.nums.join(',')} ({item.nums.length}
                  개)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Temperatures */}
        {analysis.temperatures && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                width: '65px',
                flexShrink: 0,
              }}
            >
              온도 분포
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                {
                  label: '열번호 🔥',
                  color: '#ef4444',
                  val: analysis.hot,
                  type: 'HOT' as const,
                },
                {
                  label: '온번호 🟠',
                  color: '#f97316',
                  val: analysis.warm,
                  type: 'WARM' as const,
                },
                {
                  label: '냉번호 ❄️',
                  color: '#3b82f6',
                  val: analysis.cold,
                  type: 'COLD' as const,
                },
              ]
                .filter((t) => t.val > 0)
                .map((t) => (
                  <span
                    key={t.type}
                    onMouseEnter={() =>
                      setHoveredNumbers(new Set(getTempNumbers(t.type)))
                    }
                    onMouseLeave={() => setHoveredNumbers(null)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-main)',
                    }}
                    onPointerEnter={(e) => {
                      e.currentTarget.style.borderColor = t.color;
                      e.currentTarget.style.background =
                        'rgba(255, 255, 255, 0.04)';
                    }}
                    onPointerLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.background =
                        'rgba(255, 255, 255, 0.02)';
                    }}
                  >
                    {t.label}: {t.val}개
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Consecutive numbers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              width: '65px',
              flexShrink: 0,
            }}
          >
            연속수 그룹
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {analysis.consecutive && analysis.consecutive.length > 0 ? (
              analysis.consecutive.map((group, idx) => (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredNumbers(new Set(group))}
                  onMouseLeave={() => setHoveredNumbers(null)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'var(--text-main)',
                  }}
                  onPointerEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                    e.currentTarget.style.background =
                      'rgba(0, 240, 255, 0.05)';
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  {group.join('-')}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                연속수 없음
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
