import { useCallback } from 'react';
import { ALL_WORDS, LEVELS } from '../wordData';

export function useStudyLevels({ levelProgress }) {

  const isLevelUnlocked = useCallback((num) => {
    if (num === 1) return true;
    const currentLevel = levelProgress.find(l => String(l.level_number) === String(num));
    if (currentLevel?.is_unlocked) return true;
    const prevLevel = levelProgress.find(l => String(l.level_number) === String(num - 1));
    return prevLevel?.is_completed || false;
  }, [levelProgress]);

  const getWordsForLevel = useCallback((num) => {
    const level = LEVELS.find(l => l.number === num);
    if (!level) return [];
    return level.wordIndices.map(idx => ALL_WORDS[idx]);
  }, []);

  return {
    isLevelUnlocked, getWordsForLevel
  };
}
