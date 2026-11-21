import { NextRequest, NextResponse } from "next/server";
import { PRESET_INPUTS } from "@/lib/constants";
import { ScenarioPreset } from "@/types/bearing";

const SIMULASI_MAP: Record<string, ScenarioPreset> = {
  normal: "Normal",
  outer_race: "Outer Race",
  inner_race: "Inner Race",
  bola: "Ball Fault",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kondisi: string }> }
) {
  const { kondisi } = await params;
  const normalized = kondisi?.toLowerCase();
  const presetKey = SIMULASI_MAP[normalized];

  if (!presetKey || !PRESET_INPUTS[presetKey]) {
    return NextResponse.json(
      {
        detail: `Kondisi '${kondisi}' tidak ditemukan. Pilihan: normal, outer_race, inner_race, bola.`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(PRESET_INPUTS[presetKey], { status: 200 });
}
