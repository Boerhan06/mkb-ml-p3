"""Script Pelatihan Model: Kasus 4 - Diagnosis Kerusakan Bearing.

Tugas: Klasifikasi Multikelas
Metrik Utama: Macro F1
Baseline: Regresi Logistik (Multikelas)
Model Utama: Random Forest Classifier (mengalahkan baseline)
Output:
- artifacts/model.joblib (Pipeline lengkap fitur + model)
- artifacts/metadata.json (Konfigurasi, metrik, daftar fitur, dan versi library)
"""

from datetime import datetime
import json
from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler

# Pastikan folder root ada di path impor
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.features import (
    KOLOM_FITUR_MENTAH,
    KOLOM_FITUR_MODEL,
    bersihkan_target,
    tambah_fitur,
)

ARTIFACT_DIR = ROOT / "artifacts"
DATA_PATH = ROOT / "data" / "raw.csv"


def muat_dan_siapkan_data(path: Path) -> tuple[pd.DataFrame, pd.Series]:
    """Membaca file data mentah dan memvalidasi kolom fitur serta target."""
    if not path.exists():
        raise FileNotFoundError(
            f"File dataset {path} tidak ditemukan! Pastikan file raw.csv berada di folder data/."
        )

    print(f"[1/6] Membaca dataset dari: {path}")
    df = pd.read_csv(path)
    print(f"      Dimensi data mentah: {df.shape[0]} baris x {df.shape[1]} kolom")

    # Ambil fitur mentah dan target
    X = df[KOLOM_FITUR_MENTAH].copy()
    y = bersihkan_target(df["kondisi"])

    print("      Distribusi kelas target (setelah pembersihan):")
    for cls, count in y.value_counts().items():
        persen = (count / len(y)) * 100
        print(f"       - {cls:<12}: {count:>5} baris ({persen:.2f}%)")

    return X, y


