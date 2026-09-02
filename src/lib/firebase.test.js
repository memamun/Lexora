import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';

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
    signInWithEmailAndPassword: vi.fn(),
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

describe('firebase.js - signInWithEmail', () => {
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

  it('should throw error if auth is not initialized', async () => {
    process.env.VITE_FIREBASE_API_KEY = '';
    process.env.VITE_FIREBASE_PROJECT_ID = '';

    const { signInWithEmail } = await import('./firebase');

    await expect(signInWithEmail('test@example.com', 'password123'))
      .rejects
      .toThrow('Firebase is not configured.');
  });

  it('should return user on successful sign in', async () => {
    const { signInWithEmail } = await import('./firebase');
    const mockUser = { uid: '123' };
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

    const result = await signInWithEmail('test@example.com', 'password123');

    expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('should throw network error when error code is auth/network-request-failed', async () => {
    const { signInWithEmail } = await import('./firebase');
    const networkError = new Error('Network request failed');
    networkError.code = 'auth/network-request-failed';
    signInWithEmailAndPassword.mockRejectedValueOnce(networkError);

    await expect(signInWithEmail('test@example.com', 'password123'))
      .rejects
      .toThrow('Network error. Please check your connection and try again.');
  });

  it('should throw original error for other error codes', async () => {
    const { signInWithEmail } = await import('./firebase');
    const authError = new Error('Invalid email');
    authError.code = 'auth/invalid-email';
    signInWithEmailAndPassword.mockRejectedValueOnce(authError);

    await expect(signInWithEmail('test@example.com', 'password123'))
      .rejects
      .toThrow(authError);
  });
});
