import React, { useState } from 'react';
import { User, Brain, Volume2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsEngine({
  dailyTarget,
  handleTargetChange,
  spacedRepetition,
  handleSpacedRepetitionToggle,
  voiceSpeed,
  handleVoiceSpeedChange
}) {
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  return (
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
  );
}
