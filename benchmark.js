const { performance } = require('perf_hooks');

const ALL_WORDS = Array.from({ length: 50000 }, (_, i) => ({ index: i, word: `word${i}` }));
const pool = ALL_WORDS.slice(0, 9); // Weak words

function shuffle(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function baseline() {
  const start = performance.now();
  const extra = shuffle(ALL_WORDS).filter(w => !pool.find(p => p.index === w.index));
  const end = performance.now();
  return end - start;
}

function optimized() {
  const start = performance.now();
  const poolIndices = new Set(pool.map(p => p.index));
  const extra = shuffle(ALL_WORDS).filter(w => !poolIndices.has(w.index));
  const end = performance.now();
  return end - start;
}

console.log('Baseline:', baseline(), 'ms');
console.log('Optimized:', optimized(), 'ms');
