import { performance } from 'perf_hooks';
import { ALL_WORDS } from './src/lib/wordData.js';

// --- MCQ Distractor Benchmark ---
function benchmarkMCQ() {
  const wordsMock = [];
  for (let i = 0; i < 5000; i++) {
    wordsMock.push({
      word: `word_${i}`,
      options: {
        A: `meaning_A_${i}`,
        B: `meaning_B_${i}`,
        C: `meaning_C_${i}`,
        D: `meaning_D_${i}`
      },
      answer: 'A'
    });
  }

  const getConfusionCluster = (word) => {
    const cluster = [];
    for(let i=0; i<10; i++) {
      cluster.push(`word_${Math.floor(Math.random() * 5000)}`);
    }
    return cluster;
  };

  function buildMCQ_original(word) {
    const correct = word.options?.[word.answer] || word.answer;
    let curatedDistractors = [];
    if (word.options) {
      curatedDistractors = Object.values(word.options).filter(m => m !== correct);
    }
    const cluster = getConfusionCluster(word.word);

    let distractorPool = [
      ...curatedDistractors,
      ...cluster
        .filter(w => w !== word.word)
        .map(cw => {
          const foundWord = wordsMock.find(w => w.word === cw);
          return foundWord?.options?.[foundWord?.answer];
        })
        .filter(m => m && m !== correct)
    ];
    return distractorPool;
  }

  const ALL_WORDS_MAP = new Map(wordsMock.map(w => [w.word, w]));

  function buildMCQ_optimized(word) {
    const correct = word.options?.[word.answer] || word.answer;
    let curatedDistractors = [];
    if (word.options) {
      curatedDistractors = Object.values(word.options).filter(m => m !== correct);
    }
    const cluster = getConfusionCluster(word.word);

    let distractorPool = [
      ...curatedDistractors,
      ...cluster
        .filter(w => w !== word.word)
        .map(cw => {
          const foundWord = ALL_WORDS_MAP.get(cw);
          return foundWord?.options?.[foundWord?.answer];
        })
        .filter(m => m && m !== correct)
    ];
    return distractorPool;
  }

  const testWords = wordsMock.slice(0, 100);

  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    testWords.forEach(w => buildMCQ_original(w));
  }
  const t1 = performance.now();
  console.log("MCQ Original:", t1 - t0, "ms");

  const t2 = performance.now();
  for (let i = 0; i < 1000; i++) {
    testWords.forEach(w => buildMCQ_optimized(w));
  }
  const t3 = performance.now();
  console.log("MCQ Optimized:", t3 - t2, "ms");
}

// --- Synonym/Antonym Benchmark ---
function benchmarkFind() {
  const start = performance.now();
  let count = 0;
  for (let i = 0; i < 100; i++) {
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
  for (let i = 0; i < 100; i++) {
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

console.log("--- Running MCQ Benchmarks ---");
benchmarkMCQ();
console.log("\n--- Running Synonym/Antonym Benchmarks ---");
benchmarkFind();
benchmarkMap();
