import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
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

vi.mock('firebase/auth', () => {
  const MockGoogleAuthProvider = class {
    addScope() {}
    static credential() { return {}; }
  };

  return {
    getAuth: vi.fn(() => ({ name: 'test-auth' })),
    GoogleAuthProvider: MockGoogleAuthProvider,
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithCredential: vi.fn(),
  };
});

describe('signInWithEmail', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should call signInWithEmailAndPassword and return the user', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '123', email: 'test@test.com' } });

    const { signInWithEmail } = await import('./firebase.js');

    const result = await signInWithEmail('test@test.com', 'password123');

    expect(signInWithEmailAndPassword).toHaveBeenCalled();
    expect(result).toEqual({ uid: '123', email: 'test@test.com' });
  });

  it('should throw an error if firebase is not configured', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');

    const { signInWithEmail } = await import('./firebase.js');
    await expect(signInWithEmail('test@test.com', 'password123')).rejects.toThrow('Firebase is not configured.');
  });

  it('should throw "Network error. Please check your connection and try again." on network error', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/network-request-failed' });

    const { signInWithEmail } = await import('./firebase.js');

    await expect(signInWithEmail('test@test.com', 'password123')).rejects.toThrow('Network error. Please check your connection and try again.');
  });

  it('should throw other errors directly', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    signInWithEmailAndPassword.mockRejectedValue(new Error('Other error'));

    const { signInWithEmail } = await import('./firebase.js');

    await expect(signInWithEmail('test@test.com', 'password123')).rejects.toThrow('Other error');
  });
});
