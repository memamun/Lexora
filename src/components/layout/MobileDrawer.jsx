import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, LogOut, X } from 'lucide-react';
import { useNavigation } from '@/lib/NavigationContext';
import { useAuth } from '@/lib/AuthContext';
import LexoraLogo from '@/components/ui/LexoraLogo';
import { NAV_CATEGORIES, isRouteActive, getInitials } from './navigation';

export default function MobileDrawer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mobileOpen, closeMobile } = useNavigation();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Slide-out Left Navigation Drawer (Mobile Viewport) */}
      {/* Always mounted, visibility controlled via CSS transitions — avoids AnimatePresence exit bugs */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-200 ease-out ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobile}
        aria-hidden={!mobileOpen}
      />
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-72 h-full z-[70] bg-background border-r border-border/50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={!mobileOpen}
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
                    <Link key={item.path} to={item.path}
                      onClick={() => closeMobile()}
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
                <img src={user.avatar} alt={`${user?.name || 'User'}'s avatar`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <span className="text-[10px] font-bold tracking-tight text-muted-foreground" style={user?.avatar ? { display: 'none' } : {}}>{getInitials(user)}</span>
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
      </div>
    </>
  );
}
