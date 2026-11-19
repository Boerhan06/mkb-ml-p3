"""FastAPI Backend untuk Prediksi & Diagnosis Kerusakan Bearing (Kasus 4).

Menjalankan model klasifikasi multikelas (normal, outer_race, inner_race, bola)
dengan validasi Pydantic ketat (fail-fast HTTP 422) dan dukungan penuh frontend Next.js.

Jalankan lokal:
    uvicorn app.api.main:app --reload --port 8000
Buka dokumentasi Swagger UI:
    http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager
import json
import logging
from pathlib import Path
import sys
import time
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from app import predictor  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("diagnosis_bearing")

MAX_BATCH = 1000


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor.load()
    yield


app = FastAPI(
    title="API Diagnosis Kerusakan Bearing",
    description=(
        "Layanan inferensi Machine Learning untuk mendiagnosis kondisi dan kerusakan bearing "
        "(Normal, Outer Race, Inner Race, Ball Fault) berdasarkan ringkasan telemetri sensor vibrasi."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Konfigurasi CORS untuk Mendukung Akses Frontend Next.js (Localhost & Vercel)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InputData(BaseModel):
    """Skema input parameter sensor getaran dan operasional bearing.

    Input yang melanggar batas fisika atau string kosong divalidasi ketat dan
    ditolak dengan status HTTP 422 Unprocessable Entity.
    """

    posisi_sensor: Literal["drive_end", "fan_end"] = Field(
        description="Posisi pemasangan sensor: 'drive_end' (sisi beban) atau 'fan_end' (sisi kipas)"
    )
    kecepatan_rpm: float = Field(
        ge=0.0,
        le=10000.0,
        description="Kecepatan putar poros saat direkam (putaran per menit / RPM, >= 0)",
    )
    beban_kN: float = Field(
        gt=0.0,
        le=100.0,
        description="Beban mekanis yang bekerja pada bearing (kilonewton, > 0)",
    )
    suhu_housing_C: float = Field(
        ge=-20.0,
        le=200.0,
        description="Suhu rumah atau casing bantalan (°C)",
    )
    rms_g: float = Field(
        ge=0.0,
        le=50.0,
        description="Besar getaran rata-rata RMS (satuan gravitasi g, >= 0)",
    )
    puncak_g: float = Field(
        ge=0.0,
        le=100.0,
        description="Amplitudo getaran puncak tertinggi (satuan gravitasi g, >= 0)",
    )
    kurtosis: float = Field(
        ge=0.0,
        le=50.0,
        description="Ukuran keruncingan sinyal getaran (kurtosis, >= 0)",
    )
    crest_factor: float = Field(
        ge=1.0,
        le=50.0,
        description="Rasio nilai puncak dibagi nilai RMS (crest factor, nilai teoritis >= 1.0)",
    )
    energi_bpfo: float = Field(
        ge=0.0,
        le=10.0,
        description="Energi getaran pada frekuensi khas kerusakan cincin luar (BPFO, >= 0)",
    )
    energi_bpfi: float = Field(
        ge=0.0,
        le=10.0,
        description="Energi getaran pada frekuensi khas kerusakan cincin dalam (BPFI, >= 0)",
    )
    energi_bsf: float = Field(
        ge=0.0,
        le=10.0,
        description="Energi getaran pada frekuensi khas kerusakan bola bearing (BSF, >= 0)",
    )
    frekuensi_dominan_hz: float = Field(
        gt=0.0,
        le=5000.0,
        description="Frekuensi getaran dengan daya terbesar (hertz, > 0)",
    )

    @field_validator("posisi_sensor", mode="before")
    @classmethod
    def normalisasi_posisi_sensor(cls, v: str) -> str:
        """Sanitasi otomatis: menghapus whitespace, lowercase, standarisasi underscore, dan tolak string kosong."""
        if isinstance(v, str):
            v_clean = v.strip().lower().replace(" ", "_").replace("-", "_")
            if not v_clean:
                raise ValueError("posisi_sensor tidak boleh berupa string kosong")
            return v_clean
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "posisi_sensor": "drive_end",
                    "kecepatan_rpm": 2419.0,
                    "beban_kN": 2.09,
                    "suhu_housing_C": 55.3,
                    "rms_g": 0.5089,
                    "puncak_g": 1.6455,
                    "kurtosis": 2.894,
                    "crest_factor": 3.234,
                    "energi_bpfo": 0.023,
                    "energi_bpfi": 0.0045,
                    "energi_bsf": 0.1951,
                    "frekuensi_dominan_hz": 82.7,
                }
            ]
        }
    }


class RekomendasiData(BaseModel):
    """Rincian rekomendasi tindakan, suku cadang, dan klasifikasi standar ISO 20816."""

    tindakan: str = Field(description="Rekomendasi tindakan teknis pemeliharaan presisi")
    komponen: str = Field(description="Komponen mekanis terkait")
    kode_suku_cadang: str = Field(description="Nomor part / kode suku cadang bearing")
    ketersediaan: str = Field(description="Status ketersediaan stok suku cadang di gudang")
    zona_iso_20816: str = Field(description="Klasifikasi zona getaran menurut standar ISO 20816")


class PrediksiResponse(BaseModel):
    """Skema respons hasil inferensi klasifikasi multikelas kerusakan bearing untuk Next.js & UI."""

    kelas_prediksi: Literal["Normal", "Outer Race", "Inner Race", "Ball Fault"] = Field(
        description="Nama kelas kondisi/kerusakan utama hasil inferensi model"
    )
    status_bahaya: Literal["AMAN", "WASPADA", "KRITIS"] = Field(
        description="Level status bahaya mesin industri (AMAN, WASPADA, KRITIS)"
    )
    keyakinan: float = Field(
        description="Probabilitas kelas tertinggi (rentang 0.0 - 1.0)"
    )
    distribusi_probabilitas: dict[str, float] = Field(
        description="Sebaran nilai probabilitas untuk masing-masing kelas (Normal, Outer Race, Inner Race, Ball Fault)"
    )
    rekomendasi: RekomendasiData = Field(
        description="Dictionary rincian rekomendasi tindakan, suku cadang, dan zona ISO 20816"
    )
    versi_model: str = Field(description="Versi model yang aktif melayani request")
    latency_ms: float = Field(description="Waktu inferensi komputasi model (milidetik)")

    # Field kompatibilitas untuk sistem eksisting
    kondisi: str = Field(description="Kode kelas internal (normal, outer_race, inner_race, bola)")
    label_kondisi: str = Field(description="Nama kelas kondisi/kerusakan")
    probabilitas: dict[str, float] = Field(
        description="Distribusi probabilitas kode kelas internal"
    )
    probabilitas_tertinggi: float = Field(
        description="Alias skor keyakinan kelas tertinggi"
    )


def _log(inputs: list[dict], outputs: list[dict]):
    """Audit logging: mencatat input dan output untuk monitoring data drift & latency."""
    for x, y in zip(inputs, outputs):
        log.info("prediksi %s", json.dumps({"input": x, "output": y, "timestamp": time.time()}))


@app.get("/health")
def health():
    """Endpoint health check server & metadata model yang sedang berjalan."""
    _, meta = predictor.load()
    macro_f1 = meta.get("metrik_test", {}).get(
        "macro_f1",
        meta.get("perbandingan_model", {}).get("best_random_forest", {}).get("macro_f1", 0.8014),
    )
    return {
        "status": "ok",
        "versi_model": meta.get("versi_model", "1.0.0"),
        "macro_f1": macro_f1,
        "fitur_input": meta.get("fitur_input", []),
        "kasus": meta.get("kasus", "Kasus 4: Diagnosis Kerusakan Bearing"),
        "kelas_target": meta.get(
            "kelas_target", ["bola", "inner_race", "normal", "outer_race"]
        ),
    }


@app.post("/predict", response_model=PrediksiResponse)
def predict(x: InputData):
    """Prediksi diagnosis kerusakan satu rekaman sensor bearing."""
    row = x.model_dump()
    hasil = predictor.predict_one(row)
    _log([row], [hasil])
    return hasil


@app.post("/predict/batch", response_model=list[PrediksiResponse])
def predict_batch(xs: list[InputData]):
    """Prediksi batch kondisi bearing (maksimal 1000 rekaman per request)."""
    if len(xs) > MAX_BATCH:
        raise HTTPException(
            status_code=400,
            detail=f"Ukuran batch melebihi batas maksimum {MAX_BATCH} baris.",
        )
    if not xs:
        return []
    rows = [x.model_dump() for x in xs]
    hasil = predictor.predict_rows(rows)
    _log(rows, hasil)
    return hasil
