import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
