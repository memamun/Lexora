const fs = require('fs');
let code = fs.readFileSync('src/lib/NavigationContext.jsx', 'utf8');

code = code.replace(
  "import React, { createContext, useContext, useState, useCallback } from 'react';",
  "import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';"
);

code = code.replace(
  "  const [mobileOpen, setMobileOpen] = useState(false);",
  `  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lexora-active-tab');
        if (saved) return saved;
      } catch (e) {
        // ignore
      }
    }
    return 'default';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lexora-active-tab', activeTab);
      } catch (e) {
        // ignore
      }
    }
  }, [activeTab]);`
);

code = code.replace(
  "      mobileOpen, ",
  `      activeTab,
      setActiveTab,
      mobileOpen, `
);

fs.writeFileSync('src/lib/NavigationContext.jsx', code);
