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

const SundaySceneView: React.FC<{
  manifest: ShortsManifest;
  scene: ShortsSceneManifest;
}> = ({ manifest, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rev = manifest.review;
  const winningNumbers = rev?.winningNumbers || [];
  const bonusNumber = rev?.bonusNumber || 0;
  const comparisons = rev?.gameComparisons || [];
  const phase = scene.visualData?.phase || 'WINNING_NUMBERS';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(170deg, #090d16 0%, #172554 50%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '84px 56px 84px',
        color: '#ffffff',
        fontFamily:
          '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* 상단 실제 1등 당첨번호 발표 카드 */}
      <div
        style={{
          padding: '32px 34px',
          borderRadius: 34,
          background: 'rgba(15, 23, 42, 0.9)',
          border: '3px solid rgba(56, 189, 248, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 22,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#38bdf8',
            }}
          >
            제 {manifest.episode}회 실제 1등 당첨번호
          </span>
          <span
            style={{
              padding: '8px 22px',
              borderRadius: 999,
              background: 'rgba(250, 204, 21, 0.2)',
              border: '2px solid #facc15',
              color: '#fef08a',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            SUNDAY REVIEW
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {winningNumbers.map((num, idx) => {
            const st = getShortsBallGradient(num);
            const s = spring({
              frame,
              fps,
              delay: idx * 2,
              durationInFrames: 14,
            });
            return (
              <div
                key={num}
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: '50%',
                  background: st.bg,
                  border: `3px solid ${st.border}`,
                  color: st.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 42,
                  fontWeight: 900,
                  transform: `scale(${s})`,
                }}
              >
                {num}
              </div>
            );
          })}
          <span style={{ fontSize: 42, fontWeight: 900, color: '#94a3b8' }}>
            +
          </span>
          {(() => {
            const st = getShortsBallGradient(bonusNumber);
            return (
              <div
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: '50%',
                  background: st.bg,
                  border: '4px dashed #facc15',
                  color: st.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 42,
                  fontWeight: 900,
                }}
              >
                {bonusNumber}
              </div>
            );
          })()}
        </div>

        {/* 당첨번호 핵심 통계 4종 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginTop: 24,
          }}
        >
          {[
            { label: '홀짝 비율', value: rev?.oddEvenRatio || '3:3' },
            { label: '번호 총합', value: String(rev?.sumTotal || 135) },
            { label: '저고 비율', value: rev?.highLowRatio || '3:3' },
            { label: 'AC 복잡도', value: String(rev?.acValue ?? 8) },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '14px 12px',
                borderRadius: 18,
                background:
                  phase === 'STATS_ANALYSIS'
                    ? 'rgba(56, 189, 248, 0.22)'
                    : 'rgba(30, 41, 59, 0.75)',
                border:
                  phase === 'STATS_ANALYSIS'
                    ? '2px solid #38bdf8'
                    : '1px solid rgba(148,163,184,0.25)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, color: '#94a3b8', fontWeight: 700 }}>
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 30,
                  color: '#facc15',
                  fontWeight: 900,
                  marginTop: 4,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 중앙: 금요일 추천 5조합 vs 실제 당첨번호 적중 대조표 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: '#facc15',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>금요일 핵또 추천 5조합 적중 대조</span>
          <span style={{ fontSize: 24, color: '#cbd5e1', fontWeight: 700 }}>
            노란 테두리 = 적중 / 파란 점선 = ±1 근접수
          </span>
        </div>

        {comparisons.map((g) => (
          <div
            key={g.label}
            style={{
              padding: '20px 26px',
              borderRadius: 26,
              background:
                g.matchCount > 0
                  ? 'linear-gradient(135deg, rgba(250,204,21,0.18) 0%, rgba(15,23,42,0.92) 100%)'
                  : 'rgba(15, 23, 42, 0.78)',
              border:
                g.matchCount > 0
                  ? '3px solid #facc15'
                  : '2px solid rgba(148, 163, 184, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ width: 220 }}>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: g.matchCount > 0 ? '#facc15' : '#e2e8f0',
                }}
              >
                {g.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: '#94a3b8',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {g.rankLabel}
                {g.nearMissNumbers.length > 0
                  ? ` · 근접 ${g.nearMissNumbers.length}수`
                  : ''}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              {g.numbers.map((num) => {
                const isExactMatch =
                  g.matchedNumbers.includes(num) ||
                  (g.bonusMatched && num === bonusNumber);
                const isNearMiss = g.nearMissNumbers.includes(num);
                const st = getShortsBallGradient(num);

                return (
                  <div
                    key={num}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      background: isExactMatch
                        ? st.bg
                        : isNearMiss
                          ? 'rgba(30, 58, 138, 0.85)'
                          : 'rgba(30, 41, 59, 0.65)',
                      border: isExactMatch
                        ? '5px solid #facc15'
                        : isNearMiss
                          ? '3px dashed #38bdf8'
                          : '2px solid rgba(148,163,184,0.25)',
                      color: isExactMatch
                        ? st.text
                        : isNearMiss
                          ? '#bae6fd'
                          : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 36,
                      fontWeight: 900,
                      boxShadow: isExactMatch
                        ? '0 0 28px rgba(250, 204, 21, 0.75)'
                        : 'none',
                    }}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 자막 바 & 면책 안내 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            padding: '24px 34px',
            borderRadius: 28,
            background: 'rgba(2, 6, 23, 0.9)',
            border: '2px solid rgba(56, 189, 248, 0.5)',
            fontSize: 34,
            fontWeight: 800,
            color: '#f8fafc',
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
          ※ 본 번호 추천 및 분석은 과거 통계 기반 참고용으로 실제 당첨과 전혀
          무관하며 법적 책임을 지지 않습니다.
        </div>
      </div>
    </div>
  );
};

export const SundayReviewShorts: React.FC<{
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
            <SundaySceneView manifest={manifest} scene={scene} />
          )}
        </Sequence>
      ))}
    </div>
  );
};
