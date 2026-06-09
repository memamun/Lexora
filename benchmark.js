import { performance } from 'perf_hooks';
import fs from 'fs';

// Mocking some data for benchmark
const ALL_WORDS = Array.from({ length: 10000 }, (_, i) => ({
  index: i,
  word: `Word${i}`,
  synonyms: [`Synonym${i}_1`, `Synonym${i}_2`, `Word${(i + 1) % 10000}`],
  antonyms: [`Antonym${i}_1`, `Word${(i + 2) % 10000}`]
}));

function oldWay(word) {
  let count = 0;
  word.synonyms.forEach(s => {
    const related = ALL_WORDS.find(w => w.word.toLowerCase() === s.toLowerCase());
    if (related) count++;
  });
  word.antonyms.forEach(a => {
    const related = ALL_WORDS.find(w => w.word.toLowerCase() === a.toLowerCase());
    if (related) count++;
  });
  return count;
}

const WORD_MAP_LOWER = ALL_WORDS.reduce((acc, w) => {
  acc[w.word.toLowerCase()] = w;
  return acc;
}, {});

function newWay(word) {
  let count = 0;
  word.synonyms.forEach(s => {
    const related = WORD_MAP_LOWER[s.toLowerCase()];
    if (related) count++;
  });
  word.antonyms.forEach(a => {
    const related = WORD_MAP_LOWER[a.toLowerCase()];
    if (related) count++;
  });
  return count;
}

const testWord = ALL_WORDS[500];

// Warmup
for (let i = 0; i < 100; i++) oldWay(testWord);
for (let i = 0; i < 100; i++) newWay(testWord);

const startOld = performance.now();
for (let i = 0; i < 1000; i++) {
  oldWay(testWord);
}
const endOld = performance.now();

const startNew = performance.now();
for (let i = 0; i < 1000; i++) {
  newWay(testWord);
}
const endNew = performance.now();

console.log(`Old way: ${(endOld - startOld).toFixed(2)}ms`);
console.log(`New way: ${(endNew - startNew).toFixed(2)}ms`);
console.log(`Improvement: ${(((endOld - startOld) - (endNew - startNew)) / (endOld - startOld) * 100).toFixed(2)}%`);
