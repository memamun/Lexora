import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { appParams } from '@/lib/app-params';
import {
  signInWithGoogle as firebaseGoogleSignIn,
  signInWithEmail as firebaseEmailSignIn,
  signUpWithEmail as firebaseEmailSignUp,
  firebaseLogout,
  onFirebaseAuthChange,
  isFirebaseConfigured,
  analytics as analyticsInstance,
} from '@/lib/firebase';
import { setUserId } from 'firebase/analytics';
import { trackUserLogin, initAnalytics, destroyAnalytics } from '@/lib/analytics';
import { clearStudyEngineCache } from '@/lib/useStudyEngine';
import { db, cancelPendingAuth } from '@/lib/db';

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
  const loggedOutRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await checkAppState(cancelled);
    };
    run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    initAnalytics();
    const unsubscribe = onFirebaseAuthChange((firebaseUser) => {
      if (loggedOutRef.current) return;
      if (firebaseUser) {
        const baseUser = firebaseUserToUser(firebaseUser);
        setUser(baseUser);
        setIsAuthenticated(true);
        setAuthError(null);
        trackUserLogin(firebaseUser);

        // Set user ID on Analytics for crash reports (Crashlytics auto-detects from Auth)
        try {
          if (analyticsInstance) setUserId(analyticsInstance, firebaseUser.uid);
        } catch {}

        // Sync user profile and retrieve role asynchronously
        (async () => {
          try {
            const { getApp } = await import('firebase/app');
            const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const fsDb = getFirestore(getApp());
            const userDocRef = doc(fsDb, 'users', firebaseUser.uid);

            const devEmails = [
              'ammamun595@yahoo.com', 
              'a.a.mamun595@gmail.com', 
              'flashiamamun@gmail.com', 
              'mamunabdullah5220@gmail.com',
              'testuser@example.com',
              'test2@example.com',
              'testuser2@example.com'
            ];
            const isDev = devEmails.includes(firebaseUser.email?.toLowerCase());

            let role = 'user';
            const userDocSnap = await getDoc(userDocRef);

            const profileData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || null,
              provider: firebaseUser.providerData?.[0]?.providerId || 'email',
              lastLoginAt: serverTimestamp(),
            };

            if (isDev) {
              role = 'admin';
            } else if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              role = data.role || 'user';
            }

            profileData.role = role;

            // Fetch and sync user stats for the leaderboard
            try {
              const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
              const statsColRef = collection(fsDb, 'users', firebaseUser.uid, 'UserStats');
              const statsQuery = query(statsColRef, orderBy('updated_date', 'desc'), limit(1));
              const statsSnap = await getDocs(statsQuery);
              if (!statsSnap.empty) {
                const statsData = statsSnap.docs[0].data();
                profileData.current_streak_days = Number(statsData.current_streak_days || 0);
                profileData.longest_streak_days = Number(statsData.longest_streak_days || 0);
                if (statsData.updated_date) {
                  profileData.updated_date = statsData.updated_date;
                }
              }
            } catch (statsErr) {
              console.warn('[Auth] Failed to sync user stats to profile:', statsErr.message);
            }

            if (userDocSnap.exists()) {
              await setDoc(userDocRef, profileData, { merge: true });
            } else {
              profileData.createdAt = serverTimestamp();
              await setDoc(userDocRef, profileData);
            }

            // Update user state with the fetched role
            setUser(prevUser => prevUser ? { ...prevUser, role } : null);
          } catch (err) {
            console.warn('[Auth] Failed to sync user profile and fetch role:', err.message);
          }
        })();
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        clearStudyEngineCache();
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });
    return () => {
      unsubscribe();
      destroyAnalytics();
    };
  }, []);

  const checkAppState = async (cancelled) => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Read secure token on native platform, falling back to appParams
      const { getSecureItem } = await import('@/utils/secure-storage');
      const secureToken = await getSecureItem('base44_access_token');
      const token = secureToken || appParams.token;

      const headers = { 'X-App-Id': appParams.appId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch(`/api/apps/public/prod/public-settings/by-id/${appParams.appId}`, { headers });

      if (cancelled) return;

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

      if (cancelled) return;

      if (token && !user && !loggedOutRef.current) {
        // Only use Base44 auth as fallback when Firebase is not configured
        if (!isFirebaseConfigured) {
          await checkUserAuth(cancelled);
        }
      } else if (!token && !user) {
        if (!isFirebaseConfigured) {
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);
        }
      }
      setIsLoadingPublicSettings(false);
    } catch (appError) {
      if (cancelled) return;
      console.error('App state check failed:', appError);
      setIsLoadingPublicSettings(false);
      if (isFirebaseConfigured) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }
  };

  const checkUserAuth = async (cancelled) => {
    try {
      setIsLoadingAuth(true);
      if (db?.auth?.me) {
        const currentUser = await db.auth.me();
        if (cancelled || loggedOutRef.current) return;
        setUser(base44UserToUser(currentUser));
        setIsAuthenticated(true);
      } else {
        console.warn('[Auth] db.auth.me is not available, using Firebase/localStorage auth.');
      }
    } catch (error) {
      if (cancelled || loggedOutRef.current) return;
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } finally {
      if (!cancelled && !loggedOutRef.current) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
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
    loggedOutRef.current = true;
    cancelPendingAuth(); // Cancel any pending auth wait
    clearStudyEngineCache();

    try {
      const { removeSecureItem } = await import('@/utils/secure-storage');
      await removeSecureItem('base44_access_token');
    } catch (err) {
      console.warn('[Auth] Failed to securely clear access token:', err);
    }

    if (isFirebaseConfigured) {
      try {
        await firebaseLogout();
      } catch (err) {
        console.warn('[Auth] Firebase logout error:', err);
      }
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    if (typeof db?.auth?.redirectToLogin === 'function') {
      const returnUrl = window.location.pathname + window.location.search + window.location.hash;
      db.auth.redirectToLogin(returnUrl);
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