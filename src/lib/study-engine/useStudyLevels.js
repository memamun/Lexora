import { useCallback } from 'react';
import { ALL_WORDS, LEVELS } from '../wordData';

export function useStudyLevels({ levelProgress }) {

  const isLevelUnlocked = useCallback((num) => {
    if (num === 1) return true;
    const prevLevel = levelProgress.find(l => l.level_number === num - 1);
    return prevLevel?.is_completed || false;
  }, [levelProgress]);

  const getWordsForLevel = useCallback((num) => {
    const level = LEVELS[num - 1];
    if (!level || level.number !== num) return [];
    return level.wordIndices.map(idx => ALL_WORDS[idx]);
  }, []);

  return {
    isLevelUnlocked, getWordsForLevel
  };
}
