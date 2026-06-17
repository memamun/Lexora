import { ALL_WORDS, WORDS_BY_STR } from './src/lib/wordData.js';

// Randomly select 100 words from ALL_WORDS
const wordsParam = Array.from({ length: 100 }, () => ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)].word).join(',');

const names = wordsParam.split(',').filter(Boolean);

console.time('find');
for (let i = 0; i < 1000; i++) {
  names.map(name => ALL_WORDS.find(w => w.word === name)).filter(Boolean);
}
console.timeEnd('find');

console.time('lookup');
for (let i = 0; i < 1000; i++) {
  names.map(name => WORDS_BY_STR[name]).filter(Boolean);
}
console.timeEnd('lookup');
