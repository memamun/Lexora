import { logEvent as firebaseLogEvent } from 'firebase/analytics';
import { getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { analytics as analyticsInstance, auth, isFirebaseConfigured } from '@/lib/firebase';

const DAILY_KEY = 'lexora_analytics_daily';
const DAILY_RETENTION_DAYS = 30;

let firestore = null;

function getDb() {
  if (firestore) return firestore;
  try {
    if (isFirebaseConfigured) {
      const app = getApp();
      firestore = getFirestore(app);
    }
  } catch (err) {
    console.warn('[Analytics] Firestore not available:', err.message);
  }
  return firestore;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

/* ─── Local daily accumulator (for offline stats display) ─── */

function getLocalDaily() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalDaily(data) {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[Analytics] Failed to save local daily:', err.message);
  }
}

function pruneOldDailyData(data) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAILY_RETENTION_DAYS);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];
  return Object.fromEntries(
    Object.entries(data).filter(([date]) => date >= cutoffStr)
  );
}

function accumulateDaily(reviewData) {
  const date = today();
  const daily = getLocalDaily();
  const entry = daily[date] || { reviews: 0, correct: 0, timeSpent: 0 };
  entry.reviews += reviewData.reviewCount || 1;
  entry.correct += reviewData.correct ? 1 : 0;
  entry.timeSpent += reviewData.responseTime || 0;
  daily[date] = entry;
  saveLocalDaily(pruneOldDailyData(daily));
}

/* ─── Firebase Analytics wrapper ─── */

function logEvent(eventName, params) {
  if (analyticsInstance) {
    try {
      firebaseLogEvent(analyticsInstance, eventName, params);
    } catch {
      // Analytics unavailable (ad blocker, etc.) — silent fail
    }
  }
}

/* ─── Public API ─── */

export function trackUserLogin(user) {
  if (!user) return;

  // Log to Firebase Analytics (free, unlimited, no Firestore cost)
  logEvent('login', {
    method: user.providerData?.[0]?.providerId || 'email',
  });
}

export function trackDailyActivity(reviewData) {
  // Accumulate locally for offline stats display (no Firestore cost)
  accumulateDaily(reviewData);

  // Log to Firebase Analytics (free, unlimited)
  logEvent('review_completed', {
    correct: reviewData.correct ? 'true' : 'false',
    response_time_ms: reviewData.responseTime || 0,
  });
}

/* ─── Level Progress Sync (actual user data — stays in Firestore) ─── */

export async function syncLevelProgress(uid, levelProgress) {
  const db = getDb();
  if (!db || !uid) return;
  try {
    const ref = doc(db, 'users', uid);
    const progressObj = {};
    levelProgress.forEach(lp => {
      progressObj[`level_${lp.level_number}`] = {
        is_unlocked: lp.is_unlocked || false,
        is_completed: lp.is_completed || false,
        quiz_score: lp.quiz_score || 0,
        words_studied: lp.words_studied || 0,
      };
    });
    await setDoc(ref, { levelProgress: progressObj }, { merge: true });
  } catch (err) {
    console.warn('[Analytics] Failed to sync level progress:', err.message);
  }
}

/* ─── Quiz Results Sync (actual user data — stays in Firestore) ─── */

export async function syncQuizResults(uid, quizAttempt) {
  const db = getDb();
  if (!db || !uid) return;
  try {
    const ref = doc(db, 'users', uid, 'quizResults', `${quizAttempt.level_number}_${Date.now()}`);
    await setDoc(ref, {
      level_number: quizAttempt.level_number,
      score: quizAttempt.score,
      total_questions: quizAttempt.total_questions,
      correct_count: quizAttempt.correct_count,
      wrong_word_indices: quizAttempt.wrong_word_indices,
      attempted_at: quizAttempt.attempted_at,
      syncedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Analytics] Failed to sync quiz results:', err.message);
  }
}

/* ─── Daily data access (for Analytics page) ─── */

export function getLocalDailyData() {
  return getLocalDaily();
}

/* ─── Init / Destroy ─── */

export function initAnalytics() {
  // Firebase Analytics auto-handles session tracking
  // No Firestore queue to flush anymore
}

export function destroyAnalytics() {
  // No cleanup needed — Firebase Analytics manages its own lifecycle
}
