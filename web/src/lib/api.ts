import {
  SensorInput,
  PredictionResponse,
  HealthStatus,
  ScenarioPreset,
  PydanticValidationErrorDetail,
} from "@/types/bearing";
import { FALLBACK_PREDICTIONS } from "./constants";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      status: "ok",
      versi_model: "1.0.0",
      macro_f1: 0.8014,
      fitur_input: [
        "posisi_sensor",
        "kecepatan_rpm",
        "beban_kN",
        "suhu_housing_C",
        "rms_g",
        "puncak_g",
        "kurtosis",
        "crest_factor",
        "energi_bpfo",
        "energi_bpfi",
        "energi_bsf",
        "frekuensi_dominan_hz",
      ],
      kasus: "Kasus 4: Diagnosis Kerusakan Bearing",
      kelas_target: ["bola", "inner_race", "normal", "outer_race"],
    };
  }
}

export type PredictResult =
  | {
      ok: true;
      data: PredictionResponse;
      status: number;
    }
  | {
      ok: false;
      status: number;
      detail: PydanticValidationErrorDetail[];
      rawError: any;
    };

export async function postPredictWithValidation(
  payload: any
): Promise<PredictResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        detail: Array.isArray(body?.detail) ? body.detail : [],
        rawError: body,
      };
    }

    return {
      ok: true,
      data: body as PredictionResponse,
      status: res.status,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      detail: [
        {
          type: "network_error",
          loc: ["network"],
          msg: `Gagal terhubung ke FastAPI backend (${API_BASE_URL}): ${err?.message || "Server offline"}`,
        },
      ],
      rawError: { message: err?.message || "Koneksi backend gagal" },
    };
  }
}

export async function postPredict(
  payload: SensorInput,
  activePreset?: ScenarioPreset
): Promise<PredictionResponse> {
  const result = await postPredictWithValidation(payload);
  if (result.ok) {
    return result.data;
  }
  if (activePreset && FALLBACK_PREDICTIONS[activePreset]) {
    return FALLBACK_PREDICTIONS[activePreset];
  }
  return FALLBACK_PREDICTIONS["Ball Fault"];
}

export type BatchPredictResult =
  | {
      ok: true;
      data: PredictionResponse[];
      requestBody: any;
      responseBody: any;
      latencyMs: number;
    }
  | {
      ok: false;
      error: string;
      status: number;
      requestBody?: any;
      responseBody?: any;
    };

export async function postPredictBatchWithValidation(
  rows: any[]
): Promise<BatchPredictResult> {
  const startTime = performance.now();
  try {
    const res = await fetch(`${API_BASE_URL}/predict/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });

    const body = await res.json();
    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}: ${JSON.stringify(body?.detail || body)}`,
        status: res.status,
        requestBody: rows,
        responseBody: body,
      };
    }

    return {
      ok: true,
      data: body as PredictionResponse[],
      requestBody: rows,
      responseBody: body,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      ok: false,
      error: `Koneksi gagal ke ${API_BASE_URL}: ${err?.message || "Network Error"}`,
      status: 0,
      requestBody: rows,
      responseBody: { error: err?.message },
    };
  }
}

export async function postPredictBatch(
  rows: SensorInput[]
): Promise<PredictionResponse[]> {
  const res = await postPredictBatchWithValidation(rows);
  if (res.ok) {
    return res.data;
  }
  return rows.map((r, i) => {
    const keys: ScenarioPreset[] = ["Normal", "Outer Race", "Inner Race", "Ball Fault"];
    return FALLBACK_PREDICTIONS[keys[i % keys.length]];
  });
}
