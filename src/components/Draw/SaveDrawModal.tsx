import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { LottoMachineModel } from '../../types/draw';
import { LOTTO_MACHINES } from '../../utils/lottery3d/machinePresets';
import { BallHoverTooltip } from '../BallHoverTooltip';
import { useApp } from '../../context/AppContext';
import { getBallStyle } from '../../utils';

interface SaveDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  numbers: number[]; // 6개
  bonusNumber: number; // 1개
  fixedNumbers?: number[]; // 고정수로 지정되었던 번호들
  machineModel: LottoMachineModel;
}

export const SaveDrawModal: React.FC<SaveDrawModalProps> = ({
  isOpen,
  onClose,
  numbers,
  bonusNumber,
  fixedNumbers = [],
  machineModel,
}) => {
  const navigate = useNavigate();
  const { showAlert } = useApp();
  const [copied, setCopied] = useState(false);
  const fixedSet = new Set(fixedNumbers);

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

  if (!isOpen || numbers.length < 6) return null;

  // 번호 오름차순 정렬
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  const sum = sortedNumbers.reduce((acc, cur) => acc + cur, 0);
  const oddCount = sortedNumbers.filter((n) => n % 2 !== 0).length;
  const evenCount = 6 - oddCount;
  const highCount = sortedNumbers.filter((n) => n >= 23).length;
  const lowCount = 6 - highCount;

  // 번호 클립보드 복사
  const handleCopy = () => {
    const text = `[Hactto 3D 추첨 번호]\n기계: ${LOTTO_MACHINES[machineModel].name}\n추첨 번호: ${sortedNumbers.join(', ')} + 보너스: ${bonusNumber}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showAlert?.('success', '추첨된 번호가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopied(false), 2000);
  };

  // 예측번호 분석기로 보내기 (/generate -> 예측번호 분석 탭 GAME A)
  const handleSendToAnalyzer = () => {
    onClose();
    navigate('/generate', {
      state: {
        tab: 'analyze',
        prefillGameA: sortedNumbers,
      },
    });
  };

  return createPortal(
    <div
      className="admin-modal-overlay z-[1100]!"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-card admin-modal-content max-w-[520px]! text-center relative border! border-primary-cyan/25! shadow-glass overflow-hidden">
        {/* 우상단 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          title="닫기 (추첨 초기화)"
          className="absolute top-5 right-5 bg-transparent border-none text-dim hover:text-main cursor-pointer p-1 flex items-center justify-center transition-colors duration-200 z-10"
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

        {/* 상단 아이콘 */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-cyan/15 text-primary-cyan border border-primary-cyan/30">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        {/* 헤더 */}
        <div className="mb-1">
          <span className="inline-block text-[0.72rem] font-bold uppercase tracking-wider text-primary-cyan px-2.5 py-0.5 rounded-full bg-primary-cyan/10 border border-primary-cyan/25 mb-2">
            {LOTTO_MACHINES[machineModel].name}
          </span>
          <h2 className="access-title text-[1.35rem]! font-bold text-main mb-1.5!">
            번호 추첨 완료
          </h2>
          <p className="access-desc text-[0.85rem]! text-muted mb-2!">
            실시간 공기 역학 시뮬레이터로 공정하게 추첨된 번호 조합입니다.
          </p>
          <p className="text-[0.75rem] leading-relaxed text-amber-400/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-2.5 mb-5 text-left">
            ※ 예측 번호분석기로 정밀 분석하지 않으면 추첨 번호는 저장되지
            않습니다. 번호만 저장하려면 <strong>번호 텍스트 복사</strong> 버튼을
            눌러 메모장 등을 이용해 개인이 기록해야 합니다.
          </p>
        </div>

        {/* 당첨 번호 볼 표시 */}
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 rounded-2xl border border-glass-border bg-surface px-5 py-4">
          {sortedNumbers.map((num) => {
            const isFixedBall = fixedSet.has(num);
            return (
              <BallHoverTooltip key={num} ball={num}>
                <div className="relative">
                  <div
                    className={`lotto-ball cursor-pointer ${
                      isFixedBall
                        ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]'
                        : 'ring-2 ring-primary-cyan/30'
                    }`}
                    style={getBallStyle(num)}
                  >
                    {num}
                  </div>
                  {isFixedBall && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[0.55rem] font-extrabold leading-tight shadow-sm border border-white/60 pointer-events-none">
                      고정
                    </span>
                  )}
                </div>
              </BallHoverTooltip>
            );
          })}
          <span className="mx-1 font-display text-lg font-bold text-dim">
            +
          </span>
          <BallHoverTooltip ball={bonusNumber}>
            <div
              className="lotto-ball cursor-pointer ring-2 ring-primary-purple/40"
              style={getBallStyle(bonusNumber)}
            >
              {bonusNumber}
            </div>
          </BallHoverTooltip>
        </div>

        {/* 추첨 번호 통계 요약 */}
        <div className="mb-6 grid grid-cols-3 gap-3 text-left">
          <div className="rounded-2xl border border-glass-border bg-surface px-4 py-3">
            <div className="text-xs font-medium text-dim">번호 총합</div>
            <div className="mt-1 font-display text-lg font-extrabold text-main tabular-nums">
              {sum}
            </div>
          </div>
          <div className="rounded-2xl border border-glass-border bg-surface px-4 py-3">
            <div className="text-xs font-medium text-dim">홀짝 비율</div>
            <div className="mt-1 font-display text-lg font-extrabold text-primary-cyan tabular-nums">
              {oddCount} : {evenCount}
            </div>
          </div>
          <div className="rounded-2xl border border-glass-border bg-surface px-4 py-3">
            <div className="text-xs font-medium text-dim">고저 비율</div>
            <div className="mt-1 font-display text-lg font-extrabold text-main tabular-nums">
              {highCount} : {lowCount}
            </div>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleSendToAnalyzer}
            className="btn-neon btn-cyan h-11 text-xs! px-3!"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            예측 분석기로 정밀 분석
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="btn-neon btn-outline h-11 px-3! text-xs!"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            {copied ? '복사 완료!' : '번호 텍스트 복사'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
