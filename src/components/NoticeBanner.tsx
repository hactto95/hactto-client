import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils';

interface Notice {
  id: number | string;
  title: string;
  content: string;
  endsAt: string;
}

const POPUP_HIDE_DATE_KEY = 'hactto_hide_notice_popup_date';
const BANNER_HIDE_DATE_KEY = 'hactto_hide_notice_banner_date';

function getLocalTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDismissedIdsToday(storageKey: string): string[] {
  const today = getLocalTodayString();
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.date === today && Array.isArray(parsed.dismissedIds)) {
      return parsed.dismissedIds.map((id: unknown) => String(id));
    }
  } catch {
    // Legacy format where only YYYY-MM-DD was stored
  }
  return [];
}

function areAllNoticesDismissedToday(
  storageKey: string,
  noticeList: Notice[],
): boolean {
  if (noticeList.length === 0) return true;
  const dismissedIds = getDismissedIdsToday(storageKey);
  if (dismissedIds.length === 0) return false;
  return noticeList.every((n) => dismissedIds.includes(String(n.id)));
}

function saveDismissedNoticesToday(
  storageKey: string,
  noticeList: Notice[],
): void {
  const today = getLocalTodayString();
  const existing = getDismissedIdsToday(storageKey);
  const merged = Array.from(
    new Set([...existing, ...noticeList.map((n) => String(n.id))]),
  );
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      date: today,
      dismissedIds: merged,
    }),
  );
}

