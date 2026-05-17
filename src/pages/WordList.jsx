import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, BookOpen, Clock, Brain, CheckCircle2 } from 'lucide-react';
import { ALL_WORDS } from '@/lib/wordData';
import { useStudyEngine } from '@/lib/useStudyEngine';

const MASTERY_CONFIG = {
  new: { label: 'New', color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Clock },
  learning: { label: 'Learning', color: 'text-warning', bg: 'bg-warning/10', icon: Brain },
  reviewing: { label: 'Reviewing', color: 'text-primary', bg: 'bg-primary/10', icon: BookOpen },
  mastered: { label: 'Mastered', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
};

export default function WordList() {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [masteryFilter, setMasteryFilter] = useState('all');
  const { getWordReview } = useStudyEngine();

  const filteredWords = useMemo(() => {
    return ALL_WORDS.filter(word => {
      const review = getWordReview(word.word);
      const mastery = review?.mastery_level || 'new';

      const matchesSearch = word.word.toLowerCase().includes(search.toLowerCase()) || 
                          word.explanation.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || word.difficulty === difficultyFilter;
      const matchesMastery = masteryFilter === 'all' || mastery === masteryFilter;

      return matchesSearch && matchesDifficulty && matchesMastery;
    });
  }, [search, difficultyFilter, masteryFilter, getWordReview]);

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

        <div className="flex flex-col space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search words or meanings..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/50 focus:border-primary/50 outline-none text-xs font-bold uppercase tracking-wider appearance-none min-w-[140px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <option value="all">All Difficulties</option>
                <option value="foundation">Foundation</option>
                <option value="advanced">Advanced</option>
                <option value="exam-level">Exam Level</option>
              </select>
            </div>

            <div className="relative">
              <Brain className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select 
                value={masteryFilter}
                onChange={(e) => setMasteryFilter(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/50 focus:border-primary/50 outline-none text-xs font-bold uppercase tracking-wider appearance-none min-w-[140px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <option value="all">All Mastery</option>
                <option value="new">New Words</option>
                <option value="learning">Learning</option>
                <option value="reviewing">Reviewing</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>
            
            <button className="ml-auto p-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
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
              <h2 className="text-5xl sm:text-7xl font-black text-white/10 select-none tracking-tighter leading-none">
                {group.char}
              </h2>
            </div>
            <div className="space-y-0">
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
                    className="group grid grid-cols-1 md:grid-cols-[minmax(280px,max-content)_1fr_auto] items-baseline gap-y-2 gap-x-12 py-5 px-8 rounded-2xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/[0.05] print-grid"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl md:text-3xl font-black text-primary tracking-tight uppercase group-hover:translate-x-1 transition-transform duration-300">
                        {word.word}
                      </span>
                      <div className={`no-print px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 ${mCfg.bg} ${mCfg.color}`}>
                        <mCfg.icon className="w-3 h-3" />
                        {mCfg.label}
                      </div>
                    </div>
                    <span className="text-lg md:text-xl text-foreground/50 leading-snug group-hover:text-foreground/80 transition-colors">
                      {meaning}
                    </span>
                    <div className="flex items-center w-full justify-start md:justify-end mt-1 md:mt-0">
                      <span className="text-sm md:text-base font-bengali text-accent font-medium bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.12)] group-hover:bg-white/[0.06] group-hover:border-white/[0.1] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-all duration-300">
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
