import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth, authFetch } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils';
import { LottoBall, LottoBalls } from '../../components/LottoBall';
import { SEO } from '../../components/SEO';
import { drawQuizSet, type QuizQuestion } from '../../data/minigameQuizData';

export type MinigameType = 'QUIZ' | 'MEMORY' | 'DETECTIVE' | 'CATCHER';

interface MinigameMeta {
  id: MinigameType;
  title: string;
  subtitle: string;
  badge: string;
  difficulty: string;
  playTime: string;
  description: string;
  ruleSummary: string;
  accentClass: string;
  icon: React.ReactNode;
}

const MINIGAME_LIST: MinigameMeta[] = [
  {
    id: 'QUIZ',
    title: '로또 지식 퀴즈',
    subtitle: 'Lotto Trivia & Fun Facts',
    badge: '지식 · 빈칸 & 객관식',
    difficulty: '난이도 보통',
    playTime: '약 25초',
    description:
      '세계 로또의 숨겨진 기원부터 대한민국 로또 6/45 진기록, 추첨기의 과학적 비밀까지! 흥미진진한 로또 상식을 맞춰보세요.',
    ruleSummary: '랜덤 3문제 중 2문제 이상 정답 시 클리어',
    accentClass: 'from-primary-cyan/20 via-primary-cyan/5 to-transparent',
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'MEMORY',
    title: '로또볼 메모리 매치',
    subtitle: '30-Second Memory Match',
    badge: '기억력 · 색상 패턴',
    difficulty: '난이도 보통',
    playTime: '약 30초',
    description:
      '30초 동안 공개되는 6개의 당첨번호와 로또 볼 색상을 기억한 뒤, 1~45 번호판에서 정확히 찾아내세요.',
    ruleSummary: '실수 허용 2회 이내에 6개 당첨볼 모두 찾기',
    accentClass: 'from-amber-500/20 via-amber-500/5 to-transparent',
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: 'DETECTIVE',
    title: '행운의 번호 추리',
    subtitle: 'Lotto Number Detective',
    badge: '논리 추론 · UP & DOWN',
    difficulty: '난이도 상',
    playTime: '약 30초',
    description:
      '총합, 홀짝 비율, 색상 구간 단서와 매 시도마다 제공되는 UP / DOWN 힌트를 조합해 숨겨진 3개의 행운 볼을 추리하세요.',
    ruleSummary: '5번의 추리 기회 안에 3개의 숨겨진 번호 모두 맞추기',
    accentClass: 'from-purple-500/20 via-purple-500/5 to-transparent',
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    id: 'CATCHER',
    title: '스피드 로또 캐처',
    subtitle: 'Speed Lotto Ball Catcher',
    badge: '순발력 · 아케이드',
    difficulty: '난이도 보통',
    playTime: '25초 제한',
    description:
      '추첨 챔버에서 솟아오르는 로또 볼 중에서 오늘의 타겟 당첨번호 6개를 제한시간 25초 안에 빠르게 터치하여 포획하세요!',
    ruleSummary: '25초 이내에 타겟 볼 6개 모두 포획 시 클리어',
    accentClass: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

const PENDING_GUEST_CLAIM_KEY = 'hactto_pending_minigame_claim_v1';

interface PendingGuestClaim {
  gameType: MinigameType;
  ticket?: string;
  clearedGames: MinigameType[];
  clearedAt: number;
  expiresAt: number;
  luckyNumbers: number[];
}

function getKstDateString(now: Date = new Date()): string {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstTime = new Date(now.getTime() + kstOffsetMs);
  const yyyy = kstTime.getUTCFullYear();
  const mm = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kstTime.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getKstCountdownString(now: Date = new Date()): string {
  const kstDate = getKstDateString(now);
  const endOfKstDay = new Date(`${kstDate}T23:59:59.999+09:00`);
  const diffSec = Math.max(
    0,
    Math.floor((endOfKstDay.getTime() - now.getTime()) / 1000),
  );
  const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const s = String(diffSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getRecommendedGameOfToday(kstDate: string): MinigameType {
  let hash = 0;
  for (let i = 0; i < kstDate.length; i++) {
    hash = (hash * 31 + kstDate.charCodeAt(i)) % 1000;
  }
  const order: MinigameType[] = ['QUIZ', 'MEMORY', 'DETECTIVE', 'CATCHER'];
  return order[hash % order.length];
}

function generateUniqueNumbers(count: number): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

function getBallDecadeRange(num: number): {
  label: string;
  min: number;
  max: number;
  colorBadge: string;
} {
  if (num < 10)
    return {
      label: '단번대 (1~9)',
      min: 1,
      max: 9,
      colorBadge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    };
  if (num < 20)
    return {
      label: '10번대 (10~19)',
      min: 10,
      max: 19,
      colorBadge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    };
  if (num < 30)
    return {
      label: '20번대 (20~29)',
      min: 20,
      max: 29,
      colorBadge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    };
  if (num < 40)
    return {
      label: '30번대 (30~39)',
      min: 30,
      max: 39,
      colorBadge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    };
  return {
    label: '40번대 (40~45)',
    min: 40,
    max: 45,
    colorBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  };
}

interface FloatingBall {
  uid: string;
  number: number;
  xPercent: number;
  yPercent: number;
}

export function Minigame() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showAlert, checkIpStatus, ballStatsList, freeHon, paidHon } =
    useApp();

  const [kstDate, setKstDate] = useState<string>(() => getKstDateString());
  const [countdown, setCountdown] = useState<string>(() =>
    getKstCountdownString(),
  );
  const [rewardClaimedToday, setRewardClaimedToday] = useState<boolean>(false);
  const [allClearClaimedToday, setAllClearClaimedToday] =
    useState<boolean>(false);
  const [claimedDescription, setClaimedDescription] = useState<string | null>(
    null,
  );
  const [clearedGamesToday, setClearedGamesToday] = useState<MinigameType[]>(
    () => {
      try {
        const today = getKstDateString();
        const raw = localStorage.getItem(`hactto_minigame_cleared_${today}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
      return [];
    },
  );
  const [pendingGuestClaim, setPendingGuestClaim] =
    useState<PendingGuestClaim | null>(() => {
      try {
        const raw = localStorage.getItem(PENDING_GUEST_CLAIM_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PendingGuestClaim;
          if (parsed && parsed.expiresAt > Date.now()) {
            return parsed;
          }
          localStorage.removeItem(PENDING_GUEST_CLAIM_KEY);
        }
      } catch {
        // ignore
      }
      return null;
    });

  // 현재 실행 중인 미니게임 및 티켓 상태
  const [activeGame, setActiveGame] = useState<MinigameType | null>(null);
  const [activeTicket, setActiveTicket] = useState<string | undefined>(
    undefined,
  );
  const [claiming, setClaiming] = useState<boolean>(false);

  // 클리어/실패 결과 모달 상태
  const [gameResult, setGameResult] = useState<{
    status: 'WIN' | 'LOSE';
    gameType: MinigameType;
    summaryText: string;
    luckyNumbers: number[];
    rewardedAmountNow: number;
    allClearBonusGrantedNow: boolean;
  } | null>(null);

  // =========================================================================
  // 1. 로또 지식 퀴즈 (QUIZ) 상태
  // =========================================================================
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizInput, setQuizInput] = useState<string>('');
  const [quizFeedback, setQuizFeedback] = useState<{
    isCorrect: boolean;
    selectedAnswer: string;
  } | null>(null);

  // =========================================================================
  // 2. 로또볼 메모리 매치 (MEMORY) 상태
  // =========================================================================
  const [memoryTargets, setMemoryTargets] = useState<number[]>([]);
  const [memoryPhase, setMemoryPhase] = useState<'MEMORIZE' | 'PICK'>(
    'MEMORIZE',
  );
  const [memoryCountdownMs, setMemoryCountdownMs] = useState<number>(30000);
  const [memoryPicked, setMemoryPicked] = useState<number[]>([]);
  const [memoryWrongPicks, setMemoryWrongPicks] = useState<number[]>([]);

  // =========================================================================
  // 3. 행운의 번호 추리 (DETECTIVE) 상태
  // =========================================================================
  const [detectiveTargets, setDetectiveTargets] = useState<number[]>([]);
  const [detectiveInputs, setDetectiveInputs] = useState<
    [number, number, number]
  >([5, 25, 40]);
  const [detectiveHistory, setDetectiveHistory] = useState<
    Array<{
      guess: [number, number, number];
      hints: [
        'CORRECT' | 'UP' | 'DOWN',
        'CORRECT' | 'UP' | 'DOWN',
        'CORRECT' | 'UP' | 'DOWN',
      ];
    }>
  >([]);

  // =========================================================================
  // 4. 스피드 로또 캐처 (CATCHER) 상태
  // =========================================================================
  const [catcherTargets, setCatcherTargets] = useState<number[]>([]);
  const [catcherCaught, setCatcherCaught] = useState<number[]>([]);
  const [catcherTimeLeftMs, setCatcherTimeLeftMs] = useState<number>(25000);
  const [catcherBalls, setCatcherBalls] = useState<FloatingBall[]>([]);
  const [catcherPenaltyFlash, setCatcherPenaltyFlash] =
    useState<boolean>(false);
  const catcherTimerRef = useRef<number | null>(null);

  const recommendedGame = getRecommendedGameOfToday(kstDate);

  // KST 타이머 및 당일 클리어 로컬 기록 동기화
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      const nextKstDate = getKstDateString(now);
      if (nextKstDate !== kstDate) {
        setKstDate(nextKstDate);
        setClearedGamesToday([]);
        setRewardClaimedToday(false);
        setAllClearClaimedToday(false);
      }
      setCountdown(getKstCountdownString(now));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [kstDate]);

  const markGameClearedLocally = useCallback(
    (gameType: MinigameType): MinigameType[] => {
      let updatedList: MinigameType[] = [];
      setClearedGamesToday((prev) => {
        const next = prev.includes(gameType) ? prev : [...prev, gameType];
        updatedList = next;
        try {
          localStorage.setItem(
            `hactto_minigame_cleared_${kstDate}`,
            JSON.stringify(next),
          );
        } catch {
          // ignore
        }
        return next;
      });
      return updatedList;
    },
    [kstDate],
  );

  // 서버에서 오늘 보상 수령 여부 조회 및 비회원 대기 보상 자동 청구
  useEffect(() => {
    let cancelled = false;

    const runSync = async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!isAuthenticated) {
        setRewardClaimedToday(false);
        setAllClearClaimedToday(false);
        setClaimedDescription(null);
        return;
      }

      try {
        const res = await authFetch(`${API_BASE_URL}/user/minigame/status`);
        if (!res.ok || cancelled) return;

        const json = await res.json();
        const data = json.data || json;
        const alreadyClaimed = !!data?.rewardClaimedToday;
        const alreadyAllClear = !!data?.allClearClaimedToday;
        setRewardClaimedToday(alreadyClaimed);
        setAllClearClaimedToday(alreadyAllClear);
        setClaimedDescription(data?.description ?? null);

        if (Array.isArray(data?.clearedGamesToday)) {
          let mergedList: MinigameType[] = [];
          setClearedGamesToday((prev) => {
            const merged = Array.from(
              new Set([...prev, ...(data.clearedGamesToday as MinigameType[])]),
            );
            mergedList = merged;
            try {
              localStorage.setItem(
                `hactto_minigame_cleared_${kstDate}`,
                JSON.stringify(merged),
              );
            } catch {
              // ignore
            }
            return merged;
          });

          // 이미 로컬에서 4종을 모두 클리어했는데 서버에 올클리어 보너스(+30 HON)가 아직 미수령 상태라면 즉시 자동 청구!
          let localCleared: MinigameType[] = mergedList;
          try {
            const rawLocal = localStorage.getItem(
              `hactto_minigame_cleared_${kstDate}`,
            );
            if (rawLocal) {
              const parsedLocal = JSON.parse(rawLocal);
              if (Array.isArray(parsedLocal)) {
                localCleared = Array.from(
                  new Set([...mergedList, ...parsedLocal]),
                );
              }
            }
          } catch {
            // ignore
          }

          if (localCleared.length >= 4 && !alreadyAllClear) {
            const autoAllClearRes = await authFetch(
              `${API_BASE_URL}/user/minigame/claim`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gameType: localCleared[localCleared.length - 1] || 'QUIZ',
                  clearedGames: localCleared,
                }),
              },
            );
            if (autoAllClearRes.ok && !cancelled) {
              const autoJson = await autoAllClearRes.json();
              const autoData = autoJson.data || autoJson;
              if (autoData.allClearClaimedToday) {
                setAllClearClaimedToday(true);
              }
              setRewardClaimedToday(true);
              await checkIpStatus(true);
              if (autoData.rewardedHon > 0) {
                showAlert(
                  'success',
                  `4종 미션 올클리어 보너스 +${autoData.rewardedHon} HON이 즉시 지급되었습니다!`,
                );
              }
            }
          }
        }

        const rawPending = localStorage.getItem(PENDING_GUEST_CLAIM_KEY);
        if (rawPending) {
          const parsed = JSON.parse(rawPending) as PendingGuestClaim;
          localStorage.removeItem(PENDING_GUEST_CLAIM_KEY);
          setPendingGuestClaim(null);

          if (
            (!alreadyClaimed || !alreadyAllClear) &&
            parsed &&
            parsed.expiresAt > Date.now()
          ) {
            const claimRes = await authFetch(
              `${API_BASE_URL}/user/minigame/claim`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gameType: parsed.gameType,
                  ticket: parsed.ticket,
                  clearedGames: parsed.clearedGames,
                }),
              },
            );
            if (claimRes.ok && !cancelled) {
              const claimJson = await claimRes.json();
              const claimData = claimJson.data || claimJson;
              setRewardClaimedToday(true);
              if (claimData.allClearClaimedToday) {
                setAllClearClaimedToday(true);
              }
              markGameClearedLocally(parsed.gameType);
              await checkIpStatus(true);
              if (claimData.rewardedHon > 0) {
                showAlert(
                  'success',
                  `로그인 완료! 달성하신 미니게임 보상 +${claimData.rewardedHon} HON이 즉시 지급되었습니다.`,
                );
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync minigame status:', err);
      }
    };

    runSync();
    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    checkIpStatus,
    kstDate,
    markGameClearedLocally,
    showAlert,
  ]);

  // 미니게임 시작 티켓 발급 요청
  const fetchStartTicket = useCallback(async (gameType: MinigameType) => {
    setActiveTicket(undefined);
    try {
      const res = await fetch(
        `${API_BASE_URL}/user/minigame/ticket?gameType=${gameType}`,
      );
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data?.ticket) {
          setActiveTicket(data.ticket);
        }
      }
    } catch {
      // 오프라인/로컬 폴백 시 티켓 없이 진행 가능
    }
  }, []);

  // 스피드 로또 캐처 볼 배열 생성 헬퍼
  const spawnCatcherWave = useCallback(
    (targets: number[], caught: number[]): FloatingBall[] => {
      const remainingTargets = targets.filter((n) => !caught.includes(n));
      const guaranteedTargets = remainingTargets.slice(0, 2);
      const distractors = generateUniqueNumbers(14).filter(
        (n) => !guaranteedTargets.includes(n),
      );
      const combined = [...guaranteedTargets, ...distractors.slice(0, 7)];

      return combined.map((num, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const jitterX = (Math.random() - 0.5) * 14;
        const jitterY = (Math.random() - 0.5) * 12;
        return {
          uid: `${num}-${idx}-${Date.now()}-${Math.random()}`,
          number: num,
          xPercent: Math.min(86, Math.max(14, 22 + col * 28 + jitterX)),
          yPercent: Math.min(84, Math.max(16, 22 + row * 28 + jitterY)),
        };
      });
    },
    [],
  );

  // 게임 시작 / 재도전 초기화
  const startGame = useCallback(
    (gameType: MinigameType) => {
      setGameResult(null);
      setActiveGame(gameType);
      fetchStartTicket(gameType);

      if (gameType === 'QUIZ') {
        const picked = drawQuizSet(3, ballStatsList);
        setQuizQuestions(picked);
        setQuizIndex(0);
        setQuizScore(0);
        setQuizInput('');
        setQuizFeedback(null);
      } else if (gameType === 'MEMORY') {
        const nums = generateUniqueNumbers(6);
        setMemoryTargets(nums);
        setMemoryPhase('MEMORIZE');
        setMemoryCountdownMs(30000);
        setMemoryPicked([]);
        setMemoryWrongPicks([]);
      } else if (gameType === 'DETECTIVE') {
        const decadeBuckets = [
          { min: 1, max: 9 },
          { min: 10, max: 19 },
          { min: 20, max: 29 },
          { min: 30, max: 39 },
          { min: 40, max: 45 },
        ];
        for (let i = decadeBuckets.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [decadeBuckets[i], decadeBuckets[j]] = [
            decadeBuckets[j],
            decadeBuckets[i],
          ];
        }
        const selectedBuckets = decadeBuckets
          .slice(0, 3)
          .sort((a, b) => a.min - b.min);
        const targets = selectedBuckets.map(
          (b) => Math.floor(Math.random() * (b.max - b.min + 1)) + b.min,
        );
        setDetectiveTargets(targets);
        const r1 = getBallDecadeRange(targets[0]);
        const r2 = getBallDecadeRange(targets[1]);
        const r3 = getBallDecadeRange(targets[2]);
        setDetectiveInputs([
          Math.floor((r1.min + r1.max) / 2),
          Math.floor((r2.min + r2.max) / 2),
          Math.floor((r3.min + r3.max) / 2),
        ]);
        setDetectiveHistory([]);
      } else if (gameType === 'CATCHER') {
        const targets = generateUniqueNumbers(6);
        setCatcherTargets(targets);
        setCatcherCaught([]);
        setCatcherTimeLeftMs(25000);
        setCatcherPenaltyFlash(false);
        setCatcherBalls(spawnCatcherWave(targets, []));
      }
    },
    [ballStatsList, fetchStartTicket, spawnCatcherWave],
  );

  // 메모리 매치 3.5초 암기 타이머
  useEffect(() => {
    if (activeGame !== 'MEMORY' || memoryPhase !== 'MEMORIZE') return;
    const interval = window.setInterval(() => {
      setMemoryCountdownMs((prev) => {
        if (prev <= 100) {
          setMemoryPhase('PICK');
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [activeGame, memoryPhase]);

  // 게임 승리/패배 처리 및 일일 10 HON + 4종 올클리어 30 HON 보상 지급
  const completeGame = useCallback(
    async (
      status: 'WIN' | 'LOSE',
      gameType: MinigameType,
      summaryText: string,
      luckyNumbers: number[],
    ) => {
      if (status === 'LOSE') {
        setGameResult({
          status: 'LOSE',
          gameType,
          summaryText,
          luckyNumbers,
          rewardedAmountNow: 0,
          allClearBonusGrantedNow: false,
        });
        return;
      }

      const nextClearedList = Array.from(
        new Set<MinigameType>([...clearedGamesToday, gameType]),
      );
      markGameClearedLocally(gameType);

      // 비회원일 경우 localStorage에 30분 TTL로 클리어 티켓 보관
      if (!isAuthenticated) {
        const pending: PendingGuestClaim = {
          gameType,
          ticket: activeTicket,
          clearedGames: nextClearedList,
          clearedAt: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000,
          luckyNumbers,
        };
        try {
          localStorage.setItem(
            PENDING_GUEST_CLAIM_KEY,
            JSON.stringify(pending),
          );
        } catch {
          // ignore
        }
        setPendingGuestClaim(pending);
        setGameResult({
          status: 'WIN',
          gameType,
          summaryText,
          luckyNumbers,
          rewardedAmountNow: 0,
          allClearBonusGrantedNow: false,
        });
        return;
      }

      // 회원일 경우 당일 10 HON 미수령 상태이거나 4종 올클리어(+30 HON) 미수령 상태일 때 백엔드 claim 호출
      let rewardedAmountNow = 0;
      let allClearBonusGrantedNow = false;
      const shouldCallClaim =
        !rewardClaimedToday ||
        !allClearClaimedToday ||
        !clearedGamesToday.includes(gameType);

      if (shouldCallClaim && !claiming) {
        setClaiming(true);
        try {
          const res = await authFetch(`${API_BASE_URL}/user/minigame/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameType,
              ticket: activeTicket,
              clearedGames: nextClearedList,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            const data = json.data || json;
            setRewardClaimedToday(true);
            if (data.allClearClaimedToday) {
              setAllClearClaimedToday(true);
            }
            rewardedAmountNow = Number(data.rewardedHon) || 0;
            allClearBonusGrantedNow = !!data.allClearRewardGrantedNow;
            await checkIpStatus(true);
            if (allClearBonusGrantedNow && data.baseRewardGrantedNow) {
              showAlert(
                'success',
                '4종 미션 올클리어 달성! 기본 10 HON + 올클리어 보너스 30 HON (총 40 HON)이 지급되었습니다.',
              );
            } else if (allClearBonusGrantedNow) {
              showAlert(
                'success',
                '4종 미션을 모두 달성하여 올클리어 추가 보너스 +30 HON이 즉시 지급되었습니다!',
              );
            } else if (rewardedAmountNow > 0) {
              showAlert(
                'success',
                '오늘의 미니게임 미션 성공! +10 HON이 즉시 지급되었습니다.',
              );
            }
          } else {
            const errJson = await res.json().catch(() => ({}));
            showAlert(
              'error',
              errJson.message || '보상 지급 요청 중 오류가 발생했습니다.',
            );
          }
        } catch (err) {
          console.error('Failed to claim minigame reward:', err);
        } finally {
          setClaiming(false);
        }
      }

      setGameResult({
        status: 'WIN',
        gameType,
        summaryText,
        luckyNumbers,
        rewardedAmountNow,
        allClearBonusGrantedNow,
      });
    },
    [
      activeTicket,
      allClearClaimedToday,
      checkIpStatus,
      claiming,
      clearedGamesToday,
      isAuthenticated,
      markGameClearedLocally,
      rewardClaimedToday,
      showAlert,
    ],
  );

  // 스피드 로또 캐처 타이머 및 웨이브 갱신
  useEffect(() => {
    if (activeGame !== 'CATCHER' || gameResult !== null) return;

    const tick = window.setInterval(() => {
      setCatcherTimeLeftMs((prev) => {
        if (prev <= 100) {
          window.clearInterval(tick);
          completeGame(
            'LOSE',
            'CATCHER',
            `제한시간 25초가 종료되었습니다! (${catcherCaught.length} / 6개 포획)`,
            catcherTargets,
          );
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    const wave = window.setInterval(() => {
      setCatcherBalls(spawnCatcherWave(catcherTargets, catcherCaught));
    }, 1600);

    catcherTimerRef.current = tick;
    return () => {
      window.clearInterval(tick);
      window.clearInterval(wave);
    };
  }, [
    activeGame,
    catcherCaught,
    catcherTargets,
    completeGame,
    gameResult,
    spawnCatcherWave,
  ]);

  // =========================================================================
  // 게임 1: 로또 지식 퀴즈 핸들러
  // =========================================================================
  const handleQuizAnswerSubmit = (submittedRaw: string) => {
    if (quizFeedback || quizQuestions.length === 0) return;
    const currentQ = quizQuestions[quizIndex];
    const trimmed = submittedRaw.trim();
    if (!trimmed) return;

    const normalizedUser = trimmed.replace(/[\s,]/g, '').toLowerCase();
    const validCandidates = [
      currentQ.answer,
      ...(currentQ.acceptedAnswers || []),
    ].map((ans) => ans.replace(/[\s,]/g, '').toLowerCase());

    const isCorrect = validCandidates.includes(normalizedUser);
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
    setQuizFeedback({
      isCorrect,
      selectedAnswer: trimmed,
    });
  };

  const handleQuizNext = () => {
    if (!quizFeedback) return;
    const nextIdx = quizIndex + 1;
    if (nextIdx < quizQuestions.length) {
      setQuizIndex(nextIdx);
      setQuizInput('');
      setQuizFeedback(null);
    } else {
      const finalScore = quizScore;
      const isWin = finalScore >= 2;
      const luckyNums = generateUniqueNumbers(6);
      completeGame(
        isWin ? 'WIN' : 'LOSE',
        'QUIZ',
        isWin
          ? `3문제 중 ${finalScore}문제를 맞혀 로또 지식 퀴즈를 클리어했습니다!`
          : `3문제 중 ${finalScore}문제를 맞혔습니다. (2문제 이상 정답 시 성공)`,
        luckyNums,
      );
    }
  };

  // =========================================================================
  // 게임 2: 로또볼 메모리 매치 핸들러
  // =========================================================================
  const handleMemoryBallClick = (num: number) => {
    if (memoryPhase !== 'PICK' || gameResult) return;
    if (memoryPicked.includes(num) || memoryWrongPicks.includes(num)) return;

    if (memoryTargets.includes(num)) {
      const nextPicked = [...memoryPicked, num];
      setMemoryPicked(nextPicked);
      if (nextPicked.length === memoryTargets.length) {
        completeGame(
          'WIN',
          'MEMORY',
          '기억한 6개의 당첨번호를 모두 정확하게 찾아냈습니다!',
          memoryTargets,
        );
      }
    } else {
      const nextWrong = [...memoryWrongPicks, num];
      setMemoryWrongPicks(nextWrong);
      if (nextWrong.length > 2) {
        completeGame(
          'LOSE',
          'MEMORY',
          '실수 허용 횟수(2회)를 초과했습니다. 다시 한번 집중해서 도전해 보세요!',
          memoryTargets,
        );
      }
    }
  };

  // =========================================================================
  // 게임 3: 행운의 번호 추리 핸들러
  // =========================================================================
  const handleDetectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameResult || detectiveTargets.length !== 3) return;

    const guess: [number, number, number] = [
      Math.min(45, Math.max(1, Number(detectiveInputs[0]) || 1)),
      Math.min(45, Math.max(1, Number(detectiveInputs[1]) || 1)),
      Math.min(45, Math.max(1, Number(detectiveInputs[2]) || 1)),
    ];

    const hints = guess.map((g, idx) => {
      const t = detectiveTargets[idx];
      if (g === t) return 'CORRECT';
      return g < t ? 'UP' : 'DOWN';
    }) as [
      'CORRECT' | 'UP' | 'DOWN',
      'CORRECT' | 'UP' | 'DOWN',
      'CORRECT' | 'UP' | 'DOWN',
    ];

    const nextHistory = [...detectiveHistory, { guess, hints }];
    setDetectiveHistory(nextHistory);

    const isAllCorrect = hints.every((h) => h === 'CORRECT');
    if (isAllCorrect) {
      const extraThree = generateUniqueNumbers(10).filter(
        (n) => !detectiveTargets.includes(n),
      );
      const fullSix = [...detectiveTargets, ...extraThree.slice(0, 3)].sort(
        (a, b) => a - b,
      );
      completeGame(
        'WIN',
        'DETECTIVE',
        `${nextHistory.length}번의 추리 만에 숨겨진 행운 번호 3개(${detectiveTargets.join(', ')})를 완벽히 찾아냈습니다!`,
        fullSix,
      );
    } else if (nextHistory.length >= 5) {
      const extraThree = generateUniqueNumbers(10).filter(
        (n) => !detectiveTargets.includes(n),
      );
      const fullSix = [...detectiveTargets, ...extraThree.slice(0, 3)].sort(
        (a, b) => a - b,
      );
      completeGame(
        'LOSE',
        'DETECTIVE',
        `5번의 추리 기회를 모두 사용했습니다. 정답 번호는 [${detectiveTargets.join(', ')}]번이었습니다!`,
        fullSix,
      );
    }
  };

  // =========================================================================
  // 게임 4: 스피드 로또 캐처 핸들러
  // =========================================================================
  const handleCatcherBallTap = (ball: FloatingBall) => {
    if (gameResult) return;

    if (catcherTargets.includes(ball.number)) {
      if (catcherCaught.includes(ball.number)) return;
      const nextCaught = [...catcherCaught, ball.number];
      setCatcherCaught(nextCaught);

      if (nextCaught.length === catcherTargets.length) {
        completeGame(
          'WIN',
          'CATCHER',
          `남은 시간 ${(catcherTimeLeftMs / 1000).toFixed(1)}초를 남기고 타겟 당첨볼 6개를 모두 포획했습니다!`,
          catcherTargets,
        );
      } else {
        setCatcherBalls(spawnCatcherWave(catcherTargets, nextCaught));
      }
    } else {
      setCatcherPenaltyFlash(true);
      window.setTimeout(() => setCatcherPenaltyFlash(false), 350);
      setCatcherTimeLeftMs((prev) => Math.max(0, prev - 1500));
      setCatcherBalls(spawnCatcherWave(catcherTargets, catcherCaught));
    }
  };

  const allFourCleared = clearedGamesToday.length === 4;
  const remaininglives = Math.max(0, 3 - memoryWrongPicks.length);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <SEO
        title="일일 로또 미니게임 & 상식 퀴즈 | Hactto"
        description="매일 로또 역사·과학 상식 퀴즈와 로또볼 메모리 매치, 번호 추리, 스피드 로또 캐처에 도전하고 최대 40 HON 보상을 획득하세요."
      />

      {/* =====================================================================
          상단 데일리 미션 & 10 HON + 30 HON 보상 현황 히어로 배너
         ===================================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-glass-border bg-card p-6 shadow-glass sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-cyan/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary-purple/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-cyan/15 px-3 py-1 text-xs font-extrabold tracking-wide text-primary-cyan">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>DAILY LOTTO MISSION</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>자정 초기화까지 {countdown}</span>
              </span>
              {allFourCleared && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-500">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                  <span>오늘의 4종 올클리어 마스터</span>
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-main sm:text-3xl">
              일일 로또 미니게임 라운지
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              흥미진진한 로또 역사·상식 퀴즈와 3종의 미니게임 중{' '}
              <strong className="font-bold text-main">
                1개 성공 시 즉시 +10 HON
              </strong>
              , 그리고{' '}
              <strong className="font-bold text-primary-cyan">
                4종 모두 달성 시 추가 +30 HON (하루 최대 40 HON)
              </strong>
              을 드립니다. 실패해도 성공할 때까지 언제든 재도전할 수 있어요!
            </p>
          </div>

          {/* 우측 오늘의 미션 보상 상태 카드 (여백 넉넉하게 개선) */}
          <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-glass-border bg-surface/80 p-4 sm:min-w-[350px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-muted">
                오늘의 데일리 미션 보상
              </span>
              {isAuthenticated && (
                <span className="rounded-lg bg-card px-2.5 py-0.5 text-[0.72rem] font-bold text-primary-cyan ring-1 ring-glass-border">
                  보유 {(freeHon + paidHon).toLocaleString()} HON
                </span>
              )}
            </div>

            {/* 1단계: 첫 1종 클리어 보상 (+10 HON) */}
            {rewardClaimedToday ? (
              <div className="flex items-center justify-between gap-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-extrabold text-white">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      첫 미션 달성 보상 지급 완료
                    </div>
                    <div className="truncate text-[0.72rem] text-muted">
                      4종 중 1개 이상 클리어 달성
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-xl bg-emerald-500/20 px-3 py-1.5 font-display text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  +10 HON 완료
                </span>
              </div>
            ) : pendingGuestClaim && !isAuthenticated ? (
              <div className="flex flex-col gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5">
                <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  획득한 미션 보상(
                  {pendingGuestClaim.clearedGames.length >= 4
                    ? '+40 HON'
                    : '+10 HON'}
                  )이 대기 중입니다!
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate('/login', { state: { from: '/minigame' } })
                  }
                  className="cursor-pointer rounded-xl border-none bg-primary-cyan px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition-all hover:brightness-105"
                >
                  로그인하고 보상 즉시 받기 →
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-6 rounded-xl border border-primary-cyan/30 bg-primary-cyan/10 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-main">
                    첫 미션 달성 대기 중
                  </div>
                  <div className="mt-0.5 text-[0.72rem] text-muted">
                    4종 중 1개만 성공해도 즉시 지급
                  </div>
                </div>
                <span className="shrink-0 rounded-xl bg-primary-cyan px-3.5 py-1.5 font-display text-sm font-extrabold text-white shadow-xs">
                  +10 HON
                </span>
              </div>
            )}

            {/* 2단계: 4종 모두 달성 올클리어 보너스 (+30 HON) */}
            {allClearClaimedToday ? (
              <div className="flex items-center justify-between gap-5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-extrabold text-white">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                      4종 올클리어 보너스 지급 완료
                    </div>
                    <div className="truncate text-[0.72rem] text-muted">
                      {claimedDescription || '오늘 모든 미션을 정복했습니다'}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-xl bg-amber-500/20 px-3 py-1.5 font-display text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  +30 HON 완료
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-6 rounded-xl border border-glass-border bg-card/80 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-main">
                    4종 올클리어 추가 보너스
                  </div>
                  <div className="mt-0.5 text-[0.72rem] text-muted">
                    4종 미션 모두 성공 시 추가 지급 ({clearedGamesToday.length}
                    /4)
                  </div>
                </div>
                {clearedGamesToday.length >= 4 && isAuthenticated ? (
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={async () => {
                      if (claiming) return;
                      setClaiming(true);
                      try {
                        const res = await authFetch(
                          `${API_BASE_URL}/user/minigame/claim`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              gameType: 'QUIZ',
                              clearedGames: clearedGamesToday,
                            }),
                          },
                        );
                        if (res.ok) {
                          const json = await res.json();
                          const data = json.data || json;
                          if (data.allClearClaimedToday) {
                            setAllClearClaimedToday(true);
                          }
                          setRewardClaimedToday(true);
                          await checkIpStatus(true);
                          if (data.rewardedHon > 0) {
                            showAlert(
                              'success',
                              `4종 올클리어 추가 보너스 +${data.rewardedHon} HON이 즉시 지급되었습니다!`,
                            );
                          }
                        }
                      } finally {
                        setClaiming(false);
                      }
                    }}
                    className="shrink-0 cursor-pointer rounded-xl border-none bg-amber-500 px-3.5 py-1.5 font-display text-sm font-extrabold text-white shadow-xs transition-all hover:brightness-105"
                  >
                    +30 HON 받기
                  </button>
                ) : (
                  <span className="shrink-0 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-1.5 font-display text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    +30 HON
                  </span>
                )}
              </div>
            )}

            {/* 오늘의 4종 스탬프 바 */}
            <div className="flex items-center justify-between border-t border-glass-border pt-2.5 text-[0.72rem]">
              <span className="font-semibold text-muted">
                오늘 클리어 현황 ({clearedGamesToday.length}/4)
              </span>
              <div className="flex items-center gap-1.5">
                {MINIGAME_LIST.map((g) => {
                  const isCleared = clearedGamesToday.includes(g.id);
                  return (
                    <span
                      key={g.id}
                      title={g.title}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-extrabold transition-all ${
                        isCleared
                          ? 'bg-emerald-500 text-white'
                          : 'border border-glass-border bg-card text-dim'
                      }`}
                    >
                      {isCleared ? '✓' : '·'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          메인 영역: 라운지 4종 벤토 그리드 OR 선택한 게임 플레이 스테이지
         ===================================================================== */}
      {!activeGame ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {MINIGAME_LIST.map((game) => {
            const isCleared = clearedGamesToday.includes(game.id);
            const isRecommended = recommendedGame === game.id;

            return (
              <div
                key={game.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-glass-border bg-card p-6 shadow-glass transition-all hover:border-primary-cyan/40 hover:shadow-xl"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${game.accentClass} opacity-60`}
                />

                <div className="relative flex flex-col gap-4">
                  {/* 상단 배지 행 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-glass-border bg-surface/90 px-2.5 py-1 text-[0.72rem] font-bold text-main">
                        {game.badge}
                      </span>
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-cyan/15 px-2.5 py-1 text-[0.72rem] font-extrabold text-primary-cyan">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-cyan" />
                          <span>오늘의 추천 미션</span>
                        </span>
                      )}
                    </div>

                    {isCleared && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[0.72rem] font-extrabold text-emerald-600 dark:text-emerald-400">
                        ✓ TODAY CLEAR
                      </span>
                    )}
                  </div>

                  {/* 아이콘 + 타이틀 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-glass-border bg-surface text-primary-cyan shadow-xs transition-transform group-hover:scale-105">
                      {game.icon}
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-extrabold text-main">
                        {game.title}
                      </h2>
                      <p className="text-xs font-medium text-dim">
                        {game.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-sm leading-relaxed text-muted">
                    {game.description}
                  </p>
                </div>

                {/* 하단 메타 정보 & 도전 버튼 */}
                <div className="relative mt-6 flex flex-col gap-3 border-t border-glass-border pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>성공 조건: {game.ruleSummary}</span>
                    <span className="font-semibold text-main">
                      {game.playTime} · {game.difficulty}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => startGame(game.id)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-none bg-primary-cyan px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-all hover:brightness-105"
                  >
                    <span>
                      {allClearClaimedToday
                        ? `${game.title} 자유 연습하기`
                        : !rewardClaimedToday
                          ? `${game.title} 도전하기 (+10 HON)`
                          : isCleared
                            ? `${game.title} 다시 플레이하기`
                            : `${game.title} 도전하기 (올클리어 +30 HON)`}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        /* =====================================================================
           개별 게임 플레이 스테이지
           ===================================================================== */
        <section className="relative overflow-hidden rounded-3xl border border-glass-border bg-card p-5 shadow-glass sm:p-8">
          {/* 상단 컨트롤 바 */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-glass-border pb-4">
            <button
              type="button"
              onClick={() => {
                setActiveGame(null);
                setGameResult(null);
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-glass-border bg-surface px-3.5 py-2 text-xs font-bold text-main transition-colors hover:bg-surface-hover"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>미니게임 라운지로 돌아가기</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-cyan/15 px-3 py-1 text-xs font-extrabold text-primary-cyan">
                {MINIGAME_LIST.find((g) => g.id === activeGame)?.title}
              </span>
              <button
                type="button"
                onClick={() => startGame(activeGame)}
                className="cursor-pointer rounded-xl border border-glass-border bg-surface px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:bg-surface-hover hover:text-main"
              >
                새 판으로 다시 시작 ↻
              </button>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              1. 로또 지식 퀴즈 (QUIZ)
             ----------------------------------------------------------------- */}
          {activeGame === 'QUIZ' && quizQuestions[quizIndex] && !gameResult && (
            <div className="mx-auto flex max-w-2xl flex-col gap-6">
              {/* 진행률 바 */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-primary-cyan/15 px-2.5 py-1 text-xs font-extrabold text-primary-cyan">
                    문제 {quizIndex + 1} / {quizQuestions.length}
                  </span>
                  <span className="rounded-lg border border-glass-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                    {quizQuestions[quizIndex].categoryLabel} · 난이도{' '}
                    {quizQuestions[quizIndex].difficulty}
                  </span>
                  <span className="rounded-lg border border-glass-border bg-surface px-2.5 py-1 text-xs font-semibold text-main">
                    {quizQuestions[quizIndex].type === 'FILL_BLANK'
                      ? '빈칸 채우기'
                      : '객관식 4지선다'}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  현재 정답: {quizScore}개 (2개 이상 성공)
                </span>
              </div>

              {/* 문제 카드 */}
              <div className="rounded-2xl border border-glass-border bg-surface/70 p-6">
                <h3 className="text-base leading-relaxed font-extrabold text-main sm:text-lg">
                  Q{quizIndex + 1}. {quizQuestions[quizIndex].question}
                </h3>

                {/* 빈칸 채우기일 경우 텍스트 입력창 제공 + 아래 힌트 보기 칩도 함께 제공 */}
                {quizQuestions[quizIndex].type === 'FILL_BLANK' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleQuizAnswerSubmit(quizInput);
                    }}
                    className="mt-5 flex flex-col gap-2.5 sm:flex-row"
                  >
                    <input
                      type="text"
                      value={quizInput}
                      disabled={!!quizFeedback}
                      onChange={(e) => setQuizInput(e.target.value)}
                      placeholder="빈칸(ㅁ)에 들어갈 정답을 직접 입력하거나 아래 보기에서 선택하세요"
                      className="input-glow flex-1 text-sm font-bold"
                    />
                    {!quizFeedback && (
                      <button
                        type="submit"
                        disabled={!quizInput.trim()}
                        className="cursor-pointer rounded-xl border-none bg-primary-cyan px-5 py-2.5 text-xs font-extrabold text-white shadow-xs transition-all hover:brightness-105 disabled:opacity-40"
                      >
                        정답 확인
                      </button>
                    )}
                  </form>
                )}

                {/* 객관식 보기 또는 빈칸 힌트 칩 */}
                <div className="mt-5">
                  {quizQuestions[quizIndex].type === 'FILL_BLANK' && (
                    <div className="mb-2 text-xs font-semibold text-muted">
                      빈칸 후보 칩 (탭하면 바로 선택됩니다):
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {quizQuestions[quizIndex].options.map((opt, idx) => {
                      const isCorrectOpt =
                        opt === quizQuestions[quizIndex].answer;
                      const isSelected = quizFeedback?.selectedAnswer === opt;

                      let btnStyle =
                        'border-glass-border bg-card text-main hover:border-primary-cyan/50 hover:bg-surface-hover';
                      if (quizFeedback) {
                        if (isCorrectOpt) {
                          btnStyle =
                            'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/40';
                        } else if (isSelected && !quizFeedback.isCorrect) {
                          btnStyle = 'border-error bg-error/15 text-error';
                        } else {
                          btnStyle =
                            'border-glass-border bg-card/50 text-dim opacity-60';
                        }
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={!!quizFeedback}
                          onClick={() => {
                            setQuizInput(opt);
                            handleQuizAnswerSubmit(opt);
                          }}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all ${btnStyle}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-extrabold text-primary-cyan">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 정답 확인 후 '알고 계셨나요?' 재미있는 해설 박스 */}
              {quizFeedback && (
                <div
                  className={`flex flex-col gap-3 rounded-2xl border p-5 ${
                    quizFeedback.isCorrect
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-amber-500/40 bg-amber-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-extrabold ${
                        quizFeedback.isCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {quizFeedback.isCorrect
                        ? '정답입니다!'
                        : `아쉬워요! 정답은 [${quizQuestions[quizIndex].answer}]입니다.`}
                    </span>
                  </div>

                  <div className="rounded-xl bg-card/90 p-4">
                    <div className="text-xs font-extrabold text-primary-cyan">
                      알고 계셨나요? — {quizQuestions[quizIndex].funFactTitle}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">
                      {quizQuestions[quizIndex].explanation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuizNext}
                    className="mt-1 w-full cursor-pointer rounded-xl border-none bg-primary-cyan py-3 text-sm font-extrabold text-white shadow-sm transition-all hover:brightness-105"
                  >
                    {quizIndex + 1 < quizQuestions.length
                      ? '다음 문제 풀기 →'
                      : '최종 결과 확인하기 →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------
              2. 로또볼 메모리 매치 (MEMORY)
             ----------------------------------------------------------------- */}
          {activeGame === 'MEMORY' && !gameResult && (
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
              {memoryPhase === 'MEMORIZE' ? (
                <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
                  <div className="text-xs font-extrabold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                    지금 아래 6개의 당첨번호를 기억하세요! (
                    {(memoryCountdownMs / 1000).toFixed(1)}초)
                  </div>

                  <LottoBalls
                    numbers={memoryTargets}
                    size="lg"
                    disableTooltip
                  />

                  <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-card">
                    <div
                      className="h-full bg-amber-500 transition-all duration-100"
                      style={{
                        width: `${(memoryCountdownMs / 30000) * 100}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setMemoryPhase('PICK')}
                    className="cursor-pointer rounded-xl border border-glass-border bg-card px-4 py-2 text-xs font-bold text-main hover:bg-surface-hover"
                  >
                    다 외웠어요! 바로 선택 시작하기 →
                  </button>
                </div>
              ) : (
                <div className="flex w-full flex-col gap-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glass-border bg-surface p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted">
                        찾은 번호:
                      </span>
                      <span className="text-sm font-extrabold text-primary-cyan">
                        {memoryPicked.length} / 6개
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted">
                        남은 기회:
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 3 }).map((_, idx) => {
                          const isAlive = idx < remaininglives;
                          return (
                            <span
                              key={idx}
                              className={`inline-block h-2.5 w-5 rounded-full transition-colors ${
                                isAlive
                                  ? 'bg-rose-500 shadow-xs'
                                  : 'bg-glass-border'
                              }`}
                            />
                          );
                        })}
                        <span className="ml-1 text-xs font-extrabold text-main">
                          {remaininglives}/3
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 찾은 볼 슬롯 */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-glass-border bg-surface/50 p-4">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const foundNum = memoryPicked[idx];
                      return foundNum ? (
                        <LottoBall
                          key={foundNum}
                          number={foundNum}
                          size="md"
                          disableTooltip
                        />
                      ) : (
                        <div
                          key={idx}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-glass-border text-xs font-extrabold text-dim"
                        >
                          ?
                        </div>
                      );
                    })}
                  </div>

                  {/* 1~45 번호 선택 그리드 */}
                  <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
                    {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                      const isPicked = memoryPicked.includes(num);
                      const isWrong = memoryWrongPicks.includes(num);

                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isPicked || isWrong}
                          onClick={() => handleMemoryBallClick(num)}
                          className={`flex h-10 cursor-pointer items-center justify-center rounded-xl border text-xs font-extrabold transition-all sm:h-11 sm:text-sm ${
                            isPicked
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                              : isWrong
                                ? 'border-error/40 bg-error/15 text-error line-through opacity-60'
                                : 'border-glass-border bg-surface text-main hover:border-primary-cyan hover:bg-primary-cyan/10'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------
              3. 행운의 번호 추리 (DETECTIVE)
             ----------------------------------------------------------------- */}
          {activeGame === 'DETECTIVE' &&
            detectiveTargets.length === 3 &&
            !gameResult && (
              <div className="mx-auto flex max-w-2xl flex-col gap-6">
                {/* 단서 보드 */}
                <div className="rounded-2xl border border-glass-border bg-surface/80 p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-primary-cyan">
                      오늘의 숨겨진 3구 단서 리포트 (오름차순: 1구 &lt; 2구 &lt;
                      3구)
                    </span>
                    <span className="rounded-lg bg-card px-2.5 py-1 text-xs font-extrabold text-main">
                      남은 추리 기회: {5 - detectiveHistory.length} / 5회
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-glass-border bg-card p-3">
                      <div className="text-[0.7rem] font-semibold text-muted">
                        단서 1 · 3개 번호 총합
                      </div>
                      <div className="mt-1 font-display text-lg font-extrabold text-main">
                        합계{' '}
                        {detectiveTargets[0] +
                          detectiveTargets[1] +
                          detectiveTargets[2]}
                      </div>
                    </div>

                    <div className="rounded-xl border border-glass-border bg-card p-3">
                      <div className="text-[0.7rem] font-semibold text-muted">
                        단서 2 · 홀수 / 짝수 구성
                      </div>
                      <div className="mt-1 font-display text-lg font-extrabold text-main">
                        홀수{' '}
                        {detectiveTargets.filter((n) => n % 2 === 1).length}개 ·
                        짝수{' '}
                        {detectiveTargets.filter((n) => n % 2 === 0).length}개
                      </div>
                    </div>

                    <div className="rounded-xl border border-glass-border bg-card p-3">
                      <div className="text-[0.7rem] font-semibold text-muted">
                        단서 3 · 번호대 구간
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 text-[0.7rem] font-bold">
                        {detectiveTargets.map((t, i) => {
                          const info = getBallDecadeRange(t);
                          return (
                            <span
                              key={i}
                              className={`rounded-md px-1.5 py-0.5 ${info.colorBadge}`}
                            >
                              {i + 1}구: {info.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 번호 입력 폼 */}
                <form
                  onSubmit={handleDetectiveSubmit}
                  className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-card p-5"
                >
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((slotIdx) => {
                      const rangeInfo = getBallDecadeRange(
                        detectiveTargets[slotIdx],
                      );
                      const lastHint =
                        detectiveHistory[detectiveHistory.length - 1]?.hints[
                          slotIdx
                        ];
                      const isLockedCorrect = lastHint === 'CORRECT';

                      return (
                        <div
                          key={slotIdx}
                          className="flex flex-col items-center gap-2.5 rounded-2xl border border-glass-border bg-surface p-3.5"
                        >
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold ${rangeInfo.colorBadge}`}
                          >
                            {slotIdx + 1}구 · {rangeInfo.label}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={
                                isLockedCorrect ||
                                detectiveInputs[slotIdx] <= rangeInfo.min
                              }
                              onClick={() => {
                                setDetectiveInputs((prev) => {
                                  const next = [...prev] as [
                                    number,
                                    number,
                                    number,
                                  ];
                                  next[slotIdx] = Math.max(
                                    rangeInfo.min,
                                    (Number(prev[slotIdx]) || rangeInfo.min) -
                                      1,
                                  );
                                  return next;
                                });
                              }}
                              aria-label={`${slotIdx + 1}구 번호 감소`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-glass-border bg-card text-muted transition-all hover:border-primary-cyan/40 hover:bg-surface-hover hover:text-main active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>

                            <input
                              type="text"
                              inputMode="numeric"
                              disabled={isLockedCorrect}
                              value={detectiveInputs[slotIdx]}
                              onChange={(e) => {
                                const digits = e.target.value.replace(
                                  /[^0-9]/g,
                                  '',
                                );
                                const val = digits === '' ? 0 : Number(digits);
                                setDetectiveInputs((prev) => {
                                  const next = [...prev] as [
                                    number,
                                    number,
                                    number,
                                  ];
                                  next[slotIdx] = Math.min(45, val);
                                  return next;
                                });
                              }}
                              onBlur={() => {
                                setDetectiveInputs((prev) => {
                                  const next = [...prev] as [
                                    number,
                                    number,
                                    number,
                                  ];
                                  const rawVal =
                                    Number(prev[slotIdx]) || rangeInfo.min;
                                  next[slotIdx] = Math.min(
                                    rangeInfo.max,
                                    Math.max(rangeInfo.min, rawVal),
                                  );
                                  return next;
                                });
                              }}
                              className={`h-10 w-14 appearance-none rounded-xl border text-center font-display text-lg font-extrabold transition-colors focus:outline-none ${
                                isLockedCorrect
                                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-500'
                                  : 'border-glass-border bg-card text-main focus:border-primary-cyan'
                              }`}
                            />

                            <button
                              type="button"
                              disabled={
                                isLockedCorrect ||
                                detectiveInputs[slotIdx] >= rangeInfo.max
                              }
                              onClick={() => {
                                setDetectiveInputs((prev) => {
                                  const next = [...prev] as [
                                    number,
                                    number,
                                    number,
                                  ];
                                  next[slotIdx] = Math.min(
                                    rangeInfo.max,
                                    (Number(prev[slotIdx]) || rangeInfo.min) +
                                      1,
                                  );
                                  return next;
                                });
                              }}
                              aria-label={`${slotIdx + 1}구 번호 증가`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-glass-border bg-card text-muted transition-all hover:border-primary-cyan/40 hover:bg-surface-hover hover:text-main active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          </div>

                          <span className="text-[0.68rem] font-semibold text-muted">
                            {detectiveTargets[slotIdx] % 2 === 1
                              ? '힌트: 홀수'
                              : '힌트: 짝수'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="w-full cursor-pointer rounded-xl border-none bg-primary-cyan py-3 text-sm font-extrabold text-white shadow-sm transition-all hover:brightness-105"
                  >
                    추리 번호 제출하기 ({detectiveHistory.length + 1}/5회차)
                  </button>
                </form>

                {/* 추리 히스토리 */}
                {detectiveHistory.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold text-muted">
                      추리 기록 (UP = 정답이 더 큰 숫자 / DOWN = 정답이 더 작은
                      숫자)
                    </div>
                    {detectiveHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-glass-border bg-surface px-4 py-2.5"
                      >
                        <span className="text-xs font-extrabold text-muted">
                          #{idx + 1}차 시도
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          {item.guess.map((g, sIdx) => {
                            const h = item.hints[sIdx];
                            return (
                              <div
                                key={sIdx}
                                className="flex items-center gap-1.5"
                              >
                                <LottoBall
                                  number={g}
                                  size="sm"
                                  disableTooltip
                                />
                                <span
                                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-extrabold ${
                                    h === 'CORRECT'
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : h === 'UP'
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                        : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                  }`}
                                >
                                  {h === 'CORRECT' ? (
                                    <span>정답</span>
                                  ) : h === 'UP' ? (
                                    <>
                                      <span>UP</span>
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="18 15 12 9 6 15" />
                                      </svg>
                                    </>
                                  ) : (
                                    <>
                                      <span>DOWN</span>
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="6 9 12 15 18 9" />
                                      </svg>
                                    </>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          {/* -----------------------------------------------------------------
              4. 스피드 로또 캐처 (CATCHER)
             ----------------------------------------------------------------- */}
          {activeGame === 'CATCHER' && !gameResult && (
            <div className="mx-auto flex max-w-2xl flex-col gap-5">
              {/* 상단 타겟 볼 & 타이머 */}
              <div className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-extrabold text-muted">
                    포획해야 할 타겟 당첨번호 ({catcherCaught.length} / 6개
                    완료)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {catcherTargets.map((num) => {
                      const isCaught = catcherCaught.includes(num);
                      return (
                        <div
                          key={num}
                          className={`relative transition-all ${
                            isCaught
                              ? 'scale-95 opacity-35 grayscale'
                              : 'scale-105 rounded-full ring-2 ring-primary-cyan'
                          }`}
                        >
                          <LottoBall number={num} size="sm" disableTooltip />
                          {isCaught && (
                            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-500/80 text-xs font-extrabold text-white">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-muted">
                    남은 제한시간
                  </span>
                  <span
                    className={`font-display text-2xl font-extrabold ${
                      catcherTimeLeftMs <= 7000
                        ? 'animate-pulse text-error'
                        : 'text-primary-cyan'
                    }`}
                  >
                    {(catcherTimeLeftMs / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>

              {/* 추첨 챔버 터치 스테이지 */}
              <div
                className={`relative h-[340px] w-full overflow-hidden rounded-3xl border-2 transition-colors select-none sm:h-[380px] ${
                  catcherPenaltyFlash
                    ? 'border-error bg-error/10'
                    : 'border-glass-border bg-gradient-to-b from-surface/90 to-card'
                }`}
              >
                <div className="pointer-events-none absolute top-3 left-4 text-[0.72rem] font-semibold text-dim">
                  타겟 번호만 터치하세요! (다른 번호 터치 시 -1.5초)
                </div>

                {catcherBalls.map((b) => {
                  const isAlreadyCaught = catcherCaught.includes(b.number);
                  if (isAlreadyCaught) return null;

                  return (
                    <button
                      key={b.uid}
                      type="button"
                      onClick={() => handleCatcherBallTap(b)}
                      style={{
                        left: `${b.xPercent}%`,
                        top: `${b.yPercent}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute cursor-pointer rounded-full border-none bg-transparent p-1.5 transition-transform hover:scale-110 active:scale-90"
                    >
                      <LottoBall number={b.number} size="lg" disableTooltip />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              게임 완료 (WIN / LOSE) 결과 및 도메인 브릿지 카드
             ----------------------------------------------------------------- */}
          {gameResult && (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-4 text-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-3xl shadow-md ${
                  gameResult.status === 'WIN'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-amber-500/15 text-amber-500'
                }`}
              >
                {gameResult.status === 'WIN' ? (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                )}
              </div>

              <div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold ${
                    gameResult.status === 'WIN'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {gameResult.status === 'WIN'
                    ? gameResult.allClearBonusGrantedNow
                      ? 'ALL-CLEAR MASTER (+30 HON BONUS)'
                      : 'MISSION CLEAR!'
                    : '다시 도전해 보세요!'}
                </span>
                <h3 className="mt-2 font-display text-2xl font-extrabold text-main">
                  {gameResult.status === 'WIN'
                    ? gameResult.rewardedAmountNow > 0
                      ? `+${gameResult.rewardedAmountNow} HON 보상이 지급되었습니다!`
                      : isAuthenticated
                        ? allClearClaimedToday
                          ? '미션 클리어! (오늘의 40 HON 모두 수령 완료)'
                          : `미션 클리어! (4종 올클리어까지 ${4 - clearedGamesToday.length}종 남음)`
                        : '미션 클리어! HON 보상이 준비되었습니다!'
                    : '아깝게 실패했어요! 즉시 재도전할 수 있습니다'}
                </h3>
                <p className="mt-1.5 text-sm text-muted">
                  {gameResult.summaryText}
                </p>
              </div>

              {/* 비회원 로그인 보상 수령 유도 배너 */}
              {gameResult.status === 'WIN' && !isAuthenticated && (
                <div className="flex w-full flex-col gap-3 rounded-2xl border border-primary-cyan/40 bg-primary-cyan/10 p-5">
                  <div className="text-sm font-extrabold text-main">
                    지금 로그인하시면 달성하신 보상(
                    {clearedGamesToday.length >= 4 ? '+40 HON' : '+10 HON'})이
                    즉시 적립됩니다!
                  </div>
                  <p className="text-xs text-muted">
                    클리어 기록이 30분 동안 안전하게 보관됩니다. 로그인 또는
                    회원가입 후 바로 HON 보상을 받아 가세요.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/login', { state: { from: '/minigame' } })
                    }
                    className="w-full cursor-pointer rounded-xl border-none bg-primary-cyan py-3 text-sm font-extrabold text-white shadow-sm transition-all hover:brightness-105"
                  >
                    로그인하고 보상 즉시 받기 →
                  </button>
                </div>
              )}

              {/* 도메인 브릿지: 게임에서 마주친 행운 번호를 실제 통계/분석기로 검증 */}
              <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-glass-border bg-surface/80 p-5">
                <div className="text-xs font-extrabold text-primary-cyan">
                  이번 게임에서 도출된 행운의 번호 6구
                </div>
                <LottoBalls
                  numbers={gameResult.luckyNumbers}
                  size="md"
                  disableTooltip
                />
                <p className="text-xs text-muted">
                  이 번호 조합이 실제 역대 당첨 통계와 Hactto AI 알고리즘에서는
                  몇 점을 받을지 과학적으로 검증해 보세요!
                </p>
                <div className="mt-1 flex w-full flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/generate', {
                        state: {
                          tab: 'analyze',
                          prefillGameA: [...gameResult.luckyNumbers].sort(
                            (a, b) => a - b,
                          ),
                        },
                      })
                    }
                    className="flex-1 cursor-pointer rounded-xl border border-primary-cyan/40 bg-primary-cyan/10 px-4 py-2.5 text-xs font-extrabold text-primary-cyan transition-colors hover:bg-primary-cyan/20"
                  >
                    이 번호로 예측번호 분석기 검증하기 →
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/ball-analysis')}
                    className="flex-1 cursor-pointer rounded-xl border border-glass-border bg-card px-4 py-2.5 text-xs font-bold text-main transition-colors hover:bg-surface-hover"
                  >
                    추첨 번호 통계 보러가기
                  </button>
                </div>
              </div>

              {/* 하단 액션 버튼 */}
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => startGame(gameResult.gameType)}
                  className="flex-1 cursor-pointer rounded-xl border-none bg-primary-cyan py-3 text-sm font-extrabold text-white shadow-sm transition-all hover:brightness-105"
                >
                  {gameResult.status === 'WIN'
                    ? '한 판 더 플레이하기 ↻'
                    : '즉시 재도전하기 ↻'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveGame(null);
                    setGameResult(null);
                  }}
                  className="flex-1 cursor-pointer rounded-xl border border-glass-border bg-surface py-3 text-sm font-bold text-main transition-colors hover:bg-surface-hover"
                >
                  다른 미니게임 고르기
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Minigame;
