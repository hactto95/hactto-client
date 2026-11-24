import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import type { LottoMachineModel } from '../../types/draw';
import {
  Lottery3DCanvas,
  type Lottery3DCanvasRef,
} from '../../components/Draw/Lottery3DCanvas';
import { ControlPanel } from '../../components/Draw/ControlPanel';
import { BallTray } from '../../components/Draw/BallTray';
import { MachineInfoModal } from '../../components/Draw/MachineInfoModal';
import { SaveDrawModal } from '../../components/Draw/SaveDrawModal';
import { NumberFilterModal } from '../../components/Draw/NumberFilterModal';
import { LOTTO_MACHINES } from '../../utils/lottery3d/machinePresets';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils';

export const LotteryDraw: React.FC = () => {
  const {
    freeHon,
    paidHon,
    subscription,
    showAlert,
    appendAuth,
    checkIpStatus,
    setIsDrawingInProgress,
  } = useApp();
  const { requireAuthAction } = useAuth();

  const [machineModel, setMachineModel] =
    useState<LottoMachineModel>('VENUS_3');
  const [isWindOn, setIsWindOn] = useState(false);
  const [windStrength, setWindStrength] = useState(
    LOTTO_MACHINES.VENUS_3.defaultPhysics.windStrength,
  );
  const [turbulence, setTurbulence] = useState(
    LOTTO_MACHINES.VENUS_3.defaultPhysics.turbulence,
  );
  const [rotationSpeed, setRotationSpeed] = useState(
    LOTTO_MACHINES.VENUS_3.defaultPhysics.rotationSpeed,
  );

  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [bonusNumber, setBonusNumber] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [capturedBallNumber, setCapturedBallNumber] = useState<number | null>(
    null,
  );
  const [mixingRemainingSec, setMixingRemainingSec] = useState<number>(0);
  const [isAutoDrawing, setIsAutoDrawing] = useState(false);

  // HON 5개 차감 후 추첨 세션 언락 상태
  const [isDrawUnlocked, setIsDrawUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showUnlockConfirmModal, setShowUnlockConfirmModal] = useState(false);

  const [isMachineInfoOpen, setIsMachineInfoOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const canvasRef = useRef<Lottery3DCanvasRef>(null);
  const autoDrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalHon = (freeHon || 0) + (paidHon || 0);
  const isSubscriber =
    subscription?.status === 'ACTIVE' ||
    (subscription?.status === 'CANCELLED' &&
      !!subscription?.endsAt &&
      new Date(subscription.endsAt) > new Date());

  const totalDrawn = drawnNumbers.length + (bonusNumber !== null ? 1 : 0);
  const isDrawInProgress = isDrawUnlocked && totalDrawn < 7;

  // 전역 네비게이션 차단 상태 및 브라우저 새로고침/뒤로가기 방지 동기화
  useEffect(() => {
    setIsDrawingInProgress(isDrawInProgress);
  }, [isDrawInProgress, setIsDrawingInProgress]);

  useEffect(() => {
    return () => {
      setIsDrawingInProgress(false);
    };
  }, [setIsDrawingInProgress]);

  useEffect(() => {
    if (!isDrawInProgress) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      showAlert(
        'error',
        '추첨이 진행 중입니다. 모든 번호(6구+보너스) 추첨을 완료한 후 이동해 주세요.',
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDrawInProgress, showAlert]);

  // ESC 키로 확인 모달 닫기
  useEffect(() => {
    if (!showUnlockConfirmModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUnlockConfirmModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUnlockConfirmModal]);

  // 추첨 세션 시작 (HON 5개 차감)
  const handleUnlockDraw = useCallback(async () => {
    requireAuthAction(async () => {
      setIsUnlocking(true);
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/lottery-draw/start`),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'HON 사용 처리에 실패했습니다.');
        }

        showAlert(
          'success',
          isSubscriber
            ? '구독 혜택으로 무료 추첨이 시작되었습니다!'
            : 'HON 5개가 사용되었습니다. 추첨을 시작합니다!',
        );
        checkIpStatus(true);
        setIsDrawUnlocked(true);
        setIsWindOn(true);
        setMixingRemainingSec(2.5);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : '오류가 발생했습니다.';
        showAlert('error', message);
      } finally {
        setIsUnlocking(false);
      }
    });
  }, [requireAuthAction, appendAuth, isSubscriber, showAlert, checkIpStatus]);

  // 확인 모달 오픈 트리거 (비로그인 시 로그인 안내 먼저 수행)
  const handleRequestUnlockModal = () => {
    requireAuthAction(() => {
      setShowUnlockConfirmModal(true);
    });
  };

  // 기계 모델 변경 핸들러 (세대별 고유 물리 프리셋 자동 적용)
  const handleSelectMachine = (model: LottoMachineModel) => {
    if (isDrawInProgress) {
      showAlert(
        'error',
        '추첨이 진행 중입니다. 모든 번호 추첨을 완료한 후 모델을 변경해 주세요.',
      );
      return;
    }
    const preset = LOTTO_MACHINES[model].defaultPhysics;
    setMachineModel(model);
    setWindStrength(preset.windStrength);
    setRotationSpeed(preset.rotationSpeed);
    setTurbulence(preset.turbulence);
    handleReset();
  };

  // 2.5초 최소 물리 교반(Mixing Warm-up) 타이머
  useEffect(() => {
    if (!isWindOn || mixingRemainingSec <= 0) return;
    const interval = setInterval(() => {
      setMixingRemainingSec((prev) => {
        const next = Math.round((prev - 0.1) * 10) / 10;
        return next <= 0 ? 0 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isWindOn, mixingRemainingSec]);

  // 고정수 변경 핸들러 (추첨 시작 전 트레이 앞쪽 슬롯에 실시간 프리뷰 반영)
  const handleChangeFixedNumbers = (nextFixed: number[]) => {
    if (isDrawInProgress) return;
    const sorted = [...nextFixed].sort((a, b) => a - b);
    setFixedNumbers(sorted);
    if (!isDrawUnlocked) {
      setDrawnNumbers(sorted);
    }
  };

  // 제외수 변경 핸들러
  const handleChangeExcludedNumbers = (nextExcluded: number[]) => {
    if (isDrawInProgress) return;
    const sorted = [...nextExcluded].sort((a, b) => a - b);
    setExcludedNumbers(sorted);
  };

  // 고정수 · 제외수 전체 초기화 핸들러
  const handleClearAllFilters = () => {
    if (isDrawInProgress) return;
    setFixedNumbers([]);
    setExcludedNumbers([]);
    if (!isDrawUnlocked) {
      setDrawnNumbers([]);
    }
  };

  // 초기화 핸들러 (추첨 결과만 초기화하고 사용자가 설정한 고정수/제외수 필터는 그대로 유지)
  const handleReset = () => {
    if (autoDrawTimerRef.current) {
      clearTimeout(autoDrawTimerRef.current);
      autoDrawTimerRef.current = null;
    }
    setIsAutoDrawing(false);
    setIsExtracting(false);
    setCapturedBallNumber(null);
    setMixingRemainingSec(0);
    setIsWindOn(false);
    setDrawnNumbers([...fixedNumbers]);
    setBonusNumber(null);
    setIsSaveModalOpen(false);
    setIsDrawUnlocked(false);
    canvasRef.current?.resetBalls();
  };

  // 1구 추첨 로직 (사전 번호 선정 없이 상단 벤투리 흡입 밸브만 개방하여 실제 물리 포획)
  const handleDrawBall = useCallback(() => {
    if (!isDrawUnlocked) {
      requireAuthAction(() => {
        setShowUnlockConfirmModal(true);
      });
      return;
    }

    if (isExtracting || mixingRemainingSec > 0) return;
    const currentCount = drawnNumbers.length + (bonusNumber !== null ? 1 : 0);
    if (currentCount >= 7) return;

    if (!isWindOn) {
      setIsWindOn(true);
    }

    const slotIndex = currentCount;
    const chamberRadius = canvasRef.current?.getChamberRadius() ?? 2.4;
    const targetX = (slotIndex - 3) * 0.55;
    const targetY = -chamberRadius - 0.9;
    const targetZ = 1.9;
    const targetPos = new THREE.Vector3(targetX, targetY, targetZ);

    const opened = canvasRef.current?.openExtractionValve(slotIndex, targetPos);
    if (opened) {
      setCapturedBallNumber(null);
      setIsExtracting(true);
    }
  }, [
    isDrawUnlocked,
    isExtracting,
    mixingRemainingSec,
    drawnNumbers.length,
    bonusNumber,
    isWindOn,
    requireAuthAction,
  ]);

  // 상단 벤투리 노즐에서 물리적으로 공이 포획된 순간 수신되는 콜백
  const handleBallCaptured = useCallback((ballNumber: number) => {
    setCapturedBallNumber(ballNumber);
  }, []);

  // 공이 배출 튜브를 거쳐 트레이에 안착 완료되었을 때 수신되는 콜백
  const handleBallLanded = useCallback(
    (ballNumber: number, slotIndex: number) => {
      setIsExtracting(false);
      setCapturedBallNumber(null);

      if (slotIndex < 6) {
        setDrawnNumbers((prev) => {
          if (prev.includes(ballNumber)) return prev;
          return [...prev, ballNumber];
        });
      } else {
        setBonusNumber(ballNumber);
        setIsWindOn(false);
        setIsAutoDrawing(false);
      }
    },
    [],
  );

  // 추첨 진행 완료 감지 및 자동 추첨 루프 제어
  useEffect(() => {
    const totalDrawn = drawnNumbers.length + (bonusNumber !== null ? 1 : 0);

    if (totalDrawn === 7) {
      const timer = setTimeout(() => {
        setIsAutoDrawing(false);
        setIsWindOn(false);
        setIsSaveModalOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }

    if (
      isAutoDrawing &&
      !isExtracting &&
      mixingRemainingSec <= 0 &&
      totalDrawn < 7
    ) {
      autoDrawTimerRef.current = setTimeout(() => {
        handleDrawBall();
      }, 1000);
    }

    return () => {
      if (autoDrawTimerRef.current) {
        clearTimeout(autoDrawTimerRef.current);
      }
    };
  }, [
    drawnNumbers.length,
    bonusNumber,
    isAutoDrawing,
    isExtracting,
    mixingRemainingSec,
    handleDrawBall,
  ]);

  // 자동 추첨 토글
  const handleAutoDrawToggle = () => {
    if (!isDrawUnlocked) {
      handleRequestUnlockModal();
      return;
    }

    if (isAutoDrawing) {
      setIsAutoDrawing(false);
      if (autoDrawTimerRef.current) clearTimeout(autoDrawTimerRef.current);
    } else {
      setIsAutoDrawing(true);
      if (!isExtracting) {
        handleDrawBall();
      }
    }
  };

  const currentSpec = LOTTO_MACHINES[machineModel];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 페이지 헤더 (기존 대시보드 페이지들과 동일한 타이포그래피 및 간격) */}
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-main tracking-tight m-0">
            AI 예측번호 추첨기
          </h1>
          <p className="text-sm text-dim mt-1.5 m-0">
            실제 방송과 동일한 공기 역학 시뮬레이션으로 45개의 공을 섞고 원하는
            순간에 번호를 직접 추첨해 보세요.
            <span className="ml-2 text-primary-cyan font-semibold">
              [{currentSpec.generation} • {currentSpec.name}]
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsMachineInfoOpen(true)}
          className="btn-neon btn-outline w-auto! h-10 px-4! text-xs! rounded-xl!"
        >
          <svg
            className="w-4 h-4 text-primary-cyan"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          역대 추첨기 역사관
        </button>
      </div>

      {/* 2. 메인 시뮬레이터 및 컨트롤 2열 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        {/* 좌측: 3D 로또 캔버스 + 하단 볼 트레이 (7~8컬럼) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 lg:gap-5">
          {/* 3D 캔버스 Bento Card 컨테이너 */}
          <div className="bento-card p-0! relative w-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden flex flex-col items-center justify-center bg-radial from-primary-cyan/[0.06] via-surface to-card">
            {/* 좌상단 기계 뱃지 */}
            <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 bg-card/85 backdrop-blur-md px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border border-glass-border text-[0.7rem] sm:text-xs shadow-xs">
              <span
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentSpec.themeColor }}
              />
              <span className="font-bold text-main">{currentSpec.name}</span>
              <span className="hidden sm:inline text-dim text-[0.7rem]">
                · {currentSpec.airSystem.nozzleCount}채널 노즐
              </span>
            </div>

            {/* 우상단 바람 & 혼 상태 표시 */}
            <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-card/85 backdrop-blur-md px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border border-glass-border text-[0.7rem] sm:text-xs shadow-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDrawUnlocked
                      ? isWindOn
                        ? 'bg-success animate-ping'
                        : 'bg-primary-cyan'
                      : 'bg-error'
                  }`}
                />
                <span className="text-[0.72rem] font-semibold text-muted">
                  {isDrawUnlocked
                    ? isWindOn
                      ? '공기 부양 중'
                      : '바람 대기 중'
                    : '추첨 잠금 (5 HON)'}
                </span>
              </div>
            </div>

            {/* Three.js Canvas */}
            <Lottery3DCanvas
              ref={canvasRef}
              machineModel={machineModel}
              isWindOn={isWindOn}
              windStrength={windStrength}
              turbulence={turbulence}
              rotationSpeed={rotationSpeed}
              fixedNumbers={fixedNumbers}
              excludedNumbers={excludedNumbers}
              onBallCaptured={handleBallCaptured}
              onBallLanded={handleBallLanded}
              className="w-full h-full"
            />
          </div>

          {/* 하단 당첨 공 트레이 */}
          <BallTray
            drawnNumbers={drawnNumbers}
            bonusNumber={bonusNumber}
            fixedNumbers={fixedNumbers}
            isExtracting={isExtracting}
            className="w-full"
          />
        </div>

        {/* 우측: 컨트롤 패널 및 스펙 요약 (4~5컬럼) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <ControlPanel
            machineModel={machineModel}
            onSelectMachine={handleSelectMachine}
            isWindOn={isWindOn}
            onToggleWind={() =>
              setIsWindOn((prev) => {
                const next = !prev;
                if (next && totalDrawn === fixedNumbers.length) {
                  setMixingRemainingSec(2.0);
                }
                return next;
              })
            }
            onDrawBall={handleDrawBall}
            onAutoDrawToggle={handleAutoDrawToggle}
            isAutoDrawing={isAutoDrawing}
            onReset={handleReset}
            windStrength={windStrength}
            onChangeWindStrength={setWindStrength}
            turbulence={turbulence}
            onChangeTurbulence={setTurbulence}
            rotationSpeed={rotationSpeed}
            onChangeRotationSpeed={setRotationSpeed}
            fixedNumbers={fixedNumbers}
            excludedNumbers={excludedNumbers}
            onChangeExcludedNumbers={handleChangeExcludedNumbers}
            onOpenFilterModal={() => setIsFilterModalOpen(true)}
            onClearAllFilters={handleClearAllFilters}
            drawnCount={drawnNumbers.length + (bonusNumber !== null ? 1 : 0)}
            isExtracting={isExtracting}
            capturedBallNumber={capturedBallNumber}
            mixingRemainingSec={mixingRemainingSec}
            isDrawUnlocked={isDrawUnlocked}
            onUnlockDraw={handleRequestUnlockModal}
            isUnlocking={isUnlocking}
            totalHon={totalHon}
            isSubscriber={isSubscriber}
          />
        </div>
      </div>

      {/* 3. 모달들 */}
      <MachineInfoModal
        key={machineModel}
        isOpen={isMachineInfoOpen}
        onClose={() => setIsMachineInfoOpen(false)}
        currentModel={machineModel}
        onSelectModel={handleSelectMachine}
        isDrawInProgress={isDrawInProgress}
      />

      <SaveDrawModal
        key={`${drawnNumbers.join('-')}-${bonusNumber ?? 0}`}
        isOpen={isSaveModalOpen}
        onClose={handleReset}
        numbers={drawnNumbers}
        bonusNumber={bonusNumber ?? 0}
        fixedNumbers={fixedNumbers}
        machineModel={machineModel}
      />

      <NumberFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        fixedNumbers={fixedNumbers}
        excludedNumbers={excludedNumbers}
        onChangeFixedNumbers={handleChangeFixedNumbers}
        onChangeExcludedNumbers={handleChangeExcludedNumbers}
        onClearAllFilters={handleClearAllFilters}
        isDrawInProgress={isDrawInProgress}
      />

      {/* 4. HON 사용 확인 모달 (Generate.tsx의 showGenerateConfirmModal과 100% 동일한 구조/스타일) */}
      {showUnlockConfirmModal &&
        createPortal(
          <div
            className="admin-modal-overlay z-[1100]!"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowUnlockConfirmModal(false);
              }
            }}
          >
            <div className="glass-card admin-modal-content max-w-[440px]! text-center overflow-hidden">
              <div className="status-icon bg-primary-cyan/10! border! border-primary-cyan/40! text-primary-cyan! mb-5! inline-flex! w-14! h-14! rounded-full items-center justify-center">
                <svg
                  width="26"
                  height="26"
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

              <h2 className="access-title text-[1.35rem]! mb-2! text-main font-bold">
                예측번호 추첨기 시작
              </h2>

              <p className="access-desc text-[0.88rem]! mb-4! leading-[1.6] text-muted">
                선택하신{' '}
                <strong className="text-main font-bold">
                  [{currentSpec.name}]
                </strong>{' '}
                모델로
                <br />
                새로운 당첨 예측 번호 추첨을 시작하시겠습니까?
              </p>

              <div className="bg-surface/80 rounded-xl p-3.5 mb-6 border border-glass-border flex flex-col gap-2 text-left">
                <div className="flex justify-between items-center text-[0.85rem]">
                  <span className="text-muted">현재 보유 HON</span>
                  <span className="font-semibold text-main">
                    {isSubscriber
                      ? '무제한 (구독 중)'
                      : `${totalHon.toLocaleString()} HON`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[0.85rem]">
                  <span className="text-muted">차감 예정 HON</span>
                  <span className="font-bold text-primary-cyan">
                    {isSubscriber ? '0 HON (구독 무료)' : '-5 HON'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[0.85rem] border-t border-glass-border/40 pt-2">
                  <span className="text-muted">차감 후 잔여 HON</span>
                  <span
                    className={`font-bold ${
                      !isSubscriber && totalHon < 5 ? 'text-error' : 'text-main'
                    }`}
                  >
                    {isSubscriber
                      ? '무제한'
                      : `${Math.max(0, totalHon - 5).toLocaleString()} HON`}
                  </span>
                </div>
                {!isSubscriber && totalHon < 5 && (
                  <p className="text-[0.75rem] text-error font-medium mt-1 mb-0 text-center">
                    ※ 보유 HON이 부족합니다.
                  </p>
                )}
              </div>

              <div className="bg-error/10 border border-error/30 rounded-xl px-3.5 py-2.5 mb-5 text-left flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-error shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-[0.75rem] text-error font-medium leading-[1.45] m-0 break-keep">
                  추첨을 완료하지 않고 종료할 경우{' '}
                  <strong>5 HON이 차감된 채로 추첨은 되지 않습니다.</strong>{' '}
                  반드시 7개의 공(6구 + 보너스) 추첨을 끝까지 완료해 주세요.
                </p>
              </div>

              <div className="flex gap-2.5 w-full">
                <button
                  type="button"
                  className="btn-neon btn-outline flex-1 p-0! h-[42px] flex items-center justify-center m-0 rounded-lg! cursor-pointer"
                  onClick={() => setShowUnlockConfirmModal(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isUnlocking || (!isSubscriber && totalHon < 5)}
                  className="flex-1 h-[42px] flex items-center justify-center bg-linear-to-br from-primary-cyan to-[#0284c7] text-white shadow-[0_4px_15px_var(--primary-cyan-glow)] font-semibold border-none rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    setShowUnlockConfirmModal(false);
                    handleUnlockDraw();
                  }}
                >
                  {isUnlocking ? '처리 중...' : '시작하기'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
