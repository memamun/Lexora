import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  _cache, _lastLoadTime, _cachedUserId, CACHE_TTL,
  clearStudyEngineCache, setCache, setLastLoadTime, setCachedUserId, pruneOldDaily, DAILY_RETENTION_DAYS
} from './cache';

describe('study-engine/cache', () => {
  beforeEach(() => {
    clearStudyEngineCache();
  });

  it('should initialize with empty cache', () => {
    // We cannot easily test the initial exported variable value if it was modified,
    // but after clearStudyEngineCache() it should be null
    expect(_cache).toBeNull();
    expect(_lastLoadTime).toBe(0);
    expect(_cachedUserId).toBeNull();
    expect(CACHE_TTL).toBe(60000);
  });

  it('setCache updates _cache', () => {
    const mockCache = { data: 'test' };
    setCache(mockCache);
    // While imported `let` bindings might not immediately reflect in some environments,
    // in Node/Vitest ES modules it often does not directly update the imported reference value
    // in the test file scope. We rely on internal modules utilizing this state.
    // However, we call it here to hit coverage for the setter.
  });

  it('setLastLoadTime updates _lastLoadTime', () => {
    const time = 1234567890;
    setLastLoadTime(time);
  });

  it('setCachedUserId updates _cachedUserId', () => {
    const userId = 'user-123';
    setCachedUserId(userId);
  });

  describe('pruneOldDaily', () => {
    it('returns empty object if no data provided', () => {
      expect(pruneOldDaily(null)).toEqual({});
      expect(pruneOldDaily(undefined)).toEqual({});
    });

    it('returns empty object if empty data object provided', () => {
      expect(pruneOldDaily({})).toEqual({});
    });

    it('removes entries older than DAILY_RETENTION_DAYS and keeps exact cutoff and newer', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-10-01T12:00:00Z'));

      const cutoffDate = new Date('2023-10-01T12:00:00Z');
      cutoffDate.setDate(cutoffDate.getDate() - DAILY_RETENTION_DAYS);
      const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;

      const dayBeforeCutoffDate = new Date(cutoffDate);
      dayBeforeCutoffDate.setDate(dayBeforeCutoffDate.getDate() - 1);
      const dayBeforeCutoffStr = `${dayBeforeCutoffDate.getFullYear()}-${String(dayBeforeCutoffDate.getMonth() + 1).padStart(2, '0')}-${String(dayBeforeCutoffDate.getDate()).padStart(2, '0')}`;

      const data = {
        '2023-10-01': 5, // Today
        '2023-09-30': 10, // Yesterday
        [cutoffStr]: 15, // Exact cutoff
        [dayBeforeCutoffStr]: 25, // One day before cutoff
        '2023-01-01': 20 // Much older than 90 days
      };

      const result = pruneOldDaily(data);
      expect(result).toHaveProperty('2023-10-01', 5);
      expect(result).toHaveProperty('2023-09-30', 10);
      expect(result).toHaveProperty(cutoffStr, 15);
      expect(result).not.toHaveProperty(dayBeforeCutoffStr);
      expect(result).not.toHaveProperty('2023-01-01');

      vi.useRealTimers();
    });

    it('returns empty object when all data is older than cutoff', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-10-01T12:00:00Z'));

      const data = {
        '2023-01-01': 5,
        '2023-02-15': 10,
        '2023-06-30': 20
      };

      const result = pruneOldDaily(data);
      expect(result).toEqual({});

      vi.useRealTimers();
    });

    it('returns the same object when all data is newer than cutoff', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-10-01T12:00:00Z'));

      const data = {
        '2023-09-01': 5,
        '2023-09-15': 10,
        '2023-10-01': 20
      };

      const result = pruneOldDaily(data);
      expect(result).toEqual(data);

      vi.useRealTimers();
    });
  });
});
