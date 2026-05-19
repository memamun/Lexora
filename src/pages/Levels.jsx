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

// Custom Reusable Level Card Component for Mobile-First DRY rendering
function LevelCard({ level, unlocked, progress, isCompleted, diff, percent, onSelect }) {
  return (
    <div
      onClick={() => unlocked && onSelect(level)}
      className={`w-full max-w-sm text-left relative overflow-hidden border rounded-2xl p-5 backdrop-blur-2xl transition-all duration-500 ${
        unlocked
          ? isCompleted
            ? 'bg-gradient-to-br from-card/65 to-success/5 border-success/35 hover:border-success/60 shadow-lg shadow-success/5 hover:shadow-success/15 hover:shadow-2xl cursor-pointer'
            : 'bg-gradient-to-br from-card/65 to-primary/5 border-border/40 hover:border-primary/50 shadow-lg shadow-primary/5 hover:shadow-primary/15 hover:shadow-2xl cursor-pointer'
          : 'bg-muted/5 border-dashed border-border/20 opacity-50 cursor-not-allowed'
      }`}
    >
      {/* Decorative Neural Fiber Lines Background */}
      {unlocked && (
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" preserveAspectRatio="none">
            <path d="M 0,20 Q 75,40 150,20 T 300,20" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 0,70 Q 90,40 180,70 T 300,70" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="120" cy="25" r="2.5" className="fill-primary animate-pulse" />
            <circle cx="220" cy="65" r="2" className="fill-accent animate-ping" />
          </svg>
        </div>
      )}

      {/* Difficulty Badge with glass styling */}
      {unlocked && (
        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${diff.bg} ${diff.color} border-l border-b border-border/20 backdrop-blur-md`}>
          {diff.label}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Integrated Neural Synapse Badge */}
        <div className="shrink-0 relative group/synapse">
          {/* Glowing biological pulse rings under the node */}
          {unlocked && (
            <>
              <div className={`absolute inset-0 rounded-full blur-md opacity-40 transition-all duration-500 group-hover/synapse:scale-125 ${
                isCompleted ? 'bg-success/50' : 'bg-primary/50'
              }`} />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -inset-1 rounded-full opacity-35 ${
                  isCompleted ? 'bg-success/20' : 'bg-primary/20'
                }`}
              />
            </>
          )}

          {/* Glowing Synapse Ring with Level Number in Center */}
          <div className="relative">
            <RadialProgress 
              percent={percent} 
              size={54} 
              strokeWidth={3.5}
              colorClass={isCompleted ? "text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.6)]" : "text-primary drop-shadow-[0_0_5px_rgba(245,158,11,0.6)]"}
              icon={null}
            />
            {/* Inner Glassmorphic Cell Nucleus with Number */}
            <div className={`absolute inset-[3.5px] rounded-full flex items-center justify-center font-serif font-black text-lg backdrop-blur-md transition-all duration-300 ${
              isCompleted
                ? 'bg-success/15 text-success border border-success/30'
                : unlocked
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-muted/40 text-muted-foreground/40 border border-border/20'
            }`}>
              {level.number}
            </div>
          </div>
        </div>

        {/* Title Info */}
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-serif font-black tracking-tight text-foreground leading-tight">Level {level.number}</span>
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
          </div>
          <h3 className="font-semibold text-[11px] text-muted-foreground/75 leading-tight tracking-wide">
            Words {level.number * 20 - 19} – {level.number * 20}
          </h3>
          
          {unlocked ? (
            <p className="text-[10px] text-muted-foreground/60 font-medium">
              {progress.words_studied || 0} mastered &bull; {progress.quiz_score > 0 ? `Score: ${progress.quiz_score}%` : 'Quiz unattempted'}
            </p>
          ) : (
            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Premium Neural Expressive Background with drifting bio-hubs and axonal meshes
const NeuralExpressiveBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * -30,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Bioluminescent Morphing Synapse Hubs */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -50, 30, 0],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-20 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-primary/8 to-accent/5 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 40, -40, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[35%] -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-accent/6 to-success/4 blur-[110px]"
      />
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -30, 50, 0],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-success/6 to-primary/4 blur-[130px]"
      />

      {/* Decorative Synaptic Axon Meshes (Sprawling brain pathways at the edges) */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-screen text-primary">
        <svg className="absolute top-20 left-0 w-80 h-[500px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500">
          <path d="M -10,50 Q 80,100 20,200 T 100,350 T -20,480" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M 50,150 Q 150,220 70,300 T 150,420" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="20" y1="200" x2="70" y2="300" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="20" cy="200" r="3.5" className="fill-primary" />
          <circle cx="100" cy="350" r="4.5" className="fill-accent" />
          <circle cx="70" cy="300" r="3" className="fill-success" />
        </svg>
        <svg className="absolute top-[40%] right-0 w-96 h-[600px] transform scale-x-[-1]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 600">
          <path d="M -20,100 Q 120,200 40,350 T 180,500 T 10,580" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M 60,250 Q 180,320 90,450" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="40" cy="350" r="4" className="fill-primary" />
          <circle cx="180" cy="500" r="4" className="fill-success" />
        </svg>
      </div>

      {/* Tiny drifting neuron particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20 blur-[0.5px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
            y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
            opacity: [0.15, 0.45, 0.15],
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
      <NeuralExpressiveBackground />

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
          className="absolute top-[28px] bottom-[28px] w-[3px] bg-secondary/30 z-0 left-[16px] md:left-1/2 -translate-x-1/2"
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
                className="flex flex-row md:grid md:grid-cols-[1fr_40px_1fr] items-center gap-3 md:gap-4 w-full relative z-10"
                onMouseEnter={() => setHoveredLevel(level.number)}
                onMouseLeave={() => setHoveredLevel(null)}
              >
                
                {/* Left Column Card (Desktop Even Layout) */}
                <div className="hidden md:flex md:col-start-1 md:col-end-2 md:justify-end w-full">
                  {isEven && (
                    <LevelCard 
                      level={level}
                      unlocked={unlocked}
                      progress={progress}
                      isCompleted={isCompleted}
                      diff={diff}
                      percent={percent}
                      onSelect={setSelectedLevel}
                    />
                  )}
                </div>

                {/* Center Timeline Dot / Synaptic Junction */}
                <div className="shrink-0 z-10 justify-self-center md:col-start-2 md:col-end-3 flex items-center justify-center w-8 h-8 relative">
                  {/* Glowing Outer Halo */}
                  {unlocked && (
                    <motion.div
                      animate={{
                        scale: isHovered ? [1, 1.35, 1.15] : [1, 1.2, 1],
                        opacity: isHovered ? 0.8 : [0.25, 0.45, 0.25]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className={`absolute inset-0 rounded-full border ${
                        isCompleted
                          ? 'border-success/35 bg-success/5 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                          : 'border-primary/35 bg-primary/5 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                      }`}
                    />
                  )}
                  {/* Central Node Core */}
                  <motion.div
                    animate={unlocked && !isCompleted ? {
                      scale: [1, 1.15, 1],
                      boxShadow: isHovered 
                        ? "0 0 15px rgba(245,158,11,0.8)" 
                        : "0 0 8px rgba(245,158,11,0.4)"
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 relative z-10 ${
                      isCompleted
                        ? 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        : unlocked
                        ? 'bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-muted-foreground/30 border border-border/20'
                    }`}
                  />
                </div>

                {/* Right Column Card (Desktop Odd Layout, Mobile Default Layout) */}
                <div className="flex-1 md:flex md:col-start-3 md:col-end-4 w-full">
                  <div className={`w-full ${isEven ? 'md:hidden' : ''}`}>
                    <LevelCard 
                      level={level}
                      unlocked={unlocked}
                      progress={progress}
                      isCompleted={isCompleted}
                      diff={diff}
                      percent={percent}
                      onSelect={setSelectedLevel}
                    />
                  </div>
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
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary">
                      Words {selectedLevel.number * 20 - 19} – {selectedLevel.number * 20}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${DIFFICULTY_MAP[selectedLevel.difficulty].bg} ${DIFFICULTY_MAP[selectedLevel.difficulty].color}`}>
                      {DIFFICULTY_MAP[selectedLevel.difficulty].label}
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-black text-foreground leading-none">Level {selectedLevel.number}</h2>
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

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
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