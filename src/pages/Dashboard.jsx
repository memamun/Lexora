import React from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart, AlertCircle, ArrowRight } from 'lucide-react';
import StatsRow from '@/components/dashboard/StatsRow';
import MasteryRing from '@/components/dashboard/MasteryRing';
import WordQueue from '@/components/dashboard/WordQueue';
import RetentionHeatmap from '@/components/dashboard/RetentionHeatmap';
import LevelTracker from '@/components/dashboard/LevelTracker';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import { TOTAL_LEVELS, TOTAL_WORDS, WORDS_PER_LEVEL } from '@/lib/constants';

const NAV_ITEMS = [
  { to: '/levels', icon: BookOpen, label: 'Levels', primary: true },
  { to: '/analytics', icon: BarChart, label: 'Path Analytics' },
];

export default function Dashboard() {
  const { stats, levelProgress, loading, getDueWords, getWeakWords, getNearForgettingWords, getMasteryStats, getQuizWrongWordStats } = useStudyEngine();
  const { user } = useAuth();

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
        className="mb-8"
      >
        <div className="flex-1 -mb-6">
          <PageHeader 
            title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}!`}
            subtitle={
              <span className="flex items-center gap-3 mt-1">
                <span>Path to Mastery</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                <span>{TOTAL_LEVELS} Levels</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                <span>{TOTAL_WORDS} words</span>
              </span>
            }
            showHamburger={true}
          />
        </div>

        <div className="hidden sm:flex sm:flex-row gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, primary }) => (
            <Link key={to} to={to}
              className={`flex items-center justify-center sm:justify-start gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 w-full sm:w-auto ${
                primary 
                  ? 'bg-primary-container text-on-primary-container hover:scale-105 scale-95' 
                  : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <Icon className="w-4 h-4 opacity-80" />{label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Mobile-only Beautiful Grid Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-2 gap-3 mt-1 -mb-2 w-full sm:hidden"
      >
        {/* Levels Card */}
        <Link 
          to="/levels" 
          className="bg-card soft-shadow rounded-2xl p-5 relative overflow-hidden group min-h-[110px] flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 block"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between z-10 w-full">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-outline">
                Roadmap
              </span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-primary bg-primary-container/10 px-1.5 py-0.5 rounded-full">
              {TOTAL_LEVELS} Lvl
            </span>
          </div>
          
          {/* Title Row */}
          <div className="space-y-0.5 z-10 mt-3">
            <h4 className="text-[17px] font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
              Levels
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
            </h4>
            <p className="text-[10px] text-outline font-medium">Vocabulary path</p>
          </div>

          {/* Refined Background Icon (Watermark) */}
          <div className="absolute -bottom-6 -right-6 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-6 pointer-events-none">
            <BookOpen className="w-24 h-24 text-primary opacity-[0.03]" strokeWidth={1.2} />
          </div>
        </Link>

        {/* Path Analytics Card */}
        <Link 
          to="/analytics" 
          className="bg-card soft-shadow rounded-2xl p-5 relative overflow-hidden group min-h-[110px] flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 block"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between z-10 w-full">
            <div className="flex items-center gap-1.5">
              <BarChart className="w-3.5 h-3.5 text-tertiary" strokeWidth={2} />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-outline">
                Metrics
              </span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-tertiary bg-tertiary-container/10 px-1.5 py-0.5 rounded-full">
              Live
            </span>
          </div>
          
          {/* Title Row */}
          <div className="space-y-0.5 z-10 mt-3">
            <h4 className="text-[17px] font-bold text-on-surface group-hover:text-tertiary transition-colors flex items-center gap-1">
              Analytics
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-tertiary" />
            </h4>
            <p className="text-[10px] text-outline font-medium">Track progress</p>
          </div>

          {/* Refined Background Icon (Watermark) */}
          <div className="absolute -bottom-6 -right-6 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-6 pointer-events-none">
            <BarChart className="w-24 h-24 text-tertiary opacity-[0.03]" strokeWidth={1.2} />
          </div>
        </Link>
      </motion.div>

      <StatsRow stats={stats} masteryStats={getMasteryStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <LevelTracker levelProgress={levelProgress} />
          <WordQueue dueWords={getDueWords} weakWords={getWeakWords} nearForgetting={getNearForgettingWords} />
          <RetentionHeatmap stats={stats} />
        </div>
        <div className="space-y-4">
          <div className="bg-card rounded-2xl soft-shadow p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-outline mb-6 text-center">MASTERY MAP</h3>
            <MasteryRing masteryStats={getMasteryStats} />
          </div>
          <div className="bg-card rounded-2xl soft-shadow p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-outline mb-6">EXAM READINESS</h3>
            <div className="space-y-5">
{[
  { label: 'Set A — Foundation', val: Math.min(100, Math.round((getMasteryStats.mastered / (TOTAL_WORDS / 3)) * 100)) },
  { label: 'Set B — Advanced', val: Math.min(100, Math.round(((getMasteryStats.mastered + getMasteryStats.reviewing) / (TOTAL_WORDS * 2/3)) * 100)) },
  { label: 'Set C — Exam Level', val: Math.min(100, Math.round(((getMasteryStats.mastered + getMasteryStats.reviewing) / TOTAL_WORDS) * 100)) },
].map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] text-on-surface opacity-80">{item.label}</span>
                  <span className="font-bold text-on-surface">{item.val}%</span>
                </div>
                <div className="h-1.5 bg-surface-gray rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1.2, delay: 0.3 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
            </div>
          </div>
          <div className="bg-card rounded-2xl soft-shadow p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-outline mb-4">NEXT MILESTONE</h3>
            {(() => {
              const nextLevel = levelProgress.find(l => l.is_unlocked && !l.is_completed) || levelProgress[0];
              if (!nextLevel) return <p className="text-xs text-outline italic">You've reached the end!</p>;
              const progressPercent = Math.round(((nextLevel.words_studied || 0) / 20) * 100);
              return (
                <Link to={`/study-level/${nextLevel.level_number}`} className="block group">
                  <div className="mb-4">
                    <h5 className="text-[17px] font-bold text-on-surface mb-1">Level {nextLevel.level_number} Mastery</h5>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-surface-gray rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-outline">{progressPercent}%</span>
                    </div>
                  </div>
                  <p className="text-[11px] italic text-outline border-t border-outline-variant/30 pt-4">Finish studying all {WORDS_PER_LEVEL} words to unlock the quiz.</p>
                </Link>
              );
            })()}
          </div>

          {getQuizWrongWordStats.uniqueWrong > 0 && (
            <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-error/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-error">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">MISTAKES</span>
                </div>
                <Link to="/word-mistakes" className="text-[10px] font-bold text-primary hover:underline">View All →</Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface opacity-70">Total Wrong Answers</span>
                <span className="text-[17px] font-bold text-on-surface">{getQuizWrongWordStats.totalWrong}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface opacity-70">Unique Words Missed</span>
                <span className="text-[17px] font-bold text-on-surface">{getQuizWrongWordStats.uniqueWrong}</span>
              </div>
              {getQuizWrongWordStats.mostMissed.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-outline">Most Missed</span>
                  {getQuizWrongWordStats.mostMissed.slice(0, 3).map(w => (
                    <div key={w.index} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-on-surface uppercase">{w.word.word}</span>
                      <span className="text-error font-bold">{w.wrongCount}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}