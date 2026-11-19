"use client";

import { useState, useEffect } from "react";
import {
  Sliders,
  Send,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  XCircle,
  Code2,
  X,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";
import {
  SensorInput,
  PredictionResponse,
  PydanticValidationErrorDetail,
} from "@/types/bearing";
import { postPredictWithValidation } from "@/lib/api";

interface SensorInputPanelProps {
  initialValues: SensorInput;
  onPredictionSuccess: (
    prediction: PredictionResponse,
    updatedInput: SensorInput
  ) => void;
  isLoading: boolean;
}

export default function SensorInputPanel({
  initialValues,
  onPredictionSuccess,
  isLoading,
}: SensorInputPanelProps) {
  const [formData, setFormData] = useState<SensorInput>(initialValues);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<
    PydanticValidationErrorDetail[] | null
  >(null);
  const [rawErrorBody, setRawErrorBody] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setFormData(initialValues);
    setValidationErrors(null);
    setRawErrorBody(null);
    setErrorStatus(null);
  }, [initialValues]);

  const handleChange = (
    field: keyof SensorInput,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "posisi_sensor" ? value : Number(value),
    }));
    // Clear error on edit
    if (validationErrors) {
      setValidationErrors(null);
      setRawErrorBody(null);
      setErrorStatus(null);
    }
  };

  const handleDismissErrors = () => {
    setValidationErrors(null);
    setRawErrorBody(null);
    setErrorStatus(null);
    setShowRawJson(false);
  };

  // Submit normal input to POST /predict
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors(null);
    setRawErrorBody(null);
    setErrorStatus(null);
    setSuccessMessage(null);

    const result = await postPredictWithValidation(formData);
    setIsSubmitting(false);

    if (result.ok) {
      setSuccessMessage("Parameter berhasil divalidasi dan diperbarui.");
      onPredictionSuccess(result.data, formData);
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      setValidationErrors(result.detail);
      setRawErrorBody(result.rawError);
      setErrorStatus(result.status);
    }
  };

  // Uji Guardrail 422: Kirim data ekstrem yang melanggar batas fisika mekanis Pydantic
  const handleTestInvalid422 = async () => {
    setIsSubmitting(true);
    setValidationErrors(null);
    setRawErrorBody(null);
    setErrorStatus(null);
    setSuccessMessage(null);

    // Payload yang sengaja dibuat abnormal untuk menguji validasi Pydantic backend:
    const invalidPayload: any = {
      ...formData,
      kecepatan_rpm: -500.0, // Melanggar gt=0
      suhu_housing_C: 250.0, // Melanggar lt=150.0 (suhu mustahil bantalan hidup)
      puncak_g: 55.0, // Melanggar le=30.0 (melebihi rentang akselerometer industri)
      crest_factor: 0.5, // Melanggar ge=1.0 (peak tidak mungkin lebih kecil dari RMS)
    };

    const result = await postPredictWithValidation(invalidPayload);
    setIsSubmitting(false);

    if (!result.ok) {
      setValidationErrors(result.detail);
      setRawErrorBody(result.rawError);
      setErrorStatus(result.status);
      setIsOpen(true); // Pastikan panel terbuka untuk melihat detail error
    }
  };

  return (
    <div className="relative overflow-hidden w-full rounded-[24px] bg-gradient-to-br from-[#1B4332] via-[#22533E] to-[#163829] p-5 lg:p-6 shadow-[0_16px_40px_-8px_rgba(27,67,50,0.35),0_4px_12px_-2px_rgba(27,67,50,0.2)] hover:shadow-[0_20px_48px_-6px_rgba(27,67,50,0.45)] transition-all duration-300 border border-[#37694E]/80 text-white flex flex-col space-y-4 select-none">
      {/* Header & Toggle Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2B5740]/70 border border-[#6B9071]/50 flex items-center justify-center text-[#E3EED4] shadow-2xs">
            <Sliders className="w-4.5 h-4.5 text-[#E3EED4]" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#E3EED4] tracking-tight">
              Input Manual
            </h3>
            <p className="text-[12px] text-[#AEC3B0]">
              Ubah 12 parameter getaran untuk menguji diagnosa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Demo 422 with Tactile Spring */}
          <motion.button
            whileHover={shouldReduceMotion || isSubmitting || isLoading ? undefined : { scale: 1.025 }}
            whileTap={shouldReduceMotion || isSubmitting || isLoading ? undefined : { scale: 0.96 }}
            transition={springs.tactile}
            type="button"
            onClick={handleTestInvalid422}
            disabled={isSubmitting || isLoading}
            className="px-3.5 py-2 rounded-xl bg-[#2B5740]/70 hover:bg-[#36684D] border border-[#6B9071]/50 text-[12.5px] font-semibold text-[#E3EED4] hover:text-white transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Kirim nilai parameter abnormal untuk menguji sistem proteksi input"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>Simulasi Abnormal</span>
          </motion.button>

          {/* Toggle Panel Button with Tactile Spring */}
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.025 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            transition={springs.tactile}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3.5 py-2 rounded-xl bg-[#2B5740]/70 hover:bg-[#36684D] border border-[#6B9071]/50 text-[12.5px] font-semibold text-[#E3EED4] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>{isOpen ? "Tutup Parameter" : "Edit Parameter"}</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-[#AEC3B0]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#AEC3B0]" />
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {/* Success Notification */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={springs.gentle}
            className="p-3 bg-[#173D2A]/80 border border-[#6B9071]/50 rounded-xl text-[12.5px] text-[#E3EED4] font-semibold flex items-center gap-2 overflow-hidden"
          >
            <span className="w-2 h-2 rounded-full bg-[#6B9071]"></span>
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* 422 Pydantic Validation Error Alert Box */}
        {validationErrors && validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={springs.gentle}
            className="p-4 bg-[#2A1010]/80 border-2 border-[#E05D44]/60 rounded-xl flex flex-col space-y-3 overflow-hidden text-white shadow-inner"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDismissErrors}
                  title="Tutup pesan error"
                  aria-label="Tutup pesan error"
                  className="p-1 -ml-1 rounded-lg text-[#F89674] hover:text-[#FECACA] hover:bg-[#3B1515] transition-colors cursor-pointer flex-shrink-0 group"
                >
                  <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <div>
                  <h4 className="text-[13.5px] font-bold text-[#F89674]">
                    {errorStatus === 422
                      ? "Parameter Sensor di Luar Batas Operasi Aman (Input Guardrail)"
                      : errorStatus === 0
                      ? "Koneksi Backend Terputus (Server Offline)"
                      : `Gagal Memproses Permintaan (Status ${errorStatus})`}
                  </h4>
                  <p className="text-[12px] text-[#FCA5A5] mt-0.5">
                    {errorStatus === 422
                      ? "Sistem mendeteksi nilai masukan sensor tidak realistis atau melanggar rentang fisika mekanis mesin:"
                      : errorStatus === 0
                      ? "Layanan FastAPI di http://127.0.0.1:8000 belum aktif. Nyalakan server backend terlebih dahulu."
                      : "Terjadi kendala saat menghubungi server:"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="px-2.5 py-1 rounded-lg bg-[#3B1515] border border-[#E05D44]/40 text-[11px] font-semibold text-[#FCA5A5] hover:bg-[#4A1A1A] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Code2 className="w-3 h-3" />
                  <span>{showRawJson ? "Tutup Rincian" : "Rincian Teknis"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissErrors}
                  title="Tutup pesan error"
                  aria-label="Tutup pesan error"
                  className="p-1.5 rounded-lg bg-[#3B1515] border border-[#E05D44]/40 text-[#FCA5A5] hover:text-white hover:bg-[#4A1A1A] transition-colors cursor-pointer flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Error Item List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
              {validationErrors.map((err, idx) => {
                const fieldName = err.loc[err.loc.length - 1];
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#180A0A] border border-[#E05D44]/30 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#F89674]">
                        {String(fieldName)}
                      </span>
                      <span className="text-[10px] bg-[#7F1D1D]/60 text-[#FECACA] px-1.5 py-0.5 rounded font-mono">
                        {err.type}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-[#D1D5DB]">{err.msg}</div>
                    {err.input !== undefined && (
                      <div className="text-[11px] text-[#FCA5A5] font-mono mt-0.5">
                        Nilai Diterima: {JSON.stringify(err.input)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Raw JSON Debug Box */}
            {showRawJson && rawErrorBody && (
              <div className="p-3 rounded-lg bg-[#0F2A1D] text-[#E3EED4] text-[11px] font-mono overflow-x-auto max-h-48 border border-[#375534]">
                <pre>{JSON.stringify(rawErrorBody, null, 2)}</pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible Form Body with Spring Accordion */}
      <AnimatePresence>
        {isOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.gentle}
            onSubmit={handleSubmit}
            className="flex flex-col space-y-5 pt-1 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 01 Operasional Poros Mesin */}
              <div className="p-4 rounded-xl bg-[#173D2A]/60 border border-[#375534] flex flex-col space-y-3 shadow-inner">
                <span className="text-[11px] font-bold text-[#AEC3B0] tracking-wider uppercase border-b border-[#375534] pb-1.5">
                  01 Operasional Mesin
                </span>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Posisi Sensor Bantalan
                  </label>
                  <select
                    value={formData.posisi_sensor}
                    onChange={(e) =>
                      handleChange(
                        "posisi_sensor",
                        e.target.value as "drive_end" | "fan_end"
                      )
                    }
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] focus:outline-none focus:border-[#6B9071] transition-colors"
                  >
                    <option value="drive_end" className="bg-[#0F2A1D] text-[#E3EED4]">Drive End (Sisi Beban)</option>
                    <option value="fan_end" className="bg-[#0F2A1D] text-[#E3EED4]">Fan End (Sisi Kipas)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Kecepatan Putar Poros (RPM)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={formData.kecepatan_rpm}
                    onChange={(e) => handleChange("kecepatan_rpm", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Beban Mekanis (kN)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.beban_kN}
                    onChange={(e) => handleChange("beban_kN", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Suhu Rumah Bearing (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.suhu_housing_C}
                    onChange={(e) =>
                      handleChange("suhu_housing_C", e.target.value)
                    }
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
              </div>

              {/* 02 Karakteristik Getaran RMS */}
              <div className="p-4 rounded-xl bg-[#173D2A]/60 border border-[#375534] flex flex-col space-y-3 shadow-inner">
                <span className="text-[11px] font-bold text-[#AEC3B0] tracking-wider uppercase border-b border-[#375534] pb-1.5">
                  02 Karakteristik Getaran
                </span>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Getaran Rata-rata RMS (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rms_g}
                    onChange={(e) => handleChange("rms_g", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Getaran Puncak / Peak (g)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.puncak_g}
                    onChange={(e) => handleChange("puncak_g", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Kurtosis Sinyal Getaran
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.kurtosis}
                    onChange={(e) => handleChange("kurtosis", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Crest Factor (Peak / RMS)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.crest_factor}
                    onChange={(e) => handleChange("crest_factor", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
              </div>

              {/* 03 Spektrum Frekuensi Cacat */}
              <div className="p-4 rounded-xl bg-[#173D2A]/60 border border-[#375534] flex flex-col space-y-3 shadow-inner">
                <span className="text-[11px] font-bold text-[#AEC3B0] tracking-wider uppercase border-b border-[#375534] pb-1.5">
                  03 Spektrum Cacat (Energi &amp; Hz)
                </span>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Energi BPFO (Cincin Luar)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    value={formData.energi_bpfo}
                    onChange={(e) => handleChange("energi_bpfo", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Energi BPFI (Cincin Dalam)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    value={formData.energi_bpfi}
                    onChange={(e) => handleChange("energi_bpfi", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Energi BSF (Elemen Bola)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    value={formData.energi_bsf}
                    onChange={(e) => handleChange("energi_bsf", e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[#AEC3B0] block mb-1">
                    Frekuensi Dominan Getaran (Hz)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.frekuensi_dominan_hz}
                    onChange={(e) =>
                      handleChange("frekuensi_dominan_hz", e.target.value)
                    }
                    className="w-full h-9 rounded-lg border border-[#375534] bg-[#0F2A1D]/90 px-2.5 text-[12.5px] text-[#E3EED4] tabular-nums focus:outline-none focus:border-[#6B9071] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              <motion.button
                whileHover={shouldReduceMotion ? undefined : { scale: 1.025 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                transition={springs.tactile}
                type="button"
                onClick={() => setFormData(initialValues)}
                className="px-4 py-2 rounded-xl border border-[#6B9071]/60 text-[12.5px] font-semibold text-[#AEC3B0] hover:text-[#E3EED4] hover:bg-[#375534]/50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Nilai</span>
              </motion.button>
              <motion.button
                whileHover={shouldReduceMotion || isSubmitting || isLoading ? undefined : { scale: 1.025 }}
                whileTap={shouldReduceMotion || isSubmitting || isLoading ? undefined : { scale: 0.96 }}
                transition={springs.tactile}
                type="submit"
                disabled={isSubmitting || isLoading}
                className="px-6 py-2 rounded-xl bg-[#E3EED4] hover:bg-white text-[#0F2A1D] text-[12.5px] font-bold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#0F2A1D]" />
                <span>{isSubmitting ? "Memproses Inferensi..." : "Jalankan Diagnosa"}</span>
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
