"""UI Streamlit untuk Teknisi Pemeliharaan Mesin Pabrik (Kasus 4: Diagnosis Kerusakan Bearing).

Jalankan dari root repo:
    streamlit run app/ui/streamlit_app.py

Dua mode:
- Mode A (API_URL kosong): model di-load langsung di memori Streamlit.
- Mode B (API_URL diisi): memanggil REST API FastAPI lewat HTTP.
"""

import io
import json
import os
from pathlib import Path
import sys

import pandas as pd
import requests
import streamlit as st

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from app import predictor  # noqa: E402

FITUR_BEARING = [
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

# ---------------------------------------------------------------------------
# Data Dummy Bearing untuk Pengujian Batch Langsung
# ---------------------------------------------------------------------------
DUMMY_DATA_BEARING: list[dict] = [
    {
        "id_mesin": "PUMP-01 (Pompa Raw Mill)",
        "posisi_sensor": "drive_end",
        "kecepatan_rpm": 2547.0,
        "beban_kN": 2.79,
        "suhu_housing_C": 53.8,
        "rms_g": 0.5168,
        "puncak_g": 1.1658,
        "kurtosis": 2.706,
        "crest_factor": 2.256,
        "energi_bpfo": 0.0436,
        "energi_bpfi": 0.0421,
        "energi_bsf": 0.0389,
        "frekuensi_dominan_hz": 40.9,
    },
    {
        "id_mesin": "FAN-02 (ID Fan Cooler)",
        "posisi_sensor": "drive_end",
        "kecepatan_rpm": 1824.0,
        "beban_kN": 0.54,
        "suhu_housing_C": 47.9,
        "rms_g": 0.3603,
        "puncak_g": 1.1888,
        "kurtosis": 2.109,
        "crest_factor": 3.300,
        "energi_bpfo": 0.2309,
        "energi_bpfi": 0.0031,
        "energi_bsf": 0.0530,
        "frekuensi_dominan_hz": 116.0,
    },
    {
        "id_mesin": "MOT-03 (Motor Kiln Drive)",
        "posisi_sensor": "fan_end",
        "kecepatan_rpm": 2884.0,
        "beban_kN": 4.84,
        "suhu_housing_C": 64.7,
        "rms_g": 0.7240,
        "puncak_g": 2.7966,
        "kurtosis": 4.075,
        "crest_factor": 3.863,
        "energi_bpfo": 0.0166,
        "energi_bpfi": 0.3367,
        "energi_bsf": 0.0861,
        "frekuensi_dominan_hz": 47.9,
    },
    {
        "id_mesin": "BLW-04 (Blower Clinker)",
        "posisi_sensor": "drive_end",
        "kecepatan_rpm": 2961.0,
        "beban_kN": 5.44,
        "suhu_housing_C": 64.3,
        "rms_g": 0.9498,
        "puncak_g": 3.8828,
        "kurtosis": 5.506,
        "crest_factor": 4.088,
        "energi_bpfo": 0.0753,
        "energi_bpfi": 0.0643,
        "energi_bsf": 0.3814,
        "frekuensi_dominan_hz": 116.8,
    },
    {
        "id_mesin": "CONV-05 (Conveyor Batu Kapur)",
        "posisi_sensor": "drive_end",
        "kecepatan_rpm": 1481.0,
        "beban_kN": 0.62,
        "suhu_housing_C": 45.3,
        "rms_g": 0.2708,
        "puncak_g": 0.8508,
        "kurtosis": 2.670,
        "crest_factor": 3.141,
        "energi_bpfo": 0.0607,
        "energi_bpfi": 0.0420,
        "energi_bsf": 0.0580,
        "frekuensi_dominan_hz": 24.7,
    },
    {
        "id_mesin": "CRU-06 (Secondary Crusher)",
        "posisi_sensor": "drive_end",
        "kecepatan_rpm": 2818.0,
        "beban_kN": 3.98,
        "suhu_housing_C": 58.5,
        "rms_g": 0.6748,
        "puncak_g": 2.2581,
        "kurtosis": 3.602,
        "crest_factor": 3.346,
        "energi_bpfo": 0.2382,
        "energi_bpfi": 0.0444,
        "energi_bsf": 0.1070,
        "frekuensi_dominan_hz": 168.5,
    },
]

# Preset pengisian otomatis form single predict
PRESET_SAMPLES = {
    "🟢 Kondisi Normal (Normal)": {
        "posisi_sensor": "drive_end",
        "kecepatan_rpm": 2547.0,
        "beban_kN": 2.79,
        "suhu_housing_C": 53.8,
        "rms_g": 0.5168,
        "puncak_g": 1.1658,
        "kurtosis": 2.706,
        "crest_factor": 2.256,
        "energi_bpfo": 0.0436,
        "energi_bpfi": 0.0421,
        "energi_bsf": 0.0389,
        "frekuensi_dominan_hz": 40.9,
    },
    "🟡 Cacat Cincin Luar (Outer Race)": {
        "posisi_sensor": "drive_end",
        "kecepatan_rpm": 1824.0,
        "beban_kN": 0.54,
        "suhu_housing_C": 47.9,
        "rms_g": 0.3603,
        "puncak_g": 1.1888,
        "kurtosis": 2.109,
        "crest_factor": 3.300,
        "energi_bpfo": 0.2309,
        "energi_bpfi": 0.0031,
        "energi_bsf": 0.0530,
        "frekuensi_dominan_hz": 116.0,
    },
    "🟠 Cacat Cincin Dalam (Inner Race)": {
        "posisi_sensor": "fan_end",
        "kecepatan_rpm": 2884.0,
        "beban_kN": 4.84,
        "suhu_housing_C": 64.7,
        "rms_g": 0.7240,
        "puncak_g": 2.7966,
        "kurtosis": 4.075,
        "crest_factor": 3.863,
        "energi_bpfo": 0.0166,
        "energi_bpfi": 0.3367,
        "energi_bsf": 0.0861,
        "frekuensi_dominan_hz": 47.9,
    },
    "🔴 Cacat Elemen Bola (Ball Fault)": {
        "posisi_sensor": "drive_end",
        "kecepatan_rpm": 2961.0,
        "beban_kN": 5.44,
        "suhu_housing_C": 64.3,
        "rms_g": 0.9498,
        "puncak_g": 3.8828,
        "kurtosis": 5.506,
        "crest_factor": 4.088,
        "energi_bpfo": 0.0753,
        "energi_bpfi": 0.0643,
        "energi_bsf": 0.3814,
        "frekuensi_dominan_hz": 116.8,
    },
}


def _api_url() -> str:
    try:
        url = st.secrets.get("API_URL", "")
    except Exception:
        url = ""
    return (url or os.getenv("API_URL", "")).rstrip("/")


API_URL = _api_url()
TIMEOUT = 60


def prediksi(rows: list[dict]) -> list[dict]:
    """Panggil inferensi lokal (Mode A) atau HTTP request ke FastAPI (Mode B)."""
    if not API_URL:
        return predictor.predict_rows(rows)
    path = "/predict" if len(rows) == 1 else "/predict/batch"
    r = requests.post(API_URL + path, json=rows[0] if len(rows) == 1 else rows, timeout=TIMEOUT)
    if r.status_code == 422:
        raise ValueError(f"Input ditolak API (422): {r.json().get('detail')}")
    r.raise_for_status()
    hasil = r.json()
    return [hasil] if len(rows) == 1 else hasil


def info_model() -> dict:
    """Ambil informasi metadata model aktif."""
    if not API_URL:
        return predictor.load()[1]
    r = requests.get(API_URL + "/health", timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


# ---------------------------------------------------------------------------
# Konfigurasi Halaman & Header
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Diagnosis Kerusakan Bearing",
    page_icon="⚙️",
    layout="wide",
)

st.title("⚙️ Diagnosis Kerusakan Bearing Mesin Industri")
st.caption(
    "Sistem cerdas analisis getaran untuk teknisi pemeliharaan: mendeteksi kondisi **Normal**, "
    "**Cacat Cincin Luar (Outer Race)**, **Cacat Cincin Dalam (Inner Race)**, dan **Cacat Bola (Ball Fault)**."
)

try:
    META = info_model()
except Exception as e:
    st.error(f"Gagal memuat model: {e}")
    st.stop()

versi_model = META.get("versi_model", "1.0.0")
macro_f1 = META.get("metrik_test", {}).get("macro_f1", META.get("macro_f1", 0.8014))

mode_badge = f"Mode B · FastAPI `{API_URL}`" if API_URL else "Mode A · Model Stand-Alone (In-Memory)"
st.info(
    f"{mode_badge} | Versi Model: **v{versi_model}** | Metrik Model: **Macro F1 = {macro_f1:.4f}** | "
    f"Klien: **Analis Getaran Pabrik Semen**"
)

# ---------------------------------------------------------------------------
# Navigasi Tab
# ---------------------------------------------------------------------------
tab_satu, tab_batch = st.tabs(["🔬 Satu Rekaman Sensor (Diagnosa Langsung)", "📑 Banyak Mesin (Batch CSV)"])

# ---------------------------------------------------------------------------
# TAB 1: PREDIKSI SATU REKAMAN SENSOR
# ---------------------------------------------------------------------------
with tab_satu:
    st.markdown("#### Input Parameter Sensor Getaran & Kondisi Operasi")

    # Tombol Preset untuk pengisian cepat
    st.write("💡 *Pilih skenario siap uji untuk mengisi form secara instan:*")
    preset_cols = st.columns(4)
    if "form_values" not in st.session_state:
        st.session_state.form_values = PRESET_SAMPLES["🟢 Kondisi Normal (Normal)"]

    for i, (preset_name, preset_vals) in enumerate(PRESET_SAMPLES.items()):
        if preset_cols[i].button(preset_name, use_container_width=True):
            st.session_state.form_values = preset_vals
            st.rerun()

    cur = st.session_state.form_values

    with st.form("form_satu_bearing"):
        c1, c2, c3 = st.columns(3)

        with c1:
            st.markdown("##### 1. Parameter Operasional Mesin")
            posisi_idx = 0 if cur.get("posisi_sensor", "drive_end") == "drive_end" else 1
            posisi_sensor = st.selectbox(
                "Posisi Sensor Getaran",
                options=["drive_end", "fan_end"],
                index=posisi_idx,
                format_func=lambda x: "Drive End (Sisi Beban Poros)" if x == "drive_end" else "Fan End (Sisi Kipas Pendingin)",
                help="drive_end berada dekat beban utama, fan_end berada di sisi kipas",
            )
            kecepatan_rpm = st.number_input(
                "Kecepatan Putar Poros (RPM)",
                min_value=0.0,
                max_value=10000.0,
                value=float(cur.get("kecepatan_rpm", 2419.0)),
                step=50.0,
                help="Kecepatan rotasi motor dalam putaran per menit (RPM >= 0)",
            )
            beban_kN = st.number_input(
                "Beban Mekanis (kN)",
                min_value=0.1,
                max_value=100.0,
                value=float(cur.get("beban_kN", 2.09)),
                step=0.1,
                help="Beban radial/aksial pada bantalan (> 0 kN)",
            )
            suhu_housing_C = st.slider(
                "Suhu Rumah Bearing (°C)",
                min_value=20.0,
                max_value=120.0,
                value=float(cur.get("suhu_housing_C", 55.3)),
                step=0.5,
                help="Suhu rumah casing bantalan yang terpantau sensor termal",
            )

        with c2:
            st.markdown("##### 2. Karakteristik Sinyal Getaran")
            rms_g = st.number_input(
                "Besar Getaran RMS (g)",
                min_value=0.0001,
                max_value=20.0,
                value=float(cur.get("rms_g", 0.5089)),
                step=0.01,
                format="%.4f",
                help="Akar rata-rata kuadrat sinyal percepatan getaran",
            )
            puncak_g = st.number_input(
                "Getaran Puncak Tertinggi / Peak (g)",
                min_value=0.0001,
                max_value=50.0,
                value=float(cur.get("puncak_g", 1.6455)),
                step=0.05,
                format="%.4f",
                help="Amplitudo getaran maksimum pada satu rekaman",
            )
            kurtosis = st.number_input(
                "Kurtosis Sinyal",
                min_value=0.0,
                max_value=30.0,
                value=float(cur.get("kurtosis", 2.894)),
                step=0.1,
                format="%.3f",
                help="Derajat keruncingan sinyal. Kurtosis > 3 menandakan adanya hentakan tajam akibat retakan",
            )
            crest_factor = st.number_input(
                "Crest Factor (Peak / RMS)",
                min_value=1.0,
                max_value=30.0,
                value=float(cur.get("crest_factor", 3.234)),
                step=0.05,
                format="%.3f",
                help="Rasio puncak terhadap RMS (secara matematis >= 1.0)",
            )

        with c3:
            st.markdown("##### 3. Energi Spektrum Frekuensi Cacat")
            energi_bpfo = st.number_input(
                "Energi BPFO (Cincin Luar)",
                min_value=0.0,
                max_value=5.0,
                value=float(cur.get("energi_bpfo", 0.023)),
                step=0.005,
                format="%.4f",
                help="Energi pada Ball Pass Frequency Outer Race (indikasi kerusakan cincin luar)",
            )
            energi_bpfi = st.number_input(
                "Energi BPFI (Cincin Dalam)",
                min_value=0.0,
                max_value=5.0,
                value=float(cur.get("energi_bpfi", 0.0045)),
                step=0.005,
                format="%.4f",
                help="Energi pada Ball Pass Frequency Inner Race (indikasi kerusakan cincin dalam)",
            )
            energi_bsf = st.number_input(
                "Energi BSF (Elemen Bola)",
                min_value=0.0,
                max_value=5.0,
                value=float(cur.get("energi_bsf", 0.1951)),
                step=0.005,
                format="%.4f",
                help="Energi pada Ball Spin Frequency (indikasi kerusakan bola bantalan)",
            )
            frekuensi_dominan_hz = st.number_input(
                "Frekuensi Dominan Getaran (Hz)",
                min_value=1.0,
                max_value=3000.0,
                value=float(cur.get("frekuensi_dominan_hz", 82.7)),
                step=1.0,
                format="%.1f",
                help="Frekuensi sinyal getaran dengan magnitudo tertinggi (Hz)",
            )

        submit_btn = st.form_submit_button(
            "🔍 Diagnosis Kondisi Bearing Sekarang", type="primary", use_container_width=True
        )

    if submit_btn:
        payload = {
            "posisi_sensor": posisi_sensor,
            "kecepatan_rpm": float(kecepatan_rpm),
            "beban_kN": float(beban_kN),
            "suhu_housing_C": float(suhu_housing_C),
            "rms_g": float(rms_g),
            "puncak_g": float(puncak_g),
            "kurtosis": float(kurtosis),
            "crest_factor": float(crest_factor),
            "energi_bpfo": float(energi_bpfo),
            "energi_bpfi": float(energi_bpfi),
            "energi_bsf": float(energi_bsf),
            "frekuensi_dominan_hz": float(frekuensi_dominan_hz),
        }

        try:
            with st.spinner("Menganalisis pola spektrum dan mengekstraksi fitur..."):
                hasil = prediksi([payload])[0]
        except Exception as err:
            st.error(f"Gagal melakukan inferensi: {err}")
        else:
            kondisi = hasil.get("kondisi", "normal")
            label_kondisi = hasil.get("label_kondisi", kondisi.title())
            confidence = hasil.get("probabilitas_tertinggi", 0.0) * 100
            rekomendasi = hasil.get("rekomendasi", "")
            probas = hasil.get("probabilitas", {})
            latency = hasil.get("latency_ms", 0.0)

            st.divider()
            st.markdown("### 📊 Hasil Diagnosis Kondisi Bearing")

            # ---------------------------------------------------------------
            # Indikator Hasil Berwarna Berdasarkan Prediksi Multikelas
            # ---------------------------------------------------------------
            if kondisi == "normal":
                st.success(
                    f"### ✅ STATUS: {label_kondisi.upper()}\n"
                    f"**Tingkat Keyakinan:** `{confidence:.1f}%` | **Waktu Inferensi:** `{latency:.1f} ms`\n\n"
                    f"**Hasil Analisis:** Spektrum getaran bearing stabil. Tidak ditemukan lonjakan energi frekuensi cacat "
                    f"maupun anomali kejut.\n\n"
                    f"**🛠️ Rekomendasi Teknisi:** {rekomendasi}"
                )
            elif kondisi == "outer_race":
                st.warning(
                    f"### ⚠️ STATUS: {label_kondisi.upper()} (KERUSAKAN CINCIN LUAR)\n"
                    f"**Tingkat Keyakinan:** `{confidence:.1f}%` | **Waktu Inferensi:** `{latency:.1f} ms`\n\n"
                    f"**Hasil Analisis:** Terdeteksi lonjakan energi getaran signifikan pada frekuensi **BPFO ({energi_bpfo:.4f})**. "
                    f"Cincin luar bearing mengalami spalling atau fatigue ringan/sedang.\n\n"
                    f"**🛠️ Rekomendasi Teknisi:** {rekomendasi}"
                )
            elif kondisi == "inner_race":
                st.warning(
                    f"### ⚠️ STATUS: {label_kondisi.upper()} (KERUSAKAN CINCIN DALAM)\n"
                    f"**Tingkat Keyakinan:** `{confidence:.1f}%` | **Waktu Inferensi:** `{latency:.1f} ms`\n\n"
                    f"**Hasil Analisis:** Terdeteksi konsentrasi energi getaran tinggi pada frekuensi **BPFI ({energi_bpfi:.4f})**. "
                    f"Cincin dalam yang berputar bersama poros mengalami retak mikro atau keausan.\n\n"
                    f"**🛠️ Rekomendasi Teknisi:** {rekomendasi}"
                )
            elif kondisi == "bola":
                st.error(
                    f"### 🚨 STATUS: {label_kondisi.upper()} (KERUSAKAN ELEMEN BOLA - KRITIS)\n"
                    f"**Tingkat Keyakinan:** `{confidence:.1f}%` | **Waktu Inferensi:** `{latency:.1f} ms`\n\n"
                    f"**Hasil Analisis:** Lonjakan energi frekuensi **BSF ({energi_bsf:.4f})** disertai kurtosis tinggi. "
                    f"Bola bearing mengalami pitting / retak. Kondisi ini berisiko tinggi menyebabkan poros macet (*bearing seizure*)!\n\n"
                    f"**🛠️ Rekomendasi Teknisi:** {rekomendasi}"
                )

            # Ringkasan Metrik
            m1, m2, m3 = st.columns(3)
            m1.metric("Kondisi Terdeteksi", label_kondisi)
            m2.metric("Keyakinan Model (Confidence)", f"{confidence:.1f}%")
            m3.metric("Waktu Komputasi", f"{latency:.1f} ms")

            # Sebaran Probabilitas Setiap Kelas
            st.markdown("##### 📈 Distribusi Probabilitas Seluruh Kelas")
            p_cols = st.columns(4)
            label_map = {
                "normal": "🟢 Normal",
                "outer_race": "🟡 Outer Race",
                "inner_race": "🟠 Inner Race",
                "bola": "🔴 Bola (Ball)",
            }
            for j, (cls_name, prob_val) in enumerate(probas.items()):
                pct = prob_val * 100
                display_title = label_map.get(cls_name, cls_name.title())
                with p_cols[j]:
                    st.metric(display_title, f"{pct:.1f}%")
                    st.progress(min(max(prob_val, 0.0), 1.0))

            with st.expander("🔍 Detail Payload JSON"):
                st.json({"input": payload, "output": hasil})


# ---------------------------------------------------------------------------
# TAB 2: PREDIKSI BANYAK MESIN (BATCH CSV & DUMMY DATA)
# ---------------------------------------------------------------------------
with tab_batch:
    st.markdown("#### Prediksi Batch Pemantauan Banyak Mesin")
    st.write(
        "Teknisi dapat menguji langsung diagnosis beberapa mesin sekaligus menggunakan **Data Dummy Contoh** "
        "atau mengunggah file spreadsheet CSV rekaman sensor pabrik."
    )

    # Inisialisasi session state untuk batch
    if "df_batch_data" not in st.session_state:
        st.session_state.df_batch_data = None

    col_btn1, col_btn2 = st.columns(2)

    with col_btn1:
        if st.button("📋 Gunakan Contoh Data Dummy Bearing (6 Mesin)", type="secondary", use_container_width=True):
            st.session_state.df_batch_data = pd.DataFrame(DUMMY_DATA_BEARING)
            st.success("Data dummy 6 mesin industri berhasil dimuat!")

    with col_btn2:
        contoh_path = ROOT / "data" / "contoh_batch.csv"
        if contoh_path.exists():
            st.download_button(
                label="📥 Unduh File Template CSV Siap Uji",
                data=contoh_path.read_bytes(),
                file_name="contoh_rekaman_bearing.csv",
                mime="text/csv",
                use_container_width=True,
                help="Unduh file CSV contoh rekaman bearing untuk diedit",
            )

    st.markdown("---")
    file_up = st.file_uploader("Atau unggah file CSV mandiri", type=["csv"])
    if file_up is not None:
        try:
            st.session_state.df_batch_data = pd.read_csv(file_up)
        except Exception as e:
            st.error(f"Gagal membaca file CSV: {e}")

    df_active = st.session_state.df_batch_data

    if df_active is not None:
        st.markdown(f"##### Preview Data Input ({len(df_active)} rekaman):")
        st.dataframe(df_active, use_container_width=True, hide_index=True)

        kolom_kurang = [k for k in FITUR_BEARING if k not in df_active.columns]
        if kolom_kurang:
            st.error(f"Kolom wajib berikut belum ada di file CSV: {kolom_kurang}")
        else:
            if st.button("⚡ Jalankan Diagnosis Batch Seluruh Mesin", type="primary", use_container_width=True):
                with st.spinner("Memproses diagnosis seluruh rekaman mesin..."):
                    X_input = df_active[FITUR_BEARING]
                    rows = (
                        X_input.astype(object)
                        .where(X_input.notna(), None)
                        .to_dict("records")
                    )
                    hasil_list = prediksi(rows)

                # Format DataFrame Hasil
                res_df = pd.DataFrame(hasil_list)
                df_out = df_active.copy().reset_index(drop=True)
                df_out["diagnosis_kondisi"] = res_df["label_kondisi"]
                df_out["confidence"] = (res_df["probabilitas_tertinggi"] * 100).round(1).astype(str) + "%"
                df_out["rekomendasi_suku_cadang"] = res_df["rekomendasi"]

                # Tampilkan Ringkasan Metrik Batch
                st.divider()
                st.markdown("### 📋 Ringkasan Hasil Diagnosis Lapangan")
                kondisi_counts = res_df["kondisi"].value_counts().to_dict()

                s1, s2, s3, s4, s5 = st.columns(5)
                s1.metric("Total Mesin", f"{len(df_out)}")
                s2.metric("🟢 Normal", f"{kondisi_counts.get('normal', 0)}")
                s3.metric("🟡 Cacat Cincin Luar", f"{kondisi_counts.get('outer_race', 0)}")
                s4.metric("🟠 Cacat Cincin Dalam", f"{kondisi_counts.get('inner_race', 0)}")
                s5.metric("🔴 Cacat Bola (Kritis)", f"{kondisi_counts.get('bola', 0)}")

                st.dataframe(df_out, use_container_width=True, hide_index=True)

                # Export hasil batch
                csv_bytes = df_out.to_csv(index=False).encode("utf-8")
                st.download_button(
                    label="💾 Unduh Hasil Diagnosis Lengkap (CSV)",
                    data=csv_bytes,
                    file_name="hasil_diagnosis_bearing_mesin.csv",
                    mime="text/csv",
                    type="primary",
                )
