import { useMemo, useCallback, useRef } from 'react';
import { db, batchCommit } from '../db';
import { ALL_WORDS, calculateNextReview, LEVELS } from '../wordData';
import { WORDS_PER_LEVEL, WEAK_THRESHOLD } from '../constants';
import { trackDailyActivity } from '../analytics';
import { pruneOldDaily } from './cache';
import { toast } from 'sonner';

export function useStudyReviews({
  reviews, setReviews,
  stats, setStats,
  levelProgress, setLevelProgress,
  reviewMapRef, reviewByWordRef,
  levelProgressRef, statsRef,
  reviewsRef,
  user
}) {

  const getReview = useCallback((wordIndex) => reviewMapRef.current.get(wordIndex) || null, []);
  const getWordReview = useCallback((wordStr) => reviewByWordRef.current.get(wordStr) || null, []);

  const getDueWords = useMemo(() => {
    const now = new Date();
    return reviews
      .filter(r => r.next_review && new Date(r.next_review) <= now)
      .sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime());
  }, [reviews]);

  const getWeakWords = useMemo(() => {
    return reviews
      .filter(r => r.mastery_level === 'learning' || (r.correct_count || 0) / Math.max(1, r.total_reviews || 1) < WEAK_THRESHOLD)
      .sort((a, b) => {
        const aVal = (a.correct_count || 0) / Math.max(1, a.total_reviews || 1);
        const bVal = (b.correct_count || 0) / Math.max(1, b.total_reviews || 1);
        return aVal - bVal;
      });
  }, [reviews]);

  const getNearForgettingWords = useMemo(() => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 86400000);
    return reviews.filter(r => {
      const nxt = new Date(r.next_review);
      return nxt > now && nxt <= in24h && r.mastery_level === 'reviewing';
    }).sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime());
  }, [reviews]);

  const getNewWords = useMemo(() => {
    const studied = new Set(reviews.map(r => r.word_index));
    return ALL_WORDS.filter(w => !studied.has(w.index)).slice(0, WORDS_PER_LEVEL * 2); // Cap at 40 words
  }, [reviews]);

  const getMasteryStats = useMemo(() => {
    const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    reviews.forEach(r => {
      const level = r.mastery_level;
      if (level && counts.hasOwnProperty(level)) {
        counts[level]++;
      } else {
        counts.new++;
      }
    });
    counts.new += ALL_WORDS.length - reviews.length;
    return counts;
  }, [reviews]);

  const recordReviewPromiseChainRef = useRef(Promise.resolve());
  const processingWordsRef = useRef(new Set());

  const _recordReview = async (wordIndex, confidence, responseTime) => {
    // Read fresh values from refs to avoid stale closure state
    const currentReviews = reviewsRef.current;
    const currentStats = statsRef.current || {
      total_words_studied: 0,
      total_reviews: 0,
      total_correct: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      daily_reviews: {},
      daily_correct: {}
    };
    const currentLevelProgress = levelProgressRef.current;

    const existing = reviewMapRef.current.get(wordIndex) || null;
    const word = ALL_WORDS[wordIndex];
    if (!word) return;

    const nextData = calculateNextReview(existing || {}, confidence);
    const isCorrect = confidence !== 'forgot';
    const totalReviews = (existing?.total_reviews || 0) + 1;
    const correctCount = (existing?.correct_count || 0) + (isCorrect ? 1 : 0);
    const avgTime = existing?.avg_response_time
      ? Math.round((existing.avg_response_time * (totalReviews - 1) + responseTime) / totalReviews)
      : responseTime;
    const streak = isCorrect ? (existing?.streak || 0) + 1 : 0;

    const reviewData = {
      word: word.word,
      word_index: wordIndex,
      ...nextData,
      total_reviews: totalReviews,
      correct_count: correctCount,
      avg_response_time: avgTime,
      streak,
      updated_date: new Date().toISOString()
    };

    const previousReviews = [...currentReviews];
    const previousStats = statsRef.current ? { ...statsRef.current } : null;
    const previousLevelProgress = [...currentLevelProgress];

    // Optimistically update reviews state and ref
    setReviews(prev => {
      const idx = prev.findIndex(r => r.word_index === wordIndex);
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...prev[idx], ...reviewData };
      } else {
        next = [...prev, reviewData];
      }
      reviewsRef.current = next;
      return next;
    });
    reviewMapRef.current.set(wordIndex, reviewData);
    reviewByWordRef.current.set(word.word, reviewData);

    const levelNum = Math.floor(wordIndex / WORDS_PER_LEVEL) + 1;
    let levelDef = LEVELS[levelNum - 1];
    if (levelDef?.number !== levelNum) {
      levelDef = LEVELS.find(l => l.number === levelNum);
    }
    if (!levelDef) return;
    const levelWordIndices = levelDef.wordIndices;
    const studiedInLevel = [...reviewMapRef.current.values()].filter(r => levelWordIndices.includes(r.word_index)).length;

    // Optimistically update levelProgress state and ref
    const updatedLevelProgress = currentLevelProgress.map(l =>
      l.level_number === levelNum ? { ...l, words_studied: studiedInLevel } : l
    );
    setLevelProgress(updatedLevelProgress);
    levelProgressRef.current = updatedLevelProgress;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    // Prune old daily data to prevent unbounded growth
    const prunedDailyReviews = pruneOldDaily(currentStats.daily_reviews);
    const prunedDailyCorrect = pruneOldDaily(currentStats.daily_correct);

    const dailyReviews = { ...prunedDailyReviews, [today]: (prunedDailyReviews?.[today] || 0) + 1 };
    const dailyCorrect = { ...prunedDailyCorrect };
    if (isCorrect) dailyCorrect[today] = (dailyCorrect[today] || 0) + 1;

    let streakDays = currentStats.current_streak_days || 0;
    if (currentStats.last_study_date === yesterday) streakDays += 1;
    else if (currentStats.last_study_date !== today) streakDays = 1;

    const statsUpdate = {
      ...currentStats,
      total_words_studied: reviewMapRef.current.size,
      total_reviews: (currentStats.total_reviews || 0) + 1,
      total_correct: (currentStats.total_correct || 0) + (isCorrect ? 1 : 0),
      current_streak_days: streakDays,
      longest_streak_days: Math.max(streakDays, currentStats.longest_streak_days || 0),
      last_study_date: today,
      daily_reviews: dailyReviews,
      daily_correct: dailyCorrect,
      updated_date: now.toISOString()
    };
    
    // Optimistically update stats state and ref
    setStats(statsUpdate);
    statsRef.current = statsUpdate;

    if (user?.id) {
      (async () => {
        try {
          const { getApp } = await import('firebase/app');
          const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
          const app = getApp();
          const dbFs = getFirestore(app);
          const userDocRef = doc(dbFs, 'users', user.id);
          await updateDoc(userDocRef, {
            current_streak_days: statsUpdate.current_streak_days,
            longest_streak_days: statsUpdate.longest_streak_days,
            updated_date: now.toISOString()
          });
        } catch (dbErr) {
          console.warn('Failed to update streak on root user profile doc:', dbErr.message);
        }
      })();
    }

    try {
      // Use ref for fresh levelProgress (in case it was updated concurrently in queue)
      const freshLevelProgress = levelProgressRef.current;

      // O(1) lookup optimization: try index directly before falling back to O(N) find
      let levelProg = freshLevelProgress[levelNum - 1];
      if (levelProg?.level_number !== levelNum) {
        levelProg = freshLevelProgress.find(l => l.level_number === levelNum);
      }

      let prevLevelProg = freshLevelProgress[levelNum - 2];
      if (levelNum > 1 && prevLevelProg?.level_number !== levelNum - 1) {
        prevLevelProg = freshLevelProgress.find(l => l.level_number === levelNum - 1);
      }

      const isUnlocked = levelNum === 1 || prevLevelProg?.is_completed || false;
      const levelUpdate = { level_number: levelNum, words_studied: studiedInLevel, is_unlocked: isUnlocked };

      // Use ref for fresh stats
      const freshStats = statsRef.current;

      // Build batch ops — 3 writes in 1 Firestore transaction
      const ops = [
        {
          entity: 'WordReview',
          type: existing?.id ? 'update' : 'create',
          id: existing?.id,
          data: reviewData,
        },
        {
          entity: 'LevelProgress',
          type: levelProg?.id ? 'update' : 'create',
          id: levelProg?.id,
          data: levelProg?.id ? levelUpdate : { ...levelUpdate, is_completed: false, quiz_score: 0 },
        },
        {
          entity: 'UserStats',
          type: freshStats?.id ? 'update' : 'create',
          id: freshStats?.id,
          data: statsUpdate,
        },
      ];

      const results = await batchCommit(ops);

      if (!results) throw new Error('Batch commit returned null');

      // Propagate IDs back after batch create
      const wrResult = results.find(r => r.entity === 'WordReview');
      if (wrResult?.type === 'create' && wrResult.id) {
        const withId = { ...reviewData, id: wrResult.id };
        reviewMapRef.current.set(wordIndex, withId);
        reviewByWordRef.current.set(word.word, withId);
        setReviews(prev => prev.map(r =>
          r.word_index === wordIndex ? { ...r, id: wrResult.id } : r
        ));
      }

      const lpResult = results.find(r => r.entity === 'LevelProgress');
      if (lpResult?.type === 'create' && lpResult.id) {
        setLevelProgress(prev => {
          const next = prev.map(l =>
            l.level_number === levelNum ? { ...l, id: lpResult.id, words_studied: studiedInLevel } : l
          );
          levelProgressRef.current = next;
          return next;
        });
      }

      const usResult = results.find(r => r.entity === 'UserStats');
      if (usResult?.type === 'create' && usResult.id) {
        setStats(prev => {
          const next = { ...prev, id: usResult.id };
          statsRef.current = next;
          return next;
        });
      }

      trackDailyActivity({ reviewCount: 1, correct: isCorrect, responseTime });
    } catch (err) {
      console.error('Study engine persistence failed. Reverting state:', err);
      toast.error('Network error: Progress not saved.');
      setReviews(previousReviews);
      reviewsRef.current = previousReviews;
      setStats(previousStats);
      statsRef.current = previousStats;
      setLevelProgress(previousLevelProgress);
      levelProgressRef.current = previousLevelProgress;
      reviewMapRef.current = new Map(previousReviews.map(r => [r.word_index, r]));
      reviewByWordRef.current = new Map(previousReviews.map(r => [r.word, r]));
    }
  };

  const recordReview = useCallback((wordIndex, confidence, responseTime) => {
    // Ignore rapid duplicate reviews for the same word (e.g. double clicking button)
    if (processingWordsRef.current.has(wordIndex)) {
      return Promise.resolve();
    }
    processingWordsRef.current.add(wordIndex);

    const task = async () => {
      try {
        await _recordReview(wordIndex, confidence, responseTime);
      } finally {
        processingWordsRef.current.delete(wordIndex);
      }
    };

    // Serialize database writes using a promise chain to prevent race conditions
    recordReviewPromiseChainRef.current = recordReviewPromiseChainRef.current
      .then(task)
      .catch((err) => {
        console.error('Queue execution failed:', err);
      });
    return recordReviewPromiseChainRef.current;
  }, []);

  return {
    getReview, getWordReview, getDueWords, getWeakWords,
    getNearForgettingWords, getNewWords, getMasteryStats, recordReview
  };
}
