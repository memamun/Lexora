import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setSecureItem, getSecureItem, removeSecureItem } from './secure-storage';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  }
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  }
}));

describe('secure-storage', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('setSecureItem', () => {
    it('uses Preferences.set on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      await setSecureItem('myKey', 'myValue');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'myKey', value: 'myValue' });
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('uses localStorage.setItem on non-native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      await setSecureItem('myKey', 'myValue');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('myKey', 'myValue');
      expect(Preferences.set).not.toHaveBeenCalled();
    });
  });

  describe('getSecureItem', () => {
    it('uses Preferences.get on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      Preferences.get.mockResolvedValue({ value: 'nativeValue' });

      const result = await getSecureItem('myKey');

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'myKey' });
      expect(result).toBe('nativeValue');
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });

    it('uses localStorage.getItem on non-native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      localStorageMock.getItem.mockReturnValue('webValue');

      const result = await getSecureItem('myKey');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('myKey');
      expect(result).toBe('webValue');
      expect(Preferences.get).not.toHaveBeenCalled();
    });
  });

  describe('removeSecureItem', () => {
    it('uses Preferences.remove on native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(true);
      await removeSecureItem('myKey');

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'myKey' });
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('uses localStorage.removeItem on non-native platform', async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      await removeSecureItem('myKey');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('myKey');
      expect(Preferences.remove).not.toHaveBeenCalled();
    });
  });
});
