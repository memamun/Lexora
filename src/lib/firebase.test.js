import { describe, it, expect, vi, beforeEach } from 'vitest';

// Provide access to the mock inside the test using hoisting
vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({ type: 'mock-auth' })),
    GoogleAuthProvider: class {
      constructor() {
        this.addScope = vi.fn();
      }
    },
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithCredential: vi.fn(),
  };
});

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(),
}));

vi.mock('@firebase/crashlytics', () => ({
  getCrashlytics: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    initialize: vi.fn(),
    signIn: vi.fn(),
  },
}));

// Now import the module to test and its mocked dependencies
import { signInWithEmailAndPassword } from 'firebase/auth';
import { signInWithEmail } from './firebase';

describe('firebase auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('throws network error with specific message when network request fails', async () => {
      const mockError = new Error('Firebase network error');
      mockError.code = 'auth/network-request-failed';
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(mockError);

      await expect(signInWithEmail('test@example.com', 'password')).rejects.toThrow(
        'Network error. Please check your connection and try again.'
      );
    });

    it('throws original error when error is not network-related', async () => {
      const mockError = new Error('Wrong password');
      mockError.code = 'auth/wrong-password';
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(mockError);

      await expect(signInWithEmail('test@example.com', 'password')).rejects.toThrow('Wrong password');
    });
  });
});
