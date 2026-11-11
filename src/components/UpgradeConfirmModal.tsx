import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface UpgradeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subscriptionEndsAt?: string | null;
}

export const UpgradeConfirmModal: React.FC<UpgradeConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subscriptionEndsAt,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentEndsAt = subscriptionEndsAt
    ? new Date(subscriptionEndsAt)
    : null;
  const expectedEndsAt = currentEndsAt
    ? new Date(currentEndsAt.getTime())
    : null;
  if (expectedEndsAt) {
    expectedEndsAt.setFullYear(expectedEndsAt.getFullYear() + 1);
  }

  return createPortal(
    <div
      className="admin-modal-overlay z-[1200]" // Ensure it shows on top of PaymentModal (zIndex 1000)
      onClick={onClose}
    >
      <div
        className="glass-card admin-modal-content max-w-[440px] w-[90%] flex flex-col items-center pt-[30px] px-6 pb-6 text-center overflow-hidden animate-[fadeIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Info Icon with Premium Purple/Yellow Glow */}
        <div className="status-icon bg-yellow-500/10 border border-yellow-500 text-yellow-500 mb-5 w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>

        <h2 className="logo-glow text-[1.3rem] font-bold mb-3 text-yellow-500">
          구독 변경 및 연장 안내
        </h2>

        <p className="text-[0.88rem] text-dim leading-[1.65] m-0 mb-5 text-center">
          현재 <strong>월간 무제한 구독</strong>을 이용 중입니다. <br />
          연간 구독으로 변경 시, 기존 남은 이용 기간에{' '}
          <strong className="text-main">1년이 추가로 연장</strong>됩니다. 계속
          진행하시겠습니까?
        </p>

        {currentEndsAt && expectedEndsAt && (
          <div className="bg-surface border border-glass-border px-4 py-3.5 rounded-lg w-full box-border mb-6 flex flex-col gap-2 text-[0.82rem] text-dim text-left">
            <div className="flex justify-between items-center">
              <span>현재 구독 만료일</span>
              <span className="text-main font-medium">
                {formatDate(currentEndsAt)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>연장 후 만료 예정일</span>
              <span className="text-primary-cyan font-bold">
                {formatDate(expectedEndsAt)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 w-full">
          <button
            type="button"
            className="secondary-btn flex-1 h-[42px] rounded-[20px] text-[0.88rem] font-semibold p-0 bg-surface hover:bg-surface-hover border border-glass-border text-main cursor-pointer transition-colors"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="flex-1 h-[42px] bg-linear-to-br from-yellow-500 to-yellow-600 text-slate-950 shadow-lg shadow-yellow-500/35 hover:-translate-y-px hover:shadow-xl hover:shadow-yellow-500/50 font-bold text-[0.88rem] border-none rounded-[20px] cursor-pointer transition-all duration-200"
            onClick={onConfirm}
          >
            연장 및 결제하기 🚀
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
