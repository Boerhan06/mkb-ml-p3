"use client";

import { useState } from "react";
import { Wrench, Download, CheckCircle, FileText } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";
import { PredictionResponse, SensorInput } from "@/types/bearing";

interface RecommendationCardProps {
  prediction: PredictionResponse;
  sensorInput: SensorInput;
  isLoading?: boolean;
}

export default function RecommendationCard({
  prediction,
  sensorInput,
  isLoading = false,
}: RecommendationCardProps) {
  const [ticketId, setTicketId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const isNormal = prediction.kelas_prediksi === "Normal";

  const rekom = isNormal
    ? {
        tindakan:
          "Lakukan inspeksi visual kebersihan pelumas dan jadwalkan relubrikasi sesuai interval bulanan.",
        komponen: "Tidak perlu diganti",
        kode_suku_cadang: "-",
        ketersediaan: "Tersedia",
        zona_iso_20816: "Zona A · Sangat Baik",
      }
    : prediction.rekomendasi || {
        tindakan:
          "Ganti bearing SKF 6208-2RS segera. Jadwalkan penanganan dalam 7 hari untuk mencegah macet poros.",
        komponen: "Deep Groove Ball Bearing",
        kode_suku_cadang: "SKF 6208-2RS",
        ketersediaan: "Stok 4 unit",
        zona_iso_20816: "Zona D · Bahaya Kritis",
      };

  const handleCreateTicket = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setTicketId(`WO-2026-${randomNum}`);
  };

  const handleDownloadReport = () => {
    const reportData = [
      ["Parameter", "Nilai"],
      ["Unit Mesin", "Turbine Pump #04 - Drive End Bearing"],
      ["Kelas Prediksi", prediction.kelas_prediksi],
      ["Status Bahaya", prediction.status_bahaya],
      ["Keyakinan Model", `${(prediction.keyakinan * 100).toFixed(1)}%`],
      ["Kecepatan Poros (RPM)", sensorInput.kecepatan_rpm],
      ["Beban Mekanis (kN)", sensorInput.beban_kN],
      ["Suhu Housing (°C)", sensorInput.suhu_housing_C],
      ["Getaran RMS (g)", sensorInput.rms_g],
      ["Getaran Peak (g)", sensorInput.puncak_g],
      ["Kurtosis", sensorInput.kurtosis],
      ["Crest Factor", sensorInput.crest_factor],
      ["Frekuensi Dominan (Hz)", sensorInput.frekuensi_dominan_hz],
      ["Suku Cadang", rekom.komponen],
      ["Kode Part", rekom.kode_suku_cadang],
      ["Klasifikasi ISO 20816", rekom.zona_iso_20816],
      ["Rekomendasi Teknisi", rekom.tindakan],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      reportData.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_VibraCheck_${prediction.kelas_prediksi.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full bg-white/95 backdrop-blur-sm rounded-[22px] p-6 shadow-[0_10px_30px_-5px_rgba(15,42,29,0.06),0_4px_12px_-2px_rgba(15,42,29,0.03)] hover:shadow-[0_16px_36px_-4px_rgba(15,42,29,0.10)] transition-all duration-300 border border-[#AEC3B0]/70 flex flex-col justify-between">
      {/* Header Info */}
      <div className="flex items-baseline justify-between pb-3 border-b border-[#AEC3B0]/70">
        <div>
          <h3 className="text-[16px] font-semibold text-[#0F2A1D] tracking-tight">
            Rekomendasi Tindakan
          </h3>
          <p className="text-[12px] text-[#375534] mt-0.5">
            Langkah perawatan bantalan
          </p>
        </div>
        <span className="text-[11.5px] font-medium text-[#0F2A1D] bg-[#E3EED4] px-2 py-0.5 rounded-md tabular-nums border border-[#AEC3B0]">
          ISO 20816
        </span>
      </div>

      {/* Body Content */}
      {isLoading ? (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-3.5 animate-pulse">
          <div className="space-y-2 pt-1">
            <div className="h-4 w-full rounded bg-[#375534]/15" />
            <div className="h-4 w-4/5 rounded bg-[#375534]/15" />
          </div>

          {/* Skeleton Inset Table */}
          <div className="bg-[#E3EED4]/35 border border-[#AEC3B0]/70 rounded-xl p-3 flex flex-col space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-[#AEC3B0]/40">
              <div className="h-3.5 w-20 rounded bg-[#6B9071]/20" />
              <div className="h-3.5 w-28 rounded bg-[#375534]/20" />
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#AEC3B0]/40">
              <div className="h-3.5 w-16 rounded bg-[#6B9071]/20" />
              <div className="h-3.5 w-24 rounded bg-[#375534]/20" />
            </div>
            <div className="flex justify-between items-center py-1">
              <div className="h-3.5 w-12 rounded bg-[#6B9071]/20" />
              <div className="h-3.5 w-20 rounded bg-[#375534]/20" />
            </div>
          </div>

          {/* Skeleton Severity Box */}
          <div className="bg-[#E3EED4]/35 border border-[#AEC3B0]/70 rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-3 w-20 rounded bg-[#6B9071]/20" />
              <div className="h-4 w-32 rounded bg-[#0F2A1D]/20" />
            </div>
            <div className="h-6 w-16 rounded-md bg-[#375534]/20" />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-3.5">
          <p className="text-[13px] font-normal text-[#375534] leading-relaxed">
            {rekom.tindakan}
          </p>

          {/* Inset Table Suku Cadang */}
          <div className="bg-[#E3EED4]/35 border border-[#AEC3B0]/70 rounded-xl p-3 flex flex-col space-y-1.5">
            <div className="flex items-center justify-between py-1 border-b border-[#AEC3B0]/50 text-[12px]">
              <span className="text-[#375534]">Suku cadang</span>
              <span className="text-[#0F2A1D] font-medium text-right">
                {rekom.komponen}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#AEC3B0]/50 text-[12px]">
              <span className="text-[#375534]">Kode part</span>
              <span className="text-[#0F2A1D] font-medium tabular-nums">
                {rekom.kode_suku_cadang}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 text-[12px]">
              <span className="text-[#375534]">Stok</span>
              <span className="text-[#375534] font-semibold">
                {rekom.ketersediaan}
              </span>
            </div>
          </div>

          {/* ISO 20816 Severity Box */}
          <div className="bg-[#E3EED4]/35 border border-[#AEC3B0]/70 rounded-xl p-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#6B9071]">
                Zona ISO 20816
              </span>
              <span className="text-[12.5px] text-[#0F2A1D] font-semibold mt-0.5">
                {rekom.zona_iso_20816}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-[11.5px] px-2 py-0.5 rounded-md font-medium tabular-nums ${
                  prediction.status_bahaya === "KRITIS"
                    ? "bg-[#E05D44]/15 text-[#C84A32] border border-[#E05D44]/30"
                    : prediction.status_bahaya === "WASPADA"
                    ? "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20"
                    : "bg-[#E3EED4] text-[#375534] border border-[#AEC3B0]"
                }`}
              >
                {prediction.status_bahaya === "KRITIS"
                  ? "> 7.1 mm/s"
                  : prediction.status_bahaya === "WASPADA"
                  ? "4.5 mm/s"
                  : "< 1.8 mm/s"}
              </span>
            </div>
          </div>

          {/* Ticket Notification Box if Created with AnimatePresence */}
          <AnimatePresence>
            {ticketId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={springs.snappy}
                className="p-2.5 bg-[#E3EED4]/80 border border-[#375534]/30 rounded-xl flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 text-[#375534] flex-shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-[#0F2A1D]">
                  <div className="font-semibold">Tiket Diterbitkan: {ticketId}</div>
                  <div className="text-[#375534] text-[11px] mt-0.5">
                    Disposisi tim mekanik lapangan.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Buttons with Tactile Springs */}
      <div className="flex flex-col space-y-2 pt-2 border-t border-[#AEC3B0]/60">
        <motion.button
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          transition={springs.tactile}
          type="button"
          onClick={handleCreateTicket}
          className={`w-full h-9.5 rounded-xl font-medium text-[13px] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
            isNormal
              ? "bg-[#E3EED4] hover:bg-[#AEC3B0]/40 text-[#375534] border border-[#AEC3B0]/70"
              : "bg-[#375534] hover:bg-[#0F2A1D] text-white"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Buat Tiket</span>
        </motion.button>

        <motion.button
          whileHover={shouldReduceMotion ? undefined : { scale: 1.015 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          transition={springs.tactile}
          type="button"
          onClick={handleDownloadReport}
          className="w-full py-1 text-center text-[12px] font-medium text-[#375534] hover:text-[#0F2A1D] hover:bg-[#E3EED4]/50 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Unduh Laporan</span>
          <Download className="w-3 h-3 ml-0.5" />
        </motion.button>
      </div>
    </div>
  );
}
