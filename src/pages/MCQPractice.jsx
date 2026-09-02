import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS, DIFFICULTY_MAP, getConfusionCluster } from '@/lib/wordData';
import { shuffle } from '@/lib/utils';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import PageHeader from '@/components/layout/PageHeader';
import SessionComplete from '@/components/SessionComplete';
import LexoraLogo from '@/components/ui/LexoraLogo';

const ALL_WORDS_MAP = new Map(ALL_WORDS.map(w => [w.word, w]));

function buildMCQ(word) {
  const correct = word.options?.[word.answer] || word.answer;
  
  // Use curated options from the dataset if available, excluding the correct answer
  let curatedDistractors = [];
  if (word.options) {
    curatedDistractors = Object.values(word.options).filter(m => m !== correct);
  }

  const cluster = getConfusionCluster(word.word);
  
  // Combine curated distractors with cluster meanings for a rich pool
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

  // Unique distractors only
  let distractors = Array.from(new Set(distractorPool));

  const allMeanings = Array.from(new Set(ALL_WORDS.map(w => w.options?.[w.answer]).filter(Boolean)))
    .filter(m => m !== correct && !distractors.includes(m));

  // Fill up to 3 distractors if we don't have enough
  while (distractors.length < 3 && allMeanings.length > 0) {
    const randomIndex = Math.floor(Math.random() * allMeanings.length);
    distractors.push(allMeanings.splice(randomIndex, 1)[0]);
  }

  // We only want 3 distractors total
  const finalDistractors = distractors.slice(0, 3);

  return { 
    word: word.word, 
    options: shuffle([correct, ...finalDistractors]), 
    correct, 
    explanation: word.explanation, 
    difficulty: word.difficulty, 
    index: word.index 
  };
}

const MODES = [
  { key: 'mixed', label: 'Mixed' },
  { key: 'weak',  label: 'Weak Words' },
  { key: 'A',     label: 'Set A' },
  { key: 'B',     label: 'Set B' },
  { key: 'C',     label: 'Set C' },
];

