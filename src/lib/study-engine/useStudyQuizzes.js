import { useCallback, useMemo } from 'react';
import { db, batchCommit } from '../db';
import { ALL_WORDS } from '../wordData';
import { WORDS_PER_LEVEL, TOTAL_LEVELS, QUIZ_PASS_MARK } from '../constants';

export function useStudyQuizzes({
  quizAttempts,
  levelProgress, setLevelProgress,
  reviewMapRef,
  loadData, getWeakWords
}) {

  const recordLevelQuiz = useCallback(async (levelNumber, score, wrongWordIndices = []) => {
    const ops = [];
    const existing = levelProgress[levelNumber - 1];
    const isCompleted = score >= QUIZ_PASS_MARK || existing?.is_completed || false;

    const update = {
      level_number: levelNumber,
      is_completed: isCompleted,
      quiz_score: Math.max(existing?.quiz_score || 0, score),
      last_practiced: new Date().toISOString()
    };

    ops.push({
      entity: 'LevelProgress',
      type: existing?.id ? 'update' : 'create',
      id: existing?.id,
      data: { ...update, ...(existing?.id ? {} : { is_unlocked: true }) }
    });

    if (isCompleted && levelNumber < TOTAL_LEVELS) {
      const nextLevel = levelProgress[levelNumber];
      if (!nextLevel?.is_unlocked) {
        ops.push({
          entity: 'LevelProgress',
          type: nextLevel?.id ? 'update' : 'create',
          id: nextLevel?.id,
          data: { level_number: levelNumber + 1, is_unlocked: true }
        });
      }
    }

    if (wrongWordIndices.length > 0) {
      ops.push({
        entity: 'QuizAttempt',
        type: 'create',
        data: {
          level_number: levelNumber,
          score,
          total_questions: WORDS_PER_LEVEL,
          correct_count: WORDS_PER_LEVEL - wrongWordIndices.length,
          wrong_word_indices: wrongWordIndices,
          attempted_at: new Date().toISOString()
        }
      });

      const now = new Date();
      wrongWordIndices.forEach((wordIndex) => {
        const existingWord = reviewMapRef.current.get(wordIndex);
        const word = ALL_WORDS[wordIndex];
        if (!word) return;
        const wordUpdate = {
          word_index: wordIndex,
          word: word.word,
          quiz_wrong_count: (existingWord?.quiz_wrong_count || 0) + 1,
          next_review: new Date(now.getTime() - 86400000).toISOString(),
          mastery_level: existingWord?.mastery_level || 'learning',
          updated_date: now.toISOString()
        };
        ops.push({
          entity: 'WordReview',
          type: existingWord?.id ? 'update' : 'create',
          id: existingWord?.id,
          data: existingWord?.id ? { ...existingWord, ...wordUpdate } : wordUpdate
        });
      });
    }

    const results = await batchCommit(ops);

    await loadData(true);

    const lpResult = results?.find(r => r.entity === 'LevelProgress' && r.data?.level_number === levelNumber);
    if (lpResult?.id) {
      setLevelProgress(prev => prev.map(l =>
        l.level_number === levelNumber ? { ...l, id: lpResult.id } : l
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
