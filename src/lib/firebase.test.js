import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signOut } from 'firebase/auth';

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

  it('should throw an error during initialization when required config is missing', async () => {
    // Override environment so auth initialization fails
    process.env.VITE_FIREBASE_API_KEY = '';
    process.env.VITE_FIREBASE_PROJECT_ID = '';

    // Importing the module should throw due to fail-secure behavior
    await expect(import('./firebase')).rejects.toThrow('[Firebase] Missing required config');

    // Verify signOut was not called since initialization failed
    expect(signOut).not.toHaveBeenCalled();
  });
});
