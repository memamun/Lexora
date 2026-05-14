import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, ChevronRight, BookOpen, Star, Clock } from 'lucide-react';
import { ALL_WORDS, DIFFICULTY_MAP } from '@/lib/wordData';
import { useStudyEngine } from '@/lib/useStudyEngine';

export default function WordList() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, hard, medium, easy
  const { getWordReview } = useStudyEngine();

  const filteredWords = useMemo(() => {
    return ALL_WORDS.filter(word => {
      const matchesSearch = word.word.toLowerCase().includes(search.toLowerCase()) || 
                          word.explanation.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || word.difficulty === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

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
    <div className="max-w-5xl mx-auto space-y-8 pb-24 print:pb-0 print-full-width relative">
      {/* Print-only Watermark */}
      <div className="hidden print:block print-watermark" aria-hidden="true">
        LEXORA
      </div>
      {/* Header & Search */}
      <div className="space-y-6 no-print">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Dictionary</h1>
          <p className="text-muted-foreground mt-1">Explore {ALL_WORDS.length} curated words for your vocabulary growth.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search words or meanings..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-4 rounded-2xl bg-card border border-border/50 focus:border-primary/50 outline-none font-medium text-sm appearance-none min-w-[140px] text-center"
            >
              <option value="all">All Levels</option>
              <option value="foundation">Foundation</option>
              <option value="advanced">Advanced</option>
              <option value="exam-level">Exam Level</option>
            </select>
            <button className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
              <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

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
          <div key={group.char} className="space-y-6">
            <div className="px-6">
              <h2 className="text-8xl font-black text-white/15 select-none tracking-tighter leading-none">
                {group.char}
              </h2>
            </div>
            <div className="space-y-0">
              {group.words.map((word) => {
                const meaning = word.explanation
                  .replace(new RegExp(`^${word.word}\\s+means\\s+(to\\s+)?`, 'i'), '')
                  .charAt(0).toUpperCase() + 
                  word.explanation.replace(new RegExp(`^${word.word}\\s+means\\s+(to\\s+)?`, 'i'), '').slice(1);

                return (
                  <Link 
                    key={word.index} 
                    to={`/word/${word.index}`}
                    className="group grid grid-cols-1 md:grid-cols-[minmax(280px,max-content)_1fr_auto] items-baseline gap-y-2 gap-x-16 py-5 px-8 rounded-2xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/[0.05] print-grid"
                  >
                    <span className="text-2xl md:text-3xl font-black text-primary tracking-tight uppercase group-hover:translate-x-1 transition-transform duration-300">
                      {word.word}
                    </span>
                    <span className="text-lg md:text-xl text-foreground/50 leading-snug group-hover:text-foreground/80 transition-colors">
                      {meaning}
                    </span>
                    <span className="text-lg md:text-2xl font-bengali text-accent/60 font-medium whitespace-nowrap mt-1 md:mt-0 text-right group-hover:text-accent transition-colors">
                      {word.bengali}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
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
