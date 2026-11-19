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

interface TiltCard3DProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  /** Derajat kemiringan maksimal (derajat). Default: 12 */
  maxTilt?: number;
  /** Tampilkan efek pantulan cahaya (glare sheen). Default: true */
  glare?: boolean;
  /** Kelas Tailwind tambahan */
  className?: string;
}

/**
 * TiltCard3D - Komponen kartu dengan efek kemiringan 3D dan pantulan cahaya real-time.
 *
 * Menggunakan `useMotionValue`, `useSpring`, dan `useTransform` untuk memetakan
 * posisi kursor ke rotasi sudut X/Y tanpa menyebabkan re-render komponen (60/120 FPS murni GPU).
 */
export default function TiltCard3D({
  children,
  maxTilt = 12,
  glare = true,
  className = "",
  ...props
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Normalized motion values: -0.5 (kiri/atas) s.d. 0.5 (kanan/bawah)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glareOpacityTarget = useMotionValue(0);

  // Fisika pegas halus untuk pergerakan kursor
  const springConfig = { damping: 24, stiffness: 280, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);
  const glareOpacity = useSpring(glareOpacityTarget, { damping: 20, stiffness: 200 });

  // Pemetaan posisi kursor ke derajat rotasi 3D (X dan Y)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${maxTilt}deg`, `-${maxTilt}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${maxTilt}deg`, `${maxTilt}deg`]);

  // Pemetaan posisi pantulan cahaya (glare sheen spotlight)
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    // Normalisasi antara -0.5 dan 0.5
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;

    x.set(xPct);
    y.set(yPct);
    glareOpacityTarget.set(1);
  };

  const handleMouseLeave = () => {
    // Kembali ke posisi tegak semula secara organik dengan pegas
    x.set(0);
    y.set(0);
    glareOpacityTarget.set(0);
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="relative inline-block w-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          shouldReduceMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }
        }
        className={`relative overflow-hidden rounded-[24px] transition-shadow duration-300 will-change-transform ${className}`}
        {...props}
      >
        {/* Konten Utama dengan Elevasi 3D */}
        <div
          style={shouldReduceMotion ? undefined : { transform: "translateZ(30px)" }}
          className="relative z-10 w-full h-full"
        >
          {children}
        </div>

        {/* Dynamic Light Sheen / Glare Layer */}
        {glare && !shouldReduceMotion && (
          <motion.div
            style={{
              opacity: glareOpacity,
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) =>
                  `radial-gradient(circle 280px at ${gx} ${gy}, rgba(255,255,255,0.18), transparent 70%)`
              ),
            }}
            className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay"
          />
        )}
      </motion.div>
    </div>
  );
}
