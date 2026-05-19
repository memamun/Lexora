import React from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { LEVELS, DIFFICULTY_MAP } from '@/lib/wordData';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CheckCircle2, Play, Trophy, Brain } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

export default function Levels() {
  const { levelProgress, isLevelUnlocked, loading } = useStudyEngine();
  const navigate = useNavigate();

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Learning Path"
        subtitle="Master 300 words across 15 levels"
        backTo="/"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(level.number);
          const progress = levelProgress.find(p => p.level_number === level.number) || {};
          const isCompleted = progress.is_completed;
          const diff = DIFFICULTY_MAP[level.difficulty];

          return (
            <motion.div
              key={level.number}
              whileHover={unlocked ? { y: -4 } : {}}
              className={`relative overflow-hidden border rounded-2xl p-5 transition-all ${
                unlocked
                  ? 'bg-card border-border/50 shadow-sm hover:shadow-md cursor-pointer'
                  : 'bg-muted/30 border-dashed border-border/50 cursor-not-allowed grayscale'
              }`}
              onClick={() => unlocked && navigate(`/study-level/${level.number}`)}
            >
              <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${diff.bg} ${diff.color}`}>
                {diff.label}
              </div>

              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-serif font-bold text-foreground">#{level.number}</span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-success" />}
                  </div>
                  <h3 className="font-medium text-foreground">{level.title}</h3>
                </div>
                {!unlocked && <Lock className="w-5 h-5 text-muted-foreground/50" />}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-[10px] uppercase tracking-tighter text-muted-foreground font-semibold">
                  <span>Words Mastered</span>
                  <span>{progress.words_studied || 0} / 20</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((progress.words_studied || 0) / 20) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                {unlocked ? (
                  <>
                    <button className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      <Play className="w-3 h-3" /> Practice
                    </button>
                    <Link to={`/study-level/${level.number}`} className="flex-1 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      <Brain className="w-3 h-3" /> Quiz
                    </Link>
                  </>
                ) : (
                  <div className="w-full py-2 bg-muted text-muted-foreground text-xs font-medium rounded-lg text-center">
                    Locked
                  </div>
                )}
              </div>

              {progress.quiz_score > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-accent" />
                    <span className="text-[10px] text-muted-foreground">High Score</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{progress.quiz_score}%</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}