import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS } from '@/lib/wordData';
import { ArrowLeft, CheckCircle2, ArrowRight, Keyboard, Lightbulb, Volume2, Brain, Zap, RotateCcw } from 'lucide-react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { speak } from '@/utils/audio';

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

    const count = Math.min(pool.length, 10);
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

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isSubmitted || !input.trim()) return;

    const correct = questions[cur].word.toLowerCase();
    const isCorrect = input.toLowerCase().trim() === correct;
    const responseTime = Date.now() - (startRef.current || Date.now());
    
    if (isCorrect) setScore(s => s + 1);
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
      <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 bg-card border border-border/50 rounded-[3rem] p-12 shadow-2xl shadow-primary/5"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-foreground">Session Complete!</h1>
            <p className="text-lg text-muted-foreground">You correctly spelled <span className="text-foreground font-bold">{score} / {questions.length}</span> words.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={generate} 
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-secondary text-secondary-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-all"
            >
              <RotateCcw className="w-5 h-5" /> Challenge Again
            </button>
            <Link 
              to="/" 
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
              Return Home
            </Link>
          </div>

          <div className="pt-10 border-t border-border/30">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-6">Ready for the Next Challenge?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link 
                to={levelParam ? `/mcq?level=${levelParam}` : "/mcq"} 
                className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-sm font-bold">MCQ Quiz</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to={levelParam ? `/matching?level=${levelParam}` : "/matching"} 
                className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold">Matching Drill</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
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
          <div className="relative">
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
            {isSubmitted && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-4 min-h-[4rem]"
              >
                {!isCorrect && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Correct spelling is</p>
                    <p className="text-lg font-black uppercase tracking-widest text-success bg-success/5 border border-success/10 inline-block px-4 py-1 rounded-lg">
                      {q.word}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!isSubmitted ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border/50 text-muted-foreground font-bold hover:border-primary/50 transition-all disabled:opacity-50"
                >
                  <Lightbulb className="w-4 h-4" /> Hint
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
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
                className="flex items-center gap-3 px-14 py-4 rounded-2xl bg-foreground text-background font-bold hover:opacity-90 transition-all shadow-xl shadow-foreground/10"
              >
                Next Word <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </form>
      </div>

      <div className="pt-12 no-print">
        <div className="p-6 rounded-3xl bg-card border border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mastery Tip</p>
              <p className="text-sm font-medium">Typing the word manually builds much stronger neural pathways than MCQ.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
