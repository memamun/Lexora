import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-serif text-base font-bold">L</span>
          </div>
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
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
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App