import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudyEngine } from '@/lib/useStudyEngine';
import FlashcardView from '@/components/flashcard/FlashcardView';
import LevelQuiz from '@/components/level/LevelQuiz';
import { ArrowLeft, BookOpen, Brain, Trophy, Keyboard, Zap, Volume2, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { speak } from '@/utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function LevelStudy() {
  const { levelNumber } = useParams();
  const num = parseInt(levelNumber);
  const navigate = useNavigate();
  const { getWordsForLevel, recordReview, recordLevelQuiz, levelProgress, loading, isLevelUnlocked } = useStudyEngine();

  const [view, setView] = useState('menu'); // 'menu', 'practice', 'quiz'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionQueue, setSessionQueue] = useState([]);

  // Guard: redirect if level is locked or invalid
  useEffect(() => {
    if (!loading && (isNaN(num) || num < 1 || num > 15 || !isLevelUnlocked(num))) {
      navigate('/levels', { replace: true });
    }
  }, [loading, num, isLevelUnlocked, navigate]);

  const words = useMemo(() => getWordsForLevel(num), [getWordsForLevel, num]);
  const progress = useMemo(() => levelProgress.find(p => p.level_number === num) || {}, [levelProgress, num]);

  const uniqueReviewedCount = useMemo(() => {
    if (sessionQueue.length === 0) return 0;
    return new Set(sessionQueue.slice(0, currentIndex + 1).map(w => w.index)).size;
  }, [sessionQueue, currentIndex]);

  const totalUnique = useMemo(() => {
    return new Set(sessionQueue.map(w => w.index)).size;
  }, [sessionQueue]);

  const isRepeated = useMemo(() => {
    if (sessionQueue.length === 0) return false;
    const currentWord = sessionQueue[currentIndex];
    return currentWord ? sessionQueue.slice(0, currentIndex).some(w => w.index === currentWord.index) : false;
  }, [sessionQueue, currentIndex]);

  useEffect(() => {
    if (view === 'practice-complete') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [view]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const handleRate = async (confidence, responseTime) => {
    const word = sessionQueue[currentIndex];
    if (!word) return;
    await recordReview(word.index, confidence, responseTime);
    
    let updatedQueue = [...sessionQueue];
    if (confidence === 'forgot') {
      // unknown! Repeat 1 or 2 times again randomly before the completion of the practice
      const repeats = Math.floor(Math.random() * 2) + 1; // 1 or 2
      for (let r = 0; r < repeats; r++) {
        const minPos = currentIndex + 2; // avoid immediate repetition
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
    } else {
      setView('practice-complete');
    }
  };

  const handleQuizComplete = async (score) => {
    await recordLevelQuiz(num, score);
    navigate('/levels');
  };

  const exitSession = () => {
    setView('menu');
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/levels" className="p-2 hover:bg-secondary rounded-lg transition-colors"><ArrowLeft className="w-4 h-4 text-muted-foreground" /></Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Level {num}</h1>
            <p className="text-xs text-muted-foreground">Focus: {words.length} synonyms</p>
          </div>
        </div>

        {view !== 'menu' && view !== 'practice-complete' && (
          <button onClick={exitSession} className="text-xs font-bold text-primary hover:underline">Exit Session</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => { setSessionQueue([...words]); setCurrentIndex(0); setView('practice'); }}
                className="group relative overflow-hidden bg-card border border-border/50 rounded-3xl p-8 text-left transition-all hover:border-primary/50 hover:shadow-xl"
              >
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Flashcard Practice</h3>
                    <p className="text-sm text-muted-foreground mt-1">Review words using spaced repetition. Best for initial learning.</p>
                  </div>
                  <div className="pt-4 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(progress.words_studied / 20) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{progress.words_studied || 0}/20 Seen</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate(`/spelling?level=${num}`)}
                className="group relative overflow-hidden bg-card border border-border/50 rounded-3xl p-8 text-left transition-all hover:border-pink-500/50 hover:shadow-xl"
              >
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Keyboard className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Spelling Master</h3>
                    <p className="text-sm text-muted-foreground mt-1">Type the words manually. The ultimate challenge for retention.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate(`/matching?level=${num}`)}
                className="group relative overflow-hidden bg-card border border-border/50 rounded-3xl p-8 text-left transition-all hover:border-emerald-500/50 hover:shadow-xl"
              >
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Matching Drill</h3>
                    <p className="text-sm text-muted-foreground mt-1">Connect words with their meanings in a fast-paced exercise.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setView('quiz')}
                className="group relative overflow-hidden bg-card border border-border/50 rounded-3xl p-8 text-left transition-all hover:border-accent/50 hover:shadow-xl"
              >
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Mastery Quiz</h3>
                    <p className="text-sm text-muted-foreground mt-1">Test your knowledge. Score 80%+ to unlock the next level.</p>
                  </div>
                  {progress.quiz_score > 0 && (
                    <div className="pt-4 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-accent" />
                      <span className="text-sm font-bold text-foreground">Best Score: {progress.quiz_score}%</span>
                    </div>
                  )}
                </div>
              </button>
            </div>

            <div className="space-y-6 pt-8 border-t border-border/50">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-foreground">Level Curriculum</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                  20 synonyms to master
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {words.map((word) => (
                  <div 
                    key={word.index} 
                    className="group bg-card/50 border border-border/30 rounded-2xl p-4 flex items-center justify-between hover:bg-card hover:border-primary/20 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => speak(word.word)}
                        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-foreground uppercase tracking-wide text-sm">{word.word}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{word.meaning}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <FlashcardView
              word={sessionQueue[currentIndex]}
              onRate={handleRate}
              index={uniqueReviewedCount - 1}
              total={totalUnique}
              isRepeated={isRepeated}
            />
          </motion.div>
        )}

        {view === 'practice-complete' && (
          <motion.div
            key="practice-complete"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl mx-auto py-8 px-4 text-center space-y-10"
          >
            <div className="space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Session Complete!</h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">
                  You've successfully studied all <span className="text-foreground font-bold">{totalUnique} words</span> of Level {num}.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 text-center">Ready for a Challenge?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => navigate(`/spelling?level=${num}`)}
                  className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 rounded-2xl transition-all group border border-border/5 active:scale-[0.99] text-left w-full animate-fade-in"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Keyboard className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block text-foreground leading-snug">Spelling Master</span>
                      <span className="text-xs text-muted-foreground">Type to spell the words</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => navigate(`/matching?level=${num}`)}
                  className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 rounded-2xl transition-all group border border-border/5 active:scale-[0.99] text-left w-full animate-fade-in"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block text-foreground leading-snug">Matching Drill</span>
                      <span className="text-xs text-muted-foreground">Connect definitions</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => setView('quiz')}
                  className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 rounded-2xl transition-all group border border-border/5 active:scale-[0.99] text-left w-full animate-fade-in"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Brain className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block text-foreground leading-snug">Mastery Quiz</span>
                      <span className="text-xs text-muted-foreground">Test your knowledge to unlock level {num + 1}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => setView('menu')}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]"
              >
                Return to Level {num}
              </button>
              <button 
                onClick={() => { setSessionQueue([...words]); setCurrentIndex(0); setView('practice'); }} 
                className="w-full py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4 inline-block mr-1.5 -translate-y-0.5" /> Practice Again
              </button>
            </div>
          </motion.div>
        )}

        {view === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <LevelQuiz
              words={words}
              levelNumber={num}
              onComplete={handleQuizComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}