import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Unified Theme & Accent Color Initializer to prevent flash-of-default-theme
;(function initLexoraTheme() {
  const themeMode = localStorage.getItem('lexora-theme-mode') || 'classic';
  const accentColor = localStorage.getItem('lexora-accent-color') || 'amber';
  const fontHeading = localStorage.getItem('lexora-font-heading') || 'dm-sans';
  const fontBody = localStorage.getItem('lexora-font-body') || 'inter';
  const root = document.documentElement;

  // Initialize Saved Typography Preferences
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

  const setStitchLight = () => {
    root.style.setProperty('--stitch-on-surface', '230 10% 11%');
    root.style.setProperty('--stitch-on-surface-variant', '230 8% 29%');
    root.style.setProperty('--stitch-outline', '230 8% 49%');
    root.style.setProperty('--stitch-outline-variant', '232 10% 79%');
    root.style.setProperty('--stitch-surface-gray', '207 8% 95%');
    root.style.setProperty('--stitch-surface-blue', '214 60% 96%');
    root.style.setProperty('--stitch-surface-container', '246 20% 93%');
    root.style.setProperty('--stitch-surface-container-low', '246 40% 97%');
    root.style.setProperty('--stitch-surface-container-high', '246 20% 91%');
    root.style.setProperty('--stitch-surface-container-highest', '232 10% 85%');
    root.style.setProperty('--stitch-primary-container', '217 100% 43%');
    root.style.setProperty('--stitch-on-primary-container', '225 100% 91%');
    root.style.setProperty('--stitch-secondary-container', '148 92% 78%');
    root.style.setProperty('--stitch-on-secondary-container', '154 100% 23%');
    root.style.setProperty('--stitch-error', '0 86% 42%');
    root.style.setProperty('--stitch-error-red', '0 60% 55%');
    root.style.setProperty('--stitch-error-container', '4 100% 92%');
    root.style.setProperty('--stitch-on-error-container', '0 86% 30%');
    root.style.setProperty('--stitch-tertiary', '18 100% 25%');
    root.style.setProperty('--stitch-tertiary-container', '18 100% 33%');
    root.style.setProperty('--stitch-tertiary-fixed-dim', '18 100% 80%');
    root.style.setProperty('--stitch-inverse-surface', '230 10% 21%');
    root.style.setProperty('--stitch-inverse-on-surface', '240 100% 97%');
    root.style.setProperty('--stitch-inverse-primary', '225 100% 85%');
  };

  const setStitchDark = () => {
    root.style.setProperty('--stitch-on-surface', '240 8% 94%');
    root.style.setProperty('--stitch-on-surface-variant', '232 8% 77%');
    root.style.setProperty('--stitch-outline', '232 8% 40%');
    root.style.setProperty('--stitch-outline-variant', '232 6% 28%');
    root.style.setProperty('--stitch-surface-gray', '230 12% 13%');
    root.style.setProperty('--stitch-surface-blue', '222 30% 14%');
    root.style.setProperty('--stitch-surface-container', '232 15% 15%');
    root.style.setProperty('--stitch-surface-container-low', '230 12% 12%');
    root.style.setProperty('--stitch-surface-container-high', '235 15% 19%');
    root.style.setProperty('--stitch-surface-container-highest', '235 20% 25%');
    root.style.setProperty('--stitch-primary-container', '217 100% 43%');
    root.style.setProperty('--stitch-on-primary-container', '225 100% 91%');
    root.style.setProperty('--stitch-secondary-container', '148 50% 25%');
    root.style.setProperty('--stitch-on-secondary-container', '148 92% 78%');
    root.style.setProperty('--stitch-error', '0 86% 60%');
    root.style.setProperty('--stitch-error-red', '0 70% 65%');
    root.style.setProperty('--stitch-error-container', '0 30% 18%');
    root.style.setProperty('--stitch-on-error-container', '0 86% 90%');
    root.style.setProperty('--stitch-tertiary', '18 100% 70%');
    root.style.setProperty('--stitch-tertiary-container', '18 80% 30%');
    root.style.setProperty('--stitch-tertiary-fixed-dim', '18 100% 80%');
    root.style.setProperty('--stitch-inverse-surface', '240 8% 90%');
    root.style.setProperty('--stitch-inverse-on-surface', '230 10% 15%');
    root.style.setProperty('--stitch-inverse-primary', '217 100% 43%');
  };

  if (themeMode === 'classic') {
    const ACCENTS = {
      amber: '38 92% 60%',
      indigo: '250 95% 65%',
      emerald: '150 80% 50%',
      rose: '350 90% 60%'
    };
    root.style.setProperty('--background', '222 47% 6%');
    root.style.setProperty('--foreground', '40 20% 92%');
    root.style.setProperty('--card', '222 40% 9%');
    root.style.setProperty('--card-foreground', '40 20% 92%');
    root.style.setProperty('--popover', '222 40% 9%');
    root.style.setProperty('--popover-foreground', '40 20% 92%');
    root.style.setProperty('--border', '222 25% 15%');
    root.style.setProperty('--input', '222 25% 15%');
    root.style.setProperty('--secondary', '222 30% 14%');
    root.style.setProperty('--secondary-foreground', '40 15% 75%');
    root.style.setProperty('--muted', '222 25% 12%');
    root.style.setProperty('--muted-foreground', '220 15% 50%');
    root.style.setProperty('--accent', '185 40% 45%');
    root.style.setProperty('--accent-foreground', '40 20% 95%');

    const primaryColor = ACCENTS[accentColor] || ACCENTS.amber;
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--ring', primaryColor);
    setStitchDark();
    return;
  }

  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);

  if (!useDark) {
    // Gemini Light Theme
    root.style.setProperty('--background', '210 17% 98%');
    root.style.setProperty('--foreground', '220 15% 15%');
    root.style.setProperty('--card', '0 0% 100%');
    root.style.setProperty('--card-foreground', '220 15% 15%');
    root.style.setProperty('--popover', '0 0% 100%');
    root.style.setProperty('--popover-foreground', '220 15% 15%');
    root.style.setProperty('--border', '220 12% 87%');
    root.style.setProperty('--input', '220 12% 87%');
    root.style.setProperty('--secondary', '217 60% 95%');
    root.style.setProperty('--secondary-foreground', '217 89% 43%');
    root.style.setProperty('--muted', '210 14% 94%');
    root.style.setProperty('--muted-foreground', '215 12% 42%');
    root.style.setProperty('--accent', '217 60% 95%');
    root.style.setProperty('--accent-foreground', '217 89% 43%');
    root.style.setProperty('--primary', '217 89% 43%');
    root.style.setProperty('--primary-foreground', '0 0% 100%');
    root.style.setProperty('--ring', '217 89% 43%');
    root.style.setProperty('--destructive', '0 72% 51%');
    root.style.setProperty('--destructive-foreground', '0 0% 100%');
    setStitchLight();
  } else {
    // Gemini Dark Theme
    root.style.setProperty('--background', '240 6% 8%');
    root.style.setProperty('--foreground', '220 10% 90%');
    root.style.setProperty('--card', '240 4% 12%');
    root.style.setProperty('--card-foreground', '220 10% 90%');
    root.style.setProperty('--popover', '240 4% 15%');
    root.style.setProperty('--popover-foreground', '220 10% 90%');
    root.style.setProperty('--border', '240 4% 22%');
    root.style.setProperty('--input', '240 4% 22%');
    root.style.setProperty('--secondary', '240 4% 16%');
    root.style.setProperty('--secondary-foreground', '220 10% 85%');
    root.style.setProperty('--muted', '240 4% 11%');
    root.style.setProperty('--muted-foreground', '220 6% 55%');
    root.style.setProperty('--accent', '218 55% 22%');
    root.style.setProperty('--accent-foreground', '218 80% 80%');
    root.style.setProperty('--primary', '218 80% 75%');
    root.style.setProperty('--primary-foreground', '240 6% 8%');
    root.style.setProperty('--ring', '218 80% 75%');
    root.style.setProperty('--destructive', '0 62% 55%');
    root.style.setProperty('--destructive-foreground', '220 10% 90%');
    setStitchDark();
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
