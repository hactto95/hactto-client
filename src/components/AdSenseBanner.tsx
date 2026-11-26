import React, { useEffect, useRef, useState } from 'react';

interface AdSenseBannerProps {
  client?: string;
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
  fallbackVariant?: 'default' | 'minigame';
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AdFallback: React.FC<{
  format: string;
  variant?: 'default' | 'minigame';
}> = ({ format, variant = 'default' }) => {
  const isVertical = format === 'vertical' || format === 'rectangle';
  const isMinigame = variant === 'minigame';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(
      isMinigame ? '/minigame' : '/generate',
      '_blank',
      'noopener,noreferrer',
    );
  };

  if (isVertical) {
    if (isMinigame) {
      return (
        <div
          className="ad-fallback-container ad-fallback-vertical ad-fallback-minigame"
          onClick={handleClick}
        >
          <div className="ad-title-wrap">
            <div className="ad-subtitle">DAILY REWARD MISSION</div>
            <div className="ad-title">Mini Game</div>
            <div className="ad-badge">매일 최대 40 HON</div>
          </div>

          <div className="ad-minigame-cards">
            <div className="ad-minigame-chip chip-1">
              <span className="chip-icon">
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              <span className="chip-label">지식 퀴즈</span>
            </div>
            <div className="ad-minigame-chip chip-2">
              <span className="chip-icon">
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
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <span className="chip-label">메모리 매치</span>
            </div>
            <div className="ad-minigame-chip chip-3">
              <span className="chip-icon">
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
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </span>
              <span className="chip-label">번호 추리</span>
            </div>
            <div className="ad-minigame-chip chip-4">
              <span className="chip-icon">
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
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              <span className="chip-label">로또 캐처</span>
            </div>
          </div>

          <div className="ad-desc">
            4종 미니게임 올클리어하고{'\n'}
            <strong>무료 HON 보상</strong>을 받아가세요!
          </div>
          <button type="button" className="ad-button" onClick={handleClick}>
            미니게임 도전 →
          </button>
        </div>
      );
    }

    return (
      <div
        className="ad-fallback-container ad-fallback-vertical"
        onClick={handleClick}
      >
        <div className="ad-title-wrap">
          <div className="ad-subtitle">AI LOTTO ANALYTICS</div>
          <div className="ad-title">Hactto</div>
          <div className="ad-badge">GRAND OPEN</div>
        </div>

        <div className="ad-balls-container">
          <div className="ad-ball ball-1">7</div>
          <div className="ad-ball ball-2">14</div>
          <div className="ad-ball ball-3">25</div>
          <div className="ad-ball ball-4">32</div>
          <div className="ad-ball ball-5">38</div>
          <div className="ad-ball ball-6">45</div>
        </div>

        <div className="ad-desc">
          AI 패턴 분석과 가중치 필터링으로{'\n'}
          <strong>더 스마트한 예측</strong>을 시작해 보세요.
        </div>
        <button type="button" className="ad-button" onClick={handleClick}>
          분석하러 가기 →
        </button>
      </div>
    );
  }

  return (
    <div
      className="ad-fallback-container ad-fallback-horizontal"
      onClick={handleClick}
    >
      <div className="ad-left">
        <span className="ad-logo">Hactto</span>
        <div className="ad-divider" />
        <div className="ad-text-content">
          <span className="ad-tagline">
            차세대 로또 분석 <span>Hactto</span> GRAND OPEN!
          </span>
          <span className="ad-subtag">AI 하이퍼 파라미터 분석 가동 중</span>
        </div>
      </div>
      <div className="ad-right">
        <div className="ad-mini-balls">
          <div className="ad-mini-ball b1" />
          <div className="ad-mini-ball b2" />
          <div className="ad-mini-ball b3" />
        </div>
        <button type="button" className="ad-button" onClick={handleClick}>
          바로가기
        </button>
      </div>
    </div>
  );
};

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  client = 'ca-pub-XXXXXXXXXXXXXXXX',
  slot,
  format = 'vertical',
  responsive = 'true',
  style = { display: 'block', width: '100%', height: '100%' },
  fallbackVariant = 'default',
}) => {
  const initialized = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const isPlaceholderClient = client.includes('XXXX');
  const [adFilled, setAdFilled] = useState(false);

  useEffect(() => {
    if (isPlaceholderClient || initialized.current) return;

    let retries = 0;
    const maxRetries = 5;

    const initAd = () => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          const insEl = insRef.current;
          const hasWidth =
            insEl &&
            (insEl.clientWidth > 0 ||
              (insEl.parentElement && insEl.parentElement.clientWidth > 0));

          if (!hasWidth) {
            if (retries < maxRetries) {
              retries++;
              setTimeout(initAd, 200);
            }
            return;
          }

          (window.adsbygoogle = window.adsbygoogle || []).push({});
          initialized.current = true;
        }
      } catch (err) {
        console.error('AdSense initialization error:', err);
      }
    };

    const timer = setTimeout(initAd, 150);

    // Observe data-ad-status changes on <ins> so we only reveal the ad slot when actually filled
    const insEl = insRef.current;
    let observer: MutationObserver | null = null;
    if (insEl && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        const status = insEl.getAttribute('data-ad-status');
        const hasIframe = insEl.getElementsByTagName('iframe').length > 0;
        if (status === 'filled' && hasIframe) {
          setAdFilled(true);
        }
      });
      observer.observe(insEl, {
        attributes: true,
        attributeFilter: ['data-ad-status'],
        childList: true,
      });
    }

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [slot, isPlaceholderClient]);

  // When using placeholder publisher ID, render the fallback banner directly
  if (isPlaceholderClient) {
    return <AdFallback format={format} variant={fallbackVariant} />;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[20px]">
      {!adFilled && <AdFallback format={format} variant={fallbackVariant} />}
      <ins
        ref={insRef}
        className={`adsbygoogle transition-opacity duration-300 ${
          adFilled
            ? 'opacity-100 relative z-10'
            : 'opacity-0 pointer-events-none absolute inset-0'
        }`}
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};
