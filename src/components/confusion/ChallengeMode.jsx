import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALL_WORDS } from '@/lib/wordData';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, CheckCircle2, XCircle, ChevronRight, RotateCcw, ArrowLeft, Flame, Trophy } from 'lucide-react';

const TIME_LIMIT = 15;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMCQ(word) {
  const correct = word.options?.[word.answer] || word.answer;
  const allOptions = Object.values(word.options || {}).filter(Boolean);
  return {
    word: word.word, correct, explanation: word.explanation,
    options: shuffle(allOptions), index: word.index,
  };
}

function TimerRing({ timeLeft, total }) {
  const pct = timeLeft / total;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = timeLeft <= 5 ? '#ef4444' : timeLeft <= 9 ? '#f59e0b' : 'hsl(var(--primary))';

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.3s linear, stroke 0.3s' }}
        />
      </svg>
      <span className={`text-sm font-bold font-mono z-10 ${timeLeft <= 5 ? 'text-destructive' : 'text-foreground'}`}>
        {timeLeft}
      </span>
    </div>
  );
}

function ChallengeResult({ score, total, timeouts, onRetry, onClose }) {
  const pct = Math.round((score / total) * 100);
  const emoji = pct >= 80 ? '\u{1F3C6}' : pct >= 60 ? '\u{1F3AF}' : pct >= 40 ? '\u{1F4AA}' : '\u{1F4D6}';
  const msg = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Great effort!' : pct >= 40 ? 'Keep pushing!' : 'Keep practicing!';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="max-w-sm mx-auto py-6 space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="text-5xl">{emoji}</div>
        <h2 className="font-serif text-2xl font-bold text-foreground">{msg}</h2>
        <p className="text-sm text-muted-foreground">Challenge Mode Complete</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-3 divide-x divide-border text-center">
          {[
            { label: 'Score', value: `${score}/${total}`, color: 'text-foreground' },
            { label: 'Accuracy', value: `${pct}%`, color: pct >= 60 ? 'text-success' : 'text-primary' },
            { label: 'Timeouts', value: timeouts, color: timeouts > 0 ? 'text-destructive' : 'text-success' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-3">
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${pct >= 60 ? 'bg-success' : 'bg-primary'}`}
            />
          </div>
        </div>

        {pct >= 80 && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
            <Trophy className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">You've mastered your hardest words!</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
        <button onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </motion.div>
  );
}

export default function ChallengeMode({ reviews, recordReview, onClose }) {
  const questionsRef = useRef(null);
  if (questionsRef.current === null) {
    const scored = reviews
      .filter(r => r.total_reviews >= 1)
      .map(r => ({
        word: ALL_WORDS[r.word_index],
        acc: r.correct_count / r.total_reviews,
        reviews: r.total_reviews,
      }))
      .filter(x => x.word)
      .sort((a, b) => a.acc - b.acc || b.reviews - a.reviews);

    let pool = scored.map(x => x.word).slice(0, 20);

    if (pool.length < 20) {
      const studied = new Set(reviews.map(r => r.word_index));
      const newWords = ALL_WORDS.filter(w => !studied.has(w.index));
      pool = [...pool, ...shuffle(newWords).slice(0, 20 - pool.length)];
    }

    questionsRef.current = shuffle(pool).slice(0, 20).map(buildMCQ);
  }
  const questions = questionsRef.current;

  const [screen, setScreen] = useState('quiz');
  const [cur, setCur] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeouts, setTimeouts] = useState(0);
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);

  const q = questions[cur];

  const advance = useCallback(() => {
    if (cur + 1 >= questions.length) {
      setScreen('result');
    } else {
      setCur(c => c + 1);
      setSelected(null);
      setTimedOut(false);
      setTimeLeft(TIME_LIMIT);
      startRef.current = Date.now();
    }
  }, [cur, questions.length]);

  useEffect(() => {
    if (selected !== null || timedOut || screen !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setTimedOut(true);
          setTimeouts(n => n + 1);
          setCombo(0);
          void recordReview(q.index, 'forgot', TIME_LIMIT * 1000);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cur, selected, timedOut, screen, q, recordReview]);

  const handleSelect = (opt) => {
    if (selected !== null || timedOut) return;
    clearInterval(timerRef.current);
    const isCorrect = opt === q.correct;
    const newCombo = isCorrect ? combo + 1 : 0;
    setSelected(opt);
    setCombo(newCombo);
    if (isCorrect) setScore(s => s + 1);
    void recordReview(q.index, isCorrect ? 'instant' : 'forgot', Date.now() - startRef.current);
  };

  const handleRetry = () => {
    setCur(0); setSelected(null); setTimedOut(false);
    setTimeLeft(TIME_LIMIT); setScore(0); setCombo(0); setTimeouts(0);
    setScreen('quiz');
    startRef.current = Date.now();
  };

  if (screen === 'result') {
    return <ChallengeResult score={score} total={questions.length} timeouts={timeouts} onRetry={handleRetry} onClose={onClose} />;
  }

  const progress = cur / questions.length;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Challenge Mode</span>
        </div>
        <div className="flex items-center gap-2">
          {combo >= 2 && (
            <motion.div key={combo} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 text-primary text-xs font-bold"
            >
              <Flame className="w-3.5 h-3.5" /> x{combo}
            </motion.div>
          )}
          <span className="text-xs font-mono text-success">{score} checkmark</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{cur + 1} / {questions.length}</span>
          <span>Hardest 20 words</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Synonym for</p>
            <h2 className="font-serif text-4xl font-bold text-foreground">{q.word}</h2>
          </div>
          <TimerRing timeLeft={timeLeft} total={TIME_LIMIT} />
        </div>

        {timedOut && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5"
          >
            <Timer className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">Time's up! The answer was: <span className="font-bold">{q.correct}</span></p>
          </motion.div>
        )}

        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.correct;
            const isSelected = selected === opt;
            const showAnswer = selected !== null || timedOut;
            let cls = 'border-border/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer';
            if (showAnswer) {
              if (isCorrect) cls = 'border-success/50 bg-success/8 cursor-default';
              else if (isSelected) cls = 'border-destructive/50 bg-destructive/8 cursor-default';
              else cls = 'border-border/20 opacity-30 cursor-default';
            }
            return (
              <button key={i} onClick={() => handleSelect(opt)} disabled={showAnswer}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${cls}`}
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0
                  ${showAnswer && isCorrect ? 'bg-success/20 text-success' :
                    showAnswer && isSelected ? 'bg-destructive/20 text-destructive' :
                    'bg-muted/60 text-muted-foreground'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={showAnswer && isCorrect ? 'text-success font-semibold' : showAnswer && isSelected ? 'text-destructive' : 'text-foreground'}>
                  {opt}
                </span>
                <span className="ml-auto">
                  {showAnswer && isCorrect && <CheckCircle2 className="w-4 h-4 text-success" />}
                  {showAnswer && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive" />}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {(selected !== null || timedOut) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="bg-muted/30 border border-border/40 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
              </div>
              <button onClick={advance}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {cur + 1 >= questions.length ? 'See Results' : 'Next'} <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
