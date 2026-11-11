import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';
import { LottoBalls } from '../../components/LottoBall';
import { LottoAnalysisCard } from '../../components/LottoAnalysisCard';
import type { WinningNumber } from '../../types';

export function Search() {
  const { appendAuth } = useApp();
  const [searchEpisode, setSearchEpisode] = useState('');
  const [searchResult, setSearchResult] = useState<WinningNumber | null>(null);
  const [searchError, setSearchError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allWinningNumbers, setAllWinningNumbers] = useState<WinningNumber[]>(
    [],
  );
  const [selectedEpisode, setSelectedEpisode] = useState<WinningNumber | null>(
    null,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEpisode(null);
      }
    };

    if (selectedEpisode) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedEpisode]);

  const handleSelectEpisode = async (episode: number) => {
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/winning-numbers/${episode}`),
      );
      if (res.ok) {
        const data = await res.json();
        const result = data.data || data;
        setSelectedEpisode(result as WinningNumber);
      }
    } catch (err) {
      console.error('Failed to fetch episode details:', err);
    }
  };

  useEffect(() => {
    const fetchAllWinningNumbers = async () => {
      try {
        const res = await fetch(appendAuth(`${API_BASE_URL}/winning-numbers`));
        if (res.ok) {
          const data = await res.json();
          const result = (data.data || data || []) as WinningNumber[];
          const sorted = [...result].sort((a, b) => b.episode - a.episode);
          const drawnResults = sorted.filter((wn) => wn.isDrawn === true);
          setAllWinningNumbers(drawnResults);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWinningNumbers();
  }, [appendAuth]);

  const handleSearchEpisode = async (e: FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    if (!searchEpisode.trim() || isNaN(Number(searchEpisode))) {
      setSearchError('올바른 회차 번호를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/winning-numbers/${searchEpisode}`),
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`${searchEpisode}회차 당첨번호가 존재하지 않습니다.`);
        }
        throw new Error('회차 번호 검색 중 오류가 발생했습니다.');
      }
      const data = await res.json();
      const result = data.data || data;
      if (!result || !result.isDrawn) {
        throw new Error(
          `${searchEpisode}회차는 아직 추첨이 진행되지 않았습니다.`,
        );
      }
      setSearchResult(result as WinningNumber);
    } catch (err) {
      const error = err as Error;
      setSearchError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-main sm:text-3xl">
          역대 당첨번호 조회
        </h1>
        <p className="mt-1 text-sm text-muted">
          원하는 회차를 검색하거나 최근 회차를 클릭해 상세 패턴 분석을
          확인하세요.
        </p>
      </div>

      {/* Search Bar Bento Card */}
      <form
        onSubmit={handleSearchEpisode}
        className="bento-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5"
      >
        <input
          type="text"
          className="input-glow flex-1"
          placeholder="검색할 회차 번호 입력 (예: 1100)"
          value={searchEpisode}
          onChange={(e) => setSearchEpisode(e.target.value)}
          disabled={submitting}
        />
        <button
          className="btn-submit shrink-0 px-6 py-3"
          type="submit"
          disabled={submitting}
        >
          {submitting ? '검색 중...' : '회차 조회'}
        </button>
      </form>

      {searchError && (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          ⚠ {searchError}
        </div>
      )}

      {searchResult && (
        <div
          onClick={() => handleSelectEpisode(searchResult.episode)}
          className="bento-card-interactive cursor-pointer border-primary-cyan/30 bg-primary-cyan/5 p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-lg bg-primary-cyan px-3 py-1 text-xs font-extrabold text-white">
              제 {searchResult.episode}회 검색 결과
            </span>
            <span className="text-xs font-semibold text-primary-cyan">
              상세 분석 리포트 보기 →
            </span>
          </div>
          <LottoBalls numbers={searchResult.numbers} />
        </div>
      )}

      {/* Episode List Bento Card */}
      <div className="bento-card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-glass-border px-6 py-4">
          <h2 className="text-base font-bold text-main">
            최근 20개 회차 당첨 내역
          </h2>
          <span className="text-xs text-dim">
            회차를 클릭하면 심층 분석 모달이 열립니다
          </span>
        </div>

        <div className="divide-y divide-glass-border">
          {loading ? (
            <div className="py-16 text-center text-sm text-dim">
              당첨 내역을 불러오고 있어요...
            </div>
          ) : allWinningNumbers.length === 0 ? (
            <div className="py-16 text-center text-sm text-dim">
              불러온 내역이 없습니다.
            </div>
          ) : (
            allWinningNumbers.slice(0, 20).map((wn) => (
              <div
                key={wn.episode}
                onClick={() => handleSelectEpisode(wn.episode)}
                className="flex cursor-pointer flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-surface sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex min-w-[84px] items-center justify-center rounded-xl bg-primary-cyan/10 px-3 py-1.5 font-display text-sm font-extrabold text-primary-cyan">
                    제 {wn.episode}회
                  </span>
                  {wn.analysis && (
                    <span className="text-xs text-dim">
                      합계 {wn.analysis.sum} · 홀짝 {wn.analysis.odd}:
                      {wn.analysis.even}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <LottoBalls numbers={wn.numbers} />
                  <span className="hidden text-xs font-semibold text-muted sm:inline-block">
                    상세 →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedEpisode &&
        createPortal(
          <div
            className="admin-modal-overlay"
            onClick={() => setSelectedEpisode(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[88vh] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl border border-glass-border bg-modal shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-glass-border px-6 py-4">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-main">
                    제 {selectedEpisode.episode}회 당첨 결과 상세 분석
                  </h2>
                  <p className="text-xs text-muted">
                    당첨 번호 조합 및 통계 데이터를 바탕으로 분석한
                    리포트입니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEpisode(null)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-surface text-dim transition-colors hover:bg-surface-hover hover:text-main"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <LottoAnalysisCard
                  numbers={selectedEpisode.numbers}
                  analysis={selectedEpisode.analysis}
                />
              </div>

              <div className="border-t border-glass-border bg-surface/50 px-6 py-4">
                <button
                  type="button"
                  className="btn-submit w-full py-2.5"
                  onClick={() => setSelectedEpisode(null)}
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
export default Search;
