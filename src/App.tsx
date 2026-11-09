import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { SystemAnalyzing } from './pages/SystemAnalyzing';
import { BlockedPage } from './pages/BlockedPage';
import { Home } from './pages/Dashboard/Home';
import { Search } from './pages/Dashboard/Search';
import { Locations } from './pages/Dashboard/Locations';
import { BallAnalysis } from './pages/Dashboard/BallAnalysis';
import { Stats } from './pages/Dashboard/Stats';
import { AnalysisCharts } from './pages/Dashboard/AnalysisCharts';
import { Generate } from './pages/Dashboard/Generate';
import { History } from './pages/Dashboard/History';
import { Board } from './pages/Dashboard/Board';
import { Support } from './pages/Dashboard/Support';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AuthRequiredModal } from './components/AuthRequiredModal';
import { AdminPage } from './pages/Dashboard/AdminPage';
import { InteractiveBackground } from './components/InteractiveBackground';
import { VerifySignup } from './pages/Auth/VerifySignup';
import { Restore } from './pages/Auth/Restore';
import { WithdrawConfirm } from './pages/Auth/WithdrawConfirm';
import { LoginPage } from './pages/Auth/LoginPage';
import { SignupRequestPage } from './pages/Auth/SignupRequestPage';
import { ResetPasswordRequestPage } from './pages/Auth/ResetPasswordRequestPage';
import { ResetPasswordPage } from './pages/Auth/ResetPasswordPage';

function AppContent() {
  const {
    loading,
    isAdminMode,
    showAdminModal,
    setShowAdminModal,
    setAdminError,
    setAlert,
    isSystemAnalyzing,
    isBlockedUser,
  } = useApp();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global hotkey listener for Admin Auth modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      const isHKey =
        e.code === 'KeyH' ||
        e.key?.toLowerCase() === 'h' ||
        e.key === 'ㅗ' ||
        e.key === 'ㅗ';

      // Trigger on Cmd+Shift+H (Mac) or Ctrl+Shift+H (Windows)
      if (isModifier && e.shiftKey && isHKey) {
        e.preventDefault();
        e.stopPropagation();
        setShowAdminModal(!showAdminModal);
        setAdminError('');
        setAlert(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capturing phase to override default browser/element behaviors

    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showAdminModal, setAdminError, setAlert, setShowAdminModal]);

  if (isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#030712',
          color: 'var(--text-main)',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            marginBottom: '16px',
            animation: 'pulse 2s infinite',
            color: 'var(--primary-cyan)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
          모바일 버전 준비 중
        </h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
          hactto의 모바일 최적화 버전이 현재 준비 중입니다.
          <br />
          정상적인 기능 이용을 위해 PC 브라우저로 접속해 주시길 부탁드립니다.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'var(--text-dim)',
        }}
      >
        불러오는 중...
      </div>
    );
  }

  if (isBlockedUser && !isAdminMode) {
    return (
      <>
        <BlockedPage />
        <AdminAuthModal
          isOpen={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setAdminError('');
            setAlert(null);
          }}
        />
      </>
    );
  }

  if (isSystemAnalyzing) {
    return (
      <>
        <SystemAnalyzing />
        <AdminAuthModal
          isOpen={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setAdminError('');
            setAlert(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-cyan"></div>
        <div className="orb orb-purple"></div>
        <InteractiveBackground />
      </div>

      <Routes>
        {/* Welcome screen is bypassed, redirect to home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Auth routes */}
        <Route path="/auth/verify" element={<VerifySignup />} />
        <Route path="/auth/restore" element={<Restore />} />
        <Route path="/auth/withdraw/confirm" element={<WithdrawConfirm />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupRequestPage />} />
        <Route
          path="/reset-password-request"
          element={<ResetPasswordRequestPage />}
        />

        {/* User Service Dashboard pages wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/ball-analysis" element={<BallAnalysis />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/analysis-charts" element={<AnalysisCharts />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/history" element={<History />} />
          <Route path="/board" element={<Board />} />
          <Route path="/support" element={<Support />} />
          <Route path="/system" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>

      {/* Secret admin auth modal */}
      <AdminAuthModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setAdminError('');
          setAlert(null);
        }}
      />
      <AuthRequiredModal />
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
