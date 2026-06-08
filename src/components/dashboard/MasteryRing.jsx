import React, { useMemo } from 'react';
import { WORD_COUNT } from '@/lib/wordData';

const SEGMENTS = [
  { key: 'mastered',  color: 'var(--mastered-color, hsl(var(--success)))', label: 'Mastered'  },
  { key: 'reviewing', color: 'var(--reviewing-color, hsl(var(--warning)))', label: 'Reviewing' },
  { key: 'learning',  color: 'var(--learning-color, hsl(var(--info)))',    label: 'Learning'  },
  { key: 'new',       color: 'var(--new-color, hsl(var(--border)))',  label: 'New'        },
];

export default function MasteryRing({ masteryStats }) {
  const radius = 68, stroke = 10;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    let offset = 0;
    return SEGMENTS.map(seg => {
      const pct = (masteryStats[seg.key] || 0) / WORD_COUNT;
      const dashLen = pct * circumference;
      const cur = offset;
      offset += dashLen;
      if (dashLen < 1) return null;
      return (
        <circle key={seg.key} cx="88" cy="88" r={radius} fill="none"
          stroke={seg.color} strokeWidth={stroke}
          strokeDasharray={`${dashLen} ${circumference - dashLen}`}
          strokeDashoffset={-cur}
          strokeLinecap="butt"
          transform="rotate(-90 88 88)"
        />
      );
    }).filter(Boolean);
  }, [masteryStats, circumference]);

  return (
    <div className="flex flex-col items-center gap-4 mastery-ring-wrapper">
      <div className="relative mastery-ring-svg-container">
        <svg width="176" height="176" viewBox="0 0 176 176" className="mastery-ring-svg">
          <circle cx="88" cy="88" r={radius} fill="none" stroke="hsl(var(--mastery-track))" strokeWidth={stroke} className="mastery-ring-track" />
          {segments}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center mastery-ring-center-content">
          <span className="text-[32px] font-black text-foreground tracking-tighter leading-none mb-0.5 mastery-ring-value">
            {Math.round((((masteryStats?.mastered || 0) + (masteryStats?.reviewing || 0)) / WORD_COUNT) * 100)}%
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-outline mastery-ring-label">Progress</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-left px-4 mt-2 mastery-ring-legend-grid">
        {SEGMENTS.map(seg => (
          <div key={seg.key} className="flex items-center gap-2 mastery-ring-legend-item">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 mastery-ring-dot" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider mastery-ring-legend-label">
              {seg.label} <b className="text-foreground font-extrabold ml-1.5 text-xs mastery-ring-legend-count">{masteryStats[seg.key] || 0}</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}