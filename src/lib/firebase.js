import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  signInWithCredential,
} from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let googleProvider = null;
let analytics = null;
let performance = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');

    // Initialize Analytics (async — silently fails if unsupported)
    isAnalyticsSupported().then(supported => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {});

    // Initialize Performance Monitoring
    try {
      performance = getPerformance(app);
    } catch {
      // Performance monitoring not supported in this environment
    }

    // Explicitly initialize Capacitor GoogleAuth plugin on native platforms
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  } else {
    throw new Error('[Firebase] Missing required config (apiKey or projectId).');
  }
} catch (err) {
  console.error('[Firebase] Failed to initialize:', err.message);
  throw err;
}

export { auth, googleProvider, analytics, performance };
export const isFirebaseConfigured = !!app;

export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_* environment variables.');
  }
  try {
    if (Capacitor.isNativePlatform()) {
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const result = await signInWithCredential(auth, credential);
      // signInWithCredential doesn't set photoURL/displayName from ID token — set them manually
      const updates = {};
      if (!result.user.photoURL && googleUser.photoUrl) updates.photoURL = googleUser.photoUrl;
      if (!result.user.displayName && googleUser.name) updates.displayName = googleUser.name;
      if (Object.keys(updates).length > 0) {
        await updateProfile(result.user, updates);
        Object.assign(result.user, updates);
      }
      return result.user;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = result.additionalUserInfo?.profile;
      // Ensure photoURL and displayName are set from Google provider result
      const updates = {};
      if (!result.user.photoURL) {
        const photo = profile?.picture || profile?.photoURL || null;
        if (photo) updates.photoURL = photo;
      }
      if (!result.user.displayName) {
        const name = profile?.name || profile?.given_name || null;
        if (name) updates.displayName = name;
      }
      if (Object.keys(updates).length > 0) {
        await updateProfile(result.user, updates);
        Object.assign(result.user, updates);
      }
      return result.user;
    }
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled.');
    }
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw err;
  }
};

export const signInWithEmail = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (err) {
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw err;
  }
};

export const signUpWithEmail = async (email, password, displayName) => {
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (err) {
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw err;
  }
};

export const firebaseLogout = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export const onFirebaseAuthChange = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
