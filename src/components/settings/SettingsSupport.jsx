import React from 'react';
import { Volume2, Bell, Bug, Info, ChevronRight } from 'lucide-react';

export default function SettingsSupport({ testSpeech, setShowBugModal }) {
  return (
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
  );
}
