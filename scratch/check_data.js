import { ALL_WORDS } from './src/lib/wordData.js';
import { WORDS_PER_LEVEL } from './src/lib/constants.js';

console.log('Total Words:', ALL_WORDS.length);
console.log('Words per level:', WORDS_PER_LEVEL);
console.log('Sample word level:', ALL_WORDS[0].level);
console.log('Level 1 count:', ALL_WORDS.filter(w => w.level === 1).length);
