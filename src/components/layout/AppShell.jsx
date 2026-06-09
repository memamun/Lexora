import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useNavigation } from '@/lib/NavigationContext';

import Sidebar from './Sidebar';
import ShortcutPanel from './ShortcutPanel';
import MobileDrawer from './MobileDrawer';
import MobileBottomNav from './MobileBottomNav';

export default function AppShell() {
  const location = useLocation();
  const { mobileOpen, closeMobile, sidebarCollapsed } = useNavigation();

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
  // closeMobile is stable (useCallback with []), safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        showShortcutPanel={showShortcutPanel}
        setShowShortcutPanel={setShowShortcutPanel}
        notifications={notifications}
      />

      <ShortcutPanel
        showShortcutPanel={showShortcutPanel}
        setShowShortcutPanel={setShowShortcutPanel}
        showThemeSubmenu={showThemeSubmenu}
        setShowThemeSubmenu={setShowThemeSubmenu}
        notifications={notifications}
        setNotifications={setNotifications}
        shortcutPanelRef={shortcutPanelRef}
      />

      <MobileDrawer />

      {/* Main Content Area - Transitions Margin smoothly alongside Sidebar */}
      <main className={`flex-1 overflow-x-hidden pb-24 lg:pb-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'
      }`}>
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
