import React, { useState } from 'react';
import type { LottoMachineModel } from '../../types/draw';
import {
  LOTTO_MACHINES,
  MACHINE_LIST,
} from '../../utils/lottery3d/machinePresets';
import { getBallStyle } from '../../utils';
import { MAX_FIXED_NUMBERS, MAX_EXCLUDED_NUMBERS } from './NumberFilterModal';

interface ControlPanelProps {
  machineModel: LottoMachineModel;
  onSelectMachine: (model: LottoMachineModel) => void;
  isWindOn: boolean;
  onToggleWind: () => void;
  onDrawBall: () => void;
  onAutoDrawToggle: () => void;
  isAutoDrawing: boolean;
  onReset: () => void;
  windStrength: number;
  onChangeWindStrength: (val: number) => void;
  turbulence: number;
  onChangeTurbulence: (val: number) => void;
  rotationSpeed: number;
  onChangeRotationSpeed: (val: number) => void;
  fixedNumbers: number[];
  excludedNumbers: number[];
  onChangeExcludedNumbers: (nextExcluded: number[]) => void;
  onOpenFilterModal: () => void;
  onClearAllFilters: () => void;
  drawnCount: number;
  isExtracting: boolean;
  capturedBallNumber: number | null;
  mixingRemainingSec: number;
  isDrawUnlocked: boolean;
  onUnlockDraw: () => void;
  isUnlocking: boolean;
  totalHon: number;
  isSubscriber: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  machineModel,
  onSelectMachine,
  isWindOn,
  onToggleWind,
  onDrawBall,
  onAutoDrawToggle,
  isAutoDrawing,
  onReset,
  windStrength,
  onChangeWindStrength,
  turbulence,
  onChangeTurbulence,
  rotationSpeed,
  onChangeRotationSpeed,
  fixedNumbers,
  excludedNumbers,
  onChangeExcludedNumbers,
  onOpenFilterModal,
  onClearAllFilters,
  drawnCount,
  isExtracting,
  capturedBallNumber,
  mixingRemainingSec,
  isDrawUnlocked,
  onUnlockDraw,
  isUnlocking,
  totalHon,
  isSubscriber,
}) => {
  const isFinished = drawnCount >= 7;
  const isDrawInProgress = isDrawUnlocked && !isFinished;
  const isMixingWarmup = isWindOn && mixingRemainingSec > 0;
  const isFilterLocked = isDrawInProgress || isExtracting || isAutoDrawing;

  const fixedSet = new Set(fixedNumbers);
  const excludedSet = new Set(excludedNumbers);
  const chamberBallCount = 45 - fixedNumbers.length - excludedNumbers.length;

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

  const handleQuickPreset = (predicate: (n: number) => boolean) => {
    if (isFilterLocked) return;
    if (isPresetActive(predicate)) {
      onChangeExcludedNumbers([]);
      return;
    }
    const nextExcluded: number[] = [];
    for (let n = 1; n <= 45; n++) {
      if (!fixedSet.has(n) && predicate(n)) {
        nextExcluded.push(n);
      }
    }
    if (nextExcluded.length <= MAX_EXCLUDED_NUMBERS) {
      onChangeExcludedNumbers(nextExcluded);
    }
  };

  const oddOnlyActive = isPresetActive((n) => n % 2 === 0);
  const evenOnlyActive = isPresetActive((n) => n % 2 !== 0);
  const lowOnlyActive = isPresetActive((n) => n >= 23);
  const highOnlyActive = isPresetActive((n) => n <= 22);

  const [hoveredMachine, setHoveredMachine] =
    useState<LottoMachineModel | null>(null);
  const hoveredSpec = hoveredMachine ? LOTTO_MACHINES[hoveredMachine] : null;
  const currentMachineSpec = LOTTO_MACHINES[machineModel];
  const [isMobileMachineOpen, setIsMobileMachineOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(true);

  return (
    <div className="bento-card p-5 sm:p-6 flex flex-col justify-between gap-5 h-full flex-1">
      {/* 1. 기계 모델 선택 */}
      <div className="relative flex flex-col gap-2.5 pt-4 border-t border-glass-border lg:pt-0 lg:border-t-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <label className="text-sm font-bold text-main">
              추첨 기계 모델 선택
            </label>
            <span className="hidden lg:inline text-[0.68rem] text-dim font-medium">
              (마우스 오버 시 상세 스펙)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isDrawInProgress && (
              <span className="text-[0.68rem] font-semibold text-error">
                추첨 진행 중 변경 불가
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsMobileMachineOpen((prev) => !prev)}
              className="lg:hidden flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface border border-glass-border text-[0.7rem] font-semibold text-muted cursor-pointer"
            >
              <span>{isMobileMachineOpen ? '스펙 접기' : '상세 스펙'}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${
                  isMobileMachineOpen ? 'rotate-180' : 'rotate-0'
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="grid grid-cols-3 gap-2"
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setHoveredMachine(null);
          }}
        >
          {MACHINE_LIST.map((spec) => {
            const isSelected = spec.id === machineModel;
            return (
              <button
                key={spec.id}
                type="button"
                disabled={isDrawInProgress || isExtracting || isAutoDrawing}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') {
                    setHoveredMachine(spec.id);
                  }
                }}
                onClick={() => onSelectMachine(spec.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-cyan bg-primary-cyan/10 text-primary-cyan shadow-xs'
                    : 'border-glass-border bg-surface text-muted hover:border-glass-border-strong hover:text-main hover:bg-surface-hover'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-xs font-bold leading-tight">
                  {spec.name.split(' ')[0]} {spec.name.split(' ')[1]}
                </span>
                <span
                  className={`text-[0.68rem] mt-0.5 font-medium ${
                    isSelected ? 'text-primary-cyan/80' : 'text-dim'
                  }`}
                >
                  {spec.generation.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 모바일 인라인 기계 스펙 요약 및 상세 접기/펼치기 */}
        <div className="lg:hidden rounded-xl bg-surface/80 border border-glass-border px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-primary-cyan truncate">
              {currentMachineSpec.airSystem.type}
            </span>
            <span className="text-[0.68rem] text-dim shrink-0">
              {currentMachineSpec.ballSpecs.diameterMm}mm /{' '}
              {currentMachineSpec.ballSpecs.weightG}g ·{' '}
              {currentMachineSpec.episodeRange}
            </span>
          </div>
          {isMobileMachineOpen && (
            <p className="mt-1.5 pt-1.5 border-t border-glass-border text-[0.72rem] text-muted leading-relaxed m-0 break-keep">
              {currentMachineSpec.airSystem.description}
            </p>
          )}
        </div>

        {/* 데스크톱 기계 모델 마우스 호버 시 노출되는 상세 메커니즘 툴팁 카드 */}
        {hoveredSpec && (
          <div className="hidden lg:flex absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl border border-primary-cyan/35 bg-card/95 backdrop-blur-xl p-4 shadow-glass flex-col gap-2.5 pointer-events-none animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-4 rounded-full bg-primary-cyan inline-block shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-main whitespace-nowrap truncate">
                  {hoveredSpec.name}
                </span>
              </div>
              <span className="text-[0.68rem] font-semibold px-2 py-0.5 rounded bg-surface text-muted border border-glass-border whitespace-nowrap shrink-0">
                {hoveredSpec.episodeRange}
              </span>
            </div>

            <div className="bg-primary-cyan/[0.06] border border-primary-cyan/20 px-3.5 py-2.5 rounded-xl text-left">
              <div className="text-xs font-bold text-primary-cyan mb-1 break-keep">
                {hoveredSpec.airSystem.type}
              </div>
              <p className="text-[0.74rem] text-muted leading-relaxed m-0 break-keep">
                {hoveredSpec.airSystem.description}
              </p>
            </div>

            <div className="pt-2 border-t border-glass-border flex items-center justify-between text-[0.7rem] text-dim">
              <span>
                공 규격: {hoveredSpec.ballSpecs.diameterMm}mm /{' '}
                {hoveredSpec.ballSpecs.weightG}g
              </span>
              <span>제조: {hoveredSpec.manufacturer}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. 물리 파라미터 조절 슬라이더 (추첨 중에도 실시간 조작 가능하도록 상시 노출) */}
      <div className="flex flex-col gap-3 pt-4 border-t border-glass-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-main">
              공기 물리 파라미터 설정
            </span>
            {(() => {
              const preset = LOTTO_MACHINES[machineModel].defaultPhysics;
              const isModified =
                windStrength !== preset.windStrength ||
                rotationSpeed !== preset.rotationSpeed ||
                turbulence !== preset.turbulence;
              if (!isModified) return null;
              return (
                <button
                  type="button"
                  onClick={() => {
                    onChangeWindStrength(preset.windStrength);
                    onChangeRotationSpeed(preset.rotationSpeed);
                    onChangeTurbulence(preset.turbulence);
                  }}
                  className="text-[0.68rem] font-semibold text-primary-cyan hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  기본값 복원
                </button>
              );
            })()}
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
              isWindOn
                ? 'bg-success/10 text-success border-success/25'
                : 'bg-surface text-dim border-glass-border'
            }`}
          >
            {isWindOn ? '● 바람 가동 중' : '○ 바람 정지'}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {/* 바람 세기 */}
          <div className="flex items-center gap-3 bg-surface px-3.5 py-2.5 rounded-xl border border-glass-border">
            <span className="text-xs font-semibold text-muted w-24 shrink-0">
              바람 세기
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={windStrength}
              onChange={(e) => onChangeWindStrength(Number(e.target.value))}
              className="flex-1 cursor-pointer accent-primary-cyan"
            />
            <span className="text-xs font-bold text-primary-cyan w-10 text-right tabular-nums">
              {windStrength} / 10
            </span>
          </div>

          {/* 회전 속도 */}
          <div className="flex items-center gap-3 bg-surface px-3.5 py-2.5 rounded-xl border border-glass-border">
            <span className="text-xs font-semibold text-muted w-24 shrink-0">
              회전 와류 속도
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={rotationSpeed}
              onChange={(e) => onChangeRotationSpeed(Number(e.target.value))}
              className="flex-1 cursor-pointer accent-primary-cyan"
            />
            <span className="text-xs font-bold text-primary-cyan w-10 text-right tabular-nums">
              {rotationSpeed} / 10
            </span>
          </div>

          {/* 난류 강도 */}
          <div className="flex items-center gap-3 bg-surface px-3.5 py-2.5 rounded-xl border border-glass-border">
            <span className="text-xs font-semibold text-muted w-24 shrink-0">
              난류 불규칙성
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={turbulence}
              onChange={(e) => onChangeTurbulence(Number(e.target.value))}
              className="flex-1 cursor-pointer accent-primary-cyan"
            />
            <span className="text-xs font-bold text-primary-cyan w-10 text-right tabular-nums">
              {turbulence} / 10
            </span>
          </div>
        </div>
      </div>

      {/* 2.5. 고정수 · 제외수 및 편의 필터 컴팩트 설정 섹션 */}
      <div className="flex flex-col gap-2.5 pt-4 border-t border-glass-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen((prev) => !prev)}
              className="flex items-center gap-1.5 bg-transparent border-none p-0 text-sm font-bold text-main whitespace-nowrap cursor-pointer lg:cursor-default"
            >
              <span>고정수 · 제외수 설정</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`lg:hidden text-dim transition-transform duration-200 ${
                  isMobileFilterOpen ? 'rotate-180' : 'rotate-0'
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {(fixedNumbers.length > 0 || excludedNumbers.length > 0) &&
              !isFilterLocked && (
                <button
                  type="button"
                  onClick={onClearAllFilters}
                  className="text-[0.68rem] font-semibold text-rose-400 hover:underline bg-transparent border-none cursor-pointer p-0 whitespace-nowrap shrink-0"
                >
                  필터 초기화
                </button>
              )}
          </div>

          <button
            type="button"
            disabled={isFilterLocked}
            onClick={onOpenFilterModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-cyan/10 hover:bg-primary-cyan/20 border border-primary-cyan/30 text-primary-cyan text-xs font-bold cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span>상세 번호 설정</span>
          </button>
        </div>

        <div
          className={`${isMobileFilterOpen ? 'flex' : 'hidden'} lg:flex flex-col gap-2.5`}
        >
          {/* 요약 상태 바 (고정수 미니 볼 + 제외수 + 챔버 잔여 공) */}
          <div className="flex flex-col gap-2 rounded-xl bg-surface border border-glass-border px-3.5 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
                <span className="text-muted">고정수</span>
                <strong className="text-emerald-400 font-bold tabular-nums">
                  {fixedNumbers.length}/{MAX_FIXED_NUMBERS}
                </strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block shrink-0" />
                <span className="text-muted">제외수</span>
                <strong className="text-rose-400 font-bold tabular-nums">
                  {excludedNumbers.length}/{MAX_EXCLUDED_NUMBERS}
                </strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white inline-block shrink-0" />
                <span className="text-dim">챔버 투입</span>
                <strong className="text-main font-bold tabular-nums">
                  {chamberBallCount}구
                </strong>
              </div>
            </div>

            {fixedNumbers.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-glass-border/60">
                <span className="text-[0.68rem] font-semibold text-dim shrink-0">
                  고정 배치됨:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {fixedNumbers.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full font-display font-extrabold text-[0.7rem] ring-1 ring-emerald-400"
                      style={getBallStyle(num)}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 원클릭 퀵 프리셋 칩 (전체 / 홀수만 / 짝수만 / 저번호 / 고번호) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isFilterLocked}
              onClick={() => onChangeExcludedNumbers([])}
              className={`flex-1 min-w-fit py-1.5 px-2 rounded-lg text-[0.7rem] font-bold cursor-pointer transition-all border text-center whitespace-nowrap ${
                excludedNumbers.length === 0
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-surface border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              } disabled:opacity-45 disabled:cursor-not-allowed`}
            >
              전체
            </button>
            <button
              type="button"
              disabled={isFilterLocked}
              onClick={() => handleQuickPreset((n) => n % 2 === 0)}
              className={`flex-1 min-w-fit py-1.5 px-2 rounded-lg text-[0.7rem] font-bold cursor-pointer transition-all border text-center whitespace-nowrap ${
                oddOnlyActive
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-surface border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              } disabled:opacity-45 disabled:cursor-not-allowed`}
            >
              홀수만
            </button>
            <button
              type="button"
              disabled={isFilterLocked}
              onClick={() => handleQuickPreset((n) => n % 2 !== 0)}
              className={`flex-1 min-w-fit py-1.5 px-2 rounded-lg text-[0.7rem] font-bold cursor-pointer transition-all border text-center whitespace-nowrap ${
                evenOnlyActive
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-surface border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              } disabled:opacity-45 disabled:cursor-not-allowed`}
            >
              짝수만
            </button>
            <button
              type="button"
              disabled={isFilterLocked}
              onClick={() => handleQuickPreset((n) => n >= 23)}
              className={`flex-1 min-w-fit py-1.5 px-2 rounded-lg text-[0.7rem] font-bold cursor-pointer transition-all border text-center whitespace-nowrap ${
                lowOnlyActive
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-surface border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              } disabled:opacity-45 disabled:cursor-not-allowed`}
            >
              저(1~22)
            </button>
            <button
              type="button"
              disabled={isFilterLocked}
              onClick={() => handleQuickPreset((n) => n <= 22)}
              className={`flex-1 min-w-fit py-1.5 px-2 rounded-lg text-[0.7rem] font-bold cursor-pointer transition-all border text-center whitespace-nowrap ${
                highOnlyActive
                  ? 'bg-primary-cyan/15 border-primary-cyan text-primary-cyan'
                  : 'bg-surface border-glass-border text-muted hover:text-main hover:border-glass-border-strong'
              } disabled:opacity-45 disabled:cursor-not-allowed`}
            >
              고(23~45)
            </button>
          </div>
        </div>
      </div>

      {/* 3. HON 이용 안내 및 추첨 액션 컨트롤 버튼들 (모바일에서는 최상단 order-first로 배치하여 3D 챔버 직하단에서 즉시 조작) */}
      <div className="order-first lg:order-none flex flex-col gap-3 lg:pt-4 lg:border-t lg:border-glass-border">
        {/* HON 안내 */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-glass-border text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted">추첨 이용료</span>
            <strong className="text-primary-cyan font-bold">
              {isSubscriber ? '0 HON (구독 무료)' : '5 HON'}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-dim">보유 HON</span>
            <strong className="text-main font-bold tabular-nums">
              {isSubscriber ? '무제한' : `${totalHon.toLocaleString()} HON`}
            </strong>
          </div>
        </div>

        {/* 추첨 시작 잠금 상태 (HON 차감 전) */}
        {!isDrawUnlocked ? (
          <>
            <p className="text-[0.78rem] text-dim text-center m-0">
              추첨 시작 시{' '}
              <span className="text-primary-cyan font-bold">
                {isSubscriber ? '0 HON' : '5 HON'}
              </span>
              이 차감됩니다.
            </p>
            <button
              type="button"
              disabled={isUnlocking}
              onClick={onUnlockDraw}
              className="btn-neon btn-cyan h-12"
            >
              {isUnlocking
                ? '혼 확인 중...'
                : isSubscriber
                  ? '추첨 시작하기 (구독자 무료)'
                  : '5 HON 사용하고 추첨 시작하기'}
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* 바람 On/Off 버튼 */}
            <button
              type="button"
              onClick={onToggleWind}
              className={`w-full h-10 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                isWindOn
                  ? 'bg-error/10 border-error/30 text-error hover:bg-error/20'
                  : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isWindOn ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
              </svg>
              {isWindOn ? '바람 멈추기' : '바람 켜기 (공 띄우기)'}
            </button>

            {/* 1구 추첨하기 (핵심 버튼 - 실제 물리 포획 밸브 개방) */}
            <button
              type="button"
              disabled={
                !isWindOn ||
                isMixingWarmup ||
                isExtracting ||
                isFinished ||
                isAutoDrawing
              }
              onClick={onDrawBall}
              className="btn-neon btn-cyan h-12 disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none!"
            >
              {isMixingWarmup ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    공 물리 교반 중... ({mixingRemainingSec.toFixed(1)}초)
                  </span>
                </>
              ) : isExtracting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {capturedBallNumber !== null
                      ? `${capturedBallNumber}번 공 포획! 배출 이동 중...`
                      : '상단 노즐 흡입 포획 중...'}
                  </span>
                </>
              ) : isFinished ? (
                <span>모든 공 추첨 완료 (7 / 7)</span>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <polygon
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    />
                  </svg>
                  <span>
                    {drawnCount === 6
                      ? '보너스 번호 추첨하기 (밸브 열기)'
                      : `${drawnCount + 1}번째 공 추첨하기 (밸브 열기)`}
                  </span>
                </>
              )}
            </button>

            {/* 보조 컨트롤: 자동 추첨 & 초기화 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={
                  !isWindOn || isMixingWarmup || isFinished || isExtracting
                }
                onClick={onAutoDrawToggle}
                className={`h-10 px-3 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  isAutoDrawing
                    ? 'bg-primary-purple/15 border-primary-purple/40 text-primary-purple font-bold'
                    : 'btn-outline'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isAutoDrawing ? '자동 추첨 중단' : '연속 자동 추첨'}
              </button>

              <button
                type="button"
                disabled={isDrawInProgress || isExtracting}
                onClick={onReset}
                title={
                  isDrawInProgress
                    ? '모든 공 추첨을 완료한 후 초기화할 수 있습니다.'
                    : '처음부터 다시 추첨'
                }
                className="btn-neon btn-outline h-10 px-3! text-xs! disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                처음부터 다시
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
