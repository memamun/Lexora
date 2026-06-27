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
import { WORDS_PER_LEVEL, TOTAL_LEVELS } from '@/lib/constants';

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

// Neural Background (Static & High Performance)
function NeuralBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="hidden md:block absolute inset-0 pointer-events-none">
        <div className="absolute top-10 -left-20 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-primary/5 to-transparent blur-[160px] opacity-40" />
        <div className="absolute top-[35%] -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-accent/5 to-transparent blur-[140px] opacity-30" />
      </div>
    </div>
  );
}

// Creative Grammatical Part of Speech Visual Themes
const getPoSTheme = (pos) => {
  const norm = (pos || '').toLowerCase();
  if (norm.includes('noun')) {
    return {
      bgAccent: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
      borderAccent: 'border-l-4 border-l-blue-500',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      solidHover: 'hover:bg-blue-500/[0.05] hover:border-blue-500/40',
      glow: 'hover:shadow-blue-500/5',
      textAccent: 'text-blue-500',
      bulletBg: 'bg-blue-500',
      tagBg: 'bg-blue-500/10 border-blue-500/20'
    };
  }
  if (norm.includes('verb')) {
    return {
      bgAccent: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      borderAccent: 'border-l-4 border-l-emerald-500',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      solidHover: 'hover:bg-emerald-500/[0.05] hover:border-emerald-500/40',
      glow: 'hover:shadow-emerald-500/5',
      textAccent: 'text-emerald-500',
      bulletBg: 'bg-emerald-500',
      tagBg: 'bg-emerald-500/10 border-emerald-500/20'
    };
  }
  if (norm.includes('adj')) {
    return {
      bgAccent: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
      borderAccent: 'border-l-4 border-l-amber-500',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      solidHover: 'hover:bg-amber-500/[0.05] hover:border-amber-500/40',
      glow: 'hover:shadow-amber-500/5',
      textAccent: 'text-amber-500',
      bulletBg: 'bg-amber-500',
      tagBg: 'bg-amber-500/10 border-amber-500/20'
    };
  }
  if (norm.includes('adv')) {
    return {
      bgAccent: 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]',
      borderAccent: 'border-l-4 border-l-pink-500',
      badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20',
      solidHover: 'hover:bg-pink-500/[0.05] hover:border-pink-500/40',
      glow: 'hover:shadow-pink-500/5',
      textAccent: 'text-pink-500',
      bulletBg: 'bg-pink-500',
      tagBg: 'bg-pink-500/10 border-pink-500/20'
    };
  }
  return {
    bgAccent: 'bg-muted-foreground/30 shadow-none',
    borderAccent: 'border-l-4 border-l-muted-foreground/30',
    badge: 'bg-muted/60 text-muted-foreground border border-border/30',
    solidHover: 'hover:bg-primary/[0.04] hover:border-primary/35',
    glow: 'hover:shadow-primary/5',
    textAccent: 'text-primary',
    bulletBg: 'bg-primary',
    tagBg: 'bg-muted/60 border-border/30'
  };
};

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

  useEffect(() => {
    setView('menu');
    setCurrentIndex(0);
    setSessionQueue([]);
    setExpandedWord(null);
  }, [num]);

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
    try {
      await recordLevelQuiz(num, score, wrongWordIndices);
    } catch (err) {
      console.error('Failed to record level quiz:', err);
    }
    
    if (score >= 80 && num < TOTAL_LEVELS) {
      navigate(`/study-level/${num + 1}`);
    } else {
      setView('menu');
      setCurrentIndex(0);
    }
  };

  const exitSession = () => { setView('menu'); setCurrentIndex(0); };

  return (
    <div className="relative min-h-screen pb-16 pt-0 px-4 sm:px-6 lg:px-8 flex flex-col gap-6 sm:gap-8">
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
            {/* ── Launch Exercises ─────────────────────── */}
            <div className="space-y-5">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Launch Exercises</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Flashcards */}
                <button
                  onClick={() => { setSessionQueue([...words]); setCurrentIndex(0); setView('practice'); }}
                  className="group bg-card/45 backdrop-blur-xl border border-border/50 hover:bg-primary hover:border-primary rounded-3xl p-5 hover:shadow-xl hover:shadow-primary/10 transition-colors duration-150 text-left relative overflow-hidden flex flex-col justify-between h-[155px] cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary-foreground group-hover:text-primary group-hover:rotate-12 duration-200 transition-all mb-3 shrink-0">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <h3 className="text-sm font-black text-foreground group-hover:text-primary-foreground duration-150 transition-colors mb-3">Flashcards</h3>
                    <div className="space-y-1.5 w-full mt-auto">
                      <div className="flex justify-between text-[10px] text-muted-foreground/75 group-hover:text-primary-foreground/90 font-bold duration-150 transition-colors">
                        <span>Studied</span>
                        <span className="tabular-nums">{progress.words_studied || 0}/{WORDS_PER_LEVEL}</span>
                      </div>
                      <div className="h-1 bg-muted group-hover:bg-primary-foreground/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary group-hover:bg-primary-foreground rounded-full transition-all duration-300" style={{ width: `${((progress.words_studied || 0) / WORDS_PER_LEVEL) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Spelling */}
                <button
                  onClick={() => navigate(`/spelling?level=${num}`)}
                  className="group bg-card/45 backdrop-blur-xl border border-border/50 hover:bg-pink-600 hover:border-pink-600 rounded-3xl p-5 hover:shadow-xl hover:shadow-pink-500/10 transition-colors duration-150 text-left relative overflow-hidden flex flex-col justify-between h-[155px] cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-card group-hover:text-pink-600 group-hover:rotate-12 duration-200 transition-all mb-3 shrink-0">
                    <Keyboard className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <h3 className="text-sm font-black text-foreground group-hover:text-white duration-150 transition-colors">Spelling</h3>
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <span className="text-[10px] font-bold text-muted-foreground/75 group-hover:text-white/80 duration-150 transition-colors">Motor Recall</span>
                      <ChevronRight className="w-3.5 h-3.5 text-primary group-hover:text-white opacity-0 group-hover:opacity-100 duration-150 transition-all" />
                    </div>
                  </div>
                </button>

                {/* Matching */}
                <button
                  onClick={() => navigate(`/matching?level=${num}`)}
                  className="group bg-card/45 backdrop-blur-xl border border-border/50 hover:bg-emerald-600 hover:border-emerald-600 rounded-3xl p-5 hover:shadow-xl hover:shadow-emerald-500/10 transition-colors duration-150 text-left relative overflow-hidden flex flex-col justify-between h-[155px] cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-card group-hover:text-emerald-600 group-hover:rotate-12 duration-200 transition-all mb-3 shrink-0">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <h3 className="text-sm font-black text-foreground group-hover:text-white duration-150 transition-colors">Matching</h3>
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <span className="text-[10px] font-bold text-muted-foreground/75 group-hover:text-white/80 duration-150 transition-colors">Word Match</span>
                      <ChevronRight className="w-3.5 h-3.5 text-primary group-hover:text-white opacity-0 group-hover:opacity-100 duration-150 transition-all" />
                    </div>
                  </div>
                </button>

                {/* Mastery Quiz */}
                <button
                  onClick={() => setView('quiz')}
                  className="group bg-card/45 backdrop-blur-xl border border-border/50 hover:bg-amber-500 hover:border-amber-500 rounded-3xl p-5 hover:shadow-xl hover:shadow-accent/10 transition-colors duration-150 text-left relative overflow-hidden flex flex-col justify-between h-[155px] cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-card group-hover:text-amber-600 group-hover:rotate-12 duration-200 transition-all mb-3 shrink-0">
                    <Brain className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-foreground group-hover:text-white duration-150 transition-colors">Mastery Quiz</h3>
                      {(progress.quiz_score || 0) >= 80 && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4">
                      {(progress.quiz_score || 0) > 0 ? (
                        <span className="text-[10px] font-bold text-primary group-hover:text-white flex items-center gap-1 duration-150 transition-colors">
                          <Trophy className="w-3 h-3 text-amber-500 group-hover:text-white" /> Best: {progress.quiz_score}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/70 group-hover:text-white/80 font-semibold leading-none duration-150 transition-colors">80%+ required</span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-primary group-hover:text-white opacity-0 group-hover:opacity-100 duration-150 transition-all shrink-0" />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Mistakes Vault ───────────────────────── */}
            {wrongWords.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 px-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-destructive">Mistakes Vault</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Review Mistakes */}
                  <button
                    onClick={() => { setSessionQueue([...wrongWords]); setCurrentIndex(0); setView('wrong-review'); }}
                    className="group bg-card/45 backdrop-blur-xl border border-rose-500/25 hover:bg-destructive hover:border-destructive rounded-3xl p-4 sm:p-5 hover:shadow-xl hover:shadow-destructive/25 transition-all duration-200 text-left relative overflow-hidden flex items-center gap-4 sm:gap-5 h-[96px] sm:h-[105px] cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:bg-destructive-foreground group-hover:text-destructive group-hover:rotate-12 duration-200 transition-all shrink-0 border border-rose-500/10">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                      <h3 className="text-sm sm:text-base font-black text-foreground group-hover:text-destructive-foreground duration-150 transition-colors leading-tight">Review Mistakes</h3>
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground/85 group-hover:text-destructive-foreground/85 leading-tight mt-0.5 truncate">
                        {wrongWords.length} words to revisit
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-500 group-hover:text-destructive-foreground shrink-0 absolute right-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </button>

                  {/* Mistake Quiz */}
                  <button
                    onClick={() => setView('wrong-quiz')}
                    className="group bg-card/45 backdrop-blur-xl border border-purple-500/25 hover:bg-accent hover:border-accent rounded-3xl p-4 sm:p-5 hover:shadow-xl hover:shadow-accent/25 transition-all duration-200 text-left relative overflow-hidden flex items-center gap-4 sm:gap-5 h-[96px] sm:h-[105px] cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-accent-foreground group-hover:text-accent group-hover:rotate-12 duration-200 transition-all shrink-0 border border-purple-500/10">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                      <h3 className="text-sm sm:text-base font-black text-foreground group-hover:text-accent-foreground duration-150 transition-colors leading-tight">Mistake Quiz</h3>
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground/85 group-hover:text-accent-foreground/85 leading-tight mt-0.5 truncate">
                        Clear them on 80%+
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-500 group-hover:text-accent-foreground shrink-0 absolute right-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Level Curriculum ─────────────────────── */}
            <div className="space-y-6 pt-10 border-t border-border/50">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
                  <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    Level Curriculum
                  </h2>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full shadow-sm">
                  {words.length} words to master
                </span>
              </div>

              <div className="columns-1 sm:columns-2 gap-4">
                {words.map((word) => {
                  const isExpanded = expandedWord === word.word;
                  const posTheme = getPoSTheme(word.pos);
                  return (
                    <div
                      key={word.index}
                      className={`group border rounded-3xl overflow-hidden transition-all duration-200 break-inside-avoid mb-4 relative ${
                        isExpanded
                          ? 'bg-card border-primary/45 shadow-xl shadow-primary/5 ring-4 ring-primary/5 scale-[1.01] z-10'
                          : `bg-card/45 backdrop-blur-xl border-border/50 ${posTheme.solidHover} hover:shadow-md ${posTheme.glow}`
                      }`}
                    >
                      {/* Card Header (Click to Expand) */}
                      <div
                        onClick={() => setExpandedWord(isExpanded ? null : word.word)}
                        className={`flex items-center justify-between cursor-pointer select-none transition-colors ${
                          isExpanded ? 'p-5 sm:p-6 pb-4' : 'p-4 sm:p-5'
                        }`}
                      >
                        <div className="flex items-center gap-4 sm:gap-5">
                          {/* Pronunciation Node (Soundwave capsule) */}
                          <button
                            onClick={(e) => { e.stopPropagation(); speak(word.word); }}
                            className={`shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-95 duration-200 relative group/speaker ${
                              isExpanded
                                ? 'w-11 h-11 sm:w-12 sm:h-12 bg-primary/10 text-primary border border-primary/20 shadow-inner'
                                : 'w-10 h-10 sm:w-11 sm:h-11 bg-secondary/80 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border hover:border-primary/20'
                            }`}
                          >
                            {!isExpanded && (
                              <div className="absolute -inset-1 rounded-2xl bg-primary/5 opacity-0 group-hover/speaker:opacity-100 group-hover/speaker:scale-110 transition-all duration-300 pointer-events-none" />
                            )}
                            <Volume2 className={`relative z-10 transition-transform duration-200 group-hover/speaker:scale-110 ${isExpanded ? "w-5 h-5" : "w-4.5 h-4.5"}`} />
                          </button>

                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className={`font-serif font-black tracking-tight transition-all duration-200 ${
                                isExpanded ? 'text-lg sm:text-xl text-primary' : 'text-base sm:text-lg text-foreground group-hover:text-primary'
                              }`}>
                                {word.word}
                              </h4>
                              <span className={`text-[9px] font-black uppercase tracking-[0.15em] border px-2 py-0.5 rounded-md transition-colors duration-200 ${
                                isExpanded ? 'bg-primary/10 text-primary border-primary/20' : `${posTheme.tagBg} ${posTheme.textAccent}`
                              }`}>
                                {word.pos}
                              </span>
                              <span className="font-bengali font-semibold text-xs sm:text-[13px] tracking-wide text-foreground/80 bg-secondary/50 border border-border/30 rounded-xl px-2.5 py-0.5 shadow-sm transition-all duration-200 group-hover:bg-secondary/85 group-hover:border-primary/25">
                                {word.bengali}
                              </span>
                            </div>
                            <p className={`text-muted-foreground/85 transition-all duration-200 ${
                              isExpanded ? 'text-xs sm:text-sm mt-1' : 'text-xs sm:text-[13px] mt-0.5 line-clamp-1 font-medium group-hover:text-foreground/90'
                            }`}>
                              {word.meaning}
                            </p>
                          </div>
                        </div>

                        {/* Right Accent Details */}
                        <div className="flex items-center justify-center shrink-0 pl-3">
                          <div className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                            isExpanded ? 'w-7 h-7 bg-primary/10 text-primary' : 'w-6 h-6 text-muted-foreground/30 group-hover:bg-secondary group-hover:text-primary/70'
                          }`}>
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-5 sm:px-6 pb-6 pt-3 border-t border-border/20 bg-muted/5 backdrop-blur-md">
                          <div className="grid grid-cols-1 gap-5 mt-3">
                            {/* Definition Section */}
                            <div className="space-y-2">
                              <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-primary/80">
                                <div className={`w-1.5 h-1.5 rounded-full ${posTheme.bulletBg}`} />
                                Definition
                              </h5>
                              <p className="text-sm sm:text-base text-foreground/95 font-medium leading-relaxed pl-4 border-l-2 border-primary/30">
                                {word.explanation}
                              </p>
                            </div>

                            {/* Usage Example Section with high-contrast theme-appropriate sky styling */}
                            {word.example && (
                              <div className="space-y-2">
                                <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-sky-500 dark:text-sky-400">
                                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                                  Usage Example
                                </h5>
                                <p className="text-xs sm:text-sm italic text-muted-foreground/95 font-medium leading-relaxed pl-4 border-l-2 border-sky-500/50 bg-sky-500/5 dark:bg-sky-500/10 py-3.5 px-4 rounded-r-2xl border border-l-none border-border/10 block">
                                  &ldquo;{word.example}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* Synonyms Section */}
                            {word.synonyms && word.synonyms.length > 0 && (
                              <div className="space-y-2.5">
                                <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500/80">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Synonyms
                                </h5>
                                <div className="flex flex-wrap gap-2 pl-4">
                                  {word.synonyms.map((syn, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-sm border border-emerald-500/10 hover:scale-105 hover:bg-emerald-500/10 duration-200 transition-all cursor-default"
                                    >
                                      {syn}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Antonyms Section */}
                            {word.antonyms && word.antonyms.length > 0 && (
                              <div className="space-y-2.5">
                                <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-rose-500/80">
                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Antonyms
                                </h5>
                                <div className="flex flex-wrap gap-2 pl-4">
                                  {word.antonyms.map((ant, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 rounded-xl bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs font-semibold shadow-sm border border-rose-500/10 hover:scale-105 hover:bg-rose-500/10 duration-200 transition-all cursor-default"
                                    >
                                      {ant}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
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