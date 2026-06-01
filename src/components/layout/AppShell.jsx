import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Book, 
  Layers, 
  Target, 
  Swords, 
  Keyboard, 
  Zap, 
  Brain, 
  BarChart, 
  Settings, 
  LogOut, 
  X,
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
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import LexoraLogo from '@/components/ui/LexoraLogo';

const NAV_CATEGORIES = [
  {
    category: 'Core Hub',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/levels', label: 'Synaptic Roadmap', icon: BookOpen },
      { path: '/words', label: 'Word Dictionary', icon: Book },
    ]
  },
  {
    category: 'Cognitive Drills',
    items: [
      { path: '/flashcards', label: 'Smart Flashcards', icon: Layers },
      { path: '/mcq', label: 'MCQ Practice', icon: Target },
      { path: '/battle', label: 'Battle Mode', icon: Swords },
      { path: '/spelling', label: 'Spelling Master', icon: Keyboard },
      { path: '/matching', label: 'Matching Drill', icon: Zap },
    ]
  },
  {
    category: 'Intelligence Lab',
    items: [
      { path: '/confusion', label: 'Confusion Lab', icon: Brain },
      { path: '/analytics', label: 'Performance Stats', icon: BarChart },
    ]
  }
];

const isRouteActive = (currentPath, itemPath) => {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  if (itemPath === '/levels') {
    return currentPath === '/levels' || currentPath.startsWith('/study-level');
  }
  if (itemPath === '/words') {
    return currentPath === '/words' || currentPath.startsWith('/word/');
  }
  return currentPath === itemPath;
};

const INITIALS_FALLBACK = '?';

