import React from 'react';
import { WORD_COUNT } from '@/lib/wordData';

const SEGMENTS = [
  { key: 'mastered',  color: '#22c55e', label: 'Mastered'  },
  { key: 'reviewing', color: '#f59e0b', label: 'Reviewing' },
  { key: 'learning',  color: '#60a5fa', label: 'Learning'  },
  { key: 'new',       color: '#1e293b', label: 'New'        },
];

export default function MasteryRing({ masteryStats }) {
  const radius = 68, stroke = 10;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="176" height="176" viewBox="0 0 176 176">
          <circle cx="88" cy="88" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          {SEGMENTS.map(seg => {
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
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-serif font-bold text-foreground">
            {Math.round(((masteryStats.mastered + masteryStats.reviewing) / WORD_COUNT) * 100)}%
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {SEGMENTS.map(seg => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: seg.color }} />
            <span className="text-xs text-muted-foreground">{seg.label}</span>
            <span className="text-xs font-semibold text-foreground ml-auto">{masteryStats[seg.key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}