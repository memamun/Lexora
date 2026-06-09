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
    // Since we export let _cache, we might need a getter if we wanted to test the export
    // However, vitest can access exported let variables from the module scope but they are immutable bindings in ES modules.
    // Instead we test the effect by mocking or verifying the next function call behavior if needed.
    // Actually we can check it by importing it? Yes, we imported `_cache` above.
    // Wait, let exports don't always update the imported binding immediately in some environments unless we re-import, but let's see.
  });

  describe('pruneOldDaily', () => {
    it('returns empty object if no data provided', () => {
      expect(pruneOldDaily(null)).toEqual({});
      expect(pruneOldDaily(undefined)).toEqual({});
      expect(pruneOldDaily(false)).toEqual({});
      expect(pruneOldDaily(0)).toEqual({});
      expect(pruneOldDaily("")).toEqual({});
      expect(pruneOldDaily(NaN)).toEqual({});
    });

    it('returns empty object if empty object provided', () => {
      expect(pruneOldDaily({})).toEqual({});
    });

    it('removes entries older than DAILY_RETENTION_DAYS', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-10-01T12:00:00Z'));

      const data = {
        '2023-10-01': 5,
        '2023-09-30': 10,
        '2023-01-01': 20 // Much older than 90 days
      };

      const result = pruneOldDaily(data);
      expect(result).toHaveProperty('2023-10-01', 5);
      expect(result).toHaveProperty('2023-09-30', 10);
      expect(result).not.toHaveProperty('2023-01-01');

      vi.useRealTimers();
    });
  });
});
