import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { ThemeToggle } from '../../components/ThemeToggle';

export const SignupRequestPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '인증 메일 전송에 실패했습니다.');
      }

      setSuccessMsg('인증 메일이 발송되었습니다. 메일함을 확인해주세요.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col justify-between bg-canvas px-4 py-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-glass-border bg-card px-3.5 py-2 text-xs font-semibold text-main shadow-xs transition-colors hover:bg-surface-hover"
        >
          ← 돌아가기
        </button>
        <ThemeToggle />
      </div>

      <div className="mx-auto my-8 w-full max-w-[440px] rounded-3xl border border-glass-border bg-card p-8 shadow-glass sm:p-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-cyan text-base font-extrabold text-white">
            H
          </div>
          <h1 className="font-display text-2xl font-extrabold text-main">
            회원가입 시작하기
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            가입하실 이메일 주소를 입력하시면
            <br />
            본인 확인을 위한 인증 링크를 보내드립니다.
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

          {errorMsg && (
            <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-xs font-semibold text-error">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-primary-cyan/25 bg-primary-cyan/10 px-3.5 py-3 text-xs font-semibold text-primary-cyan">
              <div>{successMsg}</div>
              <div className="mt-1 font-normal text-muted">
                메일이 오지 않았다면 스팸함이나 휴지통을 확인해 주세요.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-submit mt-2 w-full py-3.5 text-sm font-bold"
          >
            {loading
              ? '발송 중...'
              : successMsg
                ? '인증 메일 재발송'
                : '인증 메일 보내기'}
          </button>
        </form>

        <div className="mt-6 border-t border-glass-border pt-4 text-center text-xs text-muted">
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="cursor-pointer border-none bg-transparent p-0 font-bold text-primary-cyan hover:underline"
          >
            로그인하기
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-dim">
        © {new Date().getFullYear()} hactto. All rights reserved.
      </div>
    </div>
  );
};
