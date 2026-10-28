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
      <div
        className="glass-card admin-modal-content"
        style={{ maxWidth: '440px', overflow: 'hidden' }}
      >
        {/* Warning Icon */}
        <div
          className="status-icon"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            marginBottom: '20px',
          }}
        >
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

        <h2
          className="access-title"
          style={{ fontSize: '1.35rem', marginBottom: '8px' }}
        >
          저장되지 않은 변경 사항
        </h2>

        <p
          className="access-desc"
          style={{
            fontSize: '0.88rem',
            marginBottom: '24px',
            lineHeight: '1.6',
          }}
        >
          가중치 설정이 변경되었으나 아직 저장되지 않았습니다. 이동할 경우
          변경된 설정이 모두 초기화되며 유실됩니다. 저장하지 않고
          이동하시겠습니까?
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            type="button"
            className="btn-submit"
            style={{
              flex: 1,
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              fontWeight: 600,
            }}
            onClick={handleLeave}
          >
            이동하기 (저장 안 함)
          </button>
          <button
            type="button"
            className="btn-neon btn-outline"
            style={{
              flex: 1,
              padding: 0,
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
            }}
            onClick={handleStay}
          >
            머무르기
          </button>
        </div>
      </div>
    </div>
  );
}
