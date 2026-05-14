import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Clock, Brain, Check } from 'lucide-react';
import { ALL_WORDS, DIFFICULTY_MAP } from '@/lib/wordData';

const QueueSection = React.memo(({ title, icon: SectionIcon, words: rawWords, color, linkTo, emptyText }) => {
  const Icon = SectionIcon;
  // Filter unique words by their identifier
  const words = useMemo(() => {
    const unique = [];
    const seen = new Set();
    rawWords.forEach(w => {
      const id = typeof w.word_index === 'number' ? w.word_index : w.id || w.word;
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(w);
      }
    });
    return unique;
  }, [rawWords]);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/20 group">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/40">
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${color} opacity-90 transition-transform duration-500 group-hover:scale-110`} />
          <h3 className="text-label text-foreground/90">{title}</h3>
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded-full">{words.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/words" className="text-[10px] font-bold text-muted-foreground/50 hover:text-foreground transition-colors tracking-widest uppercase">
            VIEW ALL
          </Link>
          {words.length > 0 && (
            <Link to={linkTo} className={`group/btn flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${color} transition-all hover:opacity-80`}>
              STUDY <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
      <div className="p-3 min-h-[64px] flex items-center justify-center">
        {words.length === 0 ? (
          <div className="w-full relative overflow-hidden py-4 px-5 rounded-xl bg-card/20 border border-border/30 shadow-inner">
            {/* Architectural Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
              style={{ backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`, backgroundSize: '16px 16px' }} 
            />
            
            {/* Thematic Radial Glow */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 blur-[40px] opacity-[0.08] rounded-full pointer-events-none ${color.replace('text-', 'bg-')}`} />

            <div className="relative z-10 flex items-center gap-4">
              <div className={`flex-shrink-0 w-9 h-9 rounded-full ${color.replace('text-', 'bg-')}/10 flex items-center justify-center border border-current/5`}>
                <Check className={`w-4 h-4 ${color} opacity-80`} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground/90 tracking-wide uppercase">{emptyText.split('!')[0]}!</p>
                <p className="text-[10px] text-muted-foreground/60 font-medium">Your learning momentum is perfectly on track.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 w-full">
            {words.slice(0, 18).map((w, i) => {
              const wd = typeof w.word_index === 'number' ? ALL_WORDS[w.word_index] : w;
              const diff = DIFFICULTY_MAP[wd?.difficulty || 'foundation'];
              return (
                <Link 
                  key={i} 
                  to={`/word/${wd?.index || i}`}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 ${diff.color} bg-white/5 border border-white/5`}
                >
                  {wd?.word || w.word}
                </Link>
              );
            })}
            {words.length > 18 && <span className="px-2 py-0.5 rounded text-[11px] text-muted-foreground bg-muted/50">+{words.length - 18}</span>}
          </div>
        )}
      </div>
    </div>
  );
});

export default function WordQueue({ dueWords, weakWords, nearForgetting }) {
  return (
    <div className="space-y-3">
      <QueueSection title="Due for Review" icon={Clock} words={dueWords} color="text-primary" linkTo="/flashcards?mode=due" emptyText="All caught up! No words due." />
      <QueueSection title="Weak Words" icon={AlertTriangle} words={weakWords} color="text-destructive" linkTo="/flashcards?mode=weak" emptyText="No weak words detected." />
      <QueueSection title="Near Forgetting" icon={Brain} words={nearForgetting} color="text-accent" linkTo="/flashcards?mode=forgetting" emptyText="Memory strong — nothing fading." />
    </div>
  );
}