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
          color: '#ffd700',
          bg: 'rgba(255, 215, 0, 0.15)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        };
      case 1:
        return {
          text: '2ND',
          color: '#c0c0c0',
          bg: 'rgba(192, 192, 192, 0.15)',
          border: '1px solid rgba(192, 192, 192, 0.3)',
        };
      case 2:
        return {
          text: '3RD',
          color: '#cd7f32',
          bg: 'rgba(205, 127, 50, 0.15)',
          border: '1px solid rgba(205, 127, 50, 0.3)',
        };
      default:
        return {
          text: `${index + 1}TH`,
          color: 'var(--text-muted)',
          bg: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
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
      <div
        className="stats-sub-tabs"
        style={{
          display: 'inline-flex',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '24px',
          gap: '2px',
          flexWrap: 'wrap',
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
                if (!isActive) e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.color = 'var(--text-muted)';
              }}
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
      return (
        <p style={{ color: 'var(--text-dim)', padding: '20px 0' }}>
          통계 데이터를 불러오는 중...
        </p>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Top 5 Leaderboard */}
        <div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {leaderboard.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                분석 가능한 알고리즘 결과가 없습니다.
              </p>
            ) : (
              leaderboard.map((item, index) => {
                const badge = getRankBadge(index);
                return (
                  <div
                    key={item.algorithm}
                    className="stats-card click-card"
                    onClick={() => {
                      setSelectedAlgorithm(item.algorithm);
                      setActiveSubTab('detail');
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor =
                        'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: badge.color,
                            background: badge.bg,
                            border: badge.border,
                            fontFamily: 'monospace',
                          }}
                        >
                          {badge.text}
                        </span>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                          }}
                        >
                          {parseAlgorithmName(
                            algorithmTypes.find(
                              (a) => a.type === item.algorithm,
                            ) || item.algorithm,
                          )}
                        </span>
                      </div>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: index < 3 ? badge.color : 'var(--text-muted)',
                          fontSize: '1rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.average.toFixed(2)} %
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${item.average}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, ${index < 3 ? badge.color : 'var(--text-muted)'} 100%)`,
                          borderRadius: '3px',
                          boxShadow:
                            index < 3 ? `0 0 8px ${badge.color}` : 'none',
                        }}
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
      return (
        <p style={{ color: 'var(--text-dim)', padding: '20px 0' }}>
          통계 데이터를 불러오는 중...
        </p>
      );
    }

    const totalUpcomingGenerated = upcomingCounts.reduce(
      (acc, c) => acc + c.count,
      0,
    );
    const maxUpcomingCount = Math.max(...upcomingCounts.map((c) => c.count), 1);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Weekly Activity Counts Chart */}
        <div
          className="stats-card"
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: 'var(--border-glass)',
            padding: '20px',
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
                style={{ color: 'var(--primary-cyan)' }}
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              금주 알고리즘 생성 횟수 분포
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                background: 'rgba(189, 0, 255, 0.1)',
                color: 'var(--primary-purple)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(189, 0, 255, 0.2)',
              }}
            >
              총 {totalUpcomingGenerated}회 생성됨
            </span>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {[...upcomingCounts]
              .sort((a, b) => b.count - a.count)
              .map((c, index, sortedArr) => {
                const percentage = (c.count / maxUpcomingCount) * 100;
                const opacity =
                  sortedArr.length > 1
                    ? 1 - (index / (sortedArr.length - 1)) * 0.6
                    : 1.0;
                return (
                  <div
                    key={c.algorithm}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span
                        style={{ color: 'var(--text-main)', fontWeight: 500 }}
                      >
                        {parseAlgorithmName(
                          algorithmTypes.find((a) => a.type === c.algorithm) ||
                            c.algorithm,
                        )}
                      </span>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: 'var(--text-main)',
                          opacity: opacity,
                          transition: 'opacity 0.2s ease',
                        }}
                      >
                        {c.count}회
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        display: 'flex',
                        opacity: opacity,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(percentage, c.count > 0 ? 5 : 0)}%`,
                          height: '100%',
                          background:
                            'linear-gradient(90deg, rgba(0, 240, 255, 0.2) 0%, var(--primary-purple) 100%)',
                          borderRadius: '4px',
                          boxShadow: '0 0 8px rgba(189, 0, 255, 0.25)',
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
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
        <p style={{ color: 'var(--text-dim)', padding: '20px 0' }}>
          최고 분석 점수 번호 분석을 불러오는 중...
        </p>
      );
    }
    if (!championData) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-dim)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <p style={{ marginBottom: '12px' }}>
            최근 회차의 데이터 분석 결과가 조회되지 않습니다.
          </p>
          <button
            className="btn-neon btn-outline"
            onClick={() => setChampionData(null)}
            style={{
              width: 'auto',
              display: 'inline-flex',
              padding: '8px 16px',
            }}
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <div
          className="stats-card champ-card"
          style={{
            background:
              'linear-gradient(135deg, rgba(0, 240, 255, 0.03) 0%, rgba(189, 0, 255, 0.03) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.15)',
            padding: '24px',
            borderRadius: '20px',
            boxShadow:
              '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(0, 240, 255, 0.05)',
          }}
        >
          {/* Header Info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: '16px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  background: 'rgba(0, 240, 255, 0.15)',
                  color: 'var(--primary-cyan)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  fontWeight: 'bold',
                }}
              >
                CHAMPION COMBO
              </span>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: 'var(--text-main)',
                  marginTop: '8px',
                }}
              >
                {winningNumber?.episode ?? prediction?.episode}회차 최고 분석
                점수 예측
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: 'var(--primary-cyan)',
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px rgba(0,240,255,0.3)',
                }}
              >
                {prediction.reliabilityScore.toFixed(2)}%
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                분석 스코어
              </span>
            </div>
          </div>

          {/* Algorithm Info */}
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)',
              padding: '10px 14px',
              borderRadius: '8px',
            }}
          >
            <span>적용 알고리즘</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>
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
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px dashed rgba(255, 255, 255, 0.06)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  lineHeight: '1.4',
                }}
              >
                💡 <strong>알고리즘 설명:</strong> {desc}
              </div>
            );
          })()}

          {/* Prediction Numbers (Lotto Balls) */}
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              생성된 예측번호
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {prediction.numbers.slice(0, 6).map((num, i) => {
                const matched = isMatched(num);
                const bonusMatched = isBonusMatched(num);

                const borderColor = matched
                  ? '#10b981'
                  : bonusMatched
                    ? '#c084fc'
                    : 'rgba(255, 255, 255, 0.15)';

                const shadowColor = matched
                  ? 'rgba(16, 185, 129, 0.6)'
                  : bonusMatched
                    ? 'rgba(192, 132, 252, 0.6)'
                    : null;

                return (
                  <BallHoverTooltip key={i} ball={num}>
                    <div
                      className="lotto-ball"
                      style={{
                        ...getBallStyle(num),
                        position: 'relative',
                        border:
                          matched || bonusMatched
                            ? `2px solid ${borderColor}`
                            : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: shadowColor
                          ? `0 0 15px ${shadowColor}`
                          : getBallStyle(num).boxShadow,
                      }}
                    >
                      {num}
                      {(matched || bonusMatched) && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            background: matched ? '#10b981' : '#c084fc',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            fontWeight: 'bold',
                          }}
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
          <div
            style={{
              marginBottom: '24px',
              textAlign: 'left',
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed rgba(255,255,255,0.06)',
              padding: '16px',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              실제 발표 당첨번호
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {winningNumber?.numbers ? (
                <>
                  {winningNumber.numbers.slice(0, 6).map((num, i) => (
                    <BallHoverTooltip key={i} ball={num}>
                      <div
                        className="lotto-ball"
                        style={{
                          ...getBallStyle(num),
                          opacity: 0.85,
                        }}
                      >
                        {num}
                      </div>
                    </BallHoverTooltip>
                  ))}
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: 'var(--text-muted)',
                      padding: '0 2px',
                    }}
                  >
                    +
                  </div>
                  <BallHoverTooltip ball={winningNumber.numbers[6] ?? 0}>
                    <div
                      className="lotto-ball"
                      style={{
                        ...getBallStyle(winningNumber.numbers[6] ?? 0),
                        opacity: 0.85,
                      }}
                    >
                      {winningNumber.numbers[6] ?? 0}
                    </div>
                  </BallHoverTooltip>
                </>
              ) : (
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    padding: '4px 0',
                  }}
                >
                  당첨번호가 아직 발표되지 않았습니다.
                </div>
              )}
            </div>
          </div>

          {/* Prediction Weights Breakdown */}
          {algoType.includes('WEIGHTS') && (
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-dim)',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                설정된 가중치 조합
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}
              >
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
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'var(--border-glass)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          color: 'var(--primary-purple)',
                          fontWeight: 'bold',
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
      return (
        <p style={{ color: 'var(--text-dim)', padding: '20px 0' }}>
          상세 통계 추이를 집계하는 중...
        </p>
      );
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Selector Dropdown */}
        <div
          className="stats-selector-container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              fontWeight: 'bold',
            }}
          >
            상세 분석 알고리즘 선택
          </span>
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            style={{
              background: '#0f111a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '8px 12px',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-family)',
              outline: 'none',
              cursor: 'pointer',
            }}
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
        <div
          className="stats-card"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: 'var(--border-glass)',
            borderRadius: '20px',
            padding: '20px',
            position: 'relative',
          }}
        >
          <div style={{ textAlign: 'left', marginBottom: '14px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              RELIABILITY TREND (LAST 20 ROUNDS)
            </span>
            <h4
              style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: 'var(--text-main)',
              }}
            >
              회차별 분석 점수 변동 추이
            </h4>
          </div>

          {!hasHistory ? (
            <div
              style={{
                height: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dim)',
                fontSize: '0.85rem',
              }}
            >
              해당 알고리즘에 대한 과거 분석 결과 데이터가 존재하지 않습니다.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <svg
                width="100%"
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ overflow: 'visible' }}
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
                        stroke="rgba(255, 255, 255, 0.04)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        fill={getReliabilityColor(scoreLabel)}
                        fontSize="9px"
                        fontFamily="monospace"
                        textAnchor="end"
                        style={{ fontWeight: '600' }}
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
                        stroke="rgba(255, 255, 255, 0.1)"
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
                        fill={isHovered ? '#fff' : 'var(--primary-cyan)'}
                        stroke={
                          isHovered
                            ? getReliabilityColor(p.score)
                            : 'rgba(8, 9, 14, 0.8)'
                        }
                        strokeWidth={isHovered ? '3' : '1.5'}
                        style={{
                          transition: 'r 0.15s ease, stroke-width 0.15s ease',
                        }}
                      />

                      {/* Invisible Hover Area (larger hitbox) */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="16"
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
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
                  style={{
                    position: 'absolute',
                    left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                    top: `${hoveredPoint.y - 48}px`,
                    transform: `translateX(${tooltipTranslateX})`,
                    background: 'rgba(15, 17, 26, 0.95)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: `1px solid ${getReliabilityColor(hoveredPoint.score)}`,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    boxShadow: `0 5px 15px rgba(0, 0, 0, 0.5), 0 0 10px ${getReliabilityColor(hoveredPoint.score)}55`,
                    pointerEvents: 'none',
                    zIndex: 2,
                    fontSize: '0.78rem',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}
                  >
                    {hoveredPoint.episode}회차
                  </div>
                  <div
                    style={{ fontWeight: 'bold', color: 'var(--text-main)' }}
                  >
                    분석 점수:{' '}
                    <span
                      style={{
                        color: getReliabilityColor(hoveredPoint.score),
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
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
        <div
          className="stats-kpi-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.01)',
              border: 'var(--border-glass)',
              padding: '12px 8px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              className="kpi-label"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                marginBottom: '4px',
              }}
            >
              최고 분석 점수 (PEAK)
            </div>
            <div
              className="kpi-value"
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--success)',
              }}
            >
              {peakScore.toFixed(1)}%
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.01)',
              border: 'var(--border-glass)',
              padding: '12px 8px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              className="kpi-label"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                marginBottom: '4px',
              }}
            >
              평균 분석 점수 (AVG)
            </div>
            <div
              className="kpi-value"
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--primary-cyan)',
              }}
            >
              {avgScore.toFixed(1)}%
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.01)',
              border: 'var(--border-glass)',
              padding: '12px 8px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              className="kpi-label"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                marginBottom: '4px',
              }}
            >
              최저 분석 점수 (LOW)
            </div>
            <div
              className="kpi-value"
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--error)',
              }}
            >
              {lowestScore.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Description Info */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: 'var(--border-glass)',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
            textAlign: 'left',
          }}
        >
          💡 <strong>분석 점수(Analysis Score)란?</strong>
          <div style={{ marginTop: '4px' }}>
            각 회차별로 실제 발표된 당첨 번호 분포와 해당 알고리즘의 예측 번호가
            수학적으로 얼마나 근사했는지를 나타내는 점수입니다. 100%에
            가까울수록 실제 당첨 분포와 높은 연관성을 가짐을 의미합니다.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2
        className="access-title"
        style={{ fontSize: '1.3rem', marginBottom: '16px' }}
      >
        알고리즘 분석 통계 대시보드
      </h2>
      <p
        className="access-desc"
        style={{ fontSize: '0.88rem', marginBottom: '24px' }}
      >
        당첨 데이터 분포 시뮬레이션 분석 정보 및 다가오는 회차의 생성 통계를
        제공합니다.
      </p>

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
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(8, 9, 14, 0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 9999,
              padding: '40px 20px',
              boxSizing: 'border-box',
              animation: 'backdropFadeIn 0.3s ease-out forwards',
              overflowY: 'auto',
            }}
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
              style={{
                background:
                  'linear-gradient(135deg, rgba(20, 21, 33, 0.95) 0%, rgba(10, 11, 18, 0.98) 100%)',
                border: '1px solid rgba(189, 0, 255, 0.25)',
                boxShadow:
                  '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(189, 0, 255, 0.05), 0 0 30px rgba(189, 0, 255, 0.15)',
                borderRadius: '24px',
                padding: '28px 24px',
                width: '100%',
                maxWidth: '600px',
                position: 'relative',
                animation:
                  'modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                boxSizing: 'border-box',
                textAlign: 'left',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setClickedPointData(null);
                  setClickedPointLoading(false);
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  lineHeight: '1',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ✕
              </button>

              {clickedPointLoading && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(189, 0, 255, 0.1)',
                      borderTopColor: 'var(--primary-purple)',
                      borderRadius: '50%',
                      animation: 'spinner 0.8s linear infinite',
                      marginBottom: '16px',
                    }}
                  />
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
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
                      <div
                        style={{
                          color: '#ffffff',
                          padding: '20px 10px',
                          textAlign: 'center',
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            fontSize: '1.1rem',
                          }}
                        >
                          ⚠️ 상세 정보가 없습니다.
                        </p>
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'rgba(255,255,255,0.6)',
                            marginBottom: '16px',
                          }}
                        >
                          데이터를 정상적으로 처리하지 못했습니다.
                        </p>
                        <pre
                          style={{
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            overflow: 'auto',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.8)',
                            maxHeight: '150px',
                          }}
                        >
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
                    <div style={{ color: '#ffffff' }}>
                      {/* Title / Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '20px',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          paddingBottom: '16px',
                          paddingRight: '36px', // leave space for the X button
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              background: 'rgba(189, 0, 255, 0.15)',
                              color: '#c084fc',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(189, 0, 255, 0.25)',
                              fontWeight: 'bold',
                            }}
                          >
                            EPISODE DETAIL
                          </span>
                          <h3
                            style={{
                              fontSize: '1.15rem',
                              fontWeight: 'bold',
                              color: '#ffffff',
                              marginTop: '8px',
                            }}
                          >
                            {prediction.episode}회차 최고 분석 점수 예측
                          </h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: '#a855f7',
                              fontFamily: 'monospace',
                              textShadow: '0 0 10px rgba(189,0,255,0.3)',
                            }}
                          >
                            {typeof prediction.reliabilityScore === 'number'
                              ? prediction.reliabilityScore.toFixed(2)
                              : '0.00'}
                            %
                          </div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            분석 스코어
                          </span>
                        </div>
                      </div>

                      {/* Generated prediction numbers */}
                      <div style={{ marginBottom: '20px' }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.6)',
                            marginBottom: '8px',
                            fontWeight: 600,
                          }}
                        >
                          생성된 예측번호
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          {predictionNumbers
                            .slice(0, 6)
                            .map((num: number, i: number) => {
                              const matched = isMatched(num);
                              const bonusMatched = isBonusMatched(num);

                              const borderColor = matched
                                ? '#10b981'
                                : bonusMatched
                                  ? '#c084fc'
                                  : 'rgba(255, 255, 255, 0.15)';

                              const shadowColor = matched
                                ? 'rgba(16, 185, 129, 0.6)'
                                : bonusMatched
                                  ? 'rgba(192, 132, 252, 0.6)'
                                  : null;

                              return (
                                <BallHoverTooltip key={i} ball={num}>
                                  <div
                                    className="lotto-ball"
                                    style={{
                                      ...getBallStyle(num),
                                      position: 'relative',
                                      width: '36px',
                                      height: '36px',
                                      fontSize: '0.95rem',
                                      border:
                                        matched || bonusMatched
                                          ? `2px solid ${borderColor}`
                                          : '1px solid rgba(255, 255, 255, 0.15)',
                                      boxShadow: shadowColor
                                        ? `0 0 15px ${shadowColor}`
                                        : getBallStyle(num).boxShadow,
                                    }}
                                  >
                                    {num}
                                    {(matched || bonusMatched) && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          top: '-4px',
                                          right: '-4px',
                                          background: matched
                                            ? '#10b981'
                                            : '#c084fc',
                                          color: '#fff',
                                          borderRadius: '50%',
                                          width: '14px',
                                          height: '14px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '8px',
                                          fontWeight: 'bold',
                                        }}
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
                        <div
                          style={{
                            marginBottom: '20px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px dashed rgba(255,255,255,0.06)',
                            padding: '14px 16px',
                            borderRadius: '12px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255,255,255,0.6)',
                              marginBottom: '8px',
                              fontWeight: 600,
                            }}
                          >
                            실제 발표 당첨번호
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                            }}
                          >
                            {winningNumbers
                              .slice(0, 6)
                              .map((num: number, i: number) => (
                                <BallHoverTooltip key={i} ball={num}>
                                  <div
                                    className="lotto-ball"
                                    style={{
                                      ...getBallStyle(num),
                                      width: '36px',
                                      height: '36px',
                                      fontSize: '0.95rem',
                                      opacity: 0.85,
                                    }}
                                  >
                                    {num}
                                  </div>
                                </BallHoverTooltip>
                              ))}
                            <div
                              style={{
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                color: 'rgba(255,255,255,0.4)',
                                padding: '0 2px',
                              }}
                            >
                              +
                            </div>
                            <BallHoverTooltip ball={winningNumbers[6] ?? 0}>
                              <div
                                className="lotto-ball"
                                style={{
                                  ...getBallStyle(winningNumbers[6] ?? 0),
                                  width: '36px',
                                  height: '36px',
                                  fontSize: '0.95rem',
                                  opacity: 0.85,
                                }}
                              >
                                {winningNumbers[6] ?? 0}
                              </div>
                            </BallHoverTooltip>
                          </div>
                        </div>
                      )}

                      {prediction.analysis && (
                        <div style={{ marginBottom: '20px' }}>
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
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255,255,255,0.6)',
                              marginBottom: '8px',
                              fontWeight: 600,
                            }}
                          >
                            설정된 가중치 조합
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '8px',
                            }}
                          >
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
                                  style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    border: 'var(--border-glass)',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <span
                                    style={{
                                      color: 'rgba(255,255,255,0.85)',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    style={{
                                      color: '#c084fc',
                                      fontWeight: 'bold',
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
