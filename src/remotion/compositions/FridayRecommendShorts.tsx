import React from 'react';
import {
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  getShortsBallGradient,
} from '../primitives';
import type {
  ShortsManifest,
  ShortsSceneManifest,
} from '../types/shorts-manifest.types';
import { HacttoPromoOutro } from '../components/HacttoPromoOutro';

const FridaySceneView: React.FC<{
  manifest: ShortsManifest;
  scene: ShortsSceneManifest;
}> = ({ manifest, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rec = manifest.recommendation;
  const games = rec?.recommendedGames || [];
  const bestLabel = rec?.bestPickGame?.label || '게임 A';
  const activeGameIndex =
    typeof scene.visualData?.gameIndex === 'number'
      ? scene.visualData.gameIndex
      : -1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(170deg, #090d16 0%, #1e1b4b 50%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '88px 56px 88px',
        color: '#ffffff',
        fontFamily:
          '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* 상단 타이틀 & 회차 배지 */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              background: 'rgba(56, 189, 248, 0.2)',
              border: '2px solid #38bdf8',
              fontSize: 28,
              fontWeight: 800,
              color: '#bae6fd',
            }}
          >
            FRIDAY AI RECOMMENDATION
          </span>
          <span
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              background: 'rgba(250, 204, 21, 0.2)',
              border: '2px solid #facc15',
              fontSize: 28,
              fontWeight: 800,
              color: '#fef08a',
            }}
          >
            제 {manifest.episode}회 로또
          </span>
        </div>

        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            lineHeight: 1.25,
            color: '#ffffff',
          }}
        >
          핵또 AI 알고리즘 추천{' '}
          <span style={{ color: '#facc15' }}>5조합 공개</span>
        </div>

        {/* 핫볼 / 콜드볼 요약 바 */}
        <div
          style={{
            display: 'flex',
            gap: 18,
            marginTop: 22,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: 22,
              background: 'rgba(244, 63, 94, 0.16)',
              border: '2px solid rgba(251, 113, 133, 0.45)',
              fontSize: 26,
              fontWeight: 700,
              color: '#fecdd3',
            }}
          >
            최근 HOT 볼:{' '}
            {(rec?.recentHotNumbers || []).slice(0, 4).join(', ') || '집계 중'}
          </div>
          <div
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: 22,
              background: 'rgba(56, 189, 248, 0.16)',
              border: '2px solid rgba(56, 189, 248, 0.45)',
              fontSize: 26,
              fontWeight: 700,
              color: '#bae6fd',
            }}
          >
            미출현 COLD 볼:{' '}
            {(rec?.recentColdNumbers || []).slice(0, 4).join(', ') || '집계 중'}
          </div>
        </div>
      </div>

      {/* 중앙 5조합 (게임 A ~ E) 리스트 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {games.map((g, idx) => {
          const isCurrentActive =
            activeGameIndex === idx ||
            scene.visualData?.phase === 'SUMMARY_CAPTURE';
          const isBestPick = g.label === bestLabel;
          const rowScale =
            activeGameIndex === idx
              ? spring({ frame, fps, durationInFrames: 14 })
              : 1;

          return (
            <div
              key={g.label}
              style={{
                padding: '24px 30px',
                borderRadius: 30,
                background: isBestPick
                  ? 'linear-gradient(135deg, rgba(250,204,21,0.22) 0%, rgba(30,41,59,0.92) 100%)'
                  : isCurrentActive
                    ? 'rgba(30, 41, 59, 0.95)'
                    : 'rgba(15, 23, 42, 0.72)',
                border: isBestPick
                  ? '4px solid #facc15'
                  : isCurrentActive
                    ? '3px solid #38bdf8'
                    : '2px solid rgba(148, 163, 184, 0.25)',
                boxShadow:
                  isBestPick || activeGameIndex === idx
                    ? '0 16px 40px rgba(0, 0, 0, 0.45)'
                    : 'none',
                transform: `scale(${rowScale})`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      color: isBestPick ? '#facc15' : '#38bdf8',
                    }}
                  >
                    {g.label}
                  </span>
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: '#cbd5e1',
                    }}
                  >
                    {g.sourceName}
                  </span>
                </div>
                {isBestPick && (
                  <span
                    style={{
                      padding: '6px 20px',
                      borderRadius: 999,
                      background: '#facc15',
                      color: '#0f172a',
                      fontSize: 24,
                      fontWeight: 900,
                    }}
                  >
                    AI ONE-PICK
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                {g.numbers.map((num, bIdx) => {
                  const ballStyle = getShortsBallGradient(num);
                  const ballScale =
                    activeGameIndex === idx
                      ? spring({
                          frame,
                          fps,
                          delay: bIdx * 2,
                          durationInFrames: 12,
                        })
                      : 1;
                  return (
                    <div
                      key={num}
                      style={{
                        width: 118,
                        height: 118,
                        borderRadius: '50%',
                        background: ballStyle.bg,
                        border: `3px solid ${ballStyle.border}`,
                        color: ballStyle.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 44,
                        fontWeight: 900,
                        transform: `scale(${ballScale})`,
                        boxShadow: '0 10px 22px rgba(0,0,0,0.35)',
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 자막 바 & 면책 안내 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            padding: '24px 34px',
            borderRadius: 28,
            background: 'rgba(2, 6, 23, 0.9)',
            border: '2px solid rgba(250, 204, 21, 0.5)',
            fontSize: 34,
            fontWeight: 800,
            color: '#fef08a',
            textAlign: 'center',
            lineHeight: 1.38,
            wordBreak: 'keep-all',
          }}
        >
          {scene.subtitle}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 600,
            color: '#94a3b8',
          }}
        >
          ※ 본 번호 추천은 과거 통계 기반 단순 참고용으로 실제 당첨과 전혀
          무관하며 법적 책임을 지지 않습니다.
        </div>
      </div>
    </div>
  );
};

export const FridayRecommendShorts: React.FC<{
  manifest: ShortsManifest;
}> = ({ manifest }) => {
  return (
    <div style={{ width: 1080, height: 1920, position: 'relative' }}>
      {manifest.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={scene.durationInFrames}
        >
          {scene.type === 'OUTRO' ? (
            <HacttoPromoOutro subtitle={scene.subtitle} />
          ) : (
            <FridaySceneView manifest={manifest} scene={scene} />
          )}
        </Sequence>
      ))}
    </div>
  );
};
