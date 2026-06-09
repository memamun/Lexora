import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy, ArrowRight, Clock, Target, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DIFFICULTY_MAP } from '@/lib/wordData';
import { shuffle } from '@/lib/utils';

const LABELS = ['A', 'B', 'C', 'D'];

function generateQuestions(words) {
  return shuffle(words).map(word => {
    const distractors = [];
    const maxDistractors = Math.min(3, words.length - 1);

    // Pick exactly maxDistractors without duplicating and without iterating over all words.
    // Use an array of selected indices or words to keep track.
    // Since N is usually small in a level, but could be large, a small set/array of length <=3 is fine.
    // Use a while loop with a hard cap to avoid theoretical infinite loops in case of extreme duplication.
    let maxAttempts = maxDistractors * 10;
    while (distractors.length < maxDistractors && maxAttempts > 0) {
      const randomIndex = Math.floor(Math.random() * words.length);
      const candidate = words[randomIndex];
      if (candidate.word !== word.word && !distractors.some(d => d.word === candidate.word)) {
        distractors.push(candidate);
      }
      maxAttempts--;
    }

    // In case the loop ended due to maxAttempts and we still don't have enough distractors,
    // fallback to sequential scan to guarantee we get up to maxDistractors unique distractors.
    let scanIndex = 0;
    while (distractors.length < maxDistractors && scanIndex < words.length) {
      const candidate = words[scanIndex];
      if (candidate.word !== word.word && !distractors.some(d => d.word === candidate.word)) {
        distractors.push(candidate);
      }
      scanIndex++;
    }

    const correctAnswer = word.options?.[word.answer] || word.answer;
    const optionsArray = shuffle([correctAnswer, ...distractors.map(d => d.options?.[d.answer] || d.answer)]);
    const options = {};
    LABELS.forEach((label, i) => { options[label] = optionsArray[i]; });
    const answer = LABELS.find(key => options[key] === correctAnswer);
    return { word: word.word, wordIndex: word.index, options, answer, userAnswer: null, isCorrect: null, difficulty: word.difficulty, explanation: word.explanation };
  });
}

