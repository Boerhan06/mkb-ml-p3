"use client";

import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Code2,
  Clock,
  Layers,
} from "lucide-react";
import { BatchMachineRecord, BatchResultItem } from "@/types/bearing";
import { postPredictBatchWithValidation } from "@/lib/api";

const CONTOH_MESIN_PABRIK: BatchMachineRecord[] = [
  {
    id_rekaman: "PUMP-01 (Pompa Raw Mill)",
    posisi_sensor: "drive_end",
    kecepatan_rpm: 2547.0,
    beban_kN: 2.79,
    suhu_housing_C: 51.2,
    rms_g: 0.3168,
    puncak_g: 1.1658,
    kurtosis: 2.706,
    crest_factor: 2.256,
    energi_bpfo: 0.0436,
    energi_bpfi: 0.0421,
    energi_bsf: 0.0389,
    frekuensi_dominan_hz: 40.9,
  },
  {
    id_rekaman: "FAN-02 (ID Fan Cooler)",
    posisi_sensor: "drive_end",
    kecepatan_rpm: 1824.0,
    beban_kN: 0.54,
    suhu_housing_C: 58.9,
    rms_g: 0.5603,
    puncak_g: 1.7888,
    kurtosis: 3.109,
    crest_factor: 3.3,
    energi_bpfo: 0.2309,
    energi_bpfi: 0.0031,
    energi_bsf: 0.053,
    frekuensi_dominan_hz: 116.0,
  },
  {
    id_rekaman: "MOT-03 (Motor Kiln Drive)",
    posisi_sensor: "fan_end",
    kecepatan_rpm: 2884.0,
    beban_kN: 4.84,
    suhu_housing_C: 64.7,
    rms_g: 0.724,
    puncak_g: 2.7966,
    kurtosis: 4.075,
    crest_factor: 3.863,
    energi_bpfo: 0.0166,
    energi_bpfi: 0.3367,
    energi_bsf: 0.0861,
    frekuensi_dominan_hz: 47.9,
  },
  {
    id_rekaman: "BLW-04 (Blower Clinker)",
    posisi_sensor: "drive_end",
    kecepatan_rpm: 2961.0,
    beban_kN: 5.44,
    suhu_housing_C: 78.5,
    rms_g: 0.9498,
    puncak_g: 4.35,
    kurtosis: 6.85,
    crest_factor: 5.2,
    energi_bpfo: 0.0753,
    energi_bpfi: 0.0643,
    energi_bsf: 0.3814,
    frekuensi_dominan_hz: 98.4,
  },
  {
    id_rekaman: "CONV-05 (Conveyor Limestone)",
    posisi_sensor: "drive_end",
    kecepatan_rpm: 1481.0,
    beban_kN: 0.62,
    suhu_housing_C: 45.3,
    rms_g: 0.2708,
    puncak_g: 0.8508,
    kurtosis: 2.67,
    crest_factor: 3.141,
    energi_bpfo: 0.0607,
    energi_bpfi: 0.042,
    energi_bsf: 0.058,
    frekuensi_dominan_hz: 24.7,
  },
  {
    id_rekaman: "CRU-06 (Secondary Crusher)",
    posisi_sensor: "drive_end",
    kecepatan_rpm: 2818.0,
    beban_kN: 3.98,
    suhu_housing_C: 61.2,
    rms_g: 0.6748,
    puncak_g: 2.2581,
    kurtosis: 3.602,
    crest_factor: 3.346,
    energi_bpfo: 0.2382,
    energi_bpfi: 0.0444,
    energi_bsf: 0.107,
    frekuensi_dominan_hz: 168.5,
  },
];

