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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBall(null);
      }
    };

    if (selectedBall !== null) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
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
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-main tracking-tight m-0">
            추첨 번호 분석 (1 ~ 45번)
          </h1>
          <p className="text-sm text-dim mt-1.5 m-0">
            각 숫자공을 클릭하면 자리별 등장 횟수, 등장 확률, 온도 및 동반 출현
            번호 등 상세 분석 모달을 확인할 수 있습니다.
            {totalEpisodes > 0 && (
              <span className="ml-2 text-primary-cyan font-semibold">
                (전체 {totalEpisodes}회차 기준)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="bento-card p-4 sm:px-5 flex justify-between items-center flex-wrap gap-3">
        {/* Temperature Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(
            [
              {
                key: 'ALL' as const,
                label: `전체 (${countsByTemp.ALL || 45})`,
                activeClasses:
                  'bg-primary-cyan text-white border-primary-cyan shadow-sm',
              },
              {
                key: 'HOT' as const,
                label: `🔥 열번호 HOT (${countsByTemp.HOT})`,
                activeClasses:
                  'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
              },
              {
                key: 'WARM' as const,
                label: `☀️ 온번호 WARM (${countsByTemp.WARM})`,
                activeClasses:
                  'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40',
              },
              {
                key: 'COLD' as const,
                label: `❄️ 냉번호 COLD (${countsByTemp.COLD})`,
                activeClasses:
                  'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
              },
            ] as const
          ).map((tab) => {
            const isActive = tempFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTempFilter(tab.key)}
                className={`py-1.5 px-3.5 rounded-full text-xs cursor-pointer border transition-all duration-200 ${
                  isActive
                    ? `${tab.activeClasses} font-bold`
                    : 'bg-surface text-dim border-glass-border font-semibold hover:text-main'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort Options */}
        <div className="flex gap-1.5 items-center bg-surface p-1 rounded-xl border border-glass-border">
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
                className={`py-1.5 px-3 rounded-lg text-xs cursor-pointer border-none transition-all duration-200 ${
                  isActive
                    ? 'bg-card text-primary-cyan font-bold shadow-xs'
                    : 'bg-transparent text-dim font-medium hover:text-main'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1~45 Balls Grid */}
      {ballStatsList.length === 0 ? (
        <div className="bento-card text-center py-16 px-5 text-dim">
          번호별 통계 데이터를 불러오는 중...
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-3.5">
          {filteredAndSortedBalls.map((stat) => {
            const tempMeta = getTemperatureMeta(stat.status);
            return (
              <div
                key={stat.ball}
                onClick={() => setSelectedBall(stat.ball)}
                className="bento-card bento-card-interactive pt-3.5 px-3.5 pb-3.5 flex flex-col items-center gap-2.5 cursor-pointer relative"
              >
                {/* Top Row: Rank & Temperature Badge */}
                <div className="w-full flex justify-between items-center gap-1.5">
                  <span className="text-[0.72rem] text-muted font-bold tabular-nums whitespace-nowrap shrink-0">
                    #{stat.rank}위
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full py-0.5 px-2 font-bold text-[0.65rem] whitespace-nowrap shrink-0 leading-none"
                    style={{
                      color: tempMeta.color,
                      background: tempMeta.bg,
                      border: `1px solid ${tempMeta.border}`,
                    }}
                  >
                    <span>{tempMeta.icon}</span>
                    <span>{tempMeta.shortLabel}</span>
                  </span>
                </div>

                {/* Lotto Ball */}
                <div
                  className="lotto-ball !w-[46px] !h-[46px] !text-[1.08rem] my-1 mx-0"
                  style={getBallStyle(stat.ball)}
                >
                  {stat.ball}
                </div>

                {/* Bottom Stats Summary */}
                <div className="text-center leading-tight w-full">
                  <div className="text-[0.82rem] font-bold text-main tabular-nums whitespace-nowrap">
                    {stat.totalCount}회{' '}
                    <span className="text-primary-cyan text-[0.75rem]">
                      ({stat.appearanceRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-[0.7rem] text-muted mt-1 whitespace-nowrap">
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
              className="glass-card admin-modal-content max-w-[680px] w-[94%] !p-0 text-left relative border border-glass-border-strong shadow-glass flex flex-col overflow-hidden !max-h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-7 px-6 sm:px-7 pb-2 overflow-y-auto flex flex-col flex-1">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedBall(null)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-surface border border-glass-border text-dim hover:text-main cursor-pointer flex items-center justify-center transition-colors duration-200 z-10"
                >
                  ✕
                </button>

                {/* Modal Header */}
                {(() => {
                  const tempMeta = getTemperatureMeta(selectedStat.status);
                  return (
                    <div className="flex items-center gap-4 mb-6 pr-8">
                      <div
                        className="lotto-ball !w-[54px] !h-[54px] !text-[1.3rem] shrink-0"
                        style={getBallStyle(selectedStat.ball)}
                      >
                        {selectedStat.ball}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h2 className="font-display text-xl font-extrabold text-main m-0">
                            {selectedStat.ball}번 추첨 번호 상세 분석
                          </h2>
                          <span className="text-xs font-bold text-primary-cyan bg-primary-cyan/10 border border-primary-cyan/30 py-0.5 px-2.5 rounded-full">
                            전체 출현 {selectedStat.rank}위 / 45개
                          </span>
                          <span
                            className="text-xs font-bold py-0.5 px-2.5 rounded-full"
                            style={{
                              color: tempMeta.color,
                              background: tempMeta.bg,
                              border: `1px solid ${tempMeta.border}`,
                            }}
                          >
                            {tempMeta.icon} {tempMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-dim m-0">
                          제 1회 ~ 제 {selectedStat.totalEpisodes}회 누적 당첨
                          데이터 기반 정밀 통계
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Core 4-Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                  <div className="bg-surface border border-glass-border rounded-2xl p-3.5">
                    <div className="text-[0.68rem] font-semibold text-dim">
                      총 등장 횟수
                    </div>
                    <div className="font-display text-lg font-extrabold text-main mt-1 tabular-nums">
                      {selectedStat.totalCount}회
                    </div>
                    <div className="text-[0.68rem] text-primary-purple font-medium mt-0.5">
                      보너스 +{selectedStat.bonusCount}회 별도
                    </div>
                  </div>

                  <div className="bg-surface border border-glass-border rounded-2xl p-3.5">
                    <div className="text-[0.68rem] font-semibold text-dim">
                      등장 확률
                    </div>
                    <div className="font-display text-lg font-extrabold text-primary-cyan mt-1 tabular-nums">
                      {selectedStat.appearanceRate.toFixed(2)}%
                    </div>
                    <div className="text-[0.68rem] text-muted mt-0.5">
                      전체 회차 대비
                    </div>
                  </div>

                  <div className="bg-surface border border-glass-border rounded-2xl p-3.5">
                    <div className="text-[0.68rem] font-semibold text-dim">
                      미출현 간격
                    </div>
                    <div
                      className="font-display text-base font-extrabold mt-1"
                      style={{
                        color: getTemperatureMeta(selectedStat.status).color,
                      }}
                    >
                      {selectedStat.skip === 0
                        ? '최근 회차 당첨!'
                        : `${selectedStat.skip}주 연속 미출현`}
                    </div>
                    <div className="text-[0.68rem] text-muted mt-0.5">
                      최근: 제 {selectedStat.latestEpisode}회
                    </div>
                  </div>

                  <div className="bg-surface border border-glass-border rounded-2xl p-3.5">
                    <div className="text-[0.68rem] font-semibold text-dim">
                      최근 단기 흐름
                    </div>
                    <div className="font-display text-base font-extrabold text-main mt-1 tabular-nums">
                      10회 중 {selectedStat.recentTen}회
                    </div>
                    <div className="text-[0.68rem] text-muted mt-0.5">
                      최근 30회 중 {selectedStat.recentThirty}회 등장
                    </div>
                  </div>
                </div>

                {/* Section 1: Position-by-Position Counts (1st ~ 6th) */}
                <div className="bg-surface border border-glass-border rounded-2xl py-4 px-5 mb-4">
                  <div className="flex justify-between items-center mb-3.5">
                    <span className="text-sm font-bold text-main">
                      자리별 등장 횟수 (첫번째 ~ 여섯번째 자리)
                    </span>
                    <span className="text-xs text-muted font-semibold tabular-nums">
                      총 {selectedStat.totalCount}회 (
                      {selectedStat.appearanceRate.toFixed(2)}%)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
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
                          className="grid grid-cols-[92px_1fr_115px] items-center gap-3 text-xs"
                        >
                          <span className="text-dim font-semibold">
                            {label}
                          </span>

                          <div className="h-2.5 bg-surface-hover rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-[width] duration-350 ease-in-out ${
                                count > 0 ? 'bg-primary-cyan' : 'bg-transparent'
                              }`}
                              style={{
                                width: `${Math.min(100, shareWithinBall)}%`,
                              }}
                            />
                          </div>

                          <div
                            className={`text-right font-bold tabular-nums ${
                              count > 0 ? 'text-main' : 'text-muted'
                            }`}
                          >
                            {count}회{' '}
                            <span className="text-[0.7rem] font-medium text-primary-cyan">
                              ({rateInAllEpisodes.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Best Friendly Numbers Top 3 */}
                <div className="bg-surface border border-glass-border rounded-2xl py-4 px-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-main">
                      베스트 궁합 번호 Top 3 (최다 동반 출현 번호)
                    </span>
                    <span className="text-xs text-muted">
                      번호 클릭 시 해당 공 분석으로 이동
                    </span>
                  </div>

                  {selectedStat.friendlyNumbers &&
                  selectedStat.friendlyNumbers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                            className="flex items-center gap-2.5 p-2.5 bg-card hover:bg-primary-cyan/5 border border-glass-border hover:border-primary-cyan/40 rounded-xl cursor-pointer transition-all duration-200"
                          >
                            <div
                              className="lotto-ball !w-[34px] !h-[34px] !text-[0.88rem] shrink-0"
                              style={getBallStyle(friendNum)}
                            >
                              {friendNum}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-main flex items-center gap-1 whitespace-nowrap">
                                <span>
                                  {i + 1}위 ·{' '}
                                  {hasCoCount
                                    ? `${coCount}회`
                                    : friendStat
                                      ? `${friendStat.totalCount}회`
                                      : `${friendNum}번`}
                                </span>
                                <span
                                  className="text-[0.65rem]"
                                  style={{
                                    color: friendTemp.color,
                                  }}
                                >
                                  {friendTemp.icon}
                                </span>
                              </div>
                              {coRate !== undefined && (
                                <div className="text-[0.72rem] text-dim mt-0.5 whitespace-nowrap">
                                  {hasCoCount ? '동반율' : '등장률'} {coRate}%
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-dim">
                      동반 출현 데이터가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 px-6 sm:px-7 pb-6 shrink-0">
                <button
                  type="button"
                  className="btn-submit w-full h-11 flex items-center justify-center"
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
