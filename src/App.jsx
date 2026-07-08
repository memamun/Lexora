import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useEffect, lazy, Suspense, useRef } from 'react';
import { BrowserRouter, Route, Routes, useNavigate, Navigate, useLocation, Outlet } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import PageNotFound from './pages/PageNotFound';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { StudyEngineProvider } from '@/lib/useStudyEngine';
import { NavigationProvider } from '@/lib/NavigationContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import LexoraLogo from '@/components/ui/LexoraLogo';
import OfflineBanner from '@/components/OfflineBanner';
import Dashboard from '@/pages/Dashboard';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// ─── Lazy-loaded pages for code-splitting ───
const Flashcards = lazy(() => import('@/pages/Flashcards'));
const MCQPractice = lazy(() => import('@/pages/MCQPractice'));
const BattleMode = lazy(() => import('@/pages/BattleMode'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const ConfusionLab = lazy(() => import('@/pages/ConfusionLab'));
const SpellingPractice = lazy(() => import('@/pages/SpellingPractice'));
const MatchingDrill = lazy(() => import('@/pages/MatchingDrill'));
const Levels = lazy(() => import('@/pages/Levels'));
const LevelStudy = lazy(() => import('@/pages/LevelStudy'));
const WordDetail = lazy(() => import('@/pages/WordDetail'));
const WordList = lazy(() => import('@/pages/WordList'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const Settings = lazy(() => import('@/pages/Settings'));
const WordMistakes = lazy(() => import('@/pages/WordMistakes'));
const CrossLevelQuiz = lazy(() => import('@/pages/CrossLevelQuiz'));
const ClusterQuizPage = lazy(() => import('@/pages/ClusterQuizPage'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <LexoraLogo isLoading={true} className="w-12 h-16" animated={true} />
  </div>
);

const AdminRoute = () => {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <PageLoader />;
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);

  useEffect(() => {
    navigateRef.current = navigate;
    locationRef.current = location;
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = CapApp.addListener('backButton', async ({ canGoBack }) => {
      const currentPath = locationRef.current.pathname;
      if (
        currentPath === '/' ||
        currentPath === '/login' ||
        currentPath === '/register' ||
        !canGoBack
      ) {
        // Confirm before exiting to prevent accidental data loss using native dialog
        const { value } = await Dialog.confirm({
          title: 'Exit Lexora',
          message: 'Exit Lexora? Your unsaved progress may be lost.',
          okButtonTitle: 'Exit',
          cancelButtonTitle: 'Cancel'
        });
        if (value) {
          CapApp.exitApp();
        }
      } else {
        navigateRef.current(-1);
      }
    });

    return () => {
      handleBackButton.then(handler => handler.remove());
    };
  }, []);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <LexoraLogo isLoading={true} className="w-16 h-20 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.35)]" animated={true} />
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/80 animate-pulse">
            Lexora Initializing...
          </div>
        </div>
      </div>
    );
  }


  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') return <Navigate to="/login" replace />;
  }

  return (
    <StudyEngineProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/mcq" element={<MCQPractice />} />
              <Route path="/battle" element={<BattleMode />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/confusion" element={<ConfusionLab />} />
              <Route path="/spelling" element={<SpellingPractice />} />
              <Route path="/matching" element={<MatchingDrill />} />
              <Route path="/levels" element={<Levels />} />
              <Route path="/study-level/:levelNumber" element={<LevelStudy />} />
              <Route path="/words" element={<WordList />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/word/:id" element={<WordDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/word-mistakes" element={<WordMistakes />} />
              <Route path="/cross-level-quiz" element={<CrossLevelQuiz />} />
              <Route path="/cluster-quiz" element={<ClusterQuizPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </StudyEngineProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <NavigationProvider>
              <BrowserRouter>
                <OfflineBanner />
                <AuthenticatedApp />
              </BrowserRouter>
            </NavigationProvider>
            <SonnerToaster position="top-center" richColors />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App