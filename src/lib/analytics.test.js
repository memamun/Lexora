import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLocalDailyData } from './analytics';

describe('analytics', () => {
  describe('getLocalDailyData', () => {
    const DAILY_KEY = 'lexora_analytics_daily';

    beforeEach(() => {
      vi.clearAllMocks();
      localStorage.clear();
    });

    it('returns parsed data when valid JSON is in localStorage', () => {
      const mockData = { '2023-10-27': { reviews: 5, correct: 3, timeSpent: 120 } };
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockData));

      const result = getLocalDailyData();

      expect(localStorage.getItem).toHaveBeenCalledWith(DAILY_KEY);
      expect(result).toEqual(mockData);
    });

    it('returns an empty object when localStorage is empty', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      const result = getLocalDailyData();

      expect(localStorage.getItem).toHaveBeenCalledWith(DAILY_KEY);
      expect(result).toEqual({});
    });

    it('returns an empty object when localStorage contains invalid JSON', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid-json');

      const result = getLocalDailyData();

      expect(localStorage.getItem).toHaveBeenCalledWith(DAILY_KEY);
      expect(result).toEqual({});
    });
  });
});
