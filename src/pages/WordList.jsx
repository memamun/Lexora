import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Clock, Brain, CheckCircle2, Volume2, Star } from 'lucide-react';
import { ALL_WORDS } from '@/lib/wordData';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { speak } from '@/utils/audio';
import PageHeader from '@/components/layout/PageHeader';

const getFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem('lexora-favorites') || '[]');
  } catch { return []; }
};

const MASTERY_CONFIG = {
  new: {
    label: 'New',
    color: 'text-muted-foreground dark:text-muted-foreground/80',
    bg: 'bg-muted/30 border-muted-foreground/10',
    hoverBorder: 'hover:border-muted-foreground/30',
    hoverBg: 'hover:bg-muted/[0.02]',
    icon: Clock
  },
  learning: {
    label: 'Learning',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    hoverBorder: 'hover:border-blue-500/35 dark:hover:border-blue-400/40',
    hoverBg: 'hover:bg-blue-500/[0.03] dark:hover:bg-blue-400/[0.02]',
    icon: Brain
  },
  reviewing: {
    label: 'Reviewing',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    hoverBorder: 'hover:border-amber-500/35 dark:hover:border-amber-400/40',
    hoverBg: 'hover:bg-amber-500/[0.03] dark:hover:bg-amber-400/[0.02]',
    icon: BookOpen
  },
  mastered: {
    label: 'Mastered',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-500/35 dark:hover:border-emerald-400/40',
    hoverBg: 'hover:bg-emerald-500/[0.03] dark:hover:bg-emerald-400/[0.02]',
    icon: CheckCircle2
  },
};

