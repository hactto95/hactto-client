import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { getBallStyle, getTemperatureMeta } from '../../utils';
import type { LotteryBallStat } from '../../types';

const POSITION_LABELS = [
  '첫번째 자리',
  '두번째 자리',
  '세번째 자리',
  '네번째 자리',
  '다섯번째 자리',
  '여섯번째 자리',
];

type TempFilter = 'ALL' | 'HOT' | 'WARM' | 'COLD';
type SortOption = 'NUMBER' | 'COUNT_DESC' | 'SKIP_DESC';

export function BallAnalysis() {
  const { ballStatsList, ballStatsMap, refreshBallStats } = useApp();
  const [tempFilter, setTempFilter] = useState<TempFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NUMBER');
  const [selectedBall, setSelectedBall] = useState<number | null>(null);

  useEffect(() => {
    if (ballStatsList.length === 0) {
      void refreshBallStats();
    }
  }, [ballStatsList.length, refreshBallStats]);

  // Prevent body scroll when modal is open and add ESC key support
  useEffect(() => {
    const scrollContainer = document.querySelector(
      '.scroll-y-container',
    ) as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBall(null);
      }
    };

    if (selectedBall !== null) {
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
  }, [selectedBall]);

  const countsByTemp = useMemo(() => {
    const counts = { ALL: ballStatsList.length, HOT: 0, WARM: 0, COLD: 0 };
    ballStatsList.forEach((item) => {
      if (item.status === 'HOT') counts.HOT++;
      else if (item.status === 'WARM') counts.WARM++;
      else counts.COLD++;
    });
    return counts;
  }, [ballStatsList]);

  const filteredAndSortedBalls = useMemo(() => {
    const filtered =
      tempFilter === 'ALL'
        ? [...ballStatsList]
        : ballStatsList.filter((item) => item.status === tempFilter);

    filtered.sort((a: LotteryBallStat, b: LotteryBallStat) => {
      if (sortBy === 'COUNT_DESC') {
        return b.totalCount - a.totalCount || a.ball - b.ball;
      }
      if (sortBy === 'SKIP_DESC') {
        return b.skip - a.skip || a.ball - b.ball;
      }
      return a.ball - b.ball;
    });

    return filtered;
  }, [ballStatsList, tempFilter, sortBy]);

  const selectedStat =
    selectedBall !== null ? ballStatsMap[selectedBall] : undefined;

  const totalEpisodes = ballStatsList[0]?.totalEpisodes ?? 0;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2
            className="access-title"
            style={{ fontSize: '1.3rem', marginBottom: '6px' }}
          >
            추첨 번호 분석 (1 ~ 45번)
          </h2>
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-dim)',
              margin: 0,
            }}
          >
            각 숫자공을 클릭하면 자리별 등장 횟수, 등장 확률, 온도 및 동반 출현
            번호 등 상세 분석 모달을 확인할 수 있습니다.
            {totalEpisodes > 0 && (
              <span
                style={{
                  marginLeft: '8px',
                  color: 'var(--primary-cyan)',
                  fontWeight: 600,
                }}
              >
                (전체 {totalEpisodes}회차 기준)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: 'var(--border-glass)',
          borderRadius: '14px',
          marginBottom: '20px',
        }}
      >
        {/* Temperature Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(
            [
              {
                key: 'ALL' as const,
                label: `전체 (${countsByTemp.ALL || 45})`,
                activeColor: 'var(--primary-cyan)',
                activeBg: 'rgba(0, 240, 255, 0.14)',
              },
              {
                key: 'HOT' as const,
                label: `🔥 열번호 HOT (${countsByTemp.HOT})`,
                activeColor: '#f87171',
                activeBg: 'rgba(239, 68, 68, 0.16)',
              },
              {
                key: 'WARM' as const,
                label: `☀️ 온번호 WARM (${countsByTemp.WARM})`,
                activeColor: '#fb923c',
                activeBg: 'rgba(249, 115, 22, 0.16)',
              },
              {
                key: 'COLD' as const,
                label: `❄️ 냉번호 COLD (${countsByTemp.COLD})`,
                activeColor: '#60a5fa',
                activeBg: 'rgba(59, 130, 246, 0.16)',
              },
            ] as const
          ).map((tab) => {
            const isActive = tempFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTempFilter(tab.key)}
                style={{
                  padding: '6px 13px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  background: isActive
                    ? tab.activeBg
                    : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? tab.activeColor : 'var(--text-dim)',
                  border: isActive
                    ? `1px solid ${tab.activeColor}`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginRight: '4px',
            }}
          >
            정렬:
          </span>
          {(
            [
              { key: 'NUMBER' as const, label: '번호순' },
              { key: 'COUNT_DESC' as const, label: '최다 출현순' },
              { key: 'SKIP_DESC' as const, label: '미출현 오래된순' },
            ] as const
          ).map((opt) => {
            const isActive = sortBy === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  background: isActive
                    ? 'rgba(0, 240, 255, 0.15)'
                    : 'transparent',
                  color: isActive ? 'var(--primary-cyan)' : 'var(--text-dim)',
                  border: isActive
                    ? '1px solid rgba(0, 240, 255, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1~45 Balls Grid */}
      {ballStatsList.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-dim)',
          }}
        >
          번호별 통계 데이터를 불러오는 중...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
            gap: '12px',
          }}
        >
          {filteredAndSortedBalls.map((stat) => {
            const tempMeta = getTemperatureMeta(stat.status);
            return (
              <div
                key={stat.ball}
                onClick={() => setSelectedBall(stat.ball)}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '14px',
                  padding: '14px 10px 12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.35)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 20px rgba(0, 0, 0, 0.4), 0 0 12px rgba(0, 240, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background =
                    'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor =
                    'rgba(255, 255, 255, 0.07)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top Row: Rank & Temperature Badge */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.68rem',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    #{stat.rank}위
                  </span>
                  <span
                    style={{
                      color: tempMeta.color,
                      background: tempMeta.bg,
                      border: `1px solid ${tempMeta.border}`,
                      borderRadius: '999px',
                      padding: '1px 6px',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                    }}
                  >
                    {tempMeta.icon} {tempMeta.shortLabel}
                  </span>
                </div>

                {/* Lotto Ball */}
                <div
                  className="lotto-ball"
                  style={{
                    ...getBallStyle(stat.ball),
                    width: '44px',
                    height: '44px',
                    fontSize: '1.05rem',
                    margin: '2px 0',
                  }}
                >
                  {stat.ball}
                </div>

                {/* Bottom Stats Summary */}
                <div style={{ textAlign: 'center', lineHeight: 1.35 }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                    }}
                  >
                    {stat.totalCount}회{' '}
                    <span
                      style={{
                        color: 'var(--primary-cyan)',
                        fontSize: '0.76rem',
                      }}
                    >
                      ({stat.appearanceRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    {stat.skip === 0
                      ? '최근 회차 당첨'
                      : `${stat.skip}주 미출현`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Analysis Modal */}
      {selectedStat &&
        createPortal(
          <div
            className="admin-modal-overlay"
            onClick={() => setSelectedBall(null)}
          >
            <div
              className="glass-card admin-modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '680px',
                width: '94%',
                padding: '0',
                textAlign: 'left',
                position: 'relative',
                border: '1px solid rgba(0, 240, 255, 0.28)',
                boxShadow:
                  '0 22px 48px rgba(0, 0, 0, 0.88), 0 0 32px rgba(0, 240, 255, 0.14)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                maxHeight: '88vh',
              }}
            >
              <div
                style={{
                  padding: '28px 28px 8px 28px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedBall(null)}
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
                    transition: 'color 0.2s',
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

                {/* Modal Header */}
                {(() => {
                  const tempMeta = getTemperatureMeta(selectedStat.status);
                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '22px',
                        paddingRight: '28px',
                      }}
                    >
                      <div
                        className="lotto-ball"
                        style={{
                          ...getBallStyle(selectedStat.ball),
                          width: '54px',
                          height: '54px',
                          fontSize: '1.3rem',
                          flexShrink: 0,
                        }}
                      >
                        {selectedStat.ball}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginBottom: '4px',
                          }}
                        >
                          <h2
                            className="access-title"
                            style={{
                              fontSize: '1.3rem',
                              color: 'var(--text-main)',
                              margin: 0,
                            }}
                          >
                            {selectedStat.ball}번 추첨 번호 상세 분석
                          </h2>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--primary-cyan)',
                              background: 'rgba(0, 240, 255, 0.12)',
                              border: '1px solid rgba(0, 240, 255, 0.35)',
                              padding: '2px 9px',
                              borderRadius: '999px',
                            }}
                          >
                            전체 출현 {selectedStat.rank}위 / 45개
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: tempMeta.color,
                              background: tempMeta.bg,
                              border: `1px solid ${tempMeta.border}`,
                              padding: '2px 9px',
                              borderRadius: '999px',
                            }}
                          >
                            {tempMeta.icon} {tempMeta.label}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-dim)',
                            margin: 0,
                          }}
                        >
                          제 1회 ~ 제 {selectedStat.totalEpisodes}회 누적 당첨
                          데이터 기반 정밀 통계
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Core 4-Metric Summary Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '10px',
                    marginBottom: '22px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      padding: '12px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      총 등장 횟수 (1~6번째)
                    </div>
                    <div
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedStat.totalCount}회
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: '#c084fc',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      보너스 볼 +{selectedStat.bonusCount}회 별도
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      padding: '12px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      등장 확률 (전체 회차 대비)
                    </div>
                    <div
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: 'var(--primary-cyan)',
                        marginTop: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedStat.appearanceRate.toFixed(2)}%
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      padding: '12px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      미출현 간격 · 최근 회차
                    </div>
                    <div
                      style={{
                        fontSize: '1.04rem',
                        fontWeight: 800,
                        color: getTemperatureMeta(selectedStat.status).color,
                        marginTop: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedStat.skip === 0
                        ? '최근 회차 당첨!'
                        : `${selectedStat.skip}주 연속 미출현`}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      최근 등장: 제 {selectedStat.latestEpisode}회
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      padding: '12px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      최근 단기 흐름
                    </div>
                    <div
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        marginTop: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      10회 중 {selectedStat.recentTen}회
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      최근 30회 중 {selectedStat.recentThirty}회 등장
                    </div>
                  </div>
                </div>

                {/* Section 1: Position-by-Position Counts (1st ~ 6th) */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    marginBottom: '18px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                      }}
                    >
                      자리별 등장 횟수 (첫번째 ~ 여섯번째 자리)
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      총 {selectedStat.totalCount}회 (
                      {selectedStat.appearanceRate.toFixed(2)}%)
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {POSITION_LABELS.map((label, idx) => {
                      const count = selectedStat.positionCounts?.[idx] ?? 0;
                      const shareWithinBall =
                        selectedStat.totalCount > 0
                          ? (count / selectedStat.totalCount) * 100
                          : 0;
                      const rateInAllEpisodes =
                        selectedStat.totalEpisodes > 0
                          ? (count / selectedStat.totalEpisodes) * 100
                          : 0;

                      return (
                        <div
                          key={label}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '92px 1fr 135px',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '0.8rem',
                          }}
                        >
                          <span
                            style={{
                              color: 'var(--text-dim)',
                              fontWeight: 600,
                            }}
                          >
                            {label}
                          </span>

                          <div
                            style={{
                              height: '10px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, shareWithinBall)}%`,
                                height: '100%',
                                background:
                                  count > 0
                                    ? 'linear-gradient(90deg, var(--primary-cyan) 0%, #3b82f6 100%)'
                                    : 'transparent',
                                borderRadius: '999px',
                                transition: 'width 0.35s ease',
                              }}
                            />
                          </div>

                          <div
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color:
                                count > 0
                                  ? 'var(--text-main)'
                                  : 'var(--text-muted)',
                            }}
                          >
                            {count}회{' '}
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 500,
                                color: 'var(--primary-cyan)',
                              }}
                            >
                              ({rateInAllEpisodes.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Best Friendly Numbers Top 3 */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                      }}
                    >
                      베스트 궁합 번호 Top 3 (최다 동반 출현 번호)
                    </span>
                    <span
                      style={{
                        fontSize: '0.73rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      번호 클릭 시 해당 공 분석으로 이동
                    </span>
                  </div>

                  {selectedStat.friendlyNumbers &&
                  selectedStat.friendlyNumbers.length > 0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '10px',
                      }}
                    >
                      {selectedStat.friendlyNumbers.map((friendNum, i) => {
                        const friendStat = ballStatsMap[friendNum];
                        const friendTemp = getTemperatureMeta(
                          friendStat?.status,
                        );
                        const coCount = selectedStat.friendlyCounts?.[i];
                        const hasCoCount = typeof coCount === 'number';
                        const coRate =
                          hasCoCount && selectedStat.totalCount > 0
                            ? (
                                (coCount / selectedStat.totalCount) *
                                100
                              ).toFixed(1)
                            : friendStat?.appearanceRate.toFixed(1);
                        return (
                          <div
                            key={friendNum}
                            onClick={() => setSelectedBall(friendNum)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 10px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor =
                                'var(--primary-cyan)';
                              e.currentTarget.style.background =
                                'rgba(0, 240, 255, 0.07)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor =
                                'rgba(255, 255, 255, 0.08)';
                              e.currentTarget.style.background =
                                'rgba(255, 255, 255, 0.03)';
                            }}
                          >
                            <div
                              className="lotto-ball"
                              style={{
                                ...getBallStyle(friendNum),
                                width: '34px',
                                height: '34px',
                                fontSize: '0.88rem',
                                flexShrink: 0,
                              }}
                            >
                              {friendNum}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: 'var(--text-main)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <span>
                                  {i + 1}위 ·{' '}
                                  {hasCoCount
                                    ? `${coCount}회`
                                    : friendStat
                                      ? `${friendStat.totalCount}회`
                                      : `${friendNum}번`}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    color: friendTemp.color,
                                  }}
                                >
                                  {friendTemp.icon}
                                </span>
                              </div>
                              {coRate !== undefined && (
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-dim)',
                                    marginTop: '2px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {hasCoCount ? '동반율' : '등장률'} {coRate}%
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-dim)',
                      }}
                    >
                      동반 출현 데이터가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '18px 28px 26px 28px', flexShrink: 0 }}>
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
                      'linear-gradient(135deg, var(--primary-cyan) 0%, #00b0ff 100%)',
                    boxShadow: '0 4px 15px rgba(0, 240, 255, 0.25)',
                    color: '#030712',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                  onClick={() => setSelectedBall(null)}
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

export default BallAnalysis;
