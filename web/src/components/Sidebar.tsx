"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  Layers,
  Cpu,
  ChevronDown,
  Film,
  Settings,
  HelpCircle,
  LogOut,
  Check,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  springs,
  containerStaggerFast,
  itemFadeUp,
  buttonTapScale,
} from "@/lib/motion";
import { HealthStatus, MachineUnit, UserProfile } from "@/types/bearing";
import { MACHINE_UNITS, USER_PROFILES } from "@/lib/constants";
import SensorModal from "@/components/SensorModal";
import IsoGuideModal from "@/components/IsoGuideModal";

interface SidebarProps {
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  health: HealthStatus | null;
  selectedMachine?: MachineUnit;
  onSelectMachine?: (machine: MachineUnit) => void;
  selectedProfile?: UserProfile;
  onSelectProfile?: (profile: UserProfile) => void;
  onReplayIntro?: () => void;
}

export default function Sidebar({
  activeMenu,
  onSelectMenu,
  health,
  selectedMachine,
  onSelectMachine,
  selectedProfile,
  onSelectProfile,
  onReplayIntro,
}: SidebarProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [isIsoModalOpen, setIsIsoModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMachine = selectedMachine || MACHINE_UNITS[0];
  const currentProfile = selectedProfile || USER_PROFILES[0];

  // Click outside to close machine dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const menuItems = [
    {
      id: "diagnosa",
      label: "Diagnosa",
      icon: Activity,
    },
    {
      id: "spektrum",
      label: "Spektrum FFT",
      icon: BarChart3,
    },
    {
      id: "batch",
      label: "Batch Mesin",
      icon: Layers,
    },
    {
      id: "model",
      label: "Status Model",
      icon: Cpu,
    },
  ];

  return (
    <aside className="relative z-20 w-64 lg:w-70 flex-shrink-0 m-3 lg:m-4 rounded-[28px] bg-white/95 backdrop-blur-xl border border-[#AEC3B0]/70 shadow-[0_12px_36px_-6px_rgba(15,42,29,0.07),0_4px_12px_-2px_rgba(15,42,29,0.03)] p-4 flex flex-col justify-between h-[calc(100vh-24px)] lg:h-[calc(100vh-32px)] select-none no-scrollbar">
      {/* Bagian Atas: Brand, Workspace Switcher, & Navigation Menu */}
      <div className="flex flex-col gap-4">
        {/* 1. Brand Logo */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.snappy}
          className="flex items-center gap-2.5 px-2 pt-1"
        >
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#AEC3B0]/80 bg-[#4E5A4C] flex-shrink-0 shadow-2xs">
            <Image
              src="/logo.png"
              alt="VibraCheck Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-[#0F2A1D] lowercase">
            vibracheck
          </span>
        </motion.div>

        {/* 2. Workspace Selector Card with Interactive Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.015, y: -1 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
            transition={springs.tactile}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            className="w-full text-left p-2 rounded-2xl bg-[#E3EED4]/50 hover:bg-[#E3EED4]/80 border border-[#AEC3B0]/60 flex items-center justify-between gap-2.5 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#375534] text-[#E3EED4] flex items-center justify-center font-bold text-[13px] shadow-2xs flex-shrink-0">
                {currentMachine.initials}
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-[#0F2A1D] leading-tight truncate group-hover:text-[#375534]">
                  {currentMachine.name}
                </div>
                <div className="text-[11px] text-[#5B7060] leading-tight mt-0.5 truncate">
                  {currentMachine.location}
                </div>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={springs.snappy}
            >
              <ChevronDown className="w-4 h-4 text-[#375534] flex-shrink-0 mr-1" />
            </motion.div>
          </motion.button>

          {/* Dropdown Popover List Pompa Mesin */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={springs.snappy}
                className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white/95 backdrop-blur-xl border border-[#AEC3B0] rounded-2xl shadow-[0_16px_36px_-6px_rgba(15,42,29,0.18),0_4px_12px_-2px_rgba(15,42,29,0.06)] p-2 flex flex-col gap-1 max-h-80 overflow-y-auto no-scrollbar"
              >
                <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-[#6B9071] uppercase border-b border-[#AEC3B0]/40 flex items-center justify-between">
                  <span>Pilih Unit Mesin / Pompa</span>
                  <span className="text-[9.5px] font-normal text-[#5B7060] lowercase">
                    {MACHINE_UNITS.length} unit
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 pt-1">
                  {MACHINE_UNITS.map((machine) => {
                    const isSelected = machine.id === currentMachine.id;
                    const statusColor =
                      machine.status === "Aman"
                        ? "bg-[#E3EED4] text-[#1B4332]"
                        : machine.status === "Waspada"
                        ? "bg-[#FEF3C7] text-[#92400E]"
                        : "bg-[#FEE2E2] text-[#991B1B]";

                    return (
                      <motion.button
                        key={machine.id}
                        type="button"
                        onClick={() => {
                          onSelectMachine?.(machine);
                          setIsDropdownOpen(false);
                        }}
                        whileHover={shouldReduceMotion ? undefined : { x: 2 }}
                        transition={springs.tactile}
                        className={`w-full text-left p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-[#E3EED4]/70 border border-[#AEC3B0]/70"
                            : "hover:bg-[#E3EED4]/30 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                              isSelected
                                ? "bg-[#1B4332] text-white"
                                : "bg-[#AEC3B0]/50 text-[#0F2A1D]"
                            }`}
                          >
                            {machine.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold text-[#0F2A1D] leading-tight truncate">
                              {machine.name}
                            </div>
                            <div className="text-[10px] text-[#5B7060] leading-tight truncate mt-0.5">
                              {machine.tag} · {machine.rpm_nominal} RPM
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md ${statusColor}`}
                          >
                            {machine.status}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#1B4332]" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Section WORKSPACE Navigation Menu (Staggered Children & Shared Layout) */}
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[10.5px] font-bold text-[#6B9071] tracking-wider uppercase px-2 mb-1">
            WORKSPACE
          </span>

          <motion.nav
            variants={shouldReduceMotion ? undefined : containerStaggerFast}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1 relative"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <motion.button
                  key={item.id}
                  variants={shouldReduceMotion ? undefined : itemFadeUp}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.018, x: 2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.978 }}
                  transition={springs.tactile}
                  type="button"
                  onClick={() => onSelectMenu(item.id)}
                  className={`relative flex items-center justify-between px-3 py-2.5 rounded-2xl text-[12.5px] transition-colors cursor-pointer ${
                    isActive
                      ? "text-[#0F2A1D] font-bold"
                      : "text-[#375534] font-medium hover:text-[#0F2A1D]"
                  }`}
                >
                  {/* Shared Layout Active Indicator Pill */}
                  {isActive && (
                    <motion.span
                      layoutId="active-sidebar-pill"
                      className="absolute inset-0 bg-[#E3EED4] rounded-2xl border border-[#AEC3B0]/70 -z-10 shadow-2xs"
                      transition={shouldReduceMotion ? springs.reduced : springs.snappy}
                    />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? "text-[#375534]" : "text-[#6B9071]"
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </motion.nav>
        </div>
      </div>

      {/* Bagian Bawah: Card Vibra Assist, Menu Settings/Help, & User Profile */}
      <div className="flex flex-col gap-3 pt-3">
        {/* 4. Card "Vibra Assist" */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          className="bg-[#E3EED4] border border-[#AEC3B0]/80 rounded-[20px] p-3.5 flex flex-col gap-2 shadow-2xs transition-shadow hover:shadow-xs"
        >
          <div className="flex items-center gap-1.5 text-[#0F2A1D] font-bold text-[12.5px]">
            <Cpu className="w-3.5 h-3.5 text-[#375534] flex-shrink-0" />
            <span>Vibra Assist</span>
          </div>
          <p className="text-[11.5px] text-[#375534] leading-relaxed">
            Model aktif · F1 0.80. Rekomendasi ISO 20816 siap.
          </p>
          <motion.button
            {...buttonTapScale}
            type="button"
            onClick={() => onSelectMenu("model")}
            className="w-fit px-3 py-1 bg-white hover:bg-[#F3F7EE] text-[#0F2A1D] text-[11px] font-semibold rounded-full shadow-2xs border border-[#AEC3B0]/50 cursor-pointer mt-0.5"
          >
            Cek Model
          </motion.button>
        </motion.div>

        {/* 5. Sub-menu Bawah (Settings & Help) */}
        <div className="flex flex-col gap-0.5 px-1">
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { x: 3 }}
            transition={springs.tactile}
            type="button"
            onClick={() => setIsSensorModalOpen(true)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-[12px] font-medium text-[#5B7060] hover:text-[#0F2A1D] hover:bg-[#E3EED4]/30 transition-colors text-left cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#6B9071]" />
            <span>Sensor</span>
          </motion.button>
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { x: 3 }}
            transition={springs.tactile}
            type="button"
            onClick={() => setIsIsoModalOpen(true)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-[12px] font-medium text-[#5B7060] hover:text-[#0F2A1D] hover:bg-[#E3EED4]/30 transition-colors text-left cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#6B9071]" />
            <span>Panduan ISO</span>
          </motion.button>
          {onReplayIntro && (
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { x: 3 }}
              transition={springs.tactile}
              type="button"
              onClick={onReplayIntro}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-[12px] font-medium text-[#5B7060] hover:text-[#0F2A1D] hover:bg-[#E3EED4]/30 transition-colors text-left cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-[#6B9071]" />
              <span>Animasi Intro</span>
            </motion.button>
          )}
        </div>

        {/* 6. Footer Profil Pengguna */}
        <div className="pt-2.5 border-t border-[#AEC3B0]/60 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#AEC3B0] bg-[#4E5A4C] flex-shrink-0 shadow-2xs">
              <Image
                src={currentProfile.avatar}
                alt="Avatar Operator"
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-[#0F2A1D] leading-tight truncate">
                {currentProfile.name}
              </div>
              <div className="text-[10.5px] text-[#5B7060] leading-tight truncate mt-0.5">
                {currentProfile.role}
              </div>
            </div>
          </div>
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.15, rotate: 6 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            type="button"
            onClick={() => {
              const nextIndex =
                (USER_PROFILES.findIndex((p) => p.id === currentProfile.id) + 1) %
                USER_PROFILES.length;
              onSelectProfile?.(USER_PROFILES[nextIndex]);
            }}
            title="Ganti Akun Operator"
            className="text-[#6B9071] hover:text-[#0F2A1D] p-1 rounded-lg hover:bg-[#E3EED4]/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Modal Dialogs */}
      <SensorModal
        isOpen={isSensorModalOpen}
        onClose={() => setIsSensorModalOpen(false)}
        activeSensorPos={currentMachine.posisi_sensor}
      />

      <IsoGuideModal
        isOpen={isIsoModalOpen}
        onClose={() => setIsIsoModalOpen(false)}
      />
    </aside>
  );
}