const WordRow = React.memo(function WordRow({ word, review }) {
  const meaning = useMemo(() => {
    return word.explanation
      .replace(new RegExp(`^${word.word}\\s+means\\s+(to\\s+)?`, 'i'), '')
      .charAt(0).toUpperCase() +
      word.explanation.replace(new RegExp(`^${word.word}\\s+means\\s+(to\\s+)?`, 'i'), '').slice(1);
  }, [word.explanation, word.word]);

  const mastery = review?.mastery_level || 'new';
  const mCfg = MASTERY_CONFIG[mastery] || MASTERY_CONFIG.new;

  return (
    <Link
      to={`/word/${word.index}`}
      className={`word-card group grid grid-cols-1 md:grid-cols-[minmax(280px,max-content)_1fr_auto] items-baseline gap-y-2 gap-x-12 py-5 px-8 rounded-2xl bg-card/40 border border-border/30 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 print-grid ${mCfg.hoverBorder} ${mCfg.hoverBg}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl md:text-3xl font-serif text-premium font-bold text-primary tracking-tight uppercase group-hover:translate-x-1 transition-transform duration-300">
          {word.word}
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            speak(word.word);
          }}
          className="no-print p-1 hover:text-primary text-muted-foreground/60 transition-colors duration-200"
          title="Pronounce Word"
        >
          <Volume2 className="w-4 h-4" />
        </button>
        <div className={`no-print px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-current/10 ${mCfg.bg} ${mCfg.color}`}>
          <mCfg.icon className="w-2.5 h-2.5" />
          {mCfg.label}
        </div>
      </div>
      <span className="text-lg md:text-xl text-foreground/50 leading-snug group-hover:text-foreground/80 transition-colors">
        {meaning}
      </span>
      <div className="flex items-center w-full justify-start md:justify-end mt-1 md:mt-0">
        <span className="text-sm md:text-base font-bengali text-accent dark:text-accent-foreground font-semibold bg-accent/5 border border-accent/15 rounded-xl px-3.5 py-1.5 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all duration-300">
          {word.bengali}
        </span>
      </div>
    </Link>
  );
});

export default function WordList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showGuide, setShowGuide] = useState(() => {
    try {
      return !localStorage.getItem('lexora-mobile-gesture-guide');
    } catch { return true; }
  });
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [masteryFilter, setMasteryFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { getWordReview } = useStudyEngine();

  const debounceRef = React.useRef(null);
  const handleSearch = useCallback((val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 200);
  }, []);

  React.useEffect(() => () => clearTimeout(debounceRef.current), []);

  const filteredWords = useMemo(() => {
    const favs = getFavorites();
    const searchLower = debouncedSearch.toLowerCase();
    return ALL_WORDS.filter(word => {
      const review = getWordReview(word.word);
      const mastery = review?.mastery_level || 'new';

      const matchesSearch = !searchLower || word.word.toLowerCase().includes(searchLower) ||
        word.explanation.toLowerCase().includes(searchLower) ||
        word.bengali.toLowerCase().includes(searchLower);
      const matchesDifficulty = difficultyFilter === 'all' || word.difficulty === difficultyFilter;
      const matchesMastery = masteryFilter === 'all' || mastery === masteryFilter;
      const matchesFavorites = !favoritesOnly || favs.includes(word.index);

      return matchesSearch && matchesDifficulty && matchesMastery && matchesFavorites;
    });
  }, [debouncedSearch, difficultyFilter, masteryFilter, favoritesOnly, getWordReview]);

  const groupedWords = useMemo(() => {
    const groups = {};
    filteredWords.forEach(word => {
      const char = word.word.charAt(0).toUpperCase();
      if (!groups[char]) groups[char] = [];
      groups[char].push(word);
    });
    return Object.keys(groups).sort().map(char => ({
      char,
      words: groups[char]
    }));
  }, [filteredWords]);

  const availableLetters = useMemo(() => {
    return groupedWords.map(g => g.char);
  }, [groupedWords]);

  const scrollToLetter = (char) => {
    const element = document.getElementById(`letter-${char}`);
    if (element) {
      const yOffset = -90; // Adjust for sticky filters and header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 print:pb-0 print-full-width relative">
      {/* Print-only Watermark */}
      <div className="hidden print:block print-watermark" aria-hidden="true">
        LEXORA
      </div>

      {/* Premium Header & Search/Filters Panel */}
      <div className="space-y-6 no-print">
        <PageHeader
          title="Dictionary"
          subtitle="Explore the complete Lexora vocabulary"
          showHamburger={true}
        />

        {showGuide && (
          <div className="block sm:hidden p-4 bg-primary/10 border border-primary/20 rounded-2xl relative overflow-hidden group mb-2 no-print">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Brain className="w-4.5 h-4.5 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Mobile Gestures Guide</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Swipe left or right inside a word's detail screen to browse the next or previous words easily!
                </p>
                <button 
                  onClick={() => {
                    setShowGuide(false);
                    try {
                      localStorage.setItem('lexora-mobile-gesture-guide', 'true');
                    } catch {}
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline pt-1 cursor-pointer"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Search & Filters Card */}
        <div className="p-5 rounded-3xl bg-card border border-border/50 shadow-md space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search words, meanings, or translation..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/30 border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 text-sm transition-all outline-none text-foreground placeholder:text-muted-foreground/60"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0 mb-1 sm:mb-0 mr-1">Difficulty:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'foundation', label: 'Foundation' },
                  { id: 'advanced', label: 'Advanced' },
                  { id: 'exam-level', label: 'Exam Level' }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficultyFilter(d.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border shrink-0 ${difficultyFilter === d.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/10'
                        : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-border/40 hover:bg-secondary/70'
                      }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0 mb-1 sm:mb-0 mr-1">Mastery:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'new', label: 'New' },
                  { id: 'learning', label: 'Learning' },
                  { id: 'reviewing', label: 'Reviewing' },
                  { id: 'mastered', label: 'Mastered' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMasteryFilter(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border shrink-0 ${masteryFilter === m.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/10'
                        : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-border/40 hover:bg-secondary/70'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Favorites Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border shrink-0 ${favoritesOnly
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10'
                  : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-border/40 hover:bg-secondary/70'
                }`}
            >
              <Star className={`w-3 h-3 ${favoritesOnly ? 'fill-amber-500 dark:fill-amber-400' : ''}`} />
              Favorites
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-widest pt-3 border-t border-border/30">
            <span>Showing {filteredWords.length} of {ALL_WORDS.length} words</span>
            {(search || difficultyFilter !== 'all' || masteryFilter !== 'all' || favoritesOnly) && (
              <button
                onClick={() => {
                  setSearch('');
                  setDifficultyFilter('all');
                  setMasteryFilter('all');
                  setFavoritesOnly(false);
                }}
                className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Quick A-Z Jump Sidebar (Desktop) */}
      {availableLetters.length > 1 && (
        <div className="hidden xl:flex flex-col fixed right-8 top-1/2 -translate-y-1/2 bg-card/65 backdrop-blur-xl border border-border/50 rounded-2xl p-2.5 gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-30 select-none w-10 items-center">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(char => {
            const active = availableLetters.includes(char);
            return (
              <button
                key={char}
                onClick={() => active && scrollToLetter(char)}
                disabled={!active}
                className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all ${active
                    ? 'text-primary hover:bg-primary/10 cursor-pointer hover:scale-110 active:scale-95'
                    : 'text-muted-foreground/35 pointer-events-none'
                  }`}
              >
                {char}
              </button>
            );
          })}
        </div>
      )}

      {/* Sticky A-Z Horizontal Jump Bar (Mobile/Tablet) */}
      {availableLetters.length > 1 && (
        <div className="flex xl:hidden overflow-x-auto scrollbar-hide py-2.5 gap-2 bg-card/75 border-y border-border/30 px-4 sticky top-[56px] z-20 select-none items-center shadow-sm backdrop-blur-xl no-print">
          <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mr-1.5 shrink-0">Jump To:</span>
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(char => {
            const active = availableLetters.includes(char);
            return (
              <button
                key={char}
                onClick={() => active && scrollToLetter(char)}
                disabled={!active}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 transition-all ${active
                    ? 'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95'
                    : 'text-muted-foreground/30 pointer-events-none'
                  }`}
              >
                {char}
              </button>
            );
          })}
        </div>
      )}

      {/* Print-only Title */}
      <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
        <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Vocabulary List</h1>
        <p className="text-gray-600 mt-1">A curated dictionary for comprehensive exam preparation.</p>
      </div>

      {/* Print-only Column Headers */}
      <div className="hidden print:print-header">
        <span>Word</span>
        <span>Meaning</span>
        <span>Translation</span>
      </div>

      {/* List */}
      <div className="space-y-16 print:space-y-8">
        {groupedWords.map((group) => (
          <div key={group.char} id={`letter-${group.char}`} className="space-y-6 scroll-mt-24">
            <div className="px-6">
              <h2 className="text-5xl sm:text-7xl font-serif text-premium font-bold text-primary/40 dark:text-primary/50 select-none tracking-tighter leading-none">
                {group.char}
              </h2>
            </div>
            <div className="space-y-3">
              {group.words.map((word) => (
                <WordRow key={word.index} word={word} review={getWordReview(word.word)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 no-print">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-10 h-10 text-muted-foreground opacity-20" />
          </div>
          <div>
            <h3 className="text-xl font-bold">No words found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
