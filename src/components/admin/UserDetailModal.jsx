import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function UserDetailModal({
  selectedUser,
  setSelectedUser,
  handleResetProgress,
  handleDeleteUser,
  handleToggleRole,
  loadingUserDetails,
  getCompletedLevelsCount,
  selectedUserMasteryData,
  selectedUserWeakWords,
  userQuizzes,
}) {
  if (!selectedUser) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedUser(null)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />

      <div className="fixed inset-y-0 right-0 z-50 flex justify-end w-full max-w-lg pointer-events-none">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full h-full border-l border-border/50 shadow-2xl flex flex-col pointer-events-auto z-10"
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            backgroundColor: 'hsl(var(--background))'
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                {selectedUser.photoURL ? (
                  <img src={selectedUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {(selectedUser.displayName || selectedUser.email || '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-serif font-black text-foreground text-base leading-tight">
                  {selectedUser.displayName || 'User details'}
                </h3>
                <p className="text-[10px] text-muted-foreground font-mono">{selectedUser.email}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-8 h-8 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground border border-border/80 transition-all shrink-0 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">

            {/* Actions Panel */}
            <div className="flex gap-2 border border-border/50 rounded-xl p-3 bg-card/10 items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User Management</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleResetProgress(selectedUser)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/80 border border-border text-foreground hover:bg-secondary rounded-xl text-xs font-semibold transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Progress
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 rounded-xl text-xs font-semibold transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete User
                </button>
              </div>
            </div>

            {/* Auth and Meta details */}
            <div className="grid grid-cols-2 gap-4 border border-border/50 rounded-xl p-4 bg-card/10 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">Registration Date</span>
                <p className="font-bold text-foreground font-mono">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Last Login/Active</span>
                <p className="font-bold text-foreground font-mono">
                  {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Provider</span>
                <p className="font-bold text-foreground capitalize">
                  {selectedUser.provider === 'google.com' ? 'Google OAuth' : 'Email/Password'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Role / Authority</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${
                    selectedUser.role === 'admin'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-muted text-muted-foreground border border-border/60'
                  }`}>
                    {selectedUser.role || 'user'}
                  </span>
                  <button
                    onClick={() => handleToggleRole(selectedUser)}
                    className="text-[9px] text-primary hover:underline font-bold"
                  >
                    Change role
                  </button>
                </div>
              </div>
            </div>

            {loadingUserDetails ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase animate-pulse">
                  Retrieving stats from firestore...
                </p>
              </div>
            ) : (
              <>
                {/* User specific stats row */}
                <div className="grid grid-cols-3 gap-3 border border-border/50 rounded-xl p-4 text-center bg-card/5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Vocabulary size</span>
                    <p className="text-xl font-serif font-black text-foreground font-mono">{selectedUser.stats?.total_words_studied || 0}</p>
                    <p className="text-[8px] text-muted-foreground font-medium">unlocked words</p>
                  </div>
                  <div className="space-y-0.5 border-x border-border/40">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Accuracy</span>
                    <p className="text-xl font-serif font-black text-foreground font-mono">
                      {selectedUser.stats?.total_reviews
                        ? `${Math.round((selectedUser.stats.total_correct / selectedUser.stats.total_reviews) * 100)}%`
                        : '—'}
                    </p>
                    <p className="text-[8px] text-muted-foreground font-medium">{selectedUser.stats?.total_reviews || 0} reviews</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Streaks</span>
                    <p className="text-xl font-serif font-black text-foreground font-mono">
                      {selectedUser.stats?.current_streak_days || 0}d
                    </p>
                    <p className="text-[8px] text-muted-foreground font-medium">record: {selectedUser.stats?.longest_streak_days || 0}d</p>
                  </div>
                </div>

                {/* Level Progress Grid */}
                <div className="border border-border/50 rounded-xl p-4 bg-card/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Curriculum Progress
                    </h4>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {getCompletedLevelsCount(selectedUser)} / 15 Levels
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 15 }, (_, i) => {
                      const lvlNum = i + 1;
                      const lvlData = selectedUser.levelProgress?.[`level_${lvlNum}`] || {};
                      const isCompleted = lvlData.is_completed;
                      const isUnlocked = lvlData.is_unlocked || lvlNum === 1;

                      return (
                        <div key={lvlNum} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all relative ${
                          isCompleted ? 'bg-success text-success-foreground' :
                          isUnlocked ? 'bg-primary/20 text-primary border border-primary/30' :
                          'bg-muted text-muted-foreground/30'
                        }`} title={`Level ${lvlNum}: ${isCompleted ? 'Completed' : isUnlocked ? 'Unlocked' : 'Locked'}`}>
                          <span>{lvlNum}</span>
                          {lvlData.quiz_score > 0 && (
                            <span className="text-[7px] opacity-80 mt-0.5 font-mono">{lvlData.quiz_score}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mastery Distribution Pie Chart */}
                <div className="border border-border/50 rounded-xl p-4 bg-card/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Curriculum Progress
                  </h4>
                  {selectedUserMasteryData.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No reviews recorded yet.</p>
                  ) : (
                    <div className="flex items-center gap-6 justify-center">
                      <ResponsiveContainer width={100} height={100} className="shrink-0">
                        <PieChart>
                          <Pie data={selectedUserMasteryData} innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                            {selectedUserMasteryData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        {selectedUserMasteryData.map((d, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                            <span className="text-muted-foreground">{d.name}:</span>
                            <span className="text-foreground font-bold font-mono">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Single User Weak Words */}
                {selectedUserWeakWords.length > 0 && (
                  <div className="border border-border/50 rounded-xl overflow-hidden bg-card/5">
                    <div className="px-4 py-2 border-b border-border/40 bg-card/20">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Words Needing Attention (Weakest accuracy)
                      </h4>
                    </div>
                    <div className="divide-y divide-border/30">
                      {selectedUserWeakWords.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-xs">
                          <div>
                            <span className="font-mono text-xs font-bold text-foreground">{item.word}</span>
                            <span className="ml-2 text-muted-foreground truncate max-w-[150px] inline-block align-bottom">{item.meaning}</span>
                          </div>
                          <span className="font-bold text-destructive">{item.accuracy}% acc</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Quiz Attempts */}
                <div className="border border-border/50 rounded-xl overflow-hidden bg-card/5">
                  <div className="px-4 py-2 border-b border-border/40 bg-card/20">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Recent Quiz Attempts
                    </h4>
                  </div>
                  {userQuizzes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4 bg-transparent">No quiz attempts logged.</p>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {userQuizzes.slice(0, 5).map((q) => {
                        const acc = Math.round((q.correct_count / q.total_questions) * 100);
                        return (
                          <div key={q.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                            <div>
                              <span className="font-bold text-foreground">Level {q.level_number} Quiz</span>
                              <span className="ml-2 text-[10px] text-muted-foreground font-mono">
                                {q.attempted_at ? new Date(q.attempted_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{q.correct_count}/{q.total_questions} correct</span>
                              <span className={`font-bold px-1.5 py-0.2 rounded font-mono ${
                                acc >= 80 ? 'text-success bg-success/10 border border-success/20' : 'text-primary bg-primary/10 border border-primary/20'
                              }`}>
                                {acc}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
