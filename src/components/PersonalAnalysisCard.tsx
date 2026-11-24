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

  const isSameNumberSet = (targetNums: number[]) => {
    if (!hoveredNumbers || targetNums.length === 0) return false;
    if (hoveredNumbers.size !== targetNums.length) return false;
    return targetNums.every((n) => hoveredNumbers.has(n));
  };

  const handleTagToggle = (targetNums: number[]) => {
    if (targetNums.length === 0) return;
    if (isSameNumberSet(targetNums)) {
      setHoveredNumbers(null);
    } else {
      setHoveredNumbers(new Set(targetNums));
    }
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
    <div className="bento-card p-6 sm:p-7">
      <div className="flex justify-between items-center mb-5 border-b border-glass-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-5 rounded-full bg-primary-cyan inline-block" />
          <h3 className="m-0 text-lg text-main font-bold tracking-tight">
            선택 번호 심층 분석 결과
          </h3>
        </div>
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving || isSaved}
            className={`action-btn px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              isSaved
                ? 'bg-success/15 text-success border border-success/30 cursor-default shadow-none'
                : 'bg-primary-cyan hover:bg-primary-cyan/90 text-white border-none cursor-pointer shadow-sm'
            } ${isSaving ? 'opacity-70' : 'opacity-100'}`}
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
      <div className="flex justify-center items-center gap-3 flex-wrap mb-6 bg-surface p-5 rounded-2xl border border-glass-border">
        {mainNumbers.map((num, i) => {
          const active = isHighlighted(num);
          return (
            <BallHoverTooltip key={i} ball={num}>
              <div
                className={`lotto-ball transition-all duration-200 ease-out ${
                  active
                    ? 'ring-2 ring-primary-cyan/60 scale-110 opacity-100'
                    : 'scale-90 opacity-25 grayscale-[30%]'
                }`}
                style={getBallStyle(num)}
              >
                {num}
              </div>
            </BallHoverTooltip>
          );
        })}
      </div>

      {/* Grid of Interactive Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="px-4 py-3.5 border border-glass-border bg-surface rounded-2xl">
          <div className="text-xs font-semibold text-dim">총합 (Sum)</div>
          <div className="font-display text-xl font-extrabold text-primary-cyan mt-1 tabular-nums">
            {analysis.sum}
          </div>
        </div>

        <div className="px-4 py-3.5 border border-glass-border bg-surface rounded-2xl">
          <div className="text-xs font-semibold text-dim">AC값 (복잡도)</div>
          <div className="font-display text-xl font-extrabold text-primary-cyan mt-1 tabular-nums">
            {analysis.ac}
          </div>
        </div>

        <div className="px-4 py-3.5 border border-glass-border bg-surface rounded-2xl">
          <div className="text-xs font-semibold text-dim">끝자리 합</div>
          <div className="font-display text-xl font-extrabold text-primary-cyan mt-1 tabular-nums">
            {analysis.sumLastDigits}
          </div>
        </div>

        <div className="px-4 py-3.5 border border-glass-border bg-surface rounded-2xl">
          <div className="text-xs font-semibold text-dim">홀 : 짝</div>
          <div className="font-display text-lg font-extrabold text-main mt-1 tabular-nums">
            {analysis.odd} : {analysis.even}
          </div>
        </div>

        <div className="px-4 py-3.5 border border-glass-border bg-surface rounded-2xl col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-dim">저 : 고</div>
          <div className="font-display text-lg font-extrabold text-main mt-1 tabular-nums">
            {analysis.low} : {analysis.high}
          </div>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="flex flex-col gap-3.5 border-t border-glass-border pt-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-dim">
            항목을 탭하거나 마우스를 올리면 해당 번호가 강조됩니다
          </span>
          {hoveredNumbers !== null && (
            <button
              type="button"
              onClick={() => setHoveredNumbers(null)}
              className="cursor-pointer rounded-lg border border-primary-cyan/40 bg-primary-cyan/10 px-2 py-0.5 text-[0.7rem] font-bold text-primary-cyan transition-colors hover:bg-primary-cyan/20"
            >
              강조 해제
            </button>
          )}
        </div>

        {/* Temperatures */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-muted w-[110px] shrink-0">
            번호 온도 분포
          </span>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                {
                  type: 'HOT' as const,
                  label: `열번호 🔥 ${analysis.hot}개`,
                  baseClass:
                    'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400',
                  activeClass: 'ring-2 ring-red-500/50 bg-red-500/20',
                },
                {
                  type: 'WARM' as const,
                  label: `온번호 🟠 ${analysis.warm}개`,
                  baseClass:
                    'bg-orange-500/10 border-orange-500/25 text-orange-600 dark:text-orange-400',
                  activeClass: 'ring-2 ring-orange-500/50 bg-orange-500/20',
                },
                {
                  type: 'COLD' as const,
                  label: `냉번호 ❄️ ${analysis.cold}개`,
                  baseClass:
                    'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400',
                  activeClass: 'ring-2 ring-blue-500/50 bg-blue-500/20',
                },
              ] as const
            ).map((t) => {
              const tempNums = getTempNumbers(t.type);
              const isActive = isSameNumberSet(tempNums);
              return (
                <span
                  key={t.type}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse' && tempNums.length > 0) {
                      setHoveredNumbers(new Set(tempNums));
                    }
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse') setHoveredNumbers(null);
                  }}
                  onClick={() => handleTagToggle(tempNums)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${t.baseClass} ${
                    isActive ? t.activeClass : ''
                  }`}
                >
                  {t.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Decades */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-muted w-[110px] shrink-0">
            번대수 분포
          </span>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: '단번대', val: analysis.cnt0s, idx: 0 },
              { label: '10번대', val: analysis.cnt10s, idx: 1 },
              { label: '20번대', val: analysis.cnt20s, idx: 2 },
              { label: '30번대', val: analysis.cnt30s, idx: 3 },
              { label: '40번대', val: analysis.cnt40s, idx: 4 },
            ].map((d) => {
              const decadeNums = getDecadeNumbers(d.idx);
              const isActive = isSameNumberSet(decadeNums);
              return (
                <span
                  key={d.idx}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse' && decadeNums.length > 0) {
                      setHoveredNumbers(new Set(decadeNums));
                    }
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse') setHoveredNumbers(null);
                  }}
                  onClick={() => handleTagToggle(decadeNums)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer select-none transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-cyan/20 border border-primary-cyan text-primary-cyan ring-2 ring-primary-cyan/40'
                      : d.val > 0
                        ? 'bg-primary-cyan/10 border border-primary-cyan/30 text-primary-cyan'
                        : 'bg-surface border border-glass-border text-dim'
                  }`}
                >
                  {d.label}: {d.val}개
                </span>
              );
            })}
          </div>
        </div>

        {/* Prime, Composite, Multi3 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-muted w-[110px] shrink-0">
            수 속성 분포
          </span>
          <div className="flex gap-2 flex-wrap">
            {[
              {
                label: '소수',
                count: analysis.prime,
                nums: mainNumbers.filter(isPrimeNum),
              },
              {
                label: '합성수',
                count: analysis.composite,
                nums: mainNumbers.filter(isCompositeNum),
              },
              {
                label: '3의 배수',
                count: analysis.mul3,
                nums: mainNumbers.filter(isMul3Num),
              },
            ].map((prop) => {
              const isActive = isSameNumberSet(prop.nums);
              return (
                <span
                  key={prop.label}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse' && prop.nums.length > 0) {
                      setHoveredNumbers(new Set(prop.nums));
                    }
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse') setHoveredNumbers(null);
                  }}
                  onClick={() => handleTagToggle(prop.nums)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-xl border cursor-pointer select-none hover:border-primary-cyan/40 transition-all ${
                    isActive
                      ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan ring-2 ring-primary-cyan/40'
                      : 'bg-surface border-glass-border text-main'
                  }`}
                >
                  {prop.label}: <b>{prop.count}개</b>
                </span>
              );
            })}
          </div>
        </div>

        {/* Last Digits */}
        {lastDigits.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="text-xs font-semibold text-muted w-[110px] shrink-0">
              끝자리 그룹
            </span>
            <div className="flex gap-2 flex-wrap">
              {lastDigits.map((item) => {
                const isActive = isSameNumberSet(item.nums);
                return (
                  <span
                    key={item.digit}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') {
                        setHoveredNumbers(new Set(item.nums));
                      }
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === 'mouse') setHoveredNumbers(null);
                    }}
                    onClick={() => handleTagToggle(item.nums)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all duration-200 hover:border-primary-cyan/40 ${
                      isActive
                        ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan ring-2 ring-primary-cyan/40'
                        : 'bg-surface border-glass-border text-main'
                    }`}
                  >
                    끝자리 {item.digit}: {item.nums.join(',')} (
                    {item.nums.length}
                    개)
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Consecutive numbers */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-muted w-[110px] shrink-0">
            연속수 그룹
          </span>
          <div className="flex gap-2 flex-wrap">
            {consecutiveGroups.length > 0 ? (
              consecutiveGroups.map((group, idx) => {
                const isActive = isSameNumberSet(group);
                return (
                  <span
                    key={idx}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') {
                        setHoveredNumbers(new Set(group));
                      }
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === 'mouse') setHoveredNumbers(null);
                    }}
                    onClick={() => handleTagToggle(group)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all duration-200 text-primary-cyan ${
                      isActive
                        ? 'bg-primary-cyan/25 border-primary-cyan ring-2 ring-primary-cyan/40'
                        : 'bg-primary-cyan/10 border-primary-cyan/30'
                    }`}
                  >
                    {group.join('-')}
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-dim py-1">연속수 없음</span>
            )}
          </div>
        </div>

        {/* Pairs list */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-muted w-[110px] shrink-0 sm:mt-1.5">
            동반 출현 페어
          </span>
          <div className="flex gap-2 flex-wrap flex-1">
            {pairsList.length > 0 ? (
              pairsList.map((item, idx) => {
                const pairArr = Array.isArray(item.pair) ? item.pair : [];
                const isActive = isSameNumberSet(pairArr);
                return (
                  <span
                    key={idx}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') {
                        setHoveredNumbers(new Set(pairArr));
                      }
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === 'mouse') setHoveredNumbers(null);
                    }}
                    onClick={() => handleTagToggle(pairArr)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all duration-200 hover:border-primary-cyan/40 ${
                      isActive
                        ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan ring-2 ring-primary-cyan/40'
                        : 'bg-surface border-glass-border text-main'
                    }`}
                  >
                    ({pairArr.join(', ')}): <b>{item.count}회</b>
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-dim py-1">이력 페어 없음</span>
            )}
          </div>
        </div>

        {/* Winning History Pattern */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-muted w-[110px] shrink-0">
            패턴 당첨 이력
          </span>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: '1등', val: analysis.win1 },
              { label: '2등', val: analysis.win2 },
              { label: '3등', val: analysis.win3 },
              { label: '4등', val: analysis.win4 },
              { label: '5등', val: analysis.win5 },
            ].map((w, idx) => (
              <span
                key={idx}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${
                  w.val > 0
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-surface border border-glass-border text-dim'
                }`}
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
