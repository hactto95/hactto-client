import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAuthModal({ isOpen, onClose }: AdminAuthModalProps) {
  const {
    adminKey,
    setAdminKey,
    adminError,
    setAdminError,
    loadAdminData,
    showAlert,
    isAdminMode,
  } = useApp();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAdminKey('');
      setAdminError('');
      // focus input
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen, setAdminKey, setAdminError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAdminError('관리자 키를 입력하세요.');
      return;
    }
    try {
      await loadAdminData(adminKey);
      showAlert('success', '관리자 인증에 성공했습니다.');
      onClose();
    } catch {
      // error is handled by AppContext / loadAdminData
    }
  };

  if (!isOpen) return null;
  if (isAdminMode) {
    onClose();
    return null;
  }

  return (
    <div
      className="fixed inset-0 w-full h-full bg-overlay flex justify-center items-center z-[99999] backdrop-blur-[10px] overflow-hidden"
      onClick={onClose}
    >
      <div
        className="glass-card w-[360px] p-6 bg-card border border-glass-border flex flex-col gap-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="m-0 text-primary-cyan text-[1.2rem]">관리자 인증</h3>
        <p className="m-0 text-dim text-[0.85rem]">
          OTP (관리자 키)를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin Key"
              className="input-glow w-full box-border"
            />
            {adminError && (
              <div className="text-error text-xs mt-1.5">{adminError}</div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-2.5 bg-surface hover:bg-surface-hover border border-glass-border text-dim hover:text-main rounded-md cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 p-2.5 bg-primary-cyan text-white border-none rounded-lg cursor-pointer font-bold hover:opacity-90 transition-opacity"
            >
              인증
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
