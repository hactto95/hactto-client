import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
  API_BASE_URL,
  parseAlgorithmName,
  getAlgorithmDescription,
  getBallStyle,
} from '../../utils';
import { LottoAnalysisCard } from '../../components/LottoAnalysisCard';
import { BallHoverTooltip } from '../../components/BallHoverTooltip';

export function Stats() {
  const { appendAuth, showAlert } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<
    'leaderboard' | 'weekly' | 'champion' | 'detail'
  >('leaderboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [algorithmTypes, setAlgorithmTypes] = useState<any[]>([]);

  // Tab 1: Overview States
  const [leaderboard, setLeaderboard] = useState<
    { algorithm: string; average: number }[]
  >([]);
  const [upcomingCounts, setUpcomingCounts] = useState<
    { algorithm: string; count: number }[]
  >([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Tab 2: Champion States
  const [championData, setChampionData] = useState<{
    prediction: {
      id: number;
      algorithm: string;
      episode: number;
      weights: number[];
      numbers: number[];
      reliabilityScore: number;
    };
    winningNumber: {
      episode: number;
      numbers: number[];
    };
  } | null>(null);
  const [championLoading, setChampionLoading] = useState(false);

  // Tab 3: Detailed Trend States
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<string>('MIN_COUNT');
  const [historyData, setHistoryData] = useState<
    { episode: number; averageScore: number }[]
  >([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    episode: number;
    score: number;
    index: number;
  } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clickedPointData, setClickedPointData] = useState<any | null>(null);
  const [clickedPointLoading, setClickedPointLoading] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const scrollContainer = document.querySelector(
      '.scroll-y-container',
    ) as HTMLElement;
    if (clickedPointLoading || clickedPointData) {
      document.body.style.overflow = 'hidden';
      if (scrollContainer) scrollContainer.style.overflowY = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (scrollContainer) scrollContainer.style.overflowY = 'auto';
    }
    return () => {
      document.body.style.overflow = '';
      if (scrollContainer) scrollContainer.style.overflowY = 'auto';
    };
  }, [clickedPointLoading, clickedPointData]);

  const handlePointClick = async (episode: number, algorithm: string) => {
    setClickedPointLoading(true);
    setClickedPointData(null);
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/Analysis/best?episode=${episode}&algorithm=${algorithm}`,
        ),
      );
      if (res.ok) {
        const d = await res.json();
        console.log('Stats point click data loaded:', d.data || d);
        setClickedPointData(d.data || d);
      }
    } catch (err) {
      console.error('Failed to fetch clicked episode best prediction', err);
      showAlert(
        'error',
        '해당 회차 최고 분석 점수 조합 정보를 불러오지 못했습니다.',
      );
    } finally {
      setClickedPointLoading(false);
    }
  };

  // Reset clicked details when algorithm or sub-tab changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClickedPointData(null);
  }, [activeSubTab, selectedAlgorithm]);

  // Mount logic to load overview data
  useEffect(() => {
    const fetchOverviewData = async () => {
      setOverviewLoading(true);
      try {
        const algoRes = await fetch(appendAuth(`${API_BASE_URL}/algorithms`));
        if (algoRes.ok) {
          const d = await algoRes.json();
          setAlgorithmTypes(d.data || d);
        }

        const avgRes = await fetch(
          appendAuth(`${API_BASE_URL}/Analysis/averages`),
        );
        let leaderboardData = [];
        if (avgRes.ok) {
          const d = await avgRes.json();
          leaderboardData = d.data || d;
        }

        const countRes = await fetch(
          appendAuth(`${API_BASE_URL}/Analysis/upcoming-counts`),
        );
        let upcomingData = [];
        if (countRes.ok) {
          const d = await countRes.json();
          upcomingData = d.data || d;
        }

        setLeaderboard(leaderboardData);
        setUpcomingCounts(upcomingData);

        // Auto-set the initial selected algorithm for Detailed Analysis
        if (leaderboardData.length > 0) {
          setSelectedAlgorithm(leaderboardData[0].algorithm);
        }
      } catch (err) {
        console.error('Overview data fetch failed', err);
        showAlert('error', '통계 데이터를 불러오지 못했습니다.');
      } finally {
        setOverviewLoading(false);
      }
    };

    fetchOverviewData();
  }, [appendAuth, showAlert]);

  // Handle Tab Switch & Selected Algorithm Change
  useEffect(() => {
    const fetchChampionData = async () => {
      setChampionLoading(true);
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/Analysis/latest-best`),
        );
        if (res.ok) {
          const d = await res.json();
          setChampionData(d.data ?? null);
        }
      } catch (err) {
        console.error('Champion data fetch failed', err);
        showAlert('error', '최고 분석 점수 데이터를 불러오지 못했습니다.');
      } finally {
        setChampionLoading(false);
      }
    };

    const fetchHistoryData = async (algo: string) => {
      setDetailLoading(true);
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/Analysis/history?algorithm=${algo}`),
        );
        if (res.ok) {
          const d = await res.json();
          setHistoryData(d.data || d);
        }
      } catch (err) {
        console.error('History data fetch failed', err);
        showAlert('error', '알고리즘 히스토리 데이터를 불러오지 못했습니다.');
      } finally {
        setDetailLoading(false);
      }
    };

    if (activeSubTab === 'champion' && !championData) {
      fetchChampionData();
    } else if (activeSubTab === 'detail') {
      fetchHistoryData(selectedAlgorithm);
    }
  }, [activeSubTab, selectedAlgorithm, championData, appendAuth, showAlert]);

  // Rank badge mapping helper for Leaderboard
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return {
          text: '1ST',
          badgeClass:
            'text-amber-600 dark:text-[#ffd700] bg-[#ffd700]/15 border border-[#ffd700]/30',
          scoreClass: 'text-amber-600 dark:text-[#ffd700]',
          barClass:
            'bg-linear-to-r from-surface to-[#ffd700] shadow-[0_0_8px_#ffd700]',
        };
      case 1:
        return {
          text: '2ND',
          badgeClass:
            'text-slate-600 dark:text-[#c0c0c0] bg-[#c0c0c0]/15 border border-[#c0c0c0]/30',
          scoreClass: 'text-slate-600 dark:text-[#c0c0c0]',
          barClass:
            'bg-linear-to-r from-surface to-[#c0c0c0] shadow-[0_0_8px_#c0c0c0]',
        };
      case 2:
        return {
          text: '3RD',
          badgeClass:
            'text-amber-700 dark:text-[#cd7f32] bg-[#cd7f32]/15 border border-[#cd7f32]/30',
          scoreClass: 'text-amber-700 dark:text-[#cd7f32]',
          barClass:
            'bg-linear-to-r from-surface to-[#cd7f32] shadow-[0_0_8px_#cd7f32]',
        };
      default:
        return {
          text: `${index + 1}TH`,
          badgeClass: 'text-muted bg-surface-hover border border-glass-border',
          scoreClass: 'text-muted',
          barClass: 'bg-linear-to-r from-surface to-muted shadow-none',
        };
    }
  };

  // Render sub-tabs navigation
  const renderSubTabs = () => {
    const tabs = [
      { id: 'leaderboard', label: '평균 분석 점수 순위' },
      { id: 'weekly', label: '금주 생성 분포' },
      { id: 'champion', label: '최고 분석 점수 조합' },
      { id: 'detail', label: '상세 분석' },
    ] as const;

    return (
      <div className="stats-sub-tabs inline-flex bg-surface border border-glass-border p-1 rounded-xl mb-6 gap-1 flex-wrap">
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
    );
  };

  // Render Leaderboard (평균 분석 점수 순위)
  const renderLeaderboard = () => {
    if (overviewLoading) {
      return <p className="text-dim py-5">통계 데이터를 불러오는 중...</p>;
    }

    return (
      <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">
        {/* Top 5 Leaderboard */}
        <div>
          <div className="flex flex-col gap-3">
            {leaderboard.length === 0 ? (
              <p className="text-dim text-[0.85rem]">
                분석 가능한 알고리즘 결과가 없습니다.
              </p>
            ) : (
              leaderboard.map((item, index) => {
                const badge = getRankBadge(index);
                return (
                  <div
                    key={item.algorithm}
                    className="bento-card bento-card-interactive px-5 py-4 cursor-pointer"
                    onClick={() => {
                      setSelectedAlgorithm(item.algorithm);
                      setActiveSubTab('detail');
                    }}
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[0.7rem] max-[480px]:text-[0.62rem] font-extrabold px-1.5 py-0.5 rounded font-mono ${badge.badgeClass}`}
                        >
                          {badge.text}
                        </span>
                        <span className="font-bold text-main text-[0.95rem]">
                          {parseAlgorithmName(
                            algorithmTypes.find(
                              (a) => a.type === item.algorithm,
                            ) || item.algorithm,
                          )}
                        </span>
                      </div>
                      <span
                        className={`font-bold text-base font-mono ${badge.scoreClass}`}
                      >
                        {item.average.toFixed(2)} %
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-surface-hover rounded-[3px] overflow-hidden">
                      <div
                        className={`h-full rounded-[3px] ${badge.barClass}`}
                        style={{ width: `${item.average}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Weekly (금주 생성 분포)
  const renderWeekly = () => {
    if (overviewLoading) {
      return <p className="text-dim py-5">통계 데이터를 불러오는 중...</p>;
    }

    const totalUpcomingGenerated = upcomingCounts.reduce(
      (acc, c) => acc + c.count,
      0,
    );
    const maxUpcomingCount = Math.max(...upcomingCounts.map((c) => c.count), 1);

    return (
      <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">
        {/* Weekly Activity Counts Chart */}
        <div className="bento-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[1.05rem] font-semibold text-main flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary-cyan"
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              금주 알고리즘 생성 횟수 분포
            </h3>
            <span className="text-xs bg-primary-purple/10 text-primary-purple px-2 py-0.5 rounded border border-primary-purple/20">
              총 {totalUpcomingGenerated}회 생성됨
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {[...upcomingCounts]
              .sort((a, b) => b.count - a.count)
              .map((c, index, sortedArr) => {
                const percentage = (c.count / maxUpcomingCount) * 100;
                const opacity =
                  sortedArr.length > 1
                    ? 1 - (index / (sortedArr.length - 1)) * 0.6
                    : 1.0;
                return (
                  <div key={c.algorithm} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[0.8rem]">
                      <span className="text-main font-medium">
                        {parseAlgorithmName(
                          algorithmTypes.find((a) => a.type === c.algorithm) ||
                            c.algorithm,
                        )}
                      </span>
                      <span
                        className="font-bold text-main transition-opacity duration-200"
                        style={{ opacity }}
                      >
                        {c.count}회
                      </span>
                    </div>
                    <div
                      className="w-full h-3.5 bg-surface-hover rounded overflow-hidden flex transition-opacity duration-200"
                      style={{ opacity }}
                    >
                      <div
                        className="h-full bg-linear-to-r from-primary-cyan/20 to-primary-purple rounded shadow-[0_0_8px_var(--primary-purple-glow)] transition-[width] duration-800 ease-in-out"
                        style={{
                          width: `${Math.max(percentage, c.count > 0 ? 5 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  // Tab 2: Render Champion Prediction Combo (최고 분석 점수)
  const renderChampion = () => {
    if (championLoading) {
      return (
        <p className="text-dim py-5">
          최고 분석 점수 번호 분석을 불러오는 중...
        </p>
      );
    }
    if (!championData) {
      return (
        <div className="text-center py-10 px-5 text-dim animate-[fadeIn_0.3s_ease-out]">
          <p className="mb-3">
            최근 회차의 데이터 분석 결과가 조회되지 않습니다.
          </p>
          <button
            className="btn-neon btn-outline w-auto! inline-flex! px-4! py-2!"
            onClick={() => setChampionData(null)}
          >
            새로고침
          </button>
        </div>
      );
    }

    const { prediction, winningNumber } = championData;
    const algoType =
      typeof prediction.algorithm === 'object' && prediction.algorithm !== null
        ? (prediction.algorithm as { type: string }).type
        : prediction.algorithm;
    const mainNumbers = winningNumber?.numbers?.slice(0, 6) ?? [];
    const bonusNumber = winningNumber?.numbers?.[6];

    const isMatched = (num: number) => mainNumbers.includes(num);
    const isBonusMatched = (num: number) =>
      bonusNumber !== undefined && bonusNumber === num;

    return (
      <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
        <div className="stats-card champ-card bg-linear-to-br from-primary-cyan/[0.04] to-primary-purple/[0.04] border border-primary-cyan/20 p-6 rounded-[20px] shadow-glass">
          {/* Header Info */}
          <div className="flex justify-between items-start mb-5 border-b border-glass-border pb-4">
            <div>
              <span className="text-xs bg-primary-cyan/15 text-primary-cyan px-2 py-0.5 rounded border border-primary-cyan/25 font-bold">
                CHAMPION COMBO
              </span>
              <h3 className="text-[1.2rem] max-[480px]:text-[1.05rem] font-bold text-main mt-2">
                {winningNumber?.episode ?? prediction?.episode}회차 최고 분석
                점수 예측
              </h3>
            </div>
            <div className="text-right">
              <div className="text-[1.6rem] max-[480px]:text-[1.35rem] font-extrabold text-primary-cyan font-mono drop-shadow-[0_0_10px_var(--primary-cyan-glow)]">
                {prediction.reliabilityScore.toFixed(2)}%
              </div>
              <span className="text-[0.72rem] text-muted">분석 스코어</span>
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="text-[0.85rem] text-muted mb-6 flex justify-between bg-surface px-3.5 py-2.5 rounded-lg">
            <span>적용 알고리즘</span>
            <span className="text-main font-bold">
              {parseAlgorithmName(
                algorithmTypes.find((a) => a.type === algoType) || algoType,
              )}
            </span>
          </div>

          {/* 적용 알고리즘 설명 박스 */}
          {(() => {
            const algoObj = algorithmTypes.find((a) => a.type === algoType);
            const desc = getAlgorithmDescription(algoObj || algoType);
            if (!desc) return null;
            return (
              <div className="text-[0.78rem] text-muted bg-surface border border-dashed border-glass-border px-3.5 py-3 rounded-lg mb-6 text-left leading-[1.4]">
                💡 <strong>알고리즘 설명:</strong> {desc}
              </div>
            );
          })()}

          {/* Prediction Numbers (Lotto Balls) */}
          <div className="mb-6 text-left">
            <div className="text-[0.8rem] text-dim mb-2 font-semibold">
              생성된 예측번호
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {prediction.numbers.slice(0, 6).map((num, i) => {
                const matched = isMatched(num);
                const bonusMatched = isBonusMatched(num);

                return (
                  <BallHoverTooltip key={i} ball={num}>
                    <div
                      className={`lotto-ball relative ${
                        matched
                          ? 'border-2! border-emerald-500! shadow-[0_0_15px_rgba(16,185,129,0.6)]!'
                          : bonusMatched
                            ? 'border-2! border-purple-400! shadow-[0_0_15px_rgba(192,132,252,0.6)]!'
                            : 'border border-white/15'
                      }`}
                      style={getBallStyle(num)}
                    >
                      {num}
                      {(matched || bonusMatched) && (
                        <div
                          className={`absolute -top-1 -right-1 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold ${
                            matched ? 'bg-emerald-500' : 'bg-purple-400'
                          }`}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  </BallHoverTooltip>
                );
              })}
            </div>
          </div>

          {/* Actual Winning Numbers */}
          <div className="mb-6 text-left bg-surface border border-dashed border-glass-border p-4 rounded-xl">
            <div className="text-[0.8rem] text-dim mb-2 font-semibold">
              실제 발표 당첨번호
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {winningNumber?.numbers ? (
                <>
                  {winningNumber.numbers.slice(0, 6).map((num, i) => (
                    <BallHoverTooltip key={i} ball={num}>
                      <div
                        className="lotto-ball opacity-85"
                        style={getBallStyle(num)}
                      >
                        {num}
                      </div>
                    </BallHoverTooltip>
                  ))}
                  <div className="text-[1.1rem] font-bold text-muted px-0.5">
                    +
                  </div>
                  <BallHoverTooltip ball={winningNumber.numbers[6] ?? 0}>
                    <div
                      className="lotto-ball opacity-85"
                      style={getBallStyle(winningNumber.numbers[6] ?? 0)}
                    >
                      {winningNumber.numbers[6] ?? 0}
                    </div>
                  </BallHoverTooltip>
                </>
              ) : (
                <div className="text-muted text-[0.85rem] py-1">
                  당첨번호가 아직 발표되지 않았습니다.
                </div>
              )}
            </div>
          </div>

          {/* Prediction Weights Breakdown */}
          {algoType.includes('WEIGHTS') && (
            <div className="text-left">
              <div className="text-[0.8rem] text-dim mb-2 font-semibold">
                설정된 가중치 조합
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const weights = (prediction.weights || []).slice(0, 6);
                  const maxWeight = Math.max(...weights, 1);
                  const items = weights.map((w, idx) => ({
                    val: w,
                    label: `${idx + 1}구`,
                  }));
                  const sorted = [...items].sort((a, b) => b.val - a.val);

                  return sorted.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-surface px-2.5 py-2 rounded-md border border-glass-border text-xs flex justify-between"
                    >
                      <span className="text-muted font-mono">{item.label}</span>
                      <span
                        className="text-primary-purple font-bold"
                        style={{
                          opacity: 0.35 + (item.val / maxWeight) * 0.65,
                        }}
                      >
                        {item.val}%
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Tab 3: Render Detailed Trend (에피소드별 분석 점수)
  const renderDetail = () => {
    if (detailLoading) {
      return <p className="text-dim py-5">상세 통계 추이를 집계하는 중...</p>;
    }

    const getGroupKey = (type: string) => {
      const parts = type.split('_');
      return parts[parts.length - 1]; // 마지막 단어 (WEIGHTS, FREQUENCY 등)
    };

    const groupedLeaderboard: Record<string, typeof leaderboard> = {};
    leaderboard.forEach((item) => {
      const groupKey = getGroupKey(item.algorithm);
      if (!groupedLeaderboard[groupKey]) {
        groupedLeaderboard[groupKey] = [];
      }
      groupedLeaderboard[groupKey].push(item);
    });

    const hasHistory = historyData.length > 0;
    const scores = historyData.map((h) => h.averageScore);
    const minScore = hasHistory ? Math.max(0, Math.min(...scores) - 5) : 0;
    const maxScore = hasHistory ? Math.min(100, Math.max(...scores) + 5) : 100;
    const finalMin =
      minScore === maxScore ? Math.max(0, minScore - 10) : minScore;
    const finalMax =
      minScore === maxScore ? Math.min(100, maxScore + 10) : maxScore;

    // SVG Layout Configuration
    const svgWidth = 520;
    const svgHeight = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    // Map database points to SVG points
    const points = historyData.map((item, idx) => {
      const x = paddingLeft + (idx / (historyData.length - 1)) * plotWidth;
      const range = finalMax - finalMin;
      const ratio = range === 0 ? 0.5 : (item.averageScore - finalMin) / range;
      const y = svgHeight - paddingBottom - ratio * plotHeight;
      return {
        x,
        y,
        episode: item.episode,
        score: item.averageScore,
        index: idx,
      };
    });

    // Calculate dynamically to prevent tooltip overflow/horizontal scrollbar
    const tooltipTranslateX = hoveredPoint
      ? hoveredPoint.index === 0
        ? '0%'
        : hoveredPoint.index === points.length - 1
          ? '-100%'
          : '-50%'
      : '-50%';

    // Create Path String for the line
    const linePath = points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Create Area Path String under the line
    const areaPath = hasHistory
      ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
      : '';

    // Stats calculations
    const peakScore = hasHistory ? Math.max(...scores) : 0;
    const lowestScore = hasHistory ? Math.min(...scores) : 0;
    const avgScore = hasHistory
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const getReliabilityColor = (score: number) => {
      if (peakScore === lowestScore) return '#00f0ff';
      const p = (score - lowestScore) / (peakScore - lowestScore);
      let r, g, b;
      if (p < 0.5) {
        const t = p / 0.5;
        r = Math.round(239 + t * (0 - 239));
        g = Math.round(68 + t * (240 - 68));
        b = Math.round(68 + t * (255 - 68));
      } else {
        const t = (p - 0.5) / 0.5;
        r = Math.round(0 + t * (16 - 0));
        g = Math.round(240 + t * (185 - 240));
        b = Math.round(255 + t * (129 - 255));
      }
      return `rgb(${r}, ${g}, ${b})`;
    };

    return (
      <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">
        {/* Selector Dropdown */}
        <div className="stats-selector-container flex justify-between items-center">
          <span className="text-[0.9rem] text-main font-bold">
            상세 분석 알고리즘 선택
          </span>
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            className="bg-modal border border-glass-border px-3 py-2 rounded-lg text-main font-sans outline-none cursor-pointer"
          >
            {Object.entries(groupedLeaderboard).map(([groupName, items]) => (
              <optgroup
                key={groupName}
                label={
                  groupName === 'WEIGHTS'
                    ? '가중치 분석형'
                    : groupName === 'FREQUENCY'
                      ? '빈도 분석형'
                      : '균형 분석형'
                }
              >
                {items.map((item) => (
                  <option key={item.algorithm} value={item.algorithm}>
                    {parseAlgorithmName(
                      algorithmTypes.find((a) => a.type === item.algorithm) ||
                        item.algorithm,
                    )}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Custom SVG Line Chart Container */}
        <div className="bento-card p-6 relative">
          <div className="text-left mb-3.5">
            <span className="text-[0.78rem] text-dim uppercase tracking-[0.05em]">
              RELIABILITY TREND (LAST 20 ROUNDS)
            </span>
            <h4 className="text-base font-bold text-main">
              회차별 분석 점수 변동 추이
            </h4>
          </div>

          {!hasHistory ? (
            <div className="h-[220px] flex items-center justify-center text-dim text-[0.85rem]">
              해당 알고리즘에 대한 과거 분석 결과 데이터가 존재하지 않습니다.
            </div>
          ) : (
            <div className="relative">
              <svg
                width="100%"
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="overflow-visible"
              >
                <defs>
                  {/* Gradient for area fill under line */}
                  <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary-cyan)"
                      stopOpacity="0.15"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary-cyan)"
                      stopOpacity="0.0"
                    />
                  </linearGradient>

                  {/* Filter for glowing line effect */}
                  <filter
                    id="glow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>

                {/* Grid Lines & Y-axis ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                  const y = svgHeight - paddingBottom - val * plotHeight;
                  const scoreLabel = Math.round(
                    finalMin + val * (finalMax - finalMin),
                  );
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="var(--border-glass-color)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        fill={getReliabilityColor(scoreLabel)}
                        fontSize="9px"
                        fontFamily="monospace"
                        textAnchor="end"
                        className="font-semibold"
                      >
                        {scoreLabel}%
                      </text>
                    </g>
                  );
                })}

                {/* X-axis ticks (episodes) */}
                {points.map((p, idx) => {
                  // Only display label for first, last, and every 4th node to avoid overlap
                  const showLabel =
                    idx === 0 || idx === points.length - 1 || idx % 4 === 0;
                  if (!showLabel) return null;

                  return (
                    <g key={idx}>
                      <line
                        x1={p.x}
                        y1={svgHeight - paddingBottom}
                        x2={p.x}
                        y2={svgHeight - paddingBottom + 5}
                        stroke="var(--border-glass-strong)"
                      />
                      <text
                        x={p.x}
                        y={svgHeight - paddingBottom + 18}
                        fill="var(--text-dim)"
                        fontSize="9px"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {p.episode}
                      </text>
                    </g>
                  );
                })}

                {/* Area under the line */}
                <path d={areaPath} fill="url(#area-grad)" />

                {/* Core Line Plot */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--primary-cyan)"
                  strokeWidth="2.5"
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--primary-cyan)"
                  strokeWidth="5"
                  filter="url(#glow)"
                  opacity="0.4"
                />

                {/* Interactive Data Nodes */}
                {points.map((p, idx) => {
                  const isHovered = hoveredPoint?.index === idx;
                  return (
                    <g key={idx}>
                      {/* Visual Dot */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? '6' : '3.5'}
                        fill={
                          isHovered
                            ? 'var(--bg-elevated)'
                            : 'var(--primary-cyan)'
                        }
                        stroke={
                          isHovered
                            ? getReliabilityColor(p.score)
                            : 'var(--bg-dark)'
                        }
                        strokeWidth={isHovered ? '3' : '1.5'}
                        className="transition-[r,stroke-width] duration-150 ease-in-out"
                      />

                      {/* Invisible Hover Area (larger hitbox) */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="16"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() =>
                          handlePointClick(p.episode, selectedAlgorithm)
                        }
                      />
                    </g>
                  );
                })}
              </svg>

              {/* HTML Absolute Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute bg-modal backdrop-blur-md px-3 py-1.5 rounded-lg pointer-events-none z-[2] text-[0.78rem] text-center whitespace-nowrap"
                  style={{
                    left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                    top: `${hoveredPoint.y - 48}px`,
                    transform: `translateX(${tooltipTranslateX})`,
                    border: `1px solid ${getReliabilityColor(hoveredPoint.score)}`,
                    boxShadow: `0 5px 15px rgba(0, 0, 0, 0.25), 0 0 10px ${getReliabilityColor(hoveredPoint.score)}55`,
                  }}
                >
                  <div className="text-muted text-[0.68rem]">
                    {hoveredPoint.episode}회차
                  </div>
                  <div className="font-bold text-main">
                    분석 점수:{' '}
                    <span
                      className="font-mono font-bold"
                      style={{
                        color: getReliabilityColor(hoveredPoint.score),
                      }}
                    >
                      {hoveredPoint.score.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* KPI Summaries */}
        <div className="stats-kpi-container grid grid-cols-3 gap-2.5">
          <div className="bg-surface border border-glass-border py-3 px-2 rounded-xl text-center">
            <div className="kpi-label text-[0.72rem] text-dim mb-1">
              최고 분석 점수 (PEAK)
            </div>
            <div className="kpi-value text-[1.1rem] font-extrabold text-success">
              {peakScore.toFixed(1)}%
            </div>
          </div>
          <div className="bg-surface border border-glass-border py-3 px-2 rounded-xl text-center">
            <div className="kpi-label text-[0.72rem] text-dim mb-1">
              평균 분석 점수 (AVG)
            </div>
            <div className="kpi-value text-[1.1rem] font-extrabold text-primary-cyan">
              {avgScore.toFixed(1)}%
            </div>
          </div>
          <div className="bg-surface border border-glass-border py-3 px-2 rounded-xl text-center">
            <div className="kpi-label text-[0.72rem] text-dim mb-1">
              최저 분석 점수 (LOW)
            </div>
            <div className="kpi-value text-[1.1rem] font-extrabold text-error">
              {lowestScore.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Description Info */}
        <div className="bg-surface border border-glass-border p-4 rounded-xl text-[0.82rem] text-muted leading-[1.5] text-left">
          💡 <strong>분석 점수(Analysis Score)란?</strong>
          <div className="mt-1">
            각 회차별로 실제 발표된 당첨 번호 분포와 해당 알고리즘의 예측 번호가
            수학적으로 얼마나 근사했는지를 나타내는 점수입니다. 100%에
            가까울수록 실제 당첨 분포와 높은 연관성을 가짐을 의미합니다.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-main tracking-tight m-0">
          알고리즘 분석 통계 대시보드
        </h1>
        <p className="text-sm text-dim mt-1.5 m-0">
          당첨 데이터 분포 시뮬레이션 분석 정보 및 다가오는 회차의 생성 통계를
          제공합니다.
        </p>
      </div>

      {/* Sub tabs navigation */}
      {renderSubTabs()}

      {/* Selected Tab rendering */}
      {activeSubTab === 'leaderboard' && renderLeaderboard()}
      {activeSubTab === 'weekly' && renderWeekly()}
      {activeSubTab === 'champion' && renderChampion()}
      {activeSubTab === 'detail' && renderDetail()}

      {/* Modal Popup */}
      {(clickedPointLoading || clickedPointData) &&
        createPortal(
          <div
            onClick={() => {
              setClickedPointData(null);
              setClickedPointLoading(false);
            }}
            className="fixed top-0 left-0 w-screen h-screen bg-overlay backdrop-blur-md grid place-items-center z-[9999] py-10 px-5 box-border animate-[backdropFadeIn_0.3s_ease-out_forwards] overflow-y-auto"
          >
            <style>{`
            @keyframes modalFadeIn {
              from {
                opacity: 0;
                transform: scale(0.95) translateY(10px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes backdropFadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes spinner {
              to { transform: rotate(360deg); }
            }
          `}</style>
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-modal backdrop-blur-xl border border-primary-purple/25 shadow-glass rounded-3xl py-7 px-6 w-full max-w-[600px] relative animate-[modalFadeIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards] box-border text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setClickedPointData(null);
                  setClickedPointLoading(false);
                }}
                className="absolute top-5 right-5 bg-surface hover:bg-surface-hover border border-glass-border rounded-full w-8 h-8 flex items-center justify-center text-muted hover:text-main hover:rotate-90 cursor-pointer text-base leading-none transition-all duration-200"
              >
                ✕
              </button>

              {clickedPointLoading && (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="w-10 h-10 border-[3px] border-primary-purple/10 border-t-primary-purple rounded-full animate-[spinner_0.8s_linear_infinite] mb-4" />
                  <p className="text-dim text-[0.9rem]">
                    최고 분석 점수 데이터를 불러오는 중...
                  </p>
                </div>
              )}

              {!clickedPointLoading &&
                clickedPointData &&
                (() => {
                  const prediction = clickedPointData.prediction;
                  const winningNumber = clickedPointData.winningNumber;
                  const algoType =
                    prediction &&
                    typeof prediction.algorithm === 'object' &&
                    prediction.algorithm !== null
                      ? (prediction.algorithm as { type: string }).type
                      : prediction
                        ? prediction.algorithm
                        : '';

                  if (!prediction) {
                    return (
                      <div className="text-main py-5 px-2.5 text-center">
                        <p className="font-bold mb-3 text-[1.1rem]">
                          ⚠️ 상세 정보가 없습니다.
                        </p>
                        <p className="text-[0.82rem] text-muted mb-4">
                          데이터를 정상적으로 처리하지 못했습니다.
                        </p>
                        <pre className="text-xs text-left overflow-auto bg-surface p-3 rounded-lg border border-glass-border text-muted max-h-[150px]">
                          {JSON.stringify(clickedPointData, null, 2)}
                        </pre>
                      </div>
                    );
                  }

                  const predictionNumbers = Array.isArray(prediction.numbers)
                    ? prediction.numbers
                    : [];
                  const winningNumbers =
                    winningNumber && Array.isArray(winningNumber.numbers)
                      ? winningNumber.numbers
                      : [];
                  const mainNumbers = winningNumbers.slice(0, 6);
                  const bonusNumber = winningNumbers[6];

                  const isMatched = (num: number) => mainNumbers.includes(num);
                  const isBonusMatched = (num: number) =>
                    bonusNumber !== undefined && bonusNumber === num;

                  return (
                    <div className="text-main">
                      {/* Title / Header */}
                      <div className="flex justify-between items-start mb-5 border-b border-glass-border pb-4 pr-9">
                        <div>
                          <span className="text-xs bg-primary-purple/15 text-primary-purple px-2 py-0.5 rounded border border-primary-purple/25 font-bold">
                            EPISODE DETAIL
                          </span>
                          <h3 className="text-[1.15rem] font-bold text-main mt-2">
                            {prediction.episode}회차 최고 분석 점수 예측
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-extrabold text-primary-purple font-mono drop-shadow-[0_0_10px_var(--primary-purple-glow)]">
                            {typeof prediction.reliabilityScore === 'number'
                              ? prediction.reliabilityScore.toFixed(2)
                              : '0.00'}
                            %
                          </div>
                          <span className="text-[0.7rem] text-muted">
                            분석 스코어
                          </span>
                        </div>
                      </div>

                      {/* Generated prediction numbers */}
                      <div className="mb-5">
                        <div className="text-[0.8rem] text-muted mb-2 font-semibold">
                          생성된 예측번호
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                          {predictionNumbers
                            .slice(0, 6)
                            .map((num: number, i: number) => {
                              const matched = isMatched(num);
                              const bonusMatched = isBonusMatched(num);

                              return (
                                <BallHoverTooltip key={i} ball={num}>
                                  <div
                                    className={`lotto-ball relative w-9! h-9! text-[0.95rem]! ${
                                      matched
                                        ? 'border-2! border-emerald-500! shadow-[0_0_15px_rgba(16,185,129,0.6)]!'
                                        : bonusMatched
                                          ? 'border-2! border-purple-400! shadow-[0_0_15px_rgba(192,132,252,0.6)]!'
                                          : 'border border-white/15'
                                    }`}
                                    style={getBallStyle(num)}
                                  >
                                    {num}
                                    {(matched || bonusMatched) && (
                                      <div
                                        className={`absolute -top-1 -right-1 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold ${
                                          matched
                                            ? 'bg-emerald-500'
                                            : 'bg-purple-400'
                                        }`}
                                      >
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                </BallHoverTooltip>
                              );
                            })}
                        </div>
                      </div>

                      {/* Actual Winning Numbers */}
                      {winningNumber && winningNumbers.length > 0 && (
                        <div className="mb-5 bg-surface border border-dashed border-glass-border py-3.5 px-4 rounded-xl">
                          <div className="text-[0.8rem] text-muted mb-2 font-semibold">
                            실제 발표 당첨번호
                          </div>
                          <div className="flex gap-2 flex-wrap items-center">
                            {winningNumbers
                              .slice(0, 6)
                              .map((num: number, i: number) => (
                                <BallHoverTooltip key={i} ball={num}>
                                  <div
                                    className="lotto-ball w-9! h-9! text-[0.95rem]! opacity-85"
                                    style={getBallStyle(num)}
                                  >
                                    {num}
                                  </div>
                                </BallHoverTooltip>
                              ))}
                            <div className="text-[1.1rem] font-bold text-dim px-0.5">
                              +
                            </div>
                            <BallHoverTooltip ball={winningNumbers[6] ?? 0}>
                              <div
                                className="lotto-ball w-9! h-9! text-[0.95rem]! opacity-85"
                                style={getBallStyle(winningNumbers[6] ?? 0)}
                              >
                                {winningNumbers[6] ?? 0}
                              </div>
                            </BallHoverTooltip>
                          </div>
                        </div>
                      )}

                      {prediction.analysis && (
                        <div className="mb-5">
                          <LottoAnalysisCard
                            numbers={predictionNumbers}
                            analysis={prediction.analysis}
                            title="예측 번호 심층 분석"
                          />
                        </div>
                      )}

                      {/* Weights breakdown */}
                      {algoType.includes('WEIGHTS') && (
                        <div>
                          <div className="text-[0.8rem] text-muted mb-2 font-semibold">
                            설정된 가중치 조합
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(() => {
                              const weights = Array.isArray(prediction.weights)
                                ? prediction.weights.slice(0, 6)
                                : [];
                              const maxWeight = Math.max(...weights, 1);
                              const items = weights.map(
                                (w: number, idx: number) => ({
                                  val: w,
                                  label: `${idx + 1}구`,
                                }),
                              );
                              const sorted = [...items].sort(
                                (a, b) => b.val - a.val,
                              );

                              return sorted.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-surface px-2.5 py-2 rounded-md border border-glass-border text-[0.72rem] flex justify-between"
                                >
                                  <span className="text-muted font-mono">
                                    {item.label}
                                  </span>
                                  <span
                                    className="text-primary-purple font-bold"
                                    style={{
                                      opacity:
                                        0.35 + (item.val / maxWeight) * 0.65,
                                    }}
                                  >
                                    {item.val}%
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default Stats;
