import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackDailyActivity, getLocalDailyData } from './analytics';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';
import { analytics as mockAnalyticsInstance } from '@/lib/firebase';

const DAILY_KEY = 'lexora_analytics_daily';

// Mock dependencies
vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(true),
  getAnalytics: vi.fn().mockReturnValue({}),
}));

vi.mock('firebase/app', () => ({
  getApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  increment: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  analytics: {}, // Representing the mock analytics instance
  auth: {},
  isFirebaseConfigured: true,
}));

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-15T12:00:00Z')); // Mock system time to a fixed date
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('trackDailyActivity', () => {
    it('should initialize and accumulate daily activity in localStorage for a correct answer', () => {
      const reviewData = { correct: true, responseTime: 1500 };
      trackDailyActivity(reviewData);

      const localData = getLocalDailyData();
      const expectedDate = '2023-10-15';

      expect(localData).toHaveProperty(expectedDate);
      expect(localData[expectedDate]).toEqual({
        reviews: 1,
        correct: 1,
        timeSpent: 1500,
      });

      // Verify the value in localStorage directly
      const rawStorage = JSON.parse(localStorage.getItem(DAILY_KEY));
      expect(rawStorage).toEqual(localData);
    });

    it('should correctly accumulate subsequent reviews on the same day', () => {
      trackDailyActivity({ correct: true, responseTime: 1000 });
      trackDailyActivity({ correct: false, responseTime: 2000 });
      trackDailyActivity({ correct: true, responseTime: 500 });

      const localData = getLocalDailyData();
      const expectedDate = '2023-10-15';

      expect(localData[expectedDate]).toEqual({
        reviews: 3,
        correct: 2,
        timeSpent: 3500,
      });
    });

    it('should log review_completed event to Firebase Analytics', () => {
      const reviewData = { correct: true, responseTime: 1234 };
      trackDailyActivity(reviewData);

      expect(firebaseLogEvent).toHaveBeenCalledTimes(1);
      expect(firebaseLogEvent).toHaveBeenCalledWith(
        mockAnalyticsInstance,
        'review_completed',
        {
          correct: 'true',
          response_time_ms: 1234,
        }
      );
    });

    it('should handle missing responseTime and incorrect review correctly for Firebase and local storage', () => {
      const reviewData = { correct: false }; // Missing responseTime
      trackDailyActivity(reviewData);

      const localData = getLocalDailyData();
      const expectedDate = '2023-10-15';

      expect(localData[expectedDate]).toEqual({
        reviews: 1,
        correct: 0,
        timeSpent: 0,
      });

      expect(firebaseLogEvent).toHaveBeenCalledWith(
        mockAnalyticsInstance,
        'review_completed',
        {
          correct: 'false',
          response_time_ms: 0,
        }
      );
    });

    it('should prune data older than DAILY_RETENTION_DAYS (30 days)', () => {
      // Set initial date
      vi.setSystemTime(new Date('2023-10-15T12:00:00Z'));
      trackDailyActivity({ correct: true, responseTime: 1000 });

      // Advance time by 15 days (within retention period)
      vi.setSystemTime(new Date('2023-10-30T12:00:00Z'));
      trackDailyActivity({ correct: true, responseTime: 1000 });

      // Advance time to day 35 (past the 30-day retention for the first entry)
      vi.setSystemTime(new Date('2023-11-19T12:00:00Z'));
      trackDailyActivity({ correct: true, responseTime: 1000 });

      const localData = getLocalDailyData();

      // Should not have the entry from 2023-10-15
      expect(localData).not.toHaveProperty('2023-10-15');

      // Should have the entry from 2023-10-30 (since 2023-11-19 - 30 days = 2023-10-20)
      expect(localData).toHaveProperty('2023-10-30');

      // Should have the new entry from 2023-11-19
      expect(localData).toHaveProperty('2023-11-19');
    });

    it('should silently handle localStorage errors during accumulateDaily', () => {
      // Mock localStorage.setItem to throw an error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Call function - should not throw an exception, but catch and warn
      expect(() => {
        trackDailyActivity({ correct: true, responseTime: 1000 });
      }).not.toThrow();

      expect(warnSpy).toHaveBeenCalledWith(
        '[Analytics] Failed to save local daily:',
        'QuotaExceededError'
      );

      setItemSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should silently handle JSON parse errors from corrupted localStorage', () => {
      // Inject corrupted JSON
      localStorage.setItem(DAILY_KEY, '{ invalid json');

      // Track activity should wipe/reset it rather than throw
      trackDailyActivity({ correct: true, responseTime: 1000 });

      const localData = getLocalDailyData();
      const expectedDate = '2023-10-15';

      // The corrupt data was ignored, and we just recorded the new event
      expect(localData[expectedDate]).toEqual({
        reviews: 1,
        correct: 1,
        timeSpent: 1000,
      });
    });
  });
});
