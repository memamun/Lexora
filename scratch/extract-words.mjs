import { ALL_WORDS } from '../src/lib/wordData.js';
import fs from 'fs';

fs.writeFileSync('public/data/words.json', JSON.stringify(ALL_WORDS, null, 2));
console.log('Extracted', ALL_WORDS.length, 'words to public/data/words.json');
