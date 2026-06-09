import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Attempting another way to run benchmark. Let's just create a mock ALL_WORDS and cluster.

const ALL_WORDS = [];
for (let i = 0; i < 5000; i++) {
  ALL_WORDS.push({
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
        const foundWord = ALL_WORDS.find(w => w.word === cw);
        return foundWord?.options?.[foundWord?.answer];
      })
      .filter(m => m && m !== correct)
  ];
  return distractorPool;
}

const ALL_WORDS_MAP = new Map(ALL_WORDS.map(w => [w.word, w]));

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


const testWords = ALL_WORDS.slice(0, 100);

const t0 = performance.now();
for (let i = 0; i < 1000; i++) {
  testWords.forEach(w => buildMCQ_original(w));
}
const t1 = performance.now();
console.log("Original:", t1 - t0, "ms");

const t2 = performance.now();
for (let i = 0; i < 1000; i++) {
  testWords.forEach(w => buildMCQ_optimized(w));
}
const t3 = performance.now();
console.log("Optimized:", t3 - t2, "ms");
