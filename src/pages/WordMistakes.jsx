import React, { useMemo } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PremiumAlertCircleIcon as AlertCircle, PremiumTrophyIcon as Trophy, PremiumChevronRightIcon as ChevronRight, PremiumMatchingIcon as Zap } from '@/components/ui/PremiumIcons';
import PageHeader from '@/components/layout/PageHeader';
import LexoraLogo from '@/components/ui/LexoraLogo';

export default function WordMistakes() {
  const navigate = useNavigate();
  const { getAllQuizWrongWords, quizAttempts, loading } = useStudyEngine();

  const stats = useMemo(() => {
    const totalWrong = getAllQuizWrongWords.reduce((sum, w) => sum + w.wrongCount, 0);
    const uniqueWrong = getAllQuizWrongWords.length;
    return { totalWrong, uniqueWrong, quizAttempts: quizAttempts.length };
  }, [getAllQuizWrongWords, quizAttempts]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="My Mistakes" subtitle="Words you missed in mastery quizzes" backTo="/" />

      {getAllQuizWrongWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-serif font-bold text-foreground">No Mistakes Yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">Keep up the great work! Your quiz answers are spot on so far.</p>
          <Link to="/levels" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Continue Studying <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Total Wrong</span>
              <span className="text-2xl font-serif font-black text-rose-500">{stats.totalWrong}</span>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Unique Words</span>
              <span className="text-2xl font-serif font-black text-foreground">{stats.uniqueWrong}</span>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Quiz Attempts</span>
              <span className="text-2xl font-serif font-black text-accent">{stats.quizAttempts}</span>
            </div>
          </motion.div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/cross-level-quiz')}
              className="flex-1 py-3 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Cross-Level Weak Word Quiz
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> All Missed Words ({getAllQuizWrongWords.length})
            </h3>
            {getAllQuizWrongWords.map((item, i) => (
              <motion.div
                key={item.index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border/40 rounded-2xl p-4 flex items-center justify-between hover:border-rose-500/30 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-xs font-bold text-rose-500 shrink-0">
                    {item.wrongCount}
                  </span>
                  <div className="min-w-0">
                    <Link to={`/word/${item.index}`} className="text-sm font-serif font-bold text-foreground uppercase tracking-wide hover:text-primary transition-colors block truncate">
                      {item.word.word}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground">{item.word.meaning}</span>
                      <span className="text-[8px] text-muted-foreground/40">|</span>
                      <span className="text-[9px] font-bold text-muted-foreground/60">Levels: {item.levels.join(', ')}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
