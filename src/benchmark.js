import { ALL_WORDS } from './lib/wordData.js';

const distractorPool = [];
const distractors = Array.from(new Set(distractorPool));
const correct = 'some_correct_answer';

function runBaseline() {
  return Array.from(new Set(ALL_WORDS.map(w => w.options?.[w.answer]).filter(Boolean)))
    .filter(m => m !== correct && !distractors.includes(m));
}

function runOptimized() {
  const allMeaningsSet = new Set();
  for (const w of ALL_WORDS) {
    const meaning = w.options?.[w.answer];
    if (meaning && meaning !== correct && !distractors.includes(meaning)) {
      allMeaningsSet.add(meaning);
    }
  }
  return Array.from(allMeaningsSet);
}

// Ensure both produce same results
const r1 = runBaseline().sort();
const r2 = runOptimized().sort();
console.log('Results match:', JSON.stringify(r1) === JSON.stringify(r2));

// Run tests
const ITERATIONS = 100;
let baselineTime = 0;
let optimizedTime = 0;

for (let j = 0; j < 10; j++) {
  const startB = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    runBaseline();
  }
  baselineTime += performance.now() - startB;

  const startO = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    runOptimized();
  }
  optimizedTime += performance.now() - startO;
}

console.log('Baseline total:', baselineTime.toFixed(2), 'ms');
console.log('Optimized total:', optimizedTime.toFixed(2), 'ms');
console.log('Speedup:', (baselineTime / optimizedTime).toFixed(2), 'x');
