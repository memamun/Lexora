import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export default function RetentionHeatmap({ stats }) {
  const dailyReviews = stats?.daily_reviews || {};
  const dailyCorrect = stats?.daily_correct || {};

  const data = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 181; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: key, reviews: dailyReviews[key] || 0, correct: dailyCorrect[key] || 0, dow: d.getDay() });
    }
    return days;
  }, [dailyReviews, dailyCorrect]);

  const weeks = useMemo(() => {
    const weeksArr = [];
    let week = [];
    data.forEach(d => {
      week.push(d);
      if (d.dow === 6) { weeksArr.push(week); week = []; }
    });
    if (week.length) weeksArr.push(week);
    return weeksArr;
  }, [data]);

  const intensity = (r) => {
    if (r === 0) return 'bg-surface-gray';
    if (r <= 5) return 'bg-secondary-container/30';
    if (r <= 15) return 'bg-secondary-container/60';
    if (r <= 30) return 'bg-secondary';
    return 'bg-secondary';
  };

  return (
    <div className="bg-card rounded-2xl soft-shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-outline">STUDY ACTIVITY</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-outline font-bold">
          <span className="opacity-70">Less</span> 
          <div className="flex gap-1">
            {['bg-surface-gray','bg-secondary-container/30','bg-secondary-container/60','bg-secondary','bg-secondary'].map((c,i) =>
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            )}
          </div>
          <span className="opacity-70">More</span>
        </div>
      </div>
      <TooltipProvider>
        <div className="overflow-x-auto pb-1.5 scrollbar-hide -mx-1 px-1">
          <div className="flex justify-between gap-1 w-full min-w-max">
            {weeks.map((wk, wi) => (
              <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
                {wk.map(d => (
                <Tooltip key={d.date}>
                  <TooltipTrigger asChild>
                    <div className={`w-3 h-3 rounded-[2px] ${intensity(d.reviews)} cursor-default transition-colors hover:ring-1 hover:ring-success/50`} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold text-premium">{new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="opacity-80 font-medium">{d.reviews} reviews · {d.correct} correct</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
      </TooltipProvider>
    </div>
  );
}