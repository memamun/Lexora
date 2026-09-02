import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackDailyActivity } from './analytics';

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles local storage save error', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    trackDailyActivity({ reviewCount: 1, correct: true, responseTime: 100 });

    expect(setItemSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[Analytics] Failed to save local daily:', 'QuotaExceededError');

    consoleWarnSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
