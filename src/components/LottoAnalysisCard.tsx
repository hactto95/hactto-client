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
      <div className="bento-card py-6 text-center text-sm text-dim">
        분석 데이터가 존재하지 않습니다.
      </div>
    );
  }

  const mainNumbers = numbers.slice(0, 6);
  const bonusNumber = numbers[6];

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

  const getTempNumbers = (temp: 'HOT' | 'WARM' | 'COLD') => {
    if (!analysis.temperatures) return [];
    return mainNumbers.filter((num) => analysis.temperatures?.[num] === temp);
  };

  return (
    <div className="bento-card p-6 sm:p-7">
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-main">{title}</h3>
          <span className="text-xs text-dim">
            항목에 마우스를 올리면 해당 번호가 강조됩니다
          </span>
        </div>
      )}

      {/* Interactive Lotto Balls Display */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-glass-border bg-surface px-5 py-4">
        {mainNumbers.map((num, i) => {
          const active = isHighlighted(num);
          const shadow = active ? getBallStyle(num).boxShadow : 'none';

          return (
            <BallHoverTooltip key={i} ball={num}>
              <div
                className={`lotto-ball transition-all duration-200 ${
                  active
                    ? 'scale-110 opacity-100 ring-2 ring-primary-cyan/35'
                    : 'scale-90 opacity-25'
                }`}
                style={{
                  ...getBallStyle(num),
                  boxShadow: shadow,
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
              className={`mx-1 text-lg font-bold text-dim transition-opacity duration-200 ${
                hoveredNumbers === null ? 'opacity-100' : 'opacity-25'
              }`}
            >
              +
            </div>
            <BallHoverTooltip ball={bonusNumber}>
              <div
                className={`lotto-ball transition-all duration-200 ${
                  hoveredNumbers === null
                    ? 'scale-100 opacity-100'
                    : 'scale-90 opacity-25'
                }`}
                style={getBallStyle(bonusNumber)}
              >
                {bonusNumber}
              </div>
            </BallHoverTooltip>
          </>
        )}
      </div>

      {/* KPI Metrics Row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-glass-border bg-surface px-4 py-3.5">
          <div className="text-xs font-medium text-dim">총합</div>
          <div className="mt-1 font-display text-xl font-extrabold text-main">
            {analysis.sum}
          </div>
        </div>

        <div className="rounded-2xl border border-glass-border bg-surface px-4 py-3.5">
          <div className="text-xs font-medium text-dim">AC값 (복잡도)</div>
          <div className="mt-1 font-display text-xl font-extrabold text-primary-cyan">
            {analysis.ac}
          </div>
        </div>

        <div className="rounded-2xl border border-glass-border bg-surface px-4 py-3.5">
          <div className="text-xs font-medium text-dim">끝자리 합</div>
          <div className="mt-1 font-display text-xl font-extrabold text-main">
            {analysis.sumLastDigits}
          </div>
        </div>
      </div>

      {/* Interactive Tag Rows */}
      <div className="flex flex-col gap-3.5 border-t border-glass-border pt-5">
        {/* Odd/Even */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-24 shrink-0 text-xs font-semibold text-muted">
            홀짝 비율
          </span>
          <div className="flex flex-wrap gap-2">
            <span
              onMouseEnter={() =>
                setHoveredNumbers(
                  new Set(mainNumbers.filter((n) => n % 2 !== 0)),
                )
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              className="cursor-pointer rounded-xl border border-glass-border bg-surface px-3 py-1.5 text-xs font-semibold text-main transition-all hover:border-primary-cyan hover:bg-primary-cyan/10 hover:text-primary-cyan"
            >
              홀수 {analysis.odd}개
            </span>
            <span
              onMouseEnter={() =>
                setHoveredNumbers(
                  new Set(mainNumbers.filter((n) => n % 2 === 0)),
                )
              }
              onMouseLeave={() => setHoveredNumbers(null)}
              className="cursor-pointer rounded-xl border border-glass-border bg-surface px-3 py-1.5 text-xs font-semibold text-main transition-all hover:border-primary-cyan hover:bg-primary-cyan/10 hover:text-primary-cyan"
            >
              짝수 {analysis.even}개
            </span>
          </div>
        </div>

        {/* Decades */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-24 shrink-0 text-xs font-semibold text-muted">
            번대 분포
          </span>
          <div className="flex flex-wrap gap-2">
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
                  className="cursor-pointer rounded-xl border border-glass-border bg-surface px-3 py-1.5 text-xs font-semibold text-main transition-all hover:border-primary-cyan hover:bg-primary-cyan/10 hover:text-primary-cyan"
                >
                  {d.label} {d.val}개
                </span>
              ))}
          </div>
        </div>

        {/* Last Digits */}
        {lastDigits.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-24 shrink-0 text-xs font-semibold text-muted">
              끝자리 그룹
            </span>
            <div className="flex flex-wrap gap-2">
              {lastDigits.map((item) => (
                <span
                  key={item.digit}
                  onMouseEnter={() => setHoveredNumbers(new Set(item.nums))}
                  onMouseLeave={() => setHoveredNumbers(null)}
                  className="cursor-pointer rounded-xl border border-glass-border bg-surface px-3 py-1.5 text-xs font-semibold text-main transition-all hover:border-primary-cyan hover:bg-primary-cyan/10 hover:text-primary-cyan"
                >
                  끝수 {item.digit}: {item.nums.join(', ')} ({item.nums.length}
                  개)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Temperatures */}
        {analysis.temperatures && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-24 shrink-0 text-xs font-semibold text-muted">
              온도 분포
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: '열번호 🔥',
                  hoverClass:
                    'hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-500',
                  val: analysis.hot,
                  type: 'HOT' as const,
                },
                {
                  label: '온번호 ☀️',
                  hoverClass:
                    'hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-500',
                  val: analysis.warm,
                  type: 'WARM' as const,
                },
                {
                  label: '냉번호 ❄️',
                  hoverClass:
                    'hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-500',
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
                    className={`cursor-pointer rounded-xl border border-glass-border bg-surface px-3 py-1.5 text-xs font-semibold text-main transition-all ${t.hoverClass}`}
                  >
                    {t.label} {t.val}개
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Consecutive numbers */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-24 shrink-0 text-xs font-semibold text-muted">
            연속수 그룹
          </span>
          <div className="flex flex-wrap gap-2">
            {analysis.consecutive && analysis.consecutive.length > 0 ? (
              analysis.consecutive.map((group, idx) => (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredNumbers(new Set(group))}
                  onMouseLeave={() => setHoveredNumbers(null)}
                  className="cursor-pointer rounded-xl border border-glass-border bg-surface px-3 py-1.5 text-xs font-semibold text-main transition-all hover:border-primary-cyan hover:bg-primary-cyan/10 hover:text-primary-cyan"
                >
                  {group.join(' - ')}
                </span>
              ))
            ) : (
              <span className="text-xs text-dim">연속수 없음</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
