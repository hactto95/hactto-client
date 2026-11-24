import React from 'react';
import { getBallStyle } from '../../utils';
import { BallHoverTooltip } from '../BallHoverTooltip';

interface BallTrayProps {
  drawnNumbers: number[]; // 최대 6개
  bonusNumber: number | null; // 1개
  fixedNumbers?: number[]; // 사전 고정 배치된 번호 목록
  isExtracting: boolean;
  className?: string;
}

export const BallTray: React.FC<BallTrayProps> = ({
  drawnNumbers,
  bonusNumber,
  fixedNumbers = [],
  isExtracting,
  className = '',
}) => {
  const fixedSet = new Set(fixedNumbers);
  const currentSlotIndex =
    drawnNumbers.length < 6
      ? drawnNumbers.length
      : bonusNumber === null
        ? 6
        : -1;

  return (
    <div className={`bento-card p-5 sm:p-6 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-glass-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-4 rounded-full bg-primary-cyan inline-block" />
          <span className="text-sm font-bold text-main tracking-tight">
            실시간 당첨 번호 거치대
          </span>
          <span className="hidden sm:inline-block text-[0.72rem] text-dim bg-surface px-2.5 py-0.5 rounded-full border border-glass-border">
            공을 탭하거나 마우스를 올리면 상세 통계가 표시됩니다
          </span>
        </div>
        <span className="text-xs font-bold text-primary-cyan bg-primary-cyan/10 px-2.5 py-1 rounded-lg">
          {drawnNumbers.length} / 6구{' '}
          {bonusNumber !== null ? '+ 보너스 완료' : ''}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-2 bg-surface rounded-2xl border border-glass-border px-4">
        {/* 일반 당첨 번호 6개 슬롯 */}
        {Array.from({ length: 6 }).map((_, idx) => {
          const number = drawnNumbers[idx];
          const isCurrentTarget = isExtracting && currentSlotIndex === idx;

          if (number !== undefined) {
            const isFixedBall = fixedSet.has(number);
            return (
              <div
                key={`main-${idx}`}
                className="flex flex-col items-center gap-1.5"
              >
                <BallHoverTooltip ball={number}>
                  <div className="relative">
                    <div
                      className={`lotto-ball lotto-ball-pop cursor-pointer ${
                        isFixedBall
                          ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]'
                          : 'ring-2 ring-primary-cyan/30'
                      }`}
                      style={getBallStyle(number)}
                    >
                      {number}
                    </div>
                    {isFixedBall && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[0.55rem] font-extrabold leading-tight shadow-sm border border-white/60 pointer-events-none">
                        고정
                      </span>
                    )}
                  </div>
                </BallHoverTooltip>
                <span
                  className={`text-[0.68rem] font-semibold ${
                    isFixedBall ? 'text-emerald-400 font-bold' : 'text-dim'
                  }`}
                >
                  {isFixedBall ? `${idx + 1}구 (고정)` : `${idx + 1}구`}
                </span>
              </div>
            );
          }

          return (
            <div
              key={`empty-${idx}`}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`lotto-ball transition-all duration-200 ${
                  isCurrentTarget
                    ? '!border-primary-cyan !bg-primary-cyan/10 !text-primary-cyan animate-pulse'
                    : ''
                }`}
                style={isCurrentTarget ? undefined : getBallStyle(0)}
              >
                <span className="text-xs font-bold">{idx + 1}</span>
              </div>
              <span
                className={`text-[0.68rem] font-semibold ${
                  isCurrentTarget ? 'text-primary-cyan' : 'text-dim'
                }`}
              >
                {isCurrentTarget ? '추출 중' : `${idx + 1}구`}
              </span>
            </div>
          );
        })}

        {/* 플러스 기호 */}
        <div className="flex items-center justify-center text-dim px-1 font-display font-extrabold text-lg mb-4">
          +
        </div>

        {/* 보너스 번호 1개 슬롯 */}
        {bonusNumber !== null ? (
          <div className="flex flex-col items-center gap-1.5">
            <BallHoverTooltip ball={bonusNumber}>
              <div
                className="lotto-ball lotto-ball-pop cursor-pointer ring-2 ring-primary-purple/45"
                style={getBallStyle(bonusNumber)}
              >
                {bonusNumber}
              </div>
            </BallHoverTooltip>
            <span className="text-[0.68rem] font-bold text-primary-purple">
              보너스
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`lotto-ball transition-all duration-200 ${
                isExtracting && currentSlotIndex === 6
                  ? '!border-primary-purple !bg-primary-purple/10 !text-primary-purple animate-pulse'
                  : ''
              }`}
              style={
                isExtracting && currentSlotIndex === 6
                  ? undefined
                  : getBallStyle(0)
              }
            >
              <span className="text-[0.68rem] font-bold">B</span>
            </div>
            <span
              className={`text-[0.68rem] font-semibold ${
                isExtracting && currentSlotIndex === 6
                  ? 'text-primary-purple'
                  : 'text-dim'
              }`}
            >
              {isExtracting && currentSlotIndex === 6 ? '추출 중' : '보너스'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
