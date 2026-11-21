import { SensorInput, PredictionResponse } from "@/types/bearing";

export interface ValidationErrorItem {
  type: string;
  loc: string[];
  msg: string;
  input: any;
}

export function validateSensorInput(body: any): {
  valid: boolean;
  errors: ValidationErrorItem[];
  data?: SensorInput;
} {
  const errors: ValidationErrorItem[] = [];

  if (!body || typeof body !== "object") {
    return {
      valid: false,
      errors: [
        {
          type: "model_type",
          loc: ["body"],
          msg: "Input body harus berupa JSON object",
          input: body,
        },
      ],
    };
  }

  // posisi_sensor
  let pos = body.posisi_sensor;
  if (typeof pos === "string") {
    pos = pos.trim().toLowerCase().replace(/[\s-]+/g, "_");
  }
  if (!pos || (pos !== "drive_end" && pos !== "fan_end")) {
    errors.push({
      type: "literal_error",
      loc: ["body", "posisi_sensor"],
      msg: "Input should be 'drive_end' or 'fan_end'",
      input: body.posisi_sensor,
    });
  }

  // kecepatan_rpm: ge=0.0, le=10000.0
  const rpm = Number(body.kecepatan_rpm);
  if (isNaN(rpm) || rpm < 0) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "kecepatan_rpm"],
      msg: "Input should be greater than or equal to 0",
      input: body.kecepatan_rpm,
    });
  } else if (rpm > 10000) {
    errors.push({
      type: "less_than_equal",
      loc: ["body", "kecepatan_rpm"],
      msg: "Input should be less than or equal to 10000",
      input: body.kecepatan_rpm,
    });
  }

  // beban_kN: gt=0.0, le=100.0
  const beban = Number(body.beban_kN);
  if (isNaN(beban) || beban <= 0) {
    errors.push({
      type: "greater_than",
      loc: ["body", "beban_kN"],
      msg: "Input should be greater than 0",
      input: body.beban_kN,
    });
  } else if (beban > 100) {
    errors.push({
      type: "less_than_equal",
      loc: ["body", "beban_kN"],
      msg: "Input should be less than or equal to 100",
      input: body.beban_kN,
    });
  }

  // suhu_housing_C: ge=-20.0, le=200.0
  const suhu = Number(body.suhu_housing_C);
  if (isNaN(suhu) || suhu < -20) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "suhu_housing_C"],
      msg: "Input should be greater than or equal to -20",
      input: body.suhu_housing_C,
    });
  } else if (suhu > 200) {
    errors.push({
      type: "less_than_equal",
      loc: ["body", "suhu_housing_C"],
      msg: "Input should be less than or equal to 200",
      input: body.suhu_housing_C,
    });
  }

  // rms_g: ge=0.0, le=50.0
  const rms = Number(body.rms_g);
  if (isNaN(rms) || rms < 0) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "rms_g"],
      msg: "Input should be greater than or equal to 0",
      input: body.rms_g,
    });
  } else if (rms > 50) {
    errors.push({
      type: "less_than_equal",
      loc: ["body", "rms_g"],
      msg: "Input should be less than or equal to 50",
      input: body.rms_g,
    });
  }

  // puncak_g: ge=0.0, le=100.0
  const puncak = Number(body.puncak_g);
  if (isNaN(puncak) || puncak < 0) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "puncak_g"],
      msg: "Input should be greater than or equal to 0",
      input: body.puncak_g,
    });
  }

  // kurtosis: ge=0.0, le=50.0
  const kurtosis = Number(body.kurtosis);
  if (isNaN(kurtosis) || kurtosis < 0) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "kurtosis"],
      msg: "Input should be greater than or equal to 0",
      input: body.kurtosis,
    });
  }

  // crest_factor: ge=1.0, le=50.0
  const crest = Number(body.crest_factor);
  if (isNaN(crest) || crest < 1.0) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "crest_factor"],
      msg: "Input should be greater than or equal to 1",
      input: body.crest_factor,
    });
  }

  // energi_bpfo: ge=0.0, le=10.0
  const bpfo = Number(body.energi_bpfo);
  if (isNaN(bpfo) || bpfo < 0) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "energi_bpfo"],
      msg: "Input should be greater than or equal to 0",
      input: body.energi_bpfo,
    });
  }

  // energi_bpfi: ge=0.0, le=10.0
  const bpfi = Number(body.energi_bpfi);
  if (isNaN(bpfi) || bpfi < 0) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "energi_bpfi"],
      msg: "Input should be greater than or equal to 0",
      input: body.energi_bpfi,
    });
  }

  // energi_bsf: ge=0.0, le=10.0
  const bsf = Number(body.energi_bsf);
  if (isNaN(bsf) || bsf < 0) {
    errors.push({
      type: "greater_than_equal",
      loc: ["body", "energi_bsf"],
      msg: "Input should be greater than or equal to 0",
      input: body.energi_bsf,
    });
  }

  // frekuensi_dominan_hz: gt=0.0, le=5000.0
  const freq = Number(body.frekuensi_dominan_hz);
  if (isNaN(freq) || freq <= 0) {
    errors.push({
      type: "greater_than",
      loc: ["body", "frekuensi_dominan_hz"],
      msg: "Input should be greater than 0",
      input: body.frekuensi_dominan_hz,
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      posisi_sensor: pos as "drive_end" | "fan_end",
      kecepatan_rpm: rpm,
      beban_kN: beban,
      suhu_housing_C: suhu,
      rms_g: rms,
      puncak_g: puncak,
      kurtosis: kurtosis,
      crest_factor: crest,
      energi_bpfo: bpfo,
      energi_bpfi: bpfi,
      energi_bsf: bsf,
      frekuensi_dominan_hz: freq,
    },
  };
}

