import React from 'react';
import {
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from '../primitives';
import type {
  ShortsManifest,
  ShortsSceneManifest,
} from '../types/shorts-manifest.types';
import { HacttoPromoOutro } from '../components/HacttoPromoOutro';

const TriviaSceneView: React.FC<{
  manifest: ShortsManifest;
  scene: ShortsSceneManifest;
}> = ({ manifest, scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const trivia = manifest.trivia;
  const phase = scene.visualData?.phase || 'QUESTION';

  const cardScale = spring({ frame, fps, durationInFrames: 16 });
  const countdownRemaining = Math.max(
    1,
    3 - Math.floor((frame / Math.max(durationInFrames, 1)) * 3),
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(165deg, #0f172a 0%, #1e1b4b 52%, #090d16 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '100px 64px 96px',
        color: '#ffffff',
        fontFamily:
          '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* 상단 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            padding: '14px 32px',
            borderRadius: 999,
            background: 'rgba(99, 102, 241, 0.25)',
            border: '2px solid #818cf8',
            fontSize: 30,
            fontWeight: 800,
            color: '#e0e7ff',
          }}
        >
          {trivia?.categoryLabel || '로또 재미있는 상식'}
        </div>
        <div
          style={{
            padding: '14px 30px',
            borderRadius: 999,
            background: 'rgba(250, 204, 21, 0.16)',
            border: '2px solid #facc15',
            fontSize: 28,
            fontWeight: 800,
            color: '#fde047',
          }}
        >
          HACTTO 로또 상식 #{manifest.episode}
        </div>
      </div>

      {/* 중앙 퀴즈 / 정답 / 해설 카드 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* 질문 카드 */}
        <div
          style={{
            padding: '48px 44px',
            borderRadius: 40,
            background: 'rgba(30, 41, 59, 0.86)',
            border: '3px solid rgba(148, 163, 184, 0.3)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: '#38bdf8',
              }}
            >
              {phase === 'QUESTION'
                ? 'QUIZ · 3초 안에 맞춰보세요!'
                : '정답 & 핵심 팩트'}
            </span>
            {phase === 'QUESTION' && (
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 44,
                  fontWeight: 900,
                  color: '#fff',
                  boxShadow: '0 0 28px rgba(244,63,94,0.6)',
                }}
              >
                {countdownRemaining}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              lineHeight: 1.4,
              color: '#f8fafc',
              wordBreak: 'keep-all',
            }}
          >
            {trivia?.question}
          </div>
        </div>

        {/* 보기 4지선다 또는 해설 박스 */}
        {phase !== 'EXPLANATION' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 24,
            }}
          >
            {(trivia?.options || []).map((opt, idx) => {
              const isAnswer =
                phase === 'ANSWER' &&
                String(opt).trim() === String(trivia?.answer).trim();
              return (
                <div
                  key={`${opt}-${idx}`}
                  style={{
                    padding: '34px 28px',
                    borderRadius: 28,
                    background: isAnswer
                      ? 'linear-gradient(135deg, #facc15 0%, #eab308 100%)'
                      : 'rgba(15, 23, 42, 0.85)',
                    border: isAnswer
                      ? '4px solid #fef08a'
                      : '2px solid rgba(148, 163, 184, 0.35)',
                    color: isAnswer ? '#0f172a' : '#e2e8f0',
                    fontSize: 38,
                    fontWeight: 900,
                    textAlign: 'center',
                    boxShadow: isAnswer
                      ? '0 0 44px rgba(250, 204, 21, 0.55)'
                      : 'none',
                  }}
                >
                  {idx + 1}. {opt}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: '44px 40px',
              borderRadius: 36,
              background:
                'linear-gradient(145deg, rgba(30,27,75,0.92), rgba(15,23,42,0.95))',
              border: '3px solid #facc15',
              boxShadow: '0 0 45px rgba(250, 204, 21, 0.22)',
              opacity: interpolate(frame, [0, 12], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: '#facc15',
                marginBottom: 18,
              }}
            >
              {trivia?.funFactTitle}
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 600,
                lineHeight: 1.55,
                color: '#e2e8f0',
                wordBreak: 'keep-all',
              }}
            >
              {trivia?.explanation}
            </div>
          </div>
        )}
      </div>

      {/* 하단 자막 바 */}
      <div
        style={{
          padding: '28px 36px',
          borderRadius: 28,
          background: 'rgba(2, 6, 23, 0.88)',
          border: '2px solid rgba(56, 189, 248, 0.45)',
          fontSize: 36,
          fontWeight: 800,
          color: '#f8fafc',
          textAlign: 'center',
          lineHeight: 1.4,
          wordBreak: 'keep-all',
        }}
      >
        {scene.subtitle}
      </div>
    </div>
  );
};

export const TuesdayTriviaShorts: React.FC<{
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
            <TriviaSceneView manifest={manifest} scene={scene} />
          )}
        </Sequence>
      ))}
    </div>
  );
};
