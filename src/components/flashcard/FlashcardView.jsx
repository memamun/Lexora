import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { DIFFICULTY_MAP } from '@/lib/wordData';
import { Zap, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FlashcardView({ word, onRate, index, total, isRepeated }) {
  const [flipped, setFlipped] = useState(false);
  const [startTime] = useState(Date.now());
  const x = useMotionValue(0);
  
  // Tinder-like transforms
  const rotate = useTransform(x, [-100, 0, 100], [-10, 0, 10]);
  const opacity = useTransform(x, [-150, -50, 0, 50, 150], [0.5, 1, 1, 1, 0.5]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);

  useEffect(() => { 
    setFlipped(false); 
    x.set(0);
  }, [word?.index]);

  const handleRate = useCallback((confidence) => {
    onRate(confidence, Date.now() - startTime);
  }, [onRate, startTime]);

  const triggerRate = async (direction, confidence) => {
    await animate(x, direction === 'right' ? 600 : -600, { duration: 0.3, ease: 'easeOut' });
    handleRate(confidence);
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      triggerRate('right', 'instant');
    } else if (info.offset.x < -100) {
      triggerRate('left', 'forgot');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 });
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); setFlipped(f => !f); }
      if (flipped) {
        if (e.key === '1') handleRate('instant');
        if (e.key === '2') handleRate('forgot');
        if (e.key === 'ArrowRight') handleRate('instant');
        if (e.key === 'ArrowLeft') handleRate('forgot');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, handleRate]);

  if (!word) return null;
  const diff = DIFFICULTY_MAP[word.difficulty];

  const CardContent = ({ type }) => (
    <>
      {/* Tinder Stamps */}
      <motion.div style={{ opacity: likeOpacity, scale: useTransform(x, [50, 150], [0.8, 1.2]) }} className="absolute top-16 left-12 z-20 border-8 border-success/80 text-success/80 font-black text-6xl px-6 py-2 rounded-2xl rotate-[-25deg] pointer-events-none uppercase shadow-lg">
        Known
      </motion.div>
      <motion.div style={{ opacity: nopeOpacity, scale: useTransform(x, [-150, -50], [1.2, 0.8]) }} className="absolute top-16 right-12 z-20 border-8 border-destructive/80 text-destructive/80 font-black text-6xl px-6 py-2 rounded-2xl rotate-[25deg] pointer-events-none uppercase shadow-lg">
        Unknown
      </motion.div>

      {type === 'front' ? (
        <>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute top-6 inset-x-0 flex flex-col items-center gap-1.5 justify-center">
            {isRepeated && (
              <span className="px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                Reviewing
              </span>
            )}
            <span className={`px-3 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${diff.bg} ${diff.color} border ${diff.border}`}>
              {diff.label} · Set {word.part}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center w-full min-w-0 px-4 overflow-hidden">
            <h2 
              className={`font-serif font-bold text-foreground tracking-tight leading-tight whitespace-nowrap
                ${word.word.length > 12 ? 'text-2xl sm:text-4xl' : 
                  word.word.length > 8 ? 'text-3xl sm:text-5xl' : 
                  'text-4xl sm:text-7xl'}`}
            >
              {word.word}
            </h2>
          </div>
          <div className="absolute bottom-8 inset-x-0 space-y-2 opacity-40">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Tap to reveal</p>
            <div className="flex justify-center gap-1">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <div className="w-1 h-1 rounded-full bg-primary" />
              <div className="w-1 h-1 rounded-full bg-primary" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success/30 to-transparent" />
          <div className="absolute top-6 inset-x-0 flex flex-col items-center gap-1.5 justify-center">
            {isRepeated && (
              <span className="px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                Reviewing
              </span>
            )}
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold opacity-50">Synonym</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center w-full space-y-4 overflow-hidden">
            <h2 
              className={`font-bengali font-bold text-primary whitespace-nowrap leading-tight px-4
                ${word.bengali.length > 12 ? 'text-3xl sm:text-4xl' : 
                  word.bengali.length > 8 ? 'text-4xl sm:text-5xl' : 
                  'text-5xl sm:text-7xl'}`}
            >
              {word.bengali}
            </h2>
            <div className="h-px w-12 bg-border mx-auto opacity-30" />
            <p className="text-sm sm:text-lg text-muted-foreground max-w-[320px] leading-relaxed px-4 italic">{word.explanation}</p>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="flex flex-col items-center gap-6 w-full px-4 relative">
      <div className="w-full max-w-lg flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono">{index + 1}/{total}</span>
        <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="w-full flex items-center justify-center gap-4 sm:gap-8">
        {/* Desktop Left Chevron */}
        <button onClick={() => triggerRate('left', 'forgot')} className="hidden sm:flex items-center justify-center w-14 h-14 rounded-full bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:scale-110 transition-all shadow-xl shrink-0 group">
          <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="w-full max-w-lg cursor-pointer select-none touch-none" onClick={() => setFlipped(!flipped)}>
          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div key="front" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                style={{ x, rotate, opacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                className="bg-card border border-border rounded-3xl p-6 sm:p-14 text-center min-h-[340px] max-h-[60vh] sm:min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl z-10"
              >
                <CardContent type="front" />
              </motion.div>
            ) : (
              <motion.div key="back" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                style={{ x, rotate, opacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                className="bg-card border border-border rounded-3xl p-6 sm:p-14 text-center min-h-[340px] max-h-[60vh] sm:min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl z-10"
              >
                <CardContent type="back" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Right Chevron */}
        <button onClick={() => triggerRate('right', 'instant')} className="hidden sm:flex items-center justify-center w-14 h-14 rounded-full bg-card border border-border text-muted-foreground hover:text-success hover:border-success/30 hover:scale-110 transition-all shadow-xl shrink-0 group">
          <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2 w-full max-w-lg px-1">
            {[
              { key: 'instant',   label: 'Known',   icon: Zap,        cls: 'text-success border-success/20 bg-success/5 hover:bg-success/15' },
              { key: 'forgot',    label: 'Unknown', icon: XCircle,    cls: 'text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/15' },
            ].map(({ key, label, icon: Icon, cls }, i) => (
              <button key={key} onClick={() => handleRate(key)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 py-3 border rounded-2xl text-[9px] sm:text-sm font-bold transition-all shadow-sm min-w-0 ${cls}`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="leading-none truncate w-full">{label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}