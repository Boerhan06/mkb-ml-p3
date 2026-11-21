"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Disc, Activity, Check } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";
import { ScenarioPreset, MachineUnit, UserProfile } from "@/types/bearing";
import { USER_PROFILES } from "@/lib/constants";

interface TopBarProps {
  activePreset: ScenarioPreset;
  onSelectPreset: (preset: ScenarioPreset) => void;
  isLoading: boolean;
  selectedMachine?: MachineUnit;
  selectedProfile?: UserProfile;
  onSelectProfile?: (profile: UserProfile) => void;
}

export default function TopBar({
  activePreset,
  onSelectPreset,
  isLoading,
  selectedMachine,
  selectedProfile,
  onSelectProfile,
}: TopBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const currentProfile = selectedProfile || USER_PROFILES[0];
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

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
      className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md rounded-full border border-[#AEC3B0]/70 shadow-[0_4px_20px_-2px_rgba(15,42,29,0.08),0_2px_6px_-1px_rgba(15,42,29,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(15,42,29,0.12)] transition-shadow duration-300 flex items-stretch justify-between h-14 select-none shrink-0"
    >
      {/* Sisi Kiri: Logo 3-Dots, Brand, Unit & Nav Links (Preset) */}
      <div className="flex items-center gap-3 md:gap-5 pl-4 sm:pl-5 py-2 overflow-x-auto no-scrollbar">
        {/* Brand & Circular Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#AEC3B0]/80 bg-[#4E5A4C] flex-shrink-0 shadow-2xs">
            <Image
              src="/logo.png"
              alt="VibraCheck Logo"
              fill
              sizes="24px"
              className="object-cover"
              priority
            />
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
                whileHover={
                  shouldReduceMotion || isLoading ? undefined : { scale: 1.03 }
                }
                whileTap={
                  shouldReduceMotion || isLoading ? undefined : { scale: 0.95 }
                }
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
                    transition={
                      shouldReduceMotion ? springs.reduced : springs.snappy
                    }
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
          <span>
            {selectedMachine
              ? `${selectedMachine.name} (${selectedMachine.initials})`
              : "Pump #04 DE"}
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Potongan Diagonal Slanted dengan Gradient Palet Sage & Forest Green */}
      <div
        className="relative bg-gradient-to-r from-[#375534] via-[#27462E] to-[#0F2A1D] text-white flex items-center justify-end pl-9 sm:pl-12 pr-3 sm:pr-4 flex-shrink-0 rounded-r-full"
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

          {/* Tombol Pill Operator dengan Micro-Interactions & Popover Ganti Akun */}
          <div className="relative" ref={userMenuRef}>
            <motion.button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              transition={springs.tactile}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 hover:bg-white/20 border border-white/20 text-[#E3EED4] text-[12px] font-medium backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
            >
              <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/40 bg-[#4E5A4C] flex-shrink-0">
                <Image
                  src={currentProfile.avatar}
                  alt="Avatar Operator"
                  fill
                  sizes="20px"
                  className="object-cover"
                />
              </div>
              <span className="hidden sm:inline font-semibold">
                {currentProfile.name}
              </span>
              <Activity className="w-3 h-3 text-[#AEC3B0] hidden sm:block" />
            </motion.button>

            {/* Dropdown Popover Ganti Profil */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={springs.snappy}
                  className="absolute right-0 top-full mt-2 z-50 w-60 bg-[#163829] text-white border border-[#2D5A43] rounded-2xl shadow-[0_16px_36px_-6px_rgba(15,42,29,0.45)] p-2 flex flex-col gap-1 backdrop-blur-xl"
                >
                  <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-[#AEC3B0] uppercase border-b border-[#2D5A43]/60 flex items-center justify-between">
                    <span>Ganti Akun Operator</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  </div>

                  <div className="flex flex-col gap-0.5 pt-1">
                    {USER_PROFILES.map((profile) => {
                      const isSelected = profile.id === currentProfile.id;
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => {
                            onSelectProfile?.(profile);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-[#2D5A43] border border-[#AEC3B0]/40"
                              : "hover:bg-[#22533E]/60 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/40 bg-[#4E5A4C] flex-shrink-0">
                              <Image
                                src={profile.avatar}
                                alt={profile.name}
                                fill
                                sizes="24px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[12px] font-bold text-[#E3EED4] leading-tight truncate">
                                {profile.name}
                              </div>
                              <div className="text-[10px] text-[#AEC3B0] leading-tight truncate mt-0.5">
                                {profile.role}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#E3EED4] flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
