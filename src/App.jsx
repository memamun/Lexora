import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationProvider } from '@/lib/NavigationContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/pages/Dashboard';
import Flashcards from '@/pages/Flashcards';
import MCQPractice from '@/pages/MCQPractice';
import BattleMode from '@/pages/BattleMode';
import Analytics from '@/pages/Analytics';
import ConfusionLab from '@/pages/ConfusionLab';
import SpellingPractice from '@/pages/SpellingPractice';
import MatchingDrill from '@/pages/MatchingDrill';
import Levels from '@/pages/Levels';
import LevelStudy from '@/pages/LevelStudy';
import WordDetail from '@/pages/WordDetail';
import WordList from '@/pages/WordList';
import Settings from '@/pages/Settings';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import WordMistakes from '@/pages/WordMistakes';
import CrossLevelQuiz from '@/pages/CrossLevelQuiz';
import LexoraLogo from '@/components/ui/LexoraLogo';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const navigate = useNavigate();

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
          <Route path="/word/:id" element={<WordDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/word-mistakes" element={<WordMistakes />} />
          <Route path="/cross-level-quiz" element={<CrossLevelQuiz />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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