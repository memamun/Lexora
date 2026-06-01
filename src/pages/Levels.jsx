import React, { useState, useMemo } from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { LEVELS, DIFFICULTY_MAP } from '@/lib/wordData';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Trophy, Brain, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { WORDS_PER_LEVEL } from '@/lib/constants';
import LexoraLogo from '@/components/ui/LexoraLogo';

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
      className={`w-full max-w-sm text-center md:text-left relative overflow-hidden border rounded-2xl p-3 md:p-5 backdrop-blur-2xl transition-all duration-500 ${
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

      <div className="flex flex-col items-center md:flex-row md:items-center gap-2 md:gap-4">
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
        <div className="space-y-1 flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-1.5 justify-center md:justify-start">
            <span className="text-sm md:text-base font-serif font-black tracking-tight text-foreground leading-tight">Level {level.number}</span>
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
          </div>
          <h3 className="font-semibold text-[10px] md:text-[11px] text-muted-foreground/75 leading-tight tracking-wide">
            Words {level.number * WORDS_PER_LEVEL - WORDS_PER_LEVEL + 1} – {level.number * WORDS_PER_LEVEL}
          </h3>
          
          {unlocked ? (
            <p className="text-[9px] md:text-[10px] text-muted-foreground/60 font-medium leading-normal">
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
    const colors = ['bg-primary/25', 'bg-accent/25', 'bg-indigo-500/20', 'bg-success/20'];
    return Array.from({ length: WORDS_PER_LEVEL }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      colorClass: colors[i % colors.length],
      duration: Math.random() * 25 + 25,
      delay: Math.random() * -30,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Desktop Neural Expressive Background */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bioluminescent Morphing Synapse Hubs */}
        <motion.div
          animate={{
            x: [0, 30, -15, 0],
            y: [0, -40, 20, 0],
            opacity: [0.45, 0.65, 0.45],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 -left-20 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-accent/12 to-indigo-500/8 blur-[160px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 20, 0],
            y: [0, 30, -30, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[35%] -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-primary/10 to-pink-500/6 blur-[140px]"
        />
        <motion.div
          animate={{
            x: [0, 20, -20, 0],
            y: [0, -20, 40, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/10 to-accent/10 blur-[180px]"
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
            className={`absolute rounded-full blur-[0.5px] ${p.colorClass}`}
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
              scale: [0.8, 1.2, 0.8],
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

      {/* Mobile-optimized sleek Gemini-like bottom gradient glow */}
      <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Deep blue glow */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.35, 0.5, 0.35],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[120%] h-[350px] rounded-full bg-gradient-to-t from-blue-600/20 via-indigo-500/10 to-transparent blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.25, 0.4, 0.25],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 left-1/3 -translate-x-1/2 w-[80%] h-[250px] rounded-full bg-gradient-to-t from-violet-600/15 via-purple-500/5 to-transparent blur-[100px]"
        />
      </div>
    </div>
  );
};

export default function Levels() {
  const { levelProgress, isLevelUnlocked, loading, getWordsForLevel } = useStudyEngine();
  const navigate = useNavigate();
  const [hoveredLevel, setHoveredLevel] = useState(null);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
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
        className="relative z-10 hidden sm:grid grid-cols-3 gap-4"
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
      <div className="relative z-10 max-w-4xl mx-auto py-10 px-2 sm:px-4 md:px-6">
        
        {/* Dynamic Continuous Axon SVG Connecting Track */}
        <div 
          className="absolute top-[28px] bottom-[28px] w-[3px] bg-secondary/30 z-0 left-1/2 -translate-x-1/2"
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
          {LEVELS.map((level) => {
            const unlocked = isLevelUnlocked(level.number);
            const progress = levelProgress.find(p => p.level_number === level.number) || {};
            const isCompleted = progress.is_completed;
            const diff = DIFFICULTY_MAP[level.difficulty];
            const isEven = level.number % 2 === 0;
            const percent = ((progress.words_studied || 0) / WORDS_PER_LEVEL) * 100;
            const isHovered = hoveredLevel === level.number;

            return (
              <div 
                key={level.number}
                className="grid grid-cols-[1fr_40px_1fr] items-center gap-2 md:gap-4 w-full relative z-10"
                onMouseEnter={() => setHoveredLevel(level.number)}
                onMouseLeave={() => setHoveredLevel(null)}
              >
                
                {/* Left Column Card (Even Layout) */}
                <div className="flex col-start-1 col-end-2 justify-end w-full">
                  {isEven && (
                    <LevelCard 
                      level={level}
                      unlocked={unlocked}
                      progress={progress}
                      isCompleted={isCompleted}
                      diff={diff}
                      percent={percent}
                      onSelect={(lvl) => navigate(`/study-level/${lvl.number}`)}
                    />
                  )}
                </div>

                {/* Center Timeline Dot / Synaptic Junction */}
                <div className="shrink-0 z-10 justify-self-center col-start-2 col-end-3 flex items-center justify-center w-8 h-8 relative">
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

                {/* Right Column Card (Odd Layout) */}
                <div className="flex col-start-3 col-end-4 w-full">
                  {!isEven && (
                    <LevelCard 
                      level={level}
                      unlocked={unlocked}
                      progress={progress}
                      isCompleted={isCompleted}
                      diff={diff}
                      percent={percent}
                      onSelect={(lvl) => navigate(`/study-level/${lvl.number}`)}
                    />
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>    </div>
  );
}