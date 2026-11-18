"""Load artifact sekali, lalu prediksi kondisi kerusakan bearing (multikelas).

Dipakai oleh FastAPI (app/api/main.py) dan Streamlit UI (app/ui/streamlit_app.py).
"""

from functools import lru_cache
import json
from pathlib import Path
import sys
import time

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ARTIFACT_DIR = ROOT / "artifacts"

# Pemetaan nama kelas internal ke label ramah pengguna
LABEL_KONDISI_MAP: dict[str, str] = {
    "normal": "Normal",
    "outer_race": "Outer Race Fault (Cincin Luar)",
    "inner_race": "Inner Race Fault (Cincin Dalam)",
    "bola": "Ball Fault (Bola Bantalan)",
}

# Rekomendasi suku cadang & tindakan teknisi
REKOMENDASI_MAP: dict[str, str] = {
    "normal": "Tidak perlu suku cadang, bearing beroperasi normal dalam batas aman.",
    "outer_race": "Siapkan Cincin Luar (Outer Ring) atau 1 set Bearing unit baru.",
    "inner_race": "Siapkan Cincin Dalam (Inner Ring) atau 1 set Bearing unit baru.",
    "bola": "Siapkan Rolling Elements / Bola Bantalan baru untuk penggantian.",
}


@lru_cache(maxsize=1)
def load():
    """Load model pipeline dan metadata sekali ke memori (lru_cache)."""
    model_path = ARTIFACT_DIR / "model.joblib"
    meta_path = ARTIFACT_DIR / "metadata.json"

    if not model_path.exists():
        raise FileNotFoundError(
            f"{model_path} tidak ditemukan. Pastikan sudah menjalankan train_model.py."
        )

    model = joblib.load(model_path)
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    return model, meta


def predict_rows(rows: list[dict]) -> list[dict]:
    """Prediksi batch kondisi kerusakan bearing (multikelas).

    Mengembalikan list dictionary dengan:
    - kondisi: kode kelas ('normal', 'outer_race', 'inner_race', 'bola')
    - label_kondisi: nama kelas terbaca manusia
    - probabilitas: dict probabilitas tiap kelas
    - probabilitas_tertinggi: confidence score tertinggi
    - rekomendasi: rekomendasi suku cadang / tindakan
    - latency_ms: waktu komputasi
    """
    if not rows:
        return []

    model, meta = load()
    mulai = time.perf_counter()

    fitur_input = meta.get(
        "fitur_input",
        [
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
    )

    X = pd.DataFrame(rows)[fitur_input]

    # Model pipeline langsung mengekstrak fitur dan memprediksi
    probas = model.predict_proba(X)
    preds = model.predict(X)
    classes = list(model.classes_)

    latency = round((time.perf_counter() - mulai) * 1000, 2)
    versi = meta.get("versi_model", "1.0.0")

    hasil = []
    for i, pred_class in enumerate(preds):
        p_row = probas[i]
        prob_dict = {
            cls_name: round(float(p_row[c_idx]), 4)
            for c_idx, cls_name in enumerate(classes)
        }
        max_prob = round(float(np.max(p_row)), 4)

        hasil.append(
            {
                "kondisi": str(pred_class),
                "label_kondisi": LABEL_KONDISI_MAP.get(str(pred_class), str(pred_class).title()),
                "probabilitas": prob_dict,
                "probabilitas_tertinggi": max_prob,
                "rekomendasi": REKOMENDASI_MAP.get(
                    str(pred_class), "Pemeriksaan berkala unit bearing."
                ),
                "versi_model": versi,
                "latency_ms": latency,
            }
        )

    return hasil


def predict_one(row: dict) -> dict:
    """Helper untuk memprediksi satu sampel sensor bearing."""
    return predict_rows([row])[0]
