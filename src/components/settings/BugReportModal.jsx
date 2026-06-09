import React from 'react';
import { Bug } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BugReportModal({
  showBugModal,
  setShowBugModal,
  bugText,
  setBugText,
  submitting,
  submitBug
}) {
  return (
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
  );
}
