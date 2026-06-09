import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Brain, Volume2, Briefcase, Sparkles, CreditCard, Mail, Sun, Paintbrush, Bell, Bug, Info, LogOut, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import PageHeader from '@/components/layout/PageHeader';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const ACCENTS = {
  amber: { label: 'Amber (Default)', hsl: '38 92% 60%', dot: 'bg-amber-500' },
  indigo: { label: 'Indigo Purple', hsl: '250 95% 65%', dot: 'bg-indigo-500' },
  emerald: { label: 'Emerald Green', hsl: '150 80% 50%', dot: 'bg-emerald-500' },
  rose: { label: 'Crimson Rose', hsl: '350 90% 60%', dot: 'bg-rose-500' }
};

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { themeMode, setThemeMode } = useTheme();
  const { logout, user } = useAuth();
  const logoutTimerRef = useRef(null);
  const copyTimerRef = useRef(null);
  const lastBugReportTime = useRef(0); // Rate limiting for bug reports
  const BUG_REPORT_COOLDOWN_MS = 60000; // 1 minute cooldown

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Load state from localStorage or defaults
  const [dailyTarget, setDailyTarget] = useState(() => localStorage.getItem('lexora-daily-target') || '20');
  const [spacedRepetition, setSpacedRepetition] = useState(() => {
    const saved = localStorage.getItem('lexora-spaced-repetition');
    return saved !== null ? saved === 'true' : true;
  });
  const [voiceSpeed, setVoiceSpeed] = useState(() => localStorage.getItem('lexora-voice-speed') || '1.0');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('lexora-accent-color') || 'amber');
  const [copied, setCopied] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugText, setBugText] = useState('');
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  // Accent Color Theme dynamic injector
  useEffect(() => {
    const selected = ACCENTS[accentColor];
    if (selected) {
      document.documentElement.style.setProperty('--primary', selected.hsl);
      document.documentElement.style.setProperty('--ring', selected.hsl);
      localStorage.setItem('lexora-accent-color', accentColor);
    }
  }, [accentColor]);

  // Persist other settings
  const handleTargetChange = (val) => {
    setDailyTarget(val);
    localStorage.setItem('lexora-daily-target', val);
    toast({
      title: "Daily Goal Updated",
      description: `Target set to ${val} words per day.`,
    });
  };

  const handleSpacedRepetitionToggle = () => {
    const next = !spacedRepetition;
    setSpacedRepetition(next);
    localStorage.setItem('lexora-spaced-repetition', String(next));
    toast({
      title: "Scheduling Mode Changed",
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
      toast({
        title: "Audio Test Started",
        description: `Speed: ${voiceSpeed}x. Playing TTS audio sample.`,
      });
    } else {
      toast({
        title: "Speech Synthesis Unsupported",
        description: "Your browser does not support text-to-speech feedback.",
        variant: "destructive"
      });
    }
  };

  // Copy Email to clipboard
  const copyEmail = async () => {
    const emailToCopy = user?.email;
    if (!emailToCopy) {
      toast({ title: "No email available", description: "No email address found for your account." });
      return;
    }
    try {
      await navigator.clipboard.writeText(emailToCopy);
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: `${emailToCopy} email copied.`,
      });
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the email manually." });
    }
  };

  // Bug reporting submission
  const [submitting, setSubmitting] = useState(false);
  const submitBug = async (e) => {
    e.preventDefault();
    if (!bugText.trim() || submitting) return;
    
    // Rate limiting: 1 minute cooldown between submissions
    const now = Date.now();
    if (now - lastBugReportTime.current < BUG_REPORT_COOLDOWN_MS) {
      toast({
        title: "Please wait",
        description: "You can submit one report per minute.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      if (isFirebaseConfigured) {
        const app = getApp();
        const auth = getAuth(app);
        if (!auth.currentUser) {
          toast({
            title: "Authentication required",
            description: "Please sign in to submit a bug report.",
            variant: "destructive",
          });
          return;
        }
        const db = getFirestore(app);
        await addDoc(collection(db, 'bugReports'), {
          description: bugText.trim(),
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          userAgent: navigator.userAgent,
          url: window.location.href,
          createdAt: serverTimestamp(),
        });
      }
      lastBugReportTime.current = now; // Update last submission time
      toast({
        title: "Feedback Logged",
        description: "Thank you! Our engineering team will audit this report.",
      });
      setBugText('');
      setShowBugModal(false);
    } catch {
      toast({
        title: "Submission failed",
        description: "Could not submit report. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
              <img src={user.avatar} alt={`${user?.name || 'User'}'s avatar`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <span style={user?.avatar ? { display: 'none' } : {}} className="w-full h-full flex items-center justify-center">{user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}</span>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">{user?.name || 'User'}</h2>
          <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
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
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${spacedRepetition ? 'bg-foreground' : 'bg-neutral-800'}`}
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
                <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400"><Briefcase className="w-4 h-4" /></div>
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
                <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400"><CreditCard className="w-4 h-4" /></div>
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
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">{user?.email || 'No email'}</span>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500"><Sun className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Theme Style</p>
                    <p className="text-xs text-muted-foreground">Select dynamic system templates</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { id: 'classic', label: 'Classic (Default)', dot: 'bg-amber-500' },
                  { id: 'light', label: 'Gemini Light', dot: 'bg-blue-400' },
                  { id: 'dark', label: 'Gemini Dark', dot: 'bg-neutral-600' },
                  { id: 'system', label: 'System Theme', dot: 'bg-purple-500' },
                ].map((t) => (
                  <button 
                    key={t.id}
                    onClick={() => {
                      setThemeMode(t.id);
                      toast({
                        title: "Theme Mode Changed",
                        description: `${t.label} has been successfully applied.`,
                      });
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      themeMode === t.id 
                        ? 'border-foreground bg-secondary/40 text-foreground' 
                        : 'border-border/80 bg-secondary/10 hover:bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${t.dot} shrink-0`} />
                    <span className="truncate">{t.label}</span>
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
                <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400"><Info className="w-4 h-4" /></div>
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
            navigate('/');
          }}
          className="w-full mt-4 p-4 bg-secondary/20 hover:bg-red-500/5 border border-border/80 hover:border-red-500/20 text-muted-foreground hover:text-red-500 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Log out Account
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
                    disabled={submitting || !bugText.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
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
