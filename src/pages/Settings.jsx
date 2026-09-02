import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import PageHeader from '@/components/layout/PageHeader';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Import sub-components
import SettingsProfile from '@/components/settings/SettingsProfile';
import SettingsEngine from '@/components/settings/SettingsEngine';
import SettingsAccount from '@/components/settings/SettingsAccount';
import SettingsVisual from '@/components/settings/SettingsVisual';
import SettingsSupport from '@/components/settings/SettingsSupport';
import BugReportModal from '@/components/settings/BugReportModal';

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
    const lastReportTimeStr = localStorage.getItem('lexora-last-bug-report');
    const lastReportTime = lastReportTimeStr ? parseInt(lastReportTimeStr, 10) : 0;

    if (now - lastReportTime < BUG_REPORT_COOLDOWN_MS) {
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
        const currentUrl = new URL(window.location.href);
        const safeUrl = currentUrl.origin + currentUrl.pathname;

        const batch = writeBatch(db);
        const reportRef = doc(collection(db, 'bugReports'));
        batch.set(reportRef, {
          description: bugText.trim(),
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          userAgent: navigator.userAgent,
          url: safeUrl,
          createdAt: serverTimestamp(),
        });

        const statsRef = doc(db, 'users', auth.currentUser.uid, 'private', 'bugReportStats');
        batch.set(statsRef, {
          lastReportTime: serverTimestamp()
        });

        await batch.commit();
      }

      localStorage.setItem('lexora-last-bug-report', now.toString()); // Update last submission time
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
      <SettingsProfile user={user} />

      {/* Settings Card Container */}
      <div className="space-y-5">
        
        {/* Section: Lexora Engine Options */}
        <SettingsEngine
          dailyTarget={dailyTarget}
          handleTargetChange={handleTargetChange}
          spacedRepetition={spacedRepetition}
          handleSpacedRepetitionToggle={handleSpacedRepetitionToggle}
          voiceSpeed={voiceSpeed}
          handleVoiceSpeedChange={handleVoiceSpeedChange}
        />

        {/* Section: Account & Status */}
        <SettingsAccount
          user={user}
          copyEmail={copyEmail}
          copied={copied}
        />

        {/* Section: Appearance & Accents */}
        <SettingsVisual
          ACCENTS={ACCENTS}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
        />

        {/* Section: Support & Preferences */}
        <SettingsSupport
          testSpeech={testSpeech}
          setShowBugModal={setShowBugModal}
        />

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
      <BugReportModal
        showBugModal={showBugModal}
        setShowBugModal={setShowBugModal}
        bugText={bugText}
        setBugText={setBugText}
        submitting={submitting}
        submitBug={submitBug}
      />
    </div>
  );
}
