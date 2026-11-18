"""FastAPI Backend untuk Prediksi & Diagnosis Kerusakan Bearing (Kasus 4).

Menjalankan model klasifikasi multikelas (normal, outer_race, inner_race, bola)
dengan validasi Pydantic ketat (fail-fast HTTP 422).

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
        "(Normal, Outer Race Fault, Inner Race Fault, Ball Fault) berdasarkan ringkasan getaran sensor."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


class InputData(BaseModel):
    """Skema input parameter sensor getaran dan operasional bearing.

    Input yang melanggar batas fisika divalidasi dan ditolak dengan status HTTP 422.
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
        """Sanitasi otomatis: menghapus whitespace, lowercase, dan standarisasi underscore."""
        if isinstance(v, str):
            v_clean = v.strip().lower().replace(" ", "_").replace("-", "_")
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


class PrediksiResponse(BaseModel):
    """Skema respons hasil inferensi klasifikasi multikelas kerusakan bearing."""

    kondisi: Literal["normal", "outer_race", "inner_race", "bola"] = Field(
        description="Kode kelas kondisi bearing terprediksi"
    )
    label_kondisi: str = Field(
        description="Nama kelas kondisi/kerusakan yang mudah dibaca teknisi"
    )
    probabilitas: dict[str, float] = Field(
        description="Sebaran nilai probabilitas untuk masing-masing kelas (0.0 - 1.0)"
    )
    probabilitas_tertinggi: float = Field(
        description="Skor keyakinan (confidence score) dari kelas terprediksi"
    )
    rekomendasi: str = Field(
        description="Rekomendasi suku cadang dan tindakan perbaikan untuk teknisi pabrik"
    )
    versi_model: str = Field(description="Versi model yang aktif melayani request")
    latency_ms: float = Field(description="Waktu inferensi komputasi model (milidetik)")


def _log(inputs: list[dict], outputs: list[dict]):
    """Audit logging: mencatat input dan output untuk monitoring data drift & latency."""
    for x, y in zip(inputs, outputs):
        log.info("prediksi %s", json.dumps({"input": x, "output": y, "timestamp": time.time()}))


@app.get("/health")
def health():
    """Endpoint health check server & metadata model yang sedang berjalan."""
    _, meta = predictor.load()
    return {
        "status": "ok",
        "versi_model": meta.get("versi_model", "1.0.0"),
        "kasus": meta.get("kasus", "Kasus 4: Diagnosis Kerusakan Bearing"),
        "kelas_target": meta.get(
            "kelas_target", ["bola", "inner_race", "normal", "outer_race"]
        ),
        "fitur_input": meta.get("fitur_input", []),
        "macro_f1": meta.get("metrik_test", {}).get("macro_f1", 0.0),
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
            status_code=413,
            detail=f"Batch terlalu besar: maksimal {MAX_BATCH} item per request.",
        )
    rows = [x.model_dump() for x in xs]
    if not rows:
        return []
    hasil = predictor.predict_rows(rows)
    _log(rows, hasil)
    return hasil
