import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Volume2, Clock, Brain, BookOpen, CheckCircle2 } from 'lucide-react';
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

export default function Favorites() {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const { getWordReview } = useStudyEngine();

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const favoriteWords = useMemo(() => {
    return ALL_WORDS.filter(w => favorites.includes(w.index));
  }, [favorites]);

  const filteredWords = useMemo(() => {
    return favoriteWords.filter(word => {
      return word.word.toLowerCase().includes(search.toLowerCase()) || 
             word.explanation.toLowerCase().includes(search.toLowerCase()) ||
             word.bengali.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, favoriteWords]);

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <PageHeader
        title="Favorites"
        subtitle={`${favoriteWords.length} saved word${favoriteWords.length !== 1 ? 's' : ''}`}
        backTo="/words"
      />

      {/* Search */}
      <div className="p-5 rounded-3xl bg-card border border-border/50 shadow-md space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search favorites..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/30 border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 text-sm transition-all outline-none text-foreground placeholder:text-muted-foreground/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-widest pt-3 border-t border-border/30">
          <span>Showing {filteredWords.length} of {favoriteWords.length} favorites</span>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Word List */}
      <div className="space-y-16">
        {groupedWords.map((group) => (
          <div key={group.char} className="space-y-6">
            <div className="px-6">
              <h2 className="text-5xl sm:text-7xl font-serif text-premium font-bold text-primary/20 dark:text-primary/50 select-none tracking-tighter leading-none">
                {group.char}
              </h2>
            </div>
            <div className="space-y-3">
              {group.words.map((word) => {
                const meaning = word.explanation
                  .replace(new RegExp(`^${word.word}\\s+means\\s+(to\\s+)?`, 'i'), '')
                  .charAt(0).toUpperCase() + 
                  word.explanation.replace(new RegExp(`^${word.word}\\s+means\\s+(to\\s+)?`, 'i'), '').slice(1);

                const review = getWordReview(word.word);
                const mastery = review?.mastery_level || 'new';
                const mCfg = MASTERY_CONFIG[mastery];

                return (
                  <Link 
                    key={word.index} 
                    to={`/word/${word.index}`}
                    className={`word-card group grid grid-cols-1 md:grid-cols-[minmax(280px,max-content)_1fr_auto] items-baseline gap-y-2 gap-x-12 py-5 px-8 rounded-2xl bg-card/40 border border-border/30 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 ${mCfg.hoverBorder} ${mCfg.hoverBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
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
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredWords.length === 0 && favoriteWords.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-10 h-10 text-muted-foreground opacity-20" />
          </div>
          <div>
            <h3 className="text-xl font-bold">No matches found</h3>
            <p className="text-muted-foreground">Try a different search term.</p>
          </div>
        </div>
      )}

      {favoriteWords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Star className="w-10 h-10 text-muted-foreground opacity-20" />
          </div>
          <div>
            <h3 className="text-xl font-bold">No favorites yet</h3>
            <p className="text-muted-foreground">Star words in the dictionary to save them here.</p>
            <Link to="/words" className="inline-block mt-4 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
              Browse Dictionary
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
