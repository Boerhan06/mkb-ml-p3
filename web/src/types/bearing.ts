/**
 * Definisi Tipe Data Telemetri & Diagnosis Kerusakan Bearing (VibraCheck).
 */

export interface SensorInput {
  posisi_sensor: "drive_end" | "fan_end";
  kecepatan_rpm: number;
  beban_kN: number;
  suhu_housing_C: number;
  rms_g: number;
  puncak_g: number;
  kurtosis: number;
  crest_factor: number;
  energi_bpfo: number;
  energi_bpfi: number;
  energi_bsf: number;
  frekuensi_dominan_hz: number;
}

export interface RekomendasiData {
  tindakan: string;
  komponen: string;
  kode_suku_cadang: string;
  ketersediaan: string;
  zona_iso_20816: string;
}

export interface PredictionResponse {
  kelas_prediksi: "Normal" | "Outer Race" | "Inner Race" | "Ball Fault";
  status_bahaya: "AMAN" | "WASPADA" | "KRITIS";
  keyakinan: number;
  distribusi_probabilitas: {
    Normal: number;
    "Outer Race": number;
    "Inner Race": number;
    "Ball Fault": number;
    [key: string]: number;
  };
  rekomendasi: RekomendasiData;
  versi_model: string;
  latency_ms: number;
  kondisi?: string;
  label_kondisi?: string;
  probabilitas?: Record<string, number>;
  probabilitas_tertinggi?: number;
}

export interface HealthStatus {
  status: string;
  versi_model: string;
  macro_f1: number;
  fitur_input: string[];
  kasus?: string;
  kelas_target?: string[];
}

export type ScenarioPreset = "Normal" | "Outer Race" | "Inner Race" | "Ball Fault";

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  shift: string;
  avatar: string;
}

export interface MachineUnit {
  id: string;
  name: string;
  tag: string;
  initials: string;
  location: string;
  type: string;
  posisi_sensor: "drive_end" | "fan_end";
  rpm_nominal: number;
  status: "Aman" | "Waspada" | "Kritis";
  presetKondisi: ScenarioPreset;
}

export interface BatchMachineRecord extends SensorInput {
  id_rekaman: string;
  id_mesin?: string;
}

export interface BatchResultItem extends PredictionResponse {
  id_rekaman?: string;
  id_mesin?: string;
  posisi_sensor?: string;
  kecepatan_rpm?: number;
  rms_g?: number;
  suhu_housing_C?: number;
  beban_kN?: number;
}

export interface PydanticValidationErrorDetail {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: any;
  ctx?: Record<string, any>;
}
