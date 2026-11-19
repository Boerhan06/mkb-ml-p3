"use client";

import Image from "next/image";
import {
  Activity,
  BarChart3,
  Layers,
  Cpu,
  ChevronDown,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  springs,
  containerStaggerFast,
  itemFadeUp,
  buttonTapScale,
} from "@/lib/motion";
import { HealthStatus } from "@/types/bearing";

interface SidebarProps {
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  health: HealthStatus | null;
}

export default function Sidebar({
  activeMenu,
  onSelectMenu,
  health,
}: SidebarProps) {
  const shouldReduceMotion = useReducedMotion();

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
    <aside className="relative z-20 w-64 lg:w-70 flex-shrink-0 m-3 lg:m-4 rounded-[28px] bg-white/95 backdrop-blur-xl border border-[#AEC3B0]/70 shadow-[0_12px_36px_-6px_rgba(15,42,29,0.07),0_4px_12px_-2px_rgba(15,42,29,0.03)] p-4 flex flex-col justify-between h-[calc(100vh-24px)] lg:h-[calc(100vh-32px)] overflow-y-auto select-none no-scrollbar">
      {/* Bagian Atas: Brand, Workspace Switcher, & Navigation Menu */}
      <div className="flex flex-col gap-4">
        {/* 1. Brand Logo */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.snappy}
          className="flex items-center gap-2.5 px-2 pt-1"
        >
          <div className="relative w-7 h-7 flex items-center justify-center flex-shrink-0">
            <span className="absolute left-0 w-4 h-4 rounded-full bg-[#6B9071]/70" />
            <span className="absolute right-0 w-4.5 h-4.5 rounded-full bg-[#375534]/85" />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-[#0F2A1D] lowercase">
            vibracheck
          </span>
        </motion.div>

        {/* 2. Workspace Selector Card */}
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { scale: 1.015, y: -1 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
          transition={springs.tactile}
          className="p-2 rounded-2xl bg-[#E3EED4]/40 hover:bg-[#E3EED4]/70 border border-[#AEC3B0]/50 flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#375534] text-[#E3EED4] flex items-center justify-center font-bold text-[13px] shadow-2xs flex-shrink-0">
              DE
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold text-[#0F2A1D] leading-tight truncate group-hover:text-[#375534]">
                Turbine Pump #04
              </div>
              <div className="text-[11px] text-[#5B7060] leading-tight mt-0.5 truncate">
                Drive End · DE-04B
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#6B9071] flex-shrink-0 mr-1" />
        </motion.div>

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
            <Sparkles className="w-3.5 h-3.5 text-[#375534] flex-shrink-0" />
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
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-[12px] font-medium text-[#5B7060] hover:text-[#0F2A1D] hover:bg-[#E3EED4]/30 transition-colors text-left cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#6B9071]" />
            <span>Sensor</span>
          </motion.button>
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { x: 3 }}
            transition={springs.tactile}
            type="button"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-[12px] font-medium text-[#5B7060] hover:text-[#0F2A1D] hover:bg-[#E3EED4]/30 transition-colors text-left cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#6B9071]" />
            <span>Panduan ISO</span>
          </motion.button>
        </div>

        {/* 6. Footer Profil Pengguna */}
        <div className="pt-2.5 border-t border-[#AEC3B0]/60 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#AEC3B0] bg-white flex-shrink-0">
              <Image
                src="/logo.jpg"
                alt="Avatar Operator"
                fill
                className="object-cover scale-125"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-[#0F2A1D] leading-tight truncate">
                Bayu Aji
              </div>
              <div className="text-[10.5px] text-[#5B7060] leading-tight truncate mt-0.5">
                Vibration Analyst
              </div>
            </div>
          </div>
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.15, rotate: 6 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            type="button"
            title="Keluar / Ganti Akun"
            className="text-[#6B9071] hover:text-[#0F2A1D] p-1 rounded-lg hover:bg-[#E3EED4]/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
