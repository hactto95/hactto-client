import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  API_BASE_URL,
  getAlgorithmDescription,
  parseAlgorithmName,
} from '../../utils';

import { LottoAnalysisCard } from '../../components/LottoAnalysisCard';
import { PersonalAnalysisCard } from '../../components/PersonalAnalysisCard';
import type { LottoAnalysis } from '../../types';

const DEFAULT_WEIGHTS = [25, 20, 18, 15, 12, 10];

export function Generate() {
  const {
    appendAuth,
    showAlert,
    hasUnsavedWeights,
    setHasUnsavedWeights,
    setShowUnsavedModal,
    setUnsavedActionTarget,
    checkIpStatus,
  } = useApp();
  const { user } = useAuth();
  const userId = user?.id;
  const { requireAuthAction } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [algorithmTypes, setAlgorithmTypes] = useState<any[]>([]);
  const [generatingAlgo, setGeneratingAlgo] = useState('MIN_COUNT');
  const [generatedNumbers, setGeneratedNumbers] = useState<number[] | null>(
    null,
  );
  const [generatedAnalysis, setGeneratedAnalysis] =
    useState<LottoAnalysis | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // New states for personal prediction analysis
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'analyze'>(
    'generate',
  );
  const [selectedGames, setSelectedGames] = useState<number[][]>([
    [],
    [],
    [],
    [],
    [],
  ]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analyzedResults, setAnalyzedResults] = useState<any[]>([]);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState<number>(0);
  const [savedPredictionIds, setSavedPredictionIds] = useState<
    Record<number, number>
  >({});
  const [analyzing, setAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [latestEpisode, setLatestEpisode] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Prevent body scroll when modal is open and add ESC key support
  useEffect(() => {
    const scrollContainer = document.querySelector(
      '.scroll-y-container',
    ) as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showWarningModal) {
          setShowWarningModal(false);
        } else if (showConfirmModal) {
          setShowConfirmModal(false);
        } else if (analyzedResults.length > 0) {
          if (
            Object.keys(savedPredictionIds).length === analyzedResults.length
          ) {
            setAnalyzedResults([]);
          } else {
            setShowWarningModal(true);
          }
        } else if (generatedNumbers) {
          setGeneratedNumbers(null);
        }
      }
    };

    if (
      generatedNumbers ||
      analyzedResults.length > 0 ||
      showWarningModal ||
      showConfirmModal
    ) {
      document.body.style.overflow = 'hidden';
      if (scrollContainer) scrollContainer.style.overflowY = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      if (scrollContainer) scrollContainer.style.overflowY = 'auto';
    }
    return () => {
      document.body.style.overflow = '';
      if (scrollContainer) scrollContainer.style.overflowY = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    generatedNumbers,
    analyzedResults.length,
    showWarningModal,
    showConfirmModal,
    savedPredictionIds,
  ]);

  // Fetch the latest episode on mount
  useEffect(() => {
    fetch(appendAuth(`${API_BASE_URL}/winning-numbers/latest`))
      .then((r) => r.json())
      .then((d) => {
        const episode = (d.data || d).episode;
        if (episode) {
          setLatestEpisode(episode);
        }
      })
      .catch((err) => console.error('최신 회차 조회 실패', err));
  }, [appendAuth]);

  // 알고리즘 유형 그룹화를 위한 헬퍼 함수 및 가공
  const getGroupKey = (type: string) => {
    const parts = type.split('_');
    return parts[parts.length - 1]; // 마지막 인덱스 (WEIGHTS, FREQUENCY 등)
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedAlgorithms: Record<string, any[]> = {};
  algorithmTypes.forEach((algo) => {
    const type = typeof algo === 'object' ? algo.type : algo;
    const groupKey = getGroupKey(type);
    if (!groupedAlgorithms[groupKey]) {
      groupedAlgorithms[groupKey] = [];
    }
    groupedAlgorithms[groupKey].push(algo);
  });

  // Personal Weight States
  const [weights, setWeights] = useState<number[]>(DEFAULT_WEIGHTS);
  const [initialWeights, setInitialWeights] =
    useState<number[]>(DEFAULT_WEIGHTS);
  const [savingWeights, setSavingWeights] = useState(false);
  const [weightStatus, setWeightStatus] = useState<'default' | 'saved'>(
    'default',
  );
  const [isWeightsExpanded, setIsWeightsExpanded] = useState(false);

  // Fetch weights when algorithm or userId changes
  useEffect(() => {
    const fetchPersonalWeights = async () => {
      if (!generatingAlgo || !userId) return;

      // WEIGHTS로 끝나지 않는 알고리즘은 가중치 개인설정 조회를 생략
      if (!generatingAlgo.endsWith('WEIGHTS')) {
        setWeights(DEFAULT_WEIGHTS);
        setInitialWeights(DEFAULT_WEIGHTS);
        setWeightStatus('default');
        return;
      }

      try {
        const res = await fetch(
          appendAuth(
            `${API_BASE_URL}/personal-weights?algorithm=${generatingAlgo}`,
          ),
          {},
        );
        if (res.ok) {
          const data = await res.json();
          const result = data.data || data;
          if (Array.isArray(result) && result.length === 6) {
            setWeights(result);
            setInitialWeights(result);
            setWeightStatus('saved');
            return;
          }
        }
        // If not found or failed, reset to default
        setWeights(DEFAULT_WEIGHTS);
        setInitialWeights(DEFAULT_WEIGHTS);
        setWeightStatus('default');
      } catch (err) {
        console.error('가중치 조회 실패', err);
        setWeights(DEFAULT_WEIGHTS);
        setWeightStatus('default');
      }
    };
    fetchPersonalWeights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatingAlgo, appendAuth]);

  const currentWeightsSum = weights.reduce((a, b) => a + b, 0);
  const remainingWeight = 100 - currentWeightsSum;

  const handleWeightChange = (index: number, val: number) => {
    const sumOfOthers = weights.reduce(
      (sum, w, idx) => (idx === index ? sum : sum + w),
      0,
    );
    const maxAllowed = 100 - sumOfOthers;
    const finalVal = Math.min(val, maxAllowed);

    const nextWeights = [...weights];
    nextWeights[index] = finalVal;
    setWeights(nextWeights);
  };

  const handleSaveWeights = async () => {
    requireAuthAction(async () => {
      if (currentWeightsSum !== 100) {
        showAlert('error', '가중치의 합계는 반드시 100이어야 합니다.');
        return;
      }
      setSavingWeights(true);
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/personal-weights`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              algorithm: generatingAlgo,
              weights: weights,
            }),
          },
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || '가중치 저장에 실패했습니다.');
        }
        showAlert(
          'success',
          '개인 가중치가 성공적으로 저장되었습니다. 번호 생성 시 이 가중치가 적용됩니다.',
        );
        setInitialWeights(weights);
        setWeightStatus('saved');
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setSavingWeights(false);
      }
    });
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    setWeightStatus('default');
  };

  useEffect(() => {
    if (!generatingAlgo || !generatingAlgo.endsWith('WEIGHTS')) {
      setHasUnsavedWeights(false);
      return;
    }
    const isDirty = JSON.stringify(weights) !== JSON.stringify(initialWeights);
    setHasUnsavedWeights(isDirty);
    return () => {
      setHasUnsavedWeights(false);
    };
  }, [weights, initialWeights, generatingAlgo, setHasUnsavedWeights]);

  useEffect(() => {
    const fetchAlgorithmTypes = async () => {
      try {
        const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms`));
        if (!res.ok) throw new Error('알고리즘 목록을 가져오지 못했습니다.');
        const data = await res.json();
        const result = data.data || data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let types: any[] = [];
        if (Array.isArray(result)) {
          types = result;
        } else if (result && Array.isArray(result.types)) {
          types = result.types.map((t: string) => ({ type: t, complexity: 0 }));
        }
        setAlgorithmTypes(types);
        if (types.length > 0) {
          const firstType =
            typeof types[0] === 'object' ? types[0].type : types[0];
          setGeneratingAlgo(firstType);
        }
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlgorithmTypes();
  }, [appendAuth, showAlert]);

  // Click outside to close custom select dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-select-container')) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleGeneratePrediction = async () => {
    requireAuthAction(async () => {
      setGenerating(true);
      setGeneratedNumbers(null);
      setGeneratedAnalysis(null);
      try {
        const isWeightsAlgo = generatingAlgo.endsWith('WEIGHTS');
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/algorithms/${generatingAlgo}/generate`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              isWeightsAlgo
                ? {
                    weights: weights,
                  }
                : {},
            ),
          },
        );
        if (!res.ok) {
          let errorMsg = '예측 번호 생성에 실패했습니다.';
          try {
            const errData = await res.json();
            if (errData && errData.message) {
              errorMsg = errData.message;
            }
          } catch {
            // ignore error
          }
          throw new Error(errorMsg);
        }
        const data = await res.json();
        const result = data.data || data;
        setGeneratedNumbers(result.numbers as number[]);
        setGeneratedAnalysis((result.analysis as LottoAnalysis) || null);
        showAlert('success', '새로운 당첨 예측 번호가 생성되었습니다.');
        checkIpStatus(true);
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setGenerating(false);
      }
    });
  };

  const handleNumberToggleForGame = (gameIndex: number, num: number) => {
    if (isSaving || analyzing) return;
    setSelectedGames((prev) => {
      const next = [...prev];
      const current = next[gameIndex] || [];
      if (current.includes(num)) {
        next[gameIndex] = current.filter((n) => n !== num);
      } else if (current.length < 6) {
        next[gameIndex] = [...current, num].sort((a, b) => a - b);
      }
      return next;
    });
  };

  const handleSemiAutoForGame = (gameIndex: number) => {
    const currentSel = selectedGames[gameIndex] || [];
    const remaining = 6 - currentSel.length;
    if (remaining <= 0) return;

    const pool = Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) => !currentSel.includes(n),
    );

    for (let i = pool.length - 1; i > 0; i--) {
      // eslint-disable-next-line react-hooks/purity
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const completed = [...currentSel, ...pool.slice(0, remaining)].sort(
      (a, b) => a - b,
    );
    setSelectedGames((prev) => {
      const next = [...prev];
      next[gameIndex] = completed;
      return next;
    });
  };

  const handleResetForGame = (gameIndex: number) => {
    setSelectedGames((prev) => {
      const next = [...prev];
      next[gameIndex] = [];
      return next;
    });
  };

  const handleAnalyzeClick = () => {
    const validGamesCount = selectedGames.filter(
      (game) => game.length === 6,
    ).length;
    if (validGamesCount === 0) {
      showAlert(
        'error',
        '최소 1개 이상의 게임에 6개 번호를 채워야 분석할 수 있습니다.',
      );
      return;
    }
    setShowConfirmModal(true);
  };

  const handlePerformAnalysis = async () => {
    requireAuthAction(async () => {
      setShowConfirmModal(false);
      setAnalyzing(true);
      setAnalyzedResults([]);
      setSavedPredictionIds({});
      setCurrentAnalysisIndex(0);

      try {
        const results = [];

        for (let i = 0; i < selectedGames.length; i++) {
          const prediction = selectedGames[i];
          if (prediction.length !== 6) continue;

          const res = await fetch(
            appendAuth(`${API_BASE_URL}/personal-analysis`),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prediction }),
            },
          );
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || '번호 분석에 실패했습니다.');
          }
          const data = await res.json();
          results.push({
            originalIndex: i,
            numbers: prediction,
            analysis: data.data || data,
          });
        }

        setAnalyzedResults(results);
        showAlert(
          'success',
          `${results.length}개의 예측 번호 분석이 완료되었습니다.`,
        );
        checkIpStatus(true);
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setAnalyzing(false);
      }
    });
  };

  const handleSaveCurrent = async () => {
    requireAuthAction(async () => {
      const current = analyzedResults[currentAnalysisIndex];
      if (!current) return;
      setIsSaving(true);
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/personal-predictions`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              episode: latestEpisode + 1,
              prediction: current.numbers,
            }),
          },
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || '예측 번호 저장에 실패했습니다.');
        }
        const data = await res.json();
        const savedId = (data.data || data).id || 9999;
        setSavedPredictionIds((prev) => ({
          ...prev,
          [currentAnalysisIndex]: savedId,
        }));

        // Initialize/clear the original game paper that was saved
        if (typeof current.originalIndex === 'number') {
          setSelectedGames((prev) => {
            const next = [...prev];
            next[current.originalIndex] = [];
            return next;
          });
        }

        showAlert(
          'success',
          `${currentAnalysisIndex + 1}번째 예측번호가 저장되었습니다!`,
        );
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setIsSaving(false);
      }
    });
  };

  const renderSubTabs = () => {
    const tabs = [
      { id: 'generate', label: '예측번호 생성' },
      { id: 'analyze', label: '예측번호 분석' },
    ] as const;

    const validGamesCount = selectedGames.filter(
      (game) => game.length === 6,
    ).length;

    return (
      <div className="flex justify-between items-center mb-4 w-full flex-wrap gap-3">
        <div className="inline-flex bg-surface border border-glass-border p-1 rounded-xl gap-1">
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`border-none font-sans text-xs sm:text-sm px-4 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-card text-primary-cyan font-bold shadow-xs'
                    : 'bg-transparent text-muted font-semibold hover:text-main'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeSubTab === 'analyze' && (
          <button
            onClick={handleAnalyzeClick}
            disabled={validGamesCount === 0 || analyzing || isSaving}
            className={`px-5 h-10 text-sm rounded-xl border-none font-bold flex items-center justify-center transition-all duration-200 ${
              validGamesCount === 0
                ? 'bg-surface text-dim shadow-none cursor-not-allowed border border-glass-border'
                : 'bg-primary-cyan hover:bg-primary-cyan/90 text-white shadow-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {analyzing ? '분석 중...' : '선택 번호 분석하기'}
          </button>
        )}
      </div>
    );
  };

  const renderAnalyze = () => {
    return (
      <div className="flex justify-center items-stretch gap-2.5 py-2.5 w-full flex-wrap">
        {selectedGames.map((selectedNumbers, gameIndex) => {
          return (
            <div
              key={gameIndex}
              className="w-[180px] bg-[#faf8f2] border border-[#e0d9c3] border-t-[6px] border-t-[#c62828] rounded-[4px] pt-4 px-3 pb-3 shadow-[0_6px_15px_rgba(0,0,0,0.35)] text-[#3e2723] font-mono relative overflow-hidden shrink-0 flex flex-col justify-between"
            >
              {/* Pink sidebar line pattern */}
              <div className="absolute left-1 top-0 bottom-0 border-l border-dashed border-[#c62828]/15" />
              <div className="absolute right-1 top-0 bottom-0 border-l border-dashed border-[#c62828]/15" />

              <div>
                {/* Header Text */}
                <div className="text-center mb-2.5 text-[0.78rem] font-bold text-[#c62828] tracking-[0.5px]">
                  HACTTO - GAME {String.fromCharCode(65 + gameIndex)}
                </div>

                {/* Numbers Grid */}
                <div className="grid grid-cols-7 gap-y-1 gap-x-2 mb-0 p-0.5">
                  {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                    const isSelected = selectedNumbers.includes(num);
                    const isDisabled =
                      !isSelected && selectedNumbers.length >= 6;
                    return (
                      <div
                        key={num}
                        onClick={() =>
                          !isDisabled &&
                          handleNumberToggleForGame(gameIndex, num)
                        }
                        className={`flex flex-col items-center justify-center h-8 relative select-none ${
                          isDisabled
                            ? 'cursor-not-allowed opacity-35'
                            : 'cursor-pointer opacity-100'
                        }`}
                      >
                        {/* Number Box */}
                        <div className="w-[14px] h-[26px] border-t border-b border-[#c62828]/40 relative flex items-center justify-center text-[0.62rem] font-bold text-[#c62828] bg-[#c62828]/[0.02]">
                          <div className="absolute top-0 left-0 w-px h-0.5 bg-[#c62828]/40" />
                          <div className="absolute top-0 right-0 w-px h-0.5 bg-[#c62828]/40" />
                          <div className="absolute bottom-0 left-0 w-px h-0.5 bg-[#c62828]/40" />
                          <div className="absolute bottom-0 right-0 w-px h-0.5 bg-[#c62828]/40" />
                          {num}
                        </div>

                        {/* Computer Sign Pen Stroke */}
                        {isSelected && (
                          <div className="absolute w-[3px] h-[27px] bg-[#1c1c1c] rounded-[1px] rotate-12 opacity-90 pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Section inside the Ticket */}
              <div className="border-t border-dashed border-black/12 pt-2 flex flex-col gap-1.5 mt-2">
                {/* Auto / Semi-Auto Section */}
                <div className="flex justify-between items-center">
                  <span className="text-[0.68rem] font-bold text-[#c62828]">
                    반자동 채우기
                  </span>
                  <button
                    onClick={() => handleSemiAutoForGame(gameIndex)}
                    disabled={
                      selectedNumbers.length === 6 || isSaving || analyzing
                    }
                    className={`text-white border-none rounded-[2px] px-1.5 py-0.5 text-[0.62rem] font-bold ${
                      selectedNumbers.length === 6
                        ? 'bg-[#ccc] cursor-not-allowed'
                        : 'bg-[#c62828] cursor-pointer'
                    }`}
                  >
                    자동
                  </button>
                </div>

                {/* Reset Section */}
                <div className="flex justify-between items-center">
                  <span className="text-[0.68rem] font-bold text-[#555]">
                    초기화
                  </span>
                  <button
                    onClick={() => handleResetForGame(gameIndex)}
                    disabled={selectedNumbers.length === 0}
                    className={`text-white border-none rounded-[2px] px-1.5 py-0.5 text-[0.62rem] font-bold ${
                      selectedNumbers.length === 0
                        ? 'bg-[#ccc] cursor-not-allowed'
                        : 'bg-[#3e2723] cursor-pointer'
                    }`}
                  >
                    리셋
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Portals for modals */}
        {showConfirmModal &&
          createPortal(
            <div className="admin-modal-overlay z-[1100]!">
              <div className="glass-card admin-modal-content max-w-[440px]! text-center overflow-hidden">
                <div className="status-icon bg-primary-purple/10! border! border-primary-purple/40! text-primary-purple! mb-5! inline-flex! w-14! h-14! rounded-full items-center justify-center">
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>

                <h2 className="access-title text-[1.35rem]! mb-2! text-main font-bold">
                  예측 번호 분석
                </h2>

                <p className="access-desc text-[0.88rem]! mb-6! leading-[1.6] text-muted">
                  {selectedGames.filter((game) => game.length === 6).length}개
                  선택하여 총{' '}
                  {selectedGames.filter((game) => game.length === 6).length * 5}{' '}
                  개의 혼이 사용됩니다. 분석하시겠습니까?
                </p>

                <div className="flex gap-2.5 w-full">
                  <button
                    type="button"
                    className="flex-1 h-[42px] flex items-center justify-center bg-linear-to-br from-primary-purple to-[#7c3aed] text-white shadow-[0_4px_15px_var(--primary-purple-glow)] font-semibold border-none rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                    onClick={handlePerformAnalysis}
                  >
                    분석하기
                  </button>
                  <button
                    type="button"
                    className="btn-neon btn-outline flex-1 p-0! h-[42px] flex items-center justify-center m-0 rounded-lg! cursor-pointer"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {analyzedResults.length > 0 &&
          createPortal(
            <div className="admin-modal-overlay overflow-hidden flex items-center justify-center fixed inset-0 z-[1000]">
              {/* Pagination Left Button */}
              <button
                onClick={() =>
                  setCurrentAnalysisIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentAnalysisIndex === 0}
                className={`absolute left-[calc(50%-410px)] top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-glass-border text-[1.2rem] font-bold flex items-center justify-center z-[1010] transition-all duration-200 ${
                  currentAnalysisIndex === 0
                    ? 'bg-surface text-dim/40 cursor-not-allowed shadow-none'
                    : 'bg-surface-hover text-main cursor-pointer shadow-glass hover:bg-surface-elevated'
                }`}
              >
                &lt;
              </button>

              {/* Main Content Box */}
              <div className="max-w-[680px] w-[90%] max-h-[90vh] overflow-y-hidden relative mx-auto z-[1005] pt-6">
                {/* Header Row: Contains Result Indicator (Center) and Close Button (Right) */}
                <div className="flex justify-center items-center relative mb-4 w-full">
                  <div className="text-muted text-[0.95rem] font-semibold">
                    결과 {currentAnalysisIndex + 1} / {analyzedResults.length}
                  </div>

                  <button
                    onClick={() => {
                      const totalCount = analyzedResults.length;
                      const savedCount = Object.keys(savedPredictionIds).length;
                      if (savedCount < totalCount) {
                        setShowWarningModal(true);
                      } else {
                        setAnalyzedResults([]);
                      }
                    }}
                    className="absolute right-0 bg-transparent border-none text-muted hover:text-main cursor-pointer p-1 flex items-center gap-1.5 transition-colors duration-200 z-[110] text-[0.9rem] font-bold"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>닫기</span>
                  </button>
                </div>

                <PersonalAnalysisCard
                  numbers={analyzedResults[currentAnalysisIndex].numbers}
                  analysis={analyzedResults[currentAnalysisIndex].analysis}
                  onSave={handleSaveCurrent}
                  isSaving={isSaving}
                  isSaved={
                    savedPredictionIds[currentAnalysisIndex] !== undefined
                  }
                />
              </div>

              {/* Pagination Right Button */}
              <button
                onClick={() =>
                  setCurrentAnalysisIndex((prev) =>
                    Math.min(analyzedResults.length - 1, prev + 1),
                  )
                }
                disabled={currentAnalysisIndex === analyzedResults.length - 1}
                className={`absolute right-[calc(50%-410px)] top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-glass-border text-[1.2rem] font-bold flex items-center justify-center z-[1010] transition-all duration-200 ${
                  currentAnalysisIndex === analyzedResults.length - 1
                    ? 'bg-surface text-dim/40 cursor-not-allowed shadow-none'
                    : 'bg-surface-hover text-main cursor-pointer shadow-glass hover:bg-surface-elevated'
                }`}
              >
                &gt;
              </button>
            </div>,
            document.body,
          )}

        {showWarningModal &&
          createPortal(
            <div className="admin-modal-overlay z-[1100]!">
              <div className="glass-card admin-modal-content max-w-[440px]! text-center overflow-hidden">
                {/* Warning Icon */}
                <div className="status-icon bg-error/10! border! border-error! text-error! mb-5! inline-flex! w-14! h-14! rounded-full items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>

                <h2 className="access-title text-[1.35rem]! mb-2! text-main font-bold">
                  저장하지 않고 종료하시겠습니까?
                </h2>

                <p className="access-desc text-[0.88rem]! mb-6! leading-[1.6] text-muted">
                  저장하지 않고 종료하시면 분석 혼만 사용되고 예측번호가
                  보관되지 않습니다. 정말 종료하시겠습니까?
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2.5 w-full">
                  <button
                    type="button"
                    className="flex-1 h-[42px] flex items-center justify-center bg-linear-to-br from-error to-[#b91c1c] text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] font-semibold border-none rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                    onClick={() => {
                      setShowWarningModal(false);
                      setAnalyzedResults([]);
                    }}
                  >
                    종료하기 (저장 안 함)
                  </button>
                  <button
                    type="button"
                    className="btn-neon btn-outline flex-1 p-0! h-[42px] flex items-center justify-center m-0 rounded-lg! cursor-pointer"
                    onClick={() => setShowWarningModal(false)}
                  >
                    머무르기
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-main tracking-tight m-0">
          AI 예측번호 분석기
        </h1>
      </div>

      {renderSubTabs()}

      {activeSubTab === 'generate' && (
        <>
          <p className="text-sm text-dim mb-5">
            사용하고자 하는 하이퍼-파라미터 알고리즘을 선택한 후 번호를
            생성해주십시오. 결과는 내 계정에 즉시 아카이빙되며, 언제든지
            마이페이지에서 확인할 수 있습니다.
          </p>

          {loading ? (
            <div className="bento-card p-10 text-center text-dim">
              알고리즘 목록을 불러오는 중...
            </div>
          ) : (
            <div className="bento-card p-6 sm:p-8 mb-6">
              <label className="form-label mb-2.5 block text-main font-bold text-sm">
                분석 예측 알고리즘 선택
              </label>

              {/* Premium Custom Dropdown */}
              <div className="custom-select-container relative mb-5">
                <div
                  className={`custom-select-trigger ${isDropdownOpen ? 'active' : ''} flex justify-between items-center px-[18px] py-3 rounded-xl text-main transition-all duration-300 ${
                    generating
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  } ${
                    isDropdownOpen
                      ? 'bg-surface border border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.15)]'
                      : `bg-surface border border-glass-border ${!generating ? 'hover:border-yellow-400/25 hover:bg-surface-hover' : ''}`
                  }`}
                  onClick={() =>
                    !generating && setIsDropdownOpen(!isDropdownOpen)
                  }
                >
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-[0.72rem] text-dim uppercase tracking-[0.05em]">
                      선택된 알고리즘
                    </span>
                    <span className="font-semibold text-[0.95rem] text-main flex items-center gap-2 flex-wrap">
                      {parseAlgorithmName(
                        algorithmTypes.find(
                          (a) =>
                            (typeof a === 'object' ? a.type : a) ===
                            generatingAlgo,
                        ) || generatingAlgo,
                      )}
                      {generatingAlgo && (
                        <span className="text-[0.68rem] font-bold px-1.5 py-0.5 rounded bg-surface-hover text-muted border border-glass-border-strong">
                          {getBadgeDetails(generatingAlgo).text}
                        </span>
                      )}
                    </span>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-250 ${
                      isDropdownOpen
                        ? 'rotate-180 text-yellow-500 dark:text-yellow-400'
                        : 'rotate-0 text-dim'
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {isDropdownOpen && (
                  <div className="custom-select-options absolute top-[calc(100%+6px)] left-0 right-0 bg-modal backdrop-blur-xl border border-yellow-400/25 rounded-xl shadow-glass z-10 p-1.5 flex flex-col gap-1.5 max-h-[320px] overflow-y-auto animate-[slideDown_0.2s_ease-out]">
                    {Object.entries(groupedAlgorithms).map(
                      ([groupName, types], groupIdx) => (
                        <div
                          key={groupName}
                          className={`flex flex-col ${groupIdx > 0 ? 'mt-2' : 'mt-0'}`}
                        >
                          {/* 그룹 헤더 */}
                          <div className="pt-1.5 px-3.5 pb-1 text-[0.72rem] font-bold text-primary-cyan uppercase tracking-[0.05em] border-b border-glass-border mb-1">
                            {groupName === 'WEIGHTS'
                              ? '가중치 분석형'
                              : groupName === 'FREQUENCY'
                                ? '빈도 분석형'
                                : '균형 분석형'}
                          </div>
                          {/* 그룹 내 아이템 */}
                          {types.map((algo) => {
                            const type =
                              typeof algo === 'object' ? algo.type : algo;
                            const badge = getBadgeDetails(type);
                            const isSelected = generatingAlgo === type;
                            return (
                              <div
                                key={type}
                                className={`custom-select-option ${isSelected ? 'selected' : ''} px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150 flex justify-between items-center text-left border-l-[3px] ${
                                  isSelected
                                    ? 'border-l-yellow-400 bg-yellow-400/10'
                                    : 'border-l-transparent bg-transparent hover:bg-surface-hover hover:border-l-glass-border-strong'
                                }`}
                                onClick={() => {
                                  if (hasUnsavedWeights) {
                                    setUnsavedActionTarget(() => () => {
                                      setGeneratingAlgo(type);
                                      setIsDropdownOpen(false);
                                    });
                                    setShowUnsavedModal(true);
                                  } else {
                                    setGeneratingAlgo(type);
                                    setIsDropdownOpen(false);
                                  }
                                }}
                              >
                                <span
                                  className={`font-semibold text-[0.9rem] ${
                                    isSelected
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-main'
                                  }`}
                                >
                                  {parseAlgorithmName(algo)}
                                </span>
                                <span className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded whitespace-nowrap bg-surface-hover text-muted border border-glass-border-strong">
                                  {badge.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Algorithm Mechanism Info Box */}
              {generatingAlgo && (
                <div className="bg-primary-cyan/[0.04] border border-primary-cyan/20 px-5 py-4 rounded-xl mb-5 flex gap-3 items-start animate-[fadeIn_0.3s_ease-out] shadow-[inset_0_0_15px_rgba(0,240,255,0.03)]">
                  <div className="mt-0.5 text-primary-cyan flex items-center justify-center shrink-0">
                    <svg
                      width="18"
                      height="18"
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
                  <div className="text-left">
                    <div className="text-[0.85rem] font-bold text-primary-cyan mb-1">
                      알고리즘 상세 메커니즘
                    </div>
                    <div className="text-[0.82rem] text-muted leading-[1.5]">
                      {getAlgorithmDescription(
                        algorithmTypes.find(
                          (a) =>
                            (typeof a === 'object' ? a.type : a) ===
                            generatingAlgo,
                        ) || generatingAlgo,
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Weights Adjustment Section */}
              {generatingAlgo.endsWith('WEIGHTS') && (
                <>
                  <div className="bg-surface border border-glass-border rounded-xl p-5 mb-5 transition-all duration-300">
                    {/* Accordion Header (Click to toggle) */}
                    <div
                      onClick={() => setIsWeightsExpanded(!isWeightsExpanded)}
                      className="flex justify-between items-center cursor-pointer select-none"
                    >
                      <div className="text-left">
                        <span className="text-[0.9rem] font-bold text-main flex items-center gap-2">
                          {/* Chevron Arrow Icon */}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform duration-200 ease-out ${
                              isWeightsExpanded
                                ? 'rotate-90 text-yellow-500 dark:text-yellow-400'
                                : 'rotate-0 text-dim'
                            }`}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          개인 분석 가중치 설정 (합계 100%)
                        </span>
                        <div className="text-xs text-muted mt-0.5 pl-6">
                          {weightStatus === 'saved' ? (
                            <span className="text-success">
                              ● 개인화 가중치 적용됨
                            </span>
                          ) : (
                            <span>기본 가중치 적용 중</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[0.85rem] font-bold ${
                            currentWeightsSum === 100
                              ? 'text-success'
                              : remainingWeight < 0
                                ? 'text-error'
                                : 'text-primary-cyan'
                          }`}
                        >
                          합계: {currentWeightsSum}%
                        </span>
                        <div
                          className={`text-[0.72rem] mt-0.5 ${
                            remainingWeight === 0
                              ? 'text-success'
                              : remainingWeight < 0
                                ? 'text-error'
                                : 'text-muted'
                          }`}
                        >
                          {remainingWeight === 0
                            ? '완료'
                            : remainingWeight < 0
                              ? `${Math.abs(remainingWeight)}% 초과`
                              : `클릭하여 가중치 조절 (${remainingWeight}% 가능)`}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible content (Sliders & Actions) */}
                    {isWeightsExpanded && (
                      <div className="mt-5 border-t border-glass-border pt-5 animate-[slideDown_0.25s_ease-out]">
                        {/* Weights Sliders */}
                        <div className="flex flex-col gap-2.5">
                          {weights.map((weight, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 bg-surface-hover px-3 py-2 rounded-lg"
                            >
                              <span className="text-[0.78rem] font-semibold text-muted w-[60px]">
                                {index + 1}번째 자리
                              </span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={weight}
                                onChange={(e) =>
                                  handleWeightChange(
                                    index,
                                    Number(e.target.value),
                                  )
                                }
                                className={`flex-1 cursor-pointer ${
                                  currentWeightsSum === 100
                                    ? 'accent-success'
                                    : 'accent-primary-cyan'
                                }`}
                              />
                              <span className="text-[0.8rem] font-bold text-main w-[35px] text-right">
                                {weight}%
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Save / Reset Actions */}
                        <div className="flex gap-2.5 mt-4 border-t border-glass-border pt-3.5">
                          <button
                            type="button"
                            className="btn-neon btn-outline flex-1 h-9 px-3! py-0! text-[0.8rem]!"
                            onClick={handleResetWeights}
                          >
                            기본값 재설정
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveWeights}
                            disabled={
                              savingWeights || currentWeightsSum !== 100
                            }
                            className={`flex-[2] h-9 px-3 text-[0.8rem] font-semibold rounded-[10px] border-none transition-all duration-300 ${
                              currentWeightsSum !== 100
                                ? 'bg-input text-dim cursor-not-allowed shadow-none'
                                : 'bg-linear-to-br from-primary-purple to-[#7c3aed] text-white cursor-pointer shadow-[0_4px_15px_var(--primary-purple-glow)] hover:-translate-y-0.5'
                            }`}
                          >
                            {savingWeights
                              ? '저장 중...'
                              : '개인 가중치 저장 및 적용'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {isWeightsExpanded && (
                    <p className="text-xs text-muted text-left mb-5 leading-[1.4]">
                      ※ 설정한 가중치는 이번 예측번호 생성 시 적용되며, 이후
                      언제든 가중치를 다르게 조절하여 새로운 번호를 추출해 볼 수
                      있습니다.
                    </p>
                  )}
                </>
              )}

              {(() => {
                const selectedAlgoObj = algorithmTypes.find(
                  (a) =>
                    (typeof a === 'object' ? a.type : a) === generatingAlgo,
                );
                const complexity = selectedAlgoObj?.complexity || 0;
                return (
                  <p className="text-[0.8rem] text-dim text-center mb-3 mt-2">
                    번호 생성 시{' '}
                    <span className="text-primary-cyan font-bold">
                      {complexity} HON
                    </span>
                    이 차감됩니다.
                  </p>
                );
              })()}

              <button
                className="btn-neon btn-cyan h-12"
                onClick={handleGeneratePrediction}
                disabled={generating || algorithmTypes.length === 0}
              >
                {generating ? '최적 조합 연산 중...' : '예측번호 생성하기'}
              </button>
            </div>
          )}
        </>
      )}

      {activeSubTab === 'analyze' && (
        <>
          <p className="access-desc text-[0.88rem]! mb-4!">
            직접 원하는 예측 번호 조합을 수동으로 입력하여 분석하고 저장할 수
            있습니다. 반자동 기능을 사용하여 일부만 정하고 나머지를 무작위로
            채울 수도 있습니다.
          </p>
          {renderAnalyze()}
        </>
      )}

      {generatedNumbers &&
        createPortal(
          <div className="admin-modal-overlay overflow-y-auto px-5 py-10 items-start!">
            <div className="glass-card admin-modal-content max-w-[600px]! p-0! text-center relative border! border-primary-purple/25! shadow-glass my-auto flex flex-col overflow-hidden max-h-[calc(100vh-80px)]!">
              <div className="pt-8 px-8 pb-0 overflow-y-auto flex flex-col items-center flex-1">
                {/* Close Button */}
                <button
                  onClick={() => setGeneratedNumbers(null)}
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
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-cyan/15 text-primary-cyan">
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

                <h2 className="access-title text-[1.25rem]! font-bold text-main mb-2!">
                  [
                  {algorithmTypes.find((a) => a.key === generatingAlgo)?.name ||
                    parseAlgorithmName(generatingAlgo)}
                  ] 예측 조합 번호 생성 완료
                </h2>

                <p className="access-desc text-[0.85rem]! text-muted mb-2!">
                  알고리즘을 통해 최적의 번호 조합을 추출했습니다.
                </p>

                <div className="w-full text-left">
                  <LottoAnalysisCard
                    numbers={generatedNumbers}
                    analysis={generatedAnalysis}
                    title="예측 번호 심층 분석"
                  />
                </div>

                <p className="text-[0.78rem] text-muted my-5 leading-[1.5]">
                  ※ 생성된 번호 조합은 <strong>[내 당첨이력]</strong> 메뉴에서
                  <br />
                  실제 당첨결과와 대조해 보실 수 있습니다.
                </p>
              </div>

              <div className="px-8 pb-8 pt-0 shrink-0">
                <button
                  type="button"
                  className="w-full h-[42px] flex items-center justify-center bg-linear-to-br from-primary-purple to-[#7c3aed] shadow-[0_4px_15px_var(--primary-purple-glow)] text-white font-semibold text-[0.9rem] rounded-[10px] border-none cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                  onClick={() => setGeneratedNumbers(null)}
                >
                  확인
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const getBadgeDetails = (type: string) => {
  switch (type) {
    case 'MIN_COUNT':
      return {
        text: '자리별 희소',
      };
    case 'TOTAL_MIN_COUNT':
      return {
        text: '누적 희소',
      };
    case 'MAX_COUNT':
      return {
        text: '최다 빈출',
      };
    default:
      return {
        text: '알고리즘',
      };
  }
};

export default Generate;
