"""Smoke test & unit test API Diagnosis Kerusakan Bearing (Kasus 04).

Menguji endpoint FastAPI:
1. Health check (/health) mengembalikan status, versi_model, macro_f1, dan fitur_input
2. CORS headers mendukung Next.js di localhost dan Vercel
3. Input normal & verifikasi skema multikelas Next.js (kelas_prediksi, status_bahaya, keyakinan, distribusi_probabilitas, rekomendasi)
4. Sanitasi otomatis (casing & whitespace pada posisi sensor)
5. Input tidak valid & ekstrem di luar batas fisik (wajib tolak HTTP 422)
6. Input string kosong & missing field (wajib tolak HTTP 422 dengan detail lokasi field)
7. Batch prediction (/predict/batch)
Jalankan:
    pytest -v
"""

from fastapi.testclient import TestClient
import pytest

from app.api.main import app

NORMAL = {
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


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_cors_middleware(client):
    """Pastikan CORS mengizinkan origin apa pun untuk Next.js (localhost / Vercel)."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
    }
    r = client.options("/predict", headers=headers)
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") in ("*", "http://localhost:3000")


def test_health(client):
    """Pastikan server aktif dan metadata terisi lengkap: status, versi_model, macro_f1, fitur_input."""
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "versi_model" in data
    assert "macro_f1" in data
    assert float(data["macro_f1"]) > 0.0
    assert "fitur_input" in data
    assert len(data["fitur_input"]) == 12
    assert "kelas_target" in data
    assert len(data["kelas_target"]) == 4


def test_predict_normal(client):
    """Uji prediksi normal dan verifikasi skema respons Next.js serta kompatibilitas."""
    r = client.post("/predict", json=NORMAL)
    assert r.status_code == 200, r.text
    body = r.json()

    # Spesifikasi Baru Next.js
    assert "kelas_prediksi" in body
    assert body["kelas_prediksi"] in ("Normal", "Outer Race", "Inner Race", "Ball Fault")

    assert "status_bahaya" in body
    assert body["status_bahaya"] in ("AMAN", "WASPADA", "KRITIS")

    assert "keyakinan" in body
    assert 0.0 <= body["keyakinan"] <= 1.0

    assert "distribusi_probabilitas" in body
    assert len(body["distribusi_probabilitas"]) == 4
    for k in ("Normal", "Outer Race", "Inner Race", "Ball Fault"):
        assert k in body["distribusi_probabilitas"]
        assert 0.0 <= body["distribusi_probabilitas"][k] <= 1.0

    assert "rekomendasi" in body
    rekom = body["rekomendasi"]
    assert isinstance(rekom, dict)
    assert "tindakan" in rekom
    assert "komponen" in rekom
    assert "kode_suku_cadang" in rekom
    assert "ketersediaan" in rekom
    assert "zona_iso_20816" in rekom

    assert "versi_model" in body
    assert "latency_ms" in body
    assert body["latency_ms"] >= 0

    # Kompatibilitas Sistem Eksisting
    assert "kondisi" in body
    assert body["kondisi"] in ("normal", "outer_race", "inner_race", "bola")
    assert "label_kondisi" in body
    assert "probabilitas" in body
    assert len(body["probabilitas"]) == 4
    assert "probabilitas_tertinggi" in body


def test_extreme_valid_boundaries(client):
    """Input batas ekstrem yang masih valid secara spesifikasi fisik industri."""
    batas_atas = {
        **NORMAL,
        "kecepatan_rpm": 10000.0,
        "beban_kN": 50.0,
        "suhu_housing_C": 120.0,
        "rms_g": 15.0,
        "puncak_g": 45.0,
        "kurtosis": 20.0,
        "crest_factor": 5.0,
    }
    r1 = client.post("/predict", json=batas_atas)
    assert r1.status_code == 200

    batas_bawah = {
        **NORMAL,
        "kecepatan_rpm": 0.0,
        "beban_kN": 0.1,
        "suhu_housing_C": 0.0,
        "rms_g": 0.01,
        "puncak_g": 0.02,
        "crest_factor": 1.0,
        "frekuensi_dominan_hz": 1.0,
    }
    r2 = client.post("/predict", json=batas_bawah)
    assert r2.status_code == 200


def test_messy_casing_and_whitespace(client):
    """Sanitasi validator Pydantic harus merapikan string dengan whitespace atau huruf besar/kecil."""
    kotor = {
        **NORMAL,
        "posisi_sensor": " DRIVE END ",
    }
    r = client.post("/predict", json=kotor)
    assert r.status_code == 200


@pytest.mark.parametrize(
    "field,value",
    [
        ("posisi_sensor", ""),               # Posisi sensor string kosong
        ("posisi_sensor", "   "),            # Posisi sensor hanya spasi
        ("posisi_sensor", "tengah_mesin"),   # Posisi di luar literal valid
        ("posisi_sensor", "gearbox"),        # Posisi di luar literal valid
        ("kecepatan_rpm", -10.0),            # RPM negatif mustahil
        ("kecepatan_rpm", ""),               # RPM string kosong
        ("kecepatan_rpm", "dua_ribu"),       # RPM berupa string (tipe salah)
        ("beban_kN", 0.0),                   # Beban harus > 0
        ("beban_kN", -2.5),                  # Beban negatif mustahil
        ("rms_g", -0.5),                     # Getaran RMS negatif ditolak validator API
        ("rms_g", "getaran_tinggi"),         # Getaran RMS berupa string (tipe salah)
        ("puncak_g", -1.0),                  # Getaran puncak negatif
        ("puncak_g", "puncak_string"),       # Getaran puncak berupa string
        ("kurtosis", -3.0),                  # Kurtosis negatif
        ("crest_factor", 0.5),               # Crest factor < 1.0 secara matematis mustahil
        ("crest_factor", -1.0),              # Negatif
        ("frekuensi_dominan_hz", 0.0),       # Frekuensi harus > 0
        ("frekuensi_dominan_hz", -50.0),     # Frekuensi negatif mustahil
    ],
)
def test_invalid_input_rejected_422(client, field, value):
    """Input tidak valid harus ditolak status 422 oleh Pydantic dengan informasi field yang salah."""
    r = client.post("/predict", json={**NORMAL, field: value})
    assert r.status_code == 422
    errors = r.json().get("detail", [])
    assert any(field in err.get("loc", []) for err in errors)


def test_empty_input_rejected_422(client):
    """Payload JSON kosong wajib ditolak 422."""
    r = client.post("/predict", json={})
    assert r.status_code == 422


def test_missing_required_field_rejected_422(client):
    """Payload dengan field wajib yang hilang (misal kecepatan_rpm) wajib ditolak 422."""
    kurang = {k: v for k, v in NORMAL.items() if k != "kecepatan_rpm"}
    r = client.post("/predict", json=kurang)
    assert r.status_code == 422
    assert "kecepatan_rpm" in str(r.json())


def test_batch_prediction(client):
    """Pengujian endpoint batch dengan multiple data dan empty list."""
    batch_data = [
        NORMAL,
        {**NORMAL, "posisi_sensor": "fan_end", "kecepatan_rpm": 1800.0, "rms_g": 0.8},
        {**NORMAL, "energi_bpfo": 0.35, "rms_g": 0.95},
    ]
    r = client.post("/predict/batch", json=batch_data)
    assert r.status_code == 200
    hasil = r.json()
    assert len(hasil) == 3
    assert all("kelas_prediksi" in item for item in hasil)
    assert all("status_bahaya" in item for item in hasil)
    assert all("distribusi_probabilitas" in item for item in hasil)
    assert all(len(item["distribusi_probabilitas"]) == 4 for item in hasil)
    assert all("rekomendasi" in item and isinstance(item["rekomendasi"], dict) for item in hasil)

    # Empty batch
    r_empty = client.post("/predict/batch", json=[])
    assert r_empty.status_code == 200
    assert r_empty.json() == []
