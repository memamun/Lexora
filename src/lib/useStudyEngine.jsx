import { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { clearStudyEngineCache } from './study-engine/cache';
import { useStudyState } from './study-engine/useStudyState';
import { useStudyReviews } from './study-engine/useStudyReviews';
import { useStudyLevels } from './study-engine/useStudyLevels';
import { useStudyQuizzes } from './study-engine/useStudyQuizzes';

export { clearStudyEngineCache };

const StudyEngineContext = createContext(null);

export function StudyEngineProvider({ children }) {
  const { user } = useAuth();

  const state = useStudyState(user);

  const reviewsProps = useStudyReviews({ ...state, user });
  const levelsProps = useStudyLevels(state);
  const quizzesProps = useStudyQuizzes({
    ...state,
    getWeakWords: reviewsProps.getWeakWords,
    user
  });

  useEffect(() => { state.loadData(); }, [state.loadData]);

  const value = useMemo(() => ({
    reviews: state.reviews,
    stats: state.stats,
    levelProgress: state.levelProgress,
    quizAttempts: state.quizAttempts,
    loading: state.loading,
    reload: state.loadData,

    ...reviewsProps,
    ...levelsProps,
    ...quizzesProps
  }), [
    state.reviews, state.stats, state.levelProgress, state.quizAttempts, state.loading, state.loadData,
    reviewsProps, levelsProps, quizzesProps
  ]);

  return (
    <StudyEngineContext.Provider value={value}>
      {children}
    </StudyEngineContext.Provider>
  );
}

export function useStudyEngine() {
  const context = useContext(StudyEngineContext);
  if (!context) {
    throw new Error('useStudyEngine must be used within a StudyEngineProvider');
  }
  return context;
}
