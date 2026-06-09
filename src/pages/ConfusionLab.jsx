import React, { useState, useMemo } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS, CONFUSION_CLUSTERS, getConfusionCluster, WORDS_BY_STR } from '@/lib/wordData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Flame, Target, ChevronDown, ChevronRight,
  CheckCircle2, ArrowLeft, AlertTriangle, Sparkles, Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ChallengeMode from '@/components/confusion/ChallengeMode';

function getAccuracy(review) {
  if (!review || !review.total_reviews) return null;
  return Math.round((review.correct_count / review.total_reviews) * 100);
}

function getDangerLevel(acc) {
  if (acc === null) return 'unseen';
  if (acc < 40) return 'critical';
  if (acc < 65) return 'weak';
  return 'ok';
}

const DANGER_STYLES = {
  critical: { dot: 'bg-destructive animate-pulse', badge: 'bg-destructive/10 text-destructive border-destructive/25', bar: 'bg-destructive', border: 'border-destructive/30', label: 'Critical' },
  weak:     { dot: 'bg-primary',                   badge: 'bg-primary/10 text-primary border-primary/20',           bar: 'bg-primary',     border: 'border-primary/20',     label: 'Weak' },
  ok:       { dot: 'bg-success',                   badge: 'bg-success/10 text-success border-success/20',           bar: 'bg-success',     border: 'border-border/40',      label: 'Good' },
  unseen:   { dot: 'bg-muted-foreground',           badge: 'bg-muted/50 text-muted-foreground border-border/20',    bar: 'bg-muted',       border: 'border-border/30',      label: 'New' },
};

