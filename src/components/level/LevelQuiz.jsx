import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy, RefreshCcw, ArrowRight } from 'lucide-react';

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
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-secondary text-secondary-foreground font-bold rounded-2xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
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
              let statusClass = "bg-secondary/50 border-border/50 hover:border-primary/50 text-foreground";

              if (selectedAnswer) {
                if (isCorrect) statusClass = "bg-success/10 border-success text-success";
                else if (isSelected) statusClass = "bg-destructive/10 border-destructive text-destructive";
                else statusClass = "opacity-50 grayscale bg-secondary/30";
              }

              return (
                <button
                  key={key}
                  disabled={!!selectedAnswer}
                  onClick={() => handleAnswer(key)}
                  className={`relative group w-full text-left p-5 rounded-2xl border-2 font-medium transition-all duration-300 flex items-center justify-between ${statusClass}`}
                >
                  <span className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                      isSelected ? 'bg-current text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}>
                      {key}
                    </span>
                    {value}
                  </span>

                  {selectedAnswer && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      {isCorrect ? <Check className="w-5 h-5 text-success" /> : isSelected ? <X className="w-5 h-5 text-destructive" /> : null}
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