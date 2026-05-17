import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Target, Swords, BarChart, Menu, Keyboard, Zap } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="p-4 border-t border-border">
          <p className="text-[9px] text-muted-foreground text-center uppercase tracking-wider">300 Words · Adaptive SRS</p>
        </div>
      </aside>

      {/* Mobile Header - Native App Feel */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
              <span className="text-primary font-serif text-sm font-bold">L</span>
            </div>
            <span className="text-premium text-lg font-bold text-foreground">Lexora</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary/40 border border-border/40 text-muted-foreground/80 hover:text-foreground transition-all">
              <span className="text-[11px] font-bold tracking-tight">JD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-2xl border-t border-border/50 pb-safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.slice(0, 5).map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center justify-center flex-1 gap-1 h-full transition-all duration-300 relative ${active ? 'text-primary' : 'text-muted-foreground/60'
                  }`}
              >
                <div className="p-2 transition-all duration-300">
                  <motion.div
                    initial={false}
                    animate={{ scale: active ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon
                      className={`w-6 h-6 transition-all duration-300 ${active ? '' : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80'}`}
                      color={active ? item.color : 'currentColor'}
                      fill={active ? item.color : 'none'}
                      fillOpacity={active ? 0.25 : 0}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                  </motion.div>
                </div>
                <span
                  className={`text-[8px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}
                  style={{ color: active ? item.color : 'inherit' }}
                >
                  {item.label.split(' ')[0]}
                </span>

              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col items-center justify-center flex-1 gap-1 h-full text-muted-foreground/60"
          >
            <div className="p-1.5 rounded-xl">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">More</span>
          </button>
        </div>
      </nav>

      {/* Immersive Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-[60] bg-background/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border rounded-t-[2rem] p-6 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-8" />
              <div className="grid grid-cols-2 gap-4">
                {NAV_ITEMS.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className="flex flex-col gap-3 p-4 rounded-2xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border/50 group-hover:border-primary/30 transition-colors">
                      <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-semibold text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full mt-8 py-4 bg-secondary rounded-2xl font-bold text-foreground hover:bg-secondary/80 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-60 pt-[60px] lg:pt-0 pb-20 lg:pb-0 overflow-x-hidden">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}