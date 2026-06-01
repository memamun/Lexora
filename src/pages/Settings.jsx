import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Brain, Volume2, Briefcase, Sparkles, CreditCard, Mail, Sun, Paintbrush, Bell, Bug, Info, LogOut, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/lib/AuthContext';

function getInitials(user) {
  if (!user) return '?';
  if (user.name && user.name !== 'User') {
    return user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  if (user.email) return user.email[0].toUpperCase();
  return '?';
}

const ACCENTS = {
  amber: { label: 'Amber (Default)', hsl: '38 92% 60%', dot: 'bg-amber-500' },
  indigo: { label: 'Indigo Purple', hsl: '250 95% 65%', dot: 'bg-indigo-500' },
  emerald: { label: 'Emerald Green', hsl: '150 80% 50%', dot: 'bg-emerald-500' },
  rose: { label: 'Crimson Rose', hsl: '350 90% 60%', dot: 'bg-rose-500' }
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Load state from localStorage or defaults
  const [dailyTarget, setDailyTarget] = useState(() => localStorage.getItem('lexora-daily-target') || '20');
  const [spacedRepetition, setSpacedRepetition] = useState(() => {
    const saved = localStorage.getItem('lexora-spaced-repetition');
    return saved !== null ? saved === 'true' : true;
  });
  const [voiceSpeed, setVoiceSpeed] = useState(() => localStorage.getItem('lexora-voice-speed') || '1.0');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('lexora-accent-color') || 'amber');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('lexora-theme-mode') || 'classic');
  const [copied, setCopied] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugText, setBugText] = useState('');
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [fontHeading, setFontHeading] = useState(() => localStorage.getItem('lexora-font-heading') || 'dm-sans');
  const [fontBody, setFontBody] = useState(() => localStorage.getItem('lexora-font-body') || 'inter');

  const getHeadingFontFamily = (id = fontHeading) => {
    switch (id) {
      case 'dm-sans': return "'DM Sans', sans-serif";
      case 'inter': return "'Inter', sans-serif";
      case 'times-new-roman': return "'Times New Roman', Times, serif";
      case 'jetbrains-mono': return "'JetBrains Mono', monospace";
      default: return "'DM Sans', sans-serif";
    }
  };

  const getBodyFontFamily = (id = fontBody) => {
    switch (id) {
      case 'inter': return "'Inter', sans-serif";
      case 'hind-siliguri': return "'Hind Siliguri', sans-serif";
      case 'times-new-roman': return "'Times New Roman', Times, serif";
      case 'jetbrains-mono': return "'JetBrains Mono', monospace";
      default: return "'Inter', sans-serif";
    }
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('lexora-theme-mode', mode);
  };

  // Listen to prefers-color-scheme in system theme mode
  useEffect(() => {
    if (themeMode === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        // Force refresh variables
        setThemeMode('system');
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Unified Theme, Accent, and Typography Injector
  useEffect(() => {
    const root = document.documentElement;

    // Apply Saved Typography Preferences
    const FONT_MAP = {
      'inter': "'Inter', 'Hind Siliguri', sans-serif",
      'dm-sans': "'DM Sans', sans-serif",
      'times-new-roman': "'Times New Roman', Times, serif",
      'jetbrains-mono': "'JetBrains Mono', monospace",
      'hind-siliguri': "'Hind Siliguri', sans-serif"
    };

    const headingVal = FONT_MAP[fontHeading] || FONT_MAP['dm-sans'];
    const bodyVal = FONT_MAP[fontBody] || FONT_MAP['inter'];

    root.style.setProperty('--font-serif', headingVal);
    root.style.setProperty('--font-sans', bodyVal);

    const setStitchLight = () => {
      root.style.setProperty('--stitch-on-surface', '230 10% 11%');
      root.style.setProperty('--stitch-on-surface-variant', '230 8% 29%');
      root.style.setProperty('--stitch-outline', '230 8% 49%');
      root.style.setProperty('--stitch-outline-variant', '232 10% 79%');
      root.style.setProperty('--stitch-surface-gray', '207 8% 95%');
      root.style.setProperty('--stitch-surface-blue', '214 60% 96%');
      root.style.setProperty('--stitch-surface-container', '246 20% 93%');
      root.style.setProperty('--stitch-surface-container-low', '246 40% 97%');
      root.style.setProperty('--stitch-surface-container-high', '246 20% 91%');
      root.style.setProperty('--stitch-surface-container-highest', '232 10% 85%');
      root.style.setProperty('--stitch-primary-container', '217 100% 43%');
      root.style.setProperty('--stitch-on-primary-container', '225 100% 91%');
      root.style.setProperty('--stitch-secondary-container', '148 92% 78%');
      root.style.setProperty('--stitch-on-secondary-container', '154 100% 23%');
      root.style.setProperty('--stitch-error', '0 86% 42%');
      root.style.setProperty('--stitch-error-red', '0 60% 55%');
      root.style.setProperty('--stitch-error-container', '4 100% 92%');
      root.style.setProperty('--stitch-on-error-container', '0 86% 30%');
      root.style.setProperty('--stitch-tertiary', '18 100% 25%');
      root.style.setProperty('--stitch-tertiary-container', '18 100% 33%');
      root.style.setProperty('--stitch-tertiary-fixed-dim', '18 100% 80%');
      root.style.setProperty('--stitch-inverse-surface', '230 10% 21%');
      root.style.setProperty('--stitch-inverse-on-surface', '240 100% 97%');
      root.style.setProperty('--stitch-inverse-primary', '225 100% 85%');
    };

    const setStitchDark = () => {
      root.style.setProperty('--stitch-on-surface', '240 8% 94%');
      root.style.setProperty('--stitch-on-surface-variant', '232 8% 77%');
      root.style.setProperty('--stitch-outline', '232 8% 40%');
      root.style.setProperty('--stitch-outline-variant', '232 6% 28%');
      root.style.setProperty('--stitch-surface-gray', '230 12% 13%');
      root.style.setProperty('--stitch-surface-blue', '222 30% 14%');
      root.style.setProperty('--stitch-surface-container', '232 15% 15%');
      root.style.setProperty('--stitch-surface-container-low', '230 12% 12%');
      root.style.setProperty('--stitch-surface-container-high', '235 15% 19%');
      root.style.setProperty('--stitch-surface-container-highest', '235 20% 25%');
      root.style.setProperty('--stitch-primary-container', '217 100% 43%');
      root.style.setProperty('--stitch-on-primary-container', '225 100% 91%');
      root.style.setProperty('--stitch-secondary-container', '148 50% 25%');
      root.style.setProperty('--stitch-on-secondary-container', '148 92% 78%');
      root.style.setProperty('--stitch-error', '0 86% 60%');
      root.style.setProperty('--stitch-error-red', '0 70% 65%');
      root.style.setProperty('--stitch-error-container', '0 30% 18%');
      root.style.setProperty('--stitch-on-error-container', '0 86% 90%');
      root.style.setProperty('--stitch-tertiary', '18 100% 70%');
      root.style.setProperty('--stitch-tertiary-container', '18 80% 30%');
      root.style.setProperty('--stitch-tertiary-fixed-dim', '18 100% 80%');
      root.style.setProperty('--stitch-inverse-surface', '240 8% 90%');
      root.style.setProperty('--stitch-inverse-on-surface', '230 10% 15%');
      root.style.setProperty('--stitch-inverse-primary', '217 100% 43%');
    };

    if (themeMode === 'classic') {
      const ACCENTS = {
        amber: '38 92% 60%',
        indigo: '250 95% 65%',
        emerald: '150 80% 50%',
        rose: '350 90% 60%'
      };
      root.style.setProperty('--background', '222 47% 6%');
      root.style.setProperty('--foreground', '40 20% 92%');
      root.style.setProperty('--card', '222 40% 9%');
      root.style.setProperty('--card-foreground', '40 20% 92%');
      root.style.setProperty('--popover', '222 40% 9%');
      root.style.setProperty('--popover-foreground', '40 20% 92%');
      root.style.setProperty('--border', '222 25% 15%');
      root.style.setProperty('--input', '222 25% 15%');
      root.style.setProperty('--secondary', '222 30% 14%');
      root.style.setProperty('--secondary-foreground', '40 15% 75%');
      root.style.setProperty('--muted', '222 25% 12%');
      root.style.setProperty('--muted-foreground', '220 15% 50%');
      root.style.setProperty('--accent', '185 40% 45%');
      root.style.setProperty('--accent-foreground', '40 20% 95%');

      const primaryColor = ACCENTS[accentColor] || ACCENTS.amber;
      root.style.setProperty('--primary', primaryColor);
      root.style.setProperty('--ring', primaryColor);
      localStorage.setItem('lexora-accent-color', accentColor);
      setStitchDark();
    } else {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const useDark = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);

      if (!useDark) {
        // Gemini Light Theme — clean, airy, Google-inspired
        root.style.setProperty('--background', '210 17% 98%');
        root.style.setProperty('--foreground', '220 15% 15%');
        root.style.setProperty('--card', '0 0% 100%');
        root.style.setProperty('--card-foreground', '220 15% 15%');
        root.style.setProperty('--popover', '0 0% 100%');
        root.style.setProperty('--popover-foreground', '220 15% 15%');
        root.style.setProperty('--border', '220 12% 87%');
        root.style.setProperty('--input', '220 12% 87%');
        root.style.setProperty('--secondary', '217 60% 95%');
        root.style.setProperty('--secondary-foreground', '217 89% 43%');
        root.style.setProperty('--muted', '210 14% 94%');
        root.style.setProperty('--muted-foreground', '215 12% 42%');
        root.style.setProperty('--accent', '217 60% 95%');
        root.style.setProperty('--accent-foreground', '217 89% 43%');
        root.style.setProperty('--primary', '217 89% 43%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--ring', '217 89% 43%');
        root.style.setProperty('--destructive', '0 72% 51%');
        root.style.setProperty('--destructive-foreground', '0 0% 100%');
        setStitchLight();
      } else {
        // Gemini Dark Theme — deep, immersive, high-contrast
        root.style.setProperty('--background', '240 6% 8%');
        root.style.setProperty('--foreground', '220 10% 90%');
        root.style.setProperty('--card', '240 4% 12%');
        root.style.setProperty('--card-foreground', '220 10% 90%');
        root.style.setProperty('--popover', '240 4% 15%');
        root.style.setProperty('--popover-foreground', '220 10% 90%');
        root.style.setProperty('--border', '240 4% 22%');
        root.style.setProperty('--input', '240 4% 22%');
        root.style.setProperty('--secondary', '240 4% 16%');
        root.style.setProperty('--secondary-foreground', '220 10% 85%');
        root.style.setProperty('--muted', '240 4% 11%');
        root.style.setProperty('--muted-foreground', '220 6% 55%');
        root.style.setProperty('--accent', '218 55% 22%');
        root.style.setProperty('--accent-foreground', '218 80% 80%');
        root.style.setProperty('--primary', '218 80% 75%');
        root.style.setProperty('--primary-foreground', '240 6% 8%');
        root.style.setProperty('--ring', '218 80% 75%');
        root.style.setProperty('--destructive', '0 62% 55%');
        root.style.setProperty('--destructive-foreground', '220 10% 90%');
        setStitchDark();
      }
    }
  }, [themeMode, accentColor, fontHeading, fontBody]);

  // Persist other settings
  const handleTargetChange = (val) => {
    setDailyTarget(val);
    localStorage.setItem('lexora-daily-target', val);
    toast("Daily Goal Updated", {
      description: `Target set to ${val} words per day.`,
    });
  };

  const handleSpacedRepetitionToggle = () => {
    const next = !spacedRepetition;
    setSpacedRepetition(next);
    localStorage.setItem('lexora-spaced-repetition', String(next));
    toast("Scheduling Mode Changed", {
      description: next ? "Spaced repetition scheduler active." : "Linear sequence scheduler active.",
    });
  };

  const handleVoiceSpeedChange = (val) => {
    setVoiceSpeed(val);
    localStorage.setItem('lexora-voice-speed', val);
  };

  // Sound Synth Test
  const testSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = "Welcome back to Lexora. Let's master vocabulary together!";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = parseFloat(voiceSpeed);
      
      // Select appropriate voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Prefer standard English voice
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
      
      window.speechSynthesis.speak(utterance);
      toast("Audio Test Started", {
        description: `Speed: ${voiceSpeed}x. Playing TTS audio sample.`,
      });
    } else {
      toast.error("Speech Synthesis Unsupported", {
        description: "Your browser does not support text-to-speech feedback.",
      });
    }
  };

  // Copy Email to clipboard
  const copyEmail = () => {
    const email = user?.email || '';
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast("Copied to Clipboard", {
      description: `${email} email copied.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Bug reporting submission
  const submitBug = (e) => {
    e.preventDefault();
    if (!bugText.trim()) return;
    toast("Feedback Logged", {
      description: "Thank you! Our engineering team will audit this report.",
    });
    setBugText('');
    setShowBugModal(false);
  };

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto">
      {/* Top Navigation Row */}
      <PageHeader 
        title="Settings" 
        subtitle="Tailor your Lexora cognitive learning experience" 
        backTo="/" 
      />

      {/* Dynamic Profile Header */}
      <div className="flex flex-col items-center justify-center py-6 gap-3">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-3xl shadow-inner transition-transform group-hover:scale-105 duration-200 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(user)
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-secondary border border-border text-foreground flex items-center justify-center shadow cursor-pointer hover:scale-110 active:scale-90 transition-all">
            <span className="text-[10px] font-bold">✎</span>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">{user?.name || 'User'}</h2>
          <p className="text-xs text-muted-foreground">
            {user?.provider === 'google' ? 'Signed in with Google' : user?.provider === 'password' ? 'Signed in with Email' : 'Lexora Member'}
          </p>
        </div>
      </div>

      {/* Settings Card Container */}
      <div className="space-y-5">
        
        {/* Section: Lexora Engine Options */}
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground pl-3 mb-1">Lexora Engine</h3>
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
            
            {/* Daily Target */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><User className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Daily Study Target</p>
                  <p className="text-xs text-muted-foreground">Adjust words encountered per session</p>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/80 border border-border/80 text-foreground text-xs font-semibold rounded-full hover:bg-secondary active:scale-95 transition-all duration-150"
                >
                  <span>{dailyTarget} words</span>
                  <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${targetDropdownOpen ? 'rotate-90 text-foreground' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {targetDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setTargetDropdownOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1.5 w-32 bg-card border border-border rounded-2xl shadow-xl py-1 z-20 overflow-hidden"
                      >
                        {['10', '20', '30', '50'].map(val => (
                          <button
                            key={val}
                            onClick={() => {
                              handleTargetChange(val);
                              setTargetDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${
                              dailyTarget === val 
                                ? 'bg-secondary text-foreground font-semibold' 
                                : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                            }`}
                          >
                            {val} words
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Spaced Repetition Toggle */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Brain className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Spaced Repetition Scheduler</p>
                  <p className="text-xs text-muted-foreground">Enable scheduling memory retrieval curves</p>
                </div>
              </div>
              <button 
                onClick={handleSpacedRepetitionToggle}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${spacedRepetition ? 'bg-foreground' : 'bg-muted border border-border'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-background transition-transform duration-200 ${spacedRepetition ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Voice Speed Toggle */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Volume2 className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Acoustic Audio Speed</p>
                  <p className="text-xs text-muted-foreground">Toggle rate of word audio readouts</p>
                </div>
              </div>
              <div className="flex gap-1">
                {['0.8', '1.0', '1.2'].map((spd) => (
                  <button 
                    key={spd}
                    onClick={() => handleVoiceSpeedChange(spd)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                      voiceSpeed === spd 
                        ? 'bg-foreground border-foreground text-background' 
                        : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Section: Account & Status */}
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground pl-3 mb-1">Account & Status</h3>
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
            
            {/* Workspace */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-muted-foreground"><Briefcase className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Workspace Scope</p>
                  <p className="text-xs text-muted-foreground">Current active repository context</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">Personal</span>
            </div>

            {/* Upgrade Plan */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500 animate-pulse"><Sparkles className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Plan Status</p>
                  <p className="text-xs text-muted-foreground">Your premium privileges active tier</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">Pro Premium</span>
            </div>

            {/* Subscription */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-muted-foreground"><CreditCard className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Billing Details</p>
                  <p className="text-xs text-muted-foreground">Review payment details or receipts</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">Manage</span>
            </div>

            {/* Email Address */}
            <div 
              onClick={copyEmail}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Mail className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Account Email</p>
                  <p className="text-xs text-muted-foreground">Click to copy your email address</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">{user?.email || ''}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
              </div>
            </div>

          </div>
        </div>

        {/* Section: Appearance & Accents */}
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground pl-3 mb-1">Visual Settings</h3>
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
            
            {/* Theme Selector */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500"><Sun className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Theme Style</p>
                  <p className="text-xs text-muted-foreground">Choose your workspace ambiance</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { id: 'system', label: 'System Adaptive' },
                  { id: 'light', label: 'Gemini Light' },
                  { id: 'dark', label: 'Gemini Dark' },
                  { id: 'classic', label: 'Lexora Classic' }
                ].map((t) => (
                  <button 
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      themeMode === t.id 
                        ? 'border-foreground bg-secondary/40 text-foreground' 
                        : 'border-border/80 bg-secondary/10 hover:bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    <span>{t.label}</span>
                    {themeMode === t.id && <span className="text-[10px] text-primary">●</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Theme Injector */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><Paintbrush className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Global Theme Accent</p>
                    <p className="text-xs text-muted-foreground">Instantly morph primary color variables</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                {Object.entries(ACCENTS).map(([key, config]) => (
                  <button 
                    key={key}
                    onClick={() => setAccentColor(key)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                      accentColor === key 
                        ? 'border-foreground bg-secondary/40 text-foreground' 
                        : 'border-border/80 bg-secondary/10 hover:bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${config.dot} shrink-0`} />
                    <span className="truncate">{config.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Section: Typography & Fonts */}
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground pl-3 mb-1">Typography & Fonts</h3>
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden p-4 space-y-4 shadow-sm">
            
            {/* Heading Font Option */}
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Heading Font Style</p>
                <p className="text-xs text-muted-foreground">Select the typeface for headers, titles, and details</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { id: 'dm-sans', label: 'DM Sans', subtitle: 'Modern Sans' },
                  { id: 'inter', label: 'Inter', subtitle: 'Clean Neutral' },
                  { id: 'times-new-roman', label: 'Times New Roman', subtitle: 'Classic Serif' },
                  { id: 'jetbrains-mono', label: 'JetBrains Mono', subtitle: 'Monospace Code' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFontHeading(f.id);
                      localStorage.setItem('lexora-font-heading', f.id);
                      toast.success(`Heading Font set to ${f.label}`);
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-xl border transition-all ${
                      fontHeading === f.id
                        ? 'border-foreground bg-secondary/40 text-foreground'
                        : 'border-border/80 bg-secondary/10 hover:bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs font-bold" style={{ fontFamily: getHeadingFontFamily(f.id) }}>
                      {f.label}
                    </span>
                    <span className="text-[9px] opacity-60 font-sans">{f.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Body Font Option */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <div>
                <p className="text-sm font-semibold text-foreground">Body & Running Text</p>
                <p className="text-xs text-muted-foreground">Choose the readability style for cards, lists, and definitions</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { id: 'inter', label: 'Inter', subtitle: 'Clean Sans' },
                  { id: 'hind-siliguri', label: 'Hind Siliguri', subtitle: 'Bengali & Latin Neutral' },
                  { id: 'times-new-roman', label: 'Times New Roman', subtitle: 'Classic Serif' },
                  { id: 'jetbrains-mono', label: 'JetBrains Mono', subtitle: 'Technical Mono' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFontBody(f.id);
                      localStorage.setItem('lexora-font-body', f.id);
                      toast.success(`Body Font set to ${f.label}`);
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-xl border transition-all ${
                      fontBody === f.id
                        ? 'border-foreground bg-secondary/40 text-foreground'
                        : 'border-border/80 bg-secondary/10 hover:bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs font-semibold" style={{ fontFamily: getBodyFontFamily(f.id) }}>
                      {f.label}
                    </span>
                    <span className="text-[9px] opacity-60 font-sans">{f.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Typographic Live Pairing Sandbox */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Live Pairing Sandbox</span>
              <div className="p-3 bg-secondary/30 border border-border/60 rounded-xl flex flex-col gap-1">
                <h4 className="text-sm font-bold text-foreground" style={{ fontFamily: getHeadingFontFamily() }}>
                  Cognitive Linguistics Paradigm
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: getBodyFontFamily() }}>
                  Synaptic retrieval curves optimize cognitive retention. Lexora helps you master vocabulary with science. বাংলা হরফ ও ল্যাটিন অক্ষর সুন্দরভাবে মানানসই।
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Section: Support & Preferences */}
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground pl-3 mb-1">Preferences & Support</h3>
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
            
            {/* Audio Synthesis Test */}
            <div 
              onClick={testSpeech}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500"><Volume2 className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Speech Audio Test</p>
                  <p className="text-xs text-muted-foreground">Verify standard SpeechSynthesis readout rate</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </div>

            {/* Notifications */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><Bell className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Configure study streak review reminders</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-semibold font-mono">Enabled</span>
            </div>

            {/* Bug Modal Trigger */}
            <div 
              onClick={() => setShowBugModal(true)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive"><Bug className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Report a System Bug</p>
                  <p className="text-xs text-muted-foreground">Log interface errors with developers</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </div>

            {/* About App */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-muted-foreground"><Info className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">About Lexora</p>
                  <p className="text-xs text-muted-foreground">Software versions and licensing</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">v1.4.2</span>
            </div>

          </div>
        </div>

        {/* Log Out Actions */}
        <button 
          onClick={async () => {
            await logout();
            toast("Session Ending", {
              description: "You have signed out of the current learning block.",
            });
            navigate('/login', { replace: true });
          }}
          className="w-full mt-4 p-4 bg-secondary/20 hover:bg-red-500/5 border border-border/80 hover:border-red-500/20 text-muted-foreground hover:text-red-500 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>

      </div>

      {/* Bug Report Backdrop Modal */}
      <AnimatePresence>
        {showBugModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBugModal(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 bottom-10 sm:inset-auto sm:top-[20%] sm:left-1/2 sm:-translate-x-1/2 w-full max-w-md bg-card border border-border rounded-2xl p-6 z-[60] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                  <Bug className="w-5 h-5 text-destructive" />
                  Report System Bug
                </h3>
                <button 
                  onClick={() => setShowBugModal(false)}
                  className="w-7 h-7 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-xs font-bold text-muted-foreground"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={submitBug} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Issue Description</label>
                  <textarea 
                    value={bugText}
                    onChange={(e) => setBugText(e.target.value)}
                    rows={4}
                    placeholder="Describe what occurred, layout gaps, or error behaviors you encountered..."
                    className="w-full text-sm bg-secondary/40 border border-border/80 text-foreground rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/60 resize-none"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowBugModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-all border border-border"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
