import React, { useEffect, useState } from 'react';
import { HacttoShortsComposition } from './HacttoShortsPlayer';
import type { ShortsManifest } from './types/shorts-manifest.types';

declare global {
  interface Window {
    __setShortsRenderState?: (manifest: ShortsManifest, frame: number) => void;
    __setShortsFrame?: (frame: number) => void;
    __shortsRenderReady?: boolean;
  }
}

/**
 * GitHub Actions Headless Chromium 렌더 워커가 1080x1920 해상도로
 * 프레임을 결정론적으로 캡처하기 위한 전용 렌더 뷰포트 (`/?shortsRenderMode=1`)
 */
export const HacttoShortsHeadlessRenderer: React.FC = () => {
  const [manifest, setManifest] = useState<ShortsManifest | null>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    window.__setShortsRenderState = (m: ShortsManifest, f: number) => {
      setManifest(m);
      setFrame(f);
    };
    window.__setShortsFrame = (f: number) => {
      setFrame(f);
    };
    window.__shortsRenderReady = true;
  }, []);

  if (!manifest) {
    return (
      <div
        id="shorts-render-root"
        style={{
          width: 1080,
          height: 1920,
          background: '#020617',
          color: '#ffffff',
        }}
      />
    );
  }

  return (
    <div
      id="shorts-render-root"
      style={{
        width: 1080,
        height: 1920,
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        background: '#020617',
      }}
    >
      <HacttoShortsComposition manifest={manifest} frame={frame} />
    </div>
  );
};
