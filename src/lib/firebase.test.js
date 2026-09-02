import { describe, it, expect, vi, beforeEach } from 'vitest';

// Provide mock environment variables before importing firebase.js
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');
vi.stubEnv('VITE_GOOGLE_WEB_CLIENT_ID', 'test-client-id');

import { Capacitor } from '@capacitor/core';
import { signInWithPopup } from 'firebase/auth';
import { signInWithGoogle } from './firebase';

// Mock dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class {
    addScope() {}
    static credential() { return {}; }
  },
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithCredential: vi.fn(),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(true),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    initialize: vi.fn(),
    signIn: vi.fn(),
  },
}));

describe('firebase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Capacitor.isNativePlatform.mockReturnValue(false);
  });

  describe('signInWithGoogle', () => {
    it('throws "Sign-in was cancelled." when error code is auth/popup-closed-by-user', async () => {
      const mockError = new Error('Popup closed');
      mockError.code = 'auth/popup-closed-by-user';
      signInWithPopup.mockRejectedValue(mockError);

      await expect(signInWithGoogle()).rejects.toThrow('Sign-in was cancelled.');
    });

    it('throws "Network error. Please check your connection and try again." when error code is auth/network-request-failed', async () => {
      const mockError = new Error('Network failed');
      mockError.code = 'auth/network-request-failed';
      signInWithPopup.mockRejectedValue(mockError);

      await expect(signInWithGoogle()).rejects.toThrow('Network error. Please check your connection and try again.');
    });

    it('throws original error for other codes', async () => {
      const mockError = new Error('Some other error');
      mockError.code = 'auth/some-other-error';
      signInWithPopup.mockRejectedValue(mockError);

      await expect(signInWithGoogle()).rejects.toThrow('Some other error');
    });
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

  it('should gracefully handle initialization error and log to console.error', async () => {
    const { initializeApp } = await import('firebase/app');

    // Mock initializeApp to throw an error
    const testError = new Error('Test initialization error');
    initializeApp.mockImplementationOnce(() => {
      throw testError;
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { auth } = await import('./firebase');

    // Auth should be null because initialization failed
    expect(auth).toBeNull();

    // console.error should be called with the expected format
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[Firebase] Init error:', testError);

    consoleErrorSpy.mockRestore();
  });
});
