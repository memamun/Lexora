import React, { createContext, useState, useContext, useEffect } from 'react';
import { appParams } from '@/lib/app-params';
import {
  signInWithGoogle as firebaseGoogleSignIn,
  signInWithEmail as firebaseEmailSignIn,
  signUpWithEmail as firebaseEmailSignUp,
  firebaseLogout,
  onFirebaseAuthChange,
  isFirebaseConfigured,
} from '@/lib/firebase';
import { trackUserLogin, flushQueue, initAnalytics } from '@/lib/analytics';
import { db } from '@/lib/db';

const AuthContext = createContext(null);

function firebaseUserToUser(firebaseUser) {
  if (!firebaseUser) return null;
  const provider = firebaseUser.providerData?.[0]?.providerId || 'email';
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    avatar: firebaseUser.photoURL || null,
    provider,
  };
}

function base44UserToUser(b44User) {
  if (!b44User) return null;
  return {
    id: b44User.id || b44User.uid,
    email: b44User.email,
    name: b44User.name || b44User.displayName || b44User.email?.split('@')[0] || 'User',
    avatar: b44User.avatar || b44User.photoURL || null,
    provider: b44User.provider || 'base44',
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    initAnalytics();
    const unsubscribe = onFirebaseAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUserToUser(firebaseUser));
        setIsAuthenticated(true);
        setAuthError(null);
        trackUserLogin(firebaseUser);
        flushQueue();
      } else {
        setAuthError(null);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const headers = { 'X-App-Id': appParams.appId };
      if (appParams.token) headers['Authorization'] = `Bearer ${appParams.token}`;
      const resp = await fetch(`/api/apps/public/prod/public-settings/by-id/${appParams.appId}`, { headers });

      if (!resp.ok) {
        if (isFirebaseConfigured) {
          console.warn('[Auth] Base44 public settings not available. Continuing with Firebase configuration.');
          setIsLoadingPublicSettings(false);
          return;
        }
        const contentType = resp.headers.get('content-type');
        const errData = (contentType && contentType.includes('application/json'))
          ? await resp.json().catch(() => ({ body: '' }))
          : { message: `HTTP Error ${resp.status}` };
        const reason = errData?.extra_data?.reason;
        if (reason === 'auth_required' || resp.status === 401) {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        } else if (reason === 'user_not_registered') {
          setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
        } else {
          setAuthError({ type: reason || 'unknown', message: errData?.message || 'Failed to load app' });
        }
        setIsLoadingPublicSettings(false);
        return;
      }

      const contentTypeOk = resp.headers.get('content-type')?.includes('application/json');
      const publicSettings = contentTypeOk ? await resp.json() : {};
      setAppPublicSettings(publicSettings);

      if (appParams.token && !user) {
        await checkUserAuth();
      } else if (!appParams.token && !user) {
        if (!isFirebaseConfigured) {
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);
        }
      }
      setIsLoadingPublicSettings(false);
    } catch (appError) {
      console.error('App state check failed:', appError);
      setIsLoadingPublicSettings(false);
      if (isFirebaseConfigured) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      if (db?.auth?.me) {
        const currentUser = await db.auth.me();
        setUser(base44UserToUser(currentUser));
        setIsAuthenticated(true);
      } else {
        console.warn('[Auth] db.auth.me is not available, using Firebase/localStorage auth.');
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new Error(
        'Firebase is not configured. Please set VITE_FIREBASE_API_KEY, ' +
        'VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and other ' +
        'required environment variables.'
      );
    }
    await firebaseGoogleSignIn();
  };

  const loginWithEmail = async (email, password) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured.');
    }
    await firebaseEmailSignIn(email, password);
  };

  const signUp = async (email, password, displayName) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured.');
    }
    await firebaseEmailSignUp(email, password, displayName);
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('base44_access_token');
    if (isFirebaseConfigured) {
      try {
        await firebaseLogout();
      } catch (err) {
        console.warn('[Auth] Firebase logout error:', err);
      }
    }
  };

  const navigateToLogin = () => {
    if (typeof db?.auth?.redirectToLogin === 'function') {
      db.auth.redirectToLogin(window.location.href);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings,
      authError, appPublicSettings, authChecked, logout, navigateToLogin,
      loginWithGoogle, loginWithEmail, signUp,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};