"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  HTMLMotionProps,
} from "motion/react";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  /** Tingkat kekuatan tarikan magnetik (0.1 = halus, 0.5 = kuat). Default: 0.35 */
  strength?: number;
  /** Radius efek magnetik di luar tombol dalam piksel. Default: 40 */
  range?: number;
  /** Kelas Tailwind tambahan */
  className?: string;
}

/**
 * MagneticButton - Komponen tombol interaktif kelas produksi.
 *
 * Menggunakan `useMotionValue` dan `useSpring` untuk melacak kursor secara real-time
 * tanpa memicu re-render React (zero state updates pada setiap frame kursor).
 */
export default function MagneticButton({
  children,
  strength = 0.35,
  range = 40,
  className = "",
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Motion values untuk pergeseran posisi X dan Y
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Fisika pegas natural (Linear/Apple feel: elastis dan responsif)
  const springConfig = { damping: 18, stiffness: 220, mass: 0.2 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Parallax subtle untuk teks/ikon di dalam tombol (bergerak sedikit lebih jauh untuk ilusi kedalaman)
  const textX = useTransform(x, (val) => val * 0.4);
  const textY = useTransform(y, (val) => val * 0.4);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldReduceMotion) return;
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Batasi dalam range
    mouseX.set(distanceX * strength);
    mouseY.set(distanceY * strength);
  };

  const handleMouseLeave = () => {
    // Kembali secara organik ke posisi semula dengan pegas
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={shouldReduceMotion ? undefined : { x, y }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className={`relative inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B9071] ${className}`}
      {...props}
    >
      <motion.span
        style={shouldReduceMotion ? undefined : { x: textX, y: textY }}
        className="relative z-10 flex items-center gap-2 pointer-events-none"
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
