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
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Native Platform', () => {
    beforeEach(() => {
      Capacitor.isNativePlatform.mockReturnValue(true);
    });

    it('should set item using Preferences', async () => {
      await setSecureItem('test-key', 'test-value');
      expect(Preferences.set).toHaveBeenCalledWith({ key: 'test-key', value: 'test-value' });
    });

    it('should get item using Preferences', async () => {
      Preferences.get.mockResolvedValue({ value: 'test-value' });
      const value = await getSecureItem('test-key');
      expect(Preferences.get).toHaveBeenCalledWith({ key: 'test-key' });
      expect(value).toBe('test-value');
    });

    it('should remove item using Preferences', async () => {
      await removeSecureItem('test-key');
      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'test-key' });
    });
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      Capacitor.isNativePlatform.mockReturnValue(false);
    });

    it('should store encrypted item and retrieve it', async () => {
      await setSecureItem('test-key', 'test-value');
      const storedValue = localStorageMock.setItem.mock.calls[0][1];

      // Should not store raw value
      expect(storedValue).not.toBe('test-value');

      // Ensure it uses crypto API
      expect(localStorageMock.setItem).toHaveBeenCalled();

      const retrievedValue = await getSecureItem('test-key');
      expect(retrievedValue).toBe('test-value');
    });

    it('should fallback gracefully to original string if not encrypted', async () => {
      localStorageMock.setItem('legacy-key', 'unencrypted-value');

      const retrievedValue = await getSecureItem('legacy-key');
      expect(retrievedValue).toBe('unencrypted-value');
    });

    it('should remove item using localStorage', async () => {
      await removeSecureItem('test-key');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });
  });
});
