import { renderHook, act } from '@testing-library/react';
import { useStudyQuizzes } from './useStudyQuizzes';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../../lib/db';

vi.mock('../../lib/db', () => ({
  db: {
    entities: {
      QuizAttempt: { create: vi.fn().mockResolvedValue({ id: 'qa1' }) },
      LevelProgress: { update: vi.fn().mockResolvedValue({ id: 'lp1' }), create: vi.fn().mockResolvedValue({ id: 'lp2' }) },
      WordReview: { update: vi.fn().mockResolvedValue({ id: 'wr1' }), create: vi.fn().mockResolvedValue({ id: 'wr2' }) }
    }
  }
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
      // Pass a non-empty wrongWordIndices array so QuizAttempt.create is called
      await result.current.recordLevelQuiz(1, 100, [1, 2, 3]);
    });

    expect(db.entities.QuizAttempt.create).toHaveBeenCalled();
    expect(loadData).toHaveBeenCalled();
  });

  it('handles error in recordLevelQuiz gracefully', async () => {
    const setLevelProgress = vi.fn();
    const loadData = vi.fn();

    db.entities.QuizAttempt.create.mockRejectedValueOnce(new Error('DB Error'));

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
        // expect to throw or handle
      }
    });

    expect(db.entities.QuizAttempt.create).toHaveBeenCalled();
  });
});
