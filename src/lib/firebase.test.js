import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class {
    addScope() {}
    static credential() {}
  },
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithCredential: vi.fn(),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: { initialize: vi.fn() },
}));

import { signUpWithEmail } from './firebase.js';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

describe('signUpWithEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates user and updates profile when displayName is provided', async () => {
    const mockUser = { uid: 'user123' };
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
    updateProfile.mockResolvedValueOnce();

    const result = await signUpWithEmail('test@example.com', 'password123', 'John Doe');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
    expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'John Doe' });
    expect(result).toBe(mockUser);
  });

  it('creates user but does not update profile when displayName is missing', async () => {
    const mockUser = { uid: 'user123' };
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

    const result = await signUpWithEmail('test@example.com', 'password123');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
    expect(updateProfile).not.toHaveBeenCalled();
    expect(result).toBe(mockUser);
  });

  it('throws custom error for network failures', async () => {
    const networkError = new Error('Firebase: Network Error (auth/network-request-failed).');
    networkError.code = 'auth/network-request-failed';
    createUserWithEmailAndPassword.mockRejectedValueOnce(networkError);

    await expect(signUpWithEmail('test@example.com', 'password123')).rejects.toThrow(
      'Network error. Please check your connection and try again.'
    );
  });

  it('throws original error for other failures', async () => {
    const otherError = new Error('Email already in use');
    otherError.code = 'auth/email-already-in-use';
    createUserWithEmailAndPassword.mockRejectedValueOnce(otherError);

    await expect(signUpWithEmail('test@example.com', 'password123')).rejects.toThrow(
      'Email already in use'
    );
  });
});
