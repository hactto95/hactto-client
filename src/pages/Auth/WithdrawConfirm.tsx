import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';

export const WithdrawConfirm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('유효하지 않은 접근입니다.');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/withdraw/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || '탈퇴 처리에 실패했습니다.');
        }
        setSuccess(true);
        logout(); // ensure clean state
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, logout]);

  if (loading)
    return (
      <div className="relative flex min-h-screen w-screen items-center justify-center bg-canvas p-10 text-main">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle className="h-10 w-10" />
        </div>
        탈퇴 처리 중...
      </div>
    );

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-canvas p-4">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle className="h-10 w-10" />
      </div>
      <div className="w-full max-w-md rounded-xl border border-glass-border bg-card p-8 text-center shadow-glass backdrop-blur-md">
        {error ? (
          <>
            <div className="mb-4 text-lg font-bold text-error">탈퇴 실패</div>
            <p className="mb-6 text-muted">{error}</p>
          </>
        ) : success ? (
          <>
            <div className="mb-4 text-2xl font-bold text-success">
              탈퇴 완료
            </div>
            <p className="mb-4 text-muted">
              계정이 성공적으로 탈퇴 처리되었습니다.
            </p>
            <div className="mb-6 rounded-lg border border-glass-border bg-surface p-4 text-left text-sm text-muted">
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  탈퇴한 날로부터 <strong className="text-main">1년간</strong>{' '}
                  탈퇴 유예 기간이 주어집니다.
                </li>
                <li>
                  이메일 인증을 통해 1년 내에 언제든 계정을 복원할 수 있습니다.
                </li>
                <li>
                  1년이 경과하면 모든 데이터가 완전히 삭제되며 복원이
                  불가능합니다.
                </li>
              </ul>
            </div>
          </>
        ) : null}

        <button
          onClick={() => navigate('/home')}
          className="cursor-pointer rounded-xl bg-primary-cyan px-6 py-2.5 font-semibold text-white transition-all hover:opacity-90 border-none"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};
