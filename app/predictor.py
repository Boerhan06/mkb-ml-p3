"""Load artifact sekali, lalu prediksi. Dipakai FastAPI (app/api/main.py) dan Streamlit mode A (app/ui/streamlit_app.py)."""
import json
import sys
import time
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
# model.joblib menyimpan referensi ke src.features.tambah_fitur, jadi root repo harus bisa di-import
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ARTIFACT_DIR = ROOT / "artifacts"


def _patch_xgboost_cross_platform():
    """Fix bug kompatibilitas cross-platform libstdc++ (Linux/Colab) vs MSVC (Windows) pada serialisasi RNG XGBoost."""
    if sys.platform != "win32":
        return
    try:
        import struct
        import numpy as np
        import xgboost as xgb

        dummy = xgb.XGBClassifier(n_estimators=1, random_state=42)
        dummy.fit(np.zeros((5, 2)), np.array([0, 1, 0, 1, 0]))
        win_h = dummy.get_booster().__getstate__()["handle"]
        idx_win = win_h.find(b"rng_state")
        if idx_win == -1:
            return
        win_len = struct.unpack(">q", win_h[idx_win + 11 : idx_win + 19])[0]
        win_rng_bytes = win_h[idx_win : idx_win + 19 + win_len]

        orig_setstate = xgb.Booster.__setstate__

        def patched_setstate(self, state):
            buf = state.get("handle")
            if buf is not None:
                idx = buf.find(b"rng_state")
                if idx != -1:
                    l = struct.unpack(">q", buf[idx + 11 : idx + 19])[0]
                    val = buf[idx + 19 : idx + 19 + l]
                    if val.startswith(b"42 "):
                        buf = bytearray(buf[:idx]) + win_rng_bytes + bytearray(buf[idx + 19 + l :])
                        state["handle"] = buf
            return orig_setstate(self, state)

        xgb.Booster.__setstate__ = patched_setstate
    except Exception:
        pass


_patch_xgboost_cross_platform()


@lru_cache(maxsize=1)
def load():
    """(model, metadata). lru_cache = di-load sekali per proses, bukan per request."""
    model_path, meta_path = ARTIFACT_DIR / "model.joblib", ARTIFACT_DIR / "metadata.json"
    if not model_path.exists():
        raise FileNotFoundError(f"{model_path} tidak ada. Sudah di-commit? Cek .gitignore.")
    model = joblib.load(model_path)
    meta = json.loads(meta_path.read_text())
    return model, meta


def predict_rows(rows: list[dict]) -> list[dict]:
    """Prediksi beberapa baris sekaligus. Tiap baris berisi kolom fitur_input dari metadata."""
    model, meta = load()
    mulai = time.perf_counter()
    X = pd.DataFrame(rows)[meta["fitur_input"]]
    proba = model.predict_proba(X)[:, 1]
    latency = round((time.perf_counter() - mulai) * 1000, 1)
    return [{
        "probabilitas_gagal": round(float(p), 4),
        "status": "SEGERA SERVIS" if p >= meta["threshold"] else "AMAN",
        "threshold": meta["threshold"],
        "versi_model": meta["versi_model"],
        "latency_ms": latency,
    } for p in proba]


def predict_one(row: dict) -> dict:
    return predict_rows([row])[0]
