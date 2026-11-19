"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  Play,
  Pause,
  RotateCcw,
  Activity,
  TrendingUp,
  Waves,
} from "lucide-react";
import {
  generateSpectrumData,
  generateTrendData,
  SpectrumPoint,
  TrendPoint,
} from "@/lib/chartData";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";
import { ScenarioPreset, SensorInput } from "@/types/bearing";

interface SpectrumChartProps {
  activePreset: ScenarioPreset;
  sensorInput: SensorInput;
}

type ChartTab = "waterfall" | "trend" | "spectrum2d";
type TrendRange = "24h" | "7d" | "30d";

export default function SpectrumChart({
  activePreset,
  sensorInput,
}: SpectrumChartProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>("waterfall");
  const [trendRange, setTrendRange] = useState<TrendRange>("7d");
  const [isStreaming, setIsStreaming] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Canvas ref untuk waterfall spektrogram
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Buffer waterfall matrix: 34 baris waktu x 100 bin frekuensi
  const ROWS = 34;
  const COLS = 100;
  const waterfallBuffer = useRef<number[][]>([]);

  // 2D data
  const [spectrumData, setSpectrumData] = useState<SpectrumPoint[]>([]);

  // Hover state canvas
  const [hoverInfo, setHoverInfo] = useState<{
    freq: number;
    timeAgo: number;
    amp: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Inisialisasi buffer waterfall
  useEffect(() => {
    const initBuffer: number[][] = [];
    const peakG = sensorInput.puncak_g;
    const dominantHz = sensorInput.frekuensi_dominan_hz;

    for (let r = 0; r < ROWS; r++) {
      const row: number[] = [];
      const rowAging = 1 - (r / ROWS) * 0.2; // Sedikit redaman di baris lama
      for (let c = 0; c < COLS; c++) {
        const freq = (c / COLS) * 2000;
        let val = 0.04 + Math.sin(freq * 0.04 + r) * 0.02 + Math.random() * 0.03;

        // Puncak harmonik
        if (Math.abs(freq - dominantHz) < 24) {
          val = peakG * (0.85 + Math.random() * 0.15) * rowAging;
        } else if (Math.abs(freq - dominantHz * 2) < 28 && activePreset !== "Normal") {
          val = peakG * 0.45 * rowAging;
        } else if (Math.abs(freq - dominantHz * 3) < 32 && activePreset !== "Normal") {
          val = peakG * 0.25 * rowAging;
        } else if (Math.abs(freq - 49.35) < 18) {
          val += 0.35; // 1X RPM shaft
        }

        if (activePreset === "Normal") {
          val = Math.min(val, 0.38);
        }
        row.push(val);
      }
      initBuffer.push(row);
    }
    waterfallBuffer.current = initBuffer;
  }, [activePreset, sensorInput]);

  // Update 2D data
  useEffect(() => {
    const pts = generateSpectrumData(
      activePreset,
      sensorInput.frekuensi_dominan_hz,
      sensorInput.puncak_g
    );
    setSpectrumData(pts);
  }, [activePreset, sensorInput]);

  // Trend data
  const trendData = useMemo(() => {
    return generateTrendData(
      activePreset,
      sensorInput.puncak_g,
      sensorInput.rms_g,
      trendRange
    );
  }, [activePreset, sensorInput.puncak_g, sensorInput.rms_g, trendRange]);

  // Fungsi mapping nilai getaran ke warna heatmap
  const getHeatmapColor = (val: number, maxG: number): string => {
    const norm = Math.min(1, Math.max(0, val / Math.max(1.8, maxG)));

    if (norm < 0.18) {
      // Background sangat rendah: Deep forest green
      const t = norm / 0.18;
      const r = Math.round(15 + t * 16);
      const g = Math.round(42 + t * 27);
      const b = Math.round(29 + t * 19);
      return `rgb(${r},${g},${b})`;
    } else if (norm < 0.45) {
      // Rendah-menengah: Moss to Sage
      const t = (norm - 0.18) / 0.27;
      const r = Math.round(31 + t * 76);
      const g = Math.round(69 + t * 75);
      const b = Math.round(48 + t * 65);
      return `rgb(${r},${g},${b})`;
    } else if (norm < 0.72) {
      // Menengah-tinggi: Golden Amber / Ochre
      const t = (norm - 0.45) / 0.27;
      const r = Math.round(107 + t * 138);
      const g = Math.round(144 + t * 24);
      const b = Math.round(113 - t * 84);
      return `rgb(${r},${g},${b})`;
    } else {
      // Puncak kritis: Terracotta Red to Bright Coral Peach
      const t = (norm - 0.72) / 0.28;
      const r = Math.round(224 + t * 24);
      const g = Math.round(93 + t * 57);
      const b = Math.round(68 + t * 48);
      return `rgb(${r},${g},${b})`;
    }
  };

  // Loop Render Canvas Waterfall Spektrogram
  useEffect(() => {
    if (activeTab !== "waterfall") return;

    let isRunning = true;
    const intervalMs = 220; // Frekuensi push baris waktu baru

    const render = (time: number) => {
      if (!isRunning) return;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Push baris baru jika streaming aktif
          if (isStreaming && time - lastTimeRef.current > intervalMs) {
            lastTimeRef.current = time;

            const newRow: number[] = [];
            const peakG = sensorInput.puncak_g;
            const dominantHz = sensorInput.frekuensi_dominan_hz;

            for (let c = 0; c < COLS; c++) {
              const freq = (c / COLS) * 2000;
              let val = 0.04 + Math.sin(freq * 0.04 + time * 0.002) * 0.02 + Math.random() * 0.035;

              // Puncak harmonik
              if (Math.abs(freq - dominantHz) < 24) {
                val = peakG * (0.88 + Math.random() * 0.14);
              } else if (Math.abs(freq - dominantHz * 2) < 28 && activePreset !== "Normal") {
                val = peakG * 0.42 * (0.9 + Math.random() * 0.2);
              } else if (Math.abs(freq - dominantHz * 3) < 32 && activePreset !== "Normal") {
                val = peakG * 0.22 * (0.9 + Math.random() * 0.2);
              } else if (Math.abs(freq - 49.35) < 18) {
                val += 0.32 + Math.random() * 0.05;
              }

              if (activePreset === "Normal") {
                val = Math.min(val, 0.36);
              }
              newRow.push(val);
            }

            // Geser baris ke bawah
            waterfallBuffer.current.unshift(newRow);
            if (waterfallBuffer.current.length > ROWS) {
              waterfallBuffer.current.pop();
            }
          }

          // Gambar latar
          ctx.fillStyle = "#0F2A1D";
          ctx.fillRect(0, 0, width, height);

          // Gambar sel-sel heatmap spektrogram
          const cellWidth = width / COLS;
          const cellHeight = height / ROWS;
          const maxG = Math.max(1.8, sensorInput.puncak_g * 1.05);

          const buffer = waterfallBuffer.current;
          for (let r = 0; r < buffer.length; r++) {
            const row = buffer[r];
            const y = r * cellHeight;
            for (let c = 0; c < row.length; c++) {
              const x = c * cellWidth;
              const val = row[c];
              ctx.fillStyle = getHeatmapColor(val, maxG);
              ctx.fillRect(x, y, cellWidth + 0.6, cellHeight + 0.6);
            }
          }

          // Garis kisi waktu & frekuensi halus
          ctx.strokeStyle = "rgba(227, 238, 212, 0.12)";
          ctx.lineWidth = 1;

          // Garis frekuensi vertikal tiap 400 Hz (5 grid)
          for (let f = 400; f <= 1600; f += 400) {
            const gx = (f / 2000) * width;
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, height);
            ctx.stroke();
          }

          // Garis waktu horizontal tiap 8 baris
          for (let r = 8; r < ROWS; r += 8) {
            const gy = r * cellHeight;
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(width, gy);
            ctx.stroke();
          }

          // Indikator frekuensi dominan (garis putus-putus tegak di puncak)
          const peakX = (sensorInput.frekuensi_dominan_hz / 2000) * width;
          ctx.strokeStyle = "rgba(248, 150, 116, 0.75)";
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(peakX, 0);
          ctx.lineTo(peakX, height);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeTab, isStreaming, sensorInput, activePreset]);

  // Handle mouse move di atas canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colIndex = Math.min(COLS - 1, Math.max(0, Math.floor((x / rect.width) * COLS)));
    const rowIndex = Math.min(ROWS - 1, Math.max(0, Math.floor((y / rect.height) * ROWS)));

    const freq = (colIndex / COLS) * 2000;
    const timeAgo = rowIndex * 0.25; // detik
    const amp = waterfallBuffer.current[rowIndex]?.[colIndex] || 0;

    setHoverInfo({
      freq,
      timeAgo,
      amp,
      x,
      y,
    });
  };

  const handleCanvasMouseLeave = () => {
    setHoverInfo(null);
  };

  if (!isMounted) {
    return (
      <div className="w-full h-80 rounded-[22px] bg-white/95 backdrop-blur-sm p-6 shadow-sm border border-[#AEC3B0]/70 flex flex-col justify-between animate-pulse">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#AEC3B0]/40">
          <div className="space-y-1.5">
            <div className="h-5 w-40 rounded-lg bg-[#375534]/15" />
            <div className="h-3.5 w-60 rounded-md bg-[#6B9071]/15" />
          </div>
          <div className="h-8 w-48 rounded-xl bg-[#E3EED4]/60" />
        </div>
        <div className="flex-1 flex items-end gap-2 pt-6 pb-2">
          {[40, 25, 60, 30, 80, 45, 90, 35, 70, 50, 65, 30, 40].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className="flex-1 rounded-t bg-[#375534]/10"
            />
          ))}
        </div>
        <div className="flex justify-between pt-2 border-t border-[#AEC3B0]/40">
          <div className="h-3 w-32 rounded bg-[#6B9071]/15" />
          <div className="h-3 w-24 rounded bg-[#375534]/15" />
        </div>
      </div>
    );
  }

  const peakPoint = spectrumData.find((d) => d.isPeak) || {
    freq: sensorInput.frekuensi_dominan_hz,
    amp: sensorInput.puncak_g,
  };

  return (
    <div className="w-full h-full bg-white/95 backdrop-blur-sm rounded-[22px] p-5 sm:p-6 shadow-[0_10px_30px_-5px_rgba(15,42,29,0.06),0_4px_12px_-2px_rgba(15,42,29,0.03)] hover:shadow-[0_16px_36px_-4px_rgba(15,42,29,0.10)] transition-all duration-300 border border-[#AEC3B0]/70 flex flex-col justify-between">
      {/* 1. Header Bar: Title, Subtitle, & View Switcher Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[#AEC3B0]/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0F2A1D] tracking-tight">
              {activeTab === "waterfall"
                ? "Spektrogram Waterfall"
                : activeTab === "trend"
                  ? "Tren Amplitudo"
                  : "Spektrum Envelope"}
            </h3>
            {activeTab === "waterfall" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#E3EED4] text-[#0F2A1D] border border-[#6B9071]/40">
                <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-[#10B981] animate-ping" : "bg-[#6B9071]"}`} />
                {isStreaming ? "20 kHz" : "Dijeda"}
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#375534] mt-0.5">
            {activeTab === "waterfall"
              ? "Heatmap intensitas frekuensi getaran terhadap waktu."
              : activeTab === "trend"
                ? "Riwayat amplitudo getaran terhadap batas aman ISO 20816."
                : "Distribusi amplitudo frekuensi 0-2.000 Hz."}
          </p>
        </div>

        {/* 2-Word Title Case Button Switcher with Shared Layout Indicator */}
        <div className="flex items-center gap-1.5 bg-[#E3EED4]/60 p-1 rounded-xl border border-[#AEC3B0]/70 self-start lg:self-auto select-none relative">
          {[
            { id: "waterfall" as ChartTab, label: "Waterfall", icon: Waves },
            { id: "trend" as ChartTab, label: "Tren", icon: TrendingUp },
            { id: "spectrum2d" as ChartTab, label: "Spektrum", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                transition={springs.tactile}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${isActive
                  ? "text-[#E3EED4]"
                  : "text-[#375534] hover:text-[#0F2A1D]"
                  }`}
              >
                {/* Shared Layout Active Indicator Pill */}
                {isActive && (
                  <motion.span
                    layoutId="active-spectrum-tab"
                    className="absolute inset-0 bg-[#0F2A1D] rounded-lg -z-10 shadow-xs"
                    transition={shouldReduceMotion ? springs.reduced : springs.snappy}
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. Content Area Sesuai Tab Aktif with AnimatePresence */}
      <div className="w-full flex-1 min-h-[300px] select-none pt-3 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={springs.snappy}
            className="w-full h-full"
          >
            {/* ===================== TAB 1: WATERFALL SPECTROGRAM ===================== */}
            {activeTab === "waterfall" && (
              <div className="w-full flex flex-col space-y-2.5">
                {/* Top Metrics & Waterfall Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#375534] font-medium">Puncak Spektrum:</span>
                    <span className={`font-semibold tabular-nums ${peakPoint.amp >= 1.2 ? "text-[#E05D44]" : "text-[#0F2A1D]"}`}>
                      {peakPoint.amp.toFixed(2)} g pk
                    </span>
                    <span className="text-[#6B9071] tabular-nums">({peakPoint.freq.toFixed(1)} Hz)</span>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsStreaming(!isStreaming)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-[#AEC3B0] text-[#0F2A1D] hover:bg-[#E3EED4]/60 transition-colors shadow-2xs"
                    >
                      {isStreaming ? (
                        <>
                          <Pause className="w-3 h-3 text-[#E05D44]" /> Jeda Stream
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-[#10B981]" /> Lanjut Stream
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        waterfallBuffer.current = [];
                      }}
                      title="Reset riwayat waterfall"
                      className="p-1 rounded-md bg-white border border-[#AEC3B0] text-[#375534] hover:bg-[#E3EED4]/60 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Waterfall Display Box */}
                <div className="relative w-full rounded-xl overflow-hidden border border-[#375534]/60 bg-[#0F2A1D] shadow-inner">
                  <div className="relative w-full h-[220px]">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={220}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseLeave={handleCanvasMouseLeave}
                      className="w-full h-full block cursor-crosshair"
                    />

                    {/* Sumbu Waktu Vertikal (Kiri) */}
                    <div className="absolute left-1.5 inset-y-0 flex flex-col justify-between py-1 text-[9.5px] font-mono text-[#AEC3B0]/80 pointer-events-none select-none">
                      <span>Kini (0s)</span>
                      <span>-2.0s</span>
                      <span>-4.5s</span>
                      <span>-7.0s</span>
                    </div>

                    {/* Label Puncak Dominan Vertikal */}
                    <div
                      className="absolute top-1 pointer-events-none select-none text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#0F2A1D]/90 border border-[#F89674] text-[#F89674] -translate-x-1/2 shadow-xs transition-all duration-300"
                      style={{
                        left: `${Math.min(90, Math.max(10, (sensorInput.frekuensi_dominan_hz / 2000) * 100))}%`,
                      }}
                    >
                      ▼ {sensorInput.frekuensi_dominan_hz.toFixed(0)} Hz
                    </div>

                    {/* Hover Tooltip Floating */}
                    {hoverInfo && (
                      <div
                        className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-[#0F2A1D]/95 backdrop-blur-md border border-[#6B9071] text-white px-2.5 py-1.5 rounded-lg shadow-xl text-[11px] font-mono whitespace-nowrap"
                        style={{ left: hoverInfo.x, top: hoverInfo.y }}
                      >
                        <div className="text-[#E3EED4] font-bold">
                          {hoverInfo.freq.toFixed(0)} Hz
                        </div>
                        <div className="text-[#AEC3B0] text-[10px]">
                          t - {hoverInfo.timeAgo.toFixed(1)}s ·{" "}
                          <span className={hoverInfo.amp >= 1.2 ? "text-[#F89674] font-semibold" : "text-[#E3EED4]"}>
                            {hoverInfo.amp.toFixed(2)} g pk
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sumbu Frekuensi Bawah (Horizontal) */}
                  <div className="w-full bg-[#081810] px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-[#AEC3B0] border-t border-[#375534]/50">
                    <span>0 Hz</span>
                    <span>400 Hz</span>
                    <span>800 Hz</span>
                    <span>1200 Hz</span>
                    <span>1600 Hz</span>
                    <span>2000 Hz</span>
                  </div>
                </div>

                {/* Colorbar Heatmap Legend */}
                <div className="w-full flex items-center justify-between text-[11px] text-[#375534] pt-1">
                  <span className="font-medium text-[#6B9071]">Intensitas Getaran:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#6B9071] font-mono">0.0 g (Dasar)</span>
                    <div className="w-32 sm:w-44 h-2 rounded-full bg-gradient-to-r from-[#0F2A1D] via-[#6B9071] via-[#E5A83B] to-[#E05D44] border border-[#AEC3B0]/70" />
                    <span className="text-[10px] font-mono text-[#E05D44] font-semibold">
                      &gt; {Math.max(2.0, sensorInput.puncak_g).toFixed(1)} g pk
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 2: VIBRATION TREND OVER TIME ===================== */}
            {activeTab === "trend" && (
              <div className="w-full flex flex-col space-y-3">
                {/* Time Window Switcher & Trend Summary */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#375534] font-medium">Laju Degradasi:</span>
                    <span className={`font-semibold ${activePreset !== "Normal" ? "text-[#E05D44]" : "text-[#10B981]"}`}>
                      {activePreset !== "Normal" ? "+0.38 g / hari (Memburuk)" : "Stabil (< 0.02 g / hari)"}
                    </span>
                  </div>

                  {/* 2-Word Buttons for Time Range */}
                  <div className="flex items-center gap-1 bg-[#E3EED4]/60 p-0.5 rounded-lg border border-[#AEC3B0]/70">
                    {(["24h", "7d", "30d"] as TrendRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTrendRange(range)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${trendRange === range
                          ? "bg-[#0F2A1D] text-[#E3EED4] shadow-xs"
                          : "text-[#375534] hover:text-[#0F2A1D]"
                          }`}
                      >
                        {range === "24h" ? "24 Jam" : range === "7d" ? "7 Hari" : "30 Hari"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recharts Area Chart for Trend */}
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 12, right: 15, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendPeakGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E05D44" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#E05D44" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="trendRmsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6B9071" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#6B9071" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#E3EED4" vertical={false} />
                      <XAxis
                        dataKey="timeLabel"
                        tickLine={false}
                        stroke="#6B9071"
                        fontSize={11}
                        tickMargin={6}
                      />
                      <YAxis
                        tickLine={false}
                        stroke="#6B9071"
                        fontSize={11}
                        domain={[0, Math.max(3.0, Math.ceil(sensorInput.puncak_g * 1.15))]}
                        tickMargin={6}
                        unit=" g"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as TrendPoint;
                            return (
                              <div className="bg-[#0F2A1D]/95 backdrop-blur-md border border-[#375534] text-white p-2.5 rounded-xl shadow-xl text-[12px] space-y-1">
                                <div className="font-bold text-[#E3EED4] border-b border-[#375534] pb-1">
                                  {d.timeLabel} {d.event ? `· ${d.event}` : ""}
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-[#AEC3B0]">Puncak:</span>
                                  <span className={`font-semibold tabular-nums ${d.peakG >= 1.2 ? "text-[#F89674]" : "text-[#E3EED4]"}`}>
                                    {d.peakG.toFixed(2)} g pk
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-[#AEC3B0]">RMS:</span>
                                  <span className="font-semibold text-[#E3EED4] tabular-nums">
                                    {d.rmsG.toFixed(3)} g
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4 pt-1 border-t border-[#375534]/60 text-[11px]">
                                  <span className="text-[#AEC3B0]">Zona ISO:</span>
                                  <span className={`font-bold ${d.isoZone === "D"
                                    ? "text-[#F89674]"
                                    : d.isoZone === "C"
                                      ? "text-[#F59E0B]"
                                      : "text-[#10B981]"
                                    }`}>
                                    Zona {d.isoZone}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      {/* Garis Ambang Batas ISO 20816 */}
                      <ReferenceLine
                        y={1.2}
                        stroke="#E05D44"
                        strokeDasharray="4 4"
                        label={{
                          value: "Ambang batas 1.20 g",
                          fill: "#E05D44",
                          fontSize: 10,
                          position: "insideTopRight",
                        }}
                      />

                      {/* Area Peak g */}
                      <Area
                        type="monotone"
                        dataKey="peakG"
                        stroke="#E05D44"
                        strokeWidth={2.2}
                        fillOpacity={1}
                        fill="url(#trendPeakGradient)"
                        name="Puncak (Peak g)"
                      />

                      {/* Area RMS g */}
                      <Area
                        type="monotone"
                        dataKey="rmsG"
                        stroke="#6B9071"
                        strokeWidth={1.8}
                        fillOpacity={1}
                        fill="url(#trendRmsGradient)"
                        name="RMS (g)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend & ISO Annotation */}
                <div className="flex flex-wrap items-center justify-between text-[11.5px] text-[#375534] pt-1 border-t border-[#AEC3B0]/60">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-[#E05D44] rounded-full" />
                      <span>Amplitudo Puncak (g pk)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-[#6B9071] rounded-full" />
                      <span>RMS Getaran (g)</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B9071]">
                    {activePreset !== "Normal" ? "⚠️ Mesin mulai memburuk sejak 3 hari lalu" : "✓ Profil getaran stabil"}
                  </span>
                </div>
              </div>
            )}

            {/* ===================== TAB 3: CLASSIC 2D ENVELOPE SPECTRUM ===================== */}
            {activeTab === "spectrum2d" && (
              <div className="w-full flex flex-col space-y-2">
                <div className="w-full h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spectrumData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="spectrumGradient2d" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#375534" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#6B9071" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E3EED4" vertical={false} />
                      <XAxis
                        dataKey="freq"
                        type="number"
                        domain={[0, 2000]}
                        ticks={[0, 400, 800, 1200, 1600, 2000]}
                        tickLine={false}
                        stroke="#6B9071"
                        fontSize={11}
                        unit=" Hz"
                        tickMargin={8}
                      />
                      <YAxis
                        tickLine={false}
                        stroke="#6B9071"
                        fontSize={11}
                        domain={[0, Math.max(3.0, Math.ceil(sensorInput.puncak_g * 1.1))]}
                        tickMargin={8}
                        unit=" g"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as SpectrumPoint;
                            return (
                              <div className="bg-[#0F2A1D]/95 backdrop-blur-md border border-[#375534] text-white p-2 rounded-xl shadow-xl text-[12px]">
                                <div className="font-bold text-[#E3EED4]">{d.freq.toFixed(1)} Hz</div>
                                <div className="text-[#AEC3B0] flex justify-between gap-3">
                                  <span>Amplitudo:</span>
                                  <span className="font-semibold text-white">{d.amp.toFixed(3)} g</span>
                                </div>
                                {d.marker && (
                                  <div className="text-[11px] font-semibold text-[#F89674] mt-0.5">
                                    Harmonik: {d.marker}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine
                        y={1.2}
                        stroke="#E05D44"
                        strokeDasharray="4 4"
                        label={{
                          value: "Batas 1.20 g",
                          fill: "#E05D44",
                          fontSize: 10,
                          position: "insideTopRight",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amp"
                        stroke="#375534"
                        strokeWidth={1.8}
                        fillOpacity={1}
                        fill="url(#spectrumGradient2d)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#375534] pt-1 border-t border-[#AEC3B0]/60">
                  <span>0.312 Hz/bin · Band 0.5-10 kHz</span>
                  <span className="font-semibold text-[#0F2A1D]">
                    {peakPoint.freq.toFixed(1)} Hz · {peakPoint.amp.toFixed(2)} g pk
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