export default function MCQPractice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level');
  const { levelProgress, loading, getWeakWords, recordReview, isLevelUnlocked } = useStudyEngine();
  const [mode, setMode] = useState('mixed');
  const [questions, setQuestions] = useState([]);
  const [cur, setCur] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const startRef = useRef(Date.now());

  const memoizedUnlockedLevels = useMemo(() => levelProgress.filter(l => l.is_unlocked || l.level_number === 1), [levelProgress]);

  // Helper to parse comma-separated levels or "all"
  const getSelectedLevels = useCallback(() => {
    if (!levelParam) return [1];
    if (levelParam === 'all') {
      return memoizedUnlockedLevels.map(l => l.level_number);
    }
    return levelParam
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= 15 && isLevelUnlocked(n));
  }, [levelParam, memoizedUnlockedLevels, isLevelUnlocked]);

  const handleLevelClick = (levelNumber) => {
    if (levelParam === 'all') {
      // Exit 'all' mode and select only this level
      navigate(`${location.pathname}?level=${levelNumber}`, { replace: true });
      return;
    }

    const activeLevels = getSelectedLevels();
    let nextLevels;
    if (activeLevels.includes(levelNumber)) {
      // Toggle off. Don't allow empty selection
      if (activeLevels.length > 1) {
        nextLevels = activeLevels.filter(n => n !== levelNumber);
      } else {
        nextLevels = [levelNumber];
      }
    } else {
      // Toggle on
      nextLevels = [...activeLevels, levelNumber].sort((a, b) => a - b);
    }
    
    // Check if nextLevels is equal to all unlocked levels, if so we can optionally represent it as 'all'
    const totalUnlocked = memoizedUnlockedLevels.length;
    if (nextLevels.length === totalUnlocked) {
      navigate(`${location.pathname}?level=all`, { replace: true });
    } else {
      navigate(`${location.pathname}?level=${nextLevels.join(',')}`, { replace: true });
    }
  };

  const getLevelsDisplayString = () => {
    if (levelParam === 'all') return 'All Unlocked Levels';
    const activeLevels = getSelectedLevels();
    if (activeLevels.length === memoizedUnlockedLevels.length) {
      return 'All Unlocked Levels';
    }
    if (activeLevels.length === 1) return `Level ${activeLevels[0]}`;
    if (activeLevels.length <= 3) return `Levels ${activeLevels.join(', ')}`;
    return `${activeLevels.length} Levels Selected`;
  };

  const generate = useCallback((m) => {
    let pool;
    if (m === 'weak') { 
      const w = getWeakWords; 
      pool = w.map(r => ALL_WORDS[r.word_index]).filter(Boolean); 
      if (pool.length < 10)       pool = [...pool, ...shuffle(ALL_WORDS).slice(0, 15 - pool.length)];  
    }
    else if (['A','B','C'].includes(m)) pool = ALL_WORDS.filter(w => w.part === m);
    else {
      const activeLevels = getSelectedLevels();
      pool = ALL_WORDS.filter(w => activeLevels.includes(w.level));
    }

    if (!pool || pool.length === 0) {
      pool = ALL_WORDS;
    }
    
    const nextQuestions = shuffle(pool).slice(0, 20).map(buildMCQ);
    setQuestions(nextQuestions);
    setCur(0); 
    setSelected(null); 
    setScore(0);
    startRef.current = Date.now();
  }, [getWeakWords, getSelectedLevels]);

  // Handle automatic redirecting and level parameter locks validation
  useEffect(() => {
    if (!loading && levelProgress.length > 0) {
      if (levelParam) {
        if (levelParam === 'all') {
          return;
        }
        
        const parts = levelParam.split(',').map(s => s.trim());
        const validLevels = parts
          .map(p => parseInt(p))
          .filter(n => !isNaN(n) && n >= 1 && n <= 15 && isLevelUnlocked(n));
        
        if (validLevels.length === 0) {
          // No valid unlocked levels specified! Fallback/redirect to highest unlocked level.
          const unlockedLevels = memoizedUnlockedLevels;
          const maxUnlocked = Math.max(...unlockedLevels.map(l => l.level_number));
          navigate(`${location.pathname}?level=${maxUnlocked}`, { replace: true });
        } else {
          const cleanParam = validLevels.join(',');
          if (cleanParam !== levelParam) {
            navigate(`${location.pathname}?level=${cleanParam}`, { replace: true });
          }
        }
      } else {
        const active = levelProgress.find(l => l.is_unlocked && !l.is_completed) || levelProgress[0];
        const targetLevel = active?.level_number || 1;
        navigate(`${location.pathname}?level=${targetLevel}`, { replace: true });
      }
    }
  }, [loading, levelParam, levelProgress, navigate, location.pathname, isLevelUnlocked]);

  useEffect(() => {
    const finished = cur >= questions.length;
    if (finished && questions.length > 0) {
      const accuracy = score / questions.length;
      if (accuracy >= 0.7) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  }, [cur, score, questions.length]);

  const handleStartPractice = () => {
    generate(mode);
    setIsStarted(true);
  };

  const handleSelect = useCallback((opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const q = questions[cur];
    const correct = opt === q.correct;
    if (correct) setScore(s => s + 1);
    recordReview(q.index, correct ? 'instant' : 'forgot', Date.now() - startRef.current);
  }, [selected, questions, cur, recordReview]);

  const next = () => { setSelected(null); setCur(c => c + 1); startRef.current = Date.now(); };
  
  const changeMode = (m) => { 
    setMode(m); 
    generate(m); 
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      </div>
    );
  }

  // Render Premium Lobby Setup Screen if not started yet
  if (!isStarted) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto pb-12">
        <PageHeader 
          title="MCQ Practice" 
          subtitle="Intelligent synonym questions with confusion-aware distractors" 
          backTo="/" 
        />

        {/* Setup Options Lobby */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
          
          {/* Section 1: Mode Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">1. Select Mode</h3>
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{mode} Mode</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`px-3 py-3 rounded-xl text-xs font-bold transition-all ${
                    mode === m.key
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10 scale-[1.02]'
                      : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Level Selection (only for Mixed Mode) */}
          {mode === 'mixed' && (
            <div className="space-y-4 pt-6 border-t border-border/20 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">2. Select Levels</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Select a single level, toggle multiple levels, or practice all unlocked.</p>
                </div>
                
                <button
                  onClick={() => {
                    if (levelParam === 'all') {
                      // Fallback to highest unlocked
                      const unlockedLevels = memoizedUnlockedLevels;
                      const maxUnlocked = Math.max(...unlockedLevels.map(l => l.level_number));
                      navigate(`${location.pathname}?level=${maxUnlocked}`, { replace: true });
                    } else {
                      navigate(`${location.pathname}?level=all`, { replace: true });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border self-start sm:self-center ${
                    levelParam === 'all'
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_-5px_rgba(99,102,241,0.25)] font-bold'
                      : 'bg-secondary/40 border-border/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  }`}
                >
                  {levelParam === 'all' ? '✓ All Unlocked Selected' : 'Select All Unlocked'}
                </button>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {levelProgress.map(l => {
                  const isUnlocked = isLevelUnlocked(l.level_number);
                  const activeLevels = getSelectedLevels();
                  const isSelected = levelParam === 'all' ? isUnlocked : activeLevels.includes(l.level_number);
                  const isCompleted = l.is_completed;

                  return (
                    <button
                      key={l.level_number}
                      disabled={!isUnlocked}
                      onClick={() => handleLevelClick(l.level_number)}
                      className={`relative p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        !isUnlocked
                          ? 'opacity-30 bg-secondary/15 border-border/10 cursor-not-allowed text-muted-foreground/45'
                          : isSelected
                          ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_-5px_rgba(99,102,241,0.25)] font-bold scale-[1.02]'
                          : 'bg-card border-border/40 text-foreground hover:bg-secondary/40 hover:border-border'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono">Level {l.level_number}</span>
                      {isCompleted ? (
                        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">✓ Passed</span>
                      ) : !isUnlocked ? (
                        <span className="text-[10px] flex items-center gap-0.5">🔒 Locked</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-semibold">Unlocked</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Summary / Action Button */}
          <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">Ready to Practice</span>
              <p className="text-sm font-bold text-foreground">
                {mode === 'mixed' 
                  ? `${getLevelsDisplayString()} Vocabulary (Mixed)` 
                  : mode === 'weak' 
                  ? 'Personalized Weak Words Practice' 
                  : `Part ${mode} Word Set`}
              </p>
              <p className="text-xs text-muted-foreground">This session contains 20 adaptive multiple-choice questions.</p>
            </div>
            
            <button
              onClick={handleStartPractice}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
            >
              Start Practice Session 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  const q = questions[cur];
  const finished = cur >= questions.length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="MCQ Practice"
        subtitle="Intelligent synonym questions with confusion-aware distractors"
        backTo="/"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {MODES.map(m => (
          <button key={m.key} onClick={() => changeMode(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              mode === m.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground bg-secondary/50 hover:text-foreground'
            }`}
          >{m.label}</button>
        ))}
      </div>

      {finished ? (
        <SessionComplete 
          score={score} 
          total={questions.length} 
          accuracy={questions.length > 0 ? Math.round((score / questions.length) * 100) : 0} 
          levelParam={levelParam} 
          onRetry={() => generate(mode)} 
          nextRoutes={['spelling', 'matching']} 
        >
          <button 
            onClick={() => setIsStarted(false)} 
            className="w-full py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
          >
            Configure Settings
          </button>
        </SessionComplete>
      ) : q ? (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">{cur + 1}/{questions.length}</span>
            <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((cur + 1) / questions.length) * 100}%` }} />
            </div>
            <span className="text-xs font-mono text-success">{score} ✓</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={cur} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="text-center space-y-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${(DIFFICULTY_MAP[q.difficulty] || { bg: 'bg-muted', color: 'text-muted-foreground', border: 'border-border', label: 'Unknown' }).bg} ${(DIFFICULTY_MAP[q.difficulty] || { color: 'text-muted-foreground' }).color} border ${(DIFFICULTY_MAP[q.difficulty] || { border: 'border-border' }).border}`}>
                  {(DIFFICULTY_MAP[q.difficulty] || { label: 'Unknown' }).label}
                </span>
                <h2 className="font-serif text-4xl font-bold text-foreground">{q.word}</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Choose the synonym</p>
              </div>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isCorrect = opt === q.correct;
                  const isSelected = selected === opt;
                  let cls = 'border-border/50 hover:border-primary/30 hover:bg-secondary/30 cursor-pointer';
                  if (selected !== null) {
                    if (isCorrect) cls = 'border-success/40 bg-success/5 text-success cursor-default';
                    else if (isSelected) cls = 'border-destructive/40 bg-destructive/5 text-destructive cursor-default';
                    else cls = 'border-border/20 opacity-40 cursor-default';
                  }
                  return (
                    <button key={i} onClick={() => handleSelect(opt)} disabled={selected !== null}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${cls}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0">{String.fromCharCode(65+i)}</span>
                        {opt}
                      </div>
                      {selected !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                      {selected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {selected !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
              <button onClick={next} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium shrink-0">
                {cur === questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>
      ) : null}
    </div>
  );
}