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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          width: '100%',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '4px',
            borderRadius: '10px',
            gap: '2px',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  background: isActive
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-family)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.85rem',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-main)';
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
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
            className="btn-submit"
            style={{
              width: '180px',
              height: '38px',
              fontSize: '0.85rem',
              background:
                validGamesCount === 0
                  ? 'var(--bg-input)'
                  : 'linear-gradient(135deg, var(--primary-purple) 0%, #7c3aed 100%)',
              color: validGamesCount === 0 ? 'var(--text-dim)' : '#ffffff',
              boxShadow:
                validGamesCount === 0
                  ? 'none'
                  : '0 4px 12px var(--primary-purple-glow)',
              cursor: validGamesCount === 0 ? 'not-allowed' : 'pointer',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {analyzing ? '분석 중...' : '선택 번호 분석하기'}
          </button>
        )}
      </div>
    );
  };

  const renderAnalyze = () => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: '10px',
          padding: '10px 0',
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        {selectedGames.map((selectedNumbers, gameIndex) => {
          return (
            <div
              key={gameIndex}
              style={{
                width: '180px',
                background: '#faf8f2',
                border: '1px solid #e0d9c3',
                borderTop: '6px solid #c62828',
                borderRadius: '4px',
                padding: '16px 12px 12px 12px',
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.35)',
                color: '#3e2723',
                fontFamily: 'monospace',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Pink sidebar line pattern */}
              <div
                style={{
                  position: 'absolute',
                  left: '4px',
                  top: 0,
                  bottom: 0,
                  borderLeft: '1px dashed rgba(198, 40, 40, 0.15)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: 0,
                  bottom: 0,
                  borderLeft: '1px dashed rgba(198, 40, 40, 0.15)',
                }}
              />

              <div>
                {/* Header Text */}
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    color: '#c62828',
                    letterSpacing: '0.5px',
                  }}
                >
                  HACTTO - GAME {String.fromCharCode(65 + gameIndex)}
                </div>

                {/* Numbers Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '4px 8px',
                    marginBottom: '0px',
                    padding: '2px',
                  }}
                >
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
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '32px',
                          position: 'relative',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.35 : 1,
                          userSelect: 'none',
                        }}
                      >
                        {/* Number Box */}
                        <div
                          style={{
                            width: '14px',
                            height: '26px',
                            borderTop: '1px solid rgba(198, 40, 40, 0.4)',
                            borderBottom: '1px solid rgba(198, 40, 40, 0.4)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.62rem',
                            fontWeight: 'bold',
                            color: '#c62828',
                            background: 'rgba(198, 40, 40, 0.02)',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '1px',
                              height: '2px',
                              background: 'rgba(198, 40, 40, 0.4)',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: '1px',
                              height: '2px',
                              background: 'rgba(198, 40, 40, 0.4)',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '1px',
                              height: '2px',
                              background: 'rgba(198, 40, 40, 0.4)',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: '1px',
                              height: '2px',
                              background: 'rgba(198, 40, 40, 0.4)',
                            }}
                          />
                          {num}
                        </div>

                        {/* Computer Sign Pen Stroke */}
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              width: '3px',
                              height: '27px',
                              background: '#1c1c1c',
                              borderRadius: '1px',
                              transform: 'rotate(12deg)',
                              opacity: 0.9,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Section inside the Ticket */}
              <div
                style={{
                  borderTop: '1px dashed rgba(0, 0, 0, 0.12)',
                  paddingTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '8px',
                }}
              >
                {/* Auto / Semi-Auto Section */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 'bold',
                      color: '#c62828',
                    }}
                  >
                    반자동 채우기
                  </span>
                  <button
                    onClick={() => handleSemiAutoForGame(gameIndex)}
                    disabled={
                      selectedNumbers.length === 6 || isSaving || analyzing
                    }
                    style={{
                      background:
                        selectedNumbers.length === 6 ? '#ccc' : '#c62828',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '2px',
                      padding: '2px 6px',
                      fontSize: '0.62rem',
                      fontWeight: 'bold',
                      cursor:
                        selectedNumbers.length === 6
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    자동
                  </button>
                </div>

                {/* Reset Section */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 'bold',
                      color: '#555',
                    }}
                  >
                    초기화
                  </span>
                  <button
                    onClick={() => handleResetForGame(gameIndex)}
                    disabled={selectedNumbers.length === 0}
                    style={{
                      background:
                        selectedNumbers.length === 0 ? '#ccc' : '#3e2723',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '2px',
                      padding: '2px 6px',
                      fontSize: '0.62rem',
                      fontWeight: 'bold',
                      cursor:
                        selectedNumbers.length === 0
                          ? 'not-allowed'
                          : 'pointer',
                    }}
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
            <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
              <div
                className="glass-card admin-modal-content"
                style={{
                  maxWidth: '440px',
                  textAlign: 'center',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="status-icon"
                  style={{
                    background: 'rgba(189, 0, 255, 0.1)',
                    border: '1px solid rgba(189, 0, 255, 0.4)',
                    color: 'var(--primary-purple)',
                    marginBottom: '20px',
                    display: 'inline-flex',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
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

                <h2
                  className="access-title"
                  style={{
                    fontSize: '1.35rem',
                    marginBottom: '8px',
                    color: 'var(--text-main)',
                    fontWeight: 'bold',
                  }}
                >
                  예측 번호 분석
                </h2>

                <p
                  className="access-desc"
                  style={{
                    fontSize: '0.88rem',
                    marginBottom: '24px',
                    lineHeight: '1.6',
                    color: 'var(--text-muted)',
                  }}
                >
                  {selectedGames.filter((game) => game.length === 6).length}개
                  선택하여 총{' '}
                  {selectedGames.filter((game) => game.length === 6).length * 5}{' '}
                  개의 혼이 사용됩니다. 분석하시겠습니까?
                </p>

                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button
                    type="button"
                    className="btn-submit"
                    style={{
                      flex: 1,
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        'linear-gradient(135deg, var(--primary-purple) 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 15px var(--primary-purple-glow)',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={handlePerformAnalysis}
                  >
                    분석하기
                  </button>
                  <button
                    type="button"
                    className="btn-neon btn-outline"
                    style={{
                      flex: 1,
                      padding: 0,
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 0,
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
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
            <div
              className="admin-modal-overlay"
              style={{
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
              }}
            >
              {/* Pagination Left Button */}
              <button
                onClick={() =>
                  setCurrentAnalysisIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentAnalysisIndex === 0}
                style={{
                  position: 'absolute',
                  left: 'calc(50% - 410px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background:
                    currentAnalysisIndex === 0
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(255,255,255,0.08)',
                  color:
                    currentAnalysisIndex === 0
                      ? 'rgba(255,255,255,0.2)'
                      : 'var(--text-main)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor:
                    currentAnalysisIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1010,
                  transition: 'all 0.2s ease',
                  boxShadow:
                    currentAnalysisIndex === 0
                      ? 'none'
                      : '0 4px 12px rgba(0,0,0,0.5)',
                }}
              >
                &lt;
              </button>

              {/* Main Content Box */}
              <div
                style={{
                  maxWidth: '680px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflowY: 'hidden',
                  position: 'relative',
                  margin: '0 auto',
                  zIndex: 1005,
                  paddingTop: '24px',
                }}
              >
                {/* Header Row: Contains Result Indicator (Center) and Close Button (Right) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    marginBottom: '16px',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                    }}
                  >
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
                    style={{
                      position: 'absolute',
                      right: '0px',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'color 0.2s ease',
                      zIndex: 110,
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--text-main)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')
                    }
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
                style={{
                  position: 'absolute',
                  right: 'calc(50% - 410px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background:
                    currentAnalysisIndex === analyzedResults.length - 1
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(255,255,255,0.08)',
                  color:
                    currentAnalysisIndex === analyzedResults.length - 1
                      ? 'rgba(255,255,255,0.2)'
                      : 'var(--text-main)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor:
                    currentAnalysisIndex === analyzedResults.length - 1
                      ? 'not-allowed'
                      : 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1010,
                  transition: 'all 0.2s ease',
                  boxShadow:
                    currentAnalysisIndex === analyzedResults.length - 1
                      ? 'none'
                      : '0 4px 12px rgba(0,0,0,0.5)',
                }}
              >
                &gt;
              </button>
            </div>,
            document.body,
          )}

        {showWarningModal &&
          createPortal(
            <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
              <div
                className="glass-card admin-modal-content"
                style={{
                  maxWidth: '440px',
                  textAlign: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Warning Icon */}
                <div
                  className="status-icon"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    marginBottom: '20px',
                    display: 'inline-flex',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
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

                <h2
                  className="access-title"
                  style={{
                    fontSize: '1.35rem',
                    marginBottom: '8px',
                    color: 'var(--text-main)',
                    fontWeight: 'bold',
                  }}
                >
                  저장하지 않고 종료하시겠습니까?
                </h2>

                <p
                  className="access-desc"
                  style={{
                    fontSize: '0.88rem',
                    marginBottom: '24px',
                    lineHeight: '1.6',
                    color: 'var(--text-muted)',
                  }}
                >
                  저장하지 않고 종료하시면 분석 혼만 사용되고 예측번호가
                  보관되지 않습니다. 정말 종료하시겠습니까?
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button
                    type="button"
                    className="btn-submit"
                    style={{
                      flex: 1,
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setShowWarningModal(false);
                      setAnalyzedResults([]);
                    }}
                  >
                    종료하기 (저장 안 함)
                  </button>
                  <button
                    type="button"
                    className="btn-neon btn-outline"
                    style={{
                      flex: 1,
                      padding: 0,
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 0,
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
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
    <div>
      <h2
        className="access-title"
        style={{ fontSize: '1.3rem', marginBottom: '16px' }}
      >
        예측번호 분석기
      </h2>

      {renderSubTabs()}

      {activeSubTab === 'generate' && (
        <>
          <p
            className="access-desc"
            style={{ fontSize: '0.88rem', marginBottom: '16px' }}
          >
            사용하고자 하는 하이퍼-파라미터 알고리즘을 선택한 후 번호를
            생성해주십시오. 결과는 내 계정에 즉시 아카이빙되며, 언제든지
            마이페이지에서 확인할 수 있습니다.
          </p>

          {loading ? (
            <p style={{ color: 'var(--text-dim)' }}>
              알고리즘 목록을 불러오는 중...
            </p>
          ) : (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: 'var(--border-glass)',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '24px',
              }}
            >
              <label
                className="form-label"
                style={{ marginBottom: '8px', display: 'block' }}
              >
                분석 예측 알고리즘 선택
              </label>

              {/* Premium Custom Dropdown */}
              <div
                className="custom-select-container"
                style={{ position: 'relative', marginBottom: '20px' }}
              >
                <div
                  className={`custom-select-trigger ${isDropdownOpen ? 'active' : ''}`}
                  onClick={() =>
                    !generating && setIsDropdownOpen(!isDropdownOpen)
                  }
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: isDropdownOpen
                      ? '1px solid rgba(250, 204, 21, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    color: 'var(--text-main)',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    boxShadow: isDropdownOpen
                      ? '0 0 20px rgba(250, 204, 21, 0.15)'
                      : 'none',
                    transition: 'var(--transition-smooth)',
                    opacity: generating ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!generating && !isDropdownOpen) {
                      e.currentTarget.style.borderColor =
                        'rgba(250, 204, 21, 0.25)';
                      e.currentTarget.style.background =
                        'rgba(255, 255, 255, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!generating && !isDropdownOpen) {
                      e.currentTarget.style.borderColor =
                        'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background =
                        'rgba(255, 255, 255, 0.02)';
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      선택된 알고리즘
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {parseAlgorithmName(
                        algorithmTypes.find(
                          (a) =>
                            (typeof a === 'object' ? a.type : a) ===
                            generatingAlgo,
                        ) || generatingAlgo,
                      )}
                      {generatingAlgo && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: getBadgeDetails(generatingAlgo).color,
                            background: getBadgeDetails(generatingAlgo).bg,
                            border: getBadgeDetails(generatingAlgo).border,
                          }}
                        >
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
                    style={{
                      transform: isDropdownOpen
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      color: isDropdownOpen ? '#facc15' : 'var(--text-dim)',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {isDropdownOpen && (
                  <div
                    className="custom-select-options"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: '#0f111a',
                      border: '1px solid rgba(250, 204, 21, 0.25)',
                      borderRadius: '12px',
                      boxShadow:
                        '0 20px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(250, 204, 21, 0.05)',
                      zIndex: 10,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      maxHeight: '320px',
                      overflowY: 'auto',
                      animation: 'slideDown 0.2s ease-out',
                    }}
                  >
                    {Object.entries(groupedAlgorithms).map(
                      ([groupName, types], groupIdx) => (
                        <div
                          key={groupName}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: groupIdx > 0 ? '8px' : '0px',
                          }}
                        >
                          {/* 그룹 헤더 */}
                          <div
                            style={{
                              padding: '6px 14px 4px 14px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--primary-cyan)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom:
                                '1px solid rgba(255, 255, 255, 0.03)',
                              marginBottom: '4px',
                            }}
                          >
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
                                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
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
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'var(--transition-fast)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  textAlign: 'left',
                                  borderLeft: isSelected
                                    ? '3px solid #facc15'
                                    : '3px solid transparent',
                                  background: isSelected
                                    ? 'rgba(250, 204, 21, 0.08)'
                                    : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background =
                                      'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.borderLeftColor =
                                      'rgba(255, 255, 255, 0.15)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background =
                                      'transparent';
                                    e.currentTarget.style.borderLeftColor =
                                      'transparent';
                                  }
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    color: isSelected
                                      ? '#facc15'
                                      : 'var(--text-main)',
                                  }}
                                >
                                  {parseAlgorithmName(algo)}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    color: badge.color,
                                    background: badge.bg,
                                    border: badge.border,
                                  }}
                                >
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
                <div
                  style={{
                    background: 'rgba(0, 240, 255, 0.02)',
                    border: '1px solid rgba(0, 240, 255, 0.15)',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    animation: 'fadeIn 0.3s ease-out',
                    boxShadow: 'inset 0 0 15px rgba(0, 240, 255, 0.03)',
                  }}
                >
                  <div
                    style={{
                      marginTop: '2px',
                      color: 'var(--primary-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
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
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        color: 'var(--primary-cyan)',
                        marginBottom: '4px',
                      }}
                    >
                      알고리즘 상세 메커니즘
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        lineHeight: '1.5',
                      }}
                    >
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
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      transition: 'var(--transition-smooth)',
                    }}
                  >
                    {/* Accordion Header (Click to toggle) */}
                    <div
                      onClick={() => setIsWeightsExpanded(!isWeightsExpanded)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <span
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
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
                            style={{
                              transform: isWeightsExpanded
                                ? 'rotate(90deg)'
                                : 'rotate(0deg)',
                              transition: 'transform 0.2s ease-out',
                              color: isWeightsExpanded
                                ? '#facc15'
                                : 'var(--text-dim)',
                            }}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          개인 분석 가중치 설정 (합계 100%)
                        </span>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                            paddingLeft: '24px',
                          }}
                        >
                          {weightStatus === 'saved' ? (
                            <span style={{ color: 'var(--success)' }}>
                              ● 개인화 가중치 적용됨
                            </span>
                          ) : (
                            <span>기본 가중치 적용 중</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color:
                              currentWeightsSum === 100
                                ? 'var(--success)'
                                : remainingWeight < 0
                                  ? 'var(--error)'
                                  : 'var(--primary-cyan)',
                          }}
                        >
                          합계: {currentWeightsSum}%
                        </span>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color:
                              remainingWeight === 0
                                ? 'var(--success)'
                                : remainingWeight < 0
                                  ? 'var(--error)'
                                  : 'var(--text-muted)',
                            marginTop: '2px',
                          }}
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
                      <div
                        style={{
                          marginTop: '20px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          paddingTop: '20px',
                          animation: 'slideDown 0.25s ease-out',
                        }}
                      >
                        {/* Weights Sliders */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          {weights.map((weight, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: 'var(--text-muted)',
                                  width: '60px',
                                }}
                              >
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
                                style={{
                                  flex: 1,
                                  accentColor:
                                    currentWeightsSum === 100
                                      ? 'var(--success)'
                                      : 'var(--primary-cyan)',
                                  cursor: 'pointer',
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  color: 'var(--text-main)',
                                  width: '35px',
                                  textAlign: 'right',
                                }}
                              >
                                {weight}%
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Save / Reset Actions */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '16px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            paddingTop: '14px',
                          }}
                        >
                          <button
                            type="button"
                            className="btn-neon btn-outline"
                            onClick={handleResetWeights}
                            style={{
                              flex: 1,
                              height: '36px',
                              padding: '0 12px',
                              fontSize: '0.8rem',
                            }}
                          >
                            기본값 재설정
                          </button>
                          <button
                            type="button"
                            className="btn-submit"
                            onClick={handleSaveWeights}
                            disabled={
                              savingWeights || currentWeightsSum !== 100
                            }
                            style={{
                              flex: 2,
                              height: '36px',
                              padding: '0 12px',
                              fontSize: '0.8rem',
                              background:
                                currentWeightsSum !== 100
                                  ? 'var(--bg-input)'
                                  : 'linear-gradient(135deg, var(--primary-purple) 0%, #7c3aed 100%)',
                              color:
                                currentWeightsSum !== 100
                                  ? 'var(--text-dim)'
                                  : 'var(--text-main)',
                              cursor:
                                currentWeightsSum !== 100
                                  ? 'not-allowed'
                                  : 'pointer',
                              boxShadow:
                                currentWeightsSum !== 100
                                  ? 'none'
                                  : '0 4px 15px var(--primary-purple-glow)',
                            }}
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
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        textAlign: 'left',
                        marginBottom: '20px',
                        lineHeight: '1.4',
                      }}
                    >
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
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-dim)',
                      textAlign: 'center',
                      marginBottom: '12px',
                      marginTop: '8px',
                    }}
                  >
                    번호 생성 시{' '}
                    <span
                      style={{
                        color: 'var(--primary-cyan)',
                        fontWeight: 'bold',
                      }}
                    >
                      {complexity} HON
                    </span>
                    이 차감됩니다.
                  </p>
                );
              })()}

              <button
                className="btn-neon btn-cyan"
                onClick={handleGeneratePrediction}
                disabled={generating || algorithmTypes.length === 0}
                style={{ height: '48px' }}
              >
                {generating ? '최적 조합 연산 중...' : '예측번호 생성하기'}
              </button>
            </div>
          )}
        </>
      )}

      {activeSubTab === 'analyze' && (
        <>
          <p
            className="access-desc"
            style={{ fontSize: '0.88rem', marginBottom: '16px' }}
          >
            직접 원하는 예측 번호 조합을 수동으로 입력하여 분석하고 저장할 수
            있습니다. 반자동 기능을 사용하여 일부만 정하고 나머지를 무작위로
            채울 수도 있습니다.
          </p>
          {renderAnalyze()}
        </>
      )}

      {generatedNumbers &&
        createPortal(
          <div
            className="admin-modal-overlay"
            style={{
              overflowY: 'auto',
              padding: '40px 20px',
              alignItems: 'flex-start',
            }}
          >
            <div
              className="glass-card admin-modal-content"
              style={{
                maxWidth: '600px',
                padding: '0',
                textAlign: 'center',
                position: 'relative',
                border: '1px solid rgba(189, 0, 255, 0.25)',
                boxShadow:
                  '0 20px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(189, 0, 255, 0.1)',
                marginTop: 'auto',
                marginBottom: 'auto',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                maxHeight: 'calc(100vh - 80px)',
              }}
            >
              <div
                style={{
                  padding: '32px 32px 0 32px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setGeneratedNumbers(null)}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s ease',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--text-main)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--text-dim)')
                  }
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

                {/* Success Status Icon */}
                <div
                  className="status-icon"
                  style={{
                    background: 'rgba(189, 0, 255, 0.1)',
                    border: '1px solid rgba(189, 0, 255, 0.4)',
                    color: 'var(--primary-purple)',
                    marginBottom: '20px',
                    display: 'inline-flex',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
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

                <h2
                  className="access-title"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: 'var(--text-main)',
                    marginBottom: '8px',
                  }}
                >
                  [
                  {algorithmTypes.find((a) => a.key === generatingAlgo)?.name ||
                    parseAlgorithmName(generatingAlgo)}
                  ] 예측 조합 번호 생성 완료
                </h2>

                <p
                  className="access-desc"
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  알고리즘을 통해 최적의 번호 조합을 추출했습니다.
                </p>

                <div style={{ width: '100%', textAlign: 'left' }}>
                  <LottoAnalysisCard
                    numbers={generatedNumbers}
                    analysis={generatedAnalysis}
                    title="예측 번호 심층 분석"
                  />
                </div>

                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginTop: '20px',
                    marginBottom: '20px',
                    lineHeight: '1.5',
                  }}
                >
                  ※ 생성된 번호 조합은 <strong>[내 당첨이력]</strong> 메뉴에서
                  <br />
                  실제 당첨결과와 대조해 보실 수 있습니다.
                </p>
              </div>

              <div style={{ padding: '0 32px 32px 32px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-submit"
                  style={{
                    width: '100%',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      'linear-gradient(135deg, var(--primary-purple) 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 15px var(--primary-purple-glow)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
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
  const commonBadgeStyle = {
    color: '#cbd5e1',
    bg: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  };

  switch (type) {
    case 'MIN_COUNT':
      return {
        text: '자리별 희소',
        ...commonBadgeStyle,
      };
    case 'TOTAL_MIN_COUNT':
      return {
        text: '누적 희소',
        ...commonBadgeStyle,
      };
    case 'MAX_COUNT':
      return {
        text: '최다 빈출',
        ...commonBadgeStyle,
      };
    default:
      return {
        text: '알고리즘',
        ...commonBadgeStyle,
      };
  }
};

export default Generate;
