import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS } from '@/lib/wordData';
import { shuffle } from '@/lib/utils';
import { CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import PageHeader from '@/components/layout/PageHeader';
import SessionComplete from '@/components/SessionComplete';
import LexoraLogo from '@/components/ui/LexoraLogo';

export default function MatchingDrill() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level');
  const { loading, levelProgress, getWeakWords, getWordsForLevel, recordReview } = useStudyEngine();
  const [targetLang, setTargetLang] = useState('bengali');
  const [pairs, setPairs] = useState([]);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [shuffledMeanings, setShuffledMeanings] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedMeaning, setSelectedMeaning] = useState(null);
  
  // Pending matches formed by user
  const [pendingMatches, setPendingMatches] = useState([]); // Array of { wordIndex, meaningIndex }
  const [showResults, setShowResults] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const startRef = useRef(Date.now());
  const [finalTime, setFinalTime] = useState(0);

  const generate = useCallback(() => {
    let pool;

    if (levelParam) {
      const levelNum = parseInt(levelParam);
      pool = getWordsForLevel(levelNum);
    } else {
      const weak = getWeakWords.map(r => ALL_WORDS[r.word_index]).filter(Boolean);
      pool = [...weak];
      if (pool.length < 10) {
        const poolIndices = new Set(pool.map(p => p.index));
        const extra = shuffle(ALL_WORDS).filter(w => !poolIndices.has(w.index));
        pool = [...pool, ...extra.slice(0, 10 - pool.length)];
      }
    }
    
    if (pool.length === 0 && !loading) {
      pool = ALL_WORDS.slice(0, 10);
    }
    
    const selectedPairs = shuffle(pool).slice(0, 6);
    setPairs(selectedPairs);
    setShuffledWords(shuffle(selectedPairs));
    setShuffledMeanings(shuffle(selectedPairs));
    setPendingMatches([]);
    setShowResults(false);
    setIsFinished(false);
    setSelectedWord(null);
    setSelectedMeaning(null);
    startRef.current = Date.now();
  }, [getWeakWords, getWordsForLevel, levelParam, loading]);

  useEffect(() => {
    if (!loading && !levelParam && levelProgress.length > 0) {
      const active = levelProgress.find(l => l.is_unlocked && !l.is_completed) || levelProgress[0];
      const targetLevel = active?.level_number || 1;
      navigate(`${location.pathname}?level=${targetLevel}`, { replace: true });
    }
  }, [loading, levelParam, levelProgress, navigate, location.pathname]);

  useEffect(() => {
    if (!loading && pairs.length === 0 && levelParam) generate();
  }, [loading, pairs.length, generate, levelParam]);

  // Handle selection logic
  useEffect(() => {
    if (selectedWord && selectedMeaning) {
      // Form a pending match
      const newMatch = { wordIndex: selectedWord.index, meaningIndex: selectedMeaning.index };
      setPendingMatches(prev => [...prev, newMatch]);
      setSelectedWord(null);
      setSelectedMeaning(null);
    }
  }, [selectedWord, selectedMeaning]);

  useEffect(() => {
    if (isFinished) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isFinished]);

  const handleCheck = () => {
    const correctCount = pendingMatches.filter(m => m.wordIndex === m.meaningIndex).length;
    const isPerfect = correctCount === pairs.length;
    
    setShowResults(true);

    // Record SRS reviews for ALL matched pairs (correct and incorrect)
    pendingMatches.forEach(m => {
      const isCorrect = m.wordIndex === m.meaningIndex;
      recordReview(m.wordIndex, isCorrect ? 'instant' : 'forgot', 1000);
    });
    
    if (isPerfect) {
      setFinalTime((Date.now() - startRef.current) / 1000);
      setIsFinished(true);
    }
  };

  const undoMatch = (wordIndex) => {
    if (showResults) return; // Can't undo after checking
    setPendingMatches(prev => prev.filter(m => m.wordIndex !== wordIndex));
  };

  const pairsByIndex = useMemo(() => {
    return new Map(pairs.map(p => [p.index, p]));
  }, [pairs]);

  if (loading || pairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      </div>
    );
  }

  const pendingMatchesByWord = new Map();
  const pendingMatchesByMeaning = new Map();
  for (const m of pendingMatches) {
    pendingMatchesByWord.set(m.wordIndex, m);
    pendingMatchesByMeaning.set(m.meaningIndex, m);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="no-print">
        <PageHeader 
          title="Matching Drill" 
          subtitle="Match all pairs then check your score" 
          backTo={-1} 
          action={
            <div className="flex bg-card p-2 border-[3px] border-foreground/20 shadow-[4px_4px_0px_0px] shadow-foreground/30 rounded-2xl self-start md:self-center">
              <button 
                onClick={() => { setTargetLang('english'); generate(); }}
                className={`px-4 md:px-5 py-2 rounded-xl text-[11px] md:text-xs font-extrabold uppercase tracking-widest transition-all ${targetLang === 'english' ? 'bg-primary text-primary-foreground shadow-[3px_3px_0px_0px] shadow-primary/40' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className="md:hidden">EN</span>
                <span className="hidden md:inline">English</span>
              </button>
              <button 
                onClick={() => { setTargetLang('bengali'); generate(); }}
                className={`px-4 md:px-5 py-2 rounded-xl text-[11px] md:text-xs font-extrabold uppercase tracking-widest transition-all ${targetLang === 'bengali' ? 'bg-primary text-primary-foreground shadow-[3px_3px_0px_0px] shadow-primary/40' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className="md:hidden">BN</span>
                <span className="hidden md:inline">Bengali</span>
              </button>
            </div>
          }
        />
      </div>

      {!isFinished ? (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 grid grid-cols-2 gap-6 w-full">
              {/* Words Column */}
              <div className="space-y-3">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-primary/70 px-1">Vocabulary</h2>
                {shuffledWords.map((w) => {
                  const match = pendingMatchesByWord.get(w.index);
                  const isPaired = !!match;
                  const isSelected = selectedWord?.index === w.index;
                  
                  const isCorrect = showResults && match && match.wordIndex === match.meaningIndex;
                  const isWrong = showResults && match && match.wordIndex !== match.meaningIndex;

                  return (
                    <motion.button
                      key={`word-${w.index}`}
                      onClick={() => !isPaired && setSelectedWord(w)}
                      whileHover={!isPaired && !isSelected ? { scale: 1.02, rotate: -1 } : {}}
                      whileTap={!isPaired ? { scale: 0.97 } : {}}
                      className={`w-full px-5 py-4 rounded-2xl text-left border-[3px] border-foreground/15 transition-all ${
                        isCorrect ? 'bg-success/80 text-white shadow-[5px_5px_0px_0px] shadow-success/30' :
                        isWrong ? 'bg-destructive/80 text-white shadow-[5px_5px_0px_0px] shadow-destructive/30 animate-shake' :
                        isPaired ? 'bg-muted/50 text-muted-foreground opacity-40 cursor-default' :
                        isSelected ? 'bg-accent/20 text-accent-foreground border-accent/40 shadow-[6px_6px_0px_0px] shadow-accent/30 -rotate-2 scale-[1.03]' :
                        'bg-card/80 text-card-foreground shadow-[4px_4px_0px_0px] shadow-foreground/10 hover:border-foreground/30'
                      }`}
                    >
                      <span className="font-extrabold text-[15px] leading-tight tracking-wide">{w.word}</span>
                      {isWrong && (
                        <span className="block text-[19px] font-semibold mt-1.5 leading-snug underline decoration-wavy underline-offset-4 opacity-90">
                          → {targetLang === 'bengali' ? w.bengali : (w.options?.[w.answer] || w.answer)}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Meanings Column */}
              <div className="space-y-3">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-accent/70 px-1 text-right">Meanings</h2>
                {shuffledMeanings.map((w) => {
                  const match = pendingMatchesByMeaning.get(w.index);
                  const isPaired = !!match;
                  const isSelected = selectedMeaning?.index === w.index;
                  const meaning = targetLang === 'bengali' ? w.bengali : (w.options?.[w.answer] || w.answer);

                  const isCorrect = showResults && match && match.wordIndex === match.meaningIndex;
                  const isWrong = showResults && match && match.wordIndex !== match.meaningIndex;

                  return (
                    <motion.button
                      key={`meaning-${w.index}`}
                      onClick={() => !isPaired && setSelectedMeaning(w)}
                      whileHover={!isPaired && !isSelected ? { scale: 1.02, rotate: 1 } : {}}
                      whileTap={!isPaired ? { scale: 0.97 } : {}}
                      className={`w-full px-5 py-4 rounded-2xl text-right border-[3px] border-foreground/15 transition-all ${
                        isCorrect ? 'bg-success/80 text-white shadow-[5px_5px_0px_0px] shadow-success/30' :
                        isWrong ? 'bg-destructive/80 text-white shadow-[5px_5px_0px_0px] shadow-destructive/30 animate-shake' :
                        isPaired ? 'bg-muted/50 text-muted-foreground opacity-40 cursor-default' :
                        isSelected ? 'bg-warning/20 text-warning-foreground border-warning/40 shadow-[6px_6px_0px_0px] shadow-warning/30 rotate-2 scale-[1.03]' :
                        'bg-card/80 text-card-foreground shadow-[4px_4px_0px_0px] shadow-foreground/10 hover:border-foreground/30'
                      } ${targetLang === 'bengali' ? 'font-bengali text-[20px]' : 'text-[16px] font-semibold'}`}
                    >
                      {meaning}
                      {isWrong && (
                        <span className="block text-[19px] font-semibold mt-1.5 text-left leading-snug underline decoration-wavy underline-offset-4 opacity-90">
                          ← {w.word}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Current Pairs Sidebar */}
            <div className="w-full lg:w-80 space-y-4 no-print">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground/70 px-1">Your Matches</h2>
              <div className="bg-card border-[3px] border-foreground/20 rounded-3xl p-5 min-h-[28rem] flex flex-col shadow-[8px_8px_0px_0px] shadow-foreground/15">
                <div className="flex-1 space-y-3">
                  <AnimatePresence>
                    {pendingMatches.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shadow-[4px_4px_0px_0px] shadow-foreground/10">
                          <Zap className="w-8 h-8 text-primary/60" />
                        </div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50">Select items to pair</p>
                      </div>
                    )}
                    {pendingMatches.map(m => {
                      const word = pairsByIndex.get(m.wordIndex);
                      const meaning = pairsByIndex.get(m.meaningIndex);
                      const isCorrect = showResults && m.wordIndex === m.meaningIndex;
                      const isWrong = showResults && m.wordIndex !== m.meaningIndex;

                      if (!word || !meaning) return null;

                      return (
                        <motion.div
                          key={`pending-${m.wordIndex}`}
                          initial={{ opacity: 0, x: 10, rotate: -2 }}
                          animate={{ opacity: 1, x: 0, rotate: 0 }}
                          className={`p-4 border-[3px] border-foreground/15 rounded-2xl flex items-center justify-between gap-2 ${
                            isCorrect ? 'bg-success text-white shadow-[4px_4px_0px_0px] shadow-success/25' :
                            isWrong ? 'bg-destructive text-destructive-foreground shadow-[4px_4px_0px_0px] shadow-destructive/25' :
                            'bg-secondary text-secondary-foreground shadow-[3px_3px_0px_0px] shadow-foreground/10'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 gap-0.5">
                            <span className="text-[13px] font-extrabold leading-tight truncate">{word.word}</span>
                            <span className={`text-[14px] opacity-70 truncate leading-tight ${targetLang === 'bengali' ? 'font-bengali' : ''}`}>
                              {targetLang === 'bengali' ? meaning.bengali : (meaning.options?.[meaning.answer] || meaning.answer)}
                            </span>
                          </div>
                          {!showResults && (
                            <button 
                              onClick={() => undoMatch(m.wordIndex)}
                              className="p-2 hover:bg-destructive/15 text-muted-foreground hover:text-destructive rounded-xl transition-colors shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isCorrect && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                          {isWrong && <Zap className="w-5 h-5 shrink-0" />}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                <div className="mt-4 pt-4 border-t-[3px] border-foreground/10">
                  {showResults && !isFinished ? (
                    <div className="space-y-4">
                      <div className="text-center p-4 rounded-2xl bg-destructive text-destructive-foreground border-[3px] border-destructive/40 shadow-[4px_4px_0px_0px] shadow-destructive/25">
                        <p className="text-[17px] font-black leading-tight">Score: {Math.round((pendingMatches.filter(m => m.wordIndex === m.meaningIndex).length / pairs.length) * 100)}%</p>
                        <p className="text-[11px] opacity-75 mt-1">You need 100% to pass.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setPendingMatches([]);
                            setShowResults(false);
                            setSelectedWord(null);
                            setSelectedMeaning(null);
                          }}
                          className="py-3.5 bg-secondary text-secondary-foreground border-[3px] border-foreground/15 rounded-2xl font-extrabold text-[13px] shadow-[4px_4px_0px_0px] shadow-foreground/10 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_0px] transition-all"
                        >
                          Retry These
                        </button>
                        <button
                          onClick={generate}
                          className="py-3.5 bg-primary text-primary-foreground border-[3px] border-primary/50 rounded-2xl font-extrabold text-[13px] shadow-[4px_4px_0px_0px] shadow-primary/25 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_0px] transition-all"
                        >
                          New Words
                        </button>
                      </div>
                      <Link 
                        to="/"
                        className="block w-full py-2 text-[11px] font-bold text-center text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        Return Home
                      </Link>
                    </div>
                  ) : (
                    <button
                      disabled={pendingMatches.length < pairs.length || showResults}
                      onClick={handleCheck}
                      className="w-full py-4 bg-primary text-primary-foreground border-[3px] border-primary/50 rounded-2xl font-black text-[15px] uppercase tracking-wider shadow-[6px_6px_0px_0px] shadow-primary/25 hover:translate-y-0.5 hover:shadow-[5px_5px_0px_0px] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                    >
                      Check Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <SessionComplete 
          customTitle="Mastery Achieved!"
          customMessage={<>Perfect match! You finished all pairs in <span className="text-primary font-bold">{finalTime.toFixed(1)}s</span>.</>}
          levelParam={levelParam} 
          onRetry={generate} 
          nextRoutes={['mcq', 'spelling']} 
        />
      )}
    </div>
  );
}
