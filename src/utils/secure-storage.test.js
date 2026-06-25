import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { setSecureItem, getSecureItem, removeSecureItem } from './secure-storage';

// Mock capacitor core
vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: vi.fn(),
    },
  };
});

// Mock capacitor preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('secure-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Spy on localStorage methods
    vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setSecureItem', () => {
    it('should use Preferences.set on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);

      await setSecureItem('test-key', 'test-value');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'test-key', value: 'test-value' });
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should use localStorage.setItem on non-native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);

      await setSecureItem('test-key', 'test-value');

      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      expect(Preferences.set).not.toHaveBeenCalled();
    });
  });

  describe('getSecureItem', () => {
    it('should use Preferences.get on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      Preferences.get.mockResolvedValue({ value: 'native-value' });

      const result = await getSecureItem('test-key');

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'test-key' });
      expect(result).toBe('native-value');
      expect(localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should use localStorage.getItem on non-native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('web-value');

      const result = await getSecureItem('test-key');

      expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBe('web-value');
      expect(Preferences.get).not.toHaveBeenCalled();
    });
  });

  describe('removeSecureItem', () => {
    it('should use Preferences.remove on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);

      await removeSecureItem('test-key');

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'test-key' });
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should use localStorage.removeItem on non-native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);

      await removeSecureItem('test-key');

      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
      expect(Preferences.remove).not.toHaveBeenCalled();
    });
  });
});
