import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LevelTracker({ levelProgress }) {
  const currentLevel = levelProgress.find(l => l.is_unlocked && !l.is_completed) || levelProgress[0];
  const completedCount = levelProgress.filter(l => l.is_completed).length;
  const totalMastery = Math.round((levelProgress.reduce((acc, curr) => acc + (curr.words_studied || 0), 0) / 300) * 100);

  const levelMap = React.useMemo(() => {
    return levelProgress.reduce((acc, l) => {
      acc[l.level_number] = l;
      return acc;
    }, {});
  }, [levelProgress]);

  if (!currentLevel) return null;

  return (
    <Link to="/levels" className="block group">
      <div className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/50 transition-all hover:shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Path Mastery</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {completedCount} of 15 Levels · {totalMastery}% Total
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>

        <div className="space-y-4">
          <div className="bg-secondary/30 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center font-serif font-bold text-primary">
                {currentLevel.level_number}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Current: Level {currentLevel.level_number}</p>
                <p className="text-[10px] text-muted-foreground">{currentLevel.words_studied || 0}/20 words studied</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase">
                Active
              </span>
            </div>
          </div>

          <div className="flex gap-1 h-1.5">
            {Array.from({ length: 15 }).map((_, i) => {
              const level = levelMap[i + 1];
              const isCompleted = level?.is_completed;
              const isCurrent = level?.level_number === currentLevel.level_number;
              const isUnlocked = level?.is_unlocked;

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all ${
                    isCompleted ? 'bg-success' :
                    isCurrent ? 'bg-primary animate-pulse' :
                    isUnlocked ? 'bg-primary/20' : 'bg-muted'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}