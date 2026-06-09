import React from 'react';
import { motion } from 'framer-motion';

/**
 * LexoraLogo - A premium, animated geometric gem SVG logo.
 * Equipment with smooth spring entrances, micro-interaction hover transforms,
 * and a continuous, cinematic pulsing/shimmering loading animation state.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes for sizing/layout.
 * @param {boolean} [props.isLoading] - Triggers the continuous shimmer loading animation.
 * @param {boolean} [props.animated] - Enables entrance and hover animations.
 * @param {boolean} [props.showBg] - Whether to show the dark slate background rect.
 * @param {string} [props.gemColor] - The fill color of the gem facets.
 * @param {string} [props.strokeColor] - The gap/stroke color.
 */
export default function LexoraLogo({
  className = 'w-12 h-16',
  isLoading = false,
  animated = true,
  showBg = false,
  gemColor = '#6366f1', // Indigo-500
  strokeColor = 'hsl(var(--background))' // Dynamically match theme background color for spacing gaps
}) {
  // Stagger variants for the facets on entrance
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const facetVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.85,
      y: 10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 120, 
        damping: 12 
      }
    }
  };

  // Continuous shimmer pulse variables for loading animation
  const loadingTransition = (index) => ({
    repeat: Infinity,
    duration: 1.8,
    ease: "easeInOut",
    delay: index * 0.15,
    repeatType: "reverse"
  });

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 400"
      className={`${className} overflow-visible`}
      variants={animated ? containerVariants : undefined}
      initial={animated ? "hidden" : undefined}
      animate={isLoading ? "loading" : animated ? "visible" : undefined}
      whileHover={animated && !isLoading ? { scale: 1.05, filter: "brightness(1.1) drop-shadow(0 0 12px rgba(99,102,241,0.45))" } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {showBg && (
        <rect width="300" height="400" rx="32" fill="#0f172a" />
      )}
      
      <motion.g 
        stroke={strokeColor} 
        strokeWidth="10" 
        strokeLinejoin="miter" 
        strokeLinecap="square"
        className="origin-center"
      >
        {/* Top-Left Facet */}
        <motion.polygon
          points="150,40 30,195 150,140"
          fill={gemColor}
          variants={facetVariants}
          animate={isLoading ? {
            opacity: [0.7, 1, 0.7],
            fill: [gemColor, '#818cf8', gemColor], // shimmers to a lighter indigo
          } : undefined}
          transition={isLoading ? loadingTransition(0) : undefined}
          className="origin-[90px_125px]"
          whileHover={animated && !isLoading ? { scale: 1.03 } : undefined}
        />

        {/* Mid-Left Facet */}
        <motion.polygon
          points="150,140 30,195 30,230 150,260"
          fill={gemColor}
          variants={facetVariants}
          animate={isLoading ? {
            opacity: [0.7, 1, 0.7],
            fill: [gemColor, '#818cf8', gemColor],
          } : undefined}
          transition={isLoading ? loadingTransition(1) : undefined}
          className="origin-[90px_200px]"
          whileHover={animated && !isLoading ? { scale: 1.03 } : undefined}
        />

        {/* Bottom-Left Facet */}
        <motion.polygon
          points="150,260 30,230 150,360"
          fill={gemColor}
          variants={facetVariants}
          animate={isLoading ? {
            opacity: [0.7, 1, 0.7],
            fill: [gemColor, '#818cf8', gemColor],
          } : undefined}
          transition={isLoading ? loadingTransition(2) : undefined}
          className="origin-[90px_285px]"
          whileHover={animated && !isLoading ? { scale: 1.03 } : undefined}
        />

        {/* Top-Right Facet (Symmetrical Double-Cut Right Profile) */}
        <motion.polygon
          points="150,40 150,260 270,215 270,170"
          fill={gemColor}
          variants={facetVariants}
          animate={isLoading ? {
            opacity: [0.7, 1, 0.7],
            fill: [gemColor, '#818cf8', gemColor],
          } : undefined}
          transition={isLoading ? loadingTransition(3) : undefined}
          className="origin-[210px_170px]"
          whileHover={animated && !isLoading ? { scale: 1.03 } : undefined}
        />

        {/* Bottom-Right Facet */}
        <motion.polygon
          points="150,260 270,215 150,360"
          fill={gemColor}
          variants={facetVariants}
          animate={isLoading ? {
            opacity: [0.7, 1, 0.7],
            fill: [gemColor, '#818cf8', gemColor],
          } : undefined}
          transition={isLoading ? loadingTransition(4) : undefined}
          className="origin-[210px_280px]"
          whileHover={animated && !isLoading ? { scale: 1.03 } : undefined}
        />
      </motion.g>
    </motion.svg>
  );
}
