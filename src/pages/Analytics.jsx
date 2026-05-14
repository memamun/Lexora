import React, { useMemo } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { ALL_WORDS, WORD_COUNT } from '@/lib/wordData';
import { ArrowLeft, TrendingUp, Clock, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

export default function Analytics() {
  const { reviews, stats, levelProgress, loading } = useStudyEngine();

  const activityData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        reviews: stats?.daily_reviews?.[key] || 0,
        correct: stats?.daily_correct?.[key] || 0,
      };
    });
  }, [stats]);

  const masteryData = useMemo(() => [
    { name: 'Mastered', value: reviews?.filter(r => r.mastery_level === 'mastered').length || 0, color: '#22c55e' },
    { name: 'Reviewing', value: reviews?.filter(r => r.mastery_level === 'reviewing').length || 0, color: '#f59e0b' },
    { name: 'Learning', value: reviews?.filter(r => r.mastery_level === 'learning').length || 0, color: '#60a5fa' },
    { name: 'New', value: WORD_COUNT - (reviews?.length || 0), color: '#1e293b' },
  ].filter(d => d.value > 0), [reviews]);

  const partData = useMemo(() => ['A', 'B', 'C'].map(part => {
    const words = ALL_WORDS.filter(w => w.part === part);
    const wordIndices = new Set(words.map(w => w.index));
    const reviewed = (reviews || []).filter(r => wordIndices.has(r.word_index));
    
    const totalCorrect = reviewed.reduce((sum, r) => sum + (r.correct_count || 0), 0);
    const totalSetReviews = reviewed.reduce((sum, r) => sum + (r.total_reviews || 0), 0);
    
    const accuracy = totalSetReviews > 0
      ? Math.round((totalCorrect / totalSetReviews) * 100)
      : 0;
      
    return { part: `Set ${part}`, accuracy, studied: reviewed.length, total: words.length };
  }), [reviews]);

  const weakWords = useMemo(() => (reviews || [])
    .filter(r => r.total_reviews >= 2)
    .sort((a, b) => (a.correct_count / a.total_reviews) - (b.correct_count / b.total_reviews))
    .slice(0, 8), [reviews]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;


  const totalAcc = stats?.total_reviews > 0 ? Math.round((stats.total_correct / stats.total_reviews) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors"><ArrowLeft className="w-4 h-4 text-muted-foreground" /></Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-xs text-muted-foreground">Your cognitive performance insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Reviews', value: stats?.total_reviews || 0, icon: Target, color: 'text-primary' },
          { label: 'Overall Accuracy', value: `${totalAcc}%`, icon: TrendingUp, color: 'text-success' },
          { label: 'Avg Response', value: reviews.length ? `${Math.round(reviews.reduce((s, r) => s + (r.avg_response_time || 3000), 0) / reviews.length / 1000)}s` : '—', icon: Clock, color: 'text-accent' },
          { label: 'Best Streak', value: stats?.longest_streak_days || 0, icon: Award, color: 'text-primary' },
        ].map((m, i) => (
          <div key={m.label} className="border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</span>
            </div>
            <p className={`text-2xl font-serif font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-border/50 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">14-Day Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activityData} barGap={2}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="reviews" fill="hsl(var(--primary))" opacity={0.3} radius={[3, 3, 0, 0]} />
              <Bar dataKey="correct" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-border/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level Mastery</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {levelProgress.filter(l => l.is_completed).length} / 15 Levels
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {levelProgress.map((lp, i) => (
              <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                lp.is_completed ? 'bg-success text-success-foreground' :
                lp.is_unlocked ? 'bg-primary/20 text-primary border border-primary/30' :
                'bg-muted text-muted-foreground/30'
              }`}>
                {lp.level_number}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 italic">Complete level quizzes to master the curriculum.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-border/50 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Set Performance</h3>
          <div className="space-y-4">
            {partData.map(p => (
              <div key={p.part}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{p.part}</span>
                  <span className="text-muted-foreground text-xs">{p.studied}/{p.total} studied · {p.accuracy}% acc</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(p.studied / p.total) * 100}%` }} transition={{ duration: 1 }}
                    className="h-full bg-primary/40 rounded-full relative"
                  >
                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.accuracy}%` }} transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border/50 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Mastery Distribution</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={masteryData} innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                  {masteryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {masteryData.map(d => (
                <div key={d.name} className="flex items-center gap-3 text-xs">
                  <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                  <span className="text-muted-foreground w-16">{d.name}</span>
                  <span className="text-foreground font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {weakWords.length > 0 && (
        <div className="border border-border/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-card/30">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Words Needing Attention</h3>
          </div>
          <div className="divide-y divide-border/30">
            {weakWords.map((r, i) => {
              const acc = Math.round((r.correct_count / Math.max(1, r.total_reviews)) * 100);
              const wd = ALL_WORDS[r.word_index];
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="font-mono text-sm font-medium text-foreground">{r.word}</span>
                    <span className="ml-3 text-xs text-muted-foreground">{wd?.meaning}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{r.total_reviews} reviews</span>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-destructive rounded-full" style={{ width: `${acc}%` }} />
                    </div>
                    <span className={`text-xs font-medium w-8 text-right ${acc < 50 ? 'text-destructive' : 'text-primary'}`}>{acc}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}