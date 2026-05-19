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