export function computePrediction(input: SensorInput, startTime: number): PredictionResponse {
  const {
    rms_g,
    kurtosis,
    energi_bpfo,
    energi_bpfi,
    energi_bsf,
  } = input;

  // Skor energi komponen
  const eBpfo = Math.max(0, energi_bpfo);
  const eBpfi = Math.max(0, energi_bpfi);
  const eBsf = Math.max(0, energi_bsf);
  const totalEnergiCacat = eBpfo + eBpfi + eBsf;

  // Logika pembobotan probabilitas berdasarkan sinyal fisika getaran
  let scoreNormal = 0;
  let scoreOuter = 0;
  let scoreInner = 0;
  let scoreBall = 0;

  if (totalEnergiCacat < 0.15 && rms_g < 0.55 && kurtosis < 3.5) {
    // Sinyal dominan wajar (Normal)
    scoreNormal = 4.0 + (0.55 - rms_g) * 3.0;
    scoreOuter = eBpfo * 5.0;
    scoreInner = eBpfi * 5.0;
    scoreBall = eBsf * 5.0;
  } else {
    // Sinyal indikasi anomali
    scoreNormal = Math.max(0.05, 1.0 - (rms_g * 1.2 + totalEnergiCacat * 2.0));
    scoreOuter = eBpfo * 14.0 + (rms_g > 0.6 ? 0.8 : 0);
    scoreInner = eBpfi * 14.0 + (rms_g > 0.6 ? 0.8 : 0);
    scoreBall = eBsf * 14.0 + (kurtosis > 4.5 ? 1.5 : 0) + (rms_g > 0.8 ? 1.0 : 0);
  }

  // Softmax probabilitas
  const maxScore = Math.max(scoreNormal, scoreOuter, scoreInner, scoreBall);
  const expNormal = Math.exp(scoreNormal - maxScore);
  const expOuter = Math.exp(scoreOuter - maxScore);
  const expInner = Math.exp(scoreInner - maxScore);
  const expBall = Math.exp(scoreBall - maxScore);
  const sumExp = expNormal + expOuter + expInner + expBall;

  const pNormal = Math.round((expNormal / sumExp) * 10000) / 10000;
  const pOuter = Math.round((expOuter / sumExp) * 10000) / 10000;
  const pInner = Math.round((expInner / sumExp) * 10000) / 10000;
  const pBall = Math.round((expBall / sumExp) * 10000) / 10000;

  const probs = {
    Normal: pNormal,
    "Outer Race": pOuter,
    "Inner Race": pInner,
    "Ball Fault": pBall,
  };

  // Cari kelas tertinggi
  let kelasPrediksi: "Normal" | "Outer Race" | "Inner Race" | "Ball Fault" = "Normal";
  let maxP = -1;
  for (const [k, v] of Object.entries(probs)) {
    if (v > maxP) {
      maxP = v;
      kelasPrediksi = k as any;
    }
  }

  let statusBahaya: "AMAN" | "WASPADA" | "KRITIS" = "AMAN";
  let kondisi = "normal";
  let labelKondisi = "Normal";
  let rekomendasi = {
    tindakan:
      "Bantalan beroperasi dalam batas normal toleransi ISO 20816. Lanjutkan pemantauan berkala 30 hari dan pelumasan rutin sesuai SOP.",
    komponen: "Tidak diperlukan penggantian suku cadang",
    kode_suku_cadang: "Status Normal",
    ketersediaan: "Tersedia di inventaris reguler",
    zona_iso_20816: "Zona A (Kondisi Sangat Baik)",
  };

  if (kelasPrediksi === "Outer Race") {
    statusBahaya = "WASPADA";
    kondisi = "outer_race";
    labelKondisi = "Outer Race";
    rekomendasi = {
      tindakan:
        "Terdeteksi indikasi kerusakan cincin luar (BPFO). Jadwalkan inspeksi visual alur cincin luar dan lumasi ulang pada jadwal preventif berikutnya.",
      komponen: "Cincin Luar Bantalan (Outer Ring)",
      kode_suku_cadang: "SKF NU 214 ECP",
      ketersediaan: "Stok 2 unit di rak A-08",
      zona_iso_20816: "Zona B (Dapat Diterima / Perlu Pemantauan)",
    };
  } else if (kelasPrediksi === "Inner Race") {
    statusBahaya = "WASPADA";
    kondisi = "inner_race";
    labelKondisi = "Inner Race";
    rekomendasi = {
      tindakan:
        "Terdeteksi deformasi alur cincin dalam (BPFI) yang berputar bersama poros. Tingkatkan frekuensi pemantauan vibrasi harian dan persiapkan penggantian bearing.",
      komponen: "Cincin Dalam Bantalan (Inner Ring)",
      kode_suku_cadang: "SKF 6312-C3",
      ketersediaan: "Stok 3 unit di rak C-02",
      zona_iso_20816: "Zona C (Batas Waspada)",
    };
  } else if (kelasPrediksi === "Ball Fault") {
    statusBahaya = "KRITIS";
    kondisi = "bola";
    labelKondisi = "Ball Fault";
    rekomendasi = {
      tindakan:
        "Terdeteksi impuls getaran repetitif tinggi pada elemen bola (BSF). Hentikan operasi atau jadwalkan penggantian bearing segera untuk mencegah macet poros mendadak.",
      komponen: "Deep Groove Ball Bearing (Rolling Elements)",
      kode_suku_cadang: "SKF 6208-2RS",
      ketersediaan: "Stok 4 unit di rak B-14",
      zona_iso_20816: "Zona D (Kritis / Bahaya Kerusakan Total)",
    };
  }

  const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    kelas_prediksi: kelasPrediksi,
    status_bahaya: statusBahaya,
    keyakinan: maxP,
    distribusi_probabilitas: probs,
    rekomendasi,
    versi_model: "1.0.0",
    latency_ms: latencyMs,
    kondisi,
    label_kondisi: labelKondisi,
    probabilitas: {
      bola: pBall,
      inner_race: pInner,
      normal: pNormal,
      outer_race: pOuter,
    },
    probabilitas_tertinggi: maxP,
  };
}
