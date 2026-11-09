import { useState } from 'react';
import type { PersonalAnalysis } from '../types';
import { getBallStyle } from '../utils';
import { BallHoverTooltip } from './BallHoverTooltip';

interface PersonalAnalysisCardProps {
  numbers: number[]; // 선택한 6개 번호
  analysis: PersonalAnalysis; // 분석 결과
  onSave?: () => void; // 정하기 버튼 콜백
  isSaving?: boolean;
  isSaved?: boolean; // 저장 완료 여부 (버튼 비활성)
}

export function PersonalAnalysisCard({
  numbers,
  analysis,
  onSave,
  isSaving = false,
  isSaved = false,
}: PersonalAnalysisCardProps) {
  const [hoveredNumbers, setHoveredNumbers] = useState<Set<number> | null>(
    null,
  );

  if (!numbers || numbers.length === 0) return null;

  const mainNumbers = numbers.slice(0, 6);

  const isHighlighted = (num: number) => {
    if (hoveredNumbers === null) return true;
    return hoveredNumbers.has(num);
  };

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

  const isPrimeNum = (n: number) =>
    [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43].includes(n);
  const isMul3Num = (n: number) => n % 3 === 0 && n !== 3;
  const isCompositeNum = (n: number) => !isPrimeNum(n) && !isMul3Num(n);

  const getTempNumbers = (temp: 'HOT' | 'WARM' | 'COLD') => {
    if (!analysis.temperatures) return [];
    return mainNumbers.filter((num) => analysis.temperatures?.[num] === temp);
  };

  // Safe helper to parse last digit groups
  const parseLastDigitGroup = (val: unknown): number[] => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val) as number[];
      } catch {
        return [];
      }
    }
    return Array.isArray(val) ? (val as number[]) : [];
  };

  const lastDigits = [
    { digit: 0, nums: parseLastDigitGroup(analysis.lastDigit0) },
    { digit: 1, nums: parseLastDigitGroup(analysis.lastDigit1) },
    { digit: 2, nums: parseLastDigitGroup(analysis.lastDigit2) },
    { digit: 3, nums: parseLastDigitGroup(analysis.lastDigit3) },
    { digit: 4, nums: parseLastDigitGroup(analysis.lastDigit4) },
    { digit: 5, nums: parseLastDigitGroup(analysis.lastDigit5) },
    { digit: 6, nums: parseLastDigitGroup(analysis.lastDigit6) },
    { digit: 7, nums: parseLastDigitGroup(analysis.lastDigit7) },
    { digit: 8, nums: parseLastDigitGroup(analysis.lastDigit8) },
    { digit: 9, nums: parseLastDigitGroup(analysis.lastDigit9) },
  ].filter((item) => item.nums && item.nums.length > 0);

  // Consecutive numbers
  const parseConsecutive = (val: unknown): number[][] => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val) as number[][];
      } catch {
        return [];
      }
    }
    return Array.isArray(val) ? (val as number[][]) : [];
  };
  const consecutiveGroups = parseConsecutive(analysis.consecutive);

  // Pairs list
  interface PairItem {
    pair: number[];
    count: number;
  }
  const parsePairs = (val: unknown): PairItem[] => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val) as PairItem[];
      } catch {
        return [];
      }
    }
    return Array.isArray(val) ? (val as PairItem[]) : [];
  };
  const pairsList = parsePairs(analysis.pair).sort((a, b) => b.count - a.count);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '24px',
        marginTop: '0px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: '16px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '1.2rem',
            color: 'var(--text-main)',
            fontWeight: 600,
          }}
        >
          분석 결과
        </h3>
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving || isSaved}
            className="action-btn"
            style={{
              background: isSaved
                ? 'rgba(102, 187, 106, 0.15)'
                : 'linear-gradient(135deg, var(--primary-cyan) 0%, #00acc1 100%)',
              color: isSaved ? '#66bb6a' : '#000000',
              border: isSaved ? '1px solid rgba(102, 187, 106, 0.3)' : 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: isSaved ? 'default' : 'pointer',
              boxShadow: isSaved ? 'none' : '0 0 15px rgba(0, 240, 255, 0.3)',
              transition: 'all 0.2s ease',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaved
              ? '✓ 저장 완료'
              : isSaving
                ? '저장 중...'
                : '예측번호 저장하기'}
          </button>
        )}
      </div>

      {/* Lotto Balls Display */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {mainNumbers.map((num, i) => {
          const active = isHighlighted(num);
          const scale = active ? '1.12' : '0.88';
          const opacity = active ? '1' : '0.25';
          const borderStyle = active
            ? '2px solid #ffffff'
            : '1px solid rgba(255, 255, 255, 0.08)';
          return (
            <BallHoverTooltip key={i} ball={num}>
              <div
                className="lotto-ball"
                style={{
                  ...getBallStyle(num),
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
      </div>

      {/* Grid of Interactive Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          className="feature-item"
          style={{
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            총합
          </div>
          <div
            style={{
              fontSize: '1.2rem',
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
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            AC값
          </div>
          <div
            style={{
              fontSize: '1.2rem',
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
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            끝자리 합
          </div>
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              marginTop: '4px',
            }}
          >
            {analysis.sumLastDigits}
          </div>
        </div>

        <div
          className="feature-item"
          style={{
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            홀 : 짝
          </div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              marginTop: '4px',
            }}
          >
            {analysis.odd} : {analysis.even}
          </div>
        </div>

        <div
          className="feature-item"
          style={{
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            저 : 고 (1~22/23~45)
          </div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--primary-cyan)',
              marginTop: '4px',
            }}
          >
            {analysis.low} : {analysis.high}
          </div>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '20px',
        }}
      >
        {/* Temperatures */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              width: '100px',
              flexShrink: 0,
            }}
          >
            번호 온도 분포
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(new Set(getTempNumbers('HOT')))
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ff6b6b',
                cursor: 'pointer',
              }}
            >
              열번호 🔥 : {analysis.hot}개
            </span>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(new Set(getTempNumbers('WARM')))
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(249, 115, 22, 0.05)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                color: '#ff9233',
                cursor: 'pointer',
              }}
            >
              온번호 🟠 : {analysis.warm}개
            </span>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(new Set(getTempNumbers('COLD')))
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                color: '#5fa4ff',
                cursor: 'pointer',
              }}
            >
              냉번호 ❄️ : {analysis.cold}개
            </span>
          </div>
        </div>

        {/* Decades */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              width: '100px',
              flexShrink: 0,
            }}
          >
            번대수 분포
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: '단번대', val: analysis.cnt0s, idx: 0 },
              { label: '10번대', val: analysis.cnt10s, idx: 1 },
              { label: '20번대', val: analysis.cnt20s, idx: 2 },
              { label: '30번대', val: analysis.cnt30s, idx: 3 },
              { label: '40번대', val: analysis.cnt40s, idx: 4 },
            ].map((d) => (
              <span
                key={d.idx}
                onMouseEnter={() =>
                  setHoveredNumbers(new Set(getDecadeNumbers(d.idx)))
                }
                onMouseLeave={() => setHoveredNumbers(null)}
                style={{
                  fontSize: '0.78rem',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background:
                    d.val > 0
                      ? 'rgba(0, 240, 255, 0.04)'
                      : 'rgba(255, 255, 255, 0.01)',
                  border:
                    d.val > 0
                      ? '1px solid rgba(0, 240, 255, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: d.val > 0 ? 'var(--text-main)' : 'var(--text-dim)',
                }}
              >
                {d.label}: {d.val}개
              </span>
            ))}
          </div>
        </div>

        {/* Prime, Composite, Multi3 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              width: '100px',
              flexShrink: 0,
            }}
          >
            수 속성 분포
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(new Set(mainNumbers.filter(isPrimeNum)))
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              소수: {analysis.prime}개
            </span>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(new Set(mainNumbers.filter(isCompositeNum)))
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              합성수: {analysis.composite}개
            </span>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(new Set(mainNumbers.filter(isMul3Num)))
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              3의 배수: {analysis.mul3}개
            </span>
          </div>
        </div>

        {/* Last Digits */}
        {lastDigits.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                width: '100px',
                flexShrink: 0,
              }}
            >
              끝자리 그룹
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {lastDigits.map((item) => (
                <span
                  key={item.digit}
                  onMouseEnter={() => setHoveredNumbers(new Set(item.nums))}
                  onMouseLeave={() => setHoveredNumbers(null)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'var(--text-main)',
                  }}
                >
                  끝자리 {item.digit}: {item.nums.join(',')} ({item.nums.length}
                  개)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Consecutive numbers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              width: '100px',
              flexShrink: 0,
            }}
          >
            연속수 그룹
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {consecutiveGroups.length > 0 ? (
              consecutiveGroups.map((group, idx) => (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredNumbers(new Set(group))}
                  onMouseLeave={() => setHoveredNumbers(null)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 240, 255, 0.04)',
                    border: '1px solid rgba(0, 240, 255, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'var(--text-main)',
                  }}
                >
                  {group.join('-')}
                </span>
              ))
            ) : (
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                  padding: '5px 0',
                }}
              >
                연속수 없음
              </span>
            )}
          </div>
        </div>

        {/* Pairs list */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              width: '100px',
              flexShrink: 0,
              marginTop: '6px',
            }}
          >
            동반 출현 페어
          </span>
          <div
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}
          >
            {pairsList.length > 0 ? (
              pairsList.map((item, idx) => {
                const pairArr = Array.isArray(item.pair) ? item.pair : [];
                return (
                  <span
                    key={idx}
                    onMouseEnter={() => setHoveredNumbers(new Set(pairArr))}
                    onMouseLeave={() => setHoveredNumbers(null)}
                    style={{
                      fontSize: '0.78rem',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-main)',
                    }}
                  >
                    ({pairArr.join(', ')}): {item.count}회
                  </span>
                );
              })
            ) : (
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                  padding: '5px 0',
                }}
              >
                이력 페어 없음
              </span>
            )}
          </div>
        </div>

        {/* Winning History Pattern */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              width: '100px',
              flexShrink: 0,
            }}
          >
            패턴 당첨 이력
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: '1등', val: analysis.win1 },
              { label: '2등', val: analysis.win2 },
              { label: '3등', val: analysis.win3 },
              { label: '4등', val: analysis.win4 },
              { label: '5등', val: analysis.win5 },
            ].map((w, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.78rem',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background:
                    w.val > 0
                      ? 'rgba(251, 192, 45, 0.05)'
                      : 'rgba(255, 255, 255, 0.01)',
                  border:
                    w.val > 0
                      ? '1px solid rgba(251, 192, 45, 0.2)'
                      : '1px solid rgba(255, 255, 255, 0.04)',
                  color: w.val > 0 ? '#ffca28' : 'var(--text-dim)',
                }}
              >
                {w.label}: {w.val}회
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
