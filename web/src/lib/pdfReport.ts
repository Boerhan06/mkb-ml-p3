import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PredictionResponse,
  SensorInput,
  MachineUnit,
  UserProfile,
  RekomendasiData,
} from "@/types/bearing";

export interface GeneratePDFParams {
  prediction: PredictionResponse;
  sensorInput: SensorInput;
  rekom: RekomendasiData;
  machine?: MachineUnit;
  operator?: UserProfile;
}

/**
 * Menghasilkan dan mengunduh berkas laporan diagnostik getaran bantalan mesin berstandar ISO 20816 dalam format PDF.
 */
export function generateDiagnosticPDF({
  prediction,
  sensorInput,
  rekom,
  machine,
  operator,
}: GeneratePDFParams) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Waktu & Nomor Dokumen
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const docId = `VBR-RPT-${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${randomSuffix}`;

  const isKritis = prediction.status_bahaya === "KRITIS";
  const isWaspada = prediction.status_bahaya === "WASPADA";
  const isNormal = prediction.kelas_prediksi === "Normal";

  // 1. Header Banner Atas (Deep Emerald Industrial)
  doc.setFillColor(27, 67, 50); // #1B4332
  doc.rect(0, 0, pageWidth, 26, "F");

  // Garis Aksen Sage Hijau
  doc.setFillColor(107, 144, 113); // #6B9071
  doc.rect(0, 26, pageWidth, 1.8, "F");

  // Teks Brand Kiri
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("VIBRACHECK INDUSTRIAL HUB", margin, 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(227, 238, 212); // #E3EED4
  doc.text(
    "Laporan Diagnostik Getaran & Kesehatan Bantalan Mesin (ISO 20816-3)",
    margin,
    16.5
  );

  // Metadata Dokumen Kanan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(docId, pageWidth - margin, 10.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(227, 238, 212);
  doc.text(
    `Waktu Inspeksi: ${dateStr}, ${timeStr} WIB`,
    pageWidth - margin,
    16.5,
    { align: "right" }
  );

  // 2. Metadata Grid (Mesin, Tag, Operasi, Operator)
  const metaY = 32;
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(174, 195, 176); // #AEC3B0
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, metaY, contentWidth, 23, 2, 2, "FD");

  const colW = contentWidth / 4;
  const activeMachineName = machine?.name || "Turbine Pump #04";
  const activeMachineLocation = machine?.location || "Plant Semen - Line 2";
  const activeTag = machine?.tag || "DE-04B";
  const sensorPosText =
    sensorInput.posisi_sensor === "drive_end"
      ? "Drive End (DE)"
      : "Fan End (FE)";
  const activeOperatorName = operator?.name || "Burhan AR";
  const activeOperatorRole = operator?.role || "Lead Vibration Engineer";

  const metaItems = [
    {
      label: "UNIT MESIN",
      val: activeMachineName,
      sub: activeMachineLocation,
    },
    {
      label: "POSISI & TAG",
      val: sensorPosText,
      sub: `Tag: ${activeTag}`,
    },
    {
      label: "KONDISI OPERASI",
      val: `${sensorInput.kecepatan_rpm.toLocaleString()} RPM`,
      sub: `Beban: ${sensorInput.beban_kN.toFixed(1)} kN`,
    },
    {
      label: "OPERATOR ANALIS",
      val: activeOperatorName,
      sub: activeOperatorRole,
    },
  ];

  metaItems.forEach((item, idx) => {
    const x = margin + idx * colW + 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(107, 144, 113);
    doc.text(item.label, x, metaY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 42, 29); // #0F2A1D
    doc.text(item.val, x, metaY + 11.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(55, 85, 52); // #375534
    doc.text(item.sub, x, metaY + 16.5);

    if (idx < 3) {
      doc.setDrawColor(210, 225, 212);
      doc.line(
        margin + (idx + 1) * colW,
        metaY + 3,
        margin + (idx + 1) * colW,
        metaY + 20
      );
    }
  });

  // 3. Status Callout Box (Keparahan & Kesimpulan Diagnosa)
  const statusY = 59;
  let statusBg: [number, number, number] = [240, 253, 244];
  let statusBorder: [number, number, number] = [34, 139, 34];
  let statusTextCol: [number, number, number] = [22, 101, 52];
  let statusTitle = `STATUS: AMAN - OPERASI NORMAL (ZONA A/B)`;
  let statusPriority = "Prioritas Penanganan: PEMELIHARAAN RUTIN BULANAN";

  if (isKritis) {
    statusBg = [254, 242, 242];
    statusBorder = [220, 53, 69];
    statusTextCol = [185, 28, 28];
    statusTitle = `STATUS: KRITIS - KERUSAKAN ${prediction.kelas_prediksi.toUpperCase()} TERDETEKSI`;
    statusPriority = "Prioritas Penanganan: MENDESAK / SHUTDOWN CEPAT (1-3 HARI)";
  } else if (isWaspada) {
    statusBg = [255, 251, 235];
    statusBorder = [217, 119, 6];
    statusTextCol = [180, 83, 9];
    statusTitle = `STATUS: WASPADA - CACAT AWAL BANTALAN (${prediction.kelas_prediksi.toUpperCase()})`;
    statusPriority = "Prioritas Penanganan: JADWALKAN INSPEKSI MEKANIK (< 7 HARI)";
  }

  doc.setFillColor(...statusBg);
  doc.setDrawColor(...statusBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, statusY, contentWidth, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...statusTextCol);
  doc.text(statusTitle, margin + 4, statusY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(55, 85, 52);
  doc.text(
    `Model AI: Random Forest (Keyakinan: ${(prediction.keyakinan * 100).toFixed(
      1
    )}% | Macro F1: 0.8014) · Evaluasi Standar: ${rekom.zona_iso_20816}`,
    margin + 4,
    statusY + 10.5
  );

  doc.text(
    `Parameter Kunci: RMS ${sensorInput.rms_g.toFixed(
      2
    )} g | Puncak ${sensorInput.puncak_g.toFixed(2)} g | Kurtosis ${sensorInput.kurtosis.toFixed(
      2
    )} | Freq. Dominan ${sensorInput.frekuensi_dominan_hz.toFixed(1)} Hz | Suhu ${sensorInput.suhu_housing_C.toFixed(1)} °C`,
    margin + 4,
    statusY + 14.5
  );

  // 4. Tabel 12 Parameter Masukan & Fitur Fisika
  const tableData = [
    [
      "1",
      "Posisi Sensor Akselerometer",
      sensorPosText,
      "-",
      "DE / FE Sesuai Tagging",
      "Valid",
    ],
    [
      "2",
      "Kecepatan Putaran Poros (Speed)",
      sensorInput.kecepatan_rpm.toLocaleString(),
      "RPM",
      "1000 - 3600 RPM",
      "Normal",
    ],
    [
      "3",
      "Beban Operasional Mekanis",
      sensorInput.beban_kN.toFixed(2),
      "kN",
      "1.0 - 50.0 kN",
      "Normal",
    ],
    [
      "4",
      "Suhu Housing Bantalan",
      sensorInput.suhu_housing_C.toFixed(1),
      "°C",
      "< 75.0 °C (Alarm > 85 °C)",
      sensorInput.suhu_housing_C >= 85
        ? "Kritis"
        : sensorInput.suhu_housing_C >= 75
        ? "Waspada"
        : "Normal",
    ],
    [
      "5",
      "Getaran RMS (Root Mean Square)",
      sensorInput.rms_g.toFixed(3),
      "g",
      "< 0.500 g (Zona A/B ISO)",
      sensorInput.rms_g > 1.8
        ? "Kritis"
        : sensorInput.rms_g > 0.8
        ? "Waspada"
        : "Normal",
    ],
    [
      "6",
      "Getaran Nilai Puncak (Peak)",
      sensorInput.puncak_g.toFixed(3),
      "g",
      "< 1.500 g (Batas Wajar)",
      sensorInput.puncak_g > 2.5
        ? "Kritis"
        : sensorInput.puncak_g > 1.5
        ? "Waspada"
        : "Normal",
    ],
    [
      "7",
      "Kurtosis Distribusi Sinyal",
      sensorInput.kurtosis.toFixed(2),
      "-",
      "~ 3.0 (Gaussian Normal)",
      sensorInput.kurtosis > 4.5 || sensorInput.kurtosis < 2.0
        ? "Abnormal"
        : "Normal",
    ],
    [
      "8",
      "Crest Factor (Peak / RMS)",
      sensorInput.crest_factor.toFixed(2),
      "-",
      "1.4 - 3.5 (Operasi Wajar)",
      sensorInput.crest_factor > 3.5 || sensorInput.crest_factor < 1.4
        ? "Waspada"
        : "Normal",
    ],
    [
      "9",
      "Frekuensi Dominan FFT",
      sensorInput.frekuensi_dominan_hz.toFixed(1),
      "Hz",
      `1X Rotasi (~${(sensorInput.kecepatan_rpm / 60).toFixed(1)} Hz)`,
      isNormal ? "Normal (1X)" : "Harmonik Cacat",
    ],
    [
      "10",
      "Energi Harmonik BPFO (Outer Race)",
      sensorInput.energi_bpfo.toFixed(4),
      "g²",
      "< 0.0500 g²",
      sensorInput.energi_bpfo > 0.1 ? "Tinggi (Kritis)" : "Aman",
    ],
    [
      "11",
      "Energi Harmonik BPFI (Inner Race)",
      sensorInput.energi_bpfi.toFixed(4),
      "g²",
      "< 0.0500 g²",
      sensorInput.energi_bpfi > 0.1 ? "Tinggi (Kritis)" : "Aman",
    ],
    [
      "12",
      "Energi Harmonik BSF (Ball Fault)",
      sensorInput.energi_bsf.toFixed(4),
      "g²",
      "< 0.0500 g²",
      sensorInput.energi_bsf > 0.1 ? "Tinggi (Kritis)" : "Aman",
    ],
  ];

  autoTable(doc, {
    startY: 81,
    margin: { left: margin, right: margin },
    head: [
      [
        "No",
        "Parameter Masukan & Fitur Fisika",
        "Nilai Terukur",
        "Satuan",
        "Rentang Acuan / Standar",
        "Evaluasi",
      ],
    ],
    body: tableData,
    styles: {
      fontSize: 7.2,
      cellPadding: 1.7,
      textColor: [15, 42, 29],
    },
    headStyles: {
      fillColor: [27, 67, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 248],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 62 },
      2: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 46, halign: "center" },
      5: { cellWidth: 24, halign: "center", fontStyle: "bold" },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 5) {
        const val = String(data.cell.raw);
        if (
          val.includes("Kritis") ||
          val.includes("Abnormal") ||
          val.includes("Tinggi")
        ) {
          data.cell.styles.textColor = [190, 40, 40];
        } else if (val.includes("Waspada") || val.includes("Harmonik")) {
          data.cell.styles.textColor = [180, 83, 9];
        } else {
          data.cell.styles.textColor = [34, 120, 34];
        }
      }
    },
  });

  const lastTableY = (doc as any).lastAutoTable?.finalY || 168;
  const afterTableY = lastTableY + 4;

  // 5. Rekomendasi Tindakan & Suku Cadang (2 Kolom)
  const recCardW = (contentWidth - 4) / 2;
  const recH = 34;

  // Kolom Kiri: Tindakan
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(174, 195, 176);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, afterTableY, recCardW, recH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(27, 67, 50);
  doc.text("REKOMENDASI TINDAKAN TEKNISI", margin + 3.5, afterTableY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(30, 40, 30);
  const tindakanLines = doc.splitTextToSize(rekom.tindakan, recCardW - 7);
  doc.text(tindakanLines, margin + 3.5, afterTableY + 10.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(isKritis ? 185 : isWaspada ? 180 : 34, isKritis ? 28 : isWaspada ? 83 : 120, isKritis ? 28 : 9);
  doc.text(statusPriority, margin + 3.5, afterTableY + 29.5);

  // Kolom Kanan: Suku Cadang
  const col2X = margin + recCardW + 4;
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(174, 195, 176);
  doc.roundedRect(col2X, afterTableY, recCardW, recH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(27, 67, 50);
  doc.text("SPESIFIKASI SUKU CADANG & GUDANG", col2X + 3.5, afterTableY + 5.5);

  const partDetails = [
    { label: "Komponen", val: rekom.komponen },
    { label: "Kode Part", val: rekom.kode_suku_cadang },
    { label: "Stok Gudang", val: rekom.ketersediaan },
    { label: "Standar Evaluasi", val: rekom.zona_iso_20816 },
  ];

  partDetails.forEach((pd, idx) => {
    const y = afterTableY + 11 + idx * 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(107, 144, 113);
    doc.text(pd.label + ":", col2X + 3.5, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 42, 29);
    doc.text(pd.val, col2X + 27, y);
  });

  // 6. Otorisasi & Tanda Tangan
  const signY = afterTableY + recH + 4.5;
  doc.setFillColor(252, 254, 252);
  doc.setDrawColor(210, 225, 212);
  doc.roundedRect(margin, signY, contentWidth, 24, 2, 2, "FD");

  // Kiri: Sistem AI
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(27, 67, 50);
  doc.text("DIVERIFIKASI SISTEM PREDIKTIF AI:", margin + 4, signY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(55, 85, 52);
  doc.text(
    "Algoritma: Scikit-Learn Random Forest Pipeline Classifier",
    margin + 4,
    signY + 9.5
  );
  doc.text(
    "Akurasi Validasi Uji: 84.0% | Macro F1-Score: 0.8014",
    margin + 4,
    signY + 13.5
  );
  doc.text(
    "Status: Telemetri Sinyal Getaran Terverifikasi & Lolos Guardrail Pydantic",
    margin + 4,
    signY + 17.5
  );

  // Kanan: Penanggung Jawab
  const signRightX = margin + contentWidth - 65;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(27, 67, 50);
  doc.text("LEAD VIBRATION ENGINEER:", signRightX, signY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 42, 29);
  doc.text(`( ${activeOperatorName} )`, signRightX, signY + 17.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(107, 144, 113);
  doc.text(
    `${activeOperatorRole} · Sertifikasi ISO 18436-2`,
    signRightX,
    signY + 21
  );

  // 7. Footer Bawah
  const footerY = 290;
  doc.setDrawColor(200, 215, 202);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(107, 144, 113);
  doc.text(
    "VibraCheck · Industrial Bearing Diagnostic Hub · PT Solusi Bangun Semen",
    margin,
    footerY
  );
  doc.text(
    "Halaman 1 dari 1 · Standar Evaluasi Getaran ISO 20816-3",
    pageWidth - margin,
    footerY,
    { align: "right" }
  );

  // Unduh Berkas PDF
  const cleanCond = prediction.kelas_prediksi.replace(/\s+/g, "_");
  doc.save(`Laporan_Diagnostik_VibraCheck_${cleanCond}_${activeTag}.pdf`);
}
