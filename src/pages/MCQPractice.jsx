import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS, DIFFICULTY_MAP, getConfusionCluster } from '@/lib/wordData';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function buildMCQ(word) {
  const correct = word.meaning;
  const cluster = getConfusionCluster(word.word);
  let distractors = cluster.filter(w => w !== word.word)
    .map(cw => ALL_WORDS.find(w => w.word === cw)?.meaning).filter(Boolean);
  const allMeanings = ALL_WORDS.map(w => w.meaning).filter(m => m !== correct);
  while (distractors.length < 3) {
    const r = allMeanings[Math.floor(Math.random() * allMeanings.length)];
    if (!distractors.includes(r)) distractors.push(r);
  }
  return { word: word.word, options: distractorShuffle([correct, ...distractors.slice(0, 3)]), correct, explanation: word.explanation, difficulty: word.difficulty, index: word.index };
}

function distractorShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const MODES = [
  { key: 'mixed', label: 'Mixed' },
  { key: 'weak',  label: 'Weak Words' },
  { key: 'A',     label: 'Set A' },
  { key: 'B',     label: 'Set B' },
  { key: 'C',     label: 'Set C' },
];

export default function MCQPractice() {
  const { loading, getWeakWords, recordReview } = useStudyEngine();
  const [mode, setMode] = useState('mixed');
  const [questions, setQuestions] = useState([]);
  const [cur, setCur] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const startRef = useRef(Date.now());

  const generate = useCallback((m) => {
    let pool;
    if (m === 'weak') { const w = getWeakWords(); pool = w.map(r => ALL_WORDS[r.word_index]).filter(Boolean); if (pool.length < 10) pool = [...pool, ...distractorShuffle(ALL_WORDS).slice(0, 15 - pool.length)]; }
    else if (['A','B','C'].includes(m)) pool = ALL_WORDS.filter(w => w.part === m);
    else pool = ALL_WORDS;
    setQuestions(distractorShuffle(pool).slice(0, 20).map(buildMCQ));
    setCur(0); setSelected(null); setScore(0);
    startRef.current = Date.now();
  }, [getWeakWords]);

  useEffect(() => { if (!loading) generate(mode); }, [loading]);

  const handleSelect = async (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const q = questions[cur];
    const correct = opt === q.correct;
    if (correct) setScore(s => s + 1);
    await recordReview(q.index, correct ? 'instant' : 'forgot', Date.now() - startRef.current);
  };

  const next = () => { setSelected(null); setCur(c => c + 1); startRef.current = Date.now(); };
  const changeMode = (m) => { setMode(m); generate(m); };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const q = questions[cur];
  const finished = cur >= questions.length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors"><ArrowLeft className="w-4 h-4 text-muted-foreground" /></Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">MCQ Practice</h1>
          <p className="text-xs text-muted-foreground">Intelligent synonym questions with confusion-aware distractors</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {MODES.map(m => (
          <button key={m.key} onClick={() => changeMode(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              mode === m.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground bg-secondary/50 hover:text-foreground'
            }`}
          >{m.label}</button>
        ))}
      </div>

      {finished ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-3">
          <div className="text-5xl">{score >= 16 ? '🏆' : score >= 10 ? '👍' : '💪'}</div>
          <h2 className="font-serif text-2xl font-bold text-foreground">{score}/{questions.length}</h2>
          <p className="text-sm text-muted-foreground">{Math.round((score / questions.length) * 100)}% accuracy</p>
          <button onClick={() => generate(mode)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium mt-4">New Session</button>
        </motion.div>
      ) : q ? (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">{cur + 1}/{questions.length}</span>
            <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((cur + 1) / questions.length) * 100}%` }} />
            </div>
            <span className="text-xs font-mono text-success">{score} ✓</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={cur} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="text-center space-y-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${DIFFICULTY_MAP[q.difficulty].bg} ${DIFFICULTY_MAP[q.difficulty].color} border ${DIFFICULTY_MAP[q.difficulty].border}`}>
                  {DIFFICULTY_MAP[q.difficulty].label}
                </span>
                <h2 className="font-serif text-4xl font-bold text-foreground">{q.word}</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Choose the synonym</p>
              </div>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isCorrect = opt === q.correct;
                  const isSelected = selected === opt;
                  let cls = 'border-border/50 hover:border-primary/30 hover:bg-secondary/30 cursor-pointer';
                  if (selected !== null) {
                    if (isCorrect) cls = 'border-success/40 bg-success/5 text-success cursor-default';
                    else if (isSelected) cls = 'border-destructive/40 bg-destructive/5 text-destructive cursor-default';
                    else cls = 'border-border/20 opacity-40 cursor-default';
                  }
                  return (
                    <button key={i} onClick={() => handleSelect(opt)} disabled={selected !== null}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${cls}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0">{String.fromCharCode(65+i)}</span>
                        {opt}
                      </div>
                      {selected !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                      {selected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                  <button onClick={next} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium shrink-0">
                    Next <ArrowRight className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}