import { renderHook, act } from '@testing-library/react';
import { useStudyState } from './useStudyState';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../../lib/db';
import { clearStudyEngineCache } from './cache';

vi.mock('../../lib/db', () => ({
  db: {
    entities: {
      WordReview: { list: vi.fn() },
      UserStats: { list: vi.fn() },
      LevelProgress: { list: vi.fn() },
      QuizAttempt: { list: vi.fn() }
    }
  }
}));

describe('useStudyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStudyEngineCache();
  });

  it('loads data and initializes correctly', async () => {
    db.entities.WordReview.list.mockResolvedValue([]);
    db.entities.UserStats.list.mockResolvedValue([]);
    db.entities.LevelProgress.list.mockResolvedValue([]);
    db.entities.QuizAttempt.list.mockResolvedValue([]);

    const { result } = renderHook(() => useStudyState({ id: 'user1' }));

    await act(async () => {
      await result.current.loadData();
    });

    expect(db.entities.WordReview.list).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
