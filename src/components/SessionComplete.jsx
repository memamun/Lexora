import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, Brain, Zap, Keyboard, ArrowRight } from 'lucide-react';

export default function SessionComplete({ score, total, accuracy, levelParam, onRetry, onReturn, returnUrl, returnLabel, nextRoutes, children, customTitle, customMessage }) {
  const routeMeta = {
    mcq: { icon: Brain, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'MCQ Quiz', desc: 'Test vocabulary with options' },
    matching: { icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Matching Drill', desc: 'Connect definitions' },
    spelling: { icon: Keyboard, color: 'text-pink-500', bg: 'bg-pink-500/10', title: 'Spelling Master', desc: 'Type to learn' },
    quiz: { icon: Brain, color: 'text-accent', bg: 'bg-accent/10', title: 'Mastery Quiz', desc: 'Test your knowledge to unlock next level' }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-10"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-sans">{customTitle || "Session Complete!"}</h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">
              {customMessage || (
                <>
                  You scored <span className="text-foreground font-bold">{score} / {total}</span> 
                  {accuracy !== undefined && <span> with <span className="text-primary font-bold">{accuracy}% accuracy</span></span>}.
                </>
              )}
            </p>
          </div>
        </div>

        {nextRoutes && nextRoutes.length > 0 && (
          <div className="space-y-4 text-left">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 text-center">Ready for the Next Challenge?</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {nextRoutes.map((routeKey) => {
                const meta = routeMeta[routeKey];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <Link 
                    key={routeKey}
                    to={levelParam ? `/${routeKey}?level=${levelParam}` : `/${routeKey}`} 
                    className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 rounded-2xl transition-all group border border-border/5 active:scale-[0.99] text-left w-full"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${meta.bg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <div>
                        <span className="text-sm font-bold block text-foreground leading-snug">{meta.title}</span>
                        <span className="text-xs text-muted-foreground">{meta.desc}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          {onReturn ? (
            <button 
              onClick={onReturn}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] text-center"
            >
              {returnLabel || (levelParam ? `Return to Level ${levelParam}` : "Return Home")}
            </button>
          ) : (
            <Link 
              to={returnUrl || (levelParam ? `/study-level/${levelParam}` : "/")} 
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] text-center"
            >
              {returnLabel || (levelParam ? `Return to Level ${levelParam}` : "Return Home")}
            </Link>
          )}
          {onRetry && (
            <button 
              onClick={onRetry} 
              className="w-full py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 inline-block mr-1.5 -translate-y-0.5" /> Challenge Again
            </button>
          )}
          {children}
        </div>
      </motion.div>
    </div>
  );
}
