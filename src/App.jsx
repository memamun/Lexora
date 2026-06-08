import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
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

// ─── Lazy-loaded pages for code-splitting ───
const Dashboard = lazy(() => import('@/pages/Dashboard'));
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
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const WordMistakes = lazy(() => import('@/pages/WordMistakes'));
const CrossLevelQuiz = lazy(() => import('@/pages/CrossLevelQuiz'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <LexoraLogo className="w-10 h-14 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (
        location.pathname === '/' ||
        location.pathname === '/login' ||
        location.pathname === '/register' ||
        !canGoBack
      ) {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      handleBackButton.then(handler => handler.remove());
    };
  }, [location, navigate]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          {/* Animated SVG logo for beautiful loading state */}
          <LexoraLogo className="w-16 h-20 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.35)]" isLoading={true} />
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/80 animate-pulse">
            Synaptic Core Initializing...
          </div>
        </div>
      </div>
    );
  }


  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigate('/login', { replace: true }); return null; }
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
              <Router>
                <AuthenticatedApp />
              </Router>
            </NavigationProvider>
            <SonnerToaster position="top-center" richColors />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App