import { renderHook, act } from '@testing-library/react';
import { useStudyQuizzes } from './useStudyQuizzes';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, batchCommit } from '../../lib/db';

vi.mock('../../lib/db', () => ({
  db: {
    entities: {
      LevelProgress: {
        update: vi.fn().mockResolvedValue({ id: 'lp-test-id' }),
        create: vi.fn().mockResolvedValue({ id: 'lp-test-id' }),
      },
      QuizAttempt: {
        create: vi.fn().mockResolvedValue({ id: 'qa-test-id' }),
      },
      WordReview: {
        update: vi.fn().mockResolvedValue({ id: 'wr-test-id' }),
        create: vi.fn().mockResolvedValue({ id: 'wr-test-id' }),
      }
    }
  },
  batchCommit: vi.fn().mockImplementation(async (ops) => {
    return ops.map(o => ({ ...o, id: o.id || 'new-id' }));
  })
}));

describe('useStudyQuizzes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReviewMapRef = { current: new Map() };
  const mockGetAllQuizWrongWords = [];
  const getWeakWords = [];

  it('recordLevelQuiz successfully updates state (with wrong words)', async () => {
    const setLevelProgress = vi.fn();
    const loadData = vi.fn();
    const quizAttempts = [];
    const levelProgress = [
      { id: 'lp1', level_number: 1, is_completed: false, quiz_score: 0 }
    ];

    const { result } = renderHook(() => useStudyQuizzes({
      quizAttempts,
      levelProgress, setLevelProgress,
      reviewMapRef: mockReviewMapRef,
      loadData,
      getWeakWords,
      getAllQuizWrongWords: mockGetAllQuizWrongWords
    }));

    await act(async () => {
      await result.current.recordLevelQuiz(1, 100, [1, 2, 3]);
    });

    expect(batchCommit).toHaveBeenCalled();
    expect(batchCommit.mock.calls[0][0].some(op => op.entity === 'QuizAttempt')).toBe(true);
    expect(loadData).toHaveBeenCalled();
  });

  it('handles error in recordLevelQuiz gracefully', async () => {
    const setLevelProgress = vi.fn();
    const loadData = vi.fn();

    batchCommit.mockRejectedValueOnce(new Error('DB Error'));

    const { result } = renderHook(() => useStudyQuizzes({
      quizAttempts: [],
      levelProgress: [{ id: 'lp1', level_number: 1, is_completed: false, quiz_score: 0 }],
      setLevelProgress,
      reviewMapRef: mockReviewMapRef,
      loadData,
      getWeakWords: [],
      getAllQuizWrongWords: []
    }));

    await act(async () => {
      try {
        await result.current.recordLevelQuiz(1, 100, [1]);
      } catch (e) {
      }
    });

    expect(batchCommit).toHaveBeenCalled();
  });
});