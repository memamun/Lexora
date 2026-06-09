import React from 'react';
import { Briefcase, Sparkles, CreditCard, Mail, Check, ChevronRight } from 'lucide-react';

export default function SettingsAccount({ user, copyEmail, copied }) {
  return (
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
              <p className="text-xs text-muted-foreground">Your current subscription tier</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">Free Tier</span>
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
  );
}
