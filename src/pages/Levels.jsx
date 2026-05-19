import React, { useState, useMemo, useEffect } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { LEVELS, DIFFICULTY_MAP } from '@/lib/wordData';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Lock, CheckCircle2, Play, Trophy, Brain, Sparkles, 
  X, ChevronRight, Volume2, Star, Target, Keyboard, BookOpen, AlertCircle 
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { speak } from '@/utils/audio';

// Custom Radial Progress Component
function RadialProgress({ percent, size = 50, strokeWidth = 3, colorClass = "text-primary", icon: Icon }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible absolute inset-0">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-secondary/50"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Glowing Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={colorClass}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      {Icon && <Icon className="w-4 h-4 text-foreground relative z-10" />}
    </div>
  );
}

// Drifting Neuron Particles
const FloatingNeurons = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * -20,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20 blur-[1px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            x: [0, Math.random() * 30 - 15, Math.random() * 30 - 15, 0],
            y: [0, Math.random() * 30 - 15, Math.random() * 30 - 15, 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function Levels() {
  const { levelProgress, isLevelUnlocked, loading, getWordsForLevel } = useStudyEngine();
  const navigate = useNavigate();
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [expandedWord, setExpandedWord] = useState(null);

  // Compute overall synaptic dashboard metrics
  const stats = useMemo(() => {
    const totalWords = levelProgress.reduce((sum, p) => sum + (p.words_studied || 0), 0);
    const activePaths = levelProgress.filter(p => isLevelUnlocked(p.level_number)).length;
    const completedPaths = levelProgress.filter(p => p.is_completed).length;
    
    const completedQuizzes = levelProgress.filter(p => p.quiz_score > 0);
    const avgScore = completedQuizzes.length 
      ? Math.round(completedQuizzes.reduce((sum, p) => sum + p.quiz_score, 0) / completedQuizzes.length) 
      : 0;

    return {
      totalWords,
      activePaths,
      completedPaths,
      avgScore
    };
  }, [levelProgress, isLevelUnlocked]);

  // Determine highest unlocked level for track percentage
  const highestUnlockedLevel = useMemo(() => {
    return LEVELS.reduce((max, lvl) => isLevelUnlocked(lvl.number) ? Math.max(max, lvl.number) : max, 1);
  }, [isLevelUnlocked]);

  // Fetch words for selected level preview
  const levelWords = useMemo(() => {
    if (!selectedLevel) return [];
    return getWordsForLevel(selectedLevel.number);
  }, [selectedLevel, getWordsForLevel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary/25 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pb-20 select-none">
      <FloatingNeurons />

      {/* Page Header */}
      <PageHeader 
        title="Synaptic Roadmap"
        subtitle="Cognitive progression network spanning 15 specialized clusters"
        backTo="/"
      />

      {/* Neural Hub Dashboard Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Metric 1 */}
        <div className="bg-card/45 backdrop-blur-xl border border-border/50 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-lg group hover:border-primary/30 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-110 transition-transform">
            <Brain className="w-24 h-24 text-primary" />
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block">Synaptic Nodes</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-serif font-black text-foreground">{stats.totalWords}</span>
              <span className="text-xs text-muted-foreground">/ 300 words</span>
            </div>
            <div className="w-28 h-1 bg-secondary rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-primary" style={{ width: `${(stats.totalWords / 300) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-card/45 backdrop-blur-xl border border-border/50 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-lg group hover:border-emerald-500/30 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-110 transition-transform">
            <Sparkles className="w-24 h-24 text-success" />
          </div>
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-success animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block">Pathways Lit</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-serif font-black text-foreground">{stats.completedPaths}</span>
              <span className="text-xs text-muted-foreground">/ {stats.activePaths} active</span>
            </div>
            <div className="w-28 h-1 bg-secondary rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-success" style={{ width: `${(stats.completedPaths / 15) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-card/45 backdrop-blur-xl border border-border/50 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-lg group hover:border-accent/30 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-110 transition-transform">
            <Trophy className="w-24 h-24 text-accent" />
          </div>
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-accent" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block">Cognitive Quotient</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-serif font-black text-foreground">{stats.avgScore}%</span>
              <span className="text-xs text-muted-foreground">average</span>
            </div>
            <div className="w-28 h-1 bg-secondary rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-accent" style={{ width: `${stats.avgScore}%` }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Timeline Winding Pathway */}
      <div className="relative z-10 max-w-4xl mx-auto py-10 px-2 sm:px-6">
        
        {/* Dynamic Continuous Axon SVG Connecting Track */}
        <div 
          className="absolute top-[28px] bottom-[28px] w-[3px] bg-secondary/30 z-0 left-[20px] md:left-1/2 -translate-x-1/2"
        >
          {/* Active Lit Gradient Axon Path */}
          <motion.div 
            className="absolute top-0 w-full bg-gradient-to-b from-success via-primary to-accent shadow-[0_0_12px_hsl(var(--primary))]"
            initial={{ height: 0 }}
            animate={{ height: `${((highestUnlockedLevel - 1) / 14) * 100}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Glowing Action Potential thought signal */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff,0_0_15px_hsl(var(--primary))] z-10"
            style={{ left: "50%", x: "-50%" }}
            animate={{
              top: ["0%", `${((highestUnlockedLevel - 1) / 14) * 100}%`],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Levels Timeline Map */}
        <div className="space-y-16 relative">
          {LEVELS.map((level, index) => {
            const unlocked = isLevelUnlocked(level.number);
            const progress = levelProgress.find(p => p.level_number === level.number) || {};
            const isCompleted = progress.is_completed;
            const diff = DIFFICULTY_MAP[level.difficulty];
            const isEven = level.number % 2 === 0;
            const percent = ((progress.words_studied || 0) / 20) * 100;
            const isHovered = hoveredLevel === level.number;

            return (
              <div 
                key={level.number}
                className="flex flex-row md:grid md:grid-cols-[1fr_80px_1fr] items-center gap-4 w-full relative z-10"
                onMouseEnter={() => setHoveredLevel(level.number)}
                onMouseLeave={() => setHoveredLevel(null)}
              >
                
                {/* Left Column Card (Desktop Even Layout) */}
                <div className="w-full order-2 md:order-1 md:col-start-1 md:col-end-2 flex md:justify-end">
                  {isEven && (
                    <motion.div
                      whileHover={unlocked ? { y: -6, scale: 1.01 } : {}}
                      onClick={() => unlocked && setSelectedLevel(level)}
                      className={`w-full max-w-sm text-left relative overflow-hidden border rounded-3xl p-5 backdrop-blur-xl transition-all duration-300 ${
                        unlocked
                          ? 'bg-card/45 border-border/40 hover:border-primary/50 shadow-lg cursor-pointer hover:shadow-2xl hover:shadow-primary/5'
                          : 'bg-muted/10 border-dashed border-border/30 opacity-55 cursor-not-allowed'
                      }`}
                    >
                      {/* Glow Overlay */}
                      {unlocked && (
                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${diff.bg} ${diff.color} border-l border-b border-border/20`}>
                          {diff.label}
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        {/* Custom Radial Progress Badge */}
                        <div className="shrink-0">
                          <RadialProgress 
                            percent={percent} 
                            size={52} 
                            strokeWidth={3.5}
                            colorClass={isCompleted ? "text-success" : "text-primary"}
                            icon={isCompleted ? Trophy : unlocked ? Brain : Lock}
                          />
                        </div>

                        {/* Title Info */}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-serif font-black tracking-tight text-foreground">Node #{level.number}</span>
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                          </div>
                          <h3 className="font-semibold text-sm text-foreground/90 leading-tight tracking-wide">{level.title}</h3>
                          
                          {unlocked ? (
                            <p className="text-[10px] text-muted-foreground/80 font-medium">
                              {progress.words_studied || 0} mastered &bull; {progress.quiz_score > 0 ? `Score: ${progress.quiz_score}%` : 'Quiz unattempted'}
                            </p>
                          ) : (
                            <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1 mt-1">
                              <Lock className="w-2.5 h-2.5" /> Locked Node
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Center Synapse Node Point */}
                <div className="order-1 md:order-2 md:col-start-2 md:col-end-3 justify-self-start md:justify-self-center shrink-0">
                  <motion.div
                    animate={unlocked && !isCompleted ? {
                      boxShadow: isHovered 
                        ? "0 0 25px rgba(245,158,11,0.7)" 
                        : ["0 0 8px rgba(139,92,246,0.3)", "0 0 16px rgba(139,92,246,0.6)", "0 0 8px rgba(139,92,246,0.3)"]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-success/20 border-success text-success shadow-[0_0_12px_rgba(16,185,129,0.3)] shadow-success/15'
                        : unlocked
                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-muted border-border text-muted-foreground/60'
                    }`}
                  >
                    <span className="text-xs md:text-sm font-serif font-black">{level.number}</span>
                  </motion.div>
                </div>

                {/* Right Column Card (Desktop Odd Layout, Default Mobile Layout) */}
                <div className="w-full order-2 md:order-3 md:col-start-3 md:col-end-4 flex">
                  {(!isEven || true) && (
                    <motion.div
                      whileHover={unlocked ? { y: -6, scale: 1.01 } : {}}
                      onClick={() => unlocked && setSelectedLevel(level)}
                      className={`w-full max-w-sm text-left relative overflow-hidden border rounded-3xl p-5 backdrop-blur-xl transition-all duration-300 ${isEven ? 'md:hidden' : ''} ${
                        unlocked
                          ? 'bg-card/45 border-border/40 hover:border-primary/50 shadow-lg cursor-pointer hover:shadow-2xl hover:shadow-primary/5'
                          : 'bg-muted/10 border-dashed border-border/30 opacity-55 cursor-not-allowed'
                      }`}
                    >
                      {/* Glow Overlay */}
                      {unlocked && (
                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${diff.bg} ${diff.color} border-l border-b border-border/20`}>
                          {diff.label}
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        {/* Custom Radial Progress Badge */}
                        <div className="shrink-0">
                          <RadialProgress 
                            percent={percent} 
                            size={52} 
                            strokeWidth={3.5}
                            colorClass={isCompleted ? "text-success" : "text-primary"}
                            icon={isCompleted ? Trophy : unlocked ? Brain : Lock}
                          />
                        </div>

                        {/* Title Info */}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-serif font-black tracking-tight text-foreground">Node #{level.number}</span>
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                          </div>
                          <h3 className="font-semibold text-sm text-foreground/90 leading-tight tracking-wide">{level.title}</h3>
                          
                          {unlocked ? (
                            <p className="text-[10px] text-muted-foreground/80 font-medium">
                              {progress.words_studied || 0} mastered &bull; {progress.quiz_score > 0 ? `Score: ${progress.quiz_score}%` : 'Quiz unattempted'}
                            </p>
                          ) : (
                            <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1 mt-1">
                              <Lock className="w-2.5 h-2.5" /> Locked Node
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Cognitive Inspector Detail Drawer (Slide over Panel) */}
      <AnimatePresence>
        {selectedLevel && (
          <>
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 cursor-pointer"
              onClick={() => setSelectedLevel(null)}
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[500px] bg-card/95 backdrop-blur-3xl border-l border-border/50 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between shrink-0 bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary">Neural Node #{selectedLevel.number}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${DIFFICULTY_MAP[selectedLevel.difficulty].bg} ${DIFFICULTY_MAP[selectedLevel.difficulty].color}`}>
                      {DIFFICULTY_MAP[selectedLevel.difficulty].label}
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-black text-foreground leading-none">{selectedLevel.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedLevel(null)}
                  className="p-1.5 hover:bg-secondary rounded-lg transition-colors border border-border/30"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Drawer Body Scroll Container */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
                
                {/* Visual Mastery Ring Summary */}
                <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Synaptic Connection Progress</h4>
                    <p className="text-[11px] text-muted-foreground">Master words by studying flashcards and completing drills.</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 
                        {levelProgress.find(p => p.level_number === selectedLevel.number)?.words_studied || 0}/20 Mastered
                      </span>
                      {levelProgress.find(p => p.level_number === selectedLevel.number)?.quiz_score > 0 && (
                        <span className="text-xs font-bold text-accent flex items-center gap-1 border-l border-border/50 pl-2">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" /> Quiz High Score: {levelProgress.find(p => p.level_number === selectedLevel.number)?.quiz_score}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 pl-4">
                    <RadialProgress 
                      percent={((levelProgress.find(p => p.level_number === selectedLevel.number)?.words_studied || 0) / 20) * 100}
                      size={60}
                      strokeWidth={4.5}
                      colorClass="text-primary"
                    />
                  </div>
                </div>

                {/* Direct Action study buttons */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Drill Launcher</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/spelling?level=${selectedLevel.number}`)}
                      className="flex flex-col items-start p-3 bg-secondary/30 hover:bg-pink-500/10 border border-border/30 hover:border-pink-500/30 rounded-xl transition-all text-left group"
                    >
                      <Keyboard className="w-5 h-5 text-pink-500 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-foreground">Spelling Master</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">Type correct spelling</span>
                    </button>
                    <button
                      onClick={() => navigate(`/matching?level=${selectedLevel.number}`)}
                      className="flex flex-col items-start p-3 bg-secondary/30 hover:bg-emerald-500/10 border border-border/30 hover:border-emerald-500/30 rounded-xl transition-all text-left group"
                    >
                      <Target className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-foreground">Matching Game</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">Fast-paced definition fit</span>
                    </button>
                  </div>
                </div>

                {/* Target vocabulary dictionary list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Target Vocabulary ({levelWords.length})</h4>
                    <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Click word to expand</span>
                  </div>

                  <div className="space-y-2">
                    {levelWords.map((word) => {
                      const isExpanded = expandedWord === word.word;
                      return (
                        <div 
                          key={word.word}
                          className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                            isExpanded ? 'bg-secondary/25 border-primary/30 shadow-md' : 'bg-secondary/10 border-border/30 hover:bg-secondary/20'
                          }`}
                        >
                          {/* Row Header */}
                          <div 
                            onClick={() => setExpandedWord(isExpanded ? null : word.word)}
                            className="px-4 py-3 flex items-center justify-between cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-serif font-black text-foreground tracking-wide uppercase">{word.word}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded border border-border/30">
                                {word.pos}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bengali font-bold text-muted-foreground font-medium">{word.bengali}</span>
                              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90 text-primary' : ''}`} />
                            </div>
                          </div>

                          {/* Row Expandable Content */}
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 pt-1 border-t border-border/20 space-y-3"
                            >
                              <div className="space-y-1">
                                <span className="text-[8px] uppercase font-bold tracking-widest text-primary block">Definition</span>
                                <p className="text-xs text-foreground/90 font-medium leading-relaxed">{word.explanation}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-[11px]">
                                {word.synonyms && word.synonyms.length > 0 && (
                                  <div>
                                    <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-500 block mb-0.5">Synonyms</span>
                                    <span className="text-muted-foreground font-medium leading-normal">{word.synonyms.join(', ')}</span>
                                  </div>
                                )}
                                {word.antonyms && word.antonyms.length > 0 && (
                                  <div>
                                    <span className="text-[8px] uppercase font-bold tracking-widest text-pink-500 block mb-0.5">Antonyms</span>
                                    <span className="text-muted-foreground font-medium leading-normal">{word.antonyms.join(', ')}</span>
                                  </div>
                                )}
                              </div>

                              {word.example && (
                                <div className="space-y-1">
                                  <span className="text-[8px] uppercase font-bold tracking-widest text-accent block">Usage Example</span>
                                  <p className="text-xs italic text-muted-foreground font-medium leading-relaxed border-l-2 border-accent/30 pl-2 bg-accent/5 py-1 rounded-r">
                                    &ldquo;{word.example}&rdquo;
                                  </p>
                                </div>
                              )}

                              {/* Audio Action row */}
                              <div className="pt-2 border-t border-border/10 flex items-center justify-end">
                                <button
                                  onClick={(e) => { e.stopPropagation(); speak(word.word); }}
                                  className="py-1 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-primary/20 shadow-sm"
                                >
                                  <Volume2 className="w-3.5 h-3.5" /> Pronounce
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Drawer Footer Call to Action */}
              <div className="p-4 border-t border-border/50 bg-muted/20 shrink-0 flex gap-3">
                <button 
                  onClick={() => navigate(`/study-level/${selectedLevel.number}`)}
                  className="flex-1 py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" /> Study Lobby
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}