"""Module Preprocessing & Feature Engineering untuk Diagnosis Kerusakan Bearing (Kasus 4).

Digunakan secara konsisten pada proses pelatihan model (train_model.py)
dan pipeline inferensi / deployment (FastAPI & Streamlit).
Wajib kompatibel dengan: sklearn.preprocessing.FunctionTransformer(func=tambah_fitur)
"""

from typing import Any
import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# 1. BASELINE IMPUTASI & FALLBACK SENSOR
# Nilai default ini diperoleh dari median (numerik) dan modus (kategorikal)
# dari data training raw.csv.
# ---------------------------------------------------------------------------
FALLBACK_NILAI: dict[str, Any] = {
    "posisi_sensor": "drive_end",
    "kecepatan_rpm": 2095.5,
    "beban_kN": 3.23,
    "suhu_housing_C": 52.7,
    "rms_g": 0.47,
    "puncak_g": 1.5433,
    "kurtosis": 3.3285,
    "crest_factor": 3.314,
    "energi_bpfo": 0.0804,
    "energi_bpfi": 0.0659,
    "energi_bsf": 0.0614,
    "frekuensi_dominan_hz": 49.0,
}

# Daftar kolom input mentah yang diharapkan dari sensor / user
KOLOM_FITUR_MENTAH = [
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
]

# Daftar kolom numerik hasil feature engineering yang diteruskan ke estimator
KOLOM_FITUR_MODEL = [
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
    "is_drive_end",
    "frekuensi_rotasi_hz",
    "rasio_frekuensi_dominan",
    "energi_kerusakan_total",
    "rasio_bpfo",
    "rasio_bpfi",
    "rasio_bsf",
    "rasio_getaran_beban",
    "indeks_keparahan",
    "daya_getaran",
    "selisih_bpfi_bpfo",
]

# Pemetaan label target kotor dari sistem lapangan ke 4 kelas standar
MAP_TARGET_KONDISI = {
    "normal": "normal",
    "ok": "normal",
    "NORMAL": "normal",
    "Normal": "normal",
    "outer_race": "outer_race",
    "outer": "outer_race",
    "Outer Race": "outer_race",
    "OR": "outer_race",
    "inner_race": "inner_race",
    "IR": "inner_race",
    "inner": "inner_race",
    "Inner Race": "inner_race",
    "bola": "bola",
    "BALL": "bola",
    "ball": "bola",
    "Bola": "bola",
}


def bersihkan_target(y_series: pd.Series) -> pd.Series:
    """Membersihkan variasi penulisan string label kelas pada kolom target."""
    cleaned = (
        y_series.astype(str)
        .str.strip()
        .map(MAP_TARGET_KONDISI)
        .fillna(y_series.astype(str).str.strip().str.lower())
    )
    return cleaned


def bersihkan_data(df: pd.DataFrame) -> pd.DataFrame:
    """Membersihkan data mentah sensor: tipe data, missing values, dan anomali nilai fisik."""
    df = df.copy()

    # Pastikan semua kolom input mentah ada, isi dengan fallback jika hilang
    for col in KOLOM_FITUR_MENTAH:
        if col not in df.columns:
            df[col] = FALLBACK_NILAI.get(col, 0.0)

    # 1. Normalisasi dan pembersihan fitur numerik
    numerik_cols = [c for c in KOLOM_FITUR_MENTAH if c != "posisi_sensor"]
    for col in numerik_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df[col] = df[col].fillna(FALLBACK_NILAI.get(col, 0.0))

    # Anomali fisika: RMS getaran tidak boleh negatif (koreksi tanda minus tak sengaja)
    df["rms_g"] = df["rms_g"].abs()

    # Nilai getaran tidak boleh persis 0 untuk mencegah zero-division
    df["rms_g"] = np.maximum(df["rms_g"], 1e-4)

    # Validasi crest factor jika hilang atau <= 0
    df["crest_factor"] = np.where(
        df["crest_factor"] <= 0,
        df["puncak_g"] / df["rms_g"],
        df["crest_factor"],
    )

    # 2. Normalisasi string sensor posisi
    df["posisi_sensor"] = (
        df["posisi_sensor"]
        .fillna(FALLBACK_NILAI["posisi_sensor"])
        .astype(str)
        .str.strip()
        .str.lower()
    )

    return df


def tambah_fitur(df: pd.DataFrame) -> pd.DataFrame:
    """Mengekstrak fitur domain diagnosis bearing (frekuensi, energi getaran, rasio beban).

    Kompatibel dengan FunctionTransformer scikit-learn.
    Menerima DataFrame mentah dan mengembalikan DataFrame numerik bersih siap pakai.
    """
    df = bersihkan_data(df)

    # Fitur 1: Indikator biner posisi sensor (drive_end = 1, fan_end = 0)
    df["is_drive_end"] = (df["posisi_sensor"] == "drive_end").astype(float)

    # Fitur 2: Frekuensi rotasi poros dasar (1 Hz = 60 RPM)
    rotasi_hz = np.maximum(df["kecepatan_rpm"] / 60.0, 0.1)
    df["frekuensi_rotasi_hz"] = rotasi_hz

    # Fitur 3: Rasio frekuensi getaran dominan terhadap frekuensi rotasi poros
    df["rasio_frekuensi_dominan"] = df["frekuensi_dominan_hz"] / rotasi_hz

    # Fitur 4: Total energi kerusakan dan proporsi energi per komponen bearing
    # BPFO = Ball Pass Frequency Outer race
    # BPFI = Ball Pass Frequency Inner race
    # BSF  = Ball Spin Frequency
    tot_energi = df["energi_bpfo"] + df["energi_bpfi"] + df["energi_bsf"]
    df["energi_kerusakan_total"] = tot_energi
    df["rasio_bpfo"] = df["energi_bpfo"] / (tot_energi + 1e-6)
    df["rasio_bpfi"] = df["energi_bpfi"] / (tot_energi + 1e-6)
    df["rasio_bsf"] = df["energi_bsf"] / (tot_energi + 1e-6)

    # Fitur 5: Beban vs Getaran (Rasio tegangan dinamis bearing)
    beban_aman = np.maximum(df["beban_kN"], 0.1)
    df["rasio_getaran_beban"] = df["rms_g"] / beban_aman

    # Fitur 6: Indeks keparahan impuls (RMS * Kurtosis; kurtosis tinggi = benturan tajam)
    df["indeks_keparahan"] = df["rms_g"] * df["kurtosis"]

    # Fitur 7: Estimasi energi kinetik getaran sesaat (Puncak * RMS)
    df["daya_getaran"] = df["puncak_g"] * df["rms_g"]

    # Fitur 8: Selisih energi inner vs outer untuk membedakan kerusakan cincin
    df["selisih_bpfi_bpfo"] = df["energi_bpfi"] - df["energi_bpfo"]

    # Pastikan tidak ada nilai inf / -inf atau NaN tersisa
    df = df.replace([np.inf, -np.inf], np.nan)
    for col in KOLOM_FITUR_MODEL:
        if col in df.columns:
            df[col] = df[col].fillna(0.0)

    return df[KOLOM_FITUR_MODEL]
