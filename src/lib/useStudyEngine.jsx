import { db } from './db';
import { trackDailyActivity } from './analytics';

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';

import { ALL_WORDS, calculateNextReview, LEVELS } from './wordData';
import { WORDS_PER_LEVEL, TOTAL_LEVELS, MAX_REVIEWS_FETCH, WEAK_THRESHOLD, QUIZ_PASS_MARK } from './constants';

// ─── Module-level cache to survive unmount/remount across navigations ───
let _cache = null;

export function clearStudyEngineCache() {
  _cache = null;
}

const StudyEngineContext = createContext(null);

export function StudyEngineProvider({ children }) {
  const [reviews, setReviews] = useState(_cache?.reviews || []);
  const [stats, setStats] = useState(_cache?.stats || null);
  const [levelProgress, setLevelProgress] = useState(_cache?.levelProgress || []);
  const [quizAttempts, setQuizAttempts] = useState(_cache?.quizAttempts || []);
  const [loading, setLoading] = useState(!_cache);
  const reviewMapRef = useRef(_cache?.reviewMap || new Map());

  const loadData = useCallback(async () => {
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
      reviewMapRef.current = newReviewMap;
      reviewByWordRef.current = newReviewByWord;
      const newStats = statsData?.[0] || null;
      setStats(newStats);
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

      _cache = { reviews: newReviews, stats: newStats, levelProgress: fullLevelProgress, quizAttempts: newQuizAttempts, reviewMap: newReviewMap };
    } catch (err) {
      console.error('Failed to load study engine data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getReview = (wordIndex) => reviewMapRef.current.get(wordIndex) || null;
  const reviewByWordRef = useRef(new Map());
  const getWordReview = useCallback((wordStr) => {
    return reviewByWordRef.current.get(wordStr) || null;
  }, []);

  const isLevelUnlocked = useCallback((num) => {
    if (num === 1) return true;
    const prevLevel = levelProgress.find(l => l.level_number === num - 1);
    return prevLevel?.is_completed || false;
  }, [levelProgress]);

  const getWordsForLevel = (num) => {
    const level = LEVELS.find(l => l.number === num);
    if (!level) return [];
    return level.wordIndices.map(idx => ALL_WORDS[idx]);
  };

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
    return ALL_WORDS.filter(w => !studied.has(w.index));
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

  const recordLevelQuiz = async (levelNumber, score, wrongWordIndices = []) => {
    const existing = levelProgress.find(l => l.level_number === levelNumber);
    const isCompleted = score >= QUIZ_PASS_MARK;

    const update = {
      level_number: levelNumber,
      is_completed: isCompleted,
      quiz_score: Math.max(existing?.quiz_score || 0, score),
      last_practiced: new Date().toISOString()
    };

    let currentResult;
    if (existing?.id) {
      currentResult = await db.entities.LevelProgress.update(existing.id, update);
    } else {
      currentResult = await db.entities.LevelProgress.create({ ...update, is_unlocked: true });
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

    if (wrongWordIndices.length > 0) {
      await db.entities.QuizAttempt.create({
        level_number: levelNumber,
        score,
        total_questions: WORDS_PER_LEVEL,
        correct_count: WORDS_PER_LEVEL - wrongWordIndices.length,
        wrong_word_indices: wrongWordIndices,
        attempted_at: new Date().toISOString()
      });

      const now = new Date();
      const srsUpdates = wrongWordIndices.map(async (wordIndex) => {
        const existing = reviewMapRef.current.get(wordIndex);
        const word = ALL_WORDS[wordIndex];
        if (!word) return;
        const update = {
          word_index: wordIndex,
          word: word.word,
          quiz_wrong_count: (existing?.quiz_wrong_count || 0) + 1,
          next_review: new Date(now.getTime() - 86400000).toISOString(),
          mastery_level: existing?.mastery_level || 'learning',
          updated_date: now.toISOString()
        };
        if (existing?.id) {
          await db.entities.WordReview.update(existing.id, { ...existing, ...update });
        } else {
          await db.entities.WordReview.create(update);
        }
      });
      await Promise.all(srsUpdates);
    }

    await loadData();

    if (currentResult) {
      setLevelProgress(prev => prev.map(l =>
        l.level_number === levelNumber ? { ...l, id: currentResult.id } : l
      ));
    }
  };

  const recordReviewRef = useRef(false);
  const recordReview = async (wordIndex, confidence, responseTime) => {
    if (recordReviewRef.current) return;
    recordReviewRef.current = true;
    try {
      await _recordReview(wordIndex, confidence, responseTime);
    } finally {
      recordReviewRef.current = false;
    }
  };

  const _recordReview = async (wordIndex, confidence, responseTime) => {
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

    const previousReviews = [...reviews];
    const previousStats = stats ? { ...stats } : null;
    const previousLevelProgress = [...levelProgress];

    setReviews(prev => {
      const idx = prev.findIndex(r => r.word_index === wordIndex);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...prev[idx], ...reviewData };
        return next;
      }
      return [...prev, reviewData];
    });
    reviewMapRef.current.set(wordIndex, reviewData);

    const levelNum = Math.floor(wordIndex / WORDS_PER_LEVEL) + 1;
    const levelWordIndices = LEVELS.find(l => l.number === levelNum).wordIndices;
    const studiedInLevel = [...reviewMapRef.current.values()].filter(r => levelWordIndices.includes(r.word_index)).length;

    setLevelProgress(prev => prev.map(l => 
      l.level_number === levelNum ? { ...l, words_studied: studiedInLevel } : l
    ));

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    const currentStats = stats || { total_words_studied: 0, total_reviews: 0, total_correct: 0, current_streak_days: 0, longest_streak_days: 0, daily_reviews: {}, daily_correct: {} };
    
    const dailyReviews = { ...(currentStats.daily_reviews || {}), [today]: (currentStats.daily_reviews?.[today] || 0) + 1 };
    const dailyCorrect = { ...(currentStats.daily_correct || {}) };
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
    setStats(statsUpdate);

    try {
      const p1 = existing?.id 
        ? db.entities.WordReview.update(existing.id, reviewData)
        : db.entities.WordReview.create(reviewData);

      const levelProg = levelProgress.find(l => l.level_number === levelNum);
      const isUnlocked = levelNum === 1 || levelProgress.find(l => l.level_number === levelNum - 1)?.is_completed || false;
      const levelUpdate = { level_number: levelNum, words_studied: studiedInLevel, is_unlocked: isUnlocked };
      const p2 = levelProg?.id
        ? db.entities.LevelProgress.update(levelProg.id, levelUpdate)
        : db.entities.LevelProgress.create({ ...levelUpdate, is_completed: false, quiz_score: 0 });

      const p3 = stats?.id
        ? db.entities.UserStats.update(stats.id, statsUpdate)
        : db.entities.UserStats.create(statsUpdate);

      const [, p2Result] = await Promise.all([p1, p2, p3]);

      if (p2Result) {
        setLevelProgress(prev => prev.map(l =>
          l.level_number === levelNum ? { ...l, id: p2Result.id, words_studied: studiedInLevel } : l
        ));
      }

      trackDailyActivity({ reviewCount: 1, correct: isCorrect, responseTime });
    } catch (err) {
      console.error('Study engine persistence failed. Reverting state:', err);
      toast.error('Network error: Progress not saved.');
      setReviews(previousReviews);
      setStats(previousStats);
      setLevelProgress(previousLevelProgress);
      reviewMapRef.current = new Map(previousReviews.map(r => [r.word_index, r]));
      reviewByWordRef.current = new Map(previousReviews.map(r => [r.word, r]));
    }
  };

  const getQuizWrongWordsForLevel = useCallback((levelNum) => {
    const levelAttempts = quizAttempts.filter(a => a.level_number === levelNum);
    const wrongWordSet = new Set();
    levelAttempts.forEach(a => (a.wrong_word_indices || []).forEach(idx => wrongWordSet.add(idx)));
    const wrongIndices = [...wrongWordSet];
    return wrongIndices.map(idx => ALL_WORDS[idx]).filter(Boolean);
  }, [quizAttempts]);

  const getQuizAttemptsForLevel = useCallback((levelNum) => {
    return quizAttempts.filter(a => a.level_number === levelNum);
  }, [quizAttempts]);

  const getAllQuizWrongWords = useMemo(() => {
    const wrongWordMap = new Map();
    quizAttempts.forEach(a => (a.wrong_word_indices || []).forEach(idx => {
      const entry = wrongWordMap.get(idx) || { count: 0, levels: new Set() };
      entry.count += 1;
      entry.levels.add(a.level_number);
      wrongWordMap.set(idx, entry);
    }));
    return [...wrongWordMap.entries()].map(([idx, data]) => ({
      word: ALL_WORDS[idx],
      wrongCount: data.count,
      levels: [...data.levels].sort(),
      index: idx
    })).filter(item => item.word).sort((a, b) => b.wrongCount - a.wrongCount);
  }, [quizAttempts]);

  const getCrossLevelWeakWords = useMemo(() => {
    const weakSet = new Set();
    getWeakWords.forEach(r => weakSet.add(r.word_index));
    getAllQuizWrongWords.forEach(w => weakSet.add(w.index));
    return [...weakSet].map(idx => ALL_WORDS[idx]).filter(Boolean);
  }, [getWeakWords, getAllQuizWrongWords]);

  const getQuizWrongWordStats = useMemo(() => {
    const totalWrong = getAllQuizWrongWords.reduce((sum, w) => sum + w.wrongCount, 0);
    const uniqueWrong = getAllQuizWrongWords.length;
    const attempts = quizAttempts.length;
    const mostMissed = getAllQuizWrongWords.slice(0, 5);
    return { totalWrong, uniqueWrong, attempts, mostMissed };
  }, [getAllQuizWrongWords, quizAttempts]);

  const value = useMemo(() => ({
    reviews, stats, levelProgress, quizAttempts, loading,
    getReview, getWordReview, getDueWords, getWeakWords, getNearForgettingWords,
    getNewWords, getMasteryStats, recordReview, isLevelUnlocked, getWordsForLevel,
    recordLevelQuiz, getQuizWrongWordsForLevel, getQuizAttemptsForLevel,
    getAllQuizWrongWords, getCrossLevelWeakWords, getQuizWrongWordStats, reload: loadData
  }), [reviews, stats, levelProgress, quizAttempts, loading, loadData,
    getReview, getWordReview, isLevelUnlocked, getQuizWrongWordsForLevel, getQuizAttemptsForLevel,
    getDueWords, getWeakWords, getNearForgettingWords, getNewWords, getMasteryStats,
    getAllQuizWrongWords, getCrossLevelWeakWords, getQuizWrongWordStats]);

  return (
    <StudyEngineContext.Provider value={value}>
      {children}
    </StudyEngineContext.Provider>
  );
}

export function useStudyEngine() {
  const context = useContext(StudyEngineContext);
  if (!context) {
    throw new Error('useStudyEngine must be used within a StudyEngineProvider');
  }
  return context;
}
