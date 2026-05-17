import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Target, Swords, BarChart, Menu, Keyboard, Zap, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggle-drawer', handleToggle);
    return () => window.removeEventListener('toggle-drawer', handleToggle);
  }, []);

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
            {/* Smooth Backdrop Filter */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-[60] bg-background/70 backdrop-blur-md"
            />
            {/* Left slide-out panel - Pure Obsidian Black Design */}
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[290px] max-w-[85vw] h-full z-[70] bg-[#09090b] border-r border-neutral-900 shadow-2xl flex flex-col"
            >
              {/* Premium Lexora Branding Header */}
              <div className="p-5 border-b border-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
                    <span className="text-primary font-serif text-base font-bold">L</span>
                  </div>
                  <div>
                    <h1 className="font-serif text-base font-semibold text-foreground tracking-tight">Lexora</h1>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">BB Exam Prep</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-muted-foreground transition-all"
                >
                  <span className="text-xs font-semibold">✕</span>
                </button>
              </div>

              {/* Drawer Navigation List with Groupings */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Section: Main Hub */}
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60 px-3">Main Hub</p>
                  {NAV_ITEMS.slice(0, 2).map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          active ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-neutral-900'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-semibold">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Section: Core Drills */}
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60 px-3">Notebooks & Drills</p>
                  {NAV_ITEMS.slice(2, 6).map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          active ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-neutral-900'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-semibold">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Section: Intelligence */}
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60 px-3">Stats & Insights</p>
                  {NAV_ITEMS.slice(6).map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          active ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-neutral-900'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-semibold">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* Drawer User Profile Footer */}
              <div className="p-4 border-t border-neutral-900 flex items-center justify-between gap-2 bg-[#060608]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-900 border border-neutral-800 text-muted-foreground transition-all shrink-0">
                    <span className="text-[11px] font-bold tracking-tight">JD</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">John Doe</p>
                    <p className="text-[9px] text-muted-foreground truncate">mamun@lexora.app</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-muted-foreground hover:text-foreground border border-neutral-800 transition-all shrink-0 active:scale-95"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-60 pt-6 lg:pt-0 pb-6 lg:pb-0 overflow-x-hidden">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}