function getInitials(user) {
  if (!user) return INITIALS_FALLBACK;
  if (user.name && user.name !== 'User') {
    return user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  if (user.email) return user.email[0].toUpperCase();
  return INITIALS_FALLBACK;
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mobileOpen, closeMobile, sidebarCollapsed, toggleSidebar } = useNavigation();
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  const [showShortcutPanel, setShowShortcutPanel] = useState(false);
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false);
  const [notifications, setNotifications] = useState([
    'Double XP Boost is active!',
    'Synaptic challenges are waiting for review.'
  ]);
  const shortcutPanelRef = useRef(null);

  // Close shortcut panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (shortcutPanelRef.current && !shortcutPanelRef.current.contains(event.target)) {
        setShowShortcutPanel(false);
        setShowThemeSubmenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Maintain classic theme fonts injection
  useEffect(() => {
    const root = document.documentElement;
    const fontHeading = localStorage.getItem('lexora-font-heading') || 'dm-sans';
    const fontBody = localStorage.getItem('lexora-font-body') || 'inter';
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
  }, []);

  // Auto-close mobile nav on route change
  useEffect(() => {
    closeMobile();
    setShowShortcutPanel(false);
    setShowThemeSubmenu(false);
  }, [location.pathname, closeMobile]);

  return (
    <div className="min-h-screen bg-background flex">
      <aside 
        className={`hidden lg:flex flex-col border-r border-border bg-card/30 fixed inset-y-0 left-0 z-30 overflow-x-hidden transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        {/* Sidebar Header / Branding */}
        <div className={`border-b border-border flex transition-all duration-300 ${
          sidebarCollapsed ? 'items-center justify-center py-5 px-2 h-[72px]' : 'items-center justify-between p-4 px-5'
        }`}>
          {sidebarCollapsed ? (
            <div className="relative w-10 h-10 flex items-center justify-center group/header select-none">
              {/* Default Logo View (centered gem logo) */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out opacity-100 scale-100 group-hover/header:opacity-0 group-hover/header:scale-75 pointer-events-auto group-hover/header:pointer-events-none">
                <LexoraLogo className="w-6 h-8.5 filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.25)] shrink-0" animated={true} />
              </div>

              {/* Hover Toggle Button View (reveals collapsible icon on hover) */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out opacity-0 scale-75 group-hover/header:opacity-100 group-hover/header:scale-100 pointer-events-none group-hover/header:pointer-events-auto">
                <button 
                  onClick={toggleSidebar} 
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center group/toggle shrink-0"
                  title="Expand Sidebar"
                >
                  {/* sidebar-right-svgrepo-com (collapsed state, arrow pointing right to expand) */}
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-all duration-300">
                    <path d="M21.97 15V9C21.97 4 19.97 2 14.97 2H8.96997C3.96997 2 1.96997 4 1.96997 9V15C1.96997 20 3.96997 22 8.96997 22H14.97C19.97 22 21.97 20 21.97 15Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.97 2V22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path 
                      d="M7.96997 9.43994L10.53 11.9999L7.96997 14.5599" 
                      stroke="currentColor" 
                      strokeWidth="1.6" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="transition-transform duration-300 ease-out group-hover/toggle:translate-x-[1.5px]"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            // Expanded view (standard horizontal row)
            <>
              <Link to="/" className="flex items-center gap-3 overflow-hidden shrink-0">
                <LexoraLogo className="w-6.5 h-9 shrink-0" animated={true} />
                <div className="flex flex-col">
                  <span className="font-serif text-[17px] font-bold tracking-tight text-foreground leading-tight">Lexora</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">Synaptic Prep</span>
                </div>
              </Link>
              <button 
                onClick={toggleSidebar} 
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center group/toggle shrink-0"
                title="Collapse Sidebar"
              >
                {/* sidebar-left-svgrepo-com (expanded state, arrow pointing left to collapse) */}
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-all duration-300">
                  <path d="M21.97 15V9C21.97 4 19.97 2 14.97 2H8.96997C3.96997 2 1.96997 4 1.96997 9V15C1.96997 20 3.96997 22 8.96997 22H14.97C19.97 22 21.97 20 21.97 15Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.96997 2V22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path 
                    d="M14.97 9.43994L12.41 11.9999L14.97 14.5599" 
                    stroke="currentColor" 
                    strokeWidth="1.6" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="transition-transform duration-300 ease-out group-hover/toggle:-translate-x-[1.5px]"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Navigation Section */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden no-scrollbar transition-all duration-300 ${
          sidebarCollapsed ? 'p-2 space-y-4' : 'p-4 space-y-6'
        }`}>
          {NAV_CATEGORIES.map((category, catIndex) => (
            <div key={category.category} className="space-y-1.5">
              {sidebarCollapsed ? (
                catIndex > 0 && <hr className="border-border/60 my-3.5 mx-2" />
              ) : (
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-3 pb-1">
                  {category.category}
                </p>
              )}
              <div className="space-y-0.5">
                {category.items.map(item => {
                  const active = isRouteActive(location.pathname, item.path);
                  return (
                    <div key={item.path} className="relative group/nav">
                      <Link to={item.path}
                        className={`flex items-center rounded-xl text-sm font-medium transition-all duration-150 relative ${
                          sidebarCollapsed 
                            ? 'justify-center w-10 h-10 mx-auto' 
                            : 'gap-3 w-full px-3 py-2'
                        } ${
                          active 
                            ? 'text-primary font-bold' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <item.icon className={`shrink-0 transition-all duration-200 ${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                        {active && !sidebarCollapsed && (
                          <motion.div 
                            layoutId="nav-indicator" 
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" 
                          />
                        )}
                      </Link>

                      {/* Premium Custom Hover Tooltip in Collapsed Mode */}
                      {sidebarCollapsed && (
                        <div className="absolute left-[64px] top-1/2 -translate-y-1/2 bg-popover border border-border text-popover-foreground text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 scale-90 translate-x-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:scale-100 group-hover/nav:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        
        {sidebarCollapsed ? (
          // Collapsed profile footer (stacked Settings with blue dot above circular User Avatar)
          <div className="flex flex-col items-center py-6 px-2 gap-5 bg-transparent transition-all duration-300">
            {/* Settings button with blue notification dot */}
            <div className="relative group/settings">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShortcutPanel(!showShortcutPanel);
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all duration-200 shrink-0 active:scale-95 relative"
                aria-label="Settings"
              >
                <Settings className="w-6 h-6 transition-transform duration-200 group-hover/settings:rotate-45" />
                {notifications.length > 0 && (
                  <span className="absolute top-[7px] right-[7px] w-2.5 h-2.5 rounded-full bg-blue-500 border border-background shadow-[0_0_8px_rgba(59,130,246,0.85)]" />
                )}
              </button>
              <div className="absolute left-[54px] top-1/2 -translate-y-1/2 bg-popover border border-border text-popover-foreground text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 scale-90 translate-x-2 pointer-events-none group-hover/settings:opacity-100 group-hover/settings:scale-100 group-hover/settings:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap">
                Settings
              </div>
            </div>

            {/* Perfect Circular User Avatar */}
            <div className="relative group/avatar">
              <Link
                to="/settings"
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 active:scale-95 transition-all duration-200 hover:scale-105"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={`${user?.name || 'User'}'s avatar`} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-secondary border border-border">
                    <span className="text-[11px] font-bold tracking-tight text-muted-foreground">{getInitials(user)}</span>
                  </div>
                )}
              </Link>
              <div className="absolute left-[54px] top-1/2 -translate-y-1/2 bg-popover border border-border text-popover-foreground text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 scale-90 translate-x-2 pointer-events-none group-hover/avatar:opacity-100 group-hover/avatar:scale-100 group-hover/avatar:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap">
                {user?.name || 'User'}'s Profile
              </div>
            </div>
          </div>
        ) : (
          // Expanded profile footer (standard side-by-side row)
          <div className="border-t border-border flex items-center justify-between p-4 gap-2 px-5 bg-card/10 transition-all duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/settings"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary border border-border overflow-hidden shrink-0 active:scale-95"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={`${user?.name || 'User'}'s avatar`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold tracking-tight text-muted-foreground">{getInitials(user)}</span>
                )}
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user?.name || 'User'}</p>
                <p className="text-[9px] text-muted-foreground truncate">{user?.email || ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShortcutPanel(!showShortcutPanel);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 transition-all shrink-0 active:scale-95 relative"
                aria-label="Settings"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
              <button
                onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary hover:bg-destructive/15 text-muted-foreground hover:text-destructive border border-border/80 transition-all shrink-0 active:scale-95"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Shortcut Settings Panel (Gemini Style Popover Overlay) */}
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

      {/* Slide-out Left Navigation Drawer (Mobile Viewport) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-[60]"
            />

            {/* Navigation Panel */}
            <motion.div
              initial={{ x: "-100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              drag="x"
              dragConstraints={{ right: 0, left: -100 }}
              dragElastic={{ right: 0, left: 0.1 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -80 || velocity.x < -400) {
                  closeMobile();
                }
              }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 h-full z-[70] bg-background border-r border-border/50 shadow-2xl flex flex-col"
            >
              {/* Premium Lexora Branding Header */}
              <div className="p-5 pb-4 flex items-center justify-between border-b border-border/40">
                <div className="flex items-center gap-3">
                  <LexoraLogo className="w-6.5 h-9 shrink-0" animated={false} />
                  <h1 className="font-serif text-lg font-bold text-foreground tracking-tight">Lexora</h1>
                </div>
                <button 
                  onClick={closeMobile}
                  className="w-8 h-8 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground border border-border/80 transition-all shrink-0 active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Navigation List with Groupings */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                {NAV_CATEGORIES.map(category => (
                  <div key={category.category} className="space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-3 pb-1">
                      {category.category}
                    </p>
                    <div className="space-y-0.5">
                      {category.items.map(item => {
                        const active = isRouteActive(location.pathname, item.path);
                        return (
                          <Link key={item.path} to={item.path} onClick={() => closeMobile()}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                              active 
                                ? 'bg-secondary/80 text-foreground font-bold' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Mobile Drawer Profile Footer */}
              <div className="p-4 border-t border-border/40 bg-card/10 flex items-center justify-between gap-2 mt-auto">
                <div className="flex items-center gap-3 min-w-0">
                  <button 
                    onClick={() => { closeMobile(); navigate('/settings'); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary border border-border overflow-hidden shrink-0 active:scale-95"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={`${user?.name || 'User'}'s avatar`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold tracking-tight text-muted-foreground">{getInitials(user)}</span>
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{user?.name || 'User'}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{user?.email || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { closeMobile(); navigate('/settings'); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 transition-all shrink-0 active:scale-95"
                    aria-label="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => { closeMobile(); await logout(); navigate('/login', { replace: true }); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary hover:bg-destructive/15 text-muted-foreground hover:text-destructive border border-border/80 transition-all shrink-0 active:scale-95"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area - Transitions Margin smoothly alongside Sidebar */}
      <main className={`flex-1 overflow-x-hidden pb-24 lg:pb-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'
      }`}>
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Floating Glass Dock) */}
      <nav className="lg:hidden fixed bottom-4 inset-x-4 max-w-lg md:mx-auto bg-card/65 backdrop-blur-xl border border-border/55 rounded-2xl z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300">
        <div className="flex items-center justify-around px-2 h-16">
          {[
            { path: '/', label: 'Home', icon: LayoutDashboard },
            { path: '/levels', label: 'Roadmap', icon: BookOpen },
            { path: '/flashcards', label: 'Cards', icon: Brain },
            { path: '/words', label: 'Dictionary', icon: Book },
            { path: '/analytics', label: 'Stats', icon: BarChart },
          ].map((item) => {
            const active = isRouteActive(location.pathname, item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 group relative"
              >
                
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                  active 
                    ? 'text-primary scale-105 drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]' 
                    : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                }`}>
                  <Icon className="w-5 h-5 transition-transform duration-200 group-active:scale-90" />
                </div>
                <span className={`text-[9px] font-bold transition-colors tracking-wide ${
                  active ? 'text-primary font-extrabold' : 'text-muted-foreground group-hover:text-foreground'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}