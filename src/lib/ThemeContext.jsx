import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('lexora-theme-mode') || 'classic';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      // Remove all theme class variables
      root.classList.remove('classic', 'light', 'dark');

      if (themeMode === 'classic') {
        root.classList.add('classic');
      } else if (themeMode === 'light') {
        root.classList.add('light');
      } else if (themeMode === 'dark') {
        root.classList.add('dark');
      } else if (themeMode === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(isSystemDark ? 'dark' : 'light');
      }
    };

    applyTheme();
    localStorage.setItem('lexora-theme-mode', themeMode);

    // Watch OS color preferences when system mode is selected
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
