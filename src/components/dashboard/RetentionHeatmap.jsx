import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export default function RetentionHeatmap({ stats }) {
  const dailyReviews = stats?.daily_reviews || {};
  const dailyCorrect = stats?.daily_correct || {};

  const data = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
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
    if (r === 0) return 'bg-muted/20';
    if (r <= 5) return 'bg-success/25';
    if (r <= 15) return 'bg-success/45';
    if (r <= 30) return 'bg-success/65';
    return 'bg-success/85';
  };

  return (
    <div className="border border-border/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Study Activity</h3>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          Less {['bg-muted/20','bg-success/25','bg-success/45','bg-success/65','bg-success/85'].map((c,i) =>
            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
          )} More
        </div>
      </div>
      <TooltipProvider>
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((wk, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {wk.map(d => (
                <Tooltip key={d.date}>
                  <TooltipTrigger asChild>
                    <div className={`w-3 h-3 rounded-sm ${intensity(d.reviews)} cursor-default`} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{d.date}</p>
                    <p>{d.reviews} reviews · {d.correct} correct</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}