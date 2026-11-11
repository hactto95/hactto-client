import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';

export const Restore = () => {
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

    fetch(`${API_BASE_URL}/auth/restore/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || '복원 처리에 실패했습니다.');
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
        복원 처리 중...
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
            <div className="mb-4 text-lg font-bold text-error">복원 실패</div>
            <p className="mb-6 text-muted">{error}</p>
          </>
        ) : success ? (
          <>
            <div className="mb-4 text-2xl font-bold text-success">
              복원 성공!
            </div>
            <p className="mb-6 text-muted">
              계정이 성공적으로 복원되었습니다. 이제 다시 로그인하여 서비스를
              이용하실 수 있습니다.
            </p>
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