def bagi_data(
    X: pd.DataFrame, y: pd.Series
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Melakukan pembagian data secara Stratified Split.

    Alasan Pemilihan Stratified Split:
    1. Berdasarkan brief Kasus 04, setiap baris adalah ringkasan getaran 1 detik independen
       (bukan deret waktu berkesinambungan dari satu mesin tunggal).
    2. Terdapat ketidakseimbangan kelas (normal ~54%, outer_race ~20%, inner_race ~15%, bola ~10%).
    3. Stratified split menjamin proporsi setiap kategori kerusakan sama persis di data latih & uji.
    """
    print("\n[2/6] Membagi data menjadi Train (80%) dan Test (20%) secara Stratified Split...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"      Jumlah data latih: {len(X_train)} baris")
    print(f"      Jumlah data uji  : {len(X_test)} baris")
    return X_train, X_test, y_train, y_test


def latih_baseline_logistic_regression(
    X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame, y_test: pd.Series
) -> tuple[Pipeline, float, dict]:
    """Melatih model Baseline wajib: Regresi Logistik Multikelas."""
    print("\n[3/6] Melatih Model Baseline: Regresi Logistik (Multikelas)...")

    pipeline_baseline = Pipeline(
        [
            ("fe", FunctionTransformer(tambah_fitur, validate=False)),
            ("scaler", StandardScaler()),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    random_state=42,
                    class_weight="balanced",
                ),
            ),
        ]
    )

    pipeline_baseline.fit(X_train, y_train)
    y_pred = pipeline_baseline.predict(X_test)

    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))
    rep = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    print(f"      -> Baseline Macro F1 Score: {macro_f1:.4f}")
    return pipeline_baseline, macro_f1, rep


def latih_model_advanced(
    X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame, y_test: pd.Series
) -> tuple[Pipeline, float, dict, np.ndarray, list[str]]:
    """Melatih model Advanced: Random Forest Classifier."""
    print("\n[4/6] Melatih Model Advanced: Random Forest Classifier...")

    pipeline_advanced = Pipeline(
        [
            ("fe", FunctionTransformer(tambah_fitur, validate=False)),
            (
                "clf",
                RandomForestClassifier(
                    n_estimators=200,
                    max_depth=None,
                    min_samples_split=4,
                    min_samples_leaf=2,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    pipeline_advanced.fit(X_train, y_train)
    y_pred = pipeline_advanced.predict(X_test)

    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))
    rep = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    classes = list(pipeline_advanced.classes_)
    cm = confusion_matrix(y_test, y_pred, labels=classes)

    print(f"      -> Advanced Model Macro F1 Score: {macro_f1:.4f}")
    return pipeline_advanced, macro_f1, rep, cm, classes


def simpan_artifact(
    model: Pipeline,
    macro_f1_baseline: float,
    macro_f1_best: float,
    rep_best: dict,
    cm: np.ndarray,
    classes: list[str],
):
    """Menyimpan model joblib dan membuat metadata.json di folder artifacts/."""
    print("\n[5/6] Menyimpan model dan metadata ke folder artifacts/...")
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    model_path = ARTIFACT_DIR / "model.joblib"
    meta_path = ARTIFACT_DIR / "metadata.json"

    # 1. Simpan model pipeline joblib
    joblib.dump(model, model_path)
    print(f"      Model pipeline berhasil disimpan di: {model_path}")

    # 2. Cek versi library lingkungan saat ini
    import sklearn
    import pandas as pd
    import xgboost as xgb

    versi_lib = {
        "python": sys.version.split()[0],
        "sklearn": sklearn.__version__,
        "xgboost": getattr(xgb, "__version__", "unknown"),
        "pandas": pd.__version__,
        "joblib": joblib.__version__,
    }

    # Format confusion matrix agar mudah dibaca di JSON
    cm_dict = {
        classes[i]: {classes[j]: int(cm[i, j]) for j in range(len(classes))}
        for i in range(len(classes))
    }

    metadata = {
        "versi_model": "1.0.0",
        "dibuat": datetime.now().strftime("%Y-%m-%d"),
        "kasus": "Kasus 4: Diagnosis Kerusakan Bearing",
        "klien": "Analis Getaran Pabrik Semen",
        "target": "kondisi",
        "kelas_target": classes,
        "fitur_input": KOLOM_FITUR_MENTAH,
        "fitur_turunan": [c for c in KOLOM_FITUR_MODEL if c not in KOLOM_FITUR_MENTAH],
        "metode_split": {
            "tipe": "Stratified Split (80% Train, 20% Test)",
            "alasan": (
                "Data berupa observasi getaran 1 detik independen berlabel multikelas tidak seimbang "
                "(bukan deret waktu tunggal). Stratified split memastikan proporsi setiap kelas kerusakan "
                "terjaga konsisten antara train dan test."
            ),
        },
        "perbandingan_model": {
            "baseline_logistic_regression": {
                "macro_f1": round(macro_f1_baseline, 4)
            },
            "best_random_forest": {
                "macro_f1": round(macro_f1_best, 4),
                "kenaikan_f1": round(macro_f1_best - macro_f1_baseline, 4),
            },
        },
        "metrik_test": {
            "macro_f1": round(macro_f1_best, 4),
            "accuracy": round(float(rep_best.get("accuracy", 0.0)), 4),
            "per_class": {
                cls: {
                    "precision": round(float(rep_best[cls]["precision"]), 4),
                    "recall": round(float(rep_best[cls]["recall"]), 4),
                    "f1_score": round(float(rep_best[cls]["f1-score"]), 4),
                    "support": int(rep_best[cls]["support"]),
                }
                for cls in classes
                if cls in rep_best
            },
            "confusion_matrix": cm_dict,
        },
        "rekomendasi_suku_cadang": {
            "normal": "Tidak perlu suku cadang, mesin beroperasi normal.",
            "outer_race": "Bearing Outer Ring / Cincin Luar Bantalan Baru.",
            "inner_race": "Bearing Inner Ring / Cincin Dalam Bantalan Baru.",
            "bola": "Rolling Elements / Bola Bantalan Baru.",
        },
        "versi_library": versi_lib,
    }

    meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"      Metadata berhasil disimpan di: {meta_path}")


def verifikasi_artifact(X_test: pd.DataFrame):
    """Memverifikasi bahwa model yang diekspor dapat dimuat dan memprediksi data mentah."""
    print("\n[6/6] Verifikasi loading artifact...")
    model_path = ARTIFACT_DIR / "model.joblib"
    meta_path = ARTIFACT_DIR / "metadata.json"

    loaded_model = joblib.load(model_path)
    loaded_meta = json.loads(meta_path.read_text(encoding="utf-8"))

    sample_input = X_test.head(5)
    sample_preds = loaded_model.predict(sample_input)
    sample_probas = loaded_model.predict_proba(sample_input)

    print(f"      Model classes: {loaded_model.classes_}")
    print(f"      Sample predictions: {sample_preds}")
    print(f"      Sample probas shape: {sample_probas.shape}")
    print(f"      Metadata Macro F1: {loaded_meta['metrik_test']['macro_f1']}")
    print("\n>>> SELURUH PROSES PELATIHAN DAN EKSPOR BERHASIL DILAKUKAN! <<<")


def main():
    print("=" * 70)
    print("   TRAINING PIPELINE: KASUS 4 (DIAGNOSIS KERUSAKAN BEARING)   ")
    print("=" * 70)

    # 1. Muat data
    X, y = muat_dan_siapkan_data(DATA_PATH)

    # 2. Bagi data (Stratified)
    X_train, X_test, y_train, y_test = bagi_data(X, y)

    # 3. Latih Baseline Logistic Regression
    _, f1_baseline, _ = latih_baseline_logistic_regression(
        X_train, y_train, X_test, y_test
    )

    # 4. Latih Model Advanced Random Forest
    model_rf, f1_best, rep_best, cm, classes = latih_model_advanced(
        X_train, y_train, X_test, y_test
    )

    # Tampilkan evaluasi detail
    print("\n" + "-" * 70)
    print("HASIL EVALUASI MODEL TERBAIK (TEST SET):")
    print(f"Baseline (Logistic Regression) Macro F1 : {f1_baseline:.4f}")
    print(f"Model Terbaik (Random Forest)   Macro F1 : {f1_best:.4f}")
    print(f"Peningkatan Performa                     : +{(f1_best - f1_baseline):.4f}")
    print("-" * 70)
    print("\nConfusion Matrix (Baris = Aktual, Kolom = Prediksi):")
    df_cm = pd.DataFrame(cm, index=classes, columns=classes)
    print(df_cm.to_string())
    print("-" * 70)

    # 5. Simpan artifact
    simpan_artifact(
        model=model_rf,
        macro_f1_baseline=f1_baseline,
        macro_f1_best=f1_best,
        rep_best=rep_best,
        cm=cm,
        classes=classes,
    )

    # 6. Verifikasi artifact
    verifikasi_artifact(X_test)


if __name__ == "__main__":
    main()