export default function LevelQuiz({ words, levelNumber, onComplete, hideLevelUnlock }) {
  const [questions, setQuestions] = useState(() => generateQuestions(words));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTime = useRef(Date.now());

  const current = questions[currentIndex] || null;
  const correctCount = questions.filter(q => q.isCorrect).length;
  const totalQuestions = questions.length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = scorePercent >= 80;

  useEffect(() => {
    if (isFinished && passed) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [isFinished, passed]);

  const handleAnswer = (optionKey) => {
    if (selectedAnswer) return;
    setSelectedAnswer(optionKey);
    const isCorrect = optionKey === current.answer;
    setQuestions(prev => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], userAnswer: optionKey, isCorrect };
      return next;
    });
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
    } else {
      setElapsedTime(Math.round((Date.now() - startTime.current) / 1000));
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    setQuestions(generateQuestions(words));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsFinished(false);
    setElapsedTime(0);
    startTime.current = Date.now();
  };

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  /* ─── Framer Motion Animation Variants ─── */
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 280, damping: 20 }
    }
  };

  /* ─── Result screen ─── */

  if (isFinished) {
    const incorrect = questions.filter(q => !q.isCorrect);
    const statCards = [
      { label: 'Correct', value: correctCount, icon: Check, color: 'text-success', bg: 'bg-success/5 border-success/10' },
      { label: 'Wrong', value: totalQuestions - correctCount, icon: X, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/10' },
      { label: 'Accuracy', value: `${scorePercent}%`, icon: Target, color: 'text-accent', bg: 'bg-accent/5 border-accent/10' },
      { label: 'Time', value: `${minutes}:${String(seconds).padStart(2, '0')}`, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/30 border-border/50' },
    ];

    return (
      <div className="relative space-y-8 max-w-2xl mx-auto">
        {/* Background ambient glows */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

        {/* ─── Score Hero ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/75 backdrop-blur-md border border-border/60 rounded-3xl shadow-xl p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 transition-all duration-700 pointer-events-none">
            <Trophy className={`w-48 h-48 ${passed ? 'text-accent' : 'text-muted-foreground'} opacity-[0.04]`} strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 blur-[60px] opacity-[0.06] rounded-full pointer-events-none"
            style={{ backgroundColor: passed ? '#f59e0b' : '#64748b' }}
          />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative">
              <Trophy className={`w-16 h-16 sm:w-20 sm:h-20 ${passed ? 'text-accent drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'text-muted-foreground'}`} />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className={`absolute -top-1 -right-1 text-xs font-bold w-9 h-9 rounded-full flex items-center justify-center border-[3px] border-card shadow-lg ${passed ? 'bg-primary text-primary-foreground shadow-primary/20' : 'bg-muted text-muted-foreground'}`}
              >
                {scorePercent}%
              </motion.div>
            </div>
            <div className="text-center space-y-1">
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-serif text-2xl sm:text-3xl font-bold text-foreground"
              >
                {passed ? 'Level Mastered!' : 'Keep Practicing'}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-muted-foreground text-sm font-medium"
              >
                You got {correctCount} of {totalQuestions} correct
              </motion.p>
              {passed && !hideLevelUnlock && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-xs font-semibold text-accent flex items-center justify-center gap-1"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Next level unlocked!
                </motion.p>
              )}
              {!passed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-xs text-destructive font-semibold"
                >
                  80% required to unlock next level — study the words below and try again
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── Stat Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
            >
              <div className={`${card.bg} border border-border/50 rounded-2xl p-4 relative overflow-hidden group min-h-[90px] flex flex-col justify-between backdrop-blur-sm shadow-sm`}>
                <div className="relative z-10">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-60 block mb-1">
                    {card.label}
                  </span>
                  <p className={`text-2xl font-black tabular-nums ${card.color} tracking-tight`}>
                    {card.value}
                  </p>
                </div>
                <div className="absolute -bottom-4 -right-4 transition-all duration-700 pointer-events-none">
                  <card.icon className={`w-14 h-14 ${card.color} opacity-[0.06]`} strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-6 -right-6 w-20 h-20 blur-[30px] opacity-[0.06] rounded-full pointer-events-none"
                  style={{ backgroundColor: 'currentColor' }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ─── Words to Review ─── */}
        {incorrect.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card/70 backdrop-blur-md border border-border/60 rounded-2xl p-5 space-y-4 shadow-md relative z-10"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Words needing focus</h3>
              <span className="text-[10px] bg-destructive/10 border border-destructive/20 text-destructive text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {incorrect.length} words
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {incorrect.map(q => (
                <Link key={q.wordIndex} to={`/word/${q.wordIndex}`}
                  className="px-3 py-1.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl hover:bg-destructive/20 hover:border-destructive/40 transition-all active:scale-95"
                >
                  {q.word}
                </Link>
              ))}
            </div>
            <div className="flex gap-4 pt-1 border-t border-border/20">
              <Link to={`/spelling?level=${levelNumber}`}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                Spelling Practice →
              </Link>
              <Link to={`/matching?level=${levelNumber}`}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                Matching Drill →
              </Link>
            </div>
          </motion.div>
        )}

        {/* ─── Primary Actions ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3 relative z-10"
        >
          <button
            onClick={() => onComplete({ score: scorePercent, wrongWordIndices: incorrect.map(q => q.wordIndex), totalQuestions, correctCount })}
            className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:opacity-95 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-xs active:scale-[0.99]"
          >
            {passed ? 'Continue to Next Level' : 'Back to Level Dashboard'}
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRetry}
              className="py-3 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-border/30 active:scale-[0.98]"
            >
              Try Quiz Again
            </button>
            <Link
              to="/levels"
              className="py-3 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-border/30 active:scale-[0.98] text-center flex items-center justify-center"
            >
              Select Level
            </Link>
          </div>
        </motion.div>

        {/* ─── Mastery Answer Review Panel ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-6 pt-4 relative z-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">Mastery Quiz Review</h3>
              <p className="text-xs text-muted-foreground">Detailed question-by-question breakdown of your choices</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full self-start sm:self-center">
              {totalQuestions} Questions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q, i) => (
              <motion.div
                key={q.wordIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card/65 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between ${
                  q.isCorrect 
                    ? 'border-t-4 border-t-success/60 shadow-[0_4px_20px_-10px_rgba(34,197,94,0.1)]' 
                    : 'border-t-4 border-t-destructive/60 shadow-[0_4px_20px_-10px_rgba(239,68,68,0.1)]'
                }`}
              >
                {/* Visual Glow highlight inside card */}
                <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full opacity-[0.05] pointer-events-none ${
                  q.isCorrect ? 'bg-success' : 'bg-destructive'
                }`} />

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="text-[10px] font-black text-muted-foreground/60 tracking-wider">QUESTION {i + 1}</span>
                    {q.isCorrect ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                        <Check className="w-3 h-3 stroke-[3]" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                        <X className="w-3 h-3 stroke-[3]" /> Incorrect
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg font-black text-foreground uppercase tracking-wide leading-tight">{q.word}</h4>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  {LABELS.map(label => {
                    const isUserAnswer = q.userAnswer === label;
                    const isCorrectAnswer = q.answer === label;
                    
                    let cellClass = 'bg-secondary/15 border-border/40 text-muted-foreground/80';
                    let badgeClass = 'bg-muted/40 text-muted-foreground';
                    let iconNode = null;

                    if (isCorrectAnswer) {
                      cellClass = 'bg-success/15 border-success/40 text-success font-semibold shadow-[0_0_15px_-5px_rgba(34,197,94,0.15)]';
                      badgeClass = 'bg-success text-white shadow-sm shadow-success/10';
                      iconNode = <Check className="w-3.5 h-3.5 text-success stroke-[3] shrink-0" />;
                    } else if (isUserAnswer && !q.isCorrect) {
                      cellClass = 'bg-destructive/15 border-destructive/40 text-destructive font-semibold shadow-[0_0_15px_-5px_rgba(239,68,68,0.15)]';
                      badgeClass = 'bg-destructive text-white shadow-sm shadow-destructive/10';
                      iconNode = <X className="w-3.5 h-3.5 text-destructive stroke-[3] shrink-0" />;
                    }

                    return (
                      <div key={label}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2.5 transition-all ${cellClass}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${badgeClass}`}>
                            {label}
                          </span>
                          <span className="line-clamp-2 leading-tight">{q.options[label]}</span>
                        </div>
                        {iconNode}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Active quiz ─── */

  if (!current) return null;

  return (
    <div className="relative max-w-lg mx-auto space-y-6">
      {/* Background ambient glows */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      <div className="flex items-center gap-3 relative z-10">
        <span className="text-xs font-mono text-muted-foreground">{currentIndex + 1}/{totalQuestions}</span>
        <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
        </div>
        <span className="text-xs font-mono text-success">{correctCount} ✓</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="space-y-5 relative z-10 w-full"
        >
          <div className="text-center space-y-3">
            {current.difficulty && DIFFICULTY_MAP[current.difficulty] && (
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${DIFFICULTY_MAP[current.difficulty].bg} ${DIFFICULTY_MAP[current.difficulty].color} border ${DIFFICULTY_MAP[current.difficulty].border}`}>
                {DIFFICULTY_MAP[current.difficulty].label}
              </span>
            )}
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground break-words uppercase">
              {current.word}
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Choose the synonym</p>
          </div>

          <div className="space-y-2">
            {LABELS.map(label => {
              const isCorrectOption = label === current.answer;
              const isSelected = selectedAnswer === label;
              const optionText = current.options[label];

              let cls = 'border-border/50 hover:border-primary/30 hover:bg-secondary/30 cursor-pointer';
              if (selectedAnswer !== null) {
                if (isCorrectOption) cls = 'border-success/40 bg-success/5 text-success cursor-default';
                else if (isSelected) cls = 'border-destructive/40 bg-destructive/5 text-destructive cursor-default';
                else cls = 'border-border/20 opacity-40 cursor-default';
              }

              return (
                <button
                  key={label}
                  disabled={!!selectedAnswer}
                  onClick={() => handleAnswer(label)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${cls}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0">
                      {label}
                    </span>
                    {optionText}
                  </div>
                  {selectedAnswer !== null && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                  {selectedAnswer !== null && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">{current.explanation}</p>
              <button onClick={handleNext} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium shrink-0">
                {currentIndex === totalQuestions - 1 ? 'Finish' : 'Next'} <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
