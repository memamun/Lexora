import { describe, it, expect } from 'vitest';
import {
  WORDS_PER_LEVEL,
  TOTAL_LEVELS,
  TOTAL_WORDS,
  QUIZ_PASS_MARK,
  MAX_REVIEWS_FETCH,
  MAX_STATS_FETCH,
  MAX_LEVEL_PROGRESS_FETCH,
  MODE_QUEUE_LIMITS,
  WEAK_THRESHOLD,
  BATTLE_SPRINT_TIME,
  BATTLE_SPRINT_POOL_SIZE,
  BATTLE_MARATHON_POOL_SIZE,
  BATTLE_MARATHON_QUESTION_COUNT,
} from './constants';

describe('Constants', () => {
  it('should have the correct level configurations', () => {
    expect(WORDS_PER_LEVEL).toBe(20);
    expect(TOTAL_LEVELS).toBe(15);
    expect(TOTAL_WORDS).toBe(WORDS_PER_LEVEL * TOTAL_LEVELS);
    expect(TOTAL_WORDS).toBe(300);
  });

  it('should have the correct quiz and mastery thresholds', () => {
    expect(QUIZ_PASS_MARK).toBe(80);
    expect(WEAK_THRESHOLD).toBe(0.6);
  });

  it('should have the correct data fetching limits', () => {
    expect(MAX_REVIEWS_FETCH).toBe(1000);
    expect(MAX_STATS_FETCH).toBe(1);
    expect(MAX_LEVEL_PROGRESS_FETCH).toBe(20);
  });

  it('should have the correct mode queue limits', () => {
    expect(MODE_QUEUE_LIMITS).toEqual({
      smart: 30,
      due: Infinity,
      weak: Infinity,
      forgetting: Infinity,
      new: 20,
    });
  });

  it('should have the correct battle mode configurations', () => {
    expect(BATTLE_SPRINT_TIME).toBe(30);
    expect(BATTLE_SPRINT_POOL_SIZE).toBe(60);
    expect(BATTLE_MARATHON_POOL_SIZE).toBe(50);
    expect(BATTLE_MARATHON_QUESTION_COUNT).toBe(50);
  });
});
