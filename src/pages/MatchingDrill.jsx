import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS } from '@/lib/wordData';
import { CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import PageHeader from '@/components/layout/PageHeader';
import SessionComplete from '@/components/SessionComplete';
import LexoraLogo from '@/components/ui/LexoraLogo';

function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

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
        const extra = shuffle(ALL_WORDS).filter(w => !pool.find(p => p.index === w.index));
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

  if (loading || pairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="no-print">
        <PageHeader 
          title="Matching Drill" 
          subtitle="Match all pairs then check your score" 
          backTo={-1} 
          action={
            <div className="flex bg-muted p-1 rounded-xl self-start md:self-center">
              <button 
                onClick={() => { setTargetLang('english'); generate(); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${targetLang === 'english' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                English
              </button>
              <button 
                onClick={() => { setTargetLang('bengali'); generate(); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${targetLang === 'bengali' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                Bengali
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
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary/60 px-2">Vocabulary</h2>
                {shuffledWords.map((w) => {
                  const match = pendingMatches.find(m => m.wordIndex === w.index);
                  const isPaired = !!match;
                  const isSelected = selectedWord?.index === w.index;
                  
                  const isCorrect = showResults && match && match.wordIndex === match.meaningIndex;
                  const isWrong = showResults && match && match.wordIndex !== match.meaningIndex;

                  return (
                    <motion.button
                      key={`word-${w.index}`}
                      onClick={() => !isPaired && setSelectedWord(w)}
                      className={`w-full p-4 rounded-2xl text-left border-2 transition-all font-bold ${
                        isCorrect ? 'border-success bg-success/10' :
                        isWrong ? 'border-destructive bg-destructive/10 animate-shake' :
                        isPaired ? 'opacity-40 border-border bg-muted/30 cursor-default' :
                        isSelected ? 'border-primary bg-primary/5 scale-[1.02]' :
                        'border-border hover:border-primary/30 hover:bg-card'
                      }`}
                    >
                      {w.word}
                    </motion.button>
                  );
                })}
              </div>

              {/* Meanings Column */}
              <div className="space-y-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-accent/60 px-2 text-right">Meanings</h2>
                {shuffledMeanings.map((w) => {
                  const match = pendingMatches.find(m => m.meaningIndex === w.index);
                  const isPaired = !!match;
                  const isSelected = selectedMeaning?.index === w.index;
                  const meaning = targetLang === 'bengali' ? w.bengali : w.meaning;

                  const isCorrect = showResults && match && match.wordIndex === match.meaningIndex;
                  const isWrong = showResults && match && match.wordIndex !== match.meaningIndex;

                  return (
                    <motion.button
                      key={`meaning-${w.index}`}
                      onClick={() => !isPaired && setSelectedMeaning(w)}
                      className={`w-full p-4 rounded-2xl text-right border-2 transition-all ${
                        isCorrect ? 'border-success bg-success/10' :
                        isWrong ? 'border-destructive bg-destructive/10 animate-shake' :
                        isPaired ? 'opacity-40 border-border bg-muted/30 cursor-default' :
                        isSelected ? 'border-accent bg-accent/5 scale-[1.02]' :
                        'border-border hover:border-accent/30 hover:bg-card'
                      } ${targetLang === 'bengali' ? 'font-bengali text-lg' : 'text-sm font-medium'}`}
                    >
                      {meaning}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Current Pairs Sidebar */}
            <div className="w-full lg:w-80 space-y-4 no-print">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Your Matches</h2>
              <div className="bg-card/50 border border-border/50 rounded-3xl p-4 min-h-[24rem] flex flex-col">
                <div className="flex-1 space-y-2">
                  <AnimatePresence>
                    {pendingMatches.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                        <Zap className="w-8 h-8 text-muted-foreground/20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Select items to pair</p>
                      </div>
                    )}
                    {pendingMatches.map(m => {
                      const word = pairs.find(p => p.index === m.wordIndex);
                      const meaning = pairs.find(p => p.index === m.meaningIndex);
                      const isCorrect = showResults && m.wordIndex === m.meaningIndex;
                      const isWrong = showResults && m.wordIndex !== m.meaningIndex;

                      if (!word || !meaning) return null;

                      return (
                        <motion.div
                          key={`pending-${m.wordIndex}`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 border rounded-xl flex items-center justify-between gap-2 relative group ${
                            isCorrect ? 'bg-success/5 border-success/20' :
                            isWrong ? 'bg-destructive/5 border-destructive/20' :
                            'bg-background border-border/50'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{word.word}</span>
                            <span className={`text-[10px] text-muted-foreground ${targetLang === 'bengali' ? 'font-bengali' : ''}`}>
                              {targetLang === 'bengali' ? meaning.bengali : meaning.meaning}
                            </span>
                          </div>
                          {!showResults && (
                            <button 
                              onClick={() => undoMatch(m.wordIndex)}
                              className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-success" />}
                          {isWrong && <Zap className="w-4 h-4 text-destructive" />}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  {showResults && !isFinished ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-xs font-bold text-destructive">Score: {Math.round((pendingMatches.filter(m => m.wordIndex === m.meaningIndex).length / pairs.length) * 100)}%</p>
                        <p className="text-[10px] text-muted-foreground">You need 100% to pass.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setPendingMatches([]);
                            setShowResults(false);
                            setSelectedWord(null);
                            setSelectedMeaning(null);
                          }}
                          className="py-3 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs hover:bg-secondary/80 transition-all"
                        >
                          Retry These
                        </button>
                        <button
                          onClick={generate}
                          className="py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                        >
                          New Words
                        </button>
                      </div>
                      <Link 
                        to="/"
                        className="block w-full py-2 text-[10px] font-bold text-center text-muted-foreground hover:text-primary transition-colors mt-2"
                      >
                        Return Home
                      </Link>
                    </div>
                  ) : (
                    <button
                      disabled={pendingMatches.length < pairs.length || showResults}
                      onClick={handleCheck}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
