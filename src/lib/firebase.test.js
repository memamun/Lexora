import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signOut } from 'firebase/auth';
import { getPerformance } from 'firebase/performance';

// Mock dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    initialize: vi.fn(),
  },
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({})),
    GoogleAuthProvider: class {
      addScope = vi.fn();
    },
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
  };
});

describe('firebase.js - firebaseLogout', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      VITE_FIREBASE_API_KEY: 'test-key',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnv;
  });

  it('should call signOut with the auth instance when auth is initialized', async () => {
    // Import module inside test so environment vars are read
    const { firebaseLogout, auth } = await import('./firebase');

    // Auth should be truthy because we provided VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID
    expect(auth).toBeTruthy();

    await firebaseLogout();

    // Verify signOut was called with the auth object
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith(auth);
  });

  it('should not call signOut when auth is null', async () => {
    // Override environment so auth initialization fails
    process.env.VITE_FIREBASE_API_KEY = '';
    process.env.VITE_FIREBASE_PROJECT_ID = '';

    const { firebaseLogout, auth } = await import('./firebase');

    // Without API key, initialization falls back and auth remains null
    expect(auth).toBeNull();

    await firebaseLogout();

    // Verify signOut was not called since auth is null
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('firebase.js - initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      VITE_FIREBASE_API_KEY: 'test-key',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnv;
  });

  it('should not crash if getPerformance throws an error', async () => {
    // Mock getPerformance to throw an error
    vi.mocked(getPerformance).mockImplementationOnce(() => {
      throw new Error('Performance monitoring not supported');
    });

    // Import module inside test so environment vars are read and initialization runs
    const { auth, performance, isFirebaseConfigured } = await import('./firebase');

    // Assert that the initialization completes successfully
    expect(isFirebaseConfigured).toBe(true);
    expect(auth).toBeTruthy();
    expect(performance).toBeNull();
  });
});
