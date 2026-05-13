import React from 'react';
import { Link } from 'react-router-dom';
import { useStudyEngine } from '@/lib/useStudyEngine';
import StatsRow from '@/components/dashboard/StatsRow';
import MasteryRing from '@/components/dashboard/MasteryRing';
import WordQueue from '@/components/dashboard/WordQueue';
import RetentionHeatmap from '@/components/dashboard/RetentionHeatmap';
import LevelTracker from '@/components/dashboard/LevelTracker';
import { WORD_COUNT } from '@/lib/wordData';
import { BookOpen, Target, Brain, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { stats, levelProgress, loading, getDueWords, getWeakWords, getNearForgettingWords, getMasteryStats } = useStudyEngine();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const dueWords = getDueWords();
  const weakWords = getWeakWords();
  const nearForgetting = getNearForgettingWords();
  const masteryStats = getMasteryStats();

  return (
    <div className="space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Your Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">{WORD_COUNT} words · Bangladesh Bank Synonym Mastery</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { to: '/levels', icon: BookOpen, label: 'Levels', primary: true },
            { to: '/flashcards', icon: Brain, label: 'Smart Study' },
            { to: '/mcq', icon: Target, label: 'MCQ' },
          ].map(({ to, icon: Icon, label, primary }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                primary ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </Link>
          ))}
        </div>
      </motion.div>

      <StatsRow stats={stats} masteryStats={masteryStats} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <LevelTracker levelProgress={levelProgress} />
          <WordQueue dueWords={dueWords} weakWords={weakWords} nearForgetting={nearForgetting} />
          <RetentionHeatmap stats={stats} />
        </div>
        <div className="space-y-4">
          <div className="border border-border/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 text-center">Mastery Map</h3>
            <MasteryRing masteryStats={masteryStats} />
          </div>
          <div className="border border-border/50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exam Readiness</h3>
            {[
              { label: 'Set A — Foundation', val: Math.min(100, Math.round((masteryStats.mastered / 100) * 100)) },
              { label: 'Set B — Advanced', val: Math.min(100, Math.round(((masteryStats.mastered + masteryStats.reviewing) / 200) * 100)) },
              { label: 'Set C — Exam Level', val: Math.min(100, Math.round(((masteryStats.mastered + masteryStats.reviewing) / 300) * 100)) },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{item.val}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1.2, delay: 0.3 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="border border-border/50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Milestone</h3>
            {(() => {
              const nextLevel = levelProgress.find(l => l.is_unlocked && !l.is_completed) || levelProgress[0];
              if (!nextLevel) return <p className="text-xs text-muted-foreground italic">You've reached the end!</p>;
              
              const progressPercent = Math.round(((nextLevel.words_studied || 0) / 20) * 100);
              return (
                <Link to={`/study-level/${nextLevel.level_number}`} className="block group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Level {nextLevel.level_number} Mastery</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">Finish studying all 20 words to unlock the quiz.</p>
                </Link>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}