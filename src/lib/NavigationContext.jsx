import React, { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => setMobileOpen(prev => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  return (
    <NavigationContext.Provider value={{ mobileOpen, toggleMobile, closeMobile, openMobile }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within <NavigationProvider>');
  return ctx;
}
