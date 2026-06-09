const { performance } = require('perf_hooks');

const iterations = 100000;
// We'll simulate 50 items to show a clearer performance difference,
// though the app might use 6 at a time, the principle remains.
const size = 50;
const words = Array.from({ length: size }, (_, i) => ({ index: i }));
const meanings = Array.from({ length: size }, (_, i) => ({ index: i }));
const pendingMatches = Array.from({ length: size / 2 }, (_, i) => ({
  wordIndex: i * 2,
  meaningIndex: i * 2 + 1
}));

function runBaseline() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    let dummy = 0;
    words.forEach(w => {
      const match = pendingMatches.find(m => m.wordIndex === w.index);
      if (match) dummy++;
    });
    meanings.forEach(w => {
      const match = pendingMatches.find(m => m.meaningIndex === w.index);
      if (match) dummy++;
    });
  }
  return performance.now() - start;
}

function runOptimized() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    let dummy = 0;
    const pendingMatchesByWord = new Map();
    const pendingMatchesByMeaning = new Map();
    for (const m of pendingMatches) {
      pendingMatchesByWord.set(m.wordIndex, m);
      pendingMatchesByMeaning.set(m.meaningIndex, m);
    }

    words.forEach(w => {
      const match = pendingMatchesByWord.get(w.index);
      if (match) dummy++;
    });
    meanings.forEach(w => {
      const match = pendingMatchesByMeaning.get(w.index);
      if (match) dummy++;
    });
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
