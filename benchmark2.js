import fs from 'fs';

// Quick hacky parser to load the array for benchmark
const rawWordData = fs.readFileSync('./src/lib/wordData.js', 'utf8');
const wordsMatch = rawWordData.match(/export const ALL_WORDS = (\[[\s\S]*?\]);\n/);

let ALL_WORDS;
if (wordsMatch) {
    // we need to evaluate the array
    try {
        ALL_WORDS = eval(wordsMatch[1]);
    } catch (e) {
        console.error("eval failed", e);
    }
}

if (!ALL_WORDS) {
    console.error("Could not load ALL_WORDS");
    process.exit(1);
}

const WORDS_BY_STR = ALL_WORDS.reduce((acc, w) => {
  acc[w.word] = w;
  return acc;
}, {});

// Randomly select 100 words from ALL_WORDS
const wordsParam = Array.from({ length: 100 }, () => ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)].word).join(',');

const names = wordsParam.split(',').filter(Boolean);

console.time('find (O(N^2))');
for (let i = 0; i < 1000; i++) {
  names.map(name => ALL_WORDS.find(w => w.word === name)).filter(Boolean);
}
console.timeEnd('find (O(N^2))');

console.time('lookup (O(N))');
for (let i = 0; i < 1000; i++) {
  names.map(name => WORDS_BY_STR[name]).filter(Boolean);
}
console.timeEnd('lookup (O(N))');
