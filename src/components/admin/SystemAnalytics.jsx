import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Flame } from 'lucide-react';

export default function SystemAnalytics({
  dailyChartData,
  streakLeaders,
  users,
  systemHardestWords,
}) {
  return (
    <div className="space-y-6">

      {/* Leaders Board & Metrics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Daily Reviews Completed */}
        <div className="lg:col-span-2 border border-border/50 bg-card/10 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Global Study Activity (Last 14 Days)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyChartData}>
              <defs>
                <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="reviews" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorReviews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leaderboard panel */}
        <div className="border border-border/50 bg-card/10 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Streak Leaderboard
              </h3>
            </div>
            {streakLeaders.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No streaks recorded yet.</p>
            ) : (
              <div className="space-y-3.5">
                {streakLeaders.map((leader, i) => (
                  <div key={leader.id} className="flex items-center justify-between text-xs bg-secondary/20 p-2 rounded-xl border border-border/30">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold font-mono text-muted-foreground w-3">#{i + 1}</span>
                      <div className="w-6.5 h-6.5 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                        {leader.avatar ? (
                          <img src={leader.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black text-muted-foreground">{leader.name[0].toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-medium text-foreground truncate max-w-[100px]">{leader.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Flame className="w-3.5 h-3.5 fill-primary/10" />
                      <span className="font-bold font-mono text-[13px]">{leader.streak}d</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Providers Chart */}
          <div className="space-y-2 mt-4 pt-4 border-t border-border/30">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Authentication Breakdown</span>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Google: <b>{users.filter(u => u.provider === 'google.com').length}</b></span>
              <span>Email: <b>{users.filter(u => u.provider === 'password').length}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Difficulty Insights */}
      <div className="border border-border/50 bg-card/10 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border/40 bg-card/30 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Global Curriculum Insights: Top 5 Hardest Words
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Based on user review errors
          </span>
        </div>
        <div className="divide-y divide-border/30">
          {systemHardestWords.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/10 transition-colors">
              <div>
                <span className="font-mono text-sm font-black text-foreground">{item.word}</span>
                <span className="ml-4 text-xs text-muted-foreground">{item.meaning}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">{item.incorrectReviews} failures</span>
                <span className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-lg">
                  {item.accuracy} Accuracy
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
