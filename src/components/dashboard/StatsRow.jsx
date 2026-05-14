import React, { useMemo } from 'react';
import { Flame, Brain, Target, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { WORD_COUNT } from '@/lib/wordData';

export default function StatsRow({ stats, masteryStats }) {
  const accuracy = stats?.total_reviews > 0 ? Math.round((stats.total_correct / stats.total_reviews) * 100) : 0;
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const cards = useMemo(() => [
    { label: 'Day Streak', value: stats?.current_streak_days || 0, icon: Flame, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
    { label: 'Mastered', value: `${masteryStats?.mastered || 0}/${WORD_COUNT}`, icon: Brain, color: 'text-success', bg: 'bg-success/5 border-success/10', linkTo: '/words' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: Target, color: 'text-accent', bg: 'bg-accent/5 border-accent/10' },
    { label: 'Today', value: stats?.daily_reviews?.[today] || 0, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/30 border-border/50' },
  ], [stats, masteryStats, accuracy, today]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <Link 
            to={card.linkTo || '#'} 
            className={`${card.bg} border rounded-2xl p-5 relative overflow-hidden group min-h-[110px] flex flex-col justify-between block ${!card.linkTo ? 'pointer-events-none' : 'hover:scale-[1.02] active:scale-[0.98] transition-transform'}`}
          >
            {/* Content Layer */}
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-50 block mb-1">
                {card.label}
              </span>
              <p className={`text-3xl text-premium font-bold tabular-nums ${card.color} tracking-tight`}>
                {card.value}
              </p>
            </div>
            
            {/* Refined Background Icon (Watermark) */}
            <div className="absolute -bottom-6 -right-6 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-6 pointer-events-none">
              <card.icon 
                className={`w-24 h-24 ${card.color} opacity-[0.06]`} 
                strokeWidth={1.5}
              />
            </div>

            {/* Subtle Corner Glow */}
            <div 
              className="absolute -bottom-10 -right-10 w-32 h-32 blur-[40px] opacity-[0.08] rounded-full pointer-events-none"
              style={{ backgroundColor: 'currentColor' }}
            />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}