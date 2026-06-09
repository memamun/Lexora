import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/lib/NavigationContext';
import { useAuth } from '@/lib/AuthContext';
import LexoraLogo from '@/components/ui/LexoraLogo';
import { NAV_CATEGORIES, isRouteActive, getInitials } from './navigation';

export default function Sidebar({
  showShortcutPanel,
  setShowShortcutPanel,
  notifications
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useNavigation();
  const { user, logout } = useAuth();

  return (
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
                <img src={user.avatar} alt={`${user?.name || 'User'}'s avatar`} className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <div className={user?.avatar ? 'w-full h-full rounded-full flex items-center justify-center bg-secondary border border-border' : 'w-full h-full rounded-full flex items-center justify-center bg-secondary border border-border'} style={user?.avatar ? { display: 'none' } : {}}>
                <span className="text-[11px] font-bold tracking-tight text-muted-foreground">{getInitials(user)}</span>
              </div>
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
                <img src={user.avatar} alt={`${user?.name || 'User'}'s avatar`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <span className={user?.avatar ? 'text-[11px] font-bold tracking-tight text-muted-foreground' : 'text-[11px] font-bold tracking-tight text-muted-foreground'} style={user?.avatar ? { display: 'none' } : {}}>{getInitials(user)}</span>
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
  );
}
