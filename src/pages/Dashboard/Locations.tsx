import { useState, useEffect } from 'react';
import { SouthKoreaMap } from '../../components/SouthKoreaMap';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';

interface Store {
  id: number;
  episode: number;
  rank: number;
  sortOrder: number;
  shopName: string;
  shopAddress: string;
  purchaseType: string;
  region: string;
  shopLatitude: number | null;
  shopLongitude: number | null;
}

const regionNameMap: Record<string, string> = {
  Seoul: '서울',
  Busan: '부산',
  Daegu: '대구',
  Incheon: '인천',
  Gwangju: '광주',
  Daejeon: '대전',
  Ulsan: '울산',
  Sejong: '세종',
  Gyeonggi: '경기',
  Gangwon: '강원',
  'North Chungcheong': '충북',
  'South Chungcheong': '충남',
  'North Jeolla': '전북',
  'South Jeolla': '전남',
  'North Gyeongsang': '경북',
  'South Gyeongsang': '경남',
  Jeju: '제주',
};

const RANK_OPTIONS: { value: 'all' | 1 | 2; label: string }[] = [
  { value: 'all', label: '전체 등수' },
  { value: 1, label: '1등 배출점' },
  { value: 2, label: '2등 배출점' },
];

const TYPE_OPTIONS: {
  value: 'all' | '자동' | '수동' | '반자동';
  label: string;
}[] = [
  { value: 'all', label: '전체 구매방식' },
  { value: '자동', label: '자동' },
  { value: '수동', label: '수동' },
  { value: '반자동', label: '반자동' },
];

