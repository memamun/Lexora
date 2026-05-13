import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS, DIFFICULTY_MAP } from '@/lib/wordData';
import { ArrowLeft, Swords, Timer, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function buildQ(word) {
  const correct = word.meaning;
  const others = shuffle(ALL_WORDS.filter(w => w.index !== word.index)).slice(0, 3).map(w => w.meaning);
  return { word: word.word, options: shuffle([correct, ...others]), correct, difficulty: word.difficulty, index: word.index };
}

const MODES = [
  { key: 'sprint',   label: '30-Second Sprint',    icon: Timer, desc: 'Answer as many as possible in 30 seconds', time: 30 },
  { key: 'sudden',   label: 'Sudden Death',         icon: Zap,   desc: 'One wrong answer and it\'s over', time: null },
  { key: 'marathon', label: 'Adaptive Marathon',    icon: Swords,desc: '50 adaptive questions, difficulty scales', time: null },
];

export default function BattleMode() {
  const { loading, getWeakWords, recordReview } = useStudyEngine();
  const [phase, setPhase] = useState('select'); // select | playing | result
  const [selectedMode, setSelectedMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [cur, setCur] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answered, setAnswered] = useState(0);
  const [flash, setFlash] = useState(null); // 'correct' | 'wrong'
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());

  const startGame = useCallback((mode) => {
    const pool = mode.key === 'marathon'
      ? shuffle([...ALL_WORDS]).slice(0, 50)
      : shuffle([...ALL_WORDS]).slice(0, 60);
    setQuestions(pool.map(buildQ));
    setCur(0); setScore(0); setStreak(0); setBestStreak(0); setAnswered(0);
    setTimeLeft(mode.time || 30);
    setPhase('playing');
    setSelectedMode(mode);
    startRef.current = Date.now();

    if (mode.key === 'sprint') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setPhase('result'); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleAnswer = useCallback(async (opt) => {
    if (flash) return;
    const q = questions[cur];
    const isCorrect = opt === q.correct;
    setFlash(isCorrect ? 'correct' : 'wrong');
    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);
    if (isCorrect) setScore(s => s + (1 + Math.floor(newStreak / 5)));
    setAnswered(a => a + 1);
    await recordReview(q.index, isCorrect ? 'instant' : 'forgot', Date.now() - startRef.current);
    startRef.current = Date.now();

    setTimeout(() => {
      setFlash(null);
      if (selectedMode?.key === 'sudden' && !isCorrect) { setPhase('result'); return; }
      if (cur + 1 >= questions.length) { setPhase('result'); clearInterval(timerRef.current); return; }
      setCur(c => c + 1);
    }, isCorrect ? 400 : 700);
  }, [flash, questions, cur, streak, bestStreak, recordReview, selectedMode]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const q = questions[cur];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors"><ArrowLeft className="w-4 h-4 text-muted-foreground" /></Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Battle Mode</h1>
          <p className="text-xs text-muted-foreground">Gamified speed training</p>
        </div>
      </div>

      {phase === 'select' && (
        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {MODES.map(m => (
            <motion.button key={m.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => startGame(m)}
              className="border border-border/50 rounded-xl p-5 text-left hover:border-primary/30 hover:bg-card/80 transition-all group space-y-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <m.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{m.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {phase === 'playing' && q && (
        <div className="max-w-md mx-auto space-y-5">
          {/* HUD */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-serif font-bold text-primary">{score}</span>
              <span className="text-xs text-muted-foreground">pts</span>
              {streak >= 3 && <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">🔥 {streak}x streak</span>}
            </div>
            {selectedMode?.key === 'sprint' && (
              <div className={`text-xl font-mono font-bold ${timeLeft <= 10 ? 'text-destructive' : 'text-foreground'}`}>
                {timeLeft}s
              </div>
            )}
            {selectedMode?.key !== 'sprint' && (
              <span className="text-xs text-muted-foreground font-mono">{cur + 1}/{questions.length}</span>
            )}
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div key={cur} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`border rounded-2xl p-6 text-center space-y-4 transition-all duration-200 ${
                flash === 'correct' ? 'border-success/50 bg-success/5' :
                flash === 'wrong' ? 'border-destructive/50 bg-destructive/5' :
                'border-border/50 bg-card/30'
              }`}
            >
              <span className={`text-[10px] uppercase tracking-wider ${DIFFICULTY_MAP[q.difficulty].color}`}>
                {DIFFICULTY_MAP[q.difficulty].label}
              </span>
              <h2 className="font-serif text-4xl font-bold text-foreground">{q.word}</h2>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(opt)}
                    className="px-3 py-3 rounded-xl border border-border/50 bg-background/50 text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {phase === 'result' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4 max-w-sm mx-auto">
          <div className="text-5xl">{score >= 50 ? '🏆' : score >= 20 ? '⭐' : '💪'}</div>
          <h2 className="font-serif text-3xl font-bold text-foreground">{score}</h2>
          <p className="text-sm text-muted-foreground">points · Best streak: {bestStreak}x · {answered} answered</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => { setPhase('select'); }} className="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium">Change Mode</button>
            <button onClick={() => startGame(selectedMode)} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Play Again</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}