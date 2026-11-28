export type ShortsDayType = 'TUE_TRIVIA' | 'FRI_RECOMMEND' | 'SUN_REVIEW';

export type ShortsJobStatus =
  | 'READY_FOR_REVIEW'
  | 'DISPATCHED'
  | 'RENDERING'
  | 'UPLOADED'
  | 'FAILED';

export interface ShortsSceneManifest {
  id: string;
  type: 'INTRO' | 'BODY' | 'OUTRO';
  narration: string;
  subtitle: string;
  audioBase64?: string;
  audioUrl?: string;
  durationMs: number;
  durationInFrames: number;
  startFrame: number;
  visualData?: Record<string, unknown>;
}

export interface ShortsTriviaPayload {
  id: string;
  categoryLabel: string;
  difficulty: string;
  question: string;
  options: string[];
  answer: string;
  funFactTitle: string;
  explanation: string;
}

export interface ShortsRecommendedGame {
  label: string;
  numbers: number[];
  matchWithPrevious: number;
  sourceType: 'ALGORITHM' | 'HISTORICAL_PATTERN' | 'HYBRID';
  sourceName: string;
  description: string;
}

export interface ShortsRecommendationPayload {
  episode: number;
  prevRound: number;
  recentHotNumbers: number[];
  recentColdNumbers: number[];
  recommendedGames: ShortsRecommendedGame[];
  bestPickGame: {
    label: string;
    numbers: number[];
    sourceName: string;
    reason: string;
  };
}

export interface ShortsGameMatchComparison {
  label: string;
  sourceName: string;
  numbers: number[];
  matchedNumbers: number[];
  bonusMatched: boolean;
  nearMissNumbers: number[];
  matchCount: number;
  rankLabel: string;
}

export interface ShortsReviewPayload {
  episode: number;
  winningNumbers: number[];
  bonusNumber: number;
  oddEvenRatio: string;
  highLowRatio: string;
  sumTotal: number;
  acValue: number;
  carryOverNumbers: number[];
  consecutivePairs: string[];
  gameComparisons: ShortsGameMatchComparison[];
}

export interface ShortsManifest {
  version: number;
  dayType: ShortsDayType;
  episode: number;
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  title: string;
  trivia?: ShortsTriviaPayload;
  recommendation?: ShortsRecommendationPayload;
  review?: ShortsReviewPayload;
  scenes: ShortsSceneManifest[];
}

export interface YoutubeShortsJobRecord {
  id: string;
  episode: number;
  dayType: ShortsDayType;
  status: ShortsJobStatus;
  title: string;
  description: string;
  tags: string;
  triviaId?: string | null;
  totalFrames: number;
  githubRunId?: string | null;
  youtubeVideoId?: string | null;
  errorMessage?: string | null;
  scheduledUploadAt?: string | null;
  dispatchedAt?: string | null;
  uploadedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  manifest?: ShortsManifest;
}
