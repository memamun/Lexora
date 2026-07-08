import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '../db';
import { LEVELS } from '../wordData';
import { TOTAL_LEVELS, MAX_REVIEWS_FETCH, QUIZ_PASS_MARK } from '../constants';
import { _cache, _lastLoadTime, _cachedUserId, CACHE_TTL, setCache, setLastLoadTime, setCachedUserId } from './cache';
import { doc, updateDoc } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';

export function useStudyState(user) {
  const [reviews, setReviews] = useState(_cache?.reviews || []);
  const [stats, setStats] = useState(_cache?.stats || null);
  const [levelProgress, setLevelProgress] = useState(_cache?.levelProgress || []);
  const [quizAttempts, setQuizAttempts] = useState(_cache?.quizAttempts || []);
  const [loading, setLoading] = useState(!_cache);

  const reviewsRef = useRef(_cache?.reviews || []);
  const reviewMapRef = useRef(_cache?.reviewMap || new Map());
  const reviewByWordRef = useRef(_cache?.reviewByWord || new Map());
  const levelProgressRef = useRef(_cache?.levelProgress || []);
  const statsRef = useRef(_cache?.stats || null);

  // Synchronize state changes back to the module cache to survive unmounts/remounts
  useEffect(() => {
    if (_lastLoadTime > 0) {
      setCache({
        reviews,
        stats,
        levelProgress,
        quizAttempts,
        reviewMap: reviewMapRef.current,
        reviewByWord: reviewByWordRef.current
      });
    }
  }, [reviews, stats, levelProgress, quizAttempts]);

  const loadData = useCallback(async (force = false) => {
    // Clear cache if user changed (prevents cross-user data leak)
    if (user?.id && user.id !== _cachedUserId) {
      setCache(null);
      setCachedUserId(user.id);
    }

    // Skip if cache is fresh (< 1 minute old) and not forced
    if (!force && _cache && Date.now() - _lastLoadTime < CACHE_TTL) {
      setLoading(false);
      return;
    }
    if (!_cache) setLoading(true);
    try {
      const [reviewData, statsData, levelsData, quizAttemptsData] = await Promise.all([
        db.entities.WordReview.list('-updated_date', MAX_REVIEWS_FETCH).catch(() => []),
        db.entities.UserStats.list('-updated_date', 1).catch(() => []),
        db.entities.LevelProgress.list('level_number', 500).catch(() => []),
        db.entities.QuizAttempt.list('-attempted_at', 100).catch(() => [])
      ]);

      const newReviews = reviewData || [];
      const newReviewMap = new Map(newReviews.map(r => [r.word_index, r]));
      const newReviewByWord = new Map(newReviews.map(r => [r.word, r]));
      setReviews(newReviews);
      reviewsRef.current = newReviews;
      reviewMapRef.current = newReviewMap;
      reviewByWordRef.current = newReviewByWord;

      let newStats = statsData?.[0] || null;
      if (newStats) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

        if (newStats.last_study_date && newStats.last_study_date !== today && newStats.last_study_date !== yesterday) {
          if (newStats.current_streak_days > 0) {
            newStats = {
              ...newStats,
              current_streak_days: 0
            };
            const statsId = newStats.id;
            (async () => {
              try {
                await db.entities.UserStats.update(statsId, { current_streak_days: 0 });
                if (firestoreDb && user?.id) {
                  const userRef = doc(firestoreDb, 'users', user.id);
                  await updateDoc(userRef, { current_streak_days: 0 });
                }
              } catch (err) {
                console.warn('Failed to auto-reset expired streak:', err.message);
              }
            })();
          }
        }
      }
      setStats(newStats);
      statsRef.current = newStats;

      const newQuizAttempts = quizAttemptsData || [];
      setQuizAttempts(newQuizAttempts);

      const levelsMap = new Map();
      (levelsData || []).forEach(l => {
        const key = String(l.level_number);
        const existing = levelsMap.get(key);
        if (!existing) {
          levelsMap.set(key, l);
        } else {
          levelsMap.set(key, {
            ...existing,
            id: existing.id || l.id,
            is_completed: existing.is_completed || l.is_completed || false,
            is_unlocked: existing.is_unlocked || l.is_unlocked || false,
            quiz_score: Math.max(existing.quiz_score || 0, l.quiz_score || 0),
            words_studied: Math.max(existing.words_studied || 0, l.words_studied || 0),
            last_practiced: (existing.last_practiced && l.last_practiced)
              ? (existing.last_practiced > l.last_practiced ? existing.last_practiced : l.last_practiced)
              : (existing.last_practiced || l.last_practiced)
          });
        }
      });

      const fullLevelProgress = [];
      for (let i = 0; i < LEVELS.length; i++) {
        const levelNum = LEVELS[i].number;
        const existing = levelsMap.get(String(levelNum));
        const isCompleted = existing?.is_completed || (existing?.quiz_score || 0) >= QUIZ_PASS_MARK || false;

        let isUnlocked = levelNum === 1 || existing?.is_unlocked || false;
        if (levelNum > 1 && !isUnlocked) {
          const prevLevel = fullLevelProgress[i - 1];
          isUnlocked = prevLevel ? prevLevel.is_completed : false;
        }

        fullLevelProgress.push({
          id: existing?.id,
          level_number: levelNum,
          is_unlocked: isUnlocked,
          is_completed: isCompleted,
          quiz_score: existing?.quiz_score || 0,
          words_studied: existing?.words_studied || 0,
          last_practiced: existing?.last_practiced
        });
      }
      setLevelProgress(fullLevelProgress);
      levelProgressRef.current = fullLevelProgress;

      setCache({
        reviews: newReviews,
        stats: newStats,
        levelProgress: fullLevelProgress,
        quizAttempts: newQuizAttempts,
        reviewMap: newReviewMap,
        reviewByWord: newReviewByWord
      });
      setLastLoadTime(Date.now());
    } catch (err) {
      console.error('Failed to load study engine data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    reviews, setReviews,
    stats, setStats,
    levelProgress, setLevelProgress,
    quizAttempts, setQuizAttempts,
    loading, setLoading,
    reviewsRef,
    reviewMapRef, reviewByWordRef,
    levelProgressRef, statsRef,
    loadData
  };
}
