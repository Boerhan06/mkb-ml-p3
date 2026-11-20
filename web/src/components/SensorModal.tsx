"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Activity,
  Cpu,
  Wifi,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Gauge,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";

interface SensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSensorPos?: "drive_end" | "fan_end";
}

export default function SensorModal({
  isOpen,
  onClose,
  activeSensorPos = "drive_end",
}: SensorModalProps) {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close with Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handlePingSensor = () => {
    setIsPinging(true);
    setPingSuccess(false);
    setTimeout(() => {
      setIsPinging(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 3000);
    }, 700);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.gentle}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F2A1D]/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 14 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 10 }
            }
            transition={springs.snappy}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sensor-modal-title"
            className="relative w-full max-w-2xl bg-white/98 rounded-[24px] border border-[#AEC3B0] shadow-[0_20px_60px_-15px_rgba(15,42,29,0.30)] p-6 sm:p-7 flex flex-col gap-5 text-[#0F2A1D] z-10 my-auto"
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-[#AEC3B0]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E3EED4] border border-[#AEC3B0] flex items-center justify-center text-[#375534] flex-shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="sensor-modal-title"
                    className="text-[17px] font-bold text-[#0F2A1D] tracking-tight"
                  >
                    Konfigurasi & Spesifikasi Sensor
                  </h3>
                  <p className="text-[12px] text-[#375534] mt-0.5">
                    Modul Akuisisi Getaran DAQ 20 kHz & Akselerometer Industri
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#E3EED4]/60 text-[#5B7060] hover:text-[#0F2A1D] transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hardware Specification Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Card 1: Perangkat Keras */}
              <div className="bg-[#E3EED4]/35 border border-[#AEC3B0]/70 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#375534] uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-[#6B9071]" />
                  <span>Hardware Akselerometer</span>
                </div>
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between border-b border-[#AEC3B0]/40 pb-1">
                    <span className="text-[#5B7060]">Model Sensor</span>
                    <span className="font-semibold text-[#0F2A1D]">
                      ICP Triaxial Accelerometer
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#AEC3B0]/40 pb-1">
                    <span className="text-[#5B7060]">Sensitivitas</span>
                    <span className="font-semibold text-[#0F2A1D] tabular-nums">
                      100 mV/g (± 5%)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#AEC3B0]/40 pb-1">
                    <span className="text-[#5B7060]">Rentang Frekuensi</span>
                    <span className="font-semibold text-[#0F2A1D] tabular-nums">
                      0.5 Hz – 10.000 Hz
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B7060]">Batas Amplitudo</span>
                    <span className="font-semibold text-[#0F2A1D] tabular-nums">
                      ± 50 g Peak
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Pengolahan Sinyal DAQ */}
              <div className="bg-[#E3EED4]/35 border border-[#AEC3B0]/70 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#375534] uppercase tracking-wider">
                  <Gauge className="w-4 h-4 text-[#6B9071]" />
                  <span>Akuisisi Sinyal & FFT</span>
                </div>
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between border-b border-[#AEC3B0]/40 pb-1">
                    <span className="text-[#5B7060]">Frekuensi Sampling</span>
                    <span className="font-semibold text-[#375534] tabular-nums">
                      20.000 Hz (20 kHz)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#AEC3B0]/40 pb-1">
                    <span className="text-[#5B7060]">Resolusi ADC</span>
                    <span className="font-semibold text-[#0F2A1D] tabular-nums">
                      24-bit Delta-Sigma
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#AEC3B0]/40 pb-1">
                    <span className="text-[#5B7060]">Jendela FFT</span>
                    <span className="font-semibold text-[#0F2A1D]">
                      Hanning (Resolusi 0.25 Hz)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B7060]">Filter Digital</span>
                    <span className="font-semibold text-[#0F2A1D]">
                      Band-pass Butterworth Orde 4
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kanal Sensor Aktif & Kalibrasi */}
            <div className="bg-white border border-[#AEC3B0]/80 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#0F2A1D]">
                  <Wifi className="w-4 h-4 text-[#375534]" />
                  <span>Status Kanal Telemetri Sensor</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E3EED4] text-[#375534] text-[11px] font-semibold border border-[#AEC3B0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#375534] animate-pulse" />
                  DAQ Online
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                {/* DE Channel */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    activeSensorPos === "drive_end"
                      ? "bg-[#E3EED4]/60 border-[#375534]/50"
                      : "bg-[#F8FAF8] border-[#AEC3B0]/50"
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#0F2A1D] flex items-center gap-1.5">
                      <span>Drive End (DE)</span>
                      {activeSensorPos === "drive_end" && (
                        <span className="text-[10px] bg-[#375534] text-white px-1.5 py-0.2 rounded font-semibold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5B7060] mt-0.5">
                      SNR: 48.2 dB · Impedansi: 50 Ω
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#375534]" />
                </div>

                {/* FE Channel */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    activeSensorPos === "fan_end"
                      ? "bg-[#E3EED4]/60 border-[#375534]/50"
                      : "bg-[#F8FAF8] border-[#AEC3B0]/50"
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#0F2A1D] flex items-center gap-1.5">
                      <span>Fan End (FE)</span>
                      {activeSensorPos === "fan_end" && (
                        <span className="text-[10px] bg-[#375534] text-white px-1.5 py-0.2 rounded font-semibold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5B7060] mt-0.5">
                      SNR: 46.8 dB · Impedansi: 50 Ω
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#375534]" />
                </div>
              </div>
            </div>

            {/* Footer Aksi */}
            <div className="flex items-center justify-between pt-2 border-t border-[#AEC3B0]/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePingSensor}
                  disabled={isPinging}
                  className="px-3.5 py-2 rounded-xl bg-[#E3EED4] hover:bg-[#AEC3B0]/40 text-[#375534] text-[12px] font-semibold flex items-center gap-2 border border-[#AEC3B0]/70 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isPinging ? "animate-spin" : ""}`}
                  />
                  <span>
                    {isPinging
                      ? "Menguji Sinyal..."
                      : pingSuccess
                      ? "Sensor Responsif (OK)"
                      : "Uji Ping DAQ"}
                  </span>
                </button>
                {pingSuccess && (
                  <span className="text-[11.5px] font-medium text-[#375534] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Respons 2.1 ms · Sinyal Bersih
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#375534] hover:bg-[#0F2A1D] text-white text-[12px] font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
