import { performance } from 'perf_hooks';
import { ALL_WORDS } from './src/lib/wordData.js';

// --- Synonym/Antonym O(1) Lookup Benchmark with Mock Data ---
function benchmarkMockLookup() {
  const MOCK_ALL_WORDS = Array.from({ length: 10000 }, (_, i) => ({
    index: i,
    word: `Word${i}`,
    synonyms: [`Synonym${i}_1`, `Synonym${i}_2`, `Word${(i + 1) % 10000}`],
    antonyms: [`Antonym${i}_1`, `Word${(i + 2) % 10000}`]
  }));

  function oldWay(word) {
    let count = 0;
    word.synonyms.forEach(s => {
      const related = MOCK_ALL_WORDS.find(w => w.word.toLowerCase() === s.toLowerCase());
      if (related) count++;
    });
    word.antonyms.forEach(a => {
      const related = MOCK_ALL_WORDS.find(w => w.word.toLowerCase() === a.toLowerCase());
      if (related) count++;
    });
    return count;
  }

  const WORD_MAP_LOWER = MOCK_ALL_WORDS.reduce((acc, w) => {
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

  const testWord = MOCK_ALL_WORDS[500];

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

  console.log(`WordDetail O(N) Old way: ${(endOld - startOld).toFixed(2)}ms`);
  console.log(`WordDetail O(1) New way: ${(endNew - startNew).toFixed(2)}ms`);
  console.log(`Improvement: ${(((endOld - startOld) - (endNew - startNew)) / (endOld - startOld) * 100).toFixed(2)}%`);
}

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
  console.log("MCQ Original:", (t1 - t0).toFixed(2), "ms");

  const t2 = performance.now();
  for (let i = 0; i < 1000; i++) {
    testWords.forEach(w => buildMCQ_optimized(w));
  }
  const t3 = performance.now();
  console.log("MCQ Optimized:", (t3 - t2).toFixed(2), "ms");
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

console.log("--- Running WordDetail Lookup Benchmarks ---");
benchmarkMockLookup();
console.log("\n--- Running MCQ Benchmarks ---");
benchmarkMCQ();
console.log("\n--- Running Synonym/Antonym Benchmarks ---");
benchmarkFind();
benchmarkMap();

// --- Matching Drill Benchmark ---
function benchmarkMatchingDrill() {
  const pairs = Array.from({ length: 6 }, (_, i) => ({ index: i, word: `word${i}` }));
  const pendingMatches = Array.from({ length: 6 }, (_, i) => ({ wordIndex: i, meaningIndex: i }));

  const iterations = 100000;

  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    pendingMatches.map(m => {
      const word = pairs.find(p => p.index === m.wordIndex);
      const meaning = pairs.find(p => p.index === m.meaningIndex);
    });
  }
  const endOld = performance.now();

  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
    const pairsByIndex = new Map(pairs.map(p => [p.index, p]));
    pendingMatches.map(m => {
      const word = pairsByIndex.get(m.wordIndex);
      const meaning = pairsByIndex.get(m.meaningIndex);
    });
  }
  const endNew = performance.now();

  const startMemo = performance.now();
  const pairsByIndex = new Map(pairs.map(p => [p.index, p]));
  for (let i = 0; i < iterations; i++) {
    pendingMatches.map(m => {
      const word = pairsByIndex.get(m.wordIndex);
      const meaning = pairsByIndex.get(m.meaningIndex);
    });
  }
  const endMemo = performance.now();

  console.log(`MatchingDrill O(N) Old way: ${(endOld - startOld).toFixed(2)}ms`);
  console.log(`MatchingDrill O(1) New way (map re-created): ${(endNew - startNew).toFixed(2)}ms`);
  console.log(`MatchingDrill O(1) Memoized New way: ${(endMemo - startMemo).toFixed(2)}ms`);
}

console.log("\n--- Running Matching Drill Benchmark ---");
benchmarkMatchingDrill();
