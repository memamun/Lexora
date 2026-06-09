import React from 'react';
import { Sun, Paintbrush } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function SettingsVisual({
  ACCENTS,
  themeMode,
  setThemeMode,
  accentColor,
  setAccentColor
}) {
  const { toast } = useToast();

  return (
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
  );
}
