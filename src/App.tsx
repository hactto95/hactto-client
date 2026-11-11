import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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

  // Global hotkey listener for Admin Auth modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      const isHKey =
        e.code === 'KeyH' || e.key?.toLowerCase() === 'h' || e.key === 'ㅗ';

      // Trigger on Cmd+Shift+H (Mac) or Ctrl+Shift+H (Windows)
      if (isModifier && e.shiftKey && isHKey) {
        e.preventDefault();
        e.stopPropagation();
        setShowAdminModal(!showAdminModal);
        setAdminError('');
        setAlert(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showAdminModal, setAdminError, setAlert, setShowAdminModal]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas text-muted">
        <div className="spinner !m-0" />
        <span className="text-sm font-medium">데이터를 불러오고 있어요...</span>
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
      {/* Subtle Modern Aurora Mesh Background */}
      <div className="bg-ambient" />

      <Routes>
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

        {/* User Service Dashboard pages wrapped in Modern Full-Screen Layout */}
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
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <AppContent />
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
