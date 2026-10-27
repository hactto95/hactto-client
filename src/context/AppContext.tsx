/* eslint-disable */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type { AlertState, SubscriptionStatus } from '../types';
import { API_BASE_URL, fetchAndCacheAlgorithms } from '../utils';
import { refreshAccessToken, useAuth } from './AuthContext';

// Google Crawler Bot Detection to bypass access blocking
const isGoogleBot =
  typeof navigator !== 'undefined' &&
  /googlebot|mediapartners-google|adsbot-google/i.test(navigator.userAgent);

interface AppContextType {
  loading: boolean;
  allowed: boolean | null;
  pending: boolean;
  clientIp: string;
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
  showAdminModal: boolean;
  setShowAdminModal: (val: boolean) => void;
  adminKey: string;
  setAdminKey: (val: string) => void;
  adminError: string;
  setAdminError: (val: string) => void;
  alert: AlertState | null;
  setAlert: (alert: AlertState | null) => void;
  showAlert: (type: 'success' | 'error', text: string) => void;
  submitting: boolean;
  setSubmitting: (val: boolean) => void;
  checkIpStatus: (silent?: boolean) => Promise<void>;
  handleMasterKeySubmit: (key: string) => Promise<boolean>;
  loadAdminData: (key: string) => Promise<{
    pendingIps: string[];
    allowedIps: string[];
    masterKeys: string[];
  }>;
  handleAdminLogout: () => void;
  appendAuth: (url: string) => string;
  hasUnsavedWeights: boolean;
  setHasUnsavedWeights: (val: boolean) => void;
  showUnsavedModal: boolean;
  setShowUnsavedModal: (val: boolean) => void;
  unsavedActionTarget: (() => void) | null;
  setUnsavedActionTarget: (val: (() => void) | null) => void;
  isSystemAnalyzing: boolean;
  setIsSystemAnalyzing: (val: boolean) => void;
  systemAnalysisProgress: {
    progress: number;
    message: string;
    estimatedCompletionTime?: string;
  } | null;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (val: boolean) => void;
  freeHon: number;
  paidHon: number;
  subscription: SubscriptionStatus | null;
  nickname: string | null;
  setNickname: (name: string | null) => void;
  isBlockedUser: boolean;
  setIsBlockedUser: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [isSystemAnalyzing, setIsSystemAnalyzing] = useState<boolean>(false);
  const [systemAnalysisProgress, setSystemAnalysisProgress] = useState<{
    progress: number;
    message: string;
    estimatedCompletionTime?: string;
  } | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const [clientIp, setClientIp] = useState<string>('');
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  // Unsaved weights warning states
  const [hasUnsavedWeights, setHasUnsavedWeights] = useState<boolean>(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);
  const [unsavedActionTarget, setUnsavedActionTarget] = useState<
    (() => void) | null
  >(null);

