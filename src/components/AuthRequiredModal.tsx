import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthRequiredModal: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<{
    title: string;
    desc: string;
  }>({
    title: '로그인이 필요합니다',
    desc: '해당 기능은 회원 전용입니다.\n로그인 후 다시 이용해주세요.',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRequired = (e?: Event) => {
      const customEvent = e as CustomEvent<{ title?: string; desc?: string }>;
      if (customEvent?.detail?.title || customEvent?.detail?.desc) {
        setModalMessage({
          title: customEvent.detail.title || '로그인이 필요합니다',
          desc:
            customEvent.detail.desc ||
            '해당 기능은 회원 전용입니다.\n로그인 후 다시 이용해주세요.',
        });
      } else {
        setModalMessage({
          title: '로그인이 필요합니다',
          desc: '해당 기능은 회원 전용입니다.\n로그인 후 다시 이용해주세요.',
        });
      }
      setShowAuthModal(true);
    };
    window.addEventListener('auth:required', handleAuthRequired);
    window.addEventListener('show-login-modal', handleAuthRequired);
    return () => {
      window.removeEventListener('auth:required', handleAuthRequired);
      window.removeEventListener('show-login-modal', handleAuthRequired);
    };
  }, []);

  if (!showAuthModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'rgba(16, 20, 31, 0.95)',
          border: '1px solid rgba(132, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(132, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--primary-cyan)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              color: '#fff',
              fontSize: '1.25rem',
            }}
          >
            {modalMessage.title}
          </h3>
          <p
            style={{
              margin: 0,
              color: 'var(--text-dim)',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
            }}
          >
            {modalMessage.desc}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            onClick={() => setShowAuthModal(false)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            취소
          </button>
          <button
            onClick={() => {
              setShowAuthModal(false);
              navigate('/login');
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--primary-cyan)',
              border: 'none',
              color: '#000',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px var(--primary-cyan)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
};
