import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils';

interface Notice {
  id: string;
  title: string;
  content: string;
  endsAt: string;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/notices`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
          setNotices(list);
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
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notices.length]);

  useEffect(() => {
    if (showDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDetail]);

  if (notices.length === 0) return null;

  const currentNotice = notices[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length);
  };

  return (
    <>
      <div className="mb-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-glass-border bg-card px-4 py-3 shadow-glass transition-colors hover:border-glass-border-strong">
        <NoticeText
          currentNotice={currentNotice}
          onClick={() => setShowDetail(true)}
        />

        {notices.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="shrink-0 cursor-pointer rounded-lg border border-glass-border bg-surface px-2.5 py-1 text-[0.72rem] font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-main"
          >
            {currentIndex + 1} / {notices.length} 다음
          </button>
        )}
      </div>

      {showDetail && (
        <div
          onClick={() => setShowDetail(false)}
          className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-overlay p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-glass-border bg-modal shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-glass-border px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary-cyan/12 px-2 py-0.5 text-[0.7rem] font-bold text-primary-cyan">
                  공지사항
                </span>
                <span className="text-base font-bold text-main">상세 안내</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-surface text-dim transition-colors hover:bg-surface-hover hover:text-main"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
              <h3 className="text-lg font-bold text-main">
                {currentNotice.title}
              </h3>
              <div className="text-[0.94rem] leading-relaxed break-all whitespace-pre-wrap text-muted">
                {currentNotice.content}
              </div>
            </div>

            <div className="flex justify-end border-t border-glass-border bg-surface/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="btn-submit rounded-xl px-5 py-2 text-[0.88rem]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
