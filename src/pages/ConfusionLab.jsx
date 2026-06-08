import React, { useState, useMemo } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS, CONFUSION_CLUSTERS } from '@/lib/wordData';
import { Brain, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import LexoraLogo from '@/components/ui/LexoraLogo';

function ClusterCard({ cluster, reviewMap, wordByName }) {
  const [expanded, setExpanded] = useState(false);
  const words = cluster.map(cw => wordByName.get(cw)).filter(Boolean);
  const avgAcc = useMemo(() => {
    const accs = words.map(w => {
      const r = reviewMap.get(w.index);
      return r ? Math.round((r.correct_count / Math.max(1, r.total_reviews)) * 100) : null;
    }).filter(v => v !== null);
    const mean = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null;
    return { mean, danger: mean !== null && mean < 60 };
  }, [words, reviewMap]);

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${avgAcc.danger ? 'border-destructive/30' : 'border-border/50'}`}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-card/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {avgAcc.danger && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
          <div className="flex flex-wrap gap-1.5">
            {cluster.map(w => (
              <span key={w} className="text-xs font-mono font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded">{w}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {avgAcc.mean !== null && (
            <span className={`text-xs font-medium ${avgAcc.danger ? 'text-destructive' : 'text-success'}`}>{avgAcc.mean}%</span>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="p-4 space-y-3">
              {words.map(w => {
                const r = reviewMap.get(w.index);
                const acc = r ? Math.round((r.correct_count / Math.max(1, r.total_reviews)) * 100) : null;
                return (
                  <div key={w.word} className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">{w.word}</span>
                        {acc !== null && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${acc < 60 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                            {acc}%
                          </span>
                        )}
                        {!r && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">Not studied</span>}
                      </div>
                      <p className="text-xs text-primary font-medium mt-0.5">{w.meaning}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{w.explanation}</p>
                    </div>
                    {r && (
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{r.total_reviews} reviews</p>
                        <div className="w-12 h-1 bg-muted rounded-full mt-1">
                          <div className={`h-full rounded-full ${acc < 60 ? 'bg-destructive' : 'bg-success'}`} style={{ width: `${acc}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <Link to="/flashcards?mode=weak"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
              >
                <Brain className="w-3 h-3" /> Practice these words
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ConfusionLab() {
  const { reviews, loading } = useStudyEngine();

  const reviewMap = useMemo(() => new Map((reviews || []).map(r => [r.word_index, r])), [reviews]);

  const wordByName = useMemo(() => new Map(ALL_WORDS.map(w => [w.word, w])), []);

  const sortedClusters = useMemo(() => {
    return [...CONFUSION_CLUSTERS].sort((a, b) => {
      const avgA = a.reduce((s, cw) => { const w = wordByName.get(cw); const r = w ? reviewMap.get(w.index) : null; return s + (r ? r.correct_count / Math.max(1, r.total_reviews) : 1); }, 0) / a.length;
      const avgB = b.reduce((s, cw) => { const w = wordByName.get(cw); const r = w ? reviewMap.get(w.index) : null; return s + (r ? r.correct_count / Math.max(1, r.total_reviews) : 1); }, 0) / b.length;
      return avgA - avgB;
    });
  }, [reviewMap, wordByName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      </div>
    );
  }


  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Confusion Lab"
        subtitle="Words you frequently mix up, organized by semantic cluster"
        backTo="/"
      />

      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
        <div className="flex gap-2">
          <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            These clusters group semantically similar words that examinees often confuse. Red dots indicate clusters where your accuracy is below 60%.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {sortedClusters.map((cluster, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <ClusterCard cluster={cluster} reviewMap={reviewMap} wordByName={wordByName} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}