import { getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

const QUEUE_KEY = 'lexora_sync_queue';
const DAILY_KEY = 'lexora_analytics_daily';
const MAX_QUEUE_SIZE = 200;
const QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days TTL for queue items
const DAILY_RETENTION_DAYS = 30; // Keep 30 days of daily analytics

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
  const entry = daily[date] || { reviews: 0, correct: 0, timeSpent: 0, unflushed: { reviews: 0, correct: 0, timeSpent: 0 } };
  entry.reviews += reviewData.reviewCount || 1;
  entry.correct += reviewData.correct ? 1 : 0;
  entry.timeSpent += reviewData.responseTime || 0;
  // Track what hasn't been flushed yet to prevent double-counting
  entry.unflushed.reviews += reviewData.reviewCount || 1;
  entry.unflushed.correct += reviewData.correct ? 1 : 0;
  entry.unflushed.timeSpent += reviewData.responseTime || 0;
  daily[date] = entry;
  // Prune old data to prevent unbounded growth
  const prunedDaily = pruneOldDailyData(daily);
  saveLocalDaily(prunedDaily);
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

// Prune old queue items (older than QUEUE_TTL_MS)
function pruneOldQueueItems(queue) {
  const now = Date.now();
  return queue.filter(item => {
    // Keep items that are recent or haven't exceeded retry limit
    const age = now - (item.timestamp || 0);
    return age < QUEUE_TTL_MS || (item.retries || 0) < 10;
  });
}

// Prune old daily analytics data (older than DAILY_RETENTION_DAYS)
function pruneOldDailyData(data) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAILY_RETENTION_DAYS);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];
  return Object.fromEntries(
    Object.entries(data).filter(([date]) => date >= cutoffStr)
  );
}

function enqueue(item) {
  let queue = getQueue();
  // Prune old items first
  queue = pruneOldQueueItems(queue);
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE + 1);
  }
  // Sanitize: only store uid, not full user object to prevent PII bloat
  const sanitized = { ...item };
  if (sanitized.user) {
    sanitized.user = { uid: sanitized.user.uid, email: sanitized.user.email };
  }
  queue.push({ ...sanitized, timestamp: Date.now(), retries: 0 });
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
      } else if (item.type === 'daily' && item.uid && item.date && item.delta) {
        ok = await writeDailyToFirestore(item.uid, item.date, item.delta);
      }
      if (!ok) {
        item.retries = (item.retries || 0) + 1;
        if (item.retries < 10) remaining.push(item);
      } else if (item.type === 'daily' && item.date) {
        // Clear unflushed delta after successful queue flush
        const daily = getLocalDaily();
        const entry = daily[item.date];
        if (entry && entry.unflushed) {
          entry.unflushed = { reviews: 0, correct: 0, timeSpent: 0 };
          daily[item.date] = entry;
          saveLocalDaily(daily);
        }
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

  /* Send only the unflushed delta, not the accumulated total */
  const delta = entry.unflushed;
  if (delta.reviews === 0 && delta.correct === 0 && delta.timeSpent === 0) return;
  
  const ok = await writeDailyToFirestore(uid, date, delta);
  if (ok) {
    // Clear unflushed after successful sync
    entry.unflushed = { reviews: 0, correct: 0, timeSpent: 0 };
    daily[date] = entry;
    saveLocalDaily(daily);
  } else {
    enqueue({ type: 'daily', uid, date, delta });
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
let onlineHandler = null;

export function initAnalytics() {
  if (listenerAttached) return;
  listenerAttached = true;

  /* Flush on mount if online */
  if (isOnline()) {
    flushQueue().catch(err => console.warn('[Analytics] Initial flush failed:', err.message));
  }

  /* Flush when coming back online */
  onlineHandler = () => {
    flushQueue().catch(err => console.warn('[Analytics] Online flush failed:', err.message));
  };
  window.addEventListener('online', onlineHandler);
}

export function destroyAnalytics() {
  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
  }
  listenerAttached = false;
}
