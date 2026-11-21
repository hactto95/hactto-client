import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getBallStyle } from '../../utils';
import { useApp } from '../../context/AppContext';

export const MAX_FIXED_NUMBERS = 5;
export const MAX_EXCLUDED_NUMBERS = 33;

interface NumberFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixedNumbers: number[];
  excludedNumbers: number[];
  onChangeFixedNumbers: (nextFixed: number[]) => void;
  onChangeExcludedNumbers: (nextExcluded: number[]) => void;
  onClearAllFilters: () => void;
  isDrawInProgress?: boolean;
}

const DECADE_BANDS = [
  {
    label: '1~9번대',
    min: 1,
    max: 9,
    colorClass: 'border-amber-400/40 text-amber-400',
  },
  {
    label: '10~19번대',
    min: 10,
    max: 19,
    colorClass: 'border-sky-400/40 text-sky-400',
  },
  {
    label: '20~29번대',
    min: 20,
    max: 29,
    colorClass: 'border-rose-400/40 text-rose-400',
  },
  {
    label: '30~39번대',
    min: 30,
    max: 39,
    colorClass: 'border-slate-400/40 text-slate-300',
  },
  {
    label: '40~45번대',
    min: 40,
    max: 45,
    colorClass: 'border-emerald-400/40 text-emerald-400',
  },
];

