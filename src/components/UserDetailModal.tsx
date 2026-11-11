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
      className="fixed inset-0 w-full h-full bg-overlay backdrop-blur-md flex items-center justify-center z-99999 p-5 box-border"
      onClick={onClose}
    >
      <div
        className="glass-card max-w-[560px] w-full h-[85vh] bg-card border border-glass-border rounded-2xl flex flex-col relative overflow-hidden p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-glass-border shrink-0 flex justify-between items-center">
          <h2 className="m-0 text-[1.4rem] text-main">내 프로필</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="bg-error/10 border border-error text-error cursor-pointer text-[0.85rem] px-3 py-1.5 rounded font-bold"
            >
              로그아웃
            </button>
            <button
              onClick={onClose}
              className="bg-transparent border-none text-dim cursor-pointer text-[1.2rem]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-glass-border px-6 shrink-0">
          {[
            { id: 'PROFILE', label: '상세 정보' },
            { id: 'HISTORY', label: 'HON 사용 내역' },
            { id: 'NOTIFICATIONS', label: '개별 알림' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`bg-transparent border-none border-b-2 px-5 py-4 text-[0.95rem] cursor-pointer transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-b-primary-cyan text-primary-cyan font-bold'
                  : 'border-b-transparent text-dim font-normal'
              }`}
            >
              {tab.label}
              {tab.id === 'NOTIFICATIONS' &&
                notifications.some((n) => !n.isRead) && (
                  <span className="inline-block w-2 h-2 bg-error rounded-full ml-1.5 -translate-y-0.5" />
                )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'PROFILE' && (
            <div className="flex flex-col gap-8">
              {/* Nickname Section */}
              <section>
                {nickname ? (
                  <div className="py-10 px-6 w-full bg-surface rounded-[20px] border border-glass-border shadow-glass flex flex-col items-center justify-center gap-5">
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
                    <div className="text-[1.8rem] font-extrabold text-main tracking-[1px]">
                      {nickname}
                    </div>
                    <div className="text-[0.85rem] text-dim bg-canvas/70 px-4 py-2 rounded-full flex gap-2 items-center mt-2">
                      <span className="text-primary-cyan font-bold">
                        고유 식별자
                      </span>
                      <span>{userId}</span>
                      <button
                        onClick={handleCopyId}
                        title="복사하기"
                        className="bg-transparent border-none text-dim cursor-pointer px-1 flex items-center"
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
                  <div className="py-10 px-6 w-full bg-surface rounded-[20px] border border-glass-border shadow-glass flex flex-col justify-center items-center">
                    <div className="mb-8 text-[0.85rem] text-dim bg-canvas/70 px-4 py-2 rounded-full flex gap-2 items-center">
                      <span className="text-primary-cyan font-bold">
                        고유 식별자
                      </span>
                      <span>{userId}</span>
                      <button
                        onClick={handleCopyId}
                        title="복사하기"
                        className="bg-transparent border-none text-dim cursor-pointer px-1 flex items-center"
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
                    <p className="m-0 mb-6 text-[0.95rem] text-dim leading-[1.6] text-center">
                      아직 닉네임을 설정하지 않으셨습니다.
                      <br />
                      닉네임은{' '}
                      <strong className="text-error">
                        최초 1회만 설정 가능
                      </strong>
                      하며, 이후 변경이 불가능합니다.
                    </p>
                    <div className="relative w-full">
                      <input
                        type="text"
                        className="input-glow w-full pr-[100px] h-12 text-base"
                        placeholder="2자 이상 20자 이하로 입력"
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                      />
                      <button
                        className={`btn-submit absolute right-1 top-1 bottom-1 px-4 py-0 rounded-md text-[0.9rem] border-none ${
                          isAvailable
                            ? 'bg-primary-cyan text-white cursor-pointer'
                            : 'bg-surface text-dim cursor-not-allowed'
                        }`}
                        disabled={!isAvailable || isChecking}
                        onClick={() => setShowConfirmModal(true)}
                      >
                        설정하기
                      </button>
                    </div>
                    <div className="mt-3 min-h-[20px]">
                      {errorMsg && (
                        <div className="text-error text-[0.85rem]">
                          {errorMsg}
                        </div>
                      )}
                      {isAvailable && !errorMsg && (
                        <div className="text-primary-cyan text-[0.85rem]">
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
                  <h3 className="m-0 mb-4 text-[1.1rem] text-main flex items-center gap-2">
                    <div className="w-1 h-4 bg-dim rounded-xs" />
                    HON/구독
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* HON Card */}
                    <div className="p-5 rounded-xl bg-surface border border-primary-cyan/25 flex flex-col relative overflow-hidden">
                      <div className="absolute -top-5 -right-5 w-20 h-20 bg-primary-cyan blur-2xl opacity-20" />
                      <div className="text-[0.85rem] text-primary-cyan font-bold mb-2">
                        보유 HON
                      </div>
                      <div className="text-[2rem] font-extrabold text-main mb-4">
                        {totalHon.toLocaleString()}
                      </div>
                      <div className="flex flex-col gap-1 text-[0.8rem] text-dim mb-5">
                        <div className="flex justify-between">
                          <span>이벤트 무료</span>
                          <span className="text-main">
                            {freeHon.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>충전 유료</span>
                          <span className="text-main">
                            {paidHon.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openPaymentModal('HON')}
                        className="mt-auto w-full p-2.5 bg-primary-cyan/10 hover:bg-primary-cyan/20 text-primary-cyan border border-primary-cyan/30 rounded-lg font-bold cursor-pointer transition-all duration-200"
                      >
                        충전하기
                      </button>
                    </div>

                    {/* Subscribe Card */}
                    <div className="p-5 rounded-xl bg-surface border border-primary-purple/25 flex flex-col relative overflow-hidden">
                      <div className="absolute -top-5 -right-5 w-20 h-20 bg-primary-purple blur-2xl opacity-20" />
                      <div className="text-[0.85rem] text-primary-purple font-bold mb-2">
                        구독 상태
                      </div>
                      <div className="text-[1.4rem] font-extrabold text-main mb-4 leading-[1.2]">
                        {isSubscribed
                          ? isYearly
                            ? '연간 무제한'
                            : '월간 무제한'
                          : '미구독'}
                      </div>
                      <div className="text-[0.8rem] text-dim mb-5">
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
                        className="mt-auto w-full p-2.5 bg-primary-purple/10 hover:bg-primary-purple/20 text-primary-purple border border-primary-purple/30 rounded-lg font-bold cursor-pointer transition-all duration-200"
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
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 mb-2">
                {['ALL', 'FREE', 'PAID'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setHistoryTab(tab as HistoryTabType)}
                    className={`px-3 py-1.5 text-[0.8rem] rounded-full border-none cursor-pointer ${
                      historyTab === tab
                        ? 'bg-primary-cyan text-white font-bold'
                        : 'bg-surface text-dim font-normal'
                    }`}
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
                <div className="p-10 text-center text-dim">불러오는 중...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-10 text-center text-dim bg-surface rounded-xl">
                  해당 HON 내역이 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 bg-surface rounded-xl border border-glass-border flex flex-col gap-2"
                    >
                      <div className="flex justify-start items-baseline gap-3">
                        <div
                          className={`text-[1.1rem] font-bold ${
                            event.amount > 0
                              ? 'text-primary-cyan'
                              : 'text-error'
                          }`}
                        >
                          {event.amount > 0 ? '+' : ''}
                          {event.amount} HON
                        </div>
                        <div className="text-[0.9rem] text-main text-left break-keep wrap-break-word">
                          {event.description || event.type}
                        </div>
                      </div>
                      <div className="flex justify-start gap-3 text-[0.8rem] text-dim">
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
            <div className="flex flex-col gap-3">
              {loadingNoti ? (
                <div className="p-10 text-center text-dim">불러오는 중...</div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center text-dim bg-surface rounded-xl">
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
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      noti.isRead
                        ? 'bg-surface border border-glass-border'
                        : 'bg-primary-cyan/10 border border-primary-cyan/25'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {!noti.isRead && (
                          <div className="w-2 h-2 bg-primary-cyan rounded-full" />
                        )}
                        <div
                          className={`text-[0.95rem] text-main ${
                            noti.isRead ? 'font-normal' : 'font-bold'
                          }`}
                        >
                          {noti.title}
                        </div>
                      </div>
                      <div className="text-xs text-dim">
                        {new Date(noti.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {expandedNotiId === noti.id && (
                      <div className="mt-3 pt-3 border-t border-glass-border text-[0.85rem] text-dim leading-[1.6] whitespace-pre-wrap">
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
        <div className="fixed inset-0 w-full h-full bg-overlay backdrop-blur-xs flex items-center justify-center z-999999">
          <div className="glass-card p-6 max-w-[360px] w-[90%] rounded-2xl overflow-hidden">
            <h3 className="m-0 mb-4 text-error">주의</h3>
            <p className="m-0 mb-6 text-[0.9rem] text-main leading-[1.5]">
              닉네임을{' '}
              <strong className="text-primary-cyan">{nicknameInput}</strong>
              (으)로 설정하시겠습니까?
              <br />
              <br />
              설정 후에는 변경할 수 없습니다.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 p-2.5 bg-transparent border border-glass-border text-main rounded-lg cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSubmitNickname}
                className="flex-1 p-2.5 bg-primary-cyan text-white border-none rounded-lg cursor-pointer font-bold"
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
