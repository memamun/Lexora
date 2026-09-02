#!/bin/bash
# Remove unused imports from src/pages/AdminDashboard.jsx
sed -i '/import { createPortal } from .react-dom.;/d' src/pages/AdminDashboard.jsx
sed -i 's/import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from .recharts.;//g' src/pages/AdminDashboard.jsx
sed -i 's/import { motion, AnimatePresence } from .framer-motion.;//g' src/pages/AdminDashboard.jsx
sed -i 's/Search, //g' src/pages/AdminDashboard.jsx
sed -i 's/Filter, //g' src/pages/AdminDashboard.jsx
sed -i 's/ArrowUpDown, //g' src/pages/AdminDashboard.jsx
sed -i 's/Shield,//g' src/pages/AdminDashboard.jsx
sed -i 's/User,//g' src/pages/AdminDashboard.jsx
sed -i 's/Trash2,//g' src/pages/AdminDashboard.jsx
sed -i 's/RotateCcw,//g' src/pages/AdminDashboard.jsx
sed -i 's/Trophy,//g' src/pages/AdminDashboard.jsx
sed -i 's/Flame,//g' src/pages/AdminDashboard.jsx
sed -i 's/CheckCircle2//g' src/pages/AdminDashboard.jsx
