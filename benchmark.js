import { performance } from 'perf_hooks';

// Need to mock or just import the data
import { ALL_WORDS } from './src/lib/wordData.js';

function benchmarkFind() {
  const start = performance.now();
  let count = 0;
  for (let i = 0; i < 10000; i++) {
    for (const word of ALL_WORDS) {
      if (word.antonyms) {
        word.antonyms.forEach(a => {
          const related = ALL_WORDS.find(w => w.word.toLowerCase() === a.toLowerCase());
          if (related) count++;
        });
      }
      if (word.synonyms) {
        word.synonyms.forEach(s => {
          const related = ALL_WORDS.find(w => w.word.toLowerCase() === s.toLowerCase());
          if (related) count++;
        });
      }
    }
  }
  const end = performance.now();
  console.log(`Array.find(): ${(end - start).toFixed(2)}ms, count: ${count}`);
}

const WORD_MAP = new Map(ALL_WORDS.map(w => [w.word.toLowerCase(), w]));

function benchmarkMap() {
  const start = performance.now();
  let count = 0;
  for (let i = 0; i < 10000; i++) {
    for (const word of ALL_WORDS) {
      if (word.antonyms) {
        word.antonyms.forEach(a => {
          const related = WORD_MAP.get(a.toLowerCase());
          if (related) count++;
        });
      }
      if (word.synonyms) {
        word.synonyms.forEach(s => {
          const related = WORD_MAP.get(s.toLowerCase());
          if (related) count++;
        });
      }
    }
  }
  const end = performance.now();
  console.log(`Map.get(): ${(end - start).toFixed(2)}ms, count: ${count}`);
}

benchmarkFind();
benchmarkMap();
