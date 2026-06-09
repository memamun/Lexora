const { performance } = require('perf_hooks');

const iterations = 1000;
const ALL_WORDS = Array.from({ length: 5000 }, (_, i) => ({ index: i, word: `word${i}` }));

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function runBaseline() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    let pool = ALL_WORDS.slice(0, 10); // simulate 10 weak words
    if (pool.length < 15) {
      const extra = shuffle([...ALL_WORDS]).filter(w => !pool.find(p => p.index === w.index));
      pool = [...pool, ...extra.slice(0, 15 - pool.length)];
    }
  }
  return performance.now() - start;
}

function runOptimized() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    let pool = ALL_WORDS.slice(0, 10); // simulate 10 weak words
    if (pool.length < 15) {
      const poolIndices = new Set(pool.map(p => p.index));
      const extra = shuffle([...ALL_WORDS]).filter(w => !poolIndices.has(w.index));
      pool = [...pool, ...extra.slice(0, 15 - pool.length)];
    }
  }
  return performance.now() - start;
}

console.log("Running baseline...");
const baseline = runBaseline();
console.log(`Baseline: ${baseline.toFixed(2)}ms`);

console.log("Running optimized...");
const optimized = runOptimized();
console.log(`Optimized: ${optimized.toFixed(2)}ms`);

const improvement = ((baseline - optimized) / baseline) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