function NoticeText({
  currentNotice,
  onClick,
}: {
  currentNotice: Notice;
  onClick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [fade, setFade] = useState(true);
  const [displayNotice, setDisplayNotice] = useState(currentNotice);

  useEffect(() => {
    const fadeOutTimeout = setTimeout(() => {
      setFade(false);
    }, 0);

    const swapTimeout = setTimeout(() => {
      setDisplayNotice(currentNotice);
      setFade(true);
    }, 220);

    return () => {
      clearTimeout(fadeOutTimeout);
      clearTimeout(swapTimeout);
    };
  }, [currentNotice]);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const isOverflowing =
          textRef.current.offsetWidth > containerRef.current.offsetWidth;
        setShouldScroll(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [displayNotice]);

  return (
    <div
      onClick={onClick}
      className={`flex flex-1 cursor-pointer items-center gap-2.5 overflow-hidden transition-opacity duration-200 ${
        fade ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="shrink-0 rounded-md bg-primary-cyan/12 px-2 py-0.5 text-[0.7rem] font-bold tracking-wide text-primary-cyan">
        공지
      </span>

      <span className="shrink-0 text-[0.85rem] font-bold text-main">
        {displayNotice.title}
      </span>

      <span className="shrink-0 text-xs text-dim/40">·</span>

      <div
        ref={containerRef}
        className={`relative flex w-full overflow-hidden ${
          shouldScroll
            ? 'marquee-container [mask-image:linear-gradient(to_right,transparent_0%,black_5%,black_95%,transparent_100%)]'
            : ''
        }`}
      >
        <div
          className={`inline-flex whitespace-nowrap ${
            shouldScroll ? 'marquee-content gap-[50px]' : 'gap-0'
          }`}
        >
          <span ref={textRef} className="text-[0.84rem] text-muted">
            {displayNotice.content}
          </span>
          {shouldScroll && (
            <span className="text-[0.84rem] text-muted" aria-hidden="true">
              {displayNotice.content}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function NoticeBanner() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [modalIndex, setModalIndex] = useState(0);
  const [modalMode, setModalMode] = useState<
    'AUTO_POPUP' | 'BANNER_DETAIL' | null
  >(null);
  const [isBannerHiddenToday, setIsBannerHiddenToday] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/notices`);
        if (res.ok) {
          const data = await res.json();
          const list: Notice[] = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
          setNotices(list);

          setIsBannerHiddenToday(
            areAllNoticesDismissedToday(BANNER_HIDE_DATE_KEY, list),
          );

          if (list.length > 0) {
            const isPopupHiddenToday = areAllNoticesDismissedToday(
              POPUP_HIDE_DATE_KEY,
              list,
            );

            if (!isPopupHiddenToday) {
              setModalIndex(0);
              setModalMode('AUTO_POPUP');
            }
          }
        }
      } catch (err) {
        console.error('공지사항을 불러오지 못했습니다:', err);
      }
    };

    fetchNotices();

    const handleRefresh = () => fetchNotices();
    window.addEventListener('refresh-notices', handleRefresh);
    return () => window.removeEventListener('refresh-notices', handleRefresh);
  }, []);

  useEffect(() => {
    if (notices.length <= 1) return;

    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % notices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notices.length]);

  useEffect(() => {
    if (modalMode !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalMode]);

  if (notices.length === 0) return null;

  const safeBannerIndex = bannerIndex < notices.length ? bannerIndex : 0;
  const safeModalIndex = modalIndex < notices.length ? modalIndex : 0;
  const currentBannerNotice = notices[safeBannerIndex];
  const currentModalNotice = notices[safeModalIndex];

  const handleBannerNext = () => {
    setBannerIndex((prev) => (prev + 1) % notices.length);
  };

  const handleHideBannerToday = () => {
    saveDismissedNoticesToday(BANNER_HIDE_DATE_KEY, notices);
    setIsBannerHiddenToday(true);
  };

  const handleOpenFromBanner = () => {
    setModalIndex(safeBannerIndex);
    setModalMode('BANNER_DETAIL');
  };

  const handleCloseModal = () => {
    setModalMode(null);
  };

  const handleHidePopupToday = () => {
    saveDismissedNoticesToday(POPUP_HIDE_DATE_KEY, notices);
    setModalMode(null);
  };

  const handlePrevModalNotice = () => {
    setModalIndex((prev) => (prev - 1 + notices.length) % notices.length);
  };

  const handleNextModalNotice = () => {
    setModalIndex((prev) => (prev + 1) % notices.length);
  };

  return (
    <>
      {/* PC Top Banner (hidden on mobile/tablet < 1024px) */}
      {!isBannerHiddenToday && (
        <div className="mb-6 hidden w-full items-center justify-between gap-3 rounded-2xl border border-glass-border bg-card px-4 py-3 shadow-glass transition-colors hover:border-glass-border-strong lg:flex">
          <NoticeText
            currentNotice={currentBannerNotice}
            onClick={handleOpenFromBanner}
          />

          <div className="flex shrink-0 items-center gap-2">
            {notices.length > 1 && (
              <button
                type="button"
                onClick={handleBannerNext}
                className="shrink-0 cursor-pointer rounded-lg border border-glass-border bg-surface px-2.5 py-1 text-[0.72rem] font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-main"
              >
                {safeBannerIndex + 1} / {notices.length} 다음
              </button>
            )}

            <button
              type="button"
              onClick={handleHideBannerToday}
              className="shrink-0 cursor-pointer rounded-lg border border-glass-border bg-surface px-2.5 py-1 text-[0.72rem] font-semibold text-dim transition-colors hover:bg-surface-hover hover:text-main"
              title="오늘 하루 상단 배너 숨기기"
            >
              오늘 하루 보지 않기
            </button>
          </div>
        </div>
      )}

      {/* Entry Popup Modal & Banner Detail Modal (PC & Mobile) */}
      {modalMode !== null && currentModalNotice && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-overlay p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-glass-border bg-modal shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-glass-border px-6 py-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-md bg-primary-cyan/12 px-2 py-0.5 text-[0.7rem] font-bold text-primary-cyan">
                  공지사항
                </span>
                <span className="truncate text-base font-bold text-main">
                  {currentModalNotice.title}
                </span>
              </div>

              {notices.length > 1 && (
                <div className="flex shrink-0 items-center gap-1 rounded-xl border border-glass-border bg-surface px-2 py-1">
                  <button
                    type="button"
                    onClick={handlePrevModalNotice}
                    className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-xs font-bold text-muted transition-colors hover:text-main"
                    aria-label="이전 공지"
                  >
                    이전
                  </button>
                  <span className="px-1 text-[0.72rem] font-semibold text-dim">
                    {safeModalIndex + 1} / {notices.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextModalNotice}
                    className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-xs font-bold text-muted transition-colors hover:text-main"
                    aria-label="다음 공지"
                  >
                    다음
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto p-6">
              <div className="text-[0.94rem] leading-relaxed break-all whitespace-pre-wrap text-muted">
                {currentModalNotice.content}
              </div>
            </div>

            <div
              className={`flex items-center gap-3 border-t border-glass-border bg-surface/50 px-6 py-3.5 ${
                modalMode === 'AUTO_POPUP' ? 'justify-between' : 'justify-end'
              }`}
            >
              {modalMode === 'AUTO_POPUP' && (
                <button
                  type="button"
                  onClick={handleHidePopupToday}
                  className="cursor-pointer rounded-xl border border-glass-border bg-surface px-3.5 py-2 text-[0.82rem] font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-main"
                >
                  오늘 하루 보지 않기
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseModal}
                className="btn-submit rounded-xl px-5 py-2 text-[0.88rem]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
