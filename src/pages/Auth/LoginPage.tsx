import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { HacttoLogo } from '../../components/HacttoLogo';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '로그인 실패');
      }

      const resData = await res.json();
      const payload = resData.data || resData;
      login(payload.accessToken, payload.refreshToken, payload.user);

      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/home');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col justify-between bg-canvas px-4 py-6">
      {/* Top Bar */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-glass-border bg-card px-3.5 py-2 text-xs font-semibold text-main shadow-xs transition-colors hover:bg-surface-hover"
        >
          <svg
            width="16"
            height="16"
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
          <span>홈으로</span>
        </button>

        <ThemeToggle />
      </div>

      {/* Center Bento Card */}
      <div className="mx-auto my-8 grid w-full max-w-[920px] grid-cols-1 overflow-hidden rounded-3xl border border-glass-border bg-card shadow-glass lg:grid-cols-12">
        {/* Left: Login Form */}
        <div className="flex flex-col justify-center p-8 sm:p-10 lg:col-span-6">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2.5">
              <HacttoLogo size={28} />
              <span className="font-display text-lg font-extrabold text-main">
                Hactto
              </span>
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-main">
              다시 만나서 반가워요
            </h1>
            <p className="mt-1 text-sm text-muted">
              이메일 계정으로 로그인하고 AI 예측 및 당첨 이력을 관리하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                이메일 주소
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glow"
                required
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glow"
                required
                placeholder="비밀번호를 입력해주세요"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-xs font-semibold text-error">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-submit mt-2 w-full py-3.5 text-sm font-bold"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-glass-border pt-5 text-xs font-semibold">
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-primary-cyan hover:underline"
              onClick={() => navigate('/signup')}
            >
              계정이 없으신가요? 회원가입
            </button>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-muted hover:text-main"
              onClick={() => navigate('/reset-password-request')}
            >
              비밀번호 재설정
            </button>
          </div>
        </div>

        {/* Right: Brand Feature Showcase (Toss / Linear Style) */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary-cyan/10 via-primary-purple/8 to-transparent p-10 lg:col-span-6 lg:flex">
          <div>
            <div className="mb-4">
              <span className="inline-flex rounded-full bg-primary-cyan/15 px-3 py-1 text-xs font-bold text-primary-cyan">
                AI 데이터 기반 로또 분석 플랫폼
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl leading-snug font-extrabold text-main">
              역대 모든 회차의 패턴을
              <br />
              가장 직관적인 데이터로 확인하세요
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              단순 무작위 추출이 아닌 자리별 빈도, 역가중치 가설, 번호 온도와
              궁합수까지 정밀하게 분석해 드립니다.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <div className="rounded-2xl border border-glass-border bg-card/85 p-4 backdrop-blur-md">
              <div className="text-xs font-bold text-primary-cyan">
                실시간 당첨 대조
              </div>
              <div className="mt-1 text-xs text-muted">
                생성하거나 직접 저장한 번호의 당첨 등수를 추첨 즉시 자동으로
                대조합니다.
              </div>
            </div>
            <div className="rounded-2xl border border-glass-border bg-card/85 p-4 backdrop-blur-md">
              <div className="text-xs font-bold text-primary-purple">
                커스텀 가중치 시뮬레이터
              </div>
              <div className="mt-1 text-xs text-muted">
                나만의 알고리즘 가중치를 설정하고 조합 복잡도(AC)와 총합
                밸런스를 검증하세요.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-dim">
        © {new Date().getFullYear()} hactto. All rights reserved.
      </div>
    </div>
  );
};
