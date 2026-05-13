import { db } from './db';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { ALL_WORDS, calculateNextReview, LEVELS, WORDS_PER_LEVEL, TOTAL_LEVELS, MAX_REVIEWS_FETCH, WEAK_THRESHOLD } from './wordData';

export function useStudyEngine() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [levelProgress, setLevelProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const reviewMapRef = useRef(new Map());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewData, statsData, levelsData] = await Promise.all([
        db.entities.WordReview.list('-updated_date', MAX_REVIEWS_FETCH).catch(() => []),
        db.entities.UserStats.list('-updated_date', 1).catch(() => []),
        db.entities.LevelProgress.list('level_number', TOTAL_LEVELS).catch(() => [])
      ]);

      setReviews(reviewData || []);
      reviewMapRef.current = new Map((reviewData || []).map(r => [r.word_index, r]));
      setStats(statsData?.[0] || null);

      const levelsMap = new Map((levelsData || []).map(l => [l.level_number, l]));
      const fullLevelProgress = LEVELS.map(level => {
        const existing = levelsMap.get(level.number);
        if (existing) return existing;
        return {
          level_number: level.number,
          is_unlocked: level.number === 1,
          is_completed: false,
          quiz_score: 0,
          words_studied: 0
        };
      });
      setLevelProgress(fullLevelProgress);
    } catch (err) {
      console.error('Failed to load study engine data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getReview = (wordIndex) => reviewMapRef.current.get(wordIndex) || null;

  const isLevelUnlocked = (num) => {
    if (num === 1) return true;
    const level = levelProgress.find(l => l.level_number === num);
    if (level?.is_unlocked) return true;
    const prevLevel = levelProgress.find(l => l.level_number === num - 1);
    return prevLevel?.is_completed || false;
  };

  const getWordsForLevel = (num) => {
    const level = LEVELS.find(l => l.number === num);
    if (!level) return [];
    return level.wordIndices.map(idx => ALL_WORDS[idx]);
  };

  const getDueWords = useMemo(() => {
    const now = new Date();
    return reviews
      .filter(r => r.next_review && new Date(r.next_review) <= now)
      .sort((a, b) => new Date(a.next_review) - new Date(b.next_review));
  }, [reviews]);

  const getWeakWords = useMemo(() => {
    return reviews
      .filter(r => r.mastery_level === 'learning' || (r.correct_count || 0) / Math.max(1, r.total_reviews || 1) < WEAK_THRESHOLD)
      .sort((a, b) => (a.correct_count / Math.max(1, a.total_reviews)) - (b.correct_count / Math.max(1, b.total_reviews)));
  }, [reviews]);

  const getNearForgettingWords = useMemo(() => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 86400000);
    return reviews.filter(r => {
      const nxt = new Date(r.next_review);
      return nxt > now && nxt <= in24h && r.mastery_level === 'reviewing';
    }).sort((a, b) => new Date(a.next_review) - new Date(b.next_review));
  }, [reviews]);

  const getNewWords = useMemo(() => {
    const studied = new Set(reviews.map(r => r.word_index));
    return ALL_WORDS.filter(w => !studied.has(w.index));
  }, [reviews]);

  const getMasteryStats = useMemo(() => {
    const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    reviews.forEach(r => { counts[r.mastery_level || 'new']++; });
    counts.new += ALL_WORDS.length - reviews.length;
    return counts;
  }, [reviews]);

  const recordLevelQuiz = async (levelNumber, score) => {
    const existing = levelProgress.find(l => l.level_number === levelNumber);
    const isCompleted = score >= QUIZ_PASS_MARK;

    const update = {
      level_number: levelNumber,
      is_completed: isCompleted,
      quiz_score: Math.max(existing?.quiz_score || 0, score),
      last_practiced: new Date().toISOString()
    };

    if (existing?.id) {
      await db.entities.LevelProgress.update(existing.id, update);
    } else {
      await db.entities.LevelProgress.create({ ...update, is_unlocked: true });
    }

    if (isCompleted && levelNumber < TOTAL_LEVELS) {
      const nextLevel = levelProgress.find(l => l.level_number === levelNumber + 1);
      if (!nextLevel?.is_unlocked) {
        if (nextLevel?.id) {
          await db.entities.LevelProgress.update(nextLevel.id, { is_unlocked: true });
        } else {
          await db.entities.LevelProgress.create({ level_number: levelNumber + 1, is_unlocked: true });
        }
      }
    }

    await loadData();
  };

  const recordReview = async (wordIndex, confidence, responseTime) => {
    const existing = getReview(wordIndex);
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

    const reviewData = { word: word.word, word_index: wordIndex, ...nextData, total_reviews: totalReviews, correct_count: correctCount, avg_response_time: avgTime, streak };

    if (existing?.id) {
      await db.entities.WordReview.update(existing.id, reviewData);
    } else {
      await db.entities.WordReview.create(reviewData);
    }

    // Update level progress words_studied — use the up-to-date review map
    const levelNum = Math.floor(wordIndex / WORDS_PER_LEVEL) + 1;
    const levelProg = levelProgress.find(l => l.level_number === levelNum);
    const levelWordIndices = LEVELS.find(l => l.number === levelNum).wordIndices;
    // Update local ref before counting to avoid stale state
    reviewMapRef.current.set(wordIndex, reviewData);
    const studiedInLevel = [...reviewMapRef.current.values()].filter(r => levelWordIndices.includes(r.word_index)).length;

    const levelUpdate = {
      level_number: levelNum,
      words_studied: studiedInLevel,
      is_unlocked: true
    };

    if (levelProg?.id) {
      await db.entities.LevelProgress.update(levelProg.id, levelUpdate);
    } else {
      await db.entities.LevelProgress.create({ ...levelUpdate, is_completed: false, quiz_score: 0 });
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const currentStats = stats || {};
    const dailyReviews = { ...(currentStats.daily_reviews || {}), [today]: (currentStats.daily_reviews?.[today] || 0) + 1 };
    const dailyCorrect = { ...(currentStats.daily_correct || {}) };
    if (isCorrect) dailyCorrect[today] = (dailyCorrect[today] || 0) + 1;

    let streakDays = currentStats.current_streak_days || 0;
    if (currentStats.last_study_date === yesterday) streakDays += 1;
    else if (currentStats.last_study_date !== today) streakDays = 1;

    const statsUpdate = {
      total_words_studied: new Set([...reviewMapRef.current.values()].map(r => r.word_index)).size,
      total_reviews: (currentStats.total_reviews || 0) + 1,
      total_correct: (currentStats.total_correct || 0) + (isCorrect ? 1 : 0),
      current_streak_days: streakDays,
      longest_streak_days: Math.max(streakDays, currentStats.longest_streak_days || 0),
      last_study_date: today,
      daily_reviews: dailyReviews,
      daily_correct: dailyCorrect,
    };

    if (stats?.id) await db.entities.UserStats.update(stats.id, statsUpdate);
    else await db.entities.UserStats.create(statsUpdate);

    await loadData();
  };

  return { reviews, stats, levelProgress, loading, getReview, getDueWords, getWeakWords, getNearForgettingWords, getNewWords, getMasteryStats, recordReview, isLevelUnlocked, getWordsForLevel, recordLevelQuiz, reload: loadData };
}