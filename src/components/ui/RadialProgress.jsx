import React from 'react';
import { motion } from 'framer-motion';

export default function RadialProgress({ percent, size = 50, strokeWidth = 3, colorClass = "text-primary", icon: Icon, showPercent = false }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center font-serif font-black text-xs" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible absolute inset-0">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-secondary/50"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Glowing Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={colorClass}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      {Icon && <Icon className="w-4 h-4 text-foreground relative z-10" />}
      {showPercent && <span className="relative z-10 text-[10px] font-black text-foreground">{Math.round(percent)}%</span>}
    </div>
  );
}
