import React, { useEffect, useRef, useState } from 'react';
import { RemotionFrameProvider } from './primitives';
import type { ShortsManifest } from './types/shorts-manifest.types';
import { TuesdayTriviaShorts } from './compositions/TuesdayTriviaShorts';
import { FridayRecommendShorts } from './compositions/FridayRecommendShorts';
import { SundayReviewShorts } from './compositions/SundayReviewShorts';

export const HacttoShortsComposition: React.FC<{
  manifest: ShortsManifest;
  frame: number;
}> = ({ manifest, frame }) => {
  const fps = manifest.fps || 30;
  const totalFrames = Math.max(manifest.totalFrames || 900, 150);

  return (
    <RemotionFrameProvider
      value={{
        frame,
        fps,
        width: 1080,
        height: 1920,
        durationInFrames: totalFrames,
      }}
    >
      {manifest.dayType === 'TUE_TRIVIA' && (
        <TuesdayTriviaShorts manifest={manifest} />
      )}
      {manifest.dayType === 'FRI_RECOMMEND' && (
        <FridayRecommendShorts manifest={manifest} />
      )}
      {manifest.dayType === 'SUN_REVIEW' && (
        <SundayReviewShorts manifest={manifest} />
      )}
    </RemotionFrameProvider>
  );
};

/**
 * AdminPage.tsx 에 내장되는 실시간 9:16 숏츠 프리뷰 플레이어 (@remotion/player 호환)
 * - 서버 MP4 렌더링 대기 시간(0초) 없이 브라우저에서 즉시 1080x1920 컴포지션과 TTS 음성을 동기화 재생
 * - 자막/나레이션 수정 시 0.1초 만에 화면에 즉시 반영
 */
export const HacttoShortsPlayer: React.FC<{
  manifest: ShortsManifest;
  scale?: number;
}> = ({ manifest, scale = 0.32 }) => {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeSceneIdRef = useRef<string | null>(null);

  const fps = manifest.fps || 30;
  const totalFrames = Math.max(manifest.totalFrames || 900, 150);

  // Playback frame loop (30fps deterministic step)
  useEffect(() => {
    if (!isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    const frameInterval = 1000 / fps;

    const tick = (now: number) => {
      const elapsed = now - lastTimestamp;
      if (elapsed >= frameInterval) {
        const steps = Math.max(1, Math.floor(elapsed / frameInterval));
        lastTimestamp = now - (elapsed % frameInterval);
        setFrame((prev) => {
          if (prev + steps >= totalFrames) {
            setIsPlaying(false);
            return 0;
          }
          return prev + steps;
        });
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, fps, totalFrames]);

  // Scene-level TTS audio synchronization
  useEffect(() => {
    if (!isPlaying || isMuted) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    const currentScene = manifest.scenes.find(
      (s) => frame >= s.startFrame && frame < s.startFrame + s.durationInFrames,
    );

    if (!currentScene) return;

    if (activeSceneIdRef.current !== currentScene.id) {
      activeSceneIdRef.current = currentScene.id;
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const src = currentScene.audioBase64
        ? `data:audio/mp3;base64,${currentScene.audioBase64}`
        : currentScene.audioUrl || '';

      if (src) {
        const audio = new Audio(src);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
    }
  }, [frame, isPlaying, isMuted, manifest.scenes]);

  const currentSeconds = (frame / fps).toFixed(1);
  const totalSeconds = (totalFrames / fps).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 9:16 Viewport Container */}
      <div
        style={{
          width: Math.round(1080 * scale),
          height: Math.round(1920 * scale),
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '2px solid rgba(99, 102, 241, 0.45)',
          background: '#020617',
        }}
      >
        <div
          style={{
            width: 1080,
            height: 1920,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <HacttoShortsComposition manifest={manifest} frame={frame} />
        </div>
      </div>

      {/* Player Controls */}
      <div className="w-full max-w-[360px] bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              activeSceneIdRef.current = null;
              setIsPlaying((p) => !p);
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
          >
            {isPlaying ? '일시정지' : '프리뷰 재생'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              activeSceneIdRef.current = null;
              setFrame(Math.max(0, totalFrames - 150));
            }}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition"
          >
            마지막 5초 홍보 아웃트로 보기
          </button>

          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
          >
            {isMuted ? '음소거 해제' : '음소거'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={frame}
            onChange={(e) => {
              setIsPlaying(false);
              activeSceneIdRef.current = null;
              setFrame(Number(e.target.value));
            }}
            className="flex-1 accent-indigo-500 cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
            {currentSeconds}s / {totalSeconds}s
          </span>
        </div>
      </div>
    </div>
  );
};
