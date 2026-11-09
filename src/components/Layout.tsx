import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth, authFetch } from '../context/AuthContext';
import { Alert } from './Alert';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { HelpModal } from './HelpModal';
import { PaymentModal } from './PaymentModal';
import { NoticeBanner } from './NoticeBanner';
import { AdSenseBanner } from './AdSenseBanner';
import { PrivacyModal } from './PrivacyModal';
import { TermsModal } from './TermsModal';
import { RefundPolicyModal } from './RefundPolicyModal';
import { UserDetailModal } from './UserDetailModal';

import { API_BASE_URL } from '../utils';

const MENU_GROUPS = [
  {
    title: '당첨 결과',
    items: [
      { path: '/home', label: '최근 당첨번호' },
      { path: '/search', label: '당첨번호 조회' },
      { path: '/locations', label: '당첨지점 조회' },
      { path: '/ball-analysis', label: '추첨 번호 분석' },
    ],
  },
  {
    title: '통계 및 분석',
    items: [
      { path: '/stats', label: '알고리즘 통계' },
      { path: '/analysis-charts', label: '당첨통계 차트' },
    ],
  },
  {
    title: '예측 시스템',
    items: [{ path: '/generate', label: '예측번호 분석기' }],
  },
  {
    title: '마이페이지',
    items: [{ path: '/history', label: '내 당첨이력' }],
  },
  {
    title: '커뮤니티 및 지원',
    items: [
      { path: '/board', label: '게시판' },
      { path: '/support', label: '1:1 문의' },
    ],
  },
];

