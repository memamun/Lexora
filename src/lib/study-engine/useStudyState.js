import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '../db';
import { LEVELS } from '../wordData';
import { TOTAL_LEVELS, MAX_REVIEWS_FETCH } from '../constants';
import { _cache, _lastLoadTime, _cachedUserId, CACHE_TTL, setCache, setLastLoadTime, setCachedUserId } from './cache';

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
        db.entities.LevelProgress.list('level_number', TOTAL_LEVELS).catch(() => []),
        db.entities.QuizAttempt.list('-attempted_at', 100).catch(() => [])
      ]);

      const newReviews = reviewData || [];
      const newReviewMap = new Map(newReviews.map(r => [r.word_index, r]));
      const newReviewByWord = new Map(newReviews.map(r => [r.word, r]));
      setReviews(newReviews);
      reviewsRef.current = newReviews;
      reviewMapRef.current = newReviewMap;
      reviewByWordRef.current = newReviewByWord;

      const newStats = statsData?.[0] || null;
      setStats(newStats);
      statsRef.current = newStats;

      const newQuizAttempts = quizAttemptsData || [];
      setQuizAttempts(newQuizAttempts);

      const levelsMap = new Map((levelsData || []).map(l => [l.level_number, l]));
      const fullLevelProgress = [];
      for (let i = 0; i < LEVELS.length; i++) {
        const levelNum = LEVELS[i].number;
        const existing = levelsMap.get(levelNum);

        let isUnlocked = levelNum === 1;
        if (levelNum > 1) {
          const prevLevel = fullLevelProgress[i - 1];
          isUnlocked = prevLevel ? prevLevel.is_completed : false;
        }

        fullLevelProgress.push({
          id: existing?.id,
          level_number: levelNum,
          is_unlocked: isUnlocked,
          is_completed: existing?.is_completed || false,
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