export default function BatchTab() {
  const [results, setResults] = useState<BatchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [showJsonViewer, setShowJsonViewer] = useState<boolean>(false);
  const [lastRequestJson, setLastRequestJson] = useState<any>(null);
  const [lastResponseJson, setLastResponseJson] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchLatency, setBatchLatency] = useState<number | null>(null);

  // Parse CSV text into records
  const parseCSV = (csvText: string): BatchMachineRecord[] => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const records: BatchMachineRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(",").map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => {
        const val = values[idx];
        if (h === "id_rekaman" || h === "posisi_sensor") {
          row[h] = val;
        } else {
          row[h] = Number(val) || 0;
        }
      });

      if (!row.id_rekaman) {
        row.id_rekaman = `UNIT-${String(i).padStart(3, "0")}`;
      }
      if (!row.posisi_sensor) {
        row.posisi_sensor = "drive_end";
      }

      records.push(row as BatchMachineRecord);
    }

    return records;
  };

  const processBatch = async (records: BatchMachineRecord[]) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Strip non-feature columns for FastAPI payload
    const payload = records.map((r) => ({
      posisi_sensor: r.posisi_sensor || "drive_end",
      kecepatan_rpm: Number(r.kecepatan_rpm) || 0,
      beban_kN: Number(r.beban_kN) || 1,
      suhu_housing_C: Number(r.suhu_housing_C) || 50,
      rms_g: Number(r.rms_g) || 0.1,
      puncak_g: Number(r.puncak_g) || 0.5,
      kurtosis: Number(r.kurtosis) || 3,
      crest_factor: Number(r.crest_factor) || 2,
      energi_bpfo: Number(r.energi_bpfo) || 0,
      energi_bpfi: Number(r.energi_bpfi) || 0,
      energi_bsf: Number(r.energi_bsf) || 0,
      frekuensi_dominan_hz: Number(r.frekuensi_dominan_hz) || 50,
    }));

    const result = await postPredictBatchWithValidation(payload);
    setIsLoading(false);

    setLastRequestJson(result.requestBody);
    setLastResponseJson(result.responseBody);

    if (result.ok) {
      setBatchLatency(result.latencyMs);
      const merged: BatchResultItem[] = result.data.map((resItem, idx) => ({
        ...resItem,
        id_rekaman: records[idx].id_rekaman,
        posisi_sensor: records[idx].posisi_sensor,
        kecepatan_rpm: records[idx].kecepatan_rpm,
        rms_g: records[idx].rms_g,
        suhu_housing_C: records[idx].suhu_housing_C,
        beban_kN: records[idx].beban_kN,
      }));
      setResults(merged);
    } else {
      setErrorMessage(result.error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        setErrorMessage("File CSV kosong atau tidak memiliki baris data.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const required = [
        "kecepatan_rpm",
        "beban_kn",
        "suhu_housing_c",
        "rms_g",
        "puncak_g",
        "kurtosis",
        "crest_factor",
        "energi_bpfo",
        "energi_bpfi",
        "energi_bsf",
        "frekuensi_dominan_hz",
      ];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        setErrorMessage(
          `Kolom '${missing[0]}' tidak ditemukan. Unduh template untuk format yang benar.`
        );
        return;
      }

      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        processBatch(parsed);
      } else {
        setErrorMessage("Format file CSV tidak valid.");
      }
    };
    reader.readAsText(file);
  };

  const handleUseSampleData = () => {
    processBatch(CONTOH_MESIN_PABRIK);
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;

    const headers = [
      "ID Mesin",
      "Prediksi Kerusakan",
      "Status Bahaya",
      "Keyakinan",
      "Zona ISO 20816",
      "Kecepatan (RPM)",
      "RMS (g)",
      "Suhu (°C)",
      "Kode Suku Cadang",
      "Tindakan Rekomendasi",
    ];

    const rows = results.map((r) => [
      `"${r.id_rekaman}"`,
      `"${r.kelas_prediksi}"`,
      `"${r.status_bahaya}"`,
      `"${(r.keyakinan * 100).toFixed(1)}%"`,
      `"${r.rekomendasi?.zona_iso_20816 || '-'}"`,
      r.kecepatan_rpm || 0,
      r.rms_g || 0,
      r.suhu_housing_C || 0,
      `"${r.rekomendasi?.kode_suku_cadang || '-'}"`,
      `"${(r.rekomendasi?.tindakan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Hasil_Diagnosa_Batch_Armada.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fleet stats
  const total = results.length;
  const countNormal = results.filter((r) => r.kelas_prediksi === "Normal").length;
  const countOuter = results.filter((r) => r.kelas_prediksi === "Outer Race").length;
  const countInner = results.filter((r) => r.kelas_prediksi === "Inner Race").length;
  const countBall = results.filter((r) => r.kelas_prediksi === "Ball Fault").length;

  // Filtered rows
  const filteredResults =
    filterClass === "ALL"
      ? results
      : results.filter((r) => r.kelas_prediksi === filterClass);

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* 1. Header & Controls */}
      <div className="w-full bg-white/95 backdrop-blur-sm rounded-[22px] p-6 shadow-[0_10px_30px_-5px_rgba(15,42,29,0.06),0_4px_12px_-2px_rgba(15,42,29,0.03)] hover:shadow-[0_16px_36px_-4px_rgba(15,42,29,0.10)] transition-all duration-300 border border-[#AEC3B0]/70 flex flex-col space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3EED4]/60 border border-[#AEC3B0]/70 flex items-center justify-center text-[#375534]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#0F2A1D] tracking-tight">
                Evaluasi Batch
              </h2>
              <p className="text-[12.5px] text-[#375534]">
                Analisis banyak mesin sekaligus dari satu file CSV.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Unduh Template CSV */}
            <a
              href="/contoh_batch.csv"
              download="template_telemetri_bearing.csv"
              className="px-3.5 py-2 rounded-xl bg-[#E3EED4]/50 hover:bg-[#E3EED4] border border-[#AEC3B0]/70 text-[12.5px] font-semibold text-[#375534] transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template CSV</span>
            </a>

            {/* Muat Contoh 6 Mesin */}
            <button
              type="button"
              onClick={handleUseSampleData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-[#375534] hover:bg-[#0F2A1D] text-white text-[12.5px] font-semibold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Coba Data Contoh</span>
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-[#AEC3B0]/70 rounded-xl p-5 bg-[#E3EED4]/35 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#AEC3B0]/70 flex items-center justify-center text-[#375534]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#0F2A1D]">
                Unggah file CSV
              </div>
              <div className="text-[11.5px] text-[#375534]">
                Maks. 1.000 baris per unggahan. Wajib berisi 12 kolom fitur (lihat template).
              </div>
            </div>
          </div>

          <label className="px-4 py-2 rounded-xl bg-white hover:bg-[#E3EED4]/60 border border-[#AEC3B0]/80 text-[12.5px] font-semibold text-[#0F2A1D] cursor-pointer transition-colors shadow-2xs">
            <span>Pilih File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-[#FFF2F2] border border-[#DC2626]/30 rounded-xl text-[12px] text-[#DC2626] font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Empty State jika belum ada file yang diunggah */}
      {results.length === 0 && (
        <div className="w-full bg-white/80 border border-dashed border-[#AEC3B0]/80 rounded-[22px] p-10 flex flex-col items-center justify-center text-center space-y-2">
          <FileSpreadsheet className="w-8 h-8 text-[#6B9071]/60" />
          <p className="text-[13px] font-medium text-[#0F2A1D]">
            Hasil diagnosa tiap mesin akan muncul di sini setelah file diunggah.
          </p>
          <p className="text-[11.5px] text-[#375534]">
            Atau klik tombol &ldquo;Coba Data Contoh&rdquo; untuk demo instan 6 unit mesin.
          </p>
        </div>
      )}

      {/* 2. Fleet Summary Metric Cards (Apple Bento 5 Cells) */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-white/95 border border-[#DCE4DD] shadow-[0_4px_16px_-2px_rgba(74,93,78,0.06)] hover:shadow-[0_8px_24px_-3px_rgba(74,93,78,0.1)] transition-all duration-200">
            <span className="text-[11px] font-bold text-[#5B7060] uppercase tracking-wider">
              TOTAL MESIN
            </span>
            <div className="text-[26px] font-bold text-[#233026] mt-1 tabular-nums">
              {total}
            </div>
            <div className="text-[11px] text-[#5B7060] mt-0.5">Unit Teranalisis</div>
          </div>

          <div className="p-4 rounded-xl bg-[#E3EED4]/60 border border-[#375534]/30 shadow-[0_4px_16px_-2px_rgba(15,42,29,0.05)] hover:shadow-[0_8px_24px_-3px_rgba(15,42,29,0.08)] transition-all duration-200">
            <span className="text-[11px] font-bold text-[#375534] uppercase tracking-wider">
              NORMAL (AMAN)
            </span>
            <div className="text-[26px] font-bold text-[#0F2A1D] mt-1 tabular-nums">
              {countNormal}
            </div>
            <div className="text-[11px] text-[#375534] mt-0.5">Operasional Stabil</div>
          </div>

          <div className="p-4 rounded-xl bg-[#D97706]/10 border border-[#D97706]/25 shadow-[0_4px_16px_-2px_rgba(217,119,6,0.08)] hover:shadow-[0_8px_24px_-3px_rgba(217,119,6,0.14)] transition-all duration-200">
            <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider">
              CACAT CINCIN LUAR
            </span>
            <div className="text-[26px] font-bold text-[#D97706] mt-1 tabular-nums">
              {countOuter}
            </div>
            <div className="text-[11px] text-[#D97706] mt-0.5">Indikasi BPFO</div>
          </div>

          <div className="p-4 rounded-xl bg-[#CA774A]/10 border border-[#CA774A]/25 shadow-[0_4px_16px_-2px_rgba(202,119,74,0.08)] hover:shadow-[0_8px_24px_-3px_rgba(202,119,74,0.14)] transition-all duration-200">
            <span className="text-[11px] font-bold text-[#CA774A] uppercase tracking-wider">
              CACAT CINCIN DALAM
            </span>
            <div className="text-[26px] font-bold text-[#CA774A] mt-1 tabular-nums">
              {countInner}
            </div>
            <div className="text-[11px] text-[#CA774A] mt-0.5">Indikasi BPFI</div>
          </div>

          <div className="p-4 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/25 shadow-[0_4px_16px_-2px_rgba(220,38,38,0.08)] hover:shadow-[0_8px_24px_-3px_rgba(220,38,38,0.14)] transition-all duration-200">
            <span className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider">
              CACAT BOLA (KRITIS)
            </span>
            <div className="text-[26px] font-bold text-[#DC2626] mt-1 tabular-nums">
              {countBall}
            </div>
            <div className="text-[11px] text-[#DC2626] mt-0.5">Indikasi BSF</div>
          </div>
        </div>
      )}

      {/* 3. Results Table with Filters & JSON Debug Toggle */}
      {results.length > 0 && (
        <div className="w-full bg-white/95 backdrop-blur-sm rounded-[22px] p-6 shadow-[0_10px_30px_-5px_rgba(15,42,29,0.06),0_4px_12px_-2px_rgba(15,42,29,0.03)] hover:shadow-[0_16px_36px_-4px_rgba(15,42,29,0.10)] transition-all duration-300 border border-[#AEC3B0]/70 flex flex-col space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#AEC3B0]/60">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="text-[#375534] font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { id: "ALL", label: `Semua (${total})` },
                { id: "Normal", label: `Normal (${countNormal})` },
                { id: "Outer Race", label: `Outer Race (${countOuter})` },
                { id: "Inner Race", label: `Inner Race (${countInner})` },
                { id: "Ball Fault", label: `Ball Fault (${countBall})` },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterClass(item.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterClass === item.id
                      ? "bg-[#375534] text-white font-semibold"
                      : "bg-[#E3EED4]/50 text-[#375534] hover:text-[#0F2A1D]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowJsonViewer(!showJsonViewer)}
                className="px-3 py-1.5 rounded-lg border border-[#AEC3B0]/70 bg-[#E3EED4]/50 hover:bg-[#E3EED4] text-[12px] font-semibold text-[#0F2A1D] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showJsonViewer ? "Tutup Raw JSON" : "Lihat Raw JSON Request/Response"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 rounded-lg bg-[#375534] hover:bg-[#0F2A1D] text-white text-[12px] font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Hasil Diagnosa (CSV)</span>
              </button>
            </div>
          </div>

          {/* Raw JSON Debug Viewer */}
          {showJsonViewer && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0F2A1D] text-[#E3EED4] text-[11px] font-mono border border-[#AEC3B0]/30">
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center text-[#AEC3B0] font-bold border-b border-white/20 pb-1">
                  <span>FASTAPI REQUEST PAYLOAD ({lastRequestJson?.length || 0} unit)</span>
                  <span>POST /predict/batch</span>
                </div>
                <div className="overflow-x-auto max-h-64 p-2 bg-black/30 rounded">
                  <pre>{JSON.stringify(lastRequestJson, null, 2)}</pre>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center text-[#AEC3B0] font-bold border-b border-white/20 pb-1">
                  <span>FASTAPI RESPONSE PAYLOAD</span>
                  {batchLatency !== null && <span>Latensi: {batchLatency} ms</span>}
                </div>
                <div className="overflow-x-auto max-h-64 p-2 bg-black/30 rounded">
                  <pre>{JSON.stringify(lastResponseJson, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="w-full overflow-x-auto rounded-xl border border-[#AEC3B0]/70">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-[#E3EED4]/40 text-[#0F2A1D] font-semibold border-b border-[#AEC3B0]/60">
                <tr>
                  <th className="py-2.5 px-3.5">ID Mesin / Rekaman</th>
                  <th className="py-2.5 px-3.5">Posisi &amp; RPM</th>
                  <th className="py-2.5 px-3.5">RMS (g) &amp; Suhu</th>
                  <th className="py-2.5 px-3.5">Prediksi Kerusakan</th>
                  <th className="py-2.5 px-3.5">Keyakinan</th>
                  <th className="py-2.5 px-3.5">Status ISO 20816</th>
                  <th className="py-2.5 px-3.5">Rekomendasi Suku Cadang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#AEC3B0]/40 text-[#0F2A1D]">
                {filteredResults.map((row, idx) => {
                  let badge = "bg-[#E3EED4] text-[#375534] border-[#AEC3B0]";
                  if (row.status_bahaya === "KRITIS") {
                    badge = "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30";
                  } else if (row.status_bahaya === "WASPADA") {
                    badge = "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30";
                  }

                  return (
                    <tr key={idx} className="hover:bg-[#E3EED4]/30 transition-colors">
                      <td className="py-3 px-3.5 font-bold font-mono text-[12px]">
                        {row.id_rekaman}
                      </td>
                      <td className="py-3 px-3.5 tabular-nums text-[#375534]">
                        <div className="text-[#0F2A1D] font-medium capitalize">
                          {row.posisi_sensor?.replace("_", " ")}
                        </div>
                        <div className="text-[11px]">{row.kecepatan_rpm} RPM</div>
                      </td>
                      <td className="py-3 px-3.5 tabular-nums">
                        <div className="font-semibold text-[#0F2A1D]">{row.rms_g} g</div>
                        <div className="text-[11px] text-[#375534]">{row.suhu_housing_C}°C</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-bold border ${badge}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{row.kelas_prediksi}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-bold tabular-nums text-[#0F2A1D]">
                        {(row.keyakinan * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3.5 text-[12px] text-[#375534]">
                        <div className="font-semibold text-[#0F2A1D]">
                          {row.rekomendasi?.zona_iso_20816 || "Zona A"}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-[12px]">
                        <div className="font-semibold text-[#4A5D4E] font-mono text-[11.5px]">
                          {row.rekomendasi?.kode_suku_cadang || "-"}
                        </div>
                        <div className="text-[11px] text-[#5B7060] max-w-xs truncate" title={row.rekomendasi?.tindakan}>
                          {row.rekomendasi?.tindakan}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
