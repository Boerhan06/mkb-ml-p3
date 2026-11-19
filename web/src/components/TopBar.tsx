"use client";

import Image from "next/image";
import { Disc, Activity } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";
import { ScenarioPreset } from "@/types/bearing";

interface TopBarProps {
  activePreset: ScenarioPreset;
  onSelectPreset: (preset: ScenarioPreset) => void;
  isLoading: boolean;
}

export default function TopBar({
  activePreset,
  onSelectPreset,
  isLoading,
}: TopBarProps) {
  const shouldReduceMotion = useReducedMotion();

  const presets: { name: ScenarioPreset; label: string }[] = [
    { name: "Normal", label: "Normal" },
    { name: "Outer Race", label: "Outer Race" },
    { name: "Inner Race", label: "Inner Race" },
    { name: "Ball Fault", label: "Ball Fault" },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.snappy}
      className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md rounded-full border border-[#AEC3B0]/70 shadow-[0_4px_20px_-2px_rgba(15,42,29,0.08),0_2px_6px_-1px_rgba(15,42,29,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(15,42,29,0.12)] transition-shadow duration-300 overflow-hidden flex items-stretch justify-between h-14 select-none shrink-0"
    >
      {/* Sisi Kiri: Logo 3-Dots, Brand, Unit & Nav Links (Preset) */}
      <div className="flex items-center gap-3 md:gap-5 pl-4 sm:pl-5 py-2 overflow-x-auto no-scrollbar">
        {/* Brand & Logo 3 Dots */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
            <span className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-[#375534]" />
            <span className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-[#6B9071]" />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#0F2A1D]" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[#0F2A1D]">
            VibraCheck
          </span>
        </div>

        {/* Separator Garis Tipis */}
        <span className="h-4 w-[1px] bg-[#AEC3B0]/60 hidden md:block flex-shrink-0" />

        {/* Navigation Links / Skenario Presets with Shared Layout */}
        <nav className="flex items-center gap-1 sm:gap-2 relative">
          {presets.map((preset) => {
            const isSelected = activePreset === preset.name;
            return (
              <motion.button
                key={preset.name}
                type="button"
                disabled={isLoading}
                onClick={() => onSelectPreset(preset.name)}
                whileHover={shouldReduceMotion || isLoading ? undefined : { scale: 1.03 }}
                whileTap={shouldReduceMotion || isLoading ? undefined : { scale: 0.95 }}
                transition={springs.tactile}
                className={`relative px-3 py-1.5 rounded-full text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "font-bold text-[#0F2A1D]"
                    : "font-medium text-[#5B7060] hover:text-[#0F2A1D]"
                } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {/* Shared Layout Active Preset Pill */}
                {isSelected && (
                  <motion.span
                    layoutId="active-preset-pill"
                    className="absolute inset-0 bg-[#E3EED4] rounded-full border border-[#AEC3B0]/70 -z-10 shadow-2xs"
                    transition={shouldReduceMotion ? springs.reduced : springs.snappy}
                  />
                )}
                {preset.label}
              </motion.button>
            );
          })}
        </nav>

        {/* Info Unit Mesin (Desktop Only) */}
        <div className="hidden lg:flex items-center gap-1.5 text-[12px] text-[#6B9071] pl-2 border-l border-[#AEC3B0]/60 whitespace-nowrap">
          <Disc className="w-3.5 h-3.5 text-[#375534]" />
          <span>Pump #04 DE</span>
        </div>
      </div>

      {/* Sisi Kanan: Potongan Diagonal Slanted dengan Gradient Palet Sage & Forest Green */}
      <div
        className="relative bg-gradient-to-r from-[#375534] via-[#27462E] to-[#0F2A1D] text-white flex items-center justify-end pl-9 sm:pl-12 pr-3 sm:pr-4 flex-shrink-0"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 32px 100%)",
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4 pl-1">
          {/* Status Sampling */}
          <div className="flex items-center gap-1.5 text-[12px] text-[#E3EED4] font-medium whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#AEC3B0] animate-pulse block" />
            <span className="hidden sm:inline">Live 20 kHz</span>
          </div>

          {/* Tombol Pill Operator dengan Micro-Interactions */}
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            transition={springs.tactile}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 hover:bg-white/20 border border-white/20 text-[#E3EED4] text-[12px] font-medium backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
          >
            <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/40 flex-shrink-0">
              <Image
                src="/logo.jpg"
                alt="Avatar Operator"
                fill
                className="object-cover scale-125"
              />
            </div>
            <span className="hidden sm:inline">Bayu Aji</span>
            <Activity className="w-3 h-3 text-[#AEC3B0] hidden sm:block" />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
