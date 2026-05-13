import React, { useMemo } from 'react';
import { Flame, Brain, Target, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { WORD_COUNT } from '@/lib/wordData';

export default function StatsRow({ stats, masteryStats }) {
  const accuracy = stats?.total_reviews > 0 ? Math.round((stats.total_correct / stats.total_reviews) * 100) : 0;
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const cards = useMemo(() => [
    { label: 'Day Streak', value: stats?.current_streak_days || 0, icon: Flame, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
    { label: 'Mastered', value: `${masteryStats?.mastered || 0}/${WORD_COUNT}`, icon: Brain, color: 'text-success', bg: 'bg-success/5 border-success/10' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: Target, color: 'text-accent', bg: 'bg-accent/5 border-accent/10' },
    { label: 'Today', value: stats?.daily_reviews?.[today] || 0, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/30 border-border/50' },
  ], [stats, masteryStats, accuracy, today]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className={`${card.bg} border rounded-xl p-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <card.icon className={`w-4 h-4 ${card.color}`} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</span>
          </div>
          <p className={`text-2xl font-serif font-bold ${card.color}`}>{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}