export function Layout() {
  const {
    alert,
    hasUnsavedWeights,
    showUnsavedModal,
    setShowUnsavedModal,
    setUnsavedActionTarget,
    setShowAdminModal,
    subscription,
    checkIpStatus,
    isAdminMode,
  } = useApp();

  const { isAuthenticated, user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<
    'HON' | 'SUBSCRIPTION' | undefined
  >();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);

  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    let socket: import('socket.io-client').Socket | null = null;

    const fetchUnreadCount = async () => {
      if (isAuthenticated) {
        try {
          const res = await authFetch(
            `${API_BASE_URL}/user/notifications/unread-count?t=${Date.now()}`,
            { cache: 'no-store' },
          );
          if (res.ok) {
            const data = await res.json();
            if (data.data && typeof data.data.count === 'number') {
              setUnreadNotiCount(data.data.count);
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    const setupWebSocket = async () => {
      if (!isAuthenticated) return;
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const { io } = await import('socket.io-client');
        const url = new URL(API_BASE_URL);
        socket = io(url.origin, {
          reconnection: true,
          auth: { token },
          transports: ['websocket'],
        });

        socket.on('new-notification', () => {
          fetchUnreadCount();
        });
      } catch (e) {
        console.error('Failed to setup WebSocket', e);
      }
    };

    fetchUnreadCount();
    setupWebSocket();
    window.addEventListener('notification-sent', fetchUnreadCount);

    return () => {
      if (socket) {
        socket.disconnect();
      }
      window.removeEventListener('notification-sent', fetchUnreadCount);
    };
  }, [isAuthenticated, showUserDetailModal]); // refetch when modal closes and poll periodically

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1200);
    };
    handleResize(); // run initially
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasAdminAccess = !!(
    localStorage.getItem('mk') || sessionStorage.getItem('mk')
  );

  const handleTabClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    if (isMobileOrTablet) {
      setIsMobileMenuOpen(false);
    }

    if (path === '/system' && !hasAdminAccess) {
      e.preventDefault();
      setShowAdminModal(true);
      return;
    }

    if (hasUnsavedWeights) {
      e.preventDefault();
      setUnsavedActionTarget(() => () => {
        navigate(path);
      });
      setShowUnsavedModal(true);
    }
  };

  const isYearlySubscribed =
    subscription &&
    (subscription.status === 'ACTIVE' ||
      (subscription.status === 'CANCELLED' &&
        subscription.endsAt &&
        new Date(subscription.endsAt) > new Date())) &&
    subscription.plan === 'YEARLY';

  return (
    <div className="layout-wrapper">
      {/* 좌측 구글 광고 지면 */}
      {!isYearlySubscribed && !isMobileOrTablet && (
        <div className="google-ad-sidebar left-ad">
          <AdSenseBanner slot="1234567890" format="vertical" />
        </div>
      )}

      <div className="access-container dashboard-main-container">
        <NoticeBanner />
        <div className="glass-card dashboard-container">
          <div
            className="admin-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                className="logo-glow"
                style={{
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  marginRight: '12px',
                }}
                onClick={() => navigate('/home')}
              >
                hactto
              </span>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {!isAdminMode &&
                (isAuthenticated ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setShowUserDetailModal(true)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(0, 240, 255, 0.1)';
                      e.currentTarget.style.borderColor =
                        'rgba(0, 240, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.1)';
                    }}
                    title={'프로필 및 알림 보기'}
                  >
                    <span style={{ fontWeight: 'bold' }}>
                      {user?.nickname || user?.email?.split('@')[0]}
                    </span>
                    님
                    {unreadNotiCount > 0 && (
                      <div
                        style={{
                          background: '#ff4b4b',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          marginLeft: '4px',
                        }}
                      >
                        {unreadNotiCount}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/login')}
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        background: 'transparent',
                        padding: '4px 8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-main)';
                      }}
                    >
                      로그인
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }}
                    >
                      회원가입
                    </button>
                  </div>
                ))}
              <button
                onClick={() => setShowHelpModal(true)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-dim)',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = 'var(--primary-cyan)';
                  e.currentTarget.style.boxShadow =
                    '0 0 10px rgba(0, 240, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.color = 'var(--text-dim)';
                  e.currentTarget.style.borderColor =
                    'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="로또 분석 용어 사전"
              >
                ?
              </button>
              {isMobileOrTablet && (
                <button
                  ref={hamburgerRef}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    outline: 'none',
                  }}
                >
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
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div
            ref={menuRef}
            className={`admin-tabs ${isMobileOrTablet && isMobileMenuOpen ? 'mobile-menu-open' : ''}`}
            style={{ zIndex: 10 }}
          >
            {MENU_GROUPS.map((group) => {
              const filteredItems = isAdminMode
                ? group.items.filter(
                    (item) =>
                      item.path !== '/generate' &&
                      item.path !== '/history' &&
                      item.path !== '/support',
                  )
                : group.items;

              if (filteredItems.length === 0) return null;

              const isActive = filteredItems.some(
                (item) => location.pathname === item.path,
              );

              return (
                <div key={group.title} className="dropdown-container">
                  <div
                    className={`tab-btn dropdown-trigger ${
                      isActive ? 'active-tab' : ''
                    }`}
                    onClick={() => {
                      if (isMobileOrTablet) {
                        setExpandedMenu(
                          expandedMenu === group.title ? null : group.title,
                        );
                      }
                    }}
                    style={{
                      cursor: isMobileOrTablet ? 'pointer' : 'default',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{group.title}</span>
                    {isMobileOrTablet && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform:
                            expandedMenu === group.title
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    )}
                  </div>
                  <div
                    className={`dropdown-menu ${expandedMenu === group.title ? 'expanded' : ''}`}
                  >
                    {filteredItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={(e) => handleTabClick(e, item.path)}
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? 'active-item' : ''}`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}

            {isAdminMode && (
              <div className="dropdown-container">
                <div
                  className={`tab-btn dropdown-trigger ${
                    location.pathname === '/system' ? 'active-tab' : ''
                  }`}
                  onClick={() => {
                    if (isMobileOrTablet) {
                      setExpandedMenu(
                        expandedMenu === '관리자' ? null : '관리자',
                      );
                    }
                  }}
                  style={{
                    color: '#FFD700',
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
                    cursor: isMobileOrTablet ? 'pointer' : 'default',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>관리자</span>
                  {isMobileOrTablet && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform:
                          expandedMenu === '관리자'
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </div>
                <div
                  className={`dropdown-menu ${expandedMenu === '관리자' ? 'expanded' : ''}`}
                >
                  <NavLink
                    to="/system"
                    onClick={(e) => handleTabClick(e, '/system')}
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? 'active-item' : ''}`
                    }
                    style={{ color: '#FFD700', fontWeight: 'bold' }}
                  >
                    대시보드
                  </NavLink>
                </div>
              </div>
            )}
          </div>

          {/* 모바일/태블릿용 가로형 구글 광고 지면 */}
          {!isYearlySubscribed && isMobileOrTablet && (
            <div className="google-ad-horizontal-wrapper">
              <AdSenseBanner
                slot="1234567890"
                format="horizontal"
                responsive="false"
                style={{
                  display: 'inline-block',
                  width: '100%',
                  height: '74px',
                }}
              />
            </div>
          )}

          <div
            className="scroll-y-container"
            style={{
              position: 'relative',
              flex: 1,
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '8px',
              marginRight: '-8px',
              minHeight: 0,
            }}
          >
            <Outlet />
          </div>

          <Alert alert={alert} />

          {/* Footer containing Privacy Policy and Terms of Service (Essential for AdSense Approval) */}
          <footer
            style={{
              marginTop: '15px',
              paddingTop: '15px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => setShowPrivacyModal(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: showPrivacyModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = showPrivacyModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)';
                }}
              >
                개인정보처리방침
              </button>
              <span style={{ opacity: 0.2 }}>|</span>
              <button
                onClick={() => setShowTermsModal(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: showTermsModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = showTermsModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)';
                }}
              >
                이용약관
              </button>
              <span style={{ opacity: 0.2 }}>|</span>
              <button
                onClick={() => setShowRefundModal(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: showRefundModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = showRefundModal
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)';
                }}
              >
                환불 규정
              </button>
            </div>
            <div
              style={{
                textAlign: 'center',
                lineHeight: '1.6',
                opacity: 0.7,
                marginTop: '4px',
              }}
            >
              <span>상호명: 핵또</span>{' '}
              <span style={{ margin: '0 4px' }}>|</span>{' '}
              <span>대표자명: 김수완</span>{' '}
              <span style={{ margin: '0 4px' }}>|</span>{' '}
              <span>사업자등록번호: 519-18-02415</span>{' '}
              <span style={{ margin: '0 4px' }}>|</span>{' '}
              <span>통신판매업신고번호: 없음</span>
              <br />
              <span>
                사업장 소재지: 서울특별시 마포구 와우산로 105, 5층
                261A호(서교동)
              </span>
              <br />
              <span>고객센터 전화번호: 070-8110-8128</span>{' '}
              <span style={{ margin: '0 4px' }}>|</span>{' '}
              <span>이메일 주소: hactto95@gmail.com</span>
              <br />
              <span style={{ display: 'block', marginTop: '6px' }}>
                © {new Date().getFullYear()} hactto. All rights reserved.
              </span>
            </div>
          </footer>
        </div>

        <UnsavedChangesModal
          isOpen={showUnsavedModal}
          onClose={() => setShowUnsavedModal(false)}
        />
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={checkIpStatus}
          initialHighlight={paymentTarget}
        />
        <PrivacyModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />
        <TermsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />
        <RefundPolicyModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
        />
        <UserDetailModal
          isOpen={showUserDetailModal}
          onClose={() => setShowUserDetailModal(false)}
          openPaymentModal={(target) => {
            setPaymentTarget(target);
            setShowPaymentModal(true);
          }}
        />
      </div>

      {/* 우측 구글 광고 지면 */}
      {!isYearlySubscribed && !isMobileOrTablet && (
        <div className="google-ad-sidebar right-ad">
          <AdSenseBanner slot="0987654321" format="vertical" />
        </div>
      )}
    </div>
  );
}
