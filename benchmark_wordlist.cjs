const { performance } = require('perf_hooks');

const iterations = 1000;
const ALL_WORDS = Array.from({ length: 5000 }, (_, i) => ({
  index: i,
  word: `word${i}`,
  explanation: `explanation for word ${i} goes here and it might be long`,
  bengali: `bengali translation ${i}`,
  difficulty: i % 3 === 0 ? 'easy' : (i % 3 === 1 ? 'medium' : 'hard'),
}));

const mockReviewMap = new Map();
for (let i = 0; i < 1000; i++) {
  mockReviewMap.set(`word${i}`, { mastery_level: 'learning' });
}
const getWordReview = (word) => mockReviewMap.get(word) || null;
const getFavorites = () => Array.from({ length: 500 }, (_, i) => i * 10);

function runBaseline(debouncedSearch, difficultyFilter, masteryFilter, favoritesOnly) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const favs = getFavorites();
    const searchLower = debouncedSearch.toLowerCase();
    ALL_WORDS.filter(word => {
      const review = getWordReview(word.word);
      const mastery = review?.mastery_level || 'new';

      const matchesSearch = !searchLower || word.word.toLowerCase().includes(searchLower) ||
        word.explanation.toLowerCase().includes(searchLower) ||
        word.bengali.toLowerCase().includes(searchLower);
      const matchesDifficulty = difficultyFilter === 'all' || word.difficulty === difficultyFilter;
      const matchesMastery = masteryFilter === 'all' || mastery === masteryFilter;
      const matchesFavorites = !favoritesOnly || favs.includes(word.index);

      return matchesSearch && matchesDifficulty && matchesMastery && matchesFavorites;
    });
  }
  return performance.now() - start;
}

function runOptimized(debouncedSearch, difficultyFilter, masteryFilter, favoritesOnly) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const favsArray = getFavorites();
    const favsSet = favoritesOnly ? new Set(favsArray) : null;
    const searchLower = debouncedSearch.toLowerCase();

    ALL_WORDS.filter(word => {
      if (favoritesOnly && !favsSet.has(word.index)) return false;
      if (difficultyFilter !== 'all' && word.difficulty !== difficultyFilter) return false;

      if (searchLower) {
        const matchesSearch = word.word.toLowerCase().includes(searchLower) ||
          word.explanation.toLowerCase().includes(searchLower) ||
          word.bengali.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (masteryFilter !== 'all') {
        const review = getWordReview(word.word);
        const mastery = review?.mastery_level || 'new';
        if (mastery !== masteryFilter) return false;
      }

      return true;
    });
  }
  return performance.now() - start;
}

console.log("Scenario 1: Search active");
let b1 = runBaseline("word99", "all", "all", false);
let o1 = runOptimized("word99", "all", "all", false);
console.log(`Baseline: ${b1.toFixed(2)}ms, Optimized: ${o1.toFixed(2)}ms, Improvement: ${(((b1 - o1) / b1) * 100).toFixed(2)}%`);

console.log("\nScenario 2: Favorites only active");
let b2 = runBaseline("", "all", "all", true);
let o2 = runOptimized("", "all", "all", true);
console.log(`Baseline: ${b2.toFixed(2)}ms, Optimized: ${o2.toFixed(2)}ms, Improvement: ${(((b2 - o2) / b2) * 100).toFixed(2)}%`);

console.log("\nScenario 3: Difficulty filter active");
let b3 = runBaseline("", "easy", "all", false);
let o3 = runOptimized("", "easy", "all", false);
console.log(`Baseline: ${b3.toFixed(2)}ms, Optimized: ${o3.toFixed(2)}ms, Improvement: ${(((b3 - o3) / b3) * 100).toFixed(2)}%`);

console.log("\nScenario 4: All active");
let b4 = runBaseline("word", "easy", "learning", true);
let o4 = runOptimized("word", "easy", "learning", true);
console.log(`Baseline: ${b4.toFixed(2)}ms, Optimized: ${o4.toFixed(2)}ms, Improvement: ${(((b4 - o4) / b4) * 100).toFixed(2)}%`);
