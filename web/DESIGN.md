# VibraCheck - Industrial Bearing Diagnostic Hub
## Design System & UX Specification (Anti-Slop Industrial Standard)

Dokumen ini mendefinisikan sistem desain resmi, token warna, tipografi, dan arsitektur komponen frontend Next.js untuk **VibraCheck**. Desain ini dirancang khusus untuk mematuhi prinsip *anti-slop* industri: tenang, presisi, minim beban kognitif bagi teknisi pabrik, bebas dari elemen generik kecerdasan buatan, dan bebas dari gradien neon yang menyilaukan.

---

### 1. Filosofi Desain
1. **Purpose-Built Industrial Telemetry:** Setiap elemen visual memiliki fungsi operasional nyata. Tidak ada kartu tanpa data, tidak ada tombol tiruan (dead dummy buttons), dan tidak ada grafik dekoratif tanpa skala satuan.
2. **Organic Natural Tech (Logo Identity):** Menyesuaikan palet warna logo maskot industri: warna krem hangat (*broken white*), bingkai hijau *sage*, dan tipografi zaitun gelap (*dark olive*).
3. **Clarity & High Contrast Ergonomics:** Menghindari warna putih murni (`#FFFFFF`) pada latar belakang layar utama untuk mencegah kelelahan mata operator yang memantau layar di ruang kontrol atau lantai pabrik.
4. **Data Density with Breathing Room:** Menggunakan tata letak *bento grid* dengan radius sudut konsisten 12px, *gap* terukur, serta angka teknis berbasis *tabular numbers* (`tabular-nums`, `tnum`, `cv05`).

---

### 2. Token & Palet Warna Resmi

| Kategori Token | Nama Warna | Kode HEX | Peran & Penerapan UI |
|---|---|---|---|
| **Canvas / Base** | Broken White (Krem Terang) | `#F6F5F0` | Warna latar belakang seluruh halaman (`body background`). Lembut di mata dan merefleksikan karakter logo. |
| **Bento Surface** | Soft Sage Tint | `#E8EFE9` | Latar belakang kontainer bento luar, panel sidebar, dan pembatas grup komponen. |
| **Card Surface** | Putih Bersih | `#FFFFFF` | Latar kartu informasi (*card surface*), modal, dan dropdown. Memberikan elevasi kontras yang tajam terhadap canvas. |
| **Border / Divider** | Subtle Olive Gray | `#DCE4DD` | Garis tepi kartu (*card border*), pembatas tabel, dan garis grid spektrogram. Ketebalan 1px solid. |
| **Brand Primary** | Sage Green | `#8FA391` | Aksen tombol aktif, indikator terpilih (*active menu tab*), bilah probabilitas normal, dan sorotan frekuensi aman. |
| **Brand Secondary** | Dark Olive | `#4A5D4E` | Tombol aksi utama (*primary CTA*), ikon navigasi aktif, dan header kartu penting. |
| **Typography Primary** | Dark Olive Charcoal | `#233026` | Teks judul utama (`h1`, `h2`, `h3`), label metrik penting, dan nilai angka telemetri utama. |
| **Typography Muted** | Olive Slate | `#5B7060` | Teks sekunder, deskripsi teknis, label satuan (`g`, `RPM`, `kN`, `°C`, `Hz`), dan metadata waktu. |
| **Status: Normal** | Industrial Green | `#16A34A` | Status operasional normal (Zona A ISO 20816), badge mesin sehat, dan titik telemetri live. |
| **Status: Waspada** | Industrial Amber | `#D97706` | Peringatan keausan cincin luar/dalam (BPFO/BPFI), status Zona B/C, dan perhatian perawatan terjadwal. |
| **Status: Kritis** | Industrial Crimson | `#DC2626` | Kerusakan fatal bola bantalan (Ball Fault / BSF), anomali kritis Zona D, dan alarm darurat. |

---

### 3. Tipografi & Hierarki Teks

