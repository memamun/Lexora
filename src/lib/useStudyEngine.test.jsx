import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, render } from '@testing-library/react';
import { StudyEngineProvider, useStudyEngine, clearStudyEngineCache } from './useStudyEngine';
import { useAuth } from './AuthContext';
import { useStudyState } from './study-engine/useStudyState';
import { useStudyReviews } from './study-engine/useStudyReviews';
import { useStudyLevels } from './study-engine/useStudyLevels';
import { useStudyQuizzes } from './study-engine/useStudyQuizzes';

vi.mock('./AuthContext');
vi.mock('./study-engine/cache', () => ({
  clearStudyEngineCache: vi.fn(),
}));
vi.mock('./study-engine/useStudyState');
vi.mock('./study-engine/useStudyReviews');
vi.mock('./study-engine/useStudyLevels');
vi.mock('./study-engine/useStudyQuizzes');

describe('StudyEngineProvider and useStudyEngine', () => {
  const mockUser = { uid: 'user123' };

  const mockState = {
    reviews: { due: 5 },
    stats: { totalXP: 100 },
    levelProgress: { level: 2 },
    quizAttempts: { passed: 1 },
    loading: false,
    loadData: vi.fn(),
  };

  const mockReviewsProps = {
    getWeakWords: vi.fn(),
    addReview: vi.fn(),
  };

  const mockLevelsProps = {
    checkLevelUp: vi.fn(),
  };

  const mockQuizzesProps = {
    startQuiz: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({ user: mockUser });
    useStudyState.mockReturnValue(mockState);
    useStudyReviews.mockReturnValue(mockReviewsProps);
    useStudyLevels.mockReturnValue(mockLevelsProps);
    useStudyQuizzes.mockReturnValue(mockQuizzesProps);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports clearStudyEngineCache', () => {
    expect(clearStudyEngineCache).toBeDefined();
    expect(typeof clearStudyEngineCache).toBe('function');
  });

  it('throws an error if useStudyEngine is used outside StudyEngineProvider', () => {
    const originalError = console.error;
    console.error = vi.fn(); // Suppress the expected React error boundary console log

    expect(() => renderHook(() => useStudyEngine())).toThrow('useStudyEngine must be used within a StudyEngineProvider');

    console.error = originalError;
  });

  it('provides the expected context value and calls loadData on mount', () => {
    const { result } = renderHook(() => useStudyEngine(), {
      wrapper: ({ children }) => <StudyEngineProvider>{children}</StudyEngineProvider>,
    });

    // Check if underlying hooks were called with correct arguments
    expect(useStudyState).toHaveBeenCalledWith(mockUser);
    expect(useStudyReviews).toHaveBeenCalledWith({ ...mockState, user: mockUser });
    expect(useStudyLevels).toHaveBeenCalledWith(mockState);
    expect(useStudyQuizzes).toHaveBeenCalledWith({
      ...mockState,
      getWeakWords: mockReviewsProps.getWeakWords,
    });

    // Check if loadData was called on mount
    expect(mockState.loadData).toHaveBeenCalledTimes(1);

    // Check combined context value
    expect(result.current).toMatchObject({
      reviews: mockState.reviews,
      stats: mockState.stats,
      levelProgress: mockState.levelProgress,
      quizAttempts: mockState.quizAttempts,
      loading: mockState.loading,
      reload: mockState.loadData,
      ...mockReviewsProps,
      ...mockLevelsProps,
      ...mockQuizzesProps,
    });
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <StudyEngineProvider>
        <div>Test Child Content</div>
      </StudyEngineProvider>
    );
    expect(getByText('Test Child Content')).toBeTruthy();
  });
});
