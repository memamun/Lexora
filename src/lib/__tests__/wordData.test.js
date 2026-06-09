import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateNextReview } from '../wordData';

describe('calculateNextReview', () => {
  const MOCK_DATE = new Date('2024-01-01T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize a new card correctly with "instant" confidence', () => {
    const review = {};
    const confidence = 'instant';

    const result = calculateNextReview(review, confidence);

    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(0.25);
    expect(result.ease_factor).toBe(2.6); // 2.5 + 0.1
    expect(result.mastery_level).toBe('learning');
    expect(result.confidence).toBe('instant');

    // 0.25 hours = 15 minutes
    const expectedNextReview = new Date(MOCK_DATE.getTime() + 15 * 60000).toISOString();
    expect(result.next_review).toBe(expectedNextReview);
    expect(result.last_review).toBe(MOCK_DATE.toISOString());
  });

  it('should initialize a new card correctly with "hesitated" confidence', () => {
    const review = {};
    const confidence = 'hesitated';

    const result = calculateNextReview(review, confidence);

    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(0.25);
    // quality = 3 -> 2.5 + (0.1 - (5 - 3) * (0.08 + (5 - 3) * 0.02)) = 2.5 + (0.1 - 2 * (0.08 + 0.04)) = 2.5 + 0.1 - 0.24 = 2.36
    expect(result.ease_factor).toBeCloseTo(2.36, 2);
    expect(result.mastery_level).toBe('learning');
  });

  it('should reset interval and ease factor when confidence is "forgot"', () => {
    const review = { ease_factor: 2.6, interval: 24, repetitions: 2 };
    const confidence = 'forgot';

    const result = calculateNextReview(review, confidence);

    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(0.05); // quality 1 => 0.05
    // quality = 1 -> ease_factor + (0.1 - 4 * (0.08 + 4 * 0.02)) = 2.6 + (0.1 - 4 * 0.16) = 2.6 + 0.1 - 0.64 = 2.06
    expect(result.ease_factor).toBeCloseTo(2.06, 2);
    expect(result.mastery_level).toBe('new');

    // 0.05 hours = 3 minutes
    const expectedNextReview = new Date(MOCK_DATE.getTime() + 3 * 60000).toISOString();
    expect(result.next_review).toBe(expectedNextReview);
  });

  it('should set interval to 24 hours on second successful "instant" review', () => {
    const review = { ease_factor: 2.6, interval: 0.25, repetitions: 1 };
    const confidence = 'instant';

    const result = calculateNextReview(review, confidence);

    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(24);
    expect(result.ease_factor).toBe(2.7); // 2.6 + 0.1
    expect(result.mastery_level).toBe('reviewing');
  });

  it('should set interval to 6 hours on second review with "hesitated" confidence', () => {
    const review = { ease_factor: 2.36, interval: 0.25, repetitions: 1 };
    const confidence = 'hesitated';

    const result = calculateNextReview(review, confidence);

    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
    expect(result.ease_factor).toBeCloseTo(2.22, 2); // 2.36 - 0.14 = 2.22
    expect(result.mastery_level).toBe('reviewing');
  });

  it('should multiply interval by ease_factor on subsequent reviews', () => {
    const review = { ease_factor: 2.7, interval: 24, repetitions: 2 };
    const confidence = 'instant';

    const result = calculateNextReview(review, confidence);

    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(24 * 2.7); // 64.8
    expect(result.ease_factor).toBeCloseTo(2.8, 2); // 2.7 + 0.1
    expect(result.mastery_level).toBe('reviewing');
  });

  it('should not let ease_factor drop below 1.3', () => {
    const review = { ease_factor: 1.4, interval: 24, repetitions: 2 };
    const confidence = 'forgot'; // quality 1 drops ease factor by 0.54

    const result = calculateNextReview(review, confidence);

    expect(result.ease_factor).toBe(1.3); // Minimum bound
  });

  it('should set mastery_level to "mastered" when repetitions >= 5 and interval > 168 hours', () => {
    const review = { ease_factor: 2.5, interval: 100, repetitions: 4 };
    const confidence = 'instant';

    const result = calculateNextReview(review, confidence);

    expect(result.repetitions).toBe(5);
    expect(result.interval).toBe(250); // 100 * 2.5
    expect(result.mastery_level).toBe('mastered');
  });

  it('should not set mastery_level to "mastered" if interval is not > 168 hours even if repetitions >= 5', () => {
    const review = { ease_factor: 1.3, interval: 50, repetitions: 5 };
    const confidence = 'hesitated';

    const result = calculateNextReview(review, confidence);

    expect(result.repetitions).toBe(6);
    expect(result.interval).toBe(65); // 50 * 1.3
    expect(result.mastery_level).toBe('reviewing');
  });
});
