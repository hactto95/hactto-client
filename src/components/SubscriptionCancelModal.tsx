import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SubscriptionCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export function SubscriptionCancelModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: SubscriptionCancelModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return createPortal(
    <div className="admin-modal-overlay z-[1200]" onClick={onClose}>
      <div
        className="glass-card admin-modal-content max-w-[420px] text-center pt-[30px] px-6 pb-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="status-icon bg-error/10 border border-error text-error mb-5 mx-auto">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2 className="access-title text-[1.3rem] mb-2.5">
          정기 구독 해지 안내
        </h2>

        <p className="access-desc text-[0.85rem] mb-6 leading-[1.6] text-dim">
          정말로 구독을 해지하시겠습니까?
          <br />
          해지 시 <strong>다음 결제일부터 자동 결제가 정지</strong>되며, 현재
          남은 구독 기간 동안은 서비스가 정상 제공됩니다.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2.5 w-full">
          <button
            type="button"
            className="btn-submit flex-1 h-10 bg-linear-to-br from-red-500 to-red-700 text-white shadow-[0_4px_15px_var(--error-glow)] font-semibold text-[0.85rem] border-none"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? '해지 처리 중...' : '구독 해지하기'}
          </button>
          <button
            type="button"
            className="btn-neon btn-outline flex-1 h-10 m-0 text-[0.85rem]"
            disabled={loading}
            onClick={onClose}
          >
            구독 유지하기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
