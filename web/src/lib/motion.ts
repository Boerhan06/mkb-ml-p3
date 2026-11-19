import { Transition, Variants } from "motion/react";

/**
 * VibraCheck Production Motion Design Tokens (Standard Linear / Apple / Vercel)
 * Mengutamakan GPU-accelerated transforms (x, y, scale, opacity) dan Natural Spring Physics.
 */

// 1. Natural Spring Physics Presets
export const springs = {
  // Snappy: Cepat, presisi, minimalis (cocok untuk tombol, switch, tab)
  snappy: {
    type: "spring",
    stiffness: 420,
    damping: 30,
    mass: 0.6,
  } as Transition,

  // Gentle: Halus dan elegan (cocok untuk accordion, modal, kartu besar)
  gentle: {
    type: "spring",
    stiffness: 260,
    damping: 26,
    mass: 0.8,
  } as Transition,

  // Responsive: Cepat dan responsif untuk micro-interactions hover & tap
  tactile: {
    type: "spring",
    stiffness: 500,
    damping: 25,
    mass: 0.4,
  } as Transition,

  // Smooth ease out untuk fallback reduced motion
  reduced: {
    duration: 0.15,
    ease: "easeOut",
  } as Transition,
};

// 2. Staggered Orchestration Variants
export const containerStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const containerStaggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

// 3. Item Reveal Variants (GPU-accelerated y & opacity)
export const itemFadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: "easeInOut" },
  },
};

export const itemFadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.14 },
  },
};

// 4. Accordion / Expandable Variants
export const accordionVariants: Variants = {
  collapsed: {
    opacity: 0,
    height: 0,
    overflow: "hidden",
    transition: springs.gentle,
  },
  expanded: {
    opacity: 1,
    height: "auto",
    overflow: "visible",
    transition: springs.gentle,
  },
};

// 5. Tactile Micro-Interactions (Button & Card feedback)
export const buttonTapScale = {
  whileHover: { scale: 1.025 },
  whileTap: { scale: 0.965 },
  whileFocus: { ring: "2px solid #6B9071" },
  transition: springs.tactile,
};

export const cardInteractive = {
  whileHover: { y: -2, transition: springs.snappy },
  whileTap: { scale: 0.995, transition: springs.tactile },
};
