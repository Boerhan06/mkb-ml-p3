"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";
import { PredictionResponse, SensorInput } from "@/types/bearing";

interface DiagnosisCardProps {
  prediction: PredictionResponse;
  sensorInput: SensorInput;
  isLoading: boolean;
}

export default function DiagnosisCard({
  prediction,
  sensorInput,
  isLoading,
}: DiagnosisCardProps) {
  const [timestamp, setTimestamp] = useState<string>("");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Generate localized Indonesian timestamp
    const now = new Date();
    setTimestamp(
      now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
        " · " +
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " WIB"
    );
  }, [prediction]);

  const { kelas_prediksi, keyakinan, distribusi_probabilitas } = prediction;

  // Visual status config
  let title = "Kondisi Normal";
  let description =
    "Getaran bantalan masih dalam batas aman ISO 20816. Lanjutkan pemantauan rutin.";

  if (kelas_prediksi === "Ball Fault") {
    title = "Ball Fault Terdeteksi";
    description =
      "Terdeteksi impuls getaran repetitif pada elemen gelinding bola bearing (BSF). Risiko macet poros tinggi.";
  } else if (kelas_prediksi === "Outer Race") {
    title = "Cacat Outer Race Terdeteksi";
    description =
      "Terdeteksi lonjakan getaran pada lintasan cincin luar (BPFO). Permukaan alur luar mulai mengalami keausan.";
  } else if (kelas_prediksi === "Inner Race") {
    title = "Cacat Inner Race Terdeteksi";
    description =
      "Energi getaran dominan terpusat pada cincin dalam poros (BPFI). Alur putar bantalan mengalami deformasi.";
  }

  // Persentase probabilitas
  const pNormal = Math.round((distribusi_probabilitas?.Normal || 0) * 100);
  const pOuter = Math.round((distribusi_probabilitas?.["Outer Race"] || 0) * 100);
  const pInner = Math.round((distribusi_probabilitas?.["Inner Race"] || 0) * 100);
  const pBall = Math.round((distribusi_probabilitas?.["Ball Fault"] || 0) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="relative overflow-hidden shrink-0 w-full rounded-[24px] bg-gradient-to-br from-[#1B4332] via-[#22533E] to-[#163829] p-6 lg:p-7 pb-8 lg:pb-10 shadow-[0_16px_40px_-8px_rgba(27,67,50,0.35),0_4px_12px_-2px_rgba(27,67,50,0.2)] hover:shadow-[0_20px_48px_-6px_rgba(27,67,50,0.45)] transition-all duration-300 border border-[#37694E]/80 text-white select-none"
    >
      {/* Cityscape Skyline Silhouette Vector at Bottom of Card */}
      <div className="absolute inset-x-0 bottom-0 h-32 sm:h-36 lg:h-40 pointer-events-none select-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 1000 130"
          preserveAspectRatio="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer 1: Background Skyline (Siluet Gedung Lapis Belakang - Sage Muted) */}
          <path
            d="M0,130 L0,74 L42,74 L42,65 L80,65 L80,82 L115,82 L115,60 L145,60 L145,80 L180,80 L180,56 L235,56 L235,80 L295,80 L295,52 L345,52 L345,46 L395,46 L395,78 L435,78 L435,48 L480,48 L480,36 L545,36 L545,76 L600,76 L600,54 L635,54 L635,62 L670,62 L670,78 L735,78 L735,58 L775,58 L775,50 L810,50 L810,22 L885,22 L885,76 L920,76 L920,46 L970,46 L970,78 L1000,78 L1000,130 Z"
            fill="#6B9071"
            fillOpacity="0.32"
          />

          {/* Layer 2: Foreground Skyline (Siluet Gedung Utama Sesuai Referensi - Deep Moss Geometric) */}
          <path
            d="M0,130 L0,84 L28,84 L28,70 L72,70 L72,88 L85,88 L85,68 L118,68 L118,130 L128,130 L128,82 L128,54 L154,64 L168,88 L190,88 L190,56 L252,56 L252,98 L268,98 L268,74 L308,74 L308,66 L342,66 L342,130 L354,130 L354,84 L398,84 L398,130 L412,130 L412,68 L446,68 L446,130 L464,130 L464,54 L498,54 L498,42 L538,42 L538,38 L544,38 L544,33 L548,33 L548,38 L558,38 L558,48 L578,48 L578,130 L592,130 L592,76 L628,60 L652,60 L652,130 L666,130 L666,80 L696,80 L696,68 L724,68 L724,130 L738,130 L738,62 L778,62 L778,50 L832,50 L832,64 L848,64 L848,130 L862,130 L862,76 L892,76 L892,52 L934,52 L934,70 L968,70 L968,130 L1000,130 Z"
            fill="#326346"
            fillOpacity="0.58"
          />

          {/* Subtle Bottom Ambient Gradient */}
          <rect
            x="0"
            y="88"
            width="1000"
            height="42"
            fill="url(#skylineBaseFade)"
          />
          <defs>
            <linearGradient id="skylineBaseFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B4332" stopOpacity="0" />
              <stop offset="100%" stopColor="#163829" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri (60% ~ col-span-7) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {isLoading ? (
            <div className="flex flex-col space-y-3.5 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="h-8 sm:h-9 w-64 sm:w-80 rounded-xl bg-[#E3EED4]/20" />
                <span className="text-[11.5px] font-semibold text-[#AEC3B0] bg-[#375534]/50 border border-[#6B9071]/40 px-2.5 py-0.5 rounded-lg">
                  Menganalisis...
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-4 w-full max-w-xl rounded-md bg-[#AEC3B0]/15" />
                <div className="h-4 w-3/4 max-w-md rounded-md bg-[#AEC3B0]/15" />
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <div className="h-6 w-28 rounded-lg bg-[#375534]/60 border border-[#6B9071]/40" />
                <span className="text-[#6B9071]">•</span>
                <div className="h-4 w-32 rounded bg-[#AEC3B0]/15" />
                <span className="text-[#6B9071]">•</span>
                <div className="h-6 w-32 rounded-lg bg-[#375534]/60 border border-[#6B9071]/40" />
              </div>
            </div>
          ) : (
            <>
              {/* AnimatePresence for Smooth Status Change Transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={kelas_prediksi}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={springs.snappy}
                  className="flex flex-col space-y-3"
                >
                  <h2 className="text-[30px] sm:text-[34px] leading-tight font-bold tracking-tight text-[#E3EED4]">
                    {title}
                  </h2>

                  <p className="text-[14px] sm:text-[14.5px] font-normal text-[#AEC3B0] leading-relaxed max-w-2xl">
                    {prediction.rekomendasi?.tindakan || description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Bottom Pills Row with Micro-Interactions */}
              <div className="pt-2 text-[12px] font-normal text-[#AEC3B0] flex flex-wrap items-center gap-2 tabular-nums">
                <motion.span
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                  transition={springs.tactile}
                  className="text-[#E3EED4] font-semibold bg-[#375534]/60 border border-[#6B9071]/50 px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  Keyakinan {(keyakinan * 100).toFixed(1)}%
                </motion.span>
                <span className="text-[#6B9071]">•</span>
                <span className="text-[#AEC3B0]">{timestamp}</span>
                <span className="text-[#6B9071]">•</span>
                <motion.span
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                  transition={springs.tactile}
                  className="font-semibold text-[#E3EED4] bg-[#375534]/60 border border-[#6B9071]/50 px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  Dominan {sensorInput.frekuensi_dominan_hz.toFixed(1)} Hz
                </motion.span>
              </div>
            </>
          )}
        </div>

        {/* Kolom Kanan (40% ~ col-span-5): Distribusi Probabilitas with Spring Progress Bars */}
        <div className="lg:col-span-5 bg-[#143828]/60 backdrop-blur-sm border border-[#2D5A43] rounded-2xl p-4.5 flex flex-col space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-[#2D5A43]">
            <span className="text-[12.5px] font-bold text-[#E3EED4]">
              Probabilitas
            </span>
            <span className="text-[11.5px] text-[#AEC3B0] tabular-nums font-medium">
              Random Forest
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col space-y-3.5 py-0.5 animate-pulse">
              {[
                { name: "Normal", w: "65%" },
                { name: "Outer Race (BPFO)", w: "20%" },
                { name: "Inner Race (BPFI)", w: "25%" },
                { name: "Ball Fault (BSF)", w: "45%" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col space-y-1.5">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[#AEC3B0]/70 font-medium">{item.name}</span>
                    <div className="h-3 w-8 rounded bg-[#E3EED4]/20" />
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0F2A1D]/80 border border-[#375534]/60 overflow-hidden">
                    <div
                      style={{ width: item.w }}
                      className="h-full rounded-full bg-[#6B9071]/40"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Normal */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-[#AEC3B0] font-medium">Normal</span>
                  <span className="text-[#E3EED4] font-semibold tabular-nums">{pNormal}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0F2A1D]/80 border border-[#375534]/60 overflow-hidden">
                  <motion.div
                    style={{ originX: 0 }}
                    className="w-full h-full rounded-full bg-[#AEC3B0] shadow-xs"
                    initial={false}
                    animate={{ scaleX: pNormal / 100 }}
                    transition={shouldReduceMotion ? springs.reduced : springs.snappy}
                  />
                </div>
              </div>

              {/* Outer Race */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <span
                    title="BPFO (Ball Pass Frequency Outer): Frekuensi cacat pada lintasan cincin luar"
                    className={`cursor-help border-b border-dotted border-current ${
                      pOuter > 50 ? "text-[#FDE68A] font-semibold" : "text-[#AEC3B0] font-medium"
                    }`}
                  >
                    Outer Race (BPFO)
                  </span>
                  <span className={`font-semibold tabular-nums ${pOuter > 50 ? "text-[#FDE68A]" : "text-[#E3EED4]"}`}>
                    {pOuter}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0F2A1D]/80 border border-[#375534]/60 overflow-hidden">
                  <motion.div
                    style={{ originX: 0 }}
                    className={`w-full h-full rounded-full ${
                      pOuter > 50 ? "bg-[#F59E0B]" : "bg-[#6B9071]"
                    }`}
                    initial={false}
                    animate={{ scaleX: pOuter / 100 }}
                    transition={shouldReduceMotion ? springs.reduced : springs.snappy}
                  />
                </div>
              </div>

              {/* Inner Race */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <span
                    title="BPFI (Ball Pass Frequency Inner): Frekuensi cacat pada alur putar cincin dalam"
                    className={`cursor-help border-b border-dotted border-current ${
                      pInner > 50 ? "text-[#FDE68A] font-semibold" : "text-[#AEC3B0] font-medium"
                    }`}
                  >
                    Inner Race (BPFI)
                  </span>
                  <span className={`font-semibold tabular-nums ${pInner > 50 ? "text-[#FDE68A]" : "text-[#E3EED4]"}`}>
                    {pInner}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0F2A1D]/80 border border-[#375534]/60 overflow-hidden">
                  <motion.div
                    style={{ originX: 0 }}
                    className={`w-full h-full rounded-full ${
                      pInner > 50 ? "bg-[#F59E0B]" : "bg-[#6B9071]"
                    }`}
                    initial={false}
                    animate={{ scaleX: pInner / 100 }}
                    transition={shouldReduceMotion ? springs.reduced : springs.snappy}
                  />
                </div>
              </div>

              {/* Ball Fault */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <span
                    title="BSF (Ball Spin Frequency): Frekuensi cacat impuls rotasi bola bearing"
                    className={`cursor-help border-b border-dotted border-current ${
                      pBall > 50 ? "text-[#FDE68A] font-semibold" : "text-[#AEC3B0] font-medium"
                    }`}
                  >
                    Ball Fault (BSF)
                  </span>
                  <span className={`font-semibold tabular-nums ${pBall > 50 ? "text-[#FDE68A]" : "text-[#E3EED4]"}`}>
                    {pBall}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0F2A1D]/80 border border-[#375534]/60 overflow-hidden">
                  <motion.div
                    style={{ originX: 0 }}
                    className={`w-full h-full rounded-full ${
                      pBall > 50 ? "bg-[#F59E0B]" : "bg-[#6B9071]"
                    }`}
                    initial={false}
                    animate={{ scaleX: pBall / 100 }}
                    transition={shouldReduceMotion ? springs.reduced : springs.snappy}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.section>
  );
}
