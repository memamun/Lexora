import React, { useEffect } from 'react';
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
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/lib/NavigationContext';

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

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mobileOpen, closeMobile } = useNavigation();

  // Auto-close mobile nav on route change
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card/30 fixed inset-y-0 left-0 z-30">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <span className="text-primary font-serif text-base font-bold">L</span>
            </div>
            <div>
              <h1 className="font-serif text-base font-semibold text-foreground tracking-tight">Lexora</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">BB Exam Prep</p>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {NAV_CATEGORIES.map(category => (
            <div key={category.category} className="space-y-1.5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-3 pb-1">
                {category.category}
              </p>
              <div className="space-y-0.5">
                {category.items.map(item => {
                  const active = isRouteActive(location.pathname, item.path);
                  return (
                    <Link key={item.path} to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                        active 
                          ? 'bg-primary/10 text-primary font-bold' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {active && (
                        <motion.div 
                          layoutId="nav-indicator" 
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" 
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        {/* Desktop Profile & Settings Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-2 bg-card/10">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shrink-0 active:scale-95"
            >
              <span className="text-[11px] font-bold tracking-tight">JD</span>
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">John Doe</p>
              <p className="text-[9px] text-muted-foreground truncate">mamun@lexora.app</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 transition-all shrink-0 active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

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
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                    <span className="text-primary font-serif text-sm font-bold">L</span>
                  </div>
                  <h1 className="font-serif text-base font-semibold text-foreground tracking-tight">Lexora</h1>
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

              {/* Mobile Drawer Settings Footer */}
              <div className="p-4 border-t border-border/40 bg-card/10 flex items-center justify-between gap-2 mt-auto">
                <div className="flex items-center gap-3 min-w-0">
                  <button 
                    onClick={() => { closeMobile(); navigate('/settings'); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary border border-border text-muted-foreground shrink-0 active:scale-95"
                  >
                    <span className="text-[10px] font-bold tracking-tight">JD</span>
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">John Doe</p>
                    <p className="text-[9px] text-muted-foreground truncate">mamun@lexora.app</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    closeMobile();
                    navigate('/settings');
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80 transition-all shrink-0 active:scale-95"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-60 overflow-x-hidden pb-20 lg:pb-0">
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

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50 pb-safe">
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
                className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-semibold transition-colors tracking-tight ${active ? 'text-primary' : 'text-muted-foreground'}`}>
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