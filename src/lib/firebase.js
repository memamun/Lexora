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
import { getCrashlytics } from '@firebase/crashlytics';
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
let crashlytics = null;
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

    // Initialize Crashlytics
    crashlytics = getCrashlytics(app);

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
    console.warn('[Firebase] Missing required config (apiKey or projectId). Running in offline-only mode.');
  }
} catch (err) {
  console.error('[Firebase] Failed to initialize:', err.message);
}

export { auth, googleProvider, analytics, crashlytics, performance };
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
      // signInWithCredential doesn't set photoURL from ID token — set it manually
      if (!result.user.photoURL && googleUser.photoUrl) {
        await updateProfile(result.user, { photoURL: googleUser.photoUrl });
        result.user.photoURL = googleUser.photoUrl;
      }
      return result.user;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      // Ensure photoURL is set from Google provider result
      if (!result.user.photoURL) {
        const profile = result.additionalUserInfo?.profile;
        const photo = profile?.picture || profile?.photoURL || null;
        if (photo) {
          await updateProfile(result.user, { photoURL: photo });
          result.user.photoURL = photo;
        }
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
