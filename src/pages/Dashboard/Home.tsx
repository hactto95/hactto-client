import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';
import { LottoBalls } from '../../components/LottoBall';
import { LottoAnalysisCard } from '../../components/LottoAnalysisCard';
import type { WinningNumber } from '../../types';
import { SEO } from '../../components/SEO';

export function Home() {
  const { appendAuth, showAlert } = useApp();
  const navigate = useNavigate();
  const [latestWinningNumber, setLatestWinningNumber] =
    useState<WinningNumber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestWinningNumber = async () => {
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/winning-numbers/latest`),
        );
        if (!res.ok) throw new Error('최근 당첨번호를 가져오지 못했습니다.');
        const data = await res.json();
        setLatestWinningNumber((data.data || data) as WinningNumber);
      } catch (err) {
        const error = err as Error;
        showAlert('error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestWinningNumber();
  }, [appendAuth, showAlert]);

  const analysis = latestWinningNumber?.analysis;

  return (
    <div className="flex flex-col gap-6">
      <SEO canonical="https://hactto.com/" />

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-cyan/10 px-3 py-1 text-xs font-bold text-primary-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-cyan" />
            동행복권 공식 데이터 실시간 연동
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-main sm:text-3xl">
            이번 주 당첨 결과 리포트
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="btn-outline cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold"
          >
            역대 회차 조회
          </button>
          <button
            type="button"
            onClick={() => navigate('/generate')}
            className="btn-submit cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold"
          >
            AI 예측번호 생성 →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bento-card flex flex-col items-center justify-center py-20 text-muted">
          <div className="spinner !m-0 mb-3" />
          <p className="text-sm font-medium">
            최신 당첨 번호를 불러오고 있어요...
          </p>
        </div>
      ) : latestWinningNumber ? (
        <>
          {/* Hero Bento Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Main Winning Numbers Hero Card (8 cols) */}
            <div className="bento-card relative flex flex-col justify-between overflow-hidden p-6 sm:p-8 lg:col-span-8">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-cyan/8 blur-3xl" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-xl bg-primary-cyan px-3 py-1 text-xs font-extrabold text-white shadow-xs">
                      제 {latestWinningNumber.episode}회
                    </span>
                    <span className="text-sm font-semibold text-muted">
                      공식 추첨 결과
                    </span>
                  </div>
                  <span className="text-xs font-medium text-dim">
                    매주 토요일 21:00 자동 갱신
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-bold text-main sm:text-xl">
                  당첨 번호 및 보너스 볼
                </h2>

                <div className="mt-5 flex items-center rounded-2xl border border-glass-border bg-surface/80 p-5 sm:p-6">
                  <LottoBalls numbers={latestWinningNumber.numbers} />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-glass-border pt-4 text-xs text-dim">
                <span>
                  번호 위에 마우스를 올리면 출현 순위와 현재
                  온도(HOT/WARM/COLD)를 확인할 수 있습니다.
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/locations')}
                  className="cursor-pointer border-none bg-transparent p-0 font-semibold text-primary-cyan hover:underline"
                >
                  이번 회차 1·2등 배출점 지도 보기 →
                </button>
              </div>
            </div>

            {/* Quick KPI Summary Bento Cards (4 cols) */}
            <div className="grid grid-cols-2 gap-4 lg:col-span-4 lg:grid-cols-1">
              <div className="bento-card flex flex-col justify-between p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">
                    6개 번호 총합
                  </span>
                  <span className="rounded-lg bg-primary-cyan/10 px-2 py-0.5 text-[0.7rem] font-bold text-primary-cyan">
                    합계 지표
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-main">
                    {analysis?.sum ?? '-'}
                  </span>
                  <span className="text-xs text-dim">
                    (끝자리 합 {analysis?.sumLastDigits ?? '-'})
                  </span>
                </div>
              </div>

              <div className="bento-card flex flex-col justify-between p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">
                    조합 복잡도 & 홀짝비
                  </span>
                  <span className="rounded-lg bg-primary-purple/10 px-2 py-0.5 text-[0.7rem] font-bold text-primary-purple">
                    패턴 지표
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-dim">AC값 </span>
                    <span className="font-display text-2xl font-extrabold text-main">
                      {analysis?.ac ?? '-'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-dim">홀짝 </span>
                    <span className="font-display text-lg font-bold text-primary-cyan">
                      {analysis ? `${analysis.odd} : ${analysis.even}` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Analysis Bento Card */}
          <LottoAnalysisCard
            numbers={latestWinningNumber.numbers}
            analysis={latestWinningNumber.analysis}
            title="제 1~6구 당첨 번호 심층 패턴 리포트"
          />
        </>
      ) : (
        <div className="bento-card py-16 text-center text-dim">
          최근 당첨 번호 정보가 없습니다.
        </div>
      )}

      {/* Bottom Feature Highlights Bento Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          onClick={() => navigate('/ball-analysis')}
          className="bento-card-interactive flex cursor-pointer flex-col justify-between p-6"
        >
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-cyan/10 text-primary-cyan">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-main">
              1~45번 개별 추첨 분석
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              번호별 역대 출현 확률, 미출현 주수, 동반 출현 궁합수와 온도 상태를
              한눈에 비교해보세요.
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-primary-cyan">
            번호 분석 보러가기 →
          </span>
        </div>

        <div
          onClick={() => navigate('/stats')}
          className="bento-card-interactive flex cursor-pointer flex-col justify-between p-6"
        >
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-purple/10 text-primary-purple">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-main">
              AI 알고리즘 적중 통계
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              역가중 가설 및 빈도 모델별 실제 회차 적중 성적과 누적 수익률
              지표를 투명하게 검증합니다.
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-primary-purple">
            알고리즘 성적 확인 →
          </span>
        </div>

        <div
          onClick={() => navigate('/generate')}
          className="bento-card-interactive flex cursor-pointer flex-col justify-between p-6"
        >
          <div>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-main">
              맞춤형 예측번호 분석기
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              AI 가중치 커스텀 조합 생성부터 내가 고른 6개 번호의 정밀
              시뮬레이션까지 즉시 실행하세요.
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-emerald-500">
            번호 생성 및 분석 →
          </span>
        </div>
      </div>
    </div>
  );
}
export default Home;