  // Admin states
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminKey, setAdminKey] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');

  // UI state
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // HON / Billing status states
  const [freeHon, setFreeHon] = useState<number>(0);
  const [paidHon, setPaidHon] = useState<number>(0);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null,
  );
  const [nickname, setNickname] = useState<string | null>(null);
  const [isBlockedUser, setIsBlockedUser] = useState<boolean>(false);

  // Show auto-dismiss alerts
  const showAlert = useCallback((type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  }, []);

  // Helper to append Master Key if present (No-op now since headers handle auth)
  const appendAuth = useCallback((url: string) => {
    return url;
  }, []);

  // Global Fetch Interceptor to inject x-visitor-id and x-master-key headers
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let urlString = '';
      if (typeof input === 'string') {
        urlString = input;
      } else if (input instanceof URL) {
        urlString = input.href;
      } else if (input && typeof input === 'object' && 'url' in input) {
        urlString = (input as Request).url;
      }

      const isInternalApi =
        urlString.startsWith(API_BASE_URL) ||
        !/^(?:https?:)?\/\//i.test(urlString);

      if (!isInternalApi) {
        return originalFetch(input, init);
      }

      const mk = sessionStorage.getItem('mk') || localStorage.getItem('mk');
      const token = localStorage.getItem('accessToken');

      const newInit = { ...init };
      const headers = new Headers(init?.headers);

      if (mk) {
        headers.set('x-master-key', mk);
      }
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      newInit.headers = headers;

      let response = await originalFetch(input, newInit);

      if (
        response.status === 401 &&
        token &&
        !urlString.includes('/auth/login') &&
        !urlString.includes('/auth/refresh')
      ) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          newInit.headers = headers;
          response = await originalFetch(input, newInit);
        }
      }

      if (response.status === 403 && !urlString.includes('/user/register')) {
        try {
          const clone = response.clone();
          const errData = await clone.json();
          if (
            errData.message === '차단된 사용자입니다.' ||
            errData.message?.includes('차단된')
          ) {
            if (!isGoogleBot) {
              setIsBlockedUser(true);
            }
            if (errData.ip) setClientIp(errData.ip);
          }
        } catch {
          // Ignore
        }
      }

      const isFirstVisit = response.headers.get('x-first-visit') === 'true';
      const hasConsented =
        localStorage.getItem('hactto_welcome_consented') === 'true';
      if (isFirstVisit && !hasConsented) {
        setShowWelcomeModal(true);
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const checkIpStatus = useCallback(
    async (silent = false) => {
      try {
        await Promise.resolve();
        if (!silent) setLoading(true);

        // Bypass IP block fetch for Google Crawler bots
        if (isGoogleBot) {
          setIsBlockedUser(false);
          setAllowed(true);
          setLoading(false);
          return;
        }

        const savedMk = localStorage.getItem('mk');
        const token = localStorage.getItem('accessToken');
        const authHeaders: HeadersInit | undefined = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        // If a Master Key is saved locally, verify it
        if (savedMk) {
          const adminRes = await fetch(
            `${API_BASE_URL}/check-ip?mk=${encodeURIComponent(savedMk)}`,
            { headers: authHeaders },
          );
          const adminData = await adminRes.json();
          const adminResult = adminData.data || adminData;

          if (adminRes.ok && adminResult.allowed) {
            const fHon = adminResult.hon?.freeBalance || 0;
            const pHon = adminResult.hon?.paidBalance || 0;
            setFreeHon(fHon);
            setPaidHon(pHon);
            setSubscription(adminResult.subscription || null);
            setAllowed(true);
            setPending(false);
            setClientIp(adminResult.ip || 'unknown');
            setIsBlockedUser(false);
            const isFirstVisit =
              adminRes.headers.get('x-first-visit') === 'true';
            const hasConsented =
              localStorage.getItem('hactto_welcome_consented') === 'true';
            if (!hasConsented) {
              if (isFirstVisit) {
                setShowWelcomeModal(true);
              } else {
                localStorage.setItem('hactto_welcome_consented', 'true');
              }
            }
            setLoading(false);
            return;
          } else {
            localStorage.removeItem('mk');
          }
        }

        // Default IP check (always allowed now)
        const res = await fetch(`${API_BASE_URL}/check-ip`, {
          credentials: 'include',
          headers: authHeaders,
        });

        if (!res.ok) {
          if (res.status === 403) {
            try {
              const errData = await res.json();
              if (
                errData.message === '차단된 사용자입니다.' ||
                errData.message?.includes('차단된')
              ) {
                setIsBlockedUser(true);
                if (errData.ip) setClientIp(errData.ip);
                setLoading(false);
                return;
              }
            } catch {
              // Ignore
            }
          }
          throw new Error('IP 상태를 조회하는 중 오류가 발생했습니다.');
        }

        const data = await res.json();
        const result = data.data || data;

        const fHon = result.hon?.freeBalance || 0;
        const pHon = result.hon?.paidBalance || 0;
        setFreeHon(fHon);
        setPaidHon(pHon);
        setSubscription(result.subscription || null);
        setAllowed(true);
        setPending(false);
        if (result.ip) setClientIp(result.ip);

        const isFirstVisit = res.headers.get('x-first-visit') === 'true';
        const hasConsented =
          localStorage.getItem('hactto_welcome_consented') === 'true';
        if (!hasConsented) {
          if (isFirstVisit) {
            setShowWelcomeModal(true);
          } else {
            localStorage.setItem('hactto_welcome_consented', 'true');
          }
        }
      } catch (err: unknown) {
        console.error(err);
        setAllowed(true);
        setPending(false);
        setClientIp('알 수 없음');
        const error = err as Error;
        showAlert('error', error.message || '서버 연결에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [showAlert],
  );

  // Register/Verify Master Key
  const handleMasterKeySubmit = useCallback(
    async (key: string): Promise<boolean> => {
      if (!key.trim()) {
        showAlert('error', 'Master key를 입력해주세요.');
        return false;
      }

      try {
        setSubmitting(true);
        setAlert(null);

        const res = await fetch(
          `${API_BASE_URL}/check-ip?mk=${encodeURIComponent(key)}`,
        );
        const data = await res.json();
        const result = data.data || data;

        if (!res.ok || !result.allowed) {
          throw new Error(
            '올바르지 않은 Master key이거나 인증에 실패했습니다.',
          );
        }

        localStorage.setItem('mk', key);
        showAlert(
          'success',
          'Master key 인증 성공! 플랫폼 접근 권한이 부여되었습니다.',
        );

        // Reload states
        await checkIpStatus();
        return true;
      } catch (err: unknown) {
        console.error(err);
        const error = err as Error;
        showAlert(
          'error',
          error.message || 'Master key 검증 중 오류가 발생했습니다.',
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [checkIpStatus, showAlert],
  );

  // Load administrative data from Redis (Simplifying to only verify Master Key)
  const loadAdminData = useCallback(async (key: string) => {
    try {
      setAdminError('');

      const res = await fetch(
        `${API_BASE_URL}/check-ip?mk=${encodeURIComponent(key)}`,
      );
      if (!res.ok) throw new Error('마스터키 인증 실패');
      const data = await res.json();
      const result = data.data || data;

      if (!result.allowed) {
        throw new Error('올바르지 않은 마스터키입니다.');
      }

      sessionStorage.setItem('mk', key);
      setIsAdminMode(true);
      setIsBlockedUser(false);

      return {
        pendingIps: [],
        allowedIps: [],
        masterKeys: [],
      };
    } catch (err: unknown) {
      console.error(err);
      const errMsg = '관리자 키 인증 실패 또는 데이터를 불러오지 못했습니다.';
      setAdminError(errMsg);
      sessionStorage.removeItem('mk');
      setIsAdminMode(false);
      throw err;
    }
  }, []);

  // Logout from Admin
  const handleAdminLogout = useCallback(() => {
    sessionStorage.removeItem('mk');
    setIsAdminMode(false);
    setAdminKey('');
    checkIpStatus();
  }, [checkIpStatus]);

  useEffect(() => {
    checkIpStatus();
    fetchAndCacheAlgorithms();

    const savedKey = sessionStorage.getItem('mk');
    if (savedKey) {
      setIsAdminMode(true);
      loadAdminData(savedKey).catch(() => {});
    }
  }, [checkIpStatus, loadAdminData]);

  useEffect(() => {
    checkIpStatus(true);
  }, [user?.id, checkIpStatus]);

  // Handle system status check (REST) & real-time updates (WebSocket)
  useEffect(() => {
    if (isBlockedUser) return;

    let socket: import('socket.io-client').Socket | null = null;

    const checkSystemStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/system/status`);
        if (res.ok) {
          const data = await res.json();
          const result = data.data || data;
          setIsSystemAnalyzing(!!result.inProgress);
          if (result.inProgress) {
            setSystemAnalysisProgress({
              progress: result.progress || 0,
              message: result.message || '',
              estimatedCompletionTime: result.estimatedCompletionTime,
            });
          } else {
            setSystemAnalysisProgress(null);
          }
        }
      } catch (err) {
        console.error('시스템 상태 조회 실패:', err);
      }
    };

    const connectWebSocket = async () => {
      if (socket) {
        socket.disconnect();
      }

      // dynamically import socket.io-client so we don't break SSR or bundle unnecessarily if possible,
      // though top level import is fine too. Let's do dynamic import to be safe if it's not imported at top.
      const { io } = await import('socket.io-client');

      const url = new URL(API_BASE_URL);
      socket = io(url.origin, {
        reconnection: true,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 10000,
        transports: ['websocket'], // Force websocket
      });

      socket.on('system-status', (data) => {
        try {
          setIsSystemAnalyzing(!!data.inProgress);
          if (data.inProgress) {
            setSystemAnalysisProgress({
              progress: data.progress || 0,
              message: data.message || '',
              estimatedCompletionTime: data.estimatedCompletionTime,
            });
          } else {
            setSystemAnalysisProgress(null);
          }
        } catch (err) {
          console.error('시스템 상태 WebSocket 처리 실패:', err);
        }
      });

      socket.on('connect_error', (err) => {
        console.error('시스템 상태 WebSocket 연결 에러:', err);
      });
    };

    checkSystemStatus();
    connectWebSocket();

    // Re-check on window focus for extra robustness
    const handleFocus = () => {
      checkSystemStatus();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (socket) socket.disconnect();
      window.removeEventListener('focus', handleFocus);
    };
  }, [isBlockedUser]);

  return (
    <AppContext.Provider
      value={{
        loading,
        allowed,
        pending,
        clientIp,
        isAdminMode,
        setIsAdminMode,
        showAdminModal,
        setShowAdminModal,
        adminKey,
        setAdminKey,
        adminError,
        setAdminError,
        alert,
        setAlert,
        showAlert,
        submitting,
        setSubmitting,
        checkIpStatus,
        handleMasterKeySubmit,
        loadAdminData,
        handleAdminLogout,
        appendAuth,
        hasUnsavedWeights,
        setHasUnsavedWeights,
        showUnsavedModal,
        setShowUnsavedModal,
        unsavedActionTarget,
        setUnsavedActionTarget,
        isSystemAnalyzing,
        setIsSystemAnalyzing,
        systemAnalysisProgress,
        showWelcomeModal,
        setShowWelcomeModal,
        freeHon,
        paidHon,
        subscription,
        nickname,
        setNickname,
        isBlockedUser,
        setIsBlockedUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
export default AppProvider;
