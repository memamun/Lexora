import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Sparkles,
  Upload,
  CircleDot,
  Gem,
  Link2,
  Sun,
  CreditCard,
  Notebook,
  MessageSquare,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/lib/NavigationContext';
import { useTheme } from '@/lib/ThemeContext';

export default function ShortcutPanel({
  showShortcutPanel,
  setShowShortcutPanel,
  showThemeSubmenu,
  setShowThemeSubmenu,
  notifications,
  setNotifications,
  shortcutPanelRef
}) {
  const navigate = useNavigate();
  const { sidebarCollapsed } = useNavigation();
  const { themeMode, setThemeMode } = useTheme();

  return (
    <AnimatePresence>
      {showShortcutPanel && (
        <motion.div
          ref={shortcutPanelRef}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`fixed z-[99] backdrop-blur-xl bg-popover/95 border border-border/80 text-popover-foreground shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.65)] rounded-3xl p-3 flex flex-col gap-0.5 transition-all duration-300 w-[285px] ${
            sidebarCollapsed
              ? 'bottom-[96px] left-3'
              : 'bottom-[76px] left-4'
          }`}
        >
          {/* Notifications Alert section if any notifications exist */}
          {notifications.length > 0 && (
            <div className="mx-1 mb-2 p-2.5 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                  {notifications.length} Alerts
                </span>
                <button
                  onClick={() => {
                    setNotifications([]);
                    toast("Notifications Cleared", {
                      description: "The notification dot has been removed from settings.",
                    });
                  }}
                  className="text-[10px] text-primary hover:opacity-80 font-bold transition-opacity"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {notifications.map((notif, idx) => (
                  <p key={idx} className="text-[11px] text-foreground/80 truncate font-medium">
                    {notif}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Dummy Shortcut Settings Items */}
          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("Activity Log", { description: "Opening your comprehensive learning activity log..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <History className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>Activity</span>
          </button>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              navigate('/settings');
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <Sparkles className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>Personal Intelligence</span>
          </button>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("Import Synaptic Memory", { description: "Preparing memory import tools..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <Upload className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>Import memory to Lexora</span>
            <span className="bg-secondary text-[9px] text-secondary-foreground border border-border/40 font-bold px-1.5 py-0.5 rounded-md ml-auto shrink-0 uppercase tracking-wider">
              New
            </span>
          </button>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("Usage Limits", { description: "Opening Lexora API and intelligence engine usage quotas..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <CircleDot className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>Usage limits</span>
          </button>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("Lexora Gems", { description: "Opening your gem wallet and streak multipliers..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <Gem className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>Gems</span>
          </button>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("Public Links", { description: "Generating active vocabulary study cards list..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <Link2 className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>Your public links</span>
          </button>

          <div className="relative w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowThemeSubmenu(!showThemeSubmenu);
              }}
              className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group ${
                showThemeSubmenu ? 'bg-secondary/70 text-foreground' : ''
              }`}
            >
              <Sun className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
              <span>Theme</span>
              <span className="text-[11px] text-muted-foreground/60 ml-auto shrink-0 capitalize">
                {themeMode === 'system' ? 'System' : themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'Classic'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            </button>

            {/* Nested Theme Submenu (Gemini Style) */}
            <AnimatePresence>
              {showThemeSubmenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-[295px] bottom-0 w-[160px] bg-popover/95 border border-border/80 p-1.5 flex flex-col gap-0.5 shadow-2xl rounded-2xl z-[100] backdrop-blur-xl"
                >
                  {[
                    { id: 'system', label: 'System' },
                    { id: 'light', label: 'Light' },
                    { id: 'dark', label: 'Dark' },
                    { id: 'classic', label: 'Classic' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setThemeMode(t.id);
                        setShowThemeSubmenu(false);
                        setShowShortcutPanel(false);
                        toast.success(`${t.label} Theme Applied!`, {
                          description: "Interface style loaded successfully."
                        });
                      }}
                      className="flex items-center justify-between px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-all duration-150 w-full text-left"
                    >
                      <span>{t.label}</span>
                      {themeMode === t.id && (
                        <span className="text-primary font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("Subscriptions tier", { description: "Opening Lexora billing panel..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <CreditCard className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>View subscriptions</span>
          </button>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("NotebookLM", { description: "Redirecting to NotebookLM integration..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <Notebook className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>NotebookLM</span>
          </button>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("Send feedback", { description: "Opening feedback channel..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <MessageSquare className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>Send feedback</span>
          </button>

          <button
            onClick={() => {
              setShowShortcutPanel(false);
              toast("Help Center", { description: "Loading Lexora manual and guides..." });
            }}
            className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all duration-150 w-full text-left group"
          >
            <HelpCircle className="w-[18px] h-[18px] text-muted-foreground/70 group-hover:text-foreground shrink-0" />
            <span>Help</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 ml-auto shrink-0" />
          </button>

          {/* Separator line */}
          <div className="h-px bg-border/60 my-1 mx-2" />

          {/* Location Section */}
          <div className="px-3 py-2 flex flex-col gap-0.5 select-none">
            <div className="flex items-center gap-2 text-[12px] text-foreground/80 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
              <span>Bangladesh</span>
            </div>
            <p className="text-[10px] text-muted-foreground pl-3.5 font-medium leading-normal">
              Based on your places (Work)
            </p>
            <button
              onClick={() => {
                toast("Update location", { description: "Acquiring network location coordinates..." });
              }}
              className="text-[10px] text-primary hover:text-primary/80 font-bold transition-colors w-fit pl-3.5 mt-0.5"
            >
              Update location
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
