/* eslint-disable */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../utils';

interface User {
  id: string;
  email: string | null;
  nickname: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    accessToken: string,
    refreshToken: string,
    userData?: User | null,
  ) => void;
  logout: () => void;
  getAccessToken: () => string | null;
  requireAuthAction: (callback: () => void) => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    const payload = JSON.parse(atob(padded));
    if (typeof payload?.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const decodeUserFromToken = (token: string | null): User | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    const payload = JSON.parse(atob(padded));
    const id = payload?.sub || payload?.id;
    if (!id) return null;
    return {
      id: String(id),
      email: typeof payload.email === 'string' ? payload.email : null,
      nickname: typeof payload.nickname === 'string' ? payload.nickname : null,
      avatarUrl:
        typeof payload.avatarUrl === 'string' ? payload.avatarUrl : null,
    };
  } catch {
    return null;
  }
};

export const clearAuthAndNotify = (isExpired = true) => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:logout'));
  if (isExpired) {
    window.dispatchEvent(
      new CustomEvent('auth:required', {
        detail: {
          title: '세션이 만료되었습니다',
          desc: '로그인 세션이 만료되어 자동으로 로그아웃되었습니다.\n다시 로그인해 주세요.',
        },
      }),
    );
  }
};

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken || isTokenExpired(refreshToken)) {
    clearAuthAndNotify(true);
    return null;
  }

  refreshPromise = (async () => {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const payload = refreshData.data || refreshData;
        const { accessToken, refreshToken: newRefresh } = payload;
        localStorage.setItem('accessToken', accessToken);
        if (newRefresh) {
          localStorage.setItem('refreshToken', newRefresh);
        }
        return accessToken as string;
      } else {
        clearAuthAndNotify(true);
        return null;
      }
    } catch {
      clearAuthAndNotify(true);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    if (token) {
      if (isTokenExpired(token) && isTokenExpired(refreshToken)) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return null;
      }
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            return parsed as User;
          }
        } catch {
          // Fall back to token decoding
        }
      }
      const fallbackUser = decodeUserFromToken(token);
      if (fallbackUser) {
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
    }
    return null;
  });

  const syncUserFromServer = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || isTokenExpired(token)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const resData = await res.json();
        const raw = resData.data?.data || resData.data || resData;
        if (raw && typeof raw === 'object' && raw.id) {
          const syncedUser: User = {
            id: String(raw.id),
            email: raw.email ?? null,
            nickname: raw.nickname ?? null,
            avatarUrl: raw.avatarUrl ?? null,
          };
          localStorage.setItem('user', JSON.stringify(syncedUser));
          setUser(syncedUser);
        }
      }
    } catch {
      // Ignore network errors during background profile sync
    }
  };

  const login = (
    accessToken: string,
    refreshToken: string,
    userData?: User | null,
  ) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const decoded = decodeUserFromToken(accessToken);
    const resolvedUser: User | null =
      userData && typeof userData === 'object' && userData.id
        ? userData
        : decoded
          ? {
              ...decoded,
              email: userData?.email || decoded.email,
              nickname: userData?.nickname || decoded.nickname,
              avatarUrl: userData?.avatarUrl || decoded.avatarUrl,
            }
          : null;

    if (resolvedUser) {
      localStorage.setItem('user', JSON.stringify(resolvedUser));
      setUser(resolvedUser);
    }

    if (!userData?.id || !userData?.email) {
      void syncUserFromServer();
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };
    window.addEventListener('auth:logout', handleAuthLogout);

    const token = localStorage.getItem('accessToken');
    if (token) {
      if (isTokenExpired(token)) {
        void refreshAccessToken().then((newToken) => {
          if (newToken) {
            void syncUserFromServer();
          }
        });
      } else {
        void syncUserFromServer();
      }
    }

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const updateUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const getAccessToken = () => localStorage.getItem('accessToken');

  const requireAuthAction = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      window.dispatchEvent(new CustomEvent('auth:required'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        getAccessToken,
        requireAuthAction,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Helper for authenticated fetch
export const authFetch = async (url: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('accessToken');
  if (
    token &&
    isTokenExpired(token) &&
    !url.includes('/auth/login') &&
    !url.includes('/auth/refresh')
  ) {
    token = await refreshAccessToken();
  }
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (
    response.status === 401 &&
    !url.includes('/auth/login') &&
    !url.includes('/auth/refresh')
  ) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        clearAuthAndNotify(true);
      }
    } else {
      clearAuthAndNotify(true);
    }
  }

  return response;
};
