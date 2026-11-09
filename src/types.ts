export interface AlertState {
  type: 'success' | 'error';
  text: string;
}

export interface LottoAnalysis {
  id?: number;
  reliability: number;
  sum: number;
  cnt0s: number;
  cnt10s: number;
  cnt20s: number;
  cnt30s: number;
  cnt40s: number;
  sumLastDigits: number;
  lastDigit0: number[];
  lastDigit1: number[];
  lastDigit2: number[];
  lastDigit3: number[];
  lastDigit4: number[];
  lastDigit5: number[];
  lastDigit6: number[];
  lastDigit7: number[];
  lastDigit8: number[];
  lastDigit9: number[];
  even: number;
  odd: number;
  hot: number;
  warm: number;
  cold: number;
  low: number;
  high: number;
  ac: number;
  consecutive: number[][];
  temperatures?: Record<number, 'HOT' | 'WARM' | 'COLD'>;
}

export interface WinningNumber {
  episode: number;
  numbers: number[];
  isDrawn?: boolean;
  analysis?: LottoAnalysis;
}

export interface MatchResult {
  rank: number;
  matchCount: number;
  bonusMatch: boolean;
  matchedNumbers: number[];
  winningNumbers: number[];
}

export interface HistoryItem {
  id: string | number;
  episode: number;
  algorithm: string;
  numbers: number[];
  matchResult: MatchResult | null;
  createdAt?: string;
  analysis?: LottoAnalysis | null;
}

export interface PairCount {
  pair: [number, number];
  count: number;
}

export interface PersonalAnalysis {
  sum: number;
  cnt0s: number;
  cnt10s: number;
  cnt20s: number;
  cnt30s: number;
  cnt40s: number;
  sumLastDigits: number;
  lastDigit0: number[];
  lastDigit1: number[];
  lastDigit2: number[];
  lastDigit3: number[];
  lastDigit4: number[];
  lastDigit5: number[];
  lastDigit6: number[];
  lastDigit7: number[];
  lastDigit8: number[];
  lastDigit9: number[];
  even: number;
  odd: number;
  hot: number;
  warm: number;
  cold: number;
  low: number;
  high: number;
  ac: number;
  consecutive: number[][];
  pair: PairCount[];
  prime: number;
  composite: number;
  mul3: number;
  win1: number;
  win2: number;
  win3: number;
  win4: number;
  win5: number;
  temperatures?: Record<number, 'HOT' | 'WARM' | 'COLD'>;
}

export type PaymentStatus =
  | 'READY'
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'FAILED';

export interface SubscriptionStatus {
  plan: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startsAt?: string;
  endsAt?: string;
}

export interface LotteryBallStat {
  ball: number;
  totalEpisodes: number;
  totalCount: number;
  bonusCount: number;
  appearanceRate: number;
  rank: number;
  positionCounts: number[];
  recentTen: number;
  recentThirty: number;
  status: 'HOT' | 'WARM' | 'COLD';
  skip: number;
  friendlyNumbers: number[];
  friendlyCounts?: number[];
  latestEpisode: number;
}
