/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';

interface RemotionFrameContextValue {
  frame: number;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

const RemotionFrameContext = createContext<RemotionFrameContextValue>({
  frame: 0,
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 1200,
});

export const RemotionFrameProvider: React.FC<{
  value: RemotionFrameContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <RemotionFrameContext.Provider value={value}>
    {children}
  </RemotionFrameContext.Provider>
);

export function useCurrentFrame(): number {
  return useContext(RemotionFrameContext).frame;
}

export function useVideoConfig() {
  const ctx = useContext(RemotionFrameContext);
  return {
    fps: ctx.fps,
    width: ctx.width,
    height: ctx.height,
    durationInFrames: ctx.durationInFrames,
  };
}

export const Sequence: React.FC<{
  from: number;
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ from, durationInFrames, children }) => {
  const parent = useContext(RemotionFrameContext);
  const relativeFrame = parent.frame - from;

  if (relativeFrame < 0 || relativeFrame >= durationInFrames) {
    return null;
  }

  return (
    <RemotionFrameContext.Provider
      value={{
        ...parent,
        frame: relativeFrame,
        durationInFrames,
      }}
    >
      {children}
    </RemotionFrameContext.Provider>
  );
};

export function interpolate(
  input: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options?: { extrapolateLeft?: 'clamp'; extrapolateRight?: 'clamp' },
): number {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;
  if (inMax === inMin) return outMax;

  let ratio = (input - inMin) / (inMax - inMin);
  if (options?.extrapolateLeft === 'clamp' && ratio < 0) ratio = 0;
  if (options?.extrapolateRight === 'clamp' && ratio > 1) ratio = 1;
  return outMin + ratio * (outMax - outMin);
}

export function spring(params: {
  frame: number;
  fps: number;
  delay?: number;
  durationInFrames?: number;
}): number {
  const effectiveFrame = Math.max(0, params.frame - (params.delay || 0));
  const dur = params.durationInFrames || Math.round(params.fps * 0.45);
  const progress = Math.min(effectiveFrame / Math.max(dur, 1), 1);
  // Smooth easeOutBack curve for snappy shorts animation
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
}

export function getShortsBallGradient(num: number): {
  bg: string;
  border: string;
  text: string;
} {
  if (num <= 10) {
    return {
      bg: 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
      border: '#fef08a',
      text: '#1e293b',
    };
  }
  if (num <= 20) {
    return {
      bg: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
      border: '#bae6fd',
      text: '#ffffff',
    };
  }
  if (num <= 30) {
    return {
      bg: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
      border: '#fecdd3',
      text: '#ffffff',
    };
  }
  if (num <= 40) {
    return {
      bg: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
      border: '#e2e8f0',
      text: '#ffffff',
    };
  }
  return {
    bg: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
    border: '#bbf7d0',
    text: '#ffffff',
  };
}
