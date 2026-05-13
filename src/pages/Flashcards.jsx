import React, { useState, useMemo, useCallback } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS } from '@/lib/wordData';
import FlashcardView from '@/components/flashcard/FlashcardView';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(false);

  const queue = useMemo(() => {
    if (mode === 'due') return dedup(getDueWords().map(r => ALL_WORDS[r.word_index]));
    if (mode === 'weak') return dedup(getWeakWords().map(r => ALL_WORDS[r.word_index]));
    if (mode === 'forgetting') return dedup(getNearForgettingWords().map(r => ALL_WORDS[r.word_index]));
    if (mode === 'new') return getNewWords().slice(0, 20);
    const due = getDueWords().map(r => ALL_WORDS[r.word_index]);
    const weak = getWeakWords().slice(0, 5).map(r => ALL_WORDS[r.word_index]);
    const newW = getNewWords().slice(0, 8);
    return dedup([...due, ...weak, ...newW]).slice(0, 30);
  }, [mode, getDueWords, getWeakWords, getNearForgettingWords, getNewWords]);

  const handleRate = useCallback(async (confidence, responseTime) => {
    const word = queue[currentIndex];
    if (!word) return;
    await recordReview(word.index, confidence, responseTime);
    if (currentIndex < queue.length - 1) setCurrentIndex(i => i + 1);
    else setDone(true);
  }, [queue, currentIndex, recordReview]);

  const restart = () => { setCurrentIndex(0); setDone(false); };
  const changeMode = (m) => { setMode(m); setCurrentIndex(0); setDone(false); };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><ArrowLeft className="w-4 h-4 text-muted-foreground" /></Link>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground leading-tight">Flashcards</h1>
            <p className="text-[10px] text-muted-foreground tracking-wide uppercase font-medium">{queue.length} in queue</p>
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
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Session Complete!</h2>
          <p className="text-sm text-muted-foreground">You reviewed {queue.length} words.</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={restart} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Review Again</button>
            <Link to="/" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium">Dashboard</Link>
          </div>
        </motion.div>
      ) : queue.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="text-4xl">✨</div>
          <h2 className="font-serif text-xl font-bold text-foreground">Queue Empty</h2>
          <p className="text-sm text-muted-foreground">Try a different mode or come back later.</p>
        </div>
      ) : (
        <FlashcardView word={queue[currentIndex]} onRate={handleRate} index={currentIndex} total={queue.length} />
      )}
    </div>
  );
}