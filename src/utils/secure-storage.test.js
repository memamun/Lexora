import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { setSecureItem, getSecureItem, removeSecureItem } from './secure-storage';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

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

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  describe('setSecureItem', () => {
    it('should use Preferences on native platforms', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      await setSecureItem('testKey', 'testValue');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'testKey', value: 'testValue' });
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should use localStorage on web platforms', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      await setSecureItem('testKey', 'testValue');

      expect(window.localStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
      expect(Preferences.set).not.toHaveBeenCalled();
    });
  });

  describe('getSecureItem', () => {
    it('should use Preferences on native platforms', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      Preferences.get.mockResolvedValue({ value: 'nativeValue' });

      const result = await getSecureItem('testKey');

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'testKey' });
      expect(result).toBe('nativeValue');
      expect(window.localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should use localStorage on web platforms', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      window.localStorage.getItem.mockReturnValue('webValue');

      const result = await getSecureItem('testKey');

      expect(window.localStorage.getItem).toHaveBeenCalledWith('testKey');
      expect(result).toBe('webValue');
      expect(Preferences.get).not.toHaveBeenCalled();
    });
  });

  describe('removeSecureItem', () => {
    it('should use Preferences on native platforms', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      await removeSecureItem('testKey');

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'testKey' });
      expect(window.localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should use localStorage on web platforms', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      await removeSecureItem('testKey');

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('testKey');
      expect(Preferences.remove).not.toHaveBeenCalled();
    });
  });
});
