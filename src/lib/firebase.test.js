import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn().mockReturnValue({}),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(true),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(),
}));

const mockSignInWithPopup = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockUpdateProfile = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockSignInWithCredential = vi.fn();

// We need GoogleAuthProvider to be a class that has addScope, and static properties
class MockGoogleAuthProvider {
  constructor() {
    this.scopes = [];
  }
  addScope(scope) {
    this.scopes.push(scope);
  }
  static credential(idToken) {
    return { idToken };
  }
}

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn().mockReturnValue({}),
  GoogleAuthProvider: MockGoogleAuthProvider,
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  signInWithEmailAndPassword: (...args) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args) => mockCreateUserWithEmailAndPassword(...args),
  updateProfile: (...args) => mockUpdateProfile(...args),
  signOut: (...args) => mockSignOut(...args),
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  signInWithCredential: (...args) => mockSignInWithCredential(...args),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(false),
  },
}));

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    initialize: vi.fn(),
    signIn: vi.fn(),
  },
}));

// Provide env vars needed for initialization
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');

describe('firebase auth functions', () => {
  let signInWithGoogle;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Dynamically import module so that the mocks and stubbed env vars are applied
    const module = await import('./firebase.js');
    signInWithGoogle = module.signInWithGoogle;
  });

  describe('signInWithGoogle', () => {
    it('should throw "Sign-in was cancelled." when error is auth/popup-closed-by-user', async () => {
      mockSignInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });

      await expect(signInWithGoogle()).rejects.toThrow('Sign-in was cancelled.');
    });

    it('should throw "Network error..." when error is auth/network-request-failed', async () => {
      mockSignInWithPopup.mockRejectedValue({ code: 'auth/network-request-failed' });

      await expect(signInWithGoogle()).rejects.toThrow('Network error. Please check your connection and try again.');
    });

    it('should throw original error for other error codes', async () => {
      const genericError = new Error('Some other error');
      genericError.code = 'auth/some-other-error';
      mockSignInWithPopup.mockRejectedValue(genericError);

      await expect(signInWithGoogle()).rejects.toThrow('Some other error');
    });

    it('should successfully sign in and update profile if necessary', async () => {
      const mockUser = {
        photoURL: null,
        displayName: null,
      };
      mockSignInWithPopup.mockResolvedValue({
        user: mockUser,
        additionalUserInfo: {
          profile: {
            picture: 'https://example.com/photo.jpg',
            name: 'Test User',
          },
        },
      });

      const user = await signInWithGoogle();

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
        photoURL: 'https://example.com/photo.jpg',
        displayName: 'Test User',
      });
      expect(user.photoURL).toBe('https://example.com/photo.jpg');
      expect(user.displayName).toBe('Test User');
    });
  });
});
