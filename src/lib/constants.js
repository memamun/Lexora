// src/lib/constants.js

// Word counts & level configuration
export const WORDS_PER_LEVEL = 20;
export const TOTAL_LEVELS = 15;
export const TOTAL_WORDS = WORDS_PER_LEVEL * TOTAL_LEVELS; // 300

// Quiz & mastery thresholds
export const QUIZ_PASS_MARK = 80;

// Data fetching limits
export const MAX_REVIEWS_FETCH = 1000;
export const MAX_STATS_FETCH = 1;
export const MAX_LEVEL_PROGRESS_FETCH = 20;

// Review queue limits per mode
export const MODE_QUEUE_LIMITS = {
  smart: 30,
  due: Infinity,
  weak: Infinity,
  forgetting: Infinity,
  new: 20,
};

// Weak words threshold — ratio below which a word is considered weak
export const WEAK_THRESHOLD = 0.6;

// Battle mode configuration
export const BATTLE_SPRINT_TIME = 30; // seconds
export const BATTLE_SPRINT_POOL_SIZE = 60;
export const BATTLE_MARATHON_POOL_SIZE = 50;
export const BATTLE_MARATHON_QUESTION_COUNT = 50;