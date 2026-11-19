# Machine Learning - MKB UPI - P3 Ship: Industrial Bearing Diagnostic Hub (VibraCheck)

Bahan hands-on P3 seri kuliah praktisi **From notebook to production**: model klasifikasi multikelas dari P2 dibungkus menjadi API industri berbasis FastAPI dan antarmuka web modern, siap digunakan oleh analis getaran dan teknisi pemeliharaan pabrik (*predictive maintenance*).

**Studi Kasus 04:** Analisis getaran akselerometer pada mesin rotasi pabrik semen untuk mendiagnosis kerusakan bantalan peluru (*bearing*) multikelas secara otomatis sebelum terjadi kegagalan fatal pada jalur produksi.

```
P2: Act (Notebook Eksplorasi & Training)       P3: Ship (Repositori Produksi Ini)
Colab/Local -> artifacts/ + src/               +-> FastAPI Service (app/api/main.py) -> Port 8000
               - model.joblib (Random Forest)  +-> Mode A: Streamlit UI (app/ui/)    -> Port 8501
               - metadata.json (Metrik & Skema)+-> Mode B: VibraCheck Next.js (web/) -> Port 3000
               - src/features.py (Fisika Getaran)
```

Daftar Isi:
[1. Sekilas Model & Metrik](#1-sekilas-model--metrik) |
[2. Arsitektur Sistem](#2-arsitektur-sistem) |
[3. Panduan Menjalankan Mode B (FastAPI + Next.js)](#3-panduan-menjalankan-mode-b-fastapi--nextjs-frontend) |
[4. Panduan Menjalankan Mode A (Streamlit)](#4-panduan-menjalankan-mode-a-monolitik-streamlit) |
[5. Endpoint REST API](#5-endpoint-rest-api-fastapi) |
[6. Verifikasi & Pengujian](#6-verifikasi--pengujian-otomatis) |
[7. Struktur Direktori](#7-struktur-direktori-repositori) |
[8. Panduan Deployment](#8-panduan-deployment-produksi)

---

## 1. Sekilas Model & Metrik

Model machine learning dilatih menggunakan data getaran berlabel dari sensor akselerometer resolusi tinggi (15.220 rekaman data observasi 1 detik independen).

- **Tipe Tugas:** Klasifikasi Multikelas (4 Kelas Kondisi Bantalan):
  - `normal` : Bantalan beroperasi dalam batas getaran standar ISO 20816 (Zona A/B).
  - `outer_race` : Kerusakan lokal pada lintasan luar (*Outer Race Defect* - BPFO).
  - `inner_race` : Kerusakan lokal pada lintasan dalam (*Inner Race Defect* - BPFI).
  - `bola` : Kerusakan pada elemen penggelinding (*Ball Fault* - BSF).
- **Algoritma Terpilih:** **Random Forest Classifier** (200 *decision trees*, pembobotan kelas seimbang, *max depth* 20).
- **Performa Evaluasi (Test Set 20% Stratified - 3.044 sampel):**
  - **Macro F1-Score:** `0.8014` (Melampaui baseline Logistic Regression `0.6909`, peningkatan +0.1105).
  - **Akurasi Keseluruhan:** `84.0%`.
  - **F1-Score per Kelas:**
    - `normal`: 0.8751 (Precision: 80.3%, Recall: 96.1%)
    - `outer_race`: 0.8238 (Precision: 91.5%, Recall: 74.9%)
    - `inner_race`: 0.7655 (Precision: 89.2%, Recall: 67.0%)
    - `bola`: 0.7410 (Precision: 92.5%, Recall: 61.8%)
- **Fitur Fisika Getaran (12 Fitur Input):**
  - Domain Waktu & Operasional: `posisi_sensor` (drive_end / non_drive_end), `kecepatan_rpm`, `beban_kN`, `suhu_housing_C`, `rms_g`, `puncak_g`, `kurtosis`, `crest_factor`.
  - Domain Frekuensi (FFT): `energi_bpfo`, `energi_bpfi`, `energi_bsf`, `frekuensi_dominan_hz`.
- **Fitur Rekayasa Tambahan (`src/features.py`):** Rasio frekuensi harmonik rotasi, total energi cacat, rasio getaran terhadap beban, indeks keparahan ISO, dan diferensial energi BPFI/BPFO.

---

## 2. Arsitektur Sistem

Aplikasi mendukung 2 mode deployment:

| Karakteristik | Mode A: Monolitik Streamlit | Mode B: Decoupled Industrial Web (VibraCheck) |
|---|---|---|
| **Frontend** | Streamlit Python (`app/ui/streamlit_app.py`) | Next.js 16 (App Router), TypeScript, Tailwind CSS (`web/`) |
| **Backend / Inferensi** | Terintegrasi langsung dalam proses Python yang sama | FastAPI Service mandiri via REST API (`app/api/main.py`) |
| **Visualisasi Sinyal** | Matplotlib / Altair statis | Recharts responsif: Spektrum FFT & Gelombang Domain Waktu |
| **Validasi Input** | Form Streamlit standar | Skema Pydantic v2 ketat (HTTP 422 jika input tidak realistis) |
| **Target Pengguna** | Demonstrasi cepat, prototipe lokal | Analis keandalan pabrik (*Reliability Engineer*), integrasi SCADA/IoT |
| **Skalabilitas** | Skala vertikal tunggal | Skala independen antara API microservice dan antarmuka web |

---

## 3. Panduan Menjalankan Mode B (FastAPI + Next.js Frontend)

Mode B adalah arsitektur decoupled berstandar industri dengan backend FastAPI di port 8000 dan antarmuka web Next.js (VibraCheck) di port 3000.

### Prasyarat
- Python 3.10+ (disarankan Python 3.12 atau 3.14)
- Node.js 18.18+ atau Node.js 20+ dan npm
- Git

### Langkah 1: Persiapan Lingkungan Python & Backend API
Buka Terminal 1 di root direktori repositori:

```powershell
# 1. Buat dan aktifkan virtual environment
python -m venv .venv
.\.venv\Scripts\activate      # Untuk Windows PowerShell
# source .venv/bin/activate   # Untuk Linux / macOS

# 2. Instal dependensi backend
pip install -r requirements-dev.txt

# 3. Jalankan server backend FastAPI
uvicorn app.api.main:app --reload --port 8000
```

Backend FastAPI akan aktif di:
- **API Base URL:** `http://127.0.0.1:8000`
- **Swagger UI Interaktif:** `http://127.0.0.1:8000/docs`
- **Health Check Endpoint:** `http://127.0.0.1:8000/health`

### Langkah 2: Persiapan & Menjalankan Frontend Next.js (VibraCheck)
Buka Terminal 2 baru:

```powershell
# 1. Masuk ke direktori web
cd web

# 2. Pastikan file konfigurasi environment tersedia
# File web/.env.local sudah disediakan dengan isi:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# 3. Instal dependensi npm (jika belum)
npm install

# 4. Jalankan development server
npm run dev
```

Buka peramban (*browser*) Anda di:
- **Dashboard VibraCheck:** `http://localhost:3000`

### Fitur Utama Dashboard VibraCheck (Mode B):
1. **Header Kendali & Quick Presets:** 4 tombol skenario cepat (*Normal*, *Outer Race*, *Inner Race*, *Ball Fault*) untuk mengisi data sensor dan menjalankan inferensi langsung.
2. **Kartu Diagnosa Utama:** Status bahaya semantik (AMAN, WASPADA, KRITIS), persentase keyakinan model, penjelasan mekanis kerusakan, dan visualisasi distribusi probabilitas 4 kelas.
3. **Spektrum Akselerasi FFT (Recharts):** Grafik spektral domain frekuensi lengkap dengan garis ambang batas kritis 1.20 g pk dan penanda puncak frekuensi cacat (BPFO, BPFI, BSF).
4. **Bentuk Gelombang Domain Waktu (Recharts):** Grafik amplitudo akselerasi getaran terhadap waktu dengan kalkulasi metrik Peak-to-Peak (pk-pk) dan RMS.
5. **Rekomendasi Suku Cadang & Standar ISO 20816:** Nomor part bearing, status stok gudang, zonasi getaran ISO, tombol pembuatan tiket kerja (*work order*), serta ekspor ringkasan CSV.
6. **Panel Input Sensor Manual & Uji Demo 422:** Panel akordeon interaktif untuk mengubah nilai 12 fitur sensor manual, disertai tombol uji coba input ekstrem/negatif untuk mendemonstrasikan penolakan error validasi Pydantic HTTP 422 secara transparan.
7. **Tab Armada Mesin (Batch CSV):** Pemrosesan batch banyak mesin secara simultan via `POST /predict/batch`, tabel ringkasan status armada, filter kategori, unduh CSV hasil analisis, serta penampil raw JSON Request dan Response.

---

## 4. Panduan Menjalankan Mode A (Monolitik Streamlit)

Jika Anda ingin menjalankan antarmuka Python Streamlit monolitik sederhana:

```powershell
# Jalankan langsung dari root repositori:
streamlit run app/ui/streamlit_app.py
```

Peramban akan terbuka otomatis di `http://localhost:8501`.
Untuk menghubungkan Streamlit ke server FastAPI eksternal, tentukan variabel lingkungan:
```powershell
$env:API_URL="http://127.0.0.1:8000"
streamlit run app/ui/streamlit_app.py
```

---

## 5. Endpoint REST API (FastAPI)

Backend FastAPI menyediakan dokumentasi OpenAPI interaktif yang dapat diakses langsung pada `http://127.0.0.1:8000/docs`.

### Ringkasan Endpoint

| Metode | Path | Deskripsi |
|---|---|---|
| `GET` | `/health` | Memeriksa ketersediaan layanan, versi model, skor Macro F1, dan daftar 12 fitur input. |
| `POST` | `/predict` | Mendiagnosis satu observasi getaran mesin dengan validasi Pydantic ketat. |
| `POST` | `/predict/batch` | Mendiagnosis daftar observasi getaran (hingga 1.000 mesin dalam satu request). |
| `GET` | `/docs` | Dokumentasi antarmuka Swagger UI. |

### Contoh Pemanggilan `POST /predict`

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "posisi_sensor": "drive_end",
    "kecepatan_rpm": 1780.0,
    "beban_kN": 6.2,
    "suhu_housing_C": 68.5,
    "rms_g": 0.82,
    "puncak_g": 3.45,
    "kurtosis": 5.4,
    "crest_factor": 4.2,
    "energi_bpfo": 0.08,
    "energi_bpfi": 0.72,
    "energi_bsf": 0.05,
    "frekuensi_dominan_hz": 158.0
  }'
```

**Response (HTTP 200 OK):**
```json
{
  "kelas_prediksi": "Inner Race",
  "status_bahaya": "KRITIS",
  "keyakinan": 0.892,
  "distribusi_probabilitas": {
    "Normal": 0.018,
    "Outer Race": 0.045,
    "Inner Race": 0.892,
    "Ball Fault": 0.045
  },
  "rekomendasi": {
    "tindakan": "Jadwalkan penggantian bantalan segera. Pantau tren kenaikan suhu housing.",
    "komponen": "Bearing Inner Ring / Cincin Dalam Bantalan Baru",
    "kode_suku_cadang": "BRG-6205-IR-C3",
    "ketersediaan": "Tersedia di Gudang Sentral",
    "zona_iso_20816": "Zona D (Kritis)"
  },
  "versi_model": "1.0.0",
  "latency_ms": 14.8
}
```

### Demonstrasi Validasi Error (HTTP 422 Unprocessable Entity)
Jika input memuat nilai yang tidak realistis (misalnya `kecepatan_rpm: -500` atau `crest_factor: -2`), backend akan menolak request secara aman sebelum memproses ke model:

```json
{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": ["body", "kecepatan_rpm"],
      "msg": "Input should be greater than or equal to 0",
      "input": -500.0
    }
  ]
}
```

---

## 6. Verifikasi & Pengujian Otomatis

Proyek ini dilengkapi dengan pengujian unit dan integrasi otomatis yang ketat:

### 1. Pengujian Backend API (`pytest`)
Menjalankan 26 uji fungsional: verifikasi CORS middleware, endpoint health check, batas nilai ekstrem, case formatting, penolakan input negatif / string kosong, hingga kalkulasi batch.

```powershell
.\.venv\Scripts\pytest.exe -v
```
*Status: 26 passed (100% lulus).*

### 2. Pengujian Kompilasi Frontend Next.js (`npm run build`)
Memverifikasi static type checking TypeScript, validasi ESLint, dan optimasi aset Turbopack.

```powershell
cd web
npm run build
```
*Status: Compiled successfully, 0 errors, static pages prerendered.*

---

## 7. Struktur Direktori Repositori

```
mkb-ml-p3/
├── artifacts/
│   ├── metadata.json           # Metadata model, skema fitur, metrik F1 & akurasi
│   └── model.joblib            # Pipeline scikit-learn Random Forest terlatih
├── src/
│   ├── __init__.py
│   └── features.py             # Kalkulasi fitur fisika getaran (rotasi, rasio harmonik, indeks ISO)
├── app/
│   ├── predictor.py            # Modul pemuatan artifact & inferensi terpusat
│   ├── api/
│   │   ├── __init__.py
│   │   └── main.py             # FastAPI REST Service (CORS, validasi Pydantic, health, predict)
│   └── ui/
│       ├── streamlit_app.py    # Aplikasi Streamlit (Mode A)
│       └── assets/
│           └── logo.jpg        # Identitas visual logo aplikasi
├── data/
│   └── contoh_batch.csv        # Berkas contoh data getaran untuk uji coba batch
├── tests/
│   ├── __init__.py
│   └── test_api.py             # 26 pengujian otomatis pytest
├── web/                        # Aplikasi Frontend Next.js 16 (Mode B - VibraCheck)
│   ├── .env.example            # Template variabel lingkungan
│   ├── .env.local              # Konfigurasi URL API lokal (NEXT_PUBLIC_API_URL)
│   ├── DESIGN.md               # Pedoman sistem desain industri anti-slop
│   ├── package.json            # Dependensi (Next.js, React 19, Lucide, Recharts)
│   ├── tsconfig.json           # Konfigurasi TypeScript
│   ├── public/
│   │   ├── logo.jpg            # Aset logo merek VibraCheck
│   │   └── contoh_batch.csv    # Berkas sampel untuk demo batch frontend
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout dengan font Inter & metadata
│       │   ├── page.tsx        # Dashboard koordinasi utama (Bento grid)
│       │   └── globals.css     # Palet warna Tailwind CSS v4
│       ├── components/
│       │   ├── Sidebar.tsx             # Navigasi kiri & status kesehatan model
│       │   ├── TopBar.tsx              # Pemilih unit mesin & quick preset pills
│       │   ├── DiagnosisCard.tsx       # Kartu status diagnosa utama & probabilitas
│       │   ├── SpectrumChart.tsx       # Grafik spektrum FFT akselerasi (Recharts)
│       │   ├── WaveformChart.tsx       # Grafik gelombang domain waktu (Recharts)
│       │   ├── RecommendationCard.tsx  # Informasi suku cadang & standar ISO 20816
│       │   ├── SensorInputPanel.tsx    # Panel input manual 12 fitur & demo 422
│       │   └── BatchTab.tsx            # Analisis armada mesin multi-mesin (CSV)
│       ├── lib/
│       │   ├── api.ts          # Klien HTTP terisolasi dengan penanganan fallback
│       │   └── chartData.ts    # Generator data FFT & bentuk gelombang sintesis
│       └── types/
│           └── bearing.ts      # Definisi antarmuka TypeScript untuk skema sensor & respons
├── Dockerfile                  # Konfigurasi container Docker multi-tahap
├── requirements.txt            # Dependensi produksi Python (versi ter-pin)
├── requirements-dev.txt        # Dependensi pengembangan & pengujian
└── README.md                   # Dokumentasi teknis proyek
```

---

## 8. Panduan Deployment Produksi

### Opsi A: Deployment Frontend Next.js ke Vercel
1. Hubungkan repositori GitHub Anda ke [Vercel](https://vercel.com).
2. Atur **Root Directory** ke folder `web`.
3. Tambahkan Environment Variable di Vercel:
   - `NEXT_PUBLIC_API_URL` = URL FastAPI Anda yang telah di-deploy (misalnya `https://api-vibracheck.onrender.com`).
4. Klik **Deploy**.

### Opsi B: Deployment Backend FastAPI ke Render / Hugging Face Spaces
1. Hubungkan repositori ke platform hosting Docker (Render atau Hugging Face Spaces).
2. Tentukan target container port ke `7860` (atau port bawaan platform).
3. Setelah service aktif, pasang URL endpoint tersebut ke variabel `NEXT_PUBLIC_API_URL` pada frontend.

### Opsi C: Menjalankan via Docker Lokal
```bash
# Build image Docker
docker build -t vibracheck-backend .

# Jalankan container backend di port 7860
docker run -p 7860:7860 vibracheck-backend
```
Akses Swagger UI di `http://localhost:7860/docs`.
