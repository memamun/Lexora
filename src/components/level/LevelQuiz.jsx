import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LevelQuiz({ words, levelNumber, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const quizWords = useMemo(() => {
    const selected = shuffle([...words]).slice(0, 15);
    return selected.map(word => {
      const otherWords = words.filter(w => w.word !== word.word);
      const distractors = shuffle(otherWords).slice(0, 3);
      const optionsArray = shuffle([word.meaning, ...distractors.map(d => d.meaning)]);
      const options = {
        'A': optionsArray[0],
        'B': optionsArray[1],
        'C': optionsArray[2],
        'D': optionsArray[3]
      };
      const answer = Object.keys(options).find(key => options[key] === word.meaning);
      return { ...word, options, answer };
    });
  }, [words]);

  const currentWord = quizWords[currentIndex];

  const handleAnswer = (optionKey) => {
    if (selectedAnswer) return;
    setSelectedAnswer(optionKey);
    const isCorrect = optionKey === currentWord.answer;
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      if (currentIndex < quizWords.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
      } else {
        setIsFinished(true);
      }
    }, 1200);
  };

  const finalScorePercent = Math.round((score / quizWords.length) * 100);

  useEffect(() => {
    if (isFinished && finalScorePercent >= 80) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isFinished, finalScorePercent]);

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 px-6 bg-card border border-border/50 rounded-3xl shadow-xl space-y-6"
      >
        <div className="flex justify-center">
          <div className="relative">
            <Trophy className={`w-20 h-20 ${finalScorePercent >= 80 ? 'text-accent animate-bounce' : 'text-muted-foreground'}`} />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-sm font-bold w-10 h-10 rounded-full flex items-center justify-center border-4 border-card"
            >
              {finalScorePercent}%
            </motion.div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            {finalScorePercent >= 80 ? 'Level Mastered!' : 'Keep Practicing'}
          </h2>
          <p className="text-muted-foreground">
            You got {score} out of {quizWords.length} synonyms correct.
          </p>
        </div>

        <div className="pt-6 flex flex-col gap-3">
          <button
            onClick={() => onComplete(finalScorePercent)}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            {finalScorePercent >= 80 ? 'Finish & Unlock Next' : 'Back to Path'}
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link 
              to={`/spelling?level=${levelNumber}`}
              className="py-3 bg-card border border-border/50 text-foreground text-xs font-bold rounded-xl hover:bg-secondary/30 transition-all flex items-center justify-center gap-2"
            >
              Spelling Master
            </Link>
            <Link 
              to={`/matching?level=${levelNumber}`}
              className="py-3 bg-card border border-border/50 text-foreground text-xs font-bold rounded-xl hover:bg-secondary/30 transition-all flex items-center justify-center gap-2"
            >
              Matching Drill
            </Link>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-secondary/50 text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-secondary transition-all"
          >
            Try Quiz Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <span>Question {currentIndex + 1} of {quizWords.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / quizWords.length) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Select the synonym for:</span>
            <h2 className="font-serif text-4xl font-bold text-foreground tracking-tight uppercase">
              {currentWord.word}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Object.entries(currentWord.options).map(([key, value]) => {
              const isCorrect = key === currentWord.answer;
              const isSelected = selectedAnswer === key;
              
              let containerClass = "bg-secondary/20 border-border/40 text-foreground hover:border-primary/50 hover:bg-secondary/40";
              let indicatorClass = "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary";
              let iconColor = "";

              if (selectedAnswer) {
                if (isCorrect) {
                  containerClass = "bg-success/15 border-success text-success shadow-[0_0_20px_-5px_rgba(34,197,94,0.4)] scale-[1.02]";
                  indicatorClass = "bg-success text-white shadow-lg shadow-success/20";
                  iconColor = "text-success";
                } else if (isSelected) {
                  containerClass = "bg-destructive/15 border-destructive text-destructive shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] scale-[0.98]";
                  indicatorClass = "bg-destructive text-white shadow-lg shadow-destructive/20";
                  iconColor = "text-destructive";
                } else {
                  containerClass = "opacity-30 bg-secondary/10 border-border/10 grayscale pointer-events-none";
                  indicatorClass = "bg-muted/50 text-muted-foreground/50";
                }
              }

              return (
                <button
                  key={key}
                  disabled={!!selectedAnswer}
                  onClick={() => handleAnswer(key)}
                  className={`relative group w-full text-left p-5 rounded-2xl border-2 font-medium transition-all duration-300 flex items-center justify-between ${containerClass}`}
                >
                  <span className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${indicatorClass}`}>
                      {key}
                    </span>
                    <span className="text-base sm:text-lg">{value}</span>
                  </span>

                  {selectedAnswer && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -20 }} 
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      {isCorrect ? (
                        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-success stroke-[3]" />
                        </div>
                      ) : isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                          <X className="w-4 h-4 text-destructive stroke-[3]" />
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}