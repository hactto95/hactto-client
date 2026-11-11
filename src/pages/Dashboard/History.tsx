import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, authFetch } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL, parseAlgorithmName } from '../../utils';
import { LottoBalls } from '../../components/LottoBall';
import { LottoAnalysisCard } from '../../components/LottoAnalysisCard';
import { PersonalAnalysisCard } from '../../components/PersonalAnalysisCard';

export function History() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showAlert } = useApp();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    numbers: number[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analysis: any;
    episode: number;
    type: 'personal' | 'algorithm';
  } | null>(null);

  const defaultTab =
    location.state?.defaultTab === 'personal' ? 'personal' : 'algorithm';
  const [activeSubTab, setActiveSubTab] = useState<'algorithm' | 'personal'>(
    defaultTab,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAnalysis(null);
      }
    };

    if (selectedAnalysis) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAnalysis]);

  useEffect(() => {
    const fetchHistoryList = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        setHistoryList([]);

        const endpoint =
          activeSubTab === 'algorithm'
            ? `${API_BASE_URL}/algorithms/history`
            : `${API_BASE_URL}/personal-predictions/history`;

        const res = await authFetch(endpoint);
        if (!res.ok) throw new Error('당첨 이력을 가져오지 못했습니다.');
        const data = await res.json();
        setHistoryList(data.data || data || []);
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryList();
  }, [isAuthenticated, showAlert, activeSubTab]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-main sm:text-3xl">
            내 예측 당첨이력
          </h1>
          <p className="mt-1 text-sm text-muted">
            생성하거나 저장한 모든 예측 조합의 실제 회차 추첨 대조 결과입니다.
          </p>
        </div>

        {/* Segmented Control Tabs */}
        <div className="inline-flex rounded-2xl border border-glass-border bg-card p-1 shadow-xs">
          {(
            [
              { id: 'algorithm', label: '알고리즘 생성 번호' },
              { id: 'personal', label: '개인 지정 번호' },
            ] as const
          ).map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`cursor-pointer rounded-xl border-none px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary-cyan text-white shadow-xs'
                    : 'bg-transparent text-muted hover:text-main'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="bento-card py-20 text-center text-sm text-dim">
          당첨 이력을 불러오고 있어요...
        </div>
      ) : historyList.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-sm text-muted">
            {activeSubTab === 'algorithm'
              ? '생성된 알고리즘 예측 이력이 없습니다.'
              : '저장된 개인 예측번호가 없습니다.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/generate')}
            className="btn-submit px-5 py-2.5 text-xs"
          >
            예측번호 분석기로 이동 →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {historyList.map((hist) => {
            const hasResult = hist.matchResult !== null;
            return (
              <div key={hist.id} className="history-card">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-primary-cyan/10 px-3 py-1 font-display text-sm font-extrabold text-primary-cyan">
                      제 {hist.episode}회차
                    </span>
                    <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                      {activeSubTab === 'algorithm'
                        ? parseAlgorithmName(hist.algorithm)
                        : '개인 지정 조합'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasResult && hist.matchResult ? (
                      hist.matchResult.rank > 0 ? (
                        <span
                          className={`badge badge-rank-${hist.matchResult.rank}`}
                        >
                          🎉 {hist.matchResult.rank}등 당첨
                        </span>
                      ) : (
                        <span className="badge badge-no-prize">미당첨</span>
                      )
                    ) : (
                      <span className="badge badge-pending">추첨 대기중</span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAnalysis({
                          numbers: hist.numbers,
                          analysis: hist.analysis,
                          episode: hist.episode,
                          type: activeSubTab,
                        })
                      }
                      className="cursor-pointer rounded-lg border border-glass-border bg-surface px-3 py-1 text-xs font-semibold text-primary-cyan transition-colors hover:bg-surface-hover"
                    >
                      패턴 분석 →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-glass-border bg-surface p-4">
                    <div className="mb-2.5 text-xs font-semibold text-muted">
                      내 예측 번호
                    </div>
                    <LottoBalls
                      numbers={hist.numbers}
                      matchResult={hist.matchResult}
                    />
                  </div>

                  {hasResult && hist.matchResult && (
                    <div className="rounded-2xl border border-glass-border bg-surface p-4">
                      <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-muted">
                        <span>실제 당첨 번호</span>
                        <span className="text-primary-cyan">
                          {hist.matchResult.matchCount}개 일치
                          {hist.matchResult.bonusMatch ? ' + 보너스' : ''}
                        </span>
                      </div>
                      <LottoBalls numbers={hist.matchResult.winningNumbers} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAnalysis &&
        createPortal(
          <div
            className="admin-modal-overlay overflow-y-auto px-4 py-8"
            onClick={() => setSelectedAnalysis(null)}
          >
            <div
              className="relative mx-auto w-full max-w-[680px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAnalysis(null)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-glass-border bg-modal px-3 py-1.5 text-xs font-bold text-main shadow-md hover:bg-surface-hover"
                >
                  ✕ 닫기
                </button>
              </div>

              {selectedAnalysis.type === 'personal' ? (
                <PersonalAnalysisCard
                  numbers={selectedAnalysis.numbers}
                  analysis={selectedAnalysis.analysis}
                />
              ) : (
                <LottoAnalysisCard
                  numbers={selectedAnalysis.numbers}
                  analysis={selectedAnalysis.analysis}
                  title={`제 ${selectedAnalysis.episode}회 예측 조합 분석`}
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
export default History;
