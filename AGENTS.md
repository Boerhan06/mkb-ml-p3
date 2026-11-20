# AGENTS.md — VibraCheck Project Architecture & Developer Guide

Dokumen ini adalah peta navigasi arsitektur dan panduan cepat untuk AI Coding Agent dan pengembang agar langsung memahami struktur proyek, letak modul, serta dependensi tanpa perlu memindai ulang seluruh direktori.

---

## 1. Ringkasan Proyek

- **Nama Proyek**: VibraCheck - Industrial Bearing Diagnostic Hub (MKB ML P3).
- **Domain**: Predictive Maintenance / Diagnosis Kerusakan Bantalan Mesin Pabrik Semen Multikelas berbasis Analisis Getaran Akselerometer.
- **Kelas Target (4 Kondisi)**:
  1. `normal`: Operasi wajar (ISO 20816 Zona A/B).
  2. `outer_race`: Cacat cincin luar (*BPFO - Ball Pass Frequency Outer*).
  3. `inner_race`: Cacat cincin dalam (*BPFI - Ball Pass Frequency Inner*).
  4. `bola`: Cacat elemen penggelinding (*BSF - Ball Spin Frequency*).
- **Model ML**: Pipeline Random Forest (`artifacts/model.joblib`), Macro F1: `0.8014`, Akurasi: `84.0%`.

---

## 2. Struktur Direktori & Peta Modul

```
mkb-ml-p3/
├── AGENTS.md                  # Peta arsitektur & panduan AI agent (dokumen ini)
├── README.md                  # Dokumentasi umum proyek & studi kasus
├── run.bat                    # Launcher 1-klik Windows (FastAPI + Next.js dengan auto-free port)
├── run.ps1                    # Launcher PowerShell alternatif
├── Dockerfile                 # Image deployment production (FastAPI / Streamlit, port 7860)
├── requirements.txt           # Dependensi produksi Python
├── requirements-dev.txt       # Dependensi test & dev (pytest, httpx)
├── train_model.py             # Script pelatihan model ML & export artifacts
│
├── app/                       # Backend Application Logic
│   ├── api/
│   │   └── main.py            # Entrypoint FastAPI (CORS, router, endpoint health & predict)
│   ├── predictor.py           # Engine inferensi ML, rekomendasi suku cadang & evaluasi ISO 20816
│   └── ui/
│       └── streamlit_app.py   # Antarmuka monolitik alternatif berbasis Streamlit
│
├── src/                       # Core Feature Engineering & ML Preprocessing
│   ├── __init__.py
│   └── features.py            # Ekstraksi fitur fisika domain waktu & FFT (12 raw -> 23 fitur)
│
├── artifacts/                 # Serialized Machine Learning Assets
│   ├── model.joblib           # Scikit-learn Pipeline (preprocessing + model)
│   └── metadata.json          # Metadata versi model, metrik F1, daftar fitur, confusion matrix
│
├── data/                      # Dataset Sensor Getaran
│   ├── raw.csv                # 15.220 rekaman data observasi 1 detik sensor akselerometer
│   └── contoh_batch.csv       # File contoh untuk pengujian batch prediction
│
├── tests/                     # Automated Test Suite (Pytest)
│   ├── __init__.py
│   └── test_api.py            # 26 pengujian otomatis (API endpoints, Pydantic guardrail, 422, batch)
│
└── web/                       # Modern Industrial Frontend (Mode B - Next.js)
    ├── package.json           # Next.js 16, React 19, Tailwind CSS v4, Motion, Recharts
    ├── tsconfig.json          # TypeScript configuration
    ├── next.config.ts         # Konfigurasi Next.js
    ├── public/
    │   ├── logo.jpg           # Brand visual avatar
    │   └── contoh_batch.csv   # Template download batch CSV
    └── src/
        ├── app/
        │   ├── layout.tsx     # Root HTML layout & font
        │   ├── page.tsx       # Main Bento-grid Dashboard page
        │   └── globals.css    # Tailwind CSS styling, palet warna industri
        ├── components/
        │   ├── Sidebar.tsx            # Navigasi kiri, status model, profil operator
        │   ├── TopBar.tsx             # Switcher unit mesin & quick scenario preset pill
        │   ├── DiagnosisCard.tsx      # Status diagnosa utama, probabilitas bar, live timer
        │   ├── SpectrumChart.tsx      # Visualisasi FFT spektrum frekuensi akselerasi (Recharts)
        │   ├── WaveformChart.tsx      # Visualisasi bentuk gelombang domain waktu (Recharts)
        │   ├── RecommendationCard.tsx # Rekomendasi tindakan teknis, suku cadang, standar ISO
        │   ├── SensorInputPanel.tsx   # Panel 12 input sensor manual & tombol uji guardrail 422
        │   └── BatchTab.tsx           # Analisis multi-mesin batch via upload file CSV
        ├── lib/
        │   ├── api.ts         # HTTP client fetch ke FastAPI dengan error handler tangguh
        │   ├── constants.ts   # Presets skenario sensor, default payload & fallback data
        │   ├── chartData.ts   # Generator kurva FFT & sinyal gelombang getaran
        │   └── motion.ts      # Variasi transisi Framer Motion terstandar
        └── types/
            └── bearing.ts     # Antarmuka TypeScript (SensorInput, PredictionResponse, dll.)
```

