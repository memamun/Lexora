import { WORDS_PER_LEVEL, TOTAL_LEVELS } from './constants';
export { calculateNextReview } from './srs';

// ─── Synchronous exports (tiny, always available) ───

export const LEVELS = Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
  number: i + 1,
  title: `Level ${i + 1}`,
  wordIndices: Array.from({ length: WORDS_PER_LEVEL }, (_, j) => i * WORDS_PER_LEVEL + j),
  difficulty: i < 5 ? 'foundation' : i < 10 ? 'advanced' : 'exam-level'
}));

export const DIFFICULTY_MAP = {
  'foundation': { label: 'Foundation', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
  'advanced': { label: 'Advanced', color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  'exam-level': { label: 'Exam Level', color: 'text-warning', bg: 'bg-warning/25', border: 'border-warning/20' }
};

export const WORD_COUNT = WORDS_PER_LEVEL * TOTAL_LEVELS; // 300

export const CONFUSION_CLUSTERS = [
  ['LACONIC', 'TACITURN', 'RETICENT', 'CONCISE', 'BREVITY'],
  ['GARRULOUS', 'LOQUACIOUS', 'VERBOSE'],
  ['ADAMANT', 'OBDURATE', 'INTRANSIGENT', 'OBSTINATE', 'RIGID'],
  ['AFFLUENT', 'MUNIFICENT', 'PROFUSE', 'COPIOUS'],
  ['INDIGENT', 'IMPECUNIOUS', 'MEAGER', 'SCARCE', 'DEARTH', 'SPARSE'],
  ['CAPRICIOUS', 'FICKLE', 'MERCURIAL', 'VOLATILE', 'VACILLATE'],
  ['METICULOUS', 'FASTIDIOUS', 'SCRUPULOUS', 'ASSIDUOUS', 'DILIGENT'],
  ['DISPARAGE', 'DERIDE', 'MALIGN', 'DEFAMATION', 'SLANDER', 'CENSURE'],
  ['PLACATE', 'APPEASE', 'MITIGATE', 'ALLEVIATE', 'AMELIORATE'],
  ['MOROSE', 'DISMAL', 'MELANCHOLY', 'GRIM', 'SOLEMN'],
  ['BELLIGERENT', 'TRUCULENT', 'HOSTILE', 'CAUSTIC', 'ACRIMONIOUS'],
  ['EPHEMERAL', 'SPORADIC'],
  ['PRAGMATIC', 'JUDICIOUS', 'PRUDENT', 'SHREWD'],
  ['EXTOL', 'EULOGY', 'ACCLAIM', 'EXALT'],
  ['ABSOLVE', 'EXONERATE', 'VINDICATE', 'CONDONE', 'CLEMENCY'],
];

export function getConfusionCluster(word) {
  const upper = word.toUpperCase();
  return CONFUSION_CLUSTERS.find(c => c.includes(upper)) || [];
}

// ─── Async word data (loaded on demand, cached in memory) ───

let _allWords = null;
let _wordsByStr = null;
let _wordsByStrLower = null;
let _loadPromise = null;

export async function loadWordData() {
  if (_allWords) return _allWords;
  if (_loadPromise) return _loadPromise;
  _loadPromise = fetch('/data/words.json')
    .then(r => r.json())
    .then(data => {
      _allWords = data;
      _wordsByStr = data.reduce((acc, w) => { acc[w.word] = w; return acc; }, {});
      _wordsByStrLower = data.reduce((acc, w) => { acc[w.word.toLowerCase()] = w; return acc; }, {});
      _loadPromise = null;
      return data;
    });
  return _loadPromise;
}

// Synchronous getters (return null until loaded — consumers must await loadWordData first)
export function getAllWords() { return _allWords || []; }
export function getWordsByStr() { return _wordsByStr || {}; }
export function getWordsByStrLower() { return _wordsByStrLower || {}; }

// Legacy compatibility (for code that uses ALL_WORDS directly)
// This will be populated after loadWordData() is called
export let ALL_WORDS = [];
export let WORDS_BY_STR = {};
export let WORDS_BY_STR_LOWER = {};

// Called once during app initialization
export async function initWordData() {
  const data = await loadWordData();
  ALL_WORDS = data;
  WORDS_BY_STR = _wordsByStr;
  WORDS_BY_STR_LOWER = _wordsByStrLower;
  return data;
}