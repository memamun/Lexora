import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOTAL_LEVELS, TOTAL_WORDS, WORDS_PER_LEVEL } from '@/lib/constants';

export default function LevelTracker({ levelProgress }) {
  const navigate = useNavigate();
  const currentLevel = levelProgress.find(l => l.is_unlocked && !l.is_completed) || levelProgress[0];
  const completedCount = levelProgress.filter(l => l.is_completed).length;
  const totalMastery = Math.round((levelProgress.reduce((acc, curr) => acc + (curr.words_studied || 0), 0) / TOTAL_WORDS) * 100);

  if (!currentLevel) return null;

  const handleOuterClick = (e) => {
    navigate('/levels');
  };

  const handleInnerClick = (e) => {
    e.stopPropagation();
    navigate(`/study-level/${currentLevel.level_number}`);
  };

  return (
    <div onClick={handleOuterClick} className="block group cursor-pointer">
      <div className="bg-card rounded-2xl soft-shadow p-6 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-blue flex items-center justify-center text-primary">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-on-surface">Path Mastery</h3>
              <p className="text-[10px] text-outline uppercase font-bold tracking-widest">
                {completedCount} of {TOTAL_LEVELS} Levels · {totalMastery}% Total
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-outline cursor-pointer hover:text-primary transition-colors" />
        </div>

        <div className="space-y-4">
          <div 
            onClick={handleInnerClick}
            className="bg-surface-container-low hover:bg-surface-container rounded-xl p-4 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-4 border-white bg-card flex items-center justify-center text-primary font-bold soft-shadow">
                {currentLevel.level_number}
              </div>
              <div>
                <p className="text-[15px] font-bold text-on-surface">Current: Level {currentLevel.level_number}</p>
                <p className="text-[13px] text-outline opacity-70">{currentLevel.words_studied || 0}/{WORDS_PER_LEVEL} words studied</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-primary bg-primary-container/10 px-3 py-1 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-6 h-2">
            {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
              const level = levelProgress.find(l => l.level_number === i + 1);
              const isCompleted = level?.is_completed;
              const isCurrent = level?.level_number === currentLevel.level_number;
              const isUnlocked = level?.is_unlocked;

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all ${
                    isCompleted ? 'bg-secondary' :
                    isCurrent ? 'bg-primary' :
                    isUnlocked ? 'bg-primary/20' : 'bg-surface-gray'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}