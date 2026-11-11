import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { ThemeToggle } from '../../components/ThemeToggle';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMsg('유효하지 않은 접근입니다.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg(
        '비밀번호는 영문 대소문자, 숫자, 특수기호를 모두 포함하여 10자리 이상이어야 합니다.',
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '비밀번호 재설정에 실패했습니다.');
      }

      navigate('/login');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-dvh w-full items-center justify-center bg-canvas px-4">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>
        <div className="bento-card max-w-md p-8 text-center">
          <div className="text-base font-bold text-error">{errorMsg}</div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-submit mt-5 px-6 py-2.5 text-xs"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col justify-between bg-canvas px-4 py-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end">
        <ThemeToggle />
      </div>

      <div className="mx-auto my-8 w-full max-w-[440px] rounded-3xl border border-glass-border bg-card p-8 shadow-glass sm:p-10">
        <h1 className="mb-2 text-center font-display text-2xl font-extrabold text-main">
          새 비밀번호 설정
        </h1>
        <p className="mb-6 text-center text-sm leading-relaxed text-muted">
          새로운 비밀번호를 입력해주세요.
          <br />
          <span className="text-xs text-dim">
            (영문 대소문자, 숫자, 특수기호 포함 10자리 이상)
          </span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              새 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glow"
              required
              placeholder="새 비밀번호를 입력해주세요"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="input-glow"
              required
              placeholder="비밀번호를 한번 더 입력해주세요"
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
            {loading ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-dim">
        © {new Date().getFullYear()} hactto. All rights reserved.
      </div>
    </div>
  );
};