export const NumberFilterModal: React.FC<NumberFilterModalProps> = ({
  isOpen,
  onClose,
  fixedNumbers,
  excludedNumbers,
  onChangeFixedNumbers,
  onChangeExcludedNumbers,
  onClearAllFilters,
  isDrawInProgress = false,
}) => {
  const { showAlert } = useApp();
  const [selectMode, setSelectMode] = useState<'FIXED' | 'EXCLUDED'>('FIXED');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fixedSet = new Set(fixedNumbers);
  const excludedSet = new Set(excludedNumbers);
  const chamberCount = 45 - fixedNumbers.length - excludedNumbers.length;

  // 개별 공 클릭 핸들러 (상호 배타적 상태: NORMAL <-> FIXED <-> EXCLUDED)
  const handleToggleBall = (num: number) => {
    if (isDrawInProgress) {
      showAlert(
        'error',
        '추첨이 진행 중일 때는 번호 설정을 변경할 수 없습니다.',
      );
      return;
    }

    if (selectMode === 'FIXED') {
      if (fixedSet.has(num)) {
        onChangeFixedNumbers(fixedNumbers.filter((n) => n !== num));
        return;
      }
      if (fixedNumbers.length >= MAX_FIXED_NUMBERS) {
        showAlert(
          'error',
          `고정수는 최대 ${MAX_FIXED_NUMBERS}개까지만 지정할 수 있습니다. (최소 1구+보너스 물리 추첨 필수)`,
        );
        return;
      }
      // 만약 제외수에 있었다면 제외수에서 해제하고 고정수로 승격
      if (excludedSet.has(num)) {
        onChangeExcludedNumbers(excludedNumbers.filter((n) => n !== num));
      }
      onChangeFixedNumbers([...fixedNumbers, num].sort((a, b) => a - b));
    } else {
      if (excludedSet.has(num)) {
        onChangeExcludedNumbers(excludedNumbers.filter((n) => n !== num));
        return;
      }
      if (fixedSet.has(num)) {
        showAlert(
          'error',
          `${num}번은 고정수로 지정되어 있습니다. 제외하려면 먼저 고정수를 해제해 주세요.`,
        );
        return;
      }
      if (excludedNumbers.length >= MAX_EXCLUDED_NUMBERS) {
        showAlert(
          'error',
          `제외수는 최대 ${MAX_EXCLUDED_NUMBERS}개까지만 지정할 수 있습니다. (챔버 내 최소 잉여 경쟁 공 5개 보장)`,
        );
        return;
      }
      onChangeExcludedNumbers([...excludedNumbers, num].sort((a, b) => a - b));
    }
  };

  // 퀵 프리셋 적용 (고정수는 항상 보호하며, 이미 동일 프리셋이 켜져 있으면 제외수 해제)
  const isPresetActive = (predicate: (n: number) => boolean): boolean => {
    const targetToExclude: number[] = [];
    for (let n = 1; n <= 45; n++) {
      if (!fixedSet.has(n) && predicate(n)) {
        targetToExclude.push(n);
      }
    }
    if (targetToExclude.length === 0) return false;
    if (excludedNumbers.length !== targetToExclude.length) return false;
    return targetToExclude.every((n) => excludedSet.has(n));
  };

  const handleApplyPreset = (
    predicate: (n: number) => boolean,
    label: string,
  ) => {
    if (isDrawInProgress) return;

    if (isPresetActive(predicate)) {
      onChangeExcludedNumbers([]);
      return;
    }

    const nextExcluded: number[] = [];
    let protectedCount = 0;
    for (let n = 1; n <= 45; n++) {
      if (predicate(n)) {
        if (fixedSet.has(n)) {
          protectedCount++;
        } else {
          nextExcluded.push(n);
        }
      }
    }

    if (nextExcluded.length > MAX_EXCLUDED_NUMBERS) {
      showAlert(
        'error',
        `제외수 상한(${MAX_EXCLUDED_NUMBERS}개)을 초과하여 적용할 수 없습니다.`,
      );
      return;
    }

    onChangeExcludedNumbers(nextExcluded);
    if (protectedCount > 0) {
      showAlert(
        'success',
        `${label} 필터가 적용되었습니다. (지정된 고정수 ${protectedCount}개는 자동 보호됨)`,
      );
    }
  };

  // 번호대 구간(1~9, 10~19 등) 일괄 제외/포함 토글
  const isBandAllExcluded = (min: number, max: number): boolean => {
    let availableCount = 0;
    for (let n = min; n <= max; n++) {
      if (!fixedSet.has(n)) {
        availableCount++;
        if (!excludedSet.has(n)) return false;
      }
    }
    return availableCount > 0;
  };

  const handleToggleBand = (min: number, max: number, label: string) => {
    if (isDrawInProgress) return;

    const allExcluded = isBandAllExcluded(min, max);
    if (allExcluded) {
      // 해당 구간 제외 해제
      onChangeExcludedNumbers(
        excludedNumbers.filter((n) => n < min || n > max),
      );
      return;
    }

    // 해당 구간 중 고정수가 아닌 번호들을 제외수에 추가
    const nextSet = new Set(excludedNumbers);
    for (let n = min; n <= max; n++) {
      if (!fixedSet.has(n)) {
        nextSet.add(n);
      }
    }

    if (nextSet.size > MAX_EXCLUDED_NUMBERS) {
      showAlert(
        'error',
        `${label}을(를) 모두 제외하면 최대 제외수(${MAX_EXCLUDED_NUMBERS}개)를 초과합니다. 다른 제외수를 먼저 해제해 주세요.`,
      );
      return;
    }

    onChangeExcludedNumbers(Array.from(nextSet).sort((a, b) => a - b));
  };

  const oddOnlyActive = isPresetActive((n) => n % 2 === 0); // 짝수 제외
  const evenOnlyActive = isPresetActive((n) => n % 2 !== 0); // 홀수 제외
  const lowOnlyActive = isPresetActive((n) => n >= 23); // 고번호(23~45) 제외
  const highOnlyActive = isPresetActive((n) => n <= 22); // 저번호(1~22) 제외

  return createPortal(
    <div
      className="admin-modal-overlay z-[1100]!"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-card admin-modal-content max-w-[640px]! w-[94%]! text-left relative border! border-primary-cyan/25! shadow-glass overflow-hidden p-5! sm:p-7!">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 border-b border-glass-border pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block text-[0.7rem] font-bold uppercase tracking-wider text-primary-cyan px-2.5 py-0.5 rounded-full bg-primary-cyan/10 border border-primary-cyan/25">
                3D 챔버 물리 필터
              </span>
              <span className="text-xs font-semibold text-dim">
                고정수는 트레이 선배치 · 제외수는 챔버 미투입
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-main mt-1.5 m-0">
              고정수 · 제외수 및 편의 필터 설정
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-none text-dim hover:text-main cursor-pointer p-1.5 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 1. 상단 모드 전환 탭 (고정수 선택 모드 vs 제외수 선택 모드) */}
        <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-surface border border-glass-border mb-5">
          <button
            type="button"
            onClick={() => setSelectMode('FIXED')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all border ${
              selectMode === 'FIXED'
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-400 shadow-xs'
                : 'bg-transparent border-transparent text-muted hover:text-main'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
            <span>고정수 선택 모드</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[0.72rem] tabular-nums ${
                selectMode === 'FIXED'
                  ? 'bg-emerald-400/20 text-emerald-300'
                  : 'bg-card text-dim'
              }`}
            >
              {fixedNumbers.length} / {MAX_FIXED_NUMBERS}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectMode('EXCLUDED')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all border ${
              selectMode === 'EXCLUDED'
                ? 'bg-rose-500/15 border-rose-400/50 text-rose-400 shadow-xs'
                : 'bg-transparent border-transparent text-muted hover:text-main'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block shrink-0" />
            <span>제외수 선택 모드</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[0.72rem] tabular-nums ${
                selectMode === 'EXCLUDED'
                  ? 'bg-rose-400/20 text-rose-300'
                  : 'bg-card text-dim'
              }`}
            >
              {excludedNumbers.length} / {MAX_EXCLUDED_NUMBERS}
            </span>
          </button>
        </div>

        {/* 2. 원클릭 편의 필터 (홀/짝/저/고 프리셋 & 구간별 일괄 제외) */}
        <div className="flex flex-col gap-3 rounded-2xl bg-surface/70 border border-glass-border p-3.5 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-main flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 rounded-full bg-primary-cyan inline-block" />
              원클릭 빠른 조건 필터 (고정수는 자동 보호)
            </span>
            {(fixedNumbers.length > 0 || excludedNumbers.length > 0) && (
              <button
                type="button"
                onClick={onClearAllFilters}
                className="text-[0.72rem] font-bold text-rose-400 hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                고정·제외 전체 초기화
              </button>
            )}
          </div>

          {/* 홀/짝/저/고 퀵 프리셋 */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChangeExcludedNumbers([])}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                excludedNumbers.length === 0
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-card border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              }`}
            >
              제외 없음 (전체)
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyPreset((n) => n % 2 === 0, '홀수만 추첨 (짝수 제외)')
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                oddOnlyActive
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-card border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              }`}
            >
              홀수만 (짝수 제외)
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyPreset((n) => n % 2 !== 0, '짝수만 추첨 (홀수 제외)')
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                evenOnlyActive
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-card border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              }`}
            >
              짝수만 (홀수 제외)
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyPreset(
                  (n) => n >= 23,
                  '저번호(1~22)만 추첨 (23~45 제외)',
                )
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                lowOnlyActive
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-card border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              }`}
            >
              저번호만 (1~22)
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyPreset(
                  (n) => n <= 22,
                  '고번호(23~45)만 추첨 (1~22 제외)',
                )
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                highOnlyActive
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-card border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              }`}
            >
              고번호만 (23~45)
            </button>
          </div>

          {/* 번호대 구간별 일괄 제외 토글 */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-glass-border/60">
            <span className="text-[0.72rem] font-semibold text-dim mr-1">
              구간 제외 토글:
            </span>
            {DECADE_BANDS.map((band) => {
              const isExcludedBand = isBandAllExcluded(band.min, band.max);
              return (
                <button
                  key={band.label}
                  type="button"
                  onClick={() =>
                    handleToggleBand(band.min, band.max, band.label)
                  }
                  className={`px-2.5 py-1 rounded-lg text-[0.72rem] font-bold cursor-pointer transition-all border ${
                    isExcludedBand
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300 line-through'
                      : `bg-card border-glass-border hover:border-glass-border-strong ${band.colorClass}`
                  }`}
                >
                  {band.label} {isExcludedBand ? '제외됨' : '제외'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 1~45번 인터랙티브 로또 볼 그리드 */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs text-muted mb-2.5 px-1">
            <span>
              {selectMode === 'FIXED' ? (
                <>
                  번호를 클릭하면{' '}
                  <strong className="text-emerald-400">고정수</strong>로
                  지정되어 하단 트레이에 미리 배치됩니다.
                </>
              ) : (
                <>
                  번호를 클릭하면{' '}
                  <strong className="text-rose-400">제외수</strong>로 지정되어
                  3D 챔버에서 제거됩니다.
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 sm:gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-surface border border-glass-border max-h-[310px] overflow-y-auto">
            {Array.from({ length: 45 }, (_, idx) => idx + 1).map((num) => {
              const isFixed = fixedSet.has(num);
              const isExcluded = excludedSet.has(num);

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleToggleBall(num)}
                  className={`relative flex items-center justify-center mx-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full font-display font-extrabold text-sm cursor-pointer transition-all duration-150 select-none border-none ${
                    isFixed
                      ? 'ring-3 ring-emerald-400 scale-105 shadow-[0_0_14px_rgba(52,211,153,0.55)] z-10'
                      : isExcluded
                        ? 'opacity-25 grayscale scale-95'
                        : 'hover:scale-105 hover:brightness-110'
                  }`}
                  style={getBallStyle(num)}
                >
                  <span>{num}</span>

                  {/* 고정수 배지 */}
                  {isFixed && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[0.58rem] font-extrabold leading-tight shadow-sm border border-white/60">
                      고정
                    </span>
                  )}

                  {/* 제외수 X 오버레이 */}
                  {isExcluded && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/55 text-rose-400 font-extrabold text-base">
                      ✕
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. 하단 상태 요약 및 완료 버튼 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-glass-border">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              고정수 {fixedNumbers.length}개
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-400/30 text-rose-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
              제외수 {excludedNumbers.length}개
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/25 text-main font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              챔버 투입 {chamberCount}구 (추가 추첨 {7 - fixedNumbers.length}
              구)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-neon btn-cyan h-10 px-6! text-xs! shrink-0"
          >
            설정 완료
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
