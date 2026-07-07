import React, { useState, useEffect } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart, Trophy, Flame } from 'lucide-react';
import StatsRow from '@/components/dashboard/StatsRow';
import MasteryRing from '@/components/dashboard/MasteryRing';
import WordQueue from '@/components/dashboard/WordQueue';
import RetentionHeatmap from '@/components/dashboard/RetentionHeatmap';
import LevelTracker from '@/components/dashboard/LevelTracker';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/lib/AuthContext';

const NAV_ITEMS = [
  { to: '/levels', icon: BookOpen, label: 'Levels', primary: true },
  { to: '/analytics', icon: BarChart, label: 'Study Analytics' },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-muted/40 rounded-lg" />
          <div className="h-4 w-72 bg-muted/30 rounded-md" />
        </div>
        <div className="h-9 w-40 bg-muted/40 rounded-xl" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-border/40 bg-card/50 space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-4 w-24 bg-muted/30 rounded" />
              <div className="w-7 h-7 rounded-lg bg-muted/40" />
            </div>
            <div className="h-8 w-16 bg-muted/40 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* LevelTracker Skeleton */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 space-y-5">
            <div className="flex justify-between items-center">
              <div className="h-5 w-40 bg-muted/40 rounded" />
              <div className="h-4 w-12 bg-muted/30 rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-full bg-muted/30 rounded-lg" />
              <div className="h-3 w-4/5 bg-muted/20 rounded" />
            </div>
          </div>

          {/* WordQueue Skeleton */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 space-y-4">
            <div className="h-5 w-32 bg-muted/40 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-border/20 bg-muted/5">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-muted/40 rounded" />
                    <div className="h-3 w-48 bg-muted/30 rounded" />
                  </div>
                  <div className="h-7 w-20 bg-muted/40 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap Skeleton */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 space-y-4">
            <div className="h-5 w-36 bg-muted/40 rounded" />
            <div className="h-24 w-full bg-muted/20 rounded-xl" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Learning Progress Ring Skeleton */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 space-y-6 flex flex-col items-center">
            <div className="h-5 w-32 bg-muted/40 rounded self-start" />
            <div className="w-36 h-36 rounded-full border-8 border-muted/20 flex items-center justify-center">
              <div className="h-10 w-16 bg-muted/30 rounded-lg" />
            </div>
          </div>

          {/* Exam Readiness Skeleton */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 space-y-4">
            <div className="h-5 w-32 bg-muted/40 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-28 bg-muted/30 rounded" />
                  <div className="h-3 w-8 bg-muted/40 rounded" />
                </div>
                <div className="h-2 w-full bg-muted/20 rounded-full" />
              </div>
            ))}
          </div>

          {/* Streak Leaderboard Skeleton */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 space-y-4">
            <div className="h-5 w-36 bg-muted/40 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-5 h-5 rounded-full bg-muted/40 shrink-0" />
                    <div className="w-6 h-6 rounded-full bg-muted/40 shrink-0" />
                    <div className="h-3 w-24 bg-muted/30 rounded shrink-0" />
                  </div>
                  <div className="h-4 w-10 bg-muted/40 rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { stats, levelProgress, loading, getDueWords, getWeakWords, getNearForgettingWords, getMasteryStats } = useStudyEngine();
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);

  const greetingName = user?.name ? user.name.split(' ')[0] : 'Palm';

  useEffect(() => {
    let active = true;
    const fetchLeaders = async () => {
      try {
        const { getApp } = await import('firebase/app');
        const { getFirestore, collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
        const app = getApp();
        const db = getFirestore(app);
        
        // Fetch up to 50 users to find active streaks after filtering
        const q = query(
          collection(db, 'users'),
          orderBy('current_streak_days', 'desc'),
          limit(50)
        );
        const usersSnap = await getDocs(q);
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

        const leadersList = usersSnap.docs.map(docSnap => {
          const userData = docSnap.data();
          let streak = Number(userData.current_streak_days || 0);

          if (userData.updated_date) {
            const lastUpdate = new Date(userData.updated_date);
            const lastUpdateDateStr = `${lastUpdate.getFullYear()}-${String(lastUpdate.getMonth() + 1).padStart(2, '0')}-${String(lastUpdate.getDate()).padStart(2, '0')}`;
            if (lastUpdateDateStr !== todayStr && lastUpdateDateStr !== yesterdayStr) {
              streak = 0;
            }
          } else if (streak > 0) {
            const lastLoginVal = userData.lastLoginAt;
            const lastLogin = lastLoginVal ? (lastLoginVal.toDate ? lastLoginVal.toDate() : new Date(lastLoginVal)) : null;
            if (lastLogin) {
              const lastLoginDateStr = `${lastLogin.getFullYear()}-${String(lastLogin.getMonth() + 1).padStart(2, '0')}-${String(lastLogin.getDate()).padStart(2, '0')}`;
              if (lastLoginDateStr !== todayStr && lastLoginDateStr !== yesterdayStr) {
                streak = 0;
              }
            }
          }

          return {
            id: docSnap.id,
            name: userData.displayName || userData.email?.split('@')[0] || 'User',
            streak,
            avatar: userData.photoURL
          };
        })
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 3);
        
        if (active) {
          setLeaders(leadersList);
          setLoadingLeaders(false);
        }
      } catch (err) {
        console.warn('Failed to load streak leaderboard:', err.message);
        if (active) setLoadingLeaders(false);
      }
    };
    
    fetchLeaders();
    return () => { active = false; };
  }, []);

  if (loading || loadingLeaders) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5"
      >
        <div className="flex-1 -mb-6">
          <PageHeader 
            title={`Welcome back, ${greetingName}! 👋`}
            subtitle={
              <span className="flex items-center gap-2">
                <span>Roadmap Progress</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>15 Levels</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>300 words</span>
              </span>
            }
            showHamburger={true}
          />
        </div>

        <div className="hidden sm:flex gap-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label, primary }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm ${
                primary 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0' 
                  : 'bg-card border border-border/60 text-foreground hover:bg-secondary/80 hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4 opacity-80" />{label}
            </Link>
          ))}
        </div>
      </motion.div>

      <StatsRow stats={stats} masteryStats={getMasteryStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <LevelTracker levelProgress={levelProgress} />
          <WordQueue dueWords={getDueWords} weakWords={getWeakWords} nearForgetting={getNearForgettingWords} />
          <RetentionHeatmap stats={stats} />
        </div>
        <div className="space-y-4">
          <div className="border border-border/50 rounded-xl p-5">
            <h3 className="text-label mb-4 text-center">Learning Progress</h3>
            <MasteryRing masteryStats={getMasteryStats} />
          </div>
          <div className="border border-border/50 rounded-xl p-4 space-y-3">
            <h3 className="text-label">Exam Readiness</h3>
              {[
                { label: 'Set A — Foundation', val: Math.min(100, Math.round(((getMasteryStats?.mastered || 0) / 100) * 100)) },
                { label: 'Set B — Advanced', val: Math.min(100, Math.round((((getMasteryStats?.mastered || 0) + (getMasteryStats?.reviewing || 0)) / 200) * 100)) },
                { label: 'Set C — Exam Level', val: Math.min(100, Math.round((((getMasteryStats?.mastered || 0) + (getMasteryStats?.reviewing || 0)) / 300) * 100)) },
              ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{item.val}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1.2, delay: 0.3 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Streak Leaderboard */}
          <div className="border border-border/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-black">
                Streak Leaderboard
              </h3>
            </div>
            
            {loadingLeaders ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between text-xs animate-pulse">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Rank circle skeleton */}
                      <div className="w-5 h-5 rounded-full bg-secondary/80 border border-border/50 shrink-0" />
                      {/* Avatar skeleton */}
                      <div className="w-6 h-6 rounded-full bg-secondary/80 border border-border/50 shrink-0" />
                      {/* Name skeleton */}
                      <div className="h-3 bg-secondary/85 rounded w-24 shrink-0" />
                    </div>
                    {/* Streak flame skeleton */}
                    <div className="h-4 bg-secondary/80 rounded w-10 shrink-0" />
                  </div>
                ))}
              </div>
            ) : leaders.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No streaks recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {leaders.map((leader, i) => (
                  <div key={leader.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0 ${
                        i === 0 ? 'bg-primary/20 text-primary border border-primary/30' :
                        i === 1 ? 'bg-muted-foreground/15 text-muted-foreground border border-border' :
                        'bg-secondary text-muted-foreground/75 border border-border/50'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {leader.avatar ? (
                          <img src={leader.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-muted-foreground">
                            {leader.name[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-foreground truncate">{leader.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <Flame className="w-3.5 h-3.5 text-accent animate-pulse" />
                      <span className="font-bold font-mono text-[13px]">{leader.streak}d</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-border/50 rounded-xl p-4 space-y-3">
            <h3 className="text-label">Next Milestone</h3>
            {(() => {
              const nextLevel = levelProgress.find(l => l.is_unlocked && !l.is_completed) || levelProgress[0];
              if (!nextLevel) return <p className="text-xs text-muted-foreground italic">You've reached the end!</p>;
              const progressPercent = Math.round(((nextLevel.words_studied || 0) / 20) * 100);
              return (
                <Link to={`/study-level/${nextLevel.level_number}`} className="block group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-premium text-sm font-bold text-foreground group-hover:text-primary transition-colors">Level {nextLevel.level_number} Mastery</span>
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">Finish studying all 20 words to unlock the quiz.</p>
                </Link>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}