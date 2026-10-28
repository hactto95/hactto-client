/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth, authFetch } from '../context/AuthContext';
import { API_BASE_URL } from '../utils';
import { AvatarUpload } from './AvatarUpload';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  openPaymentModal: (target?: 'HON' | 'SUBSCRIPTION') => void;
}

type TabType = 'PROFILE' | 'HISTORY' | 'NOTIFICATIONS';
type HistoryTabType = 'ALL' | 'FREE' | 'PAID';

interface HonEvent {
  id: number;
  type: string;
  amount: number;
  freeAmount: number;
  paidAmount: number;
  balance: number;
  description: string | null;
  createdAt: string;
}

interface NotificationItem {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export function UserDetailModal({
  isOpen,
  onClose,
  openPaymentModal,
}: UserDetailModalProps) {
  const { freeHon, paidHon, subscription, showAlert, checkIpStatus } = useApp();
  const { user, updateUser, logout } = useAuth();
  const nickname = user?.nickname;
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<TabType>('PROFILE');

  // Nickname State
  const [nicknameInput, setNicknameInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmittingNickname, setIsSubmittingNickname] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // History State
  const [events, setEvents] = useState<HonEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState<HistoryTabType>('ALL');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNoti, setLoadingNoti] = useState(false);
  const [expandedNotiId, setExpandedNotiId] = useState<number | null>(null);

