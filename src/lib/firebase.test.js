import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signOut } from 'firebase/auth';

// We need to set up the environment variables before importing firebase
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(false),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(),
}));

vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Capacitor: {
      isNativePlatform: vi.fn().mockReturnValue(false),
    },
    registerPlugin: vi.fn(),
  };
});

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    initialize: vi.fn(),
    signIn: vi.fn(),
  },
}));

vi.mock('firebase/auth', () => {
  class MockGoogleAuthProvider {
    addScope = vi.fn();
  }
  MockGoogleAuthProvider.credential = vi.fn();

  return {
    getAuth: vi.fn().mockReturnValue({ id: 'mock-auth' }),
    GoogleAuthProvider: MockGoogleAuthProvider,
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithCredential: vi.fn(),
  };
});

// Import dynamically to ensure mocks and env vars are set up before the module runs
describe('firebaseLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call signOut with the auth instance', async () => {
    const { firebaseLogout, auth } = await import('./firebase.js?test=1');
    await firebaseLogout();
    expect(signOut).toHaveBeenCalledWith(auth);
  });

  it('should not call signOut if auth is null', async () => {
    // Reset modules to clear previous instance
    vi.resetModules();

    // Clear env vars to make auth null
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');

    const { firebaseLogout, auth } = await import('./firebase.js?test=2');
    await firebaseLogout();
    expect(auth).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });
});
