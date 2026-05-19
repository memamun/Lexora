import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Target, Swords, BarChart, Keyboard, Zap, Settings, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/lib/NavigationContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#6366f1' },
  { path: '/levels', label: 'Learning Path', icon: BookOpen, color: '#10b981' },
  { path: '/mcq', label: 'MCQ Practice', icon: Target, color: '#f59e0b' },
  { path: '/battle', label: 'Battle Mode', icon: Swords, color: '#ef4444' },
  { path: '/spelling', label: 'Spelling Master', icon: Keyboard, color: '#ec4899' },
  { path: '/matching', label: 'Matching Drill', icon: Zap, color: '#10b981' },
  { path: '/analytics', label: 'Analytics', icon: BarChart, color: '#06b6d4' },
];

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
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {active && <motion.div layoutId="nav-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
        
        {/* Desktop Profile & Settings Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shrink-0">
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
            {/* Full-page Navigation Panel */}
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              drag="x"
              dragConstraints={{ right: 0, left: -100 }}
              dragElastic={{ right: 0, left: 0.1 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -80 || velocity.x < -400) {
                  closeMobile();
                }
              }}
              className="lg:hidden fixed inset-0 w-full h-full z-[70] bg-background shadow-2xl flex flex-col"
            >
              {/* Premium Lexora Branding Header */}
              <div className="p-5 pb-2 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-foreground tracking-tight px-1">Lexora</h1>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      closeMobile();
                      navigate('/settings');
                    }}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
                    aria-label="Settings"
                  >
                    <span className="text-xs font-medium">JD</span>
                  </button>
                </div>
              </div>

              {/* Drawer Navigation List with Groupings */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-6">
                {/* Section: Main Hub */}
                <div className="space-y-1">
                  {NAV_ITEMS.slice(0, 2).map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => closeMobile()}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          active ? 'bg-secondary/80 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Section: Core Drills */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-3 pb-1">Notebooks & Drills</p>
                  {NAV_ITEMS.slice(2, 6).map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => closeMobile()}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          active ? 'bg-secondary/80 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Section: Intelligence */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-3 pb-1">Stats & Insights</p>
                  {NAV_ITEMS.slice(6).map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => closeMobile()}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          active ? 'bg-secondary/80 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-60 overflow-x-hidden">
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
    </div>
  );
}