"""Load artifact sekali, lalu prediksi kondisi kerusakan bearing (multikelas).

Dipakai oleh FastAPI (app/api/main.py) dan Streamlit UI (app/ui/streamlit_app.py).
Mendukung frontend Next.js dengan nama kelas resmi, level bahaya, distribusi probabilitas,
serta rekomendasi teknis presisi.
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

# Pemetaan nama kelas internal ke label ramah pengguna (Next.js & UI)
LABEL_KONDISI_MAP: dict[str, str] = {
    "normal": "Normal",
    "outer_race": "Outer Race",
    "inner_race": "Inner Race",
    "bola": "Ball Fault",
}

# Level status bahaya mesin industri
STATUS_BAHAYA_MAP: dict[str, str] = {
    "normal": "AMAN",
    "outer_race": "WASPADA",
    "inner_race": "WASPADA",
    "bola": "KRITIS",
}

# Rekomendasi suku cadang & tindakan teknisi presisi berstandar ISO 20816
REKOMENDASI_MAP: dict[str, dict[str, str]] = {
    "normal": {
        "tindakan": "Bantalan beroperasi dalam batas normal toleransi ISO 20816. Lanjutkan pemantauan berkala dan pelumasan rutin sesuai SOP.",
        "komponen": "Tidak diperlukan penggantian suku cadang",
        "kode_suku_cadang": "Status Normal",
        "ketersediaan": "Tersedia di inventaris reguler",
        "zona_iso_20816": "Zona A (Kondisi Sangat Baik)",
    },
    "outer_race": {
        "tindakan": "Terdeteksi indikasi kerusakan cincin luar (BPFO). Jadwalkan inspeksi visual alur cincin luar dan lumasi ulang pada jadwal preventif berikutnya.",
        "komponen": "Cincin Luar Bantalan (Outer Ring)",
        "kode_suku_cadang": "SKF NU 214 ECP",
        "ketersediaan": "Stok 2 unit di rak A-08",
        "zona_iso_20816": "Zona B (Dapat Diterima / Perlu Pemantauan)",
    },
    "inner_race": {
        "tindakan": "Terdeteksi deformasi alur cincin dalam (BPFI) yang berputar bersama poros. Tingkatkan frekuensi pemantauan vibrasi harian dan persiapkan penggantian bearing.",
        "komponen": "Cincin Dalam Bantalan (Inner Ring)",
        "kode_suku_cadang": "SKF 6312-C3",
        "ketersediaan": "Stok 3 unit di rak C-02",
        "zona_iso_20816": "Zona C (Batas Waspada)",
    },
    "bola": {
        "tindakan": "Terdeteksi impuls getaran repetitif tinggi pada elemen bola (BSF). Hentikan operasi atau jadwalkan penggantian bearing segera untuk mencegah macet poros mendadak.",
        "komponen": "Deep Groove Ball Bearing (Rolling Elements)",
        "kode_suku_cadang": "SKF 6208-2RS",
        "ketersediaan": "Stok 4 unit di rak B-14",
        "zona_iso_20816": "Zona D (Kritis / Bahaya Kerusakan Total)",
    },
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

    Mengembalikan list dictionary yang memenuhi spesifikasi Next.js dan kompatibilitas:
    - kelas_prediksi: 'Normal', 'Outer Race', 'Inner Race', 'Ball Fault'
    - status_bahaya: 'AMAN', 'WASPADA', 'KRITIS'
    - keyakinan: float (0.0 - 1.0)
    - distribusi_probabilitas: dict probabilitas 4 kelas resmi
    - rekomendasi: dict rincian tindakan, komponen, kode suku cadang, ketersediaan, zona ISO 20816
    - versi_model: versi model aktif
    - latency_ms: waktu komputasi inferensi
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
        cls_str = str(pred_class)

        # Probabilitas kode kelas internal (normal, outer_race, inner_race, bola)
        prob_dict_raw = {
            cls_name: round(float(p_row[c_idx]), 4)
            for c_idx, cls_name in enumerate(classes)
        }

        # Probabilitas format resmi Next.js (Normal, Outer Race, Inner Race, Ball Fault)
        dist_probas = {
            LABEL_KONDISI_MAP.get(cls_name, cls_name): round(float(p_row[c_idx]), 4)
            for c_idx, cls_name in enumerate(classes)
        }
        for expected_label in ("Normal", "Outer Race", "Inner Race", "Ball Fault"):
            if expected_label not in dist_probas:
                dist_probas[expected_label] = 0.0

        max_prob = round(float(np.max(p_row)), 4)
        kelas_utama = LABEL_KONDISI_MAP.get(cls_str, "Normal")
        status = STATUS_BAHAYA_MAP.get(cls_str, "WASPADA")
        rekom = REKOMENDASI_MAP.get(cls_str, REKOMENDASI_MAP["normal"])

        hasil.append(
            {
                # Format resmi Next.js
                "kelas_prediksi": kelas_utama,
                "status_bahaya": status,
                "keyakinan": max_prob,
                "distribusi_probabilitas": dist_probas,
                "rekomendasi": rekom,
                "versi_model": versi,
                "latency_ms": latency,

                # Kompatibilitas sistem eksisting
                "kondisi": cls_str,
                "label_kondisi": kelas_utama,
                "probabilitas": prob_dict_raw,
                "probabilitas_tertinggi": max_prob,
            }
        )

    return hasil


def predict_one(row: dict) -> dict:
    """Helper untuk memprediksi satu sampel sensor bearing."""
    return predict_rows([row])[0]
