import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  getShortsBallGradient,
} from '../primitives';

/**
 * 모든 화·금·일 YouTube 숏츠 영상의 마지막 5초(150 프레임 @ 30fps)에 결합되는
 * hactto.com 공식 브랜드 홍보 아웃트로 시퀀스 (1080x1920)
 */
export const HacttoPromoOutro: React.FC<{
  subtitle?: string;
}> = ({ subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, durationInFrames: 18 });
  const searchBarWidth = interpolate(frame, [10, 35], [260, 860], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const domainText = 'hactto.com';
  const typedLength = Math.floor(
    interpolate(frame, [18, 48], [0, domainText.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const typedDomain = domainText.slice(0, typedLength);

  const cardsOpacity = interpolate(frame, [38, 56], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const promoBalls = [7, 14, 23, 33, 42, 45];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 50% 25%, #1e1b4b 0%, #090d16 65%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '120px 64px 110px',
        color: '#ffffff',
        fontFamily:
          '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* 배경 네온 글로우 */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 680,
          height: 680,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.32) 0%, rgba(168,85,247,0.08) 55%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* 상단 브랜드 배지 & 로고 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${logoScale})`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            padding: '14px 36px',
            borderRadius: 999,
            background: 'rgba(99, 102, 241, 0.22)',
            border: '2px solid rgba(129, 140, 248, 0.6)',
            color: '#c7d2fe',
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '0.08em',
            marginBottom: 32,
          }}
        >
          AI LOTTO ANALYTICS PLATFORM
        </div>

        <div
          style={{
            fontSize: 112,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            background:
              'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 16px 40px rgba(99,102,241,0.45)',
            lineHeight: 1.05,
          }}
        >
          HACTTO
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: '#e2e8f0',
            marginTop: 18,
          }}
        >
          데이터로 분석하는 스마트한 로또,{' '}
          <span style={{ color: '#facc15', fontWeight: 900 }}>핵또</span>
        </div>
      </div>

      {/* 중앙: 로또 볼 플로팅 & 검색창 타이핑 연출 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          gap: 44,
          zIndex: 2,
        }}
      >
        {/* 6개 로또 볼 스프링 애니메이션 */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
          }}
        >
          {promoBalls.map((num, idx) => {
            const s = spring({
              frame,
              fps,
              delay: idx * 3,
              durationInFrames: 16,
            });
            const style = getShortsBallGradient(num);
            return (
              <div
                key={num}
                style={{
                  width: 114,
                  height: 114,
                  borderRadius: '50%',
                  background: style.bg,
                  border: `4px solid ${style.border}`,
                  color: style.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 46,
                  fontWeight: 900,
                  boxShadow: '0 16px 32px rgba(0,0,0,0.45)',
                  transform: `scale(${s})`,
                }}
              >
                {num}
              </div>
            );
          })}
        </div>

        {/* 검색창 타이핑 애니메이션 (hactto.com) */}
        <div
          style={{
            width: searchBarWidth,
            height: 130,
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.92)',
            border: '4px solid #38bdf8',
            boxShadow:
              '0 0 50px rgba(56, 189, 248, 0.4), inset 0 0 24px rgba(56, 189, 248, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 44px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 48, color: '#38bdf8', fontWeight: 900 }}>
              SEARCH
            </span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.02em',
              }}
            >
              {typedDomain}
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 58,
                  background: '#facc15',
                  marginLeft: 8,
                  verticalAlign: 'middle',
                  opacity: frame % 16 < 8 ? 1 : 0,
                }}
              />
            </span>
          </div>
          <div
            style={{
              padding: '16px 34px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              fontSize: 32,
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            바로가기
          </div>
        </div>

        {/* 핵심 기능 3가지 요약 카드 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            width: '100%',
            opacity: cardsOpacity,
          }}
        >
          {[
            { title: 'AI 맞춤 번호 생성', desc: '알고리즘 가중치 분석' },
            { title: '역대 통계 & 볼 분석', desc: '핫볼·콜드볼·신뢰도' },
            { title: '로또 추첨 시뮬레이터', desc: '3D 물리 엔진 미니게임' },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: '28px 20px',
                borderRadius: 28,
                background: 'rgba(30, 41, 59, 0.78)',
                border: '2px solid rgba(148, 163, 184, 0.25)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: '#facc15',
                  marginBottom: 10,
                }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: 24, color: '#cbd5e1', fontWeight: 600 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 자막 바 */}
      <div
        style={{
          width: '100%',
          padding: '28px 36px',
          borderRadius: 28,
          background: 'rgba(2, 6, 23, 0.88)',
          border: '2px solid rgba(250, 204, 21, 0.5)',
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 800,
          color: '#fef08a',
          zIndex: 2,
        }}
      >
        {subtitle ||
          '데이터로 분석하는 스마트한 로또 · 지금 검색창에 hactto.com 검색!'}
      </div>
    </div>
  );
};
