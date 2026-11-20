"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Info,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";

interface IsoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IsoGuideModal({
  isOpen,
  onClose,
}: IsoGuideModalProps) {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

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

  const isoZones = [
    {
      zone: "Zona A",
      threshold: "< 1.8 mm/s",
      badge: "Sangat Baik",
      badgeColor: "bg-[#228B22]/15 text-[#228B22] border-[#228B22]/30",
      icon: CheckCircle,
      desc: "Getaran pada mesin baru ditugaskan atau selesai overhaul penuh. Bantalan beroperasi dengan kelonggaran optimal tanpa cacat.",
    },
    {
      zone: "Zona B",
      threshold: "1.8 – 4.5 mm/s",
      badge: "Dapat Diterima (Normal)",
      badgeColor: "bg-[#375534]/15 text-[#375534] border-[#375534]/30",
      icon: CheckCircle,
      desc: "Kondisi operasi wajar untuk pemakaian industri jangka panjang tanpa pembatasan waktu. Tidak diperlukan intervensi teknis.",
    },
    {
      zone: "Zona C",
      threshold: "4.5 – 7.1 mm/s",
      badge: "Waspada (Cacat Awal)",
      badgeColor: "bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30",
      icon: AlertTriangle,
      desc: "Getaran tidak memuaskan untuk jangka panjang. Mesin boleh beroperasi sementara; jadwalkan inspeksi mekanik pada shutdown terdekat.",
    },
    {
      zone: "Zona D",
      threshold: "> 7.1 mm/s",
      badge: "Kritis (Bahaya Total)",
      badgeColor: "bg-[#E05D44]/15 text-[#C84A32] border-[#E05D44]/30",
      icon: AlertOctagon,
      desc: "Getaran parah berisiko merusak struktur poros atau macet mendadak. Mesin harus segera dihentikan (emergency shutdown).",
    },
  ];

  const defectFrequencies = [
    {
      code: "BPFO",
      title: "Ball Pass Frequency Outer",
      desc: "Cincin luar bantalan. Cacat stasioner yang dilewati bola berputar.",
      formula: "BPFO = (N/2) · fr · (1 - (d/D)·cos α)",
    },
    {
      code: "BPFI",
      title: "Ball Pass Frequency Inner",
      desc: "Cincin dalam bantalan. Cacat berputar bersama poros dengan amplitudo termodulasi.",
      formula: "BPFI = (N/2) · fr · (1 + (d/D)·cos α)",
    },
    {
      code: "BSF",
      title: "Ball Spin Frequency",
      desc: "Elemen penggelinding (bola/roller). Spalling atau retak pada bola.",
      formula: "BSF = (D / 2d) · fr · (1 - ((d/D)·cos α)²)",
    },
    {
      code: "FTF",
      title: "Fundamental Train Frequency",
      desc: "Sangkar bantalan (cage). Keausan dudukan elemen bola pada sangkar.",
      formula: "FTF = (fr / 2) · (1 - (d/D)·cos α)",
    },
  ];

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
            aria-labelledby="iso-modal-title"
            className="relative w-full max-w-3xl bg-white/98 rounded-[24px] border border-[#AEC3B0] shadow-[0_20px_60px_-15px_rgba(15,42,29,0.30)] p-6 sm:p-7 flex flex-col gap-5 text-[#0F2A1D] z-10 my-auto max-h-[90vh] overflow-y-auto"
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-[#AEC3B0]/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E3EED4] border border-[#AEC3B0] flex items-center justify-center text-[#375534] flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="iso-modal-title"
                    className="text-[17px] font-bold text-[#0F2A1D] tracking-tight"
                  >
                    Panduan Standar Evaluasi Getaran ISO 20816-3
                  </h3>
                  <p className="text-[12px] text-[#375534] mt-0.5">
                    Kriteria Evaluasi Getaran Mesin Industri (Group 1 & 2, Daya &gt; 15 kW)
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

            {/* Matrix 4 Zona ISO 20816 */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#0F2A1D] uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-[#375534]" />
                <span>Matriks 4 Zona Keparahan Getaran (Vibration Severity)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isoZones.map((z) => {
                  const IconComp = z.icon;
                  return (
                    <div
                      key={z.zone}
                      className="bg-[#E3EED4]/30 border border-[#AEC3B0]/70 rounded-2xl p-3.5 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4 text-[#375534] flex-shrink-0" />
                          <span className="font-bold text-[13px] text-[#0F2A1D]">
                            {z.zone}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border tabular-nums whitespace-nowrap ${z.badgeColor}`}
                        >
                          {z.threshold}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[#375534] leading-relaxed">
                        {z.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Frekuensi Karakteristik Cacat Bantalan */}
            <div className="bg-[#E3EED4]/30 border border-[#AEC3B0]/70 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#0F2A1D]">
                <Info className="w-4 h-4 text-[#375534]" />
                <span>Frekuensi Cacat Karakteristik Bantalan (Kinematika FFT)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {defectFrequencies.map((df) => (
                  <div
                    key={df.code}
                    className="p-3 bg-white/90 border border-[#AEC3B0]/60 rounded-xl flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[12px] text-[#0F2A1D]">
                        {df.code} · {df.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5B7060]">
                      {df.desc}
                    </div>
                    <code className="text-[10.5px] text-[#375534] font-mono bg-[#E3EED4]/50 px-2 py-0.5 rounded mt-0.5 w-fit border border-[#AEC3B0]/40">
                      {df.formula}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Aksi */}
            <div className="flex items-center justify-between pt-2 border-t border-[#AEC3B0]/60 flex-shrink-0">
              <span className="text-[11.5px] text-[#5B7060]">
                Referensi: ISO 20816-3:2018 Standard for Industrial Machines
              </span>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#375534] hover:bg-[#0F2A1D] text-white text-[12px] font-semibold transition-colors cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
