import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    localStorage.clear();
  });

  describe('setSecureItem', () => {
    it('uses Preferences on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      await setSecureItem('test_key', 'test_value');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'test_key', value: 'test_value' });
      expect(localStorage.getItem('test_key')).toBeNull();
    });

    it('uses localStorage on web platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      await setSecureItem('test_key', 'test_value');

      expect(Preferences.set).not.toHaveBeenCalled();
      expect(localStorage.getItem('test_key')).toBe('test_value');
    });
  });

  describe('getSecureItem', () => {
    it('uses Preferences on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      Preferences.get.mockResolvedValue({ value: 'native_value' });

      const result = await getSecureItem('test_key');

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'test_key' });
      expect(result).toBe('native_value');
    });

    it('uses localStorage on web platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      localStorage.setItem('test_key', 'web_value');

      const result = await getSecureItem('test_key');

      expect(Preferences.get).not.toHaveBeenCalled();
      expect(result).toBe('web_value');
    });
  });

  describe('removeSecureItem', () => {
    it('uses Preferences on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      await removeSecureItem('test_key');

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'test_key' });
    });

    it('uses localStorage on web platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      localStorage.setItem('test_key', 'web_value');

      await removeSecureItem('test_key');

      expect(Preferences.remove).not.toHaveBeenCalled();
      expect(localStorage.getItem('test_key')).toBeNull();
    });
  });
});
