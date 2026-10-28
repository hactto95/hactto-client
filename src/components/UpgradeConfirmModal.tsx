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
      className="admin-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1200 }} // Ensure it shows on top of PaymentModal (zIndex 1000)
    >
      <div
        className="glass-card admin-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '30px 24px 24px 24px',
          textAlign: 'center',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Info Icon with Premium Purple/Yellow Glow */}
        <div
          className="status-icon"
          style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid #eab308',
            color: '#eab308',
            marginBottom: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(234, 179, 8, 0.2)',
          }}
        >
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

        <h2
          className="logo-glow"
          style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#eab308',
          }}
        >
          구독 변경 및 연장 안내
        </h2>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-dim)',
            lineHeight: '1.65',
            margin: '0 0 20px 0',
            textAlign: 'center',
          }}
        >
          현재 <strong>월간 무제한 구독</strong>을 이용 중입니다. <br />
          연간 구독으로 변경 시, 기존 남은 이용 기간에{' '}
          <strong style={{ color: '#ffffff' }}>1년이 추가로 연장</strong>됩니다.
          계속 진행하시겠습니까?
        </p>

        {currentEndsAt && expectedEndsAt && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '14px 16px',
              borderRadius: '8px',
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.82rem',
              color: 'var(--text-dim)',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>현재 구독 만료일</span>
              <span style={{ color: '#ffffff', fontWeight: '500' }}>
                {formatDate(currentEndsAt)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>연장 후 만료 예정일</span>
              <span
                style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}
              >
                {formatDate(expectedEndsAt)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            type="button"
            className="secondary-btn"
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '20px',
              fontSize: '0.88rem',
              fontWeight: '600',
              padding: 0,
            }}
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              height: '42px',
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              color: '#090a0f',
              boxShadow: '0 4px 15px rgba(234, 179, 8, 0.35)',
              fontWeight: '700',
              fontSize: '0.88rem',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow =
                '0 6px 20px rgba(234, 179, 8, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 4px 15px rgba(234, 179, 8, 0.35)';
            }}
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
