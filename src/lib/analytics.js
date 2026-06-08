import { getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

const QUEUE_KEY = 'lexora_sync_queue';
const DAILY_KEY = 'lexora_analytics_daily';

let firestore = null;
let flushing = false;

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

function isOnline() {
  return navigator.onLine !== false;
}

/* ─── Local accumulator (always saved, no network needed) ─── */

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

function accumulateDaily(reviewData) {
  const date = today();
  const daily = getLocalDaily();
  const entry = daily[date] || { reviews: 0, correct: 0, timeSpent: 0 };
  entry.reviews += reviewData.reviewCount || 1;
  entry.correct += reviewData.correct ? 1 : 0;
  entry.timeSpent += reviewData.responseTime || 0;
  daily[date] = entry;
  saveLocalDaily(daily);
}

/* ─── Sync queue ─── */

function getQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[Analytics] Failed to save queue:', err.message);
  }
}

function enqueue(item) {
  const queue = getQueue();
  queue.push({ ...item, timestamp: Date.now(), retries: 0 });
  saveQueue(queue);
}

/* ─── Firestore flush ─── */

async function writeDailyToFirestore(uid, date, data) {
  const db = getDb();
  if (!db) return false;
  try {
    const ref = doc(db, 'users', uid, 'daily', date);
    await setDoc(ref, {
      date,
      reviews: increment(data.reviews),
      correct: increment(data.correct),
      timeSpent: increment(data.timeSpent),
      lastActivityAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

async function writeUserLoginToFirestore(user) {
  const db = getDb();
  if (!db) return false;
  try {
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: user.providerData?.[0]?.providerId || 'unknown',
      lastLoginAt: serverTimestamp(),
      totalSessions: increment(1),
    }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function flushQueue() {
  if (flushing || !isOnline()) return;
  flushing = true;

  const uid = auth?.currentUser?.uid;
  if (!uid) { flushing = false; return; }

  /* Flush queued daily snapshots */
  const daily = getLocalDaily();
  const dates = Object.keys(daily);
  if (dates.length > 0) {
    const results = await Promise.allSettled(
      dates.map(date => writeDailyToFirestore(uid, date, daily[date]))
    );
    const synced = dates.filter((_, i) => results[i].status === 'fulfilled' && results[i].value);
    if (synced.length > 0) {
      const remaining = { ...daily };
      for (const date of synced) delete remaining[date];
      saveLocalDaily(remaining);
    }
  }

  /* Flush queued items */
  const queue = getQueue();
  if (queue.length > 0) {
    const remaining = [];
    for (const item of queue) {
      let ok = false;
      if (item.type === 'login' && item.user) {
        ok = await writeUserLoginToFirestore(item.user);
      }
      if (!ok) {
        item.retries = (item.retries || 0) + 1;
        if (item.retries < 10) remaining.push(item);
      }
    }
    saveQueue(remaining);
  }

  flushing = false;
}

/* ─── Public API ─── */

export async function trackUserLogin(user) {
  if (!user) return;

  /* Always accumulate locally (anonymous counters only — no PII) */
  try {
    const raw = localStorage.getItem('lexora_user_profile');
    const prev = raw ? JSON.parse(raw) : {};
    prev.lastLogin = Date.now();
    prev.totalSessions = (prev.totalSessions || 0) + 1;
    localStorage.setItem('lexora_user_profile', JSON.stringify(prev));
  } catch {}

  /* Try Firestore sync, queue if offline */
  const db = getDb();
  if (!db || !isOnline()) {
    enqueue({ type: 'login', user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, providerData: user.providerData } });
    return;
  }
  const ok = await writeUserLoginToFirestore(user);
  if (!ok) {
    enqueue({ type: 'login', user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, providerData: user.providerData } });
  }
}

export async function trackDailyActivity(reviewData) {
  /* Always accumulate locally first */
  accumulateDaily(reviewData);

  /* Try Firestore sync, queue if offline */
  const db = getDb();
  if (!db || !isOnline()) return;
  const uid = auth?.currentUser?.uid;
  if (!uid) return;
  const date = today();
  const daily = getLocalDaily();
  const entry = daily[date];
  if (!entry) return;

  /* Send only the delta (the single review just accumulated), not the accumulated total */
  const delta = { reviews: 1, correct: reviewData.correct ? 1 : 0, timeSpent: reviewData.responseTime || 0 };
  const ok = await writeDailyToFirestore(uid, date, delta);
  if (ok) {
    const remaining = { ...daily };
    delete remaining[date];
    saveLocalDaily(remaining);
  }
}

/* ─── Level Progress Sync ─── */

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

/* ─── Quiz Results Sync ─── */

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

/* ─── Init: online listener ─── */

let listenerAttached = false;

export function initAnalytics() {
  if (listenerAttached) return;
  listenerAttached = true;

  /* Flush on mount if online */
  if (isOnline()) {
    flushQueue();
  }

  /* Flush when coming back online */
  window.addEventListener('online', () => {
    flushQueue();
  });
}