export function Locations() {
  const { appendAuth } = useApp();
  const [selectedRegion, setSelectedRegion] = useState<{
    id: string;
    name: string;
  } | null>({ id: 'seoul', name: 'Seoul' });
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rankFilter, setRankFilter] = useState<'all' | 1 | 2>('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | '자동' | '수동' | '반자동'
  >('all');
  const [rankDropdownOpen, setRankDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const [latestEpisode, setLatestEpisode] = useState<number | null>(null);
  const [episode, setEpisode] = useState<number | null>(null);

  useEffect(() => {
    const fetchLatestEpisode = async () => {
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/winning-numbers/latest`),
        );
        if (res.ok) {
          const data = await res.json();
          const maxEps = data.data?.episode || data.episode;
          if (maxEps) {
            setLatestEpisode(maxEps);
            setEpisode(maxEps);
          }
        }
      } catch (err) {
        console.error('최신 회차 로드 실패:', err);
      }
    };
    fetchLatestEpisode();
  }, [appendAuth]);

  useEffect(() => {
    if (!episode) return;
    const fetchStores = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          appendAuth(`${API_BASE_URL}/winning-numbers/${episode}/shops`),
        );
        if (!res.ok) throw new Error('API 요청 실패');

        const data = await res.json();
        const list = data.data || data;

        if (Array.isArray(list)) {
          setStores(list);
        } else {
          setStores([]);
        }
      } catch (err) {
        console.error(err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [episode, appendAuth]);

  const handleLocationClick = (regionId: string, regionName: string) => {
    if (selectedRegion?.id === regionId) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion({ id: regionId, name: regionName });
    }
  };

  const filteredStores = selectedRegion
    ? stores.filter((store) => {
        if (store.region !== regionNameMap[selectedRegion.name]) return false;
        if (rankFilter !== 'all' && store.rank !== rankFilter) return false;
        if (typeFilter !== 'all' && store.purchaseType !== typeFilter)
          return false;
        return true;
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Episode Selector */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-main sm:text-3xl">
            전국 1·2등 당첨 판매점 지도
          </h1>
          <p className="mt-1 text-sm text-muted">
            지도에서 시·도를 선택하면 해당 지역의 당첨 판매점과 카카오맵 위치를
            바로 확인할 수 있습니다.
          </p>
        </div>

        {/* Episode Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex cursor-pointer items-center gap-2 rounded-2xl border border-glass-border bg-card px-4 py-2.5 text-sm font-bold text-primary-cyan shadow-glass transition-all hover:border-primary-cyan/40"
          >
            <span>제 {episode}회 추첨 기준</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full right-0 z-[100] mt-2 max-h-[300px] min-w-[140px] overflow-y-auto rounded-2xl border border-glass-border-strong bg-modal p-1.5 shadow-2xl">
                {latestEpisode &&
                  Array.from(
                    { length: latestEpisode },
                    (_, i) => latestEpisode - i,
                  ).map((ep) => (
                    <div
                      key={ep}
                      onClick={() => {
                        setEpisode(ep);
                        setIsDropdownOpen(false);
                      }}
                      className={`cursor-pointer rounded-xl px-3 py-2 text-center text-sm transition-colors ${
                        ep === episode
                          ? 'bg-primary-cyan/10 font-bold text-primary-cyan'
                          : 'text-main hover:bg-surface-hover'
                      }`}
                    >
                      제 {ep}회
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Two-Column Bento Grid: Map (Left) + Store List (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Map Bento Card */}
        <div className="bento-card flex min-h-[420px] flex-col items-center justify-center p-6 lg:col-span-5">
          <SouthKoreaMap
            onLocationClick={handleLocationClick}
            selectedRegionId={selectedRegion?.id}
          />
        </div>

        {/* Store List Bento Card */}
        <div className="bento-card flex flex-col p-6 lg:col-span-7">
          {selectedRegion ? (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-glass-border pb-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-extrabold text-main">
                    {regionNameMap[selectedRegion.name] || selectedRegion.name}{' '}
                    배출점
                  </h2>
                  <span className="rounded-full bg-primary-cyan/10 px-2.5 py-0.5 text-xs font-bold text-primary-cyan">
                    총 {filteredStores.length}곳
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Rank Filter Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setRankDropdownOpen((prev) => !prev);
                        setTypeDropdownOpen(false);
                      }}
                      className={`inline-flex items-center gap-1.5 cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-all outline-none ${
                        rankFilter !== 'all'
                          ? 'bg-primary-cyan/15 text-primary-cyan border-primary-cyan/40 shadow-xs'
                          : 'bg-surface hover:bg-surface-hover text-main border-glass-border hover:border-glass-border-strong'
                      }`}
                    >
                      <span>
                        {
                          RANK_OPTIONS.find((opt) => opt.value === rankFilter)
                            ?.label
                        }
                      </span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          rankDropdownOpen
                            ? 'rotate-180 text-primary-cyan'
                            : rankFilter !== 'all'
                              ? 'text-primary-cyan'
                              : 'text-dim'
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {rankDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[90]"
                          onClick={() => setRankDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 z-[100] mt-1.5 min-w-[120px] rounded-xl border border-glass-border-strong bg-modal p-1 shadow-2xl animate-[fadeIn_0.15s_ease-out]">
                          {RANK_OPTIONS.map((opt) => {
                            const isSelected = rankFilter === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setRankFilter(opt.value);
                                  setRankDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-left border-none ${
                                  isSelected
                                    ? 'bg-primary-cyan/15 text-primary-cyan font-bold'
                                    : 'text-main hover:bg-surface-hover'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {isSelected && (
                                  <svg
                                    className="w-3.5 h-3.5 text-primary-cyan shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Purchase Type Filter Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setTypeDropdownOpen((prev) => !prev);
                        setRankDropdownOpen(false);
                      }}
                      className={`inline-flex items-center gap-1.5 cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-all outline-none ${
                        typeFilter !== 'all'
                          ? 'bg-primary-cyan/15 text-primary-cyan border-primary-cyan/40 shadow-xs'
                          : 'bg-surface hover:bg-surface-hover text-main border-glass-border hover:border-glass-border-strong'
                      }`}
                    >
                      <span>
                        {
                          TYPE_OPTIONS.find((opt) => opt.value === typeFilter)
                            ?.label
                        }
                      </span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          typeDropdownOpen
                            ? 'rotate-180 text-primary-cyan'
                            : typeFilter !== 'all'
                              ? 'text-primary-cyan'
                              : 'text-dim'
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {typeDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[90]"
                          onClick={() => setTypeDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 z-[100] mt-1.5 min-w-[125px] rounded-xl border border-glass-border-strong bg-modal p-1 shadow-2xl animate-[fadeIn_0.15s_ease-out]">
                          {TYPE_OPTIONS.map((opt) => {
                            const isSelected = typeFilter === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setTypeFilter(opt.value);
                                  setTypeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-left border-none ${
                                  isSelected
                                    ? 'bg-primary-cyan/15 text-primary-cyan font-bold'
                                    : 'text-main hover:bg-surface-hover'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {isSelected && (
                                  <svg
                                    className="w-3.5 h-3.5 text-primary-cyan shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Reset Filters button if either filter is active */}
                  {(rankFilter !== 'all' || typeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setRankFilter('all');
                        setTypeFilter('all');
                      }}
                      className="cursor-pointer border-none bg-transparent p-1 text-xs font-semibold text-dim hover:text-primary-cyan transition-colors"
                      title="필터 초기화"
                    >
                      초기화 ↺
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-sm text-dim">
                  판매점 정보를 불러오고 있어요...
                </div>
              ) : error ? (
                <div className="py-16 text-center text-sm text-error">
                  {error}
                </div>
              ) : filteredStores.length > 0 ? (
                <div className="grid max-h-[540px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredStores.map((store) => (
                    <div
                      key={store.id}
                      onClick={() => {
                        if (store.shopLatitude && store.shopLongitude) {
                          window.open(
                            `https://map.kakao.com/link/map/${store.shopName},${store.shopLatitude},${store.shopLongitude}`,
                            '_blank',
                          );
                        } else {
                          window.open(
                            `https://map.kakao.com/link/search/${encodeURIComponent(store.shopAddress)}`,
                            '_blank',
                          );
                        }
                      }}
                      className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-glass-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary-cyan/40 hover:bg-surface-hover"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="font-bold text-main group-hover:text-primary-cyan">
                          {store.shopName}
                        </span>
                        <div className="flex shrink-0 gap-1">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[0.7rem] font-bold ${
                              store.rank === 1
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-surface-hover text-muted'
                            }`}
                          >
                            {store.rank}등
                          </span>
                          <span className="rounded-md bg-primary-cyan/10 px-2 py-0.5 text-[0.7rem] font-bold text-primary-cyan">
                            {store.purchaseType}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs text-dim">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 shrink-0"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="line-clamp-2">
                          {store.shopAddress.trim()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-dim">
                  선택한 조건에 해당하는 당첨 지점이 없습니다.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center py-20 text-center text-sm text-dim">
              지도에서 조회할 시·도를 클릭해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
