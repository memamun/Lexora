import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS } from '@/lib/wordData';
import FlashcardView from '@/components/flashcard/FlashcardView';
import { ArrowLeft, Brain, Keyboard, Zap, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const MODES = [
  { key: 'smart',      label: 'Smart Mix' },
  { key: 'due',        label: 'Due Review' },
  { key: 'weak',       label: 'Weak Words' },
  { key: 'forgetting', label: 'Near Forgetting' },
  { key: 'new',        label: 'New Words' },
];

function dedup(arr) {
  const seen = new Set();
  return arr.filter(w => w && !seen.has(w.index) && seen.add(w.index));
}

export default function Flashcards() {
  const { loading, getDueWords, getWeakWords, getNearForgettingWords, getNewWords, recordReview } = useStudyEngine();
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get('mode') || 'smart');
  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(false);

  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level');

  // Derive the candidate queue reactively
  const candidateQueue = useMemo(() => {
    if (levelParam) {
      const levelNum = parseInt(levelParam);
      return ALL_WORDS.filter(w => w.level === levelNum);
    }
    
    if (mode === 'due') return dedup(getDueWords.map(r => ALL_WORDS[r.word_index]));
    if (mode === 'weak') return dedup(getWeakWords.map(r => ALL_WORDS[r.word_index]));
    if (mode === 'forgetting') return dedup(getNearForgettingWords.map(r => ALL_WORDS[r.word_index]));
    if (mode === 'new') return getNewWords;
    const due = getDueWords.map(r => ALL_WORDS[r.word_index]);
    const weak = getWeakWords.slice(0, 5).map(r => ALL_WORDS[r.word_index]);
    const newW = getNewWords.slice(0, 8);
    return dedup([...due, ...weak, ...newW]).slice(0, 30);
  }, [mode, getDueWords, getWeakWords, getNearForgettingWords, getNewWords, levelParam]);

  // Lock the queue into a session when ready
  useEffect(() => {
    if (!loading && sessionQueue.length === 0 && !done) {
      setSessionQueue(candidateQueue);
    }
  }, [loading, candidateQueue, sessionQueue.length, done]);

  const handleRate = useCallback(async (confidence, responseTime) => {
    const word = sessionQueue[currentIndex];
    if (!word) return;
    
    // Engine update happens optimistically in background
    await recordReview(word.index, confidence, responseTime);
    
    let updatedQueue = [...sessionQueue];
    if (confidence === 'forgot') {
      // Repeat 1 or 2 times again randomly before the completion of the practice
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
      setDone(true);
    }
  }, [sessionQueue, currentIndex, recordReview]);

  const restart = () => { 
    setSessionQueue(candidateQueue);
    setCurrentIndex(0); 
    setDone(false); 
  };

  const changeMode = (m) => { 
    setMode(m); 
    setSessionQueue([]); // Trigger re-init
    setCurrentIndex(0); 
    setDone(false); 
  };

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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><ArrowLeft className="w-4 h-4 text-muted-foreground" /></Link>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground leading-tight">Flashcards</h1>
            <p className="text-[10px] text-muted-foreground tracking-wide uppercase font-medium">{totalUnique} in queue</p>
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {MODES.map(m => (
            <button key={m.key} onClick={() => changeMode(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                mode === m.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground bg-secondary/50 hover:text-foreground'
              }`}
            >{m.label}</button>
          ))}
        </div>
      </div>

      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-8 bg-card border border-border/50 rounded-[2.5rem] shadow-xl shadow-primary/5 mx-4">
          <div className="space-y-4">
            <div className="text-6xl animate-bounce">🎉</div>
            <h2 className="font-serif text-3xl font-bold text-foreground tracking-tight">Session Complete!</h2>
            <p className="text-sm text-muted-foreground font-medium max-w-[240px] mx-auto">You've successfully reviewed <span className="text-foreground font-bold">{totalUnique} words</span> today.</p>
          </div>

          <div className="space-y-4 px-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Ready for a Challenge?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link 
                to={levelParam ? `/mcq?level=${levelParam}` : "/mcq"} 
                className="flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Brain className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm font-bold">MCQ Quiz</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                to={levelParam ? `/spelling?level=${levelParam}` : "/spelling"} 
                className="flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-500/10 rounded-xl flex items-center justify-center">
                    <Keyboard className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-sm font-bold">Spelling Master</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                to={levelParam ? `/matching?level=${levelParam}` : "/matching"} 
                className="flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary rounded-2xl transition-all group sm:col-span-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold">Matching Drill</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-4 border-t border-border/30 mx-8">
            <button onClick={restart} className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity">Review Again</button>
            <Link to="/" className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-secondary/80 transition-all text-center">Dashboard</Link>
          </div>
        </motion.div>
      ) : sessionQueue.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="text-4xl">✨</div>
          <h2 className="font-serif text-xl font-bold text-foreground">Queue Empty</h2>
          <p className="text-sm text-muted-foreground">Try a different mode or come back later.</p>
        </div>
      ) : (
        <FlashcardView word={sessionQueue[currentIndex]} onRate={handleRate} index={uniqueReviewedCount - 1} total={totalUnique} isRepeated={isRepeated} />
      )}
    </div>
  );
}