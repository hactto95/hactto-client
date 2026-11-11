import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { ThemeToggle } from '../../components/ThemeToggle';

export const VerifySignup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('유효하지 않은 접근입니다.');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/verify-signup?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('만료되었거나 유효하지 않은 링크입니다.');
        return res.json();
      })
      .then((data) => {
        const verifiedEmail = data.data?.email || data.email;
        if (!verifiedEmail) {
          throw new Error('이메일 정보를 불러올 수 없습니다.');
        }
        setEmail(verifiedEmail);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        '비밀번호는 영문 대소문자, 숫자, 특수기호를 모두 포함하여 10자리 이상이어야 합니다.',
      );
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nickname, password, token }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '회원가입에 실패했습니다.');
      }
      navigate('/login');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-dvh w-full items-center justify-center bg-canvas">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>
        <div className="text-sm font-medium text-muted">
          인증 정보를 확인하고 있어요...
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="relative flex min-h-dvh w-full items-center justify-center bg-canvas px-4">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>
        <div className="bento-card max-w-md p-8 text-center">
          <div className="text-base font-bold text-error">{error}</div>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="btn-submit mt-5 px-6 py-2.5 text-xs"
          >
            다시 인증 요청하기
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
          프로필 설정
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          인증된 이메일: <strong className="text-primary-cyan">{email}</strong>
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-glow"
              required
              placeholder="사용하실 닉네임을 입력해주세요"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              비밀번호{' '}
              <span className="font-normal text-dim">
                (영문 대소문자/숫자/특수기호 포함 10자 이상)
              </span>
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

          {error && (
            <div className="rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-xs font-semibold text-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitLoading}
            className="btn-submit mt-2 w-full py-3.5 text-sm font-bold"
          >
            {submitLoading ? '가입 처리 중...' : '가입 완료하기'}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-dim">
        © {new Date().getFullYear()} hactto. All rights reserved.
      </div>
    </div>
  );
};
