import { describe, it, expect } from 'vitest';
import * as constants from './constants';

describe('Constants', () => {
  describe('Word counts & level configuration', () => {
    it('should have the correct WORDS_PER_LEVEL', () => {
      expect(constants.WORDS_PER_LEVEL).toBe(20);
    });

    it('should have the correct TOTAL_LEVELS', () => {
      expect(constants.TOTAL_LEVELS).toBe(15);
    });

    it('should have TOTAL_WORDS as the product of WORDS_PER_LEVEL and TOTAL_LEVELS', () => {
      expect(constants.TOTAL_WORDS).toBe(constants.WORDS_PER_LEVEL * constants.TOTAL_LEVELS);
      expect(constants.TOTAL_WORDS).toBe(300);
    });
  });

  describe('Quiz & mastery thresholds', () => {
    it('should have the correct QUIZ_PASS_MARK', () => {
      expect(constants.QUIZ_PASS_MARK).toBe(80);
    });
  });

  describe('Data fetching limits', () => {
    it('should have the correct MAX_REVIEWS_FETCH', () => {
      expect(constants.MAX_REVIEWS_FETCH).toBe(1000);
    });

    it('should have the correct MAX_STATS_FETCH', () => {
      expect(constants.MAX_STATS_FETCH).toBe(1);
    });

    it('should have the correct MAX_LEVEL_PROGRESS_FETCH', () => {
      expect(constants.MAX_LEVEL_PROGRESS_FETCH).toBe(20);
    });
  });

  describe('Review queue limits per mode', () => {
    it('should have the correct MODE_QUEUE_LIMITS', () => {
      expect(constants.MODE_QUEUE_LIMITS).toEqual({
        smart: 30,
        due: Infinity,
        weak: Infinity,
        forgetting: Infinity,
        new: 20,
      });
    });
  });

  describe('Weak words threshold', () => {
    it('should have the correct WEAK_THRESHOLD', () => {
      expect(constants.WEAK_THRESHOLD).toBe(0.6);
    });
  });

  describe('Battle mode configuration', () => {
    it('should have the correct BATTLE_SPRINT_TIME', () => {
      expect(constants.BATTLE_SPRINT_TIME).toBe(30);
    });

    it('should have the correct BATTLE_SPRINT_POOL_SIZE', () => {
      expect(constants.BATTLE_SPRINT_POOL_SIZE).toBe(60);
    });

    it('should have the correct BATTLE_MARATHON_POOL_SIZE', () => {
      expect(constants.BATTLE_MARATHON_POOL_SIZE).toBe(50);
    });

    it('should have the correct BATTLE_MARATHON_QUESTION_COUNT', () => {
      expect(constants.BATTLE_MARATHON_QUESTION_COUNT).toBe(50);
    });
  });
});
