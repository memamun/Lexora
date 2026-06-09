import { describe, it, expect } from 'vitest';
import {
  ALL_WORDS,
  WORD_COUNT,
  LEVELS,
  DIFFICULTY_MAP,
  getConfusionCluster,
  calculateNextReview,
} from './wordData';

describe('wordData.js', () => {
  describe('Constants', () => {
    it('should have ALL_WORDS populated with words', () => {
      expect(ALL_WORDS).toBeInstanceOf(Array);
      expect(ALL_WORDS.length).toBeGreaterThan(0);
      expect(ALL_WORDS[0]).toHaveProperty('word');
      expect(ALL_WORDS[0]).toHaveProperty('meaning');
      expect(ALL_WORDS[0]).toHaveProperty('difficulty');
    });

    it('should have WORD_COUNT matching ALL_WORDS length', () => {
      expect(WORD_COUNT).toBe(ALL_WORDS.length);
    });

    it('should have valid LEVELS configuration', () => {
      expect(LEVELS).toBeInstanceOf(Array);
      expect(LEVELS.length).toBeGreaterThan(0);
      expect(LEVELS[0]).toHaveProperty('number', 1);
      expect(LEVELS[0]).toHaveProperty('title', 'Level 1');
      expect(LEVELS[0]).toHaveProperty('wordIndices');
      expect(LEVELS[0].wordIndices).toBeInstanceOf(Array);
    });

    it('should have DIFFICULTY_MAP with expected keys', () => {
      expect(DIFFICULTY_MAP).toHaveProperty('foundation');
      expect(DIFFICULTY_MAP).toHaveProperty('advanced');
      expect(DIFFICULTY_MAP).toHaveProperty('exam-level');
    });
  });

  describe('getConfusionCluster', () => {
    it('should return a cluster for a word that exists in a cluster', () => {
      const cluster = getConfusionCluster('LACONIC');
      expect(cluster).toContain('LACONIC');
      expect(cluster).toContain('TACITURN');
    });

    it('should be case-insensitive', () => {
      const cluster = getConfusionCluster('laconic');
      expect(cluster).toContain('LACONIC');
      expect(cluster).toContain('TACITURN');
    });

    it('should return an empty array if the word is not in any cluster', () => {
      const cluster = getConfusionCluster('NONEXISTENT_WORD');
      expect(cluster).toEqual([]);
    });
  });

  describe('calculateNextReview', () => {
    it('should calculate initial review correctly for instant confidence', () => {
      const review = {};
      const result = calculateNextReview(review, 'instant');

      expect(result.interval).toBe(0.25);
      expect(result.repetitions).toBe(1);
      expect(result.mastery_level).toBe('learning');
      expect(result.ease_factor).toBeCloseTo(2.6, 1);
    });

    it('should calculate initial review correctly for hesitated confidence', () => {
      const review = {};
      const result = calculateNextReview(review, 'hesitated');

      expect(result.interval).toBe(0.25);
      expect(result.repetitions).toBe(1);
      expect(result.mastery_level).toBe('learning');
      expect(result.ease_factor).toBeCloseTo(2.36, 2);
    });

    it('should calculate initial review correctly for forgot confidence', () => {
      const review = {};
      const result = calculateNextReview(review, 'forgot');

      expect(result.interval).toBe(0.05);
      expect(result.repetitions).toBe(0);
      expect(result.mastery_level).toBe('new');
      expect(result.ease_factor).toBeCloseTo(1.96, 2);
    });

    it('should progress to reviewing mastery level after 2 successful repetitions', () => {
      let result = calculateNextReview({}, 'instant'); // rep 1, interval 0.25
      result = calculateNextReview(result, 'instant'); // rep 2, interval 24

      expect(result.repetitions).toBe(2);
      expect(result.mastery_level).toBe('reviewing');
      expect(result.interval).toBe(24);
    });

    it('should reset repetitions if forgotten', () => {
      let result = calculateNextReview({}, 'instant'); // rep 1
      result = calculateNextReview(result, 'instant'); // rep 2
      result = calculateNextReview(result, 'forgot');  // rep 0

      expect(result.repetitions).toBe(0);
      expect(result.mastery_level).toBe('new');
      expect(result.interval).toBe(0.05);
    });

    it('should progress to mastered level after 5 successful repetitions and interval > 168', () => {
      let result = calculateNextReview({}, 'instant'); // rep 1
      result = calculateNextReview(result, 'instant'); // rep 2
      result = calculateNextReview(result, 'instant'); // rep 3
      result = calculateNextReview(result, 'instant'); // rep 4
      result = calculateNextReview(result, 'instant'); // rep 5

      expect(result.repetitions).toBe(5);
      expect(result.interval).toBeGreaterThan(168);
      expect(result.mastery_level).toBe('mastered');
    });
  });
});
