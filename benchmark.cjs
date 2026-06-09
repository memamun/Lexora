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

function runBenchmark() {
  const baselineTimes = [];
  const optimizedTimes = [];

  for (let i = 0; i < 10; i++) {
    const start1 = performance.now();
    const extra1 = shuffle(ALL_WORDS).filter(w => !pool.find(p => p.index === w.index));
    baselineTimes.push(performance.now() - start1);

    const start2 = performance.now();
    const poolIndices = new Set(pool.map(p => p.index));
    const extra2 = shuffle(ALL_WORDS).filter(w => !poolIndices.has(w.index));
    optimizedTimes.push(performance.now() - start2);
  }

  const avgBaseline = baselineTimes.reduce((a, b) => a + b) / baselineTimes.length;
  const avgOptimized = optimizedTimes.reduce((a, b) => a + b) / optimizedTimes.length;

  console.log(`Average Baseline: ${avgBaseline.toFixed(2)} ms`);
  console.log(`Average Optimized: ${avgOptimized.toFixed(2)} ms`);
  console.log(`Improvement: ${((avgBaseline - avgOptimized) / avgBaseline * 100).toFixed(2)}%`);
}

runBenchmark();
