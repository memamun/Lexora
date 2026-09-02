import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the firebase modules BEFORE importing any source files
vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(true),
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

// Provide a default mock for @/lib/firebase
vi.mock('@/lib/firebase', () => ({
  analytics: { mockInstance: true },
  auth: {},
  isFirebaseConfigured: true,
}));

describe('trackUserLogin', () => {
  let firebaseLogEventMock;
  let trackUserLogin;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Setup for trackUserLogin from analytics
    const analyticsModule = await import('./analytics');
    trackUserLogin = analyticsModule.trackUserLogin;

    const firebaseAnalytics = await import('firebase/analytics');
    firebaseLogEventMock = firebaseAnalytics.logEvent;
  });

  describe('when analytics is configured', () => {
    it('should not call logEvent if user is falsy', () => {
      trackUserLogin(null);
      trackUserLogin(undefined);
      expect(firebaseLogEventMock).not.toHaveBeenCalled();
    });

    it('should log login event with default email method if providerData is empty or missing', () => {
      trackUserLogin({ uid: '123' });
      expect(firebaseLogEventMock).toHaveBeenCalledTimes(1);
      expect(firebaseLogEventMock).toHaveBeenCalledWith(
        expect.anything(),
        'login',
        { method: 'email' }
      );
    });

    it('should log login event with correct providerId from user.providerData', () => {
      trackUserLogin({
        uid: '123',
        providerData: [{ providerId: 'google.com' }]
      });
      expect(firebaseLogEventMock).toHaveBeenCalledTimes(1);
      expect(firebaseLogEventMock).toHaveBeenCalledWith(
        expect.anything(),
        'login',
        { method: 'google.com' }
      );
    });

    it('should silently catch errors if firebaseLogEvent throws', () => {
      firebaseLogEventMock.mockImplementation(() => {
        throw new Error('Analytics blocked by adblocker');
      });
      expect(() => {
        trackUserLogin({ uid: '123' });
      }).not.toThrow();
      expect(firebaseLogEventMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('trackUserLogin without analytics instance', () => {
  let trackUserLoginWithoutAnalytics;
  let firebaseLogEventMock;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // To test the null analytics instance case, we override the mock using vi.doMock
    // which applies only for the current context/file before importing the module.
    vi.doMock('@/lib/firebase', () => ({
      analytics: null, // Simulate uninitialized / unsupported
      auth: {},
      isFirebaseConfigured: true,
    }));

    const analyticsModule = await import('./analytics');
    trackUserLoginWithoutAnalytics = analyticsModule.trackUserLogin;

    const firebaseAnalytics = await import('firebase/analytics');
    firebaseLogEventMock = firebaseAnalytics.logEvent;
  });

  it('should not call firebaseLogEvent if analyticsInstance is falsy', () => {
    trackUserLoginWithoutAnalytics({ uid: '123' });
    expect(firebaseLogEventMock).not.toHaveBeenCalled();
  });
});
