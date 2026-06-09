import { useCallback, useMemo } from 'react';
import { db } from '../db';
import { ALL_WORDS } from '../wordData';
import { WORDS_PER_LEVEL, TOTAL_LEVELS, QUIZ_PASS_MARK } from '../constants';

export function useStudyQuizzes({
  quizAttempts,
  levelProgress, setLevelProgress,
  reviewMapRef,
  loadData, getWeakWords
}) {

  const recordLevelQuiz = useCallback(async (levelNumber, score, wrongWordIndices = []) => {
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
  }, [levelProgress, loadData, reviewMapRef, setLevelProgress]);

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

  return {
    recordLevelQuiz, getQuizWrongWordsForLevel, getQuizAttemptsForLevel,
    getAllQuizWrongWords, getCrossLevelWeakWords, getQuizWrongWordStats
  };
}
