"use client";

import { useState, useEffect } from "react";
import { Sliders, RefreshCw, Send } from "lucide-react";
import { SensorInput } from "@/types/bearing";

interface SensorFormProps {
  initialValues: SensorInput;
  onSubmit: (values: SensorInput) => void;
  isLoading: boolean;
}

export default function SensorForm({
  initialValues,
  onSubmit,
  isLoading,
}: SensorFormProps) {
  const [formData, setFormData] = useState<SensorInput>(initialValues);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const handleChange = (field: keyof SensorInput, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "posisi_sensor" ? value : Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="w-full bg-white rounded-[20px] p-6 shadow-xs border border-[#DCE4DD] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#4A5D4E]" />
          <h3 className="text-[17px] font-bold text-[#233026]">
            Parameter Masukan Sensor Getaran (12 Fitur)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[12px] font-semibold text-[#4A5D4E] hover:text-[#233026] px-3 py-1 bg-[#F6F5F0] rounded-lg border border-[#DCE4DD]"
        >
          {isOpen ? "Tutup Editor" : "Ubah Parameter Kustom"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-5 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 01 Operasional Poros Mesin */}
            <div className="p-4 rounded-xl bg-[#F6F8F4] border border-[#DCE4DD] flex flex-col space-y-3">
              <span className="text-[11px] font-bold text-[#4A5D4E] tracking-wider uppercase border-b border-[#DCE4DD] pb-1.5">
                01 Operasional Mesin
              </span>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Posisi Sensor Bantalan
                </label>
                <select
                  value={formData.posisi_sensor}
                  onChange={(e) =>
                    handleChange("posisi_sensor", e.target.value as "drive_end" | "fan_end")
                  }
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026]"
                >
                  <option value="drive_end">Drive End (Sisi Beban)</option>
                  <option value="fan_end">Fan End (Sisi Kipas)</option>
                </select>
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Kecepatan Putar (RPM)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  max="10000"
                  value={formData.kecepatan_rpm}
                  onChange={(e) => handleChange("kecepatan_rpm", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Beban Mekanis (kN)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={formData.beban_kN}
                  onChange={(e) => handleChange("beban_kN", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Suhu Rumah Bearing (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="-20"
                  max="200"
                  value={formData.suhu_housing_C}
                  onChange={(e) => handleChange("suhu_housing_C", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
            </div>

            {/* 02 Karakteristik Getaran RMS */}
            <div className="p-4 rounded-xl bg-[#F6F8F4] border border-[#DCE4DD] flex flex-col space-y-3">
              <span className="text-[11px] font-bold text-[#8FA391] tracking-wider uppercase border-b border-[#DCE4DD] pb-1.5">
                02 Karakteristik Getaran
              </span>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Getaran Rata-rata RMS (g)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  max="50"
                  value={formData.rms_g}
                  onChange={(e) => handleChange("rms_g", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Getaran Puncak Peak (g)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.001"
                  max="100"
                  value={formData.puncak_g}
                  onChange={(e) => handleChange("puncak_g", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Kurtosis Sinyal
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={formData.kurtosis}
                  onChange={(e) => handleChange("kurtosis", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Crest Factor (Peak / RMS)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  max="50"
                  value={formData.crest_factor}
                  onChange={(e) => handleChange("crest_factor", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
            </div>

            {/* 03 Spektrum Frekuensi Cacat */}
            <div className="p-4 rounded-xl bg-[#F6F8F4] border border-[#DCE4DD] flex flex-col space-y-3">
              <span className="text-[11px] font-bold text-[#4A5D4E] tracking-wider uppercase border-b border-[#DCE4DD] pb-1.5">
                03 Spektrum Cacat (Energi & Hz)
              </span>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Energi BPFO (Cincin Luar)
                </label>
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  max="10"
                  value={formData.energi_bpfo}
                  onChange={(e) => handleChange("energi_bpfo", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Energi BPFI (Cincin Dalam)
                </label>
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  max="10"
                  value={formData.energi_bpfi}
                  onChange={(e) => handleChange("energi_bpfi", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Energi BSF (Elemen Bola)
                </label>
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  max="10"
                  value={formData.energi_bsf}
                  onChange={(e) => handleChange("energi_bsf", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11.5px] font-medium text-[#5B7060] block mb-1">
                  Frekuensi Dominan (Hz)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="5000"
                  value={formData.frekuensi_dominan_hz}
                  onChange={(e) => handleChange("frekuensi_dominan_hz", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#DCE4DD] bg-white px-2.5 text-[12.5px] text-[#233026] tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setFormData(initialValues)}
              className="px-4 py-2 rounded-xl border border-[#DCE4DD] text-[12.5px] font-semibold text-[#5B7060] hover:bg-[#F6F5F0] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset ke Skenario</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 rounded-xl bg-[#4A5D4E] hover:bg-[#3D4D40] text-white text-[12.5px] font-semibold transition-all flex items-center gap-2 shadow-xs disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Jalankan Diagnosa Mesin</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
