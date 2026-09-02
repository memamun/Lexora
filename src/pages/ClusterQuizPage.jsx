import React, { useState, useMemo, useRef } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS } from '@/lib/wordData';
import { shuffle, buildMCQ } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import LexoraLogo from '@/components/ui/LexoraLogo';

export default function ClusterQuizPage() {
  const [searchParams] = useSearchParams();
  const wordsParam = searchParams.get('words') || '';
  const clusterName = searchParams.get('cluster') || 'Cluster';
  const { recordReview, loading } = useStudyEngine();

  const words = useMemo(() => {
    const names = wordsParam.split(',').filter(Boolean);
    return names.map(name => ALL_WORDS.find(w => w.word === name)).filter(Boolean);
  }, [wordsParam]);

  const questions = useMemo(() => shuffle(words).map(buildMCQ), [words]);
  const [cur, setCur] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());

  const q = questions[cur];

  const handleSelect = (opt) => {
    if (selected !== null) return;
    const isCorrect = opt === q.correct;
    setSelected(opt);
    if (isCorrect) setScore(s => s + 1);
    setTimeout(() => {
      recordReview(q.index, isCorrect ? 'instant' : 'forgot', Date.now() - startRef.current);
    }, 150);
  };

  const handleNext = () => {
    if (cur + 1 >= questions.length) { setDone(true); return; }
    setCur(c => c + 1);
    setSelected(null);
    startRef.current = Date.now();
  };

  const handleRetry = () => {
    setCur(0); setSelected(null); setScore(0); setDone(false);
    startRef.current = Date.now();
  };

  const pct = Math.round((score / questions.length) * 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-4">
        <p className="text-muted-foreground">No words found for this cluster.</p>
        <Link to="/confusion" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Confusing Words
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/confusion" className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">Cluster Quiz</h1>
            <p className="text-[10px] text-muted-foreground tracking-wide uppercase font-medium">{clusterName}</p>
          </div>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {done ? `${score}/${questions.length}` : `${cur + 1}/${questions.length}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary rounded-full"
          animate={{ width: `${(cur / questions.length) * 100}%` }}
        />
      </div>

      {done ? (
        /* Results */
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
          <div className="text-6xl">{pct >= 80 ? '\u{1F3AF}' : pct >= 50 ? '\u{1F4AA}' : '\u{1F4D6}'}</div>
          <div>
            <p className="font-serif text-3xl font-bold text-foreground">{score}/{questions.length}</p>
            <p className="text-sm text-muted-foreground mt-1">{pct}% accuracy on this cluster</p>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${pct >= 70 ? 'bg-success' : 'bg-primary'}`}
            />
          </div>
          <div className="flex gap-3 justify-center pt-4">
            <button onClick={handleRetry}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
            <Link to="/confusion"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/70 transition-colors"
            >
              Done
            </Link>
          </div>
        </motion.div>
      ) : q ? (
        /* Quiz */
        <div className="space-y-5">
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Synonym for</p>
            <h2 className="font-serif text-4xl font-bold text-foreground">{q.word}</h2>
          </div>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const isCorrect = opt === q.correct;
              const isSelected = selected === opt;
              let cls = 'border-border/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer';
              if (selected !== null) {
                if (isCorrect) cls = 'border-success/50 bg-success/8 cursor-default';
                else if (isSelected) cls = 'border-destructive/50 bg-destructive/8 cursor-default';
                else cls = 'border-border/20 opacity-30 cursor-default';
              }
              return (
                <button key={i} onClick={() => handleSelect(opt)} disabled={selected !== null}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${cls}`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0
                    ${selected !== null && isCorrect ? 'bg-success/20 text-success' :
                      selected !== null && isSelected ? 'bg-destructive/20 text-destructive' :
                      'bg-muted/60 text-muted-foreground'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className={selected !== null && isCorrect ? 'text-success font-semibold' : selected !== null && isSelected ? 'text-destructive' : 'text-foreground'}>
                    {opt}
                  </span>
                  <span className="ml-auto">
                    {selected !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-success" />}
                    {selected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive" />}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="bg-muted/30 border border-border/40 rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                </div>
                <button onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  {cur + 1 >= questions.length ? 'See Results' : 'Next'} <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
