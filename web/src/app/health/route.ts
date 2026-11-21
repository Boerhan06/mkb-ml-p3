import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    versi_model: "1.0.0",
    macro_f1: 0.8014,
    fitur_input: [
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
    kasus: "Kasus 4: Diagnosis Kerusakan Bearing",
    kelas_target: ["bola", "inner_race", "normal", "outer_race"],
  });
}
