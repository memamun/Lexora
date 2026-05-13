import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Clock, Brain } from 'lucide-react';
import { ALL_WORDS, DIFFICULTY_MAP } from '@/lib/wordData';

// eslint-disable-next-line no-unused-vars
function QueueSection({ title, icon: SectionIcon, words, color, linkTo, emptyText }) {
  const Icon = SectionIcon;
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/30">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">({words.length})</span>
        </div>
        {words.length > 0 && (
          <Link to={linkTo} className={`text-xs ${color} flex items-center gap-1 hover:underline`}>
            Study <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="p-3 min-h-[56px]">
        {words.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">{emptyText}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {words.slice(0, 18).map((w, i) => {
              const wd = typeof w.word_index === 'number' ? ALL_WORDS[w.word_index] : w;
              const diff = DIFFICULTY_MAP[wd?.difficulty || 'foundation'];
              return (
                <span key={i} className={`px-2 py-0.5 rounded text-[11px] font-mono ${diff.bg} ${diff.color} border ${diff.border}`}>
                  {wd?.word || w.word}
                </span>
              );
            })}
            {words.length > 18 && <span className="px-2 py-0.5 rounded text-[11px] text-muted-foreground bg-muted/50">+{words.length - 18}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WordQueue({ dueWords, weakWords, nearForgetting }) {
  return (
    <div className="space-y-3">
      <QueueSection title="Due for Review" icon={Clock} words={dueWords} color="text-primary" linkTo="/flashcards?mode=due" emptyText="All caught up! No words due." />
      <QueueSection title="Weak Words" icon={AlertTriangle} words={weakWords} color="text-destructive" linkTo="/flashcards?mode=weak" emptyText="No weak words detected." />
      <QueueSection title="Near Forgetting" icon={Brain} words={nearForgetting} color="text-accent" linkTo="/flashcards?mode=forgetting" emptyText="Memory strong — nothing fading soon." />
    </div>
  );
}