"use client";

import React from "react";
import { LazyMotion, domAnimation } from "motion/react";

interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * MotionProvider - Root Provider untuk memangkas bundle size Framer Motion.
 *
 * Menggunakan `LazyMotion` dengan `domAnimation` (hanya memuat logika DOM, gestures,
 * layout animations, dan exit animations tanpa overhead parser SVG/drag kompleks jika tidak dipakai),
 * memangkas ukuran bundle awal secara drastis (~18kB gzipped).
 */
export default function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict={false}>
      {children}
    </LazyMotion>
  );
}
