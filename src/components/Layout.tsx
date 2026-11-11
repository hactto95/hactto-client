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
import { ThemeToggle } from './ThemeToggle';
import { HacttoLogo } from './HacttoLogo';

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
  }, [isAuthenticated, showUserDetailModal]);

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
    handleResize();
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

  // Active sub-items for current group (for quick pill sub-navigation when group has >1 item)
  const activeGroup = MENU_GROUPS.find((g) =>
    g.items.some((item) => item.path === location.pathname),
  );

  return (
    <div className="flex min-h-dvh w-full flex-col">
      {/* =====================================================================
          STICKY GLOBAL NAVIGATION BAR (TOSS / LINEAR STYLE)
         ===================================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-glass-border bg-card/85 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Logo & Desktop Navigation */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="group flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0 focus:outline-none"
            >
              <HacttoLogo
                size={32}
                className="transition-transform group-hover:scale-105"
              />
              <span className="font-display text-xl font-extrabold tracking-tight text-main">
                Hactto
              </span>
              <span className="hidden rounded-md bg-primary-cyan/10 px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-primary-cyan sm:inline-block">
                AI ANALYTICS
              </span>
            </button>

            {/* Desktop Horizontal Navigation */}
            {!isMobileOrTablet && (
              <nav className="flex items-center gap-1">
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

                  // Single-item group: direct NavLink
                  if (filteredItems.length === 1) {
                    const single = filteredItems[0];
                    return (
                      <NavLink
                        key={single.path}
                        to={single.path}
                        onClick={(e) => handleTabClick(e, single.path)}
                        className={`rounded-xl px-3.5 py-2 text-[0.9rem] font-semibold no-underline transition-all ${
                          isActive
                            ? 'bg-primary-cyan/10 text-primary-cyan'
                            : 'text-muted hover:bg-surface-hover hover:text-main'
                        }`}
                      >
                        {group.title}
                      </NavLink>
                    );
                  }

                  // Multi-item group: hover dropdown
                  return (
                    <div key={group.title} className="dropdown-container">
                      <button
                        type="button"
                        onClick={() => navigate(filteredItems[0].path)}
                        className={`flex cursor-pointer items-center gap-1 rounded-xl border-none px-3.5 py-2 text-[0.9rem] font-semibold transition-all ${
                          isActive
                            ? 'bg-primary-cyan/10 text-primary-cyan'
                            : 'bg-transparent text-muted hover:bg-surface-hover hover:text-main'
                        }`}
                      >
                        <span>{group.title}</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-60"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      <div className="dropdown-menu">
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
                  <NavLink
                    to="/system"
                    onClick={(e) => handleTabClick(e, '/system')}
                    className={({ isActive }) =>
                      `rounded-xl px-3.5 py-2 text-[0.9rem] font-bold no-underline transition-all ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'text-amber-600 hover:bg-amber-500/10 dark:text-amber-400'
                      }`
                    }
                  >
                    관리자 대시보드
                  </NavLink>
                )}
              </nav>
            )}
          </div>

          {/* Right: User Profile, Theme Toggle, Help, Mobile Menu Trigger */}
          <div className="flex items-center gap-2.5">
            {!isAdminMode &&
              (isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setShowUserDetailModal(true)}
                  title="프로필 및 알림 보기"
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-glass-border bg-surface px-3.5 py-1.5 text-[0.85rem] font-medium text-main transition-all hover:border-primary-cyan/40 hover:bg-surface-hover"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-cyan/15 text-[0.7rem] font-bold text-primary-cyan">
                    {(user?.nickname || user?.email || 'U')[0].toUpperCase()}
                  </span>
                  <span className="max-w-[110px] truncate font-semibold">
                    {user?.nickname || user?.email?.split('@')[0]}
                  </span>
                  {unreadNotiCount > 0 && (
                    <span className="rounded-full bg-error px-1.5 py-0.5 text-[0.68rem] leading-none font-bold text-white">
                      {unreadNotiCount}
                    </span>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="cursor-pointer rounded-xl border-none bg-transparent px-3 py-1.5 text-[0.88rem] font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-main"
                  >
                    로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="cursor-pointer rounded-xl border-none bg-primary-cyan px-3.5 py-1.5 text-[0.85rem] font-semibold text-white shadow-sm transition-all hover:brightness-105"
                  >
                    시작하기
                  </button>
                </div>
              ))}

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-glass-border bg-surface text-[0.88rem] font-bold text-muted transition-all hover:border-primary-cyan/40 hover:bg-surface-hover hover:text-primary-cyan focus:outline-none"
              title="로또 분석 용어 사전"
            >
              ?
            </button>

            {isMobileOrTablet && (
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-glass-border bg-surface text-main transition-colors hover:bg-surface-hover focus:outline-none"
                aria-label="메뉴 열기"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isMobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Sub-navigation Pill Bar when current group has multiple sub-pages */}
        {activeGroup && activeGroup.items.length > 1 && (
          <div className="border-t border-glass-border bg-surface/60">
            <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
              {activeGroup.items.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  onClick={(e) => handleTabClick(e, sub.path)}
                  className={({ isActive }) =>
                    `shrink-0 rounded-lg px-3 py-1 text-[0.82rem] font-semibold no-underline transition-all ${
                      isActive
                        ? 'bg-card text-primary-cyan shadow-xs ring-1 ring-glass-border'
                        : 'text-muted hover:text-main'
                    }`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Mobile / Tablet Slide-Down Drawer */}
        {isMobileOrTablet && isMobileMenuOpen && (
          <div
            ref={menuRef}
            className="border-t border-glass-border bg-card px-4 py-4 shadow-xl"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
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
                  <div
                    key={group.title}
                    className="rounded-2xl border border-glass-border bg-surface/50 p-2"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMenu(
                          expandedMenu === group.title ? null : group.title,
                        )
                      }
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl border-none bg-transparent px-3 py-2 text-left text-[0.92rem] font-bold ${
                        isActive ? 'text-primary-cyan' : 'text-main'
                      }`}
                    >
                      <span>{group.title}</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-200 ${
                          expandedMenu === group.title || isActive
                            ? 'rotate-180'
                            : 'rotate-0'
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {(expandedMenu === group.title || isActive) && (
                      <div className="mt-1 flex flex-col gap-1 pl-2">
                        {filteredItems.map((item) => (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={(e) => handleTabClick(e, item.path)}
                            className={({ isActive }) =>
                              `rounded-xl px-3 py-2 text-[0.88rem] font-medium no-underline transition-colors ${
                                isActive
                                  ? 'bg-primary-cyan/10 font-bold text-primary-cyan'
                                  : 'text-muted hover:bg-surface-hover hover:text-main'
                              }`
                            }
                          >
                            {item.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {isAdminMode && (
                <NavLink
                  to="/system"
                  onClick={(e) => handleTabClick(e, '/system')}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[0.92rem] font-bold text-amber-600 no-underline dark:text-amber-400"
                >
                  관리자 대시보드
                </NavLink>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          MAIN FULL-SCREEN WORKSPACE (BENTO CONTAINER + SIDE AD RAILS)
         ===================================================================== */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 justify-center gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Left Ad Rail (Desktop XL+) */}
        {!isYearlySubscribed && !isMobileOrTablet && (
          <aside className="google-ad-sidebar left-ad hidden xl:flex">
            <AdSenseBanner slot="1234567890" format="vertical" />
          </aside>
        )}

        {/* Center Main Content Area */}
        <main className="flex min-w-0 flex-1 flex-col max-w-6xl">
          <NoticeBanner />

          {/* Mobile/Tablet Horizontal Ad */}
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

          {/* Page Content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </main>

        {/* Right Ad Rail (Desktop XL+) */}
        {!isYearlySubscribed && !isMobileOrTablet && (
          <aside className="google-ad-sidebar right-ad hidden xl:flex">
            <AdSenseBanner slot="0987654321" format="vertical" />
          </aside>
        )}
      </div>

      <Alert alert={alert} />

      {/* =====================================================================
          CLEAN MODERN SAAS FOOTER
         ===================================================================== */}
      <footer className="mt-auto border-t border-glass-border bg-card/60 py-8 text-[0.78rem] text-dim">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
            <div className="flex items-center gap-2 font-display text-sm font-extrabold text-main">
              <span>Hactto</span>
              <span className="text-xs font-normal text-dim">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>
            <p className="leading-relaxed text-dim">
              상호명: 핵또 · 대표자명: 김수완 · 사업자등록번호: 519-18-02415 ·
              통신판매업신고번호: 없음
              <br />
              사업장 소재지: 서울특별시 마포구 와우산로 105, 5층 261A호(서교동)
              · 고객센터: 070-8110-8128 · 이메일: hactto95@gmail.com
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 font-medium">
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className={`cursor-pointer border-none bg-transparent p-0 text-[0.78rem] transition-colors hover:text-primary-cyan ${
                showPrivacyModal ? 'font-bold text-primary-cyan' : 'text-muted'
              }`}
            >
              개인정보처리방침
            </button>
            <span className="opacity-30">·</span>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className={`cursor-pointer border-none bg-transparent p-0 text-[0.78rem] transition-colors hover:text-primary-cyan ${
                showTermsModal ? 'font-bold text-primary-cyan' : 'text-muted'
              }`}
            >
              이용약관
            </button>
            <span className="opacity-30">·</span>
            <button
              type="button"
              onClick={() => setShowRefundModal(true)}
              className={`cursor-pointer border-none bg-transparent p-0 text-[0.78rem] transition-colors hover:text-primary-cyan ${
                showRefundModal ? 'font-bold text-primary-cyan' : 'text-muted'
              }`}
            >
              환불 규정
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
  );
}
