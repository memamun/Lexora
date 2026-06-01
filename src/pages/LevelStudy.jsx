import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyEngine } from '@/lib/useStudyEngine';
import FlashcardView from '@/components/flashcard/FlashcardView';
import SessionComplete from '@/components/SessionComplete';
import LevelQuiz from '@/components/level/LevelQuiz';
import PageHeader from '@/components/layout/PageHeader';
import LexoraLogo from '@/components/ui/LexoraLogo';
import { BookOpen, Brain, Trophy, Keyboard, Zap, Volume2, ChevronRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { speak } from '@/utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { WORDS_PER_LEVEL } from '@/lib/constants';

// Radial Progress
function RadialProgress({ percent, size = 50, strokeWidth = 3, colorClass = "text-primary" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center font-serif font-black text-xs" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={radius} className="stroke-secondary/50" strokeWidth={strokeWidth} fill="transparent" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          className={colorClass} strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative z-10 text-[10px] font-black text-foreground">{Math.round(percent)}%</span>
    </div>
  );
}

// Neural Background
function NeuralBackground() {
  const particles = useMemo(() => {
    const colors = ['bg-primary/25', 'bg-accent/25', 'bg-indigo-500/20', 'bg-success/20'];
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1.5, colorClass: colors[i % colors.length],
      duration: Math.random() * 25 + 25, delay: Math.random() * -30,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 30, -15, 0], y: [0, -40, 20, 0], opacity: [0.45, 0.65, 0.45] }} transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 -left-20 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-accent/12 to-indigo-500/8 blur-[160px]" />
        <motion.div animate={{ x: [0, -40, 20, 0], y: [0, 30, -30, 0], opacity: [0.35, 0.55, 0.35] }} transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[35%] -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-primary/10 to-pink-500/6 blur-[140px]" />
        {particles.map((p) => (
          <motion.div key={p.id} className={`absolute rounded-full blur-[0.5px] ${p.colorClass}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0], y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0], opacity: [0.15, 0.45, 0.15], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.5, 0.35] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[120%] h-[350px] rounded-full bg-gradient-to-t from-blue-600/20 via-indigo-500/10 to-transparent blur-[120px]" />
        <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.4, 0.25] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-20 left-1/3 -translate-x-1/2 w-[80%] h-[250px] rounded-full bg-gradient-to-t from-violet-600/15 via-purple-500/5 to-transparent blur-[100px]" />
      </div>
    </div>
  );
}

export default function LevelStudy() {
  const { levelNumber } = useParams();
  const num = parseInt(levelNumber);
  const navigate = useNavigate();
  const { getWordsForLevel, recordReview, recordLevelQuiz, levelProgress, loading, isLevelUnlocked, getQuizWrongWordsForLevel } = useStudyEngine();

  const [view, setView] = useState('menu');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionQueue, setSessionQueue] = useState([]);
  const [expandedWord, setExpandedWord] = useState(null);

  useEffect(() => {
    if (!loading && (isNaN(num) || num < 1 || num > 15 || !isLevelUnlocked(num))) {
      navigate('/levels', { replace: true });
    }
  }, [loading, num, isLevelUnlocked, navigate]);

  const words = useMemo(() => getWordsForLevel(num), [getWordsForLevel, num]);
  const progress = useMemo(() => levelProgress.find(p => p.level_number === num) || {}, [levelProgress, num]);
  const wrongWords = useMemo(() => getQuizWrongWordsForLevel(num), [getQuizWrongWordsForLevel, num]);

  const uniqueReviewedCount = useMemo(() => {
    if (sessionQueue.length === 0) return 0;
    return new Set(sessionQueue.slice(0, currentIndex + 1).map(w => w.index)).size;
  }, [sessionQueue, currentIndex]);

  const totalUnique = useMemo(() => new Set(sessionQueue.map(w => w.index)).size, [sessionQueue]);

  const isRepeated = useMemo(() => {
    if (sessionQueue.length === 0) return false;
    const currentWord = sessionQueue[currentIndex];
    return currentWord ? sessionQueue.slice(0, currentIndex).some(w => w.index === currentWord.index) : false;
  }, [sessionQueue, currentIndex]);

  useEffect(() => {
    if (view === 'practice-complete') {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
  }, [view]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
    </div>
  );

  const masteryPercent = Math.round(((progress.words_studied || 0) / (words.length || WORDS_PER_LEVEL)) * 100);

  const handleRate = (confidence, responseTime) => {
    const word = sessionQueue[currentIndex];
    if (!word) return;
    recordReview(word.index, confidence, responseTime);
    let updatedQueue = [...sessionQueue];
    if (confidence === 'forgot') {
      const repeats = Math.floor(Math.random() * 2) + 1;
      for (let r = 0; r < repeats; r++) {
        const minPos = currentIndex + 2;
        const maxPos = updatedQueue.length;
        if (minPos <= maxPos) {
          const insertPos = Math.floor(Math.random() * (maxPos - minPos + 1)) + minPos;
          updatedQueue.splice(insertPos, 0, word);
        } else {
          updatedQueue.push(word);
        }
      }
      setSessionQueue(updatedQueue);
    }
    if (currentIndex < updatedQueue.length - 1) {
      setCurrentIndex(i => i + 1);
    } else if (view === 'wrong-review') {
      setView('menu'); setCurrentIndex(0); setSessionQueue([]);
    } else {
      setView('practice-complete');
    }
  };

  const handleQuizComplete = async (result) => {
    const { score, wrongWordIndices } = result;
    await recordLevelQuiz(num, score, wrongWordIndices);
    // Stay on the page so the user sees the updated score
    setView('menu');
    setCurrentIndex(0);
  };

  const exitSession = () => { setView('menu'); setCurrentIndex(0); };

  return (
    <div className="relative min-h-screen pb-16 pt-0 flex flex-col gap-6 sm:gap-8">
      <NeuralBackground />

      {/* Menu Header */}
      {view === 'menu' && (
        <div className="relative z-10 no-print">
          <PageHeader
            title={`Level ${num}`}
            subtitle="Practice vocabulary cards, spelling, matching drills, or take the mastery quiz."
            backTo="/levels"
            action={
              <RadialProgress
                percent={masteryPercent}
                size={48}
                strokeWidth={4}
                colorClass="text-primary drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]"
              />
            }
          />
        </div>
      )}

      {/* Session Header */}
      {view !== 'menu' && view !== 'practice-complete' && (
        <div className="relative z-10 no-print">
          <PageHeader
            title={view === 'practice' ? 'Smart Flashcards' : view === 'quiz' ? 'Mastery Quiz' : 'Mistakes Session'}
            subtitle={`Level ${num}`}
            onBack={exitSession}
            action={
              <button onClick={exitSession} className="text-xs font-bold text-primary hover:underline bg-secondary/35 border border-border/40 hover:bg-secondary/60 rounded-xl px-3 py-1.5 transition-colors">
                Exit Session
              </button>
            }
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10 pt-2 relative z-10"
          >
            {/* ── Stats Strip ──────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card/50 border border-border/40 rounded-2xl p-4 text-center backdrop-blur-sm">
                <span className="text-xl font-serif font-black text-foreground">{progress.words_studied || 0}</span>
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider block mt-0.5">Mastered</span>
              </div>
              <div className="bg-card/50 border border-border/40 rounded-2xl p-4 text-center backdrop-blur-sm">
                <span className={`text-xl font-serif font-black ${(progress.quiz_score || 0) > 0 ? 'text-primary' : 'text-muted-foreground/30'}`}>
                  {(progress.quiz_score || 0) > 0 ? `${progress.quiz_score}%` : '—'}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider block mt-0.5">Quiz Score</span>
              </div>
              <div className="bg-card/50 border border-border/40 rounded-2xl p-4 text-center backdrop-blur-sm">
                <span className={`text-xl font-serif font-black ${progress.is_completed ? 'text-success' : 'text-muted-foreground/30'}`}>
                  {progress.is_completed ? '✓' : '—'}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider block mt-0.5">Passed</span>
              </div>
            </div>

            {/* ── Launch Exercises ─────────────────────── */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Launch Exercises</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Flashcards */}
                <button
                  onClick={() => { setSessionQueue([...words]); setCurrentIndex(0); setView('practice'); }}
                  className="group bg-card/60 hover:bg-card border border-border/50 hover:border-primary/40 rounded-2xl p-5 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Flashcards</h3>
                  <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">{progress.words_studied || 0}/{WORDS_PER_LEVEL} words studied</p>
                </button>

                {/* Spelling */}
                <button
                  onClick={() => navigate(`/spelling?level=${num}`)}
                  className="group bg-card/60 hover:bg-card border border-border/50 hover:border-pink-500/40 rounded-2xl p-5 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
                    <Keyboard className="w-4.5 h-4.5 text-pink-500" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Spelling</h3>
                  <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">Motor recall drill</p>
                </button>

                {/* Matching */}
                <button
                  onClick={() => navigate(`/matching?level=${num}`)}
                  className="group bg-card/60 hover:bg-card border border-border/50 hover:border-emerald-500/40 rounded-2xl p-5 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Zap className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Matching</h3>
                  <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">Fast connection game</p>
                </button>

                {/* Mastery Quiz */}
                <button
                  onClick={() => setView('quiz')}
                  className="group bg-card/60 hover:bg-card border border-border/50 hover:border-accent/40 rounded-2xl p-5 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Brain className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground">Mastery Quiz</h3>
                    {(progress.quiz_score || 0) >= 80 && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                  </div>
                  {(progress.quiz_score || 0) > 0 ? (
                    <p className="text-[11px] font-bold text-primary mt-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Best: {progress.quiz_score}%
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">Score 80% to unlock next</p>
                  )}
                </button>
              </div>
            </div>

            {/* ── Mistakes Vault ───────────────────────── */}
            {wrongWords.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 px-2">Mistakes Vault</h2>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setSessionQueue([...wrongWords]); setCurrentIndex(0); setView('wrong-review'); }}
                    className="group bg-card/60 hover:bg-card border border-border/50 hover:border-rose-500/40 rounded-2xl p-5 text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                      <RefreshCw className="w-4.5 h-4.5 text-rose-500" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Review Mistakes</h3>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">{wrongWords.length} words to revisit</p>
                  </button>

                  <button
                    onClick={() => setView('wrong-quiz')}
                    className="group bg-card/60 hover:bg-card border border-border/50 hover:border-rose-600/40 rounded-2xl p-5 text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-600/10 flex items-center justify-center mb-4">
                      <Brain className="w-4.5 h-4.5 text-rose-600" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Mistake Quiz</h3>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">Clear them on 80%+</p>
                  </button>
                </div>
              </div>
            )}

            {/* ── Level Curriculum ─────────────────────── */}
            <div className="space-y-6 pt-8 border-t border-border/50">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-foreground">Level Curriculum</h2>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/30">
                  {words.length} synonyms to master
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {words.map((word) => {
                  const isExpanded = expandedWord === word.word;
                  return (
                    <div
                      key={word.index}
                      className={`group border rounded-2xl overflow-hidden transition-colors ${
                        isExpanded ? 'bg-secondary/25 border-primary/30 shadow-md sm:col-span-2' : 'bg-card/50 border-border/30 hover:bg-card hover:border-primary/20'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedWord(isExpanded ? null : word.word)}
                        className="p-4 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); speak(word.word); }}
                            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground uppercase tracking-wide text-sm">{word.word}</h4>
                              <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded border border-border/30">
                                {word.pos}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{word.meaning}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bengali font-bold text-muted-foreground/60">{word.bengali}</span>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground/30 transition-transform ${isExpanded ? 'rotate-90 text-primary' : 'group-hover:text-primary/50'}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-6 pb-5 pt-1 border-t border-border/20 space-y-4 bg-muted/5">
                          <div className="space-y-1 pt-2">
                            <span className="text-[8px] uppercase font-black tracking-widest text-primary block">Definition</span>
                            <p className="text-xs text-foreground/90 font-medium leading-relaxed">{word.explanation}</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                            {word.synonyms && word.synonyms.length > 0 && (
                              <div>
                                <span className="text-[8px] uppercase font-black tracking-widest text-emerald-500 block mb-0.5">Synonyms</span>
                                <span className="text-muted-foreground font-medium leading-normal">{word.synonyms.join(', ')}</span>
                              </div>
                            )}
                            {word.antonyms && word.antonyms.length > 0 && (
                              <div>
                                <span className="text-[8px] uppercase font-black tracking-widest text-pink-500 block mb-0.5">Antonyms</span>
                                <span className="text-muted-foreground font-medium leading-normal">{word.antonyms.join(', ')}</span>
                              </div>
                            )}
                          </div>

                          {word.example && (
                            <div className="space-y-1">
                              <span className="text-[8px] uppercase font-black tracking-widest text-accent block">Usage Example</span>
                              <p className="text-xs italic text-muted-foreground font-medium leading-relaxed border-l-2 border-accent/30 pl-2 bg-accent/5 py-1.5 rounded-r">
                                &ldquo;{word.example}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'practice' && (
          <motion.div key="practice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <FlashcardView word={sessionQueue[currentIndex]} onRate={handleRate} index={uniqueReviewedCount - 1} total={totalUnique} isRepeated={isRepeated} />
          </motion.div>
        )}

        {view === 'practice-complete' && (
          <SessionComplete
            customTitle="Session Complete!"
            customMessage={<>You've successfully studied all <span className="text-foreground font-bold">{totalUnique} words</span> of Level {num}.</>}
            levelParam={num}
            onRetry={() => { setSessionQueue([...words]); setCurrentIndex(0); setView('practice'); }}
            onReturn={() => setView('menu')}
            returnLabel={`Return to Level ${num}`}
            nextRoutes={['spelling', 'matching', 'quiz']}
          />
        )}

        {view === 'wrong-review' && (
          <motion.div key="wrong-review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                Mistakes Review ({wrongWords.length} words)
              </span>
            </div>
            <FlashcardView word={sessionQueue[currentIndex]} onRate={handleRate} index={uniqueReviewedCount - 1} total={totalUnique} isRepeated={isRepeated} />
          </motion.div>
        )}

        {view === 'wrong-quiz' && (
          <motion.div key="wrong-quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                Mistake Quiz ({wrongWords.length} words)
              </span>
            </div>
            <LevelQuiz words={wrongWords} levelNumber={num} hideLevelUnlock onComplete={() => setView('menu')} />
          </motion.div>
        )}

        {view === 'quiz' && (
          <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <LevelQuiz words={words} levelNumber={num} onComplete={handleQuizComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}