"use client";

import { useEffect, useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import DiagnosisCard from "@/components/DiagnosisCard";
import SpectrumChart from "@/components/SpectrumChart";
import RecommendationCard from "@/components/RecommendationCard";
import WaveformChart from "@/components/WaveformChart";
import SensorInputPanel from "@/components/SensorInputPanel";
import BatchTab from "@/components/BatchTab";
import BackgroundGraphics from "@/components/BackgroundGraphics";

import { fetchHealth, postPredict, API_BASE_URL } from "@/lib/api";
import { PRESET_INPUTS, FALLBACK_PREDICTIONS } from "@/lib/constants";
import {
  springs,
  containerStagger,
  itemFadeUp,
} from "@/lib/motion";
import {
  HealthStatus,
  PredictionResponse,
  ScenarioPreset,
  SensorInput,
} from "@/types/bearing";
import { Cpu, CheckCircle2, ShieldCheck, Database } from "lucide-react";

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState<string>("diagnosa");
  const [activePreset, setActivePreset] = useState<ScenarioPreset>("Ball Fault");
  const [sensorInput, setSensorInput] = useState<SensorInput>(
    PRESET_INPUTS["Ball Fault"]
  );
  const [prediction, setPrediction] = useState<PredictionResponse>(
    FALLBACK_PREDICTIONS["Ball Fault"]
  );
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mainRef = useRef<HTMLElement>(null);
  const spectrumRef = useRef<HTMLDivElement>(null);

  const shouldReduceMotion = useReducedMotion();

  // 5. Scroll-Linked Progress Bar menggunakan useScroll dan useTransform
  const { scrollYProgress } = useScroll({
    container: mainRef,
  });
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const handleSelectMenu = (menu: string) => {
    setActiveMenu(menu);
    if (menu === "spektrum") {
      setTimeout(() => {
        spectrumRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 60);
    } else if (menu === "diagnosa") {
      setTimeout(() => {
        mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 60);
    }
  };

  // Load initial health status & run initial prediction
  useEffect(() => {
    async function init() {
      const h = await fetchHealth();
      setHealth(h);
      runPrediction(PRESET_INPUTS["Ball Fault"], "Ball Fault");
    }
    init();
  }, []);

  const runPrediction = async (
    inputData: SensorInput,
    presetName: ScenarioPreset
  ) => {
    setIsLoading(true);
    setSensorInput(inputData);

    try {
      const pred = await postPredict(inputData);
      setPrediction(pred);
    } catch {
      setPrediction(FALLBACK_PREDICTIONS[presetName]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: ScenarioPreset) => {
    setActivePreset(preset);
    const targetInput = PRESET_INPUTS[preset];
    runPrediction(targetInput, preset);
  };

  const handleManualPredictionSuccess = (
    newPrediction: PredictionResponse,
    updatedInput: SensorInput
  ) => {
    setPrediction(newPrediction);
    setSensorInput(updatedInput);
    if (newPrediction.kelas_prediksi) {
      setActivePreset(newPrediction.kelas_prediksi as ScenarioPreset);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#F6F5F0] text-[#233026]">
      {/* 3D Geometric Neumorphic Background Graphics */}
      <BackgroundGraphics />

      {/* 1. Sidebar Kiri Tetap */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={handleSelectMenu}
        health={health}
      />

      {/* Main Content Workspace (Scroll Independen) */}
      <main
        ref={mainRef}
        className="relative z-10 flex-1 min-w-0 h-full py-3 lg:py-4 pr-3 lg:pr-5 pl-1 lg:pl-2 flex flex-col gap-5 overflow-y-auto scroll-smooth"
      >
        {/* 2. Top Control Bar */}
        <div className="sticky top-0 z-30 flex flex-col gap-1 w-full">
          <TopBar
            activePreset={activePreset}
            onSelectPreset={handleSelectPreset}
            isLoading={isLoading}
          />
          {/* Scroll-Linked Progress Bar (Apple / Linear Precision) */}
          <div className="w-full h-0.5 bg-transparent overflow-hidden px-6">
            <motion.div
              style={{ width: progressBarWidth }}
              className="h-full bg-gradient-to-r from-[#6B9071] via-[#375534] to-[#0F2A1D] rounded-full"
            />
          </div>
        </div>

        {/* 4. Exit Animations dengan AnimatePresence mode="wait" antar Menu Tab */}
        <AnimatePresence mode="wait">
          {activeMenu === "batch" ? (
            /* TAB ARMADA MESIN (BATCH CSV) */
            <motion.div
              key="batch-tab"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={springs.gentle}
              className="w-full flex-1"
            >
              <BatchTab />
            </motion.div>
          ) : activeMenu === "model" ? (
            /* TAB STATUS MODEL & API */
            <motion.div
              key="model-tab"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={springs.gentle}
              className="w-full bg-white/95 backdrop-blur-sm rounded-[22px] p-6 shadow-[0_10px_30px_-5px_rgba(15,42,29,0.06),0_4px_12px_-2px_rgba(15,42,29,0.03)] hover:shadow-[0_16px_36px_-4px_rgba(15,42,29,0.10)] transition-all duration-300 border border-[#AEC3B0]/70 flex flex-col space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E3EED4]/60 border border-[#AEC3B0]/70 flex items-center justify-center text-[#375534]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-[#0F2A1D] tracking-tight">
                    Status Model
                  </h2>
                  <p className="text-[12.5px] text-[#375534]">
                    Spesifikasi model analitik dan status layanan backend inferensi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#E3EED4]/35 border border-[#AEC3B0]/60">
                  <span className="text-[11px] font-bold text-[#6B9071] tracking-wider uppercase">
                    ALGORITMA AKTIF
                  </span>
                  <div className="text-[18px] font-bold text-[#0F2A1D] mt-1">
                    Random Forest Classifier
                  </div>
                  <div className="text-[12px] text-[#375534] mt-1">
                    100 pohon · Kedalaman maks. 12
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#E3EED4]/35 border border-[#AEC3B0]/60">
                  <span className="text-[11px] font-bold text-[#6B9071] tracking-wider uppercase">
                    METRIK EVALUASI MODEL
                  </span>
                  <div className="text-[18px] font-bold text-[#375534] mt-1 tabular-nums">
                    Macro F1: {(health?.macro_f1 || 0.8014).toFixed(2)}
                  </div>
                  <div className="text-[12px] text-[#375534] mt-1">
                    Akurasi Uji: 82.5% (1.200 sampel)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#E3EED4]/35 border border-[#AEC3B0]/60">
                  <span className="text-[11px] font-bold text-[#6B9071] tracking-wider uppercase">
                    ALAMAT LAYANAN
                  </span>
                  <div className="text-[13px] font-mono font-bold text-[#375534] mt-1 truncate">
                    {API_BASE_URL}
                  </div>
                  <div className="text-[12px] text-[#375534] mt-1">
                    Status: Siap menerima inferensi
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#E3EED4]/35 border border-[#AEC3B0]/60 flex flex-col space-y-3">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#0F2A1D]">
                  <Database className="w-4 h-4 text-[#375534]" />
                  <span>12 Parameter Masukan Sensor</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(health?.fitur_input || [
                    "posisi_sensor", "kecepatan_rpm", "beban_kN", "suhu_housing_C",
                    "rms_g", "puncak_g", "kurtosis", "crest_factor",
                    "energi_bpfo", "energi_bpfi", "energi_bsf", "frekuensi_dominan_hz"
                  ]).map((f, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-white border border-[#AEC3B0]/70 text-[11.5px] font-mono text-[#0F2A1D]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* TAB UTAMA: DIAGNOSA & TELEMETRI (1. Staggered Orchestration) */
            <motion.div
              key="diagnosa-main"
              variants={shouldReduceMotion ? undefined : containerStagger}
              initial="hidden"
              animate="visible"
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              className="flex flex-col gap-5 w-full"
            >
              {/* 3. Baris Bento Atas - Kartu Diagnosa Utama (Kondisi Mesin) */}
              <motion.div variants={shouldReduceMotion ? undefined : itemFadeUp}>
                <DiagnosisCard
                  prediction={prediction}
                  sensorInput={sensorInput}
                  isLoading={isLoading}
                />
              </motion.div>

              {/* 4. Panel Input Sensor Manual (Diletakkan di Bawah Kartu Kondisi) */}
              <motion.div variants={shouldReduceMotion ? undefined : itemFadeUp}>
                <SensorInputPanel
                  initialValues={sensorInput}
                  onPredictionSuccess={handleManualPredictionSuccess}
                  isLoading={isLoading}
                />
              </motion.div>

              {/* 5. Baris Bento Tengah - Grafik FFT & Rekomendasi (Scroll Triggered with whileInView) */}
              <motion.div
                id="spektrum-section"
                ref={spectrumRef}
                variants={shouldReduceMotion ? undefined : itemFadeUp}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch scroll-mt-20"
              >
                <div className="lg:col-span-8 flex">
                  <SpectrumChart
                    activePreset={activePreset}
                    sensorInput={sensorInput}
                  />
                </div>

                <div className="lg:col-span-4 flex">
                  <RecommendationCard
                    prediction={prediction}
                    sensorInput={sensorInput}
                    isLoading={isLoading}
                  />
                </div>
              </motion.div>

              {/* 6. Baris Bento Bawah - Gelombang Domain Waktu (Scroll Triggered) */}
              <motion.div
                variants={shouldReduceMotion ? undefined : itemFadeUp}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
              >
                <WaveformChart
                  activePreset={activePreset}
                  sensorInput={sensorInput}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean Industrial Footer */}
        <footer className="w-full pt-4 border-t border-[#AEC3B0]/60 text-[11.5px] text-[#375534] flex flex-wrap justify-between items-center gap-2">
          <div>
            VibraCheck · Pemantauan getaran sesuai ISO 20816
          </div>
          <div className="tabular-nums">
            Random Forest · F1 {health?.macro_f1 ? health.macro_f1.toFixed(2) : "0.80"} · 12 parameter
          </div>
        </footer>
      </main>
    </div>
  );
}
