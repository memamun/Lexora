import { renderHook } from '@testing-library/react';
import { useStudyLevels } from './useStudyLevels';
import { describe, it, expect } from 'vitest';

describe('useStudyLevels', () => {
  const mockLevelProgress = [
    { level_number: 1, is_unlocked: true, is_completed: true },
    { level_number: 2, is_unlocked: true, is_completed: false },
    { level_number: 3, is_unlocked: false, is_completed: false },
    { level_number: 4, is_unlocked: true, is_completed: false }
  ];

  it('isLevelUnlocked works correctly', () => {
    const { result } = renderHook(() => useStudyLevels({ levelProgress: mockLevelProgress }));

    expect(result.current.isLevelUnlocked(1)).toBe(true);
    expect(result.current.isLevelUnlocked(2)).toBe(true);
    expect(result.current.isLevelUnlocked(3)).toBe(false);
    expect(result.current.isLevelUnlocked(4)).toBe(true);
    expect(result.current.isLevelUnlocked(5)).toBe(false);
  });

  it('getWordsForLevel handles valid and invalid levels', () => {
    const { result } = renderHook(() => useStudyLevels({ levelProgress: [] }));

    expect(result.current.getWordsForLevel(999)).toEqual([]);
    // level 1 exists
    const level1Words = result.current.getWordsForLevel(1);
    expect(Array.isArray(level1Words)).toBe(true);
  });
});
