#!/bin/bash
git checkout src/pages/AdminDashboard.jsx
cat << 'INNER_EOF' > fix_imports.js
const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf-8');

// Remove unused imports
content = content.replace(/import \{ createPortal \} from 'react-dom';\n/, '');
content = content.replace(/import \{ AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell \} from 'recharts';\n/, '');
content = content.replace(/import \{ motion, AnimatePresence \} from 'framer-motion';\n/, '');

// Remove specific unused lucide icons
const unusedIcons = ['Search', 'Filter', 'ArrowUpDown', 'Shield', 'User', 'Trash2', 'RotateCcw', 'Trophy', 'Flame', 'CheckCircle2'];
unusedIcons.forEach(icon => {
  content = content.replace(new RegExp(`${icon},\\s*`), '');
  content = content.replace(new RegExp(`\\s*${icon}\\b(?!(?:[a-zA-Z]))`), '');
});

// Clean up empty lines in the import block for lucide-react if they were left
content = content.replace(/import \{\s*\n(?:[\s\n]*)\} from 'lucide-react';/, '');


fs.writeFileSync('src/pages/AdminDashboard.jsx', content);
INNER_EOF
node fix_imports.js
