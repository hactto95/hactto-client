import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { LottoMachineModel } from '../../types/draw';
import {
  LOTTO_MACHINES,
  MACHINE_LIST,
} from '../../utils/lottery3d/machinePresets';

interface MachineInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: LottoMachineModel;
  onSelectModel: (model: LottoMachineModel) => void;
  isDrawInProgress?: boolean;
}

export const MachineInfoModal: React.FC<MachineInfoModalProps> = ({
  isOpen,
  onClose,
  currentModel,
  onSelectModel,
  isDrawInProgress = false,
}) => {
  const [activeTab, setActiveTab] = useState<LottoMachineModel>(currentModel);

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

  const currentSpec = LOTTO_MACHINES[activeTab];

  return createPortal(
    <div
      className="admin-modal-overlay z-[1100]!"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-card admin-modal-content-wide max-w-[720px]! max-h-[90dvh]! p-0! text-left relative overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-glass-border bg-surface">
          <div>
            <h3 className="font-display text-lg font-extrabold text-main m-0">
              대한민국 역대 로또 추첨기 역사관
            </h3>
            <p className="text-xs text-muted mt-0.5 m-0">
              프랑스 Editec사의 Venus 기계 역사 및 정밀 추첨 메커니즘
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-none text-dim hover:text-main cursor-pointer p-1.5 rounded-xl hover:bg-surface-hover transition-colors"
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

        {/* 탭 네비게이션 */}
        <div className="shrink-0 px-5 sm:px-6 py-2.5 border-b border-glass-border bg-card flex gap-2 flex-wrap">
          {MACHINE_LIST.map((spec) => {
            const isTabActive = spec.id === activeTab;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => setActiveTab(spec.id)}
                className={`tab-btn text-xs! px-3.5! py-1.5! ${
                  isTabActive ? 'active-tab font-bold!' : ''
                }`}
              >
                {spec.name}
              </button>
            );
          })}
        </div>

        {/* 바디 상세 내용 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-4 text-sm">
          {/* 주요 요약 카드 */}
          <div className="p-4 rounded-2xl bg-surface border border-glass-border flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-primary-cyan">
                  {currentSpec.generation}
                </span>
                <h4 className="font-display text-base font-extrabold text-main m-0">
                  {currentSpec.name}
                </h4>
                <span className="text-xs text-muted">
                  · {currentSpec.subName}
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-cyan/10 text-primary-cyan border border-primary-cyan/25">
                {currentSpec.episodeRange}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-[1.6fr_1fr_1fr_1fr] gap-4 pt-3 border-t border-glass-border text-xs">
              <div>
                <span className="text-[0.68rem] text-dim block mb-0.5">
                  운영 기간
                </span>
                <span className="font-bold text-main whitespace-nowrap">
                  {currentSpec.operatingPeriod}
                </span>
              </div>
              <div>
                <span className="text-[0.68rem] text-dim block mb-0.5">
                  제조사
                </span>
                <span className="font-bold text-main whitespace-nowrap">
                  {currentSpec.manufacturer}
                </span>
              </div>
              <div>
                <span className="text-[0.68rem] text-dim block mb-0.5">
                  공 규격 (직경/무게)
                </span>
                <span className="font-bold text-main whitespace-nowrap">
                  {currentSpec.ballSpecs.diameterMm}mm /{' '}
                  {currentSpec.ballSpecs.weightG}g
                </span>
              </div>
              <div>
                <span className="text-[0.68rem] text-dim block mb-0.5">
                  공기 노즐
                </span>
                <span className="font-bold text-primary-cyan whitespace-nowrap">
                  {currentSpec.airSystem.nozzleCount}채널 분사
                </span>
              </div>
            </div>
          </div>

          {/* 에어 제트 & 공기역학 시스템 설명 */}
          <div className="bg-primary-cyan/[0.04] border border-primary-cyan/20 px-4 py-3.5 rounded-2xl flex gap-3 items-start">
            <div className="mt-0.5 text-primary-cyan flex items-center justify-center shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-primary-cyan mb-1">
                {currentSpec.airSystem.type}
              </div>
              <div className="text-xs text-muted leading-relaxed break-keep">
                {currentSpec.airSystem.description}
              </div>
            </div>
          </div>

          {/* 주요 기술 및 역사적 특징 */}
          <div className="flex flex-col gap-2">
            <h5 className="text-[0.72rem] font-bold uppercase tracking-wider text-dim m-0">
              역사적 의의 및 주요 특징
            </h5>
            <div className="p-4 rounded-2xl bg-surface border border-glass-border grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5">
              {currentSpec.highlights.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-main"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-cyan mt-1.5 shrink-0" />
                  <span className="leading-relaxed break-keep">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 공 규격의 과학적 비밀 */}
          <div className="p-4 rounded-2xl bg-surface border border-glass-border text-xs flex flex-col gap-1.5">
            <span className="font-bold text-main flex items-center gap-1.5">
              <span>💡</span>
              <span>로또공 규격의 비밀 (4.0g의 과학)</span>
            </span>
            <p className="text-muted leading-relaxed m-0 break-keep">
              공식 로또 추첨공은 특수 발포 합성 스펀지 고무 재질로 제작되며 지름
              45mm, 무게 4.0g(오차 ±0.04g 이하)의 엄격한 규격을 통과해야 합니다.
              매 추첨 전 경찰관 및 방청객 입회 하에 정밀 저울로 45개 공의 무게를
              전수 측정합니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="shrink-0 flex items-center justify-between flex-wrap gap-3 px-5 sm:px-6 py-3.5 border-t border-glass-border bg-surface">
          <span className="text-xs text-muted">
            현재 시뮬레이터 적용 모델:{' '}
            <strong className="text-main">
              {LOTTO_MACHINES[currentModel].name}
            </strong>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-neon btn-outline w-auto! h-9 px-4! text-xs!"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={isDrawInProgress}
              onClick={() => {
                onSelectModel(activeTab);
                onClose();
              }}
              className="btn-submit h-9 px-4! text-xs! disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {isDrawInProgress
                ? '추첨 진행 중 변경 불가'
                : '이 기계로 시뮬레이터 변경'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
