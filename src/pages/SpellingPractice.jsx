import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS } from '@/lib/wordData';
import { ArrowLeft, CheckCircle2, ArrowRight, Keyboard, Lightbulb, Volume2, Brain, Zap, RotateCcw } from 'lucide-react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { speak } from '@/utils/audio';
import confetti from 'canvas-confetti';

function distractorShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function SpellingPractice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level');
  const { loading, levelProgress, getWeakWords, getWordsForLevel, recordReview } = useStudyEngine();
  
  const [questions, setQuestions] = useState([]);
  const [cur, setCur] = useState(0);
  const [input, setInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  
  const inputRef = useRef(null);
  const startRef = useRef(Date.now());

  const generate = useCallback(() => {
    let pool = [];
    
    if (levelParam) {
      const levelNum = parseInt(levelParam);
      pool = getWordsForLevel(levelNum);
    } else {
      // Priority to weak words, then random
      const weak = getWeakWords.map(r => ALL_WORDS[r.word_index]).filter(Boolean);
      pool = [...weak];
      if (pool.length < 15) {
        const extra = distractorShuffle(ALL_WORDS).filter(w => !pool.find(p => p.index === w.index));
        pool = [...pool, ...extra.slice(0, 15 - pool.length)];
      }
    }
    
    if (pool.length === 0 && !loading) {
      // Emergency fallback
      pool = ALL_WORDS.slice(0, 10);
    }

    const count = levelParam ? pool.length : Math.min(pool.length, 15);
    setQuestions(distractorShuffle(pool).slice(0, count));
    setCur(0);
    setScore(0);
    setIsFinished(false);
    setInput('');
    setIsSubmitted(false);
    setShowHint(false);
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
    if (!loading && questions.length === 0 && levelParam) {
      generate();
    }
  }, [loading, generate, levelParam]);

  useEffect(() => {
    if (!isSubmitted && inputRef.current) inputRef.current.focus();
  }, [isSubmitted, cur]);

  useEffect(() => {
    if (isFinished) {
      const accuracy = questions.length > 0 ? score / questions.length : 0;
      if (accuracy >= 0.7) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  }, [isFinished, score, questions.length]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isSubmitted) return;
    if (!input.trim() && !showHint) return;

    const correct = questions[cur].word.toLowerCase();
    const isCorrect = input.toLowerCase().trim() === correct;
    const responseTime = Date.now() - (startRef.current || Date.now());
    
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    }
    setIsSubmitted(true);

    // Record review in SRS
    recordReview(
      questions[cur].index, 
      isCorrect ? 'remembered' : 'forgot',
      responseTime
    );
  };

  const handleNext = () => {
    if (cur < questions.length - 1) {
      setCur(c => c + 1);
      setInput('');
      setIsSubmitted(false);
      setShowHint(false);
      startRef.current = Date.now();
    } else {
      setIsFinished(true);
    }
  };

  if (loading || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isFinished) {
    const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-10"
        >
          <div className="space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-sans">Session Complete!</h1>
              <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">
                You correctly spelled <span className="text-foreground font-bold">{score} / {questions.length}</span> words with <span className="text-primary font-bold">{accuracy}% accuracy</span>.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 text-center">Ready for the Next Challenge?</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link 
                to={levelParam ? `/mcq?level=${levelParam}` : "/mcq"} 
                className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 rounded-2xl transition-all group border border-border/5 active:scale-[0.99] text-left w-full"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Brain className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block text-foreground leading-snug">MCQ Quiz</span>
                    <span className="text-xs text-muted-foreground">Test vocabulary with options</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
              <Link 
                to={levelParam ? `/matching?level=${levelParam}` : "/matching"} 
                className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 rounded-2xl transition-all group border border-border/5 active:scale-[0.99] text-left w-full"
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
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Link 
              to={levelParam ? `/study-level/${levelParam}` : "/"} 
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] text-center"
            >
              {levelParam ? `Return to Level ${levelParam}` : "Return Home"}
            </Link>
            <button 
              onClick={generate} 
              className="w-full py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 inline-block mr-1.5 -translate-y-0.5" /> Challenge Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = questions[cur];
  const isCorrect = input.toLowerCase().trim() === q.word.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between no-print">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-card text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="h-1.5 w-40 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((cur + 1) / questions.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            Step {cur + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="space-y-16 py-8">
        <header className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">Definition & Context</h2>
            <p className="text-3xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight max-w-2xl mx-auto">
              {q.explanation.replace(new RegExp(`^${q.word}\\s+means\\s+(to\\s+)?`, 'i'), '').charAt(0).toUpperCase() + q.explanation.replace(new RegExp(`^${q.word}\\s+means\\s+(to\\s+)?`, 'i'), '').slice(1)}
            </p>
            <p className="text-3xl sm:text-4xl font-black text-accent/80 font-bengali tracking-tight">
              {q.bengali}
            </p>
          </div>
          <div className="flex justify-center gap-4 items-center">
             <span className="px-3 py-1 rounded-full bg-secondary text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {q.pos}
            </span>
            <button 
              onClick={() => speak(q.word)}
              className="p-2 rounded-full bg-card border border-border/50 text-muted-foreground hover:text-primary transition-colors"
              title="Listen to word"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            animate={shouldShake ? { x: [-10, 10, -10, 10, -5, 5, -2, 2, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSubmitted}
              placeholder={showHint ? `${q.word[0]}${'.'.repeat(q.word.length - 2)}${q.word[q.word.length - 1]}` : "Type your answer..."}
              className={`w-full text-center text-3xl sm:text-5xl font-black bg-transparent border-b-4 outline-none pb-4 transition-all uppercase tracking-widest
                ${isSubmitted 
                  ? isCorrect ? 'border-success text-success' : 'border-destructive text-destructive'
                  : 'border-muted focus:border-primary'
                }`}
              autoComplete="off"
              spellCheck="false"
            />
            <div className="text-center min-h-[5.5rem] flex items-center justify-center py-4">
              {isSubmitted && !isCorrect && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-1"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2.5em] text-muted-foreground/50">Correct Spelling</p>
                  <p className="text-xl font-black uppercase tracking-widest text-success">
                    {q.word}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
 
          <div className="flex justify-center gap-4">
            {!isSubmitted ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border/50 text-muted-foreground font-bold hover:border-primary/50 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Lightbulb className="w-4 h-4" /> Hint
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                >
                  <Keyboard className="w-4 h-4" /> Check
                </button>
              </>
            ) : (
              <motion.button
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                type="button"
                onClick={handleNext}
                autoFocus
                className="group flex items-center gap-3 px-14 py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {cur === questions.length - 1 ? 'Finish' : 'Next Word'}{' '}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}
          </div>
        </form>
      </div>
 
      <div className="pt-12 text-center max-w-sm mx-auto no-print space-y-2">
        <div className="inline-flex items-center justify-center gap-2 text-primary/70">
          <Brain className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Mastery Tip</span>
        </div>
        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          Typing the word manually builds much stronger neural pathways than MCQ.
        </p>
      </div>
    </div>
  );
}
