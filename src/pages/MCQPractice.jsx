import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS, DIFFICULTY_MAP, getConfusionCluster } from '@/lib/wordData';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function buildMCQ(word) {
  const correct = word.meaning;
  
  // Use curated options from the dataset if available, excluding the correct answer
  let curatedDistractors = [];
  if (word.options) {
    curatedDistractors = Object.values(word.options).filter(m => m !== correct);
  }

  const cluster = getConfusionCluster(word.word);
  
  // Combine curated distractors with cluster meanings for a rich pool
  let distractorPool = [
    ...curatedDistractors,
    ...cluster
      .filter(w => w !== word.word)
      .map(cw => ALL_WORDS.find(w => w.word === cw)?.meaning)
      .filter(m => m && m !== correct)
  ];

  // Unique distractors only
  let distractors = Array.from(new Set(distractorPool));

  const allMeanings = Array.from(new Set(ALL_WORDS.map(w => w.meaning)))
    .filter(m => m !== correct && !distractors.includes(m));

  // Fill up to 3 distractors if we don't have enough
  while (distractors.length < 3 && allMeanings.length > 0) {
    const randomIndex = Math.floor(Math.random() * allMeanings.length);
    distractors.push(allMeanings.splice(randomIndex, 1)[0]);
  }

  // We only want 3 distractors total
  const finalDistractors = distractors.slice(0, 3);

  return { 
    word: word.word, 
    options: distractorShuffle([correct, ...finalDistractors]), 
    correct, 
    explanation: word.explanation, 
    difficulty: word.difficulty, 
    index: word.index 
  };
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

  const initializedRef = useRef(false);

  const generate = useCallback((m) => {
    let pool;
    if (m === 'weak') { 
      const w = getWeakWords; 
      pool = w.map(r => ALL_WORDS[r.word_index]).filter(Boolean); 
      if (pool.length < 10) pool = [...pool, ...distractorShuffle(ALL_WORDS).slice(0, 15 - pool.length)]; 
    }
    else if (['A','B','C'].includes(m)) pool = ALL_WORDS.filter(w => w.part === m);
    else pool = ALL_WORDS;
    
    const nextQuestions = distractorShuffle(pool).slice(0, 20).map(buildMCQ);
    setQuestions(nextQuestions);
    setCur(0); 
    setSelected(null); 
    setScore(0);
    startRef.current = Date.now();
  }, [getWeakWords]);

  useEffect(() => { 
    if (!loading && !initializedRef.current) { 
      generate(mode); 
      initializedRef.current = true;
    } 
  }, [loading, generate, mode]);

  const handleSelect = async (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const q = questions[cur];
    const correct = opt === q.correct;
    if (correct) setScore(s => s + 1);
    // This will update the engine state, but initializedRef prevents re-generation
    await recordReview(q.index, correct ? 'instant' : 'forgot', Date.now() - startRef.current);
  };

  const next = () => { setSelected(null); setCur(c => c + 1); startRef.current = Date.now(); };
  
  const changeMode = (m) => { 
    setMode(m); 
    generate(m); 
  };

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
                  
                  let containerClass = "bg-secondary/20 border-border/40 text-foreground hover:border-primary/50 hover:bg-secondary/40";
                  let indicatorClass = "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary";

                  if (selected !== null) {
                    if (isCorrect) {
                      containerClass = "bg-success/10 border-success text-success-foreground shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]";
                      indicatorClass = "bg-success text-white";
                    } else if (isSelected) {
                      containerClass = "bg-destructive/10 border-destructive text-destructive-foreground shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]";
                      indicatorClass = "bg-destructive text-white";
                    } else {
                      containerClass = "opacity-40 bg-secondary/10 border-border/20 grayscale-[0.5]";
                      indicatorClass = "bg-muted/50 text-muted-foreground/50";
                    }
                  }

                  return (
                    <button key={i} onClick={() => handleSelect(opt)} disabled={selected !== null}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all duration-300 flex items-center justify-between ${containerClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${indicatorClass}`}>
                          {String.fromCharCode(65+i)}
                        </span>
                        <span className="text-sm sm:text-base">{opt}</span>
                      </div>
                      
                      {selected !== null && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -20 }} 
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                          {isCorrect ? (
                            <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-success stroke-[3]" />
                            </div>
                          ) : isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center">
                              <XCircle className="w-3.5 h-3.5 text-destructive stroke-[3]" />
                            </div>
                          ) : null}
                        </motion.div>
                      )}
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