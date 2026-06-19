import React, { useEffect } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { vi } from 'vitest';
import * as firebaseMod from '@/lib/firebase';
import { getSecureItem, removeSecureItem } from '@/utils/secure-storage';

// Mock fetch to avoid Invalid URL
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve({ settings: true }),
  })
);

// Mock app params
vi.mock('@/lib/app-params', () => ({
  appParams: {
    appId: 'test-app',
    token: 'test-token',
  },
}));

// Mock secure storage
vi.mock('@/utils/secure-storage', () => ({
  getSecureItem: vi.fn().mockResolvedValue(null),
  removeSecureItem: vi.fn().mockResolvedValue(null),
}));

// Mock firebase functions
vi.mock('@/lib/firebase', () => ({
  signInWithGoogle: vi.fn().mockResolvedValue({}),
  signInWithEmail: vi.fn().mockResolvedValue({}),
  signUpWithEmail: vi.fn().mockResolvedValue({}),
  firebaseLogout: vi.fn().mockResolvedValue(),
  onFirebaseAuthChange: vi.fn().mockImplementation((cb) => {
    // We'll manually call this callback in tests
    return vi.fn(); // Unsubscribe mock
  }),
  get isFirebaseConfigured() { return global.__isFirebaseConfigured !== false; },
  analytics: {},
}));

// Mock firebase analytics
vi.mock('firebase/analytics', () => ({
  setUserId: vi.fn(),
}));

// Mock analytics tracker
vi.mock('@/lib/analytics', () => ({
  trackUserLogin: vi.fn(),
  initAnalytics: vi.fn(),
  destroyAnalytics: vi.fn(),
}));

// Mock useStudyEngine
vi.mock('@/lib/useStudyEngine', () => ({
  clearStudyEngineCache: vi.fn(),
}));

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    auth: {
      me: vi.fn(),
      redirectToLogin: vi.fn(),
    },
  },
  cancelPendingAuth: vi.fn(),
}));

const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-user">{auth.user ? JSON.stringify(auth.user) : 'null'}</div>
      <div data-testid="auth-isAuthenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="auth-isLoadingAuth">{String(auth.isLoadingAuth)}</div>
      <div data-testid="auth-isLoadingPublicSettings">{String(auth.isLoadingPublicSettings)}</div>
      <div data-testid="auth-authError">{auth.authError ? JSON.stringify(auth.authError) : 'null'}</div>
      <div data-testid="auth-authChecked">{String(auth.authChecked)}</div>
      <div data-testid="auth-appPublicSettings">{auth.appPublicSettings ? JSON.stringify(auth.appPublicSettings) : 'null'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Default State', () => {
    it('provides expected default values on mount', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-user').textContent).toBe('null');
      expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('false');
      // Initially isLoadingAuth should be true
      expect(screen.getByTestId('auth-isLoadingAuth').textContent).toBe('true');
      expect(screen.getByTestId('auth-authError').textContent).toBe('null');
    });

    it('throws error when useAuth is used outside of AuthProvider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');

      consoleErrorSpy.mockRestore();
    });
});

  describe('Firebase Auth State Changes', () => {
    it('updates user and isAuthenticated when firebase user logs in', async () => {
      let authCallback = null;
      firebaseMod.onFirebaseAuthChange.mockImplementation((cb) => {
        authCallback = cb;
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate a user logging in
      act(() => {
        authCallback({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          providerData: [{ providerId: 'google.com' }]
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('true');
      });

      const user = JSON.parse(screen.getByTestId('auth-user').textContent);
      expect(user.id).toBe('test-uid');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.provider).toBe('google.com');
      expect(screen.getByTestId('auth-isLoadingAuth').textContent).toBe('false');
    });

    it('clears user when firebase user logs out', async () => {
      let authCallback = null;
      firebaseMod.onFirebaseAuthChange.mockImplementation((cb) => {
        authCallback = cb;
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate a user logging out
      act(() => {
        authCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('false');
        expect(screen.getByTestId('auth-user').textContent).toBe('null');
        expect(screen.getByTestId('auth-isLoadingAuth').textContent).toBe('false');
      });
    });
  });

  describe('Actions', () => {
    it('logout calls expected functions', async () => {
      let result = {};
      const ActionTest = () => {
        const auth = useAuth();
        result = auth;
        return null;
      };

      render(
        <AuthProvider>
          <ActionTest />
        </AuthProvider>
      );

      await act(async () => {
        await result.logout();
      });

      await waitFor(() => {
        expect(firebaseMod.firebaseLogout).toHaveBeenCalled();

      });
    });

    it('auth functions throw error if Firebase is not configured', async () => {
      // Temporarily mock isFirebaseConfigured to false
      global.__isFirebaseConfigured = false;

      let result = {};
      const ActionTest = () => {
        const auth = useAuth();
        result = auth;
        return null;
      };

      render(
        <AuthProvider>
          <ActionTest />
        </AuthProvider>
      );

      await act(async () => {
        await expect(result.loginWithGoogle()).rejects.toThrow('Firebase is not configured');
      });
      await act(async () => {
        await expect(result.loginWithEmail('test', 'test')).rejects.toThrow('Firebase is not configured');
      });
      await act(async () => {
        await expect(result.signUp('test', 'test', 'test')).rejects.toThrow('Firebase is not configured');
      });

      // Reset mock
      global.__isFirebaseConfigured = true;
    });
  });
  });
