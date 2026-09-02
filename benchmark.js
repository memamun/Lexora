import { performance } from 'perf_hooks';

// Mock ALL_WORDS and WORDS_BY_STR for demonstration
const ALL_WORDS = Array.from({ length: 5000 }, (_, i) => ({ word: `WORD${i}`, index: i }));
const WORDS_BY_STR = ALL_WORDS.reduce((acc, w) => {
  acc[w.word] = w;
  return acc;
}, {});

const wordsParam = Array.from({ length: 100 }, (_, i) => `WORD${Math.floor(Math.random() * 5000)}`).join(',');

function oldWay() {
  const names = wordsParam.split(',').filter(Boolean);
  return names.map(name => ALL_WORDS.find(w => w.word === name)).filter(Boolean);
}

function newWay() {
  const names = wordsParam.split(',').filter(Boolean);
  return names.map(name => WORDS_BY_STR[name]).filter(Boolean);
}

const ITERS = 10000;

let start = performance.now();
for (let i = 0; i < ITERS; i++) oldWay();
let end = performance.now();
const oldTime = end - start;
console.log(`Old Way: ${oldTime.toFixed(2)} ms`);

start = performance.now();
for (let i = 0; i < ITERS; i++) newWay();
end = performance.now();
const newTime = end - start;
console.log(`New Way: ${newTime.toFixed(2)} ms`);
console.log(`Improvement: ${(oldTime / newTime).toFixed(2)}x faster`);
