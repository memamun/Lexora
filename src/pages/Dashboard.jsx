import React, { useMemo } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart } from 'lucide-react';
import StatsRow from '@/components/dashboard/StatsRow';
import MasteryRing from '@/components/dashboard/MasteryRing';
import WordQueue from '@/components/dashboard/WordQueue';
import RetentionHeatmap from '@/components/dashboard/RetentionHeatmap';
import LevelTracker from '@/components/dashboard/LevelTracker';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/levels', icon: BookOpen, label: 'Levels', primary: true },
  { to: '/analytics', icon: BarChart, label: 'Path Analytics' },
];

export default function Dashboard() {
  const { stats, levelProgress, loading, getDueWords, getWeakWords, getNearForgettingWords, getMasteryStats } = useStudyEngine();

  const dueWords = useMemo(() => getDueWords, [getDueWords]);
  const weakWords = useMemo(() => getWeakWords, [getWeakWords]);
  const nearForgetting = useMemo(() => getNearForgettingWords, [getNearForgettingWords]);
  const masteryStats = useMemo(() => getMasteryStats, [getMasteryStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 border-b border-border/40 pb-5"
      >
        <div>
          <h1 className="text-premium text-2xl sm:text-3xl font-bold text-foreground">Welcome back, John! 👋</h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground/80 mt-0.5 flex items-center gap-2">
            <span>Path to Mastery</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>15 Levels</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>300 words</span>
          </p>
        </div>

        <div className="hidden sm:flex gap-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label, primary }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm ${
                primary 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0' 
                  : 'bg-card border border-border/60 text-foreground hover:bg-secondary/80 hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4 opacity-80" />{label}
            </Link>
          ))}
        </div>
      </motion.div>

      <StatsRow stats={stats} masteryStats={masteryStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <LevelTracker levelProgress={levelProgress} />
          <WordQueue dueWords={dueWords} weakWords={weakWords} nearForgetting={nearForgetting} />
          <RetentionHeatmap stats={stats} />
        </div>
        <div className="space-y-4">
          <div className="border border-border/50 rounded-xl p-5">
            <h3 className="text-label mb-4 text-center">Mastery Map</h3>
            <MasteryRing masteryStats={masteryStats} />
          </div>
          <div className="border border-border/50 rounded-xl p-4 space-y-3">
            <h3 className="text-label">Exam Readiness</h3>
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
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1.2, delay: 0.3 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="border border-border/50 rounded-xl p-4 space-y-3">
            <h3 className="text-label">Next Milestone</h3>
            {(() => {
              const nextLevel = levelProgress.find(l => l.is_unlocked && !l.is_completed) || levelProgress[0];
              if (!nextLevel) return <p className="text-xs text-muted-foreground italic">You've reached the end!</p>;
              const progressPercent = Math.round(((nextLevel.words_studied || 0) / 20) * 100);
              return (
                <Link to={`/study-level/${nextLevel.level_number}`} className="block group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-premium text-sm font-bold text-foreground group-hover:text-primary transition-colors">Level {nextLevel.level_number} Mastery</span>
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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