- **Font Family Utama:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`.
- **Angka Teknis & Telemetri:** Wajib mengaktifkan `tabular-nums` atau `font-feature-settings: 'tnum' 1, 'cv05' 1` pada setiap nilai sensor, tabel, sumbu grafik, dan persentase probabilitas.
- **Hierarki Skala:**
  - `Display / Hero Title`: 28px - 32px (Font Weight: 700, Tracking: -0.02em, Color: `#233026`)
  - `Section Header`: 18px - 20px (Font Weight: 600, Tracking: -0.01em, Color: `#233026`)
  - `Card Header / Metric Value`: 14px - 16px (Font Weight: 600, Color: `#233026`)
  - `Body / Descriptions`: 13px - 14px (Font Weight: 400, Line Height: 1.5, Color: `#5B7060`)
  - `Caption / Unit / Badge`: 11px - 12px (Font Weight: 600, Tracking: 0.04em, Text Transform: uppercase)

---

### 4. Aturan Anti-Slop (Wajib Dipatuhi)

1. **Aturan R-02 (Bebas Tanda Pisah Em Dash):**
   - Dilarang keras menggunakan karakter em dash (`—`) atau en dash (`–`) dalam teks bahasa Indonesia.
   - Gunakan tanda hubung biasa (`-`), titik tengah (`·`), atau titik dua (`:`) sebagai pemisah informasi.
2. **Aturan R-04 (Bebas Emoji):**
   - Dilarang keras menggunakan emoji grafis karakter (*smiley*, robot, tanda seru kartun).
   - Seluruh ikonografi wajib menggunakan vektor SVG terstandarisasi dari library `lucide-react` (stroke 1.75px).
3. **Aturan R-26 (Bebas Tombol Tiruan / Dead Dummy Controls):**
   - Setiap tombol interaktif harus menjalankan aksi fungsional nyata (mengubah skenario, mengirim panggilan API, memicu unduhan CSV laporan, atau menerbitkan tiket perbaikan).
4. **Bebas Gradien Neon & Efek Berlebihan:**
   - Tidak menggunakan *glow* neon, bayangan berlebihan (*heavy drop shadows*), atau teks gradien warna-warni yang mengalihkan perhatian dari metrik getaran.
5. **Keaslian Metrik Model:**
   - Metrik performa yang ditampilkan wajib mencerminkan pengujian riil model Random Forest: Macro F1 `0.8014`, akurasi uji `84.0%`, dan dataset 15.220 rekaman sensor.

---

### 5. Struktur Tata Letak (Bento Grid 12 Kolom)

```
+-----------------------------------------------------------------------------------------+
| TOP TOOLBAR (Unit Mesin, Skenario Segmented Control, Badge Live 20kHz, Avatar Logo)     |
+-----------------------------------------------------------------------------------------+
| HERO DIAGNOSTIC CARD (12 Kolom)                                                         |
| - Kiri (7 Kolom): Badge Anomali, Judul Kerusakan, Penjelasan Fisika Getaran, Metadata  |
| - Kanan (5 Kolom): Kartu Distribusi Probabilitas Model (Normal, BPFO, BPFI, Ball Fault) |
+--------------------------------------------+--------------------------------------------+
| WORKSPACE KIRI (8 Kolom)                   | WORKSPACE KANAN (4 Kolom)                  |
| - Spektrum Frekuensi FFT (Recharts Area)   | - Rekomendasi Suku Cadang & Klasifikasi    |
| - Gelombang Domain Waktu (Recharts Line)   |   ISO 20816 (Aksi: Terbit Tiket, Unduh CSV)|
|                                            | - Identifikasi Aset & Status Gateway       |
+--------------------------------------------+--------------------------------------------+
| PARAMETER MASUKAN SENSOR (12 Fitur Terbagi dalam 3 Sub-Kartu Apple Bento)              |
| 1. Operasional Poros | 2. Karakteristik Getaran RMS | 3. Frekuensi Karakteristik Cacat  |
+-----------------------------------------------------------------------------------------+
| MODUL BATCH ARMADA MESIN (5 Ringkasan Armada, Unggah CSV, & Tabel Analisis Mesin)      |
+-----------------------------------------------------------------------------------------+
```

---

### 6. Aset Visual
- **Logo Brand Utama:** [public/logo.jpg](file:///web/public/logo.jpg) (Winking character dengan bingkai hijau sage dan latar krem).
- **Favicon:** Ditautkan ke [public/logo.jpg](file:///web/public/logo.jpg).
