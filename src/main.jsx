import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initWordData } from '@/lib/wordData'

// Restore user's accent color before React mounts to prevent flash-of-default-theme
;(function initAccentColor() {
  const ACCENTS = {
    amber: '38 92% 60%',
    indigo: '250 95% 65%',
    emerald: '150 80% 50%',
    rose: '350 90% 60%'
  };
  const saved = localStorage.getItem('lexora-accent-color');
  if (saved && ACCENTS[saved]) {
    document.documentElement.style.setProperty('--primary', ACCENTS[saved]);
    document.documentElement.style.setProperty('--ring', ACCENTS[saved]);
  }
})();

// Restore user's theme mode before React mounts to prevent flash-of-light-theme
;(function initThemeMode() {
  const saved = localStorage.getItem('lexora-theme-mode') || 'classic';
  const root = document.documentElement;
  root.classList.remove('classic', 'light', 'dark');
  if (saved === 'classic') {
    root.classList.add('classic');
  } else if (saved === 'light') {
    root.classList.add('light');
  } else if (saved === 'dark') {
    root.classList.add('dark');
  } else if (saved === 'system') {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(isSystemDark ? 'dark' : 'light');
  }
})();

// Performance: trace app startup
(async () => {
  try {
    const { isFirebaseConfigured } = await import('@/lib/firebase');
    if (isFirebaseConfigured) {
      const { getApp } = await import('firebase/app');
      const { getPerformance, trace, isSupported } = await import('firebase/performance');
      const isPerfSupported = await isSupported();
      if (isPerfSupported) {
        const app = getApp();
        const perf = getPerformance(app);
        const startupTrace = trace(perf, 'app_startup');
        startupTrace.start();
        requestAnimationFrame(() => {
          startupTrace.stop();
        });
      }
    }
  } catch {
    // Performance monitoring not available — silent fail
  }
})();



// Load word data before rendering to ensure ALL_WORDS is populated
initWordData().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
});