---

## 3. Komunikasi Antar Layanan (API Contract)

Frontend dan Backend berkomunikasi melalui HTTP REST JSON:

- **Alamat Backend Default**: `http://127.0.0.1:8000` (konfigurable via `NEXT_PUBLIC_API_URL`).
- **Endpoint Utama**:
  - `GET /health` ➔ Memeriksa kesiapan model, versi, dan metrik Macro F1.
  - `POST /predict` ➔ Inferensi getaran tunggal (12 parameter sensor). Mengembalikan kelas prediksi, keyakinan probabilitas 4 kelas, dan rekomendasi ISO 20816.
  - `POST /predict/batch` ➔ Inferensi massal dari berkas CSV multi-baris.
  - `GET /simulate/{kondisi}` ➔ Mengambil sampel parameter sensor untuk kondisi tertentu (`normal`, `outer_race`, `inner_race`, `bola`).

---

## 4. Konvensi Kode & Palet Desain Frontend

Frontend mengadopsi prinsip **Anti-Slop Industrial Design**:
- **Warna Utama**:
  - Deep Emerald: `#1B4332`, `#143727`
  - Forest Accents: `#2D5A43`, `#375534`
  - Sage / Muted: `#AEC3B0`, `#6B9071`
  - Cream Sage (Background Card / Highlight): `#E3EED4`
  - Dark Charcoal (Teks Kontras Tinggi): `#0F2A1D`
- **Tipografi**: Judul 1 baris, tombol maksimal 2-3 kata dengan kata kerja, deskripsi ringkas tanpa penjelasan teknis yang berlebihan di UI operasional utama.

---

## 5. Cheatsheet Menjalankan & Menguji Proyek

### Menjalankan Fullstack (Backend + Frontend)
```powershell
.\run.bat
# atau lewat npm di root
npm start
```

### Menjalankan Backend FastAPI Saja
```powershell
.\.venv\Scripts\uvicorn.exe app.api.main:app --reload --host 127.0.0.1 --port 8000
```
Swagger UI interaktif tersedia di: `http://127.0.0.1:8000/docs`

### Menjalankan Frontend Next.js Saja
```powershell
cd web
npm run dev
```
Akses UI di: `http://localhost:3000`

### Menjalankan Automated Test Suite (Pytest)
```powershell
.\.venv\Scripts\pytest.exe -v
```

### Melatih Ulang Model ML
```powershell
.\.venv\Scripts\python.exe train_model.py
```
Model dan metadata baru akan otomatis tersimpan di folder `artifacts/`.
