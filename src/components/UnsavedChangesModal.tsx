import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onClose,
}: UnsavedChangesModalProps) {
  const { unsavedActionTarget, setUnsavedActionTarget, setHasUnsavedWeights } =
    useApp();

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

  const handleLeave = () => {
    if (unsavedActionTarget) {
      unsavedActionTarget();
    }
    setHasUnsavedWeights(false);
    setUnsavedActionTarget(null);
    onClose();
  };

  const handleStay = () => {
    setUnsavedActionTarget(null);
    onClose();
  };

  return (
    <div className="admin-modal-overlay">
      <div className="glass-card admin-modal-content max-w-[440px] overflow-hidden">
        {/* Warning Icon */}
        <div className="status-icon bg-error/10 border border-error text-error mb-5">
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

        <h2 className="access-title text-[1.35rem] mb-2">
          저장되지 않은 변경 사항
        </h2>

        <p className="access-desc text-[0.88rem] mb-6 leading-[1.6]">
          가중치 설정이 변경되었으나 아직 저장되지 않았습니다. 이동할 경우
          변경된 설정이 모두 초기화되며 유실됩니다. 저장하지 않고
          이동하시겠습니까?
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2.5 w-full">
          <button
            type="button"
            className="btn-submit flex-1 h-[42px] flex items-center justify-center bg-linear-to-br from-red-500 to-red-700 text-white shadow-[0_4px_15px_var(--error-glow)] font-semibold border-none"
            onClick={handleLeave}
          >
            이동하기 (저장 안 함)
          </button>
          <button
            type="button"
            className="btn-neon btn-outline flex-1 p-0 h-[42px] flex items-center justify-center m-0"
            onClick={handleStay}
          >
            머무르기
          </button>
        </div>
      </div>
    </div>
  );
}