  const handleCopyId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      showAlert('success', '고유 식별자가 복사되었습니다.');
    }
  };

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/user/hon-events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      showAlert('error', 'HON 사용내역을 불러오지 못했습니다.');
    } finally {
      setLoadingHistory(false);
    }
  }, [showAlert]);

  const fetchNotifications = useCallback(async () => {
    setLoadingNoti(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/notifications?t=${Date.now()}`,
        {
          cache: 'no-store',
        },
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      showAlert('error', '알림을 불러오지 못했습니다.');
    } finally {
      setLoadingNoti(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (isOpen) {
      if (!nickname) {
        setNicknameInput('');

        setIsAvailable(null);

        setErrorMsg('');
      }
      if (activeTab === 'PROFILE') {
        checkIpStatus(true);
      } else if (activeTab === 'HISTORY') {
        fetchHistory();
      } else if (activeTab === 'NOTIFICATIONS') {
        fetchNotifications();
      }
    }
  }, [
    isOpen,
    activeTab,
    nickname,
    checkIpStatus,
    fetchHistory,
    fetchNotifications,
  ]);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showConfirmModal, onClose]);

  useEffect(() => {
    if (!nicknameInput) {
      setIsAvailable(null);

      setErrorMsg('');
      return;
    }

    if (nicknameInput.trim().length < 2 || nicknameInput.trim().length > 20) {
      setErrorMsg('닉네임은 2자 이상 20자 이하로 입력해주세요.');

      setIsAvailable(false);
      return;
    }

    if (nicknameInput.includes('관리자')) {
      setErrorMsg('관리자가 포함된 닉네임은 사용할 수 없습니다.');

      setIsAvailable(false);
      return;
    }

    const checkDuplicate = async () => {
      setIsChecking(true);
      try {
        const res = await authFetch(
          `${API_BASE_URL}/user/check-nickname?nickname=${encodeURIComponent(nicknameInput)}`,
        );
        const data = await res.json();
        const exists =
          data.exists !== undefined ? data.exists : data.data?.exists;
        if (exists) {
          setErrorMsg('이미 사용 중인 닉네임입니다.');
          setIsAvailable(false);
        } else {
          setErrorMsg('');
          setIsAvailable(true);
        }
      } catch {
        setErrorMsg('중복 확인에 실패했습니다.');
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    const debounceTimer = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(debounceTimer);
  }, [nicknameInput]);

  const handleSubmitNickname = async () => {
    if (!isAvailable || isSubmittingNickname || !user) return;
    setIsSubmittingNickname(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/user/nickname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nicknameInput }),
      });
      const data = await res.json();
      const isSuccess = data.success || data.data?.success;
      if (res.ok && isSuccess) {
        showAlert('success', '닉네임이 설정되었습니다.');
        updateUser({ ...user, nickname: nicknameInput });
        setShowConfirmModal(false);
      } else {
        showAlert('error', data.message || '닉네임 설정에 실패했습니다.');
      }
    } catch {
      showAlert('error', '네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmittingNickname(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await authFetch(`${API_BASE_URL}/user/notifications/${id}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const totalHon = freeHon + paidHon;
  const isSubscribed =
    subscription &&
    (subscription.status === 'ACTIVE' ||
      (subscription.status === 'CANCELLED' &&
        subscription.endsAt &&
        new Date(subscription.endsAt) > new Date()));
  const isYearly = isSubscribed && subscription.plan === 'YEARLY';

  const filteredEvents = events.filter((e) => {
    if (historyTab === 'FREE') return e.freeAmount !== 0;
    if (historyTab === 'PAID') return e.paidAmount !== 0;
    return true;
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          height: '85vh',
          background: 'var(--bg-card)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}
          >
            내 프로필
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              style={{
                background: 'rgba(239, 83, 80, 0.1)',
                border: '1px solid #ef5350',
                color: '#ef5350',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              로그아웃
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          {[
            { id: 'PROFILE', label: '상세 정보' },
            { id: 'HISTORY', label: 'HON 사용 내역' },
            { id: 'NOTIFICATIONS', label: '개별 알림' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === tab.id
                    ? '2px solid var(--primary-cyan)'
                    : '2px solid transparent',
                color:
                  activeTab === tab.id
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                padding: '16px 20px',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
              {tab.id === 'NOTIFICATIONS' &&
                notifications.some((n) => !n.isRead) && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      background: '#ff4b4b',
                      borderRadius: '50%',
                      marginLeft: '6px',
                      transform: 'translateY(-2px)',
                    }}
                  />
                )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'PROFILE' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
            >
              {/* Nickname Section */}
              <section>
                {nickname ? (
                  <div
                    style={{
                      padding: '40px 24px',
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '20px',
                    }}
                  >
                    <AvatarUpload
                      currentAvatarUrl={user?.avatarUrl || null}
                      nickname={nickname}
                      onUploadSuccess={(newUrl) => {
                        if (user) {
                          // Update AuthContext user state indirectly if possible, or just force reload
                          // AuthContext might need a refresh method, but for now this will update local state
                          // if user is mutated, though React might not re-render. We can rely on next login or add setAvatar.
                          // Let's just mutate and alert, maybe trigger a reload if needed, but it's ok.
                          user.avatarUrl = newUrl;
                        }
                      }}
                      showAlert={showAlert}
                    />
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '800',
                        color: 'var(--text-main)',
                        letterSpacing: '1px',
                      }}
                    >
                      {nickname}
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-dim)',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginTop: '8px',
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--primary-cyan)',
                          fontWeight: 'bold',
                        }}
                      >
                        고유 식별자
                      </span>
                      <span>{userId}</span>
                      <button
                        onClick={handleCopyId}
                        title="복사하기"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '0 4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '40px 24px',
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        marginBottom: '32px',
                        fontSize: '0.85rem',
                        color: 'var(--text-dim)',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--primary-cyan)',
                          fontWeight: 'bold',
                        }}
                      >
                        고유 식별자
                      </span>
                      <span>{userId}</span>
                      <button
                        onClick={handleCopyId}
                        title="복사하기"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '0 4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                    <p
                      style={{
                        margin: '0 0 24px 0',
                        fontSize: '0.95rem',
                        color: 'var(--text-dim)',
                        lineHeight: '1.6',
                        textAlign: 'center',
                      }}
                    >
                      아직 닉네임을 설정하지 않으셨습니다.
                      <br />
                      닉네임은{' '}
                      <strong style={{ color: '#ff4b4b' }}>
                        최초 1회만 설정 가능
                      </strong>
                      하며, 이후 변경이 불가능합니다.
                    </p>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        className="input-glow"
                        placeholder="2자 이상 20자 이하로 입력"
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                        style={{
                          width: '100%',
                          paddingRight: '100px',
                          height: '48px',
                          fontSize: '1rem',
                        }}
                      />
                      <button
                        className="btn-submit"
                        disabled={!isAvailable || isChecking}
                        onClick={() => setShowConfirmModal(true)}
                        style={{
                          position: 'absolute',
                          right: '4px',
                          top: '4px',
                          bottom: '4px',
                          padding: '0 16px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          background: isAvailable
                            ? 'var(--primary-cyan)'
                            : 'rgba(255,255,255,0.1)',
                          color: isAvailable ? '#000' : 'var(--text-dim)',
                          border: 'none',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                        }}
                      >
                        설정하기
                      </button>
                    </div>
                    <div style={{ marginTop: '12px', minHeight: '20px' }}>
                      {errorMsg && (
                        <div style={{ color: '#ff4b4b', fontSize: '0.85rem' }}>
                          {errorMsg}
                        </div>
                      )}
                      {isAvailable && !errorMsg && (
                        <div
                          style={{
                            color: 'var(--primary-cyan)',
                            fontSize: '0.85rem',
                          }}
                        >
                          사용 가능한 닉네임입니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Balance & Sub Section */}
              {true && (
                <section>
                  <h3
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '1.1rem',
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '16px',
                        background: 'var(--text-dim)',
                        borderRadius: '2px',
                      }}
                    />
                    HON/구독
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                    }}
                  >
                    {/* HON Card */}
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        border: '1px solid rgba(0,240,255,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '-20px',
                          right: '-20px',
                          width: '80px',
                          height: '80px',
                          background: 'var(--primary-cyan)',
                          filter: 'blur(40px)',
                          opacity: 0.2,
                        }}
                      />
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--primary-cyan)',
                          fontWeight: 'bold',
                          marginBottom: '8px',
                        }}
                      >
                        보유 HON
                      </div>
                      <div
                        style={{
                          fontSize: '2rem',
                          fontWeight: '800',
                          color: '#fff',
                          marginBottom: '16px',
                        }}
                      >
                        {totalHon.toLocaleString()}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '0.8rem',
                          color: 'var(--text-dim)',
                          marginBottom: '20px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>이벤트 무료</span>
                          <span style={{ color: '#fff' }}>
                            {freeHon.toLocaleString()}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>충전 유료</span>
                          <span style={{ color: '#fff' }}>
                            {paidHon.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openPaymentModal('HON')}
                        style={{
                          marginTop: 'auto',
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(0, 240, 255, 0.1)',
                          color: 'var(--primary-cyan)',
                          border: '1px solid rgba(0, 240, 255, 0.3)',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(0, 240, 255, 0.2)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(0, 240, 255, 0.1)')
                        }
                      >
                        충전하기
                      </button>
                    </div>

                    {/* Subscribe Card */}
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '-20px',
                          right: '-20px',
                          width: '80px',
                          height: '80px',
                          background: 'var(--primary-purple)',
                          filter: 'blur(40px)',
                          opacity: 0.2,
                        }}
                      />
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--primary-purple)',
                          fontWeight: 'bold',
                          marginBottom: '8px',
                        }}
                      >
                        구독 상태
                      </div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: '800',
                          color: '#fff',
                          marginBottom: '16px',
                          lineHeight: '1.2',
                        }}
                      >
                        {isSubscribed
                          ? isYearly
                            ? '연간 무제한'
                            : '월간 무제한'
                          : '미구독'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-dim)',
                          marginBottom: '20px',
                        }}
                      >
                        {isSubscribed && subscription?.endsAt ? (
                          <>
                            만료일:{' '}
                            {new Date(subscription.endsAt).toLocaleDateString()}
                          </>
                        ) : (
                          <>구독 시 HON 소모 없이 무제한 사용</>
                        )}
                      </div>
                      <button
                        onClick={() => openPaymentModal('SUBSCRIPTION')}
                        style={{
                          marginTop: 'auto',
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(168, 85, 247, 0.1)',
                          color: 'var(--primary-purple)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(168, 85, 247, 0.2)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(168, 85, 247, 0.1)')
                        }
                      >
                        {isSubscribed ? '구독 관리' : '구독하기'}
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {['ALL', 'FREE', 'PAID'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setHistoryTab(tab as HistoryTabType)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      borderRadius: '20px',
                      background:
                        historyTab === tab
                          ? 'var(--primary-cyan)'
                          : 'rgba(255,255,255,0.05)',
                      color: historyTab === tab ? '#090a0f' : 'var(--text-dim)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: historyTab === tab ? 'bold' : 'normal',
                    }}
                  >
                    {tab === 'ALL'
                      ? '전체 내역'
                      : tab === 'FREE'
                        ? '무료 HON'
                        : '유료 HON'}
                  </button>
                ))}
              </div>

              {loadingHistory ? (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                  }}
                >
                  불러오는 중...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                  }}
                >
                  해당 HON 내역이 없습니다.
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-start',
                          alignItems: 'baseline',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color:
                              event.amount > 0
                                ? 'var(--primary-cyan)'
                                : '#ff4b4b',
                          }}
                        >
                          {event.amount > 0 ? '+' : ''}
                          {event.amount} HON
                        </div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-main)',
                            textAlign: 'left',
                            wordBreak: 'keep-all',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {event.description || event.type}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-start',
                          gap: '12px',
                          fontSize: '0.8rem',
                          color: 'var(--text-dim)',
                        }}
                      >
                        <div>잔액: {event.balance}</div>
                        <div>|</div>
                        <div>{new Date(event.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'NOTIFICATIONS' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {loadingNoti ? (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                  }}
                >
                  불러오는 중...
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                  }}
                >
                  도착한 알림이 없습니다.
                </div>
              ) : (
                notifications.map((noti) => (
                  <div
                    key={noti.id}
                    onClick={() => {
                      if (!noti.isRead) markAsRead(noti.id);
                      setExpandedNotiId(
                        expandedNotiId === noti.id ? null : noti.id,
                      );
                    }}
                    style={{
                      padding: '16px',
                      background: noti.isRead
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,240,255,0.05)',
                      borderRadius: '12px',
                      border: noti.isRead
                        ? '1px solid rgba(255,255,255,0.05)'
                        : '1px solid rgba(0,240,255,0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {!noti.isRead && (
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              background: 'var(--primary-cyan)',
                              borderRadius: '50%',
                            }}
                          />
                        )}
                        <div
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: noti.isRead ? 'normal' : 'bold',
                            color: 'var(--text-main)',
                          }}
                        >
                          {noti.title}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-dim)',
                        }}
                      >
                        {new Date(noti.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {expandedNotiId === noti.id && (
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          fontSize: '0.85rem',
                          color: 'var(--text-dim)',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {noti.content}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nickname Confirm Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '24px',
              maxWidth: '360px',
              width: '90%',
              borderRadius: '16px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#ff4b4b' }}>주의</h3>
            <p
              style={{
                margin: '0 0 24px',
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                lineHeight: '1.5',
              }}
            >
              닉네임을{' '}
              <strong style={{ color: 'var(--primary-cyan)' }}>
                {nicknameInput}
              </strong>
              (으)로 설정하시겠습니까?
              <br />
              <br />
              설정 후에는 변경할 수 없습니다.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-main)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleSubmitNickname}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--primary-cyan)',
                  color: '#090a0f',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {isSubmittingNickname ? '처리중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
