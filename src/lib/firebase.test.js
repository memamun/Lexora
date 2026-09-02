import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { signInWithPopup, updateProfile, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

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

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn().mockImplementation(function() {
    this.addScope = vi.fn();
  }),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithCredential: vi.fn(),
}));

// We need to access a static property on GoogleAuthProvider too
GoogleAuthProvider.credential = vi.fn();

describe('firebase.js signInWithGoogle', () => {
  let firebase;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

    firebase = await import('./firebase.js');
  });

  describe('Web environment', () => {
    beforeEach(() => {
      Capacitor.isNativePlatform.mockReturnValue(false);
    });

    it('should sign in with google and update profile if picture/name are in additionalUserInfo', async () => {
      const mockUser = {
        uid: 'user123',
        photoURL: null,
        displayName: null,
      };

      signInWithPopup.mockResolvedValue({
        user: mockUser,
        additionalUserInfo: {
          profile: {
            picture: 'https://photo.url',
            name: 'Test User',
          }
        }
      });

      const user = await firebase.signInWithGoogle();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        photoURL: 'https://photo.url',
        displayName: 'Test User',
      });
      expect(user.photoURL).toBe('https://photo.url');
      expect(user.displayName).toBe('Test User');
    });

    it('should use photoURL and given_name from additionalUserInfo if picture/name missing', async () => {
      const mockUser = {
        uid: 'user123',
        photoURL: null,
        displayName: null,
      };

      signInWithPopup.mockResolvedValue({
        user: mockUser,
        additionalUserInfo: {
          profile: {
            photoURL: 'https://photo2.url',
            given_name: 'Test Given Name',
          }
        }
      });

      const user = await firebase.signInWithGoogle();

      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        photoURL: 'https://photo2.url',
        displayName: 'Test Given Name',
      });
    });

    it('should not update profile if user already has photoURL and displayName', async () => {
      const mockUser = {
        uid: 'user123',
        photoURL: 'existing.url',
        displayName: 'Existing Name',
      };

      signInWithPopup.mockResolvedValue({
        user: mockUser,
        additionalUserInfo: {
          profile: {
            picture: 'https://photo.url',
            name: 'Test User',
          }
        }
      });

      const user = await firebase.signInWithGoogle();

      expect(updateProfile).not.toHaveBeenCalled();
      expect(user.photoURL).toBe('existing.url');
      expect(user.displayName).toBe('Existing Name');
    });

    it('should handle auth/popup-closed-by-user error appropriately', async () => {
      const error = new Error('popup closed');
      error.code = 'auth/popup-closed-by-user';
      signInWithPopup.mockRejectedValue(error);

      await expect(firebase.signInWithGoogle()).rejects.toThrow('Sign-in was cancelled.');
    });

    it('should handle auth/network-request-failed error appropriately', async () => {
      const error = new Error('network failed');
      error.code = 'auth/network-request-failed';
      signInWithPopup.mockRejectedValue(error);

      await expect(firebase.signInWithGoogle()).rejects.toThrow('Network error. Please check your connection and try again.');
    });

    it('should throw original error for other errors', async () => {
      const error = new Error('Unknown error');
      signInWithPopup.mockRejectedValue(error);

      await expect(firebase.signInWithGoogle()).rejects.toThrow('Unknown error');
    });
  });

  describe('Native (Capacitor) environment', () => {
    beforeEach(() => {
      Capacitor.isNativePlatform.mockReturnValue(true);
    });

    it('should use GoogleAuth plugin and signInWithCredential', async () => {
      GoogleAuth.signIn.mockResolvedValue({
        authentication: {
          idToken: 'mock-id-token'
        },
        photoUrl: 'https://native.photo',
        name: 'Native User'
      });

      GoogleAuthProvider.credential.mockReturnValue('mock-credential');

      const mockUser = {
        uid: 'native123',
        photoURL: null,
        displayName: null
      };

      signInWithCredential.mockResolvedValue({ user: mockUser });

      const user = await firebase.signInWithGoogle();

      expect(GoogleAuth.signIn).toHaveBeenCalled();
      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith('mock-id-token');
      expect(signInWithCredential).toHaveBeenCalledWith(expect.anything(), 'mock-credential');

      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        photoURL: 'https://native.photo',
        displayName: 'Native User'
      });

      expect(user.photoURL).toBe('https://native.photo');
      expect(user.displayName).toBe('Native User');
    });
  });

  describe('Not configured', () => {
    it('should throw error if Firebase is not configured', async () => {
      vi.resetModules();
      vi.unstubAllEnvs(); // No env variables = no initialization

      firebase = await import('./firebase.js');

      await expect(firebase.signInWithGoogle()).rejects.toThrow('Firebase is not configured');
    });
  });
});
