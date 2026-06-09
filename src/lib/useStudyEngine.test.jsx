import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StudyEngineProvider, useStudyEngine, clearStudyEngineCache } from './useStudyEngine';
import { useAuth } from './AuthContext';
import { db } from './db';
import { LEVELS } from './wordData';

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

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

vi.mock('./analytics', () => ({
  trackDailyActivity: vi.fn(),
}));

const TestComponent = () => {
  const { reviews, stats, levelProgress, quizAttempts, loading } = useStudyEngine();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="reviews-length">{reviews.length}</div>
      <div data-testid="stats">{stats === null ? 'null' : 'exists'}</div>
      <div data-testid="levelProgress-length">{levelProgress.length}</div>
      <div data-testid="quizAttempts-length">{quizAttempts.length}</div>
    </div>
  );
};

describe('StudyEngineProvider error handling in loadData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStudyEngineCache();
    useAuth.mockReturnValue({ user: { id: 'test-user-123' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gracefully handles DB fetch errors and degrades to empty arrays/null stats', async () => {
    // Mock all DB fetches to reject
    const mockError = new Error('Simulated DB connection failure');
    db.entities.WordReview.list.mockRejectedValue(mockError);
    db.entities.UserStats.list.mockRejectedValue(mockError);
    db.entities.LevelProgress.list.mockRejectedValue(mockError);
    db.entities.QuizAttempt.list.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <StudyEngineProvider>
        <TestComponent />
      </StudyEngineProvider>
    );

    expect(screen.getByText('Loading...')).toBeDefined();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
    });

    expect(screen.getByTestId('reviews-length').textContent).toBe('0');
    expect(screen.getByTestId('stats').textContent).toBe('null');
    expect(screen.getByTestId('levelProgress-length').textContent).toBe(String(LEVELS.length));
    expect(screen.getByTestId('quizAttempts-length').textContent).toBe('0');

    expect(consoleSpy).not.toHaveBeenCalledWith('Failed to load study engine data:', mockError);
  });

  it('fails gracefully when Promise.all throws', async () => {
    const mockError = new Error('Simulated Promise.all failure');
    db.entities.WordReview.list.mockImplementation(() => { throw mockError });
    db.entities.UserStats.list.mockImplementation(() => { throw mockError });
    db.entities.LevelProgress.list.mockImplementation(() => { throw mockError });
    db.entities.QuizAttempt.list.mockImplementation(() => { throw mockError });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <StudyEngineProvider>
        <TestComponent />
      </StudyEngineProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
    });

    expect(screen.getByTestId('reviews-length').textContent).toBe('0');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load study engine data:', mockError);
  });
});
