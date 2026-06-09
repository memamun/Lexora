import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { StudyEngineProvider, useStudyEngine } from './useStudyEngine';
import { useAuth } from './AuthContext';
import { db } from './db';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./db', () => ({
  db: {
    entities: {
      WordReview: { list: vi.fn() },
      UserStats: { list: vi.fn() },
      LevelProgress: { list: vi.fn() },
      QuizAttempt: { list: vi.fn() },
    },
  },
  batchCommit: vi.fn(),
}));

vi.mock('./analytics', () => ({
  trackDailyActivity: vi.fn(),
}));

// A test component to consume the context
function TestComponent() {
  const { reviews, stats, levelProgress, quizAttempts, loading } = useStudyEngine();

  if (loading) return <div data-testid="loading">Loading...</div>;

  return (
    <div>
      <div data-testid="reviews-count">{reviews.length}</div>
      <div data-testid="stats-exists">{stats ? 'yes' : 'no'}</div>
      <div data-testid="quiz-count">{quizAttempts.length}</div>
      <div data-testid="levels-count">{levelProgress.length}</div>
    </div>
  );
}

describe('StudyEngineProvider loadData error paths', () => {
  beforeEach(() => {
    // Clear caches if any exported clear functions existed,
    // but we can just mock the user to ensure it tries to load fresh
    useAuth.mockReturnValue({ user: { id: 'test-user-' + Math.random() } });
    vi.clearAllMocks();
  });

  it('handles database fetch errors gracefully and uses fallbacks', async () => {
    // Setup mocks to reject
    db.entities.WordReview.list.mockRejectedValue(new Error('Network Error'));
    db.entities.UserStats.list.mockRejectedValue(new Error('Network Error'));
    db.entities.LevelProgress.list.mockRejectedValue(new Error('Network Error'));
    db.entities.QuizAttempt.list.mockRejectedValue(new Error('Network Error'));

    const { getByTestId } = render(
      <StudyEngineProvider>
        <TestComponent />
      </StudyEngineProvider>
    );

    // Initial state is loading
    expect(getByTestId('loading')).toBeInTheDocument();

    // Wait for the data loading to complete (which should catch errors)
    await waitFor(() => {
      expect(() => getByTestId('loading')).toThrow();
    });

    // Check that fallback values were used
    expect(getByTestId('reviews-count')).toHaveTextContent('0');
    expect(getByTestId('stats-exists')).toHaveTextContent('no'); // stats fallback is null
    expect(getByTestId('quiz-count')).toHaveTextContent('0');
    // levelProgress depends on TOTAL_LEVELS but initializes all levels to 0 progress
    expect(Number(getByTestId('levels-count').textContent)).toBeGreaterThan(0);
  });

  it('handles successful database fetch', async () => {
    // Setup mocks to resolve
    db.entities.WordReview.list.mockResolvedValue([{ id: 1, word_index: 0, word: 'hello' }]);
    db.entities.UserStats.list.mockResolvedValue([{ id: 1, score: 100 }]);
    db.entities.LevelProgress.list.mockResolvedValue([{ id: 1, level_number: 1 }]);
    db.entities.QuizAttempt.list.mockResolvedValue([{ id: 1, score: 10 }]);

    const { getByTestId } = render(
      <StudyEngineProvider>
        <TestComponent />
      </StudyEngineProvider>
    );

    await waitFor(() => {
      expect(() => getByTestId('loading')).toThrow();
    });

    // Verify it used the loaded data
    expect(getByTestId('reviews-count')).toHaveTextContent('1');
    expect(getByTestId('stats-exists')).toHaveTextContent('yes');
    expect(getByTestId('quiz-count')).toHaveTextContent('1');
  });
});