function ClusterCard({ cluster, reviewMap }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const words = useMemo(() => cluster.map(cw => WORDS_BY_STR[cw]).filter(Boolean), [cluster]);
  const accs = words.map(w => getAccuracy(reviewMap.get(w.index))).filter(v => v !== null);
  const meanAcc = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null;
  const danger = getDangerLevel(meanAcc);
  const styles = DANGER_STYLES[danger];
  const studied = words.filter(w => reviewMap.has(w.index)).length;

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${styles.border}`}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-card/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {cluster.map(w => (
              <span key={w} className="text-xs font-mono font-semibold text-foreground bg-muted/40 px-2 py-0.5 rounded">{w}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <div className="text-right">
            {meanAcc !== null ? (
              <>
                <span className={`text-sm font-bold ${danger === 'critical' ? 'text-destructive' : danger === 'weak' ? 'text-primary' : 'text-success'}`}>{meanAcc}%</span>
                <p className="text-[10px] text-muted-foreground">{studied}/{words.length} studied</p>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Not studied</span>
            )}
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-2.5">
                {words.map(w => {
                  const r = reviewMap.get(w.index);
                  const acc = getAccuracy(r);
                  const d = getDangerLevel(acc);
                  const s = DANGER_STYLES[d];
                  return (
                    <div key={w.word} className={`flex items-start gap-3 p-3 rounded-xl border ${s.border} bg-card/50`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-foreground">{w.word}</span>
                          {acc !== null ? (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${s.badge}`}>{acc}%</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-muted/30 text-muted-foreground border-border/20">Not studied</span>
                          )}
                        </div>
                        <p className="text-xs text-primary font-semibold mt-1">{w.options?.[w.answer] || w.answer}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{w.explanation}</p>
                      </div>
                      {r && (
                        <div className="shrink-0 text-right space-y-1.5">
                          <p className="text-[10px] text-muted-foreground">{r.total_reviews} reviews</p>
                          <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${acc}%` }} />
                          </div>
                          {r.streak > 1 && (
                            <div className="flex items-center justify-end gap-0.5 text-primary">
                              <Flame className="w-3 h-3" />
                              <span className="text-[10px] font-bold">{r.streak}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={() => navigate(`/cluster-quiz?words=${words.map(w => w.word).join(',')}&cluster=${cluster.join(' / ')}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <Target className="w-4 h-4" /> Quiz This Cluster
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ConfusionLab() {
  const { reviews, loading, recordReview } = useStudyEngine();
  const [filter, setFilter] = useState('all');
  const [challengeOpen, setChallengeOpen] = useState(false);

  const reviewMap = useMemo(() => new Map(reviews.map(r => [r.word_index, r])), [reviews]);

  const allClusters = useMemo(() => {
    const personalWeak = reviews
      .filter(r => r.total_reviews >= 2 && (r.correct_count / r.total_reviews) < 0.5)
      .map(r => ALL_WORDS[r.word_index]?.word).filter(Boolean);

    const autoGroups = new Map();
    personalWeak.forEach(word => {
      const cluster = getConfusionCluster(word);
      if (cluster.length > 1) {
        const key = cluster.sort().join('|');
        if (!autoGroups.has(key)) autoGroups.set(key, cluster);
      }
    });

    const predefinedKeys = new Set(CONFUSION_CLUSTERS.map(c => [...c].sort().join('|')));
    const extraClusters = [...autoGroups.entries()]
      .filter(([key]) => !predefinedKeys.has(key))
      .map(([, c]) => c);

    return [...CONFUSION_CLUSTERS, ...extraClusters];
  }, [reviews]);

  const scoredClusters = useMemo(() => {
    return allClusters.map(cluster => {
      const words = cluster.map(cw => WORDS_BY_STR[cw]).filter(Boolean);
      const accs = words.map(w => getAccuracy(reviewMap.get(w.index))).filter(v => v !== null);
      const meanAcc = accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : null;
      const danger = getDangerLevel(meanAcc);
      return { cluster, meanAcc, danger };
    }).sort((a, b) => {
      const order = { critical: 0, weak: 1, unseen: 2, ok: 3 };
      return order[a.danger] - order[b.danger];
    });
  }, [allClusters, reviewMap]);

  const filtered = useMemo(() => {
    if (filter === 'all') return scoredClusters;
    return scoredClusters.filter(c => c.danger === filter);
  }, [scoredClusters, filter]);

  const counts = useMemo(() => {
    const c = { critical: 0, weak: 0, unseen: 0, ok: 0 };
    scoredClusters.forEach(({ danger }) => c[danger]++);
    return c;
  }, [scoredClusters]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (challengeOpen) {
    return (
      <div className="space-y-6 pb-12">
        <ChallengeMode reviews={reviews} recordReview={recordReview} onClose={() => setChallengeOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-foreground">Confusion Lab</h1>
          <p className="text-xs text-muted-foreground">Auto-grouped from your confidence scores · Quiz each cluster</p>
        </div>
        <button onClick={() => setChallengeOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" /> Challenge
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'critical', label: 'Critical', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          { key: 'weak',     label: 'Weak',     icon: Flame,         color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
          { key: 'unseen',   label: 'Unseen',   icon: Sparkles,      color: 'text-muted-foreground', bg: 'bg-muted/20 border-border/30' },
          { key: 'ok',       label: 'Good',     icon: CheckCircle2,  color: 'text-success',     bg: 'bg-success/5 border-success/20' },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${bg} ${filter === key ? 'ring-1 ring-inset ring-current' : 'hover:opacity-80'}`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${color}`} />
            <div>
              <p className={`text-lg font-bold leading-none ${color}`}>{counts[key]}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {counts.critical > 0 && (
        <div className="flex gap-2.5 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            You have <span className="text-destructive font-semibold">{counts.critical} critical cluster{counts.critical > 1 ? 's' : ''}</span> with under 40% accuracy. These are your hardest words — quiz them now!
          </p>
        </div>
      )}

      {filter !== 'all' && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Showing: <span className="text-foreground font-medium capitalize">{filter}</span> clusters</span>
          <button onClick={() => setFilter('all')} className="text-xs text-primary hover:underline">Show all</button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(({ cluster }, i) => (
          <motion.div key={cluster.join('|')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <ClusterCard cluster={cluster} reviewMap={reviewMap} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Brain className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No clusters in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
