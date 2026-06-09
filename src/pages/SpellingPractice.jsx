import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS } from '@/lib/wordData';
import { shuffle } from '@/lib/utils';
import { PremiumArrowRightIcon as ArrowRight, PremiumSpellingIcon as Keyboard, PremiumLightbulbIcon as Lightbulb, PremiumVolumeIcon as Volume2, PremiumBrainIcon as Brain } from '@/components/ui/PremiumIcons';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { speak } from '@/utils/audio';
import confetti from 'canvas-confetti';
import SessionComplete from '@/components/SessionComplete';
import PageHeader from '@/components/layout/PageHeader';
import LexoraLogo from '@/components/ui/LexoraLogo';

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
        const extra = shuffle(ALL_WORDS).filter(w => !pool.find(p => p.index === w.index));
        pool = [...pool, ...extra.slice(0, 15 - pool.length)];
      }
    }
    
    if (pool.length === 0 && !loading) {
      // Emergency fallback
      pool = ALL_WORDS.slice(0, 10);
    }

    const count = levelParam ? pool.length : Math.min(pool.length, 15);
    setQuestions(shuffle(pool).slice(0, count));
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
      isCorrect ? 'instant' : 'forgot',
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      </div>
    );
  }

  if (isFinished) {
    const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <SessionComplete 
        score={score} 
        total={questions.length} 
        accuracy={accuracy} 
        levelParam={levelParam} 
        onRetry={generate} 
        nextRoutes={['mcq', 'matching']} 
      />
    );
  }

  const q = questions[cur];
  const isCorrect = input.toLowerCase().trim() === q.word.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="no-print">
        <PageHeader 
          backTo={-1} 
          action={
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
          }
        />
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
              aria-label="Spelling answer"
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
