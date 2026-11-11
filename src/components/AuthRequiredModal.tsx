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
    <div className="fixed inset-0 bg-overlay backdrop-blur-xs z-[9999] flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-modal border border-glass-border-strong rounded-2xl p-8 max-w-[400px] w-[90%] shadow-glass flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary-cyan/10 flex items-center justify-center mx-auto mb-4 text-primary-cyan">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="m-0 mb-2 text-main text-xl font-bold">
            {modalMessage.title}
          </h3>
          <p className="m-0 text-dim text-[0.9rem] leading-normal whitespace-pre-line">
            {modalMessage.desc}
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => setShowAuthModal(false)}
            className="flex-1 p-3 bg-surface hover:bg-surface-hover border border-glass-border text-main rounded-lg cursor-pointer font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => {
              setShowAuthModal(false);
              navigate('/login');
            }}
            className="flex-1 p-3 bg-primary-cyan hover:bg-primary-cyan/90 text-white border-none rounded-xl cursor-pointer font-semibold transition-all"
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
};
