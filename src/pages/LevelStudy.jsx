import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudyEngine } from '@/lib/useStudyEngine';
import FlashcardView from '@/components/flashcard/FlashcardView';
import LevelQuiz from '@/components/level/LevelQuiz';
import { ArrowLeft, BookOpen, Brain, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LevelStudy() {
  const { levelNumber } = useParams();
  const num = parseInt(levelNumber);
  const navigate = useNavigate();
  const { getWordsForLevel, recordReview, recordLevelQuiz, levelProgress, loading } = useStudyEngine();
  
  const [view, setView] = useState('menu'); // 'menu', 'practice', 'quiz'
  const [currentIndex, setCurrentIndex] = useState(0);

  const words = useMemo(() => getWordsForLevel(num), [getWordsForLevel, num]);
  const progress = levelProgress.find(p => p.level_number === num) || {};

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const handleRate = async (confidence, responseTime) => {
    const word = words[currentIndex];
    await recordReview(word.index, confidence, responseTime);
    if (currentIndex < words.length - 1) setCurrentIndex(i => i + 1);
    else setView('menu');
  };

  const handleQuizComplete = async (score) => {
    await recordLevelQuiz(num, score);
    navigate('/levels');
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
        
        {view !== 'menu' && (
          <button onClick={() => setView('menu')} className="text-xs font-bold text-primary hover:underline">Exit Session</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'menu' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
          >
            <button 
              onClick={() => { setView('practice'); setCurrentIndex(0); }}
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
              word={words[currentIndex]} 
              onRate={handleRate} 
              index={currentIndex} 
              total={words.length} 
            />
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
