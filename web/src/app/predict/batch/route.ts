import { NextRequest, NextResponse } from "next/server";
import { validateSensorInput, computePrediction } from "@/lib/serverPredictor";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { detail: "Request body harus berupa list/array dari data sensor." },
        { status: 400 }
      );
    }

    if (body.length > 1000) {
      return NextResponse.json(
        { detail: "Ukuran batch melebihi batas maksimum 1000 baris." },
        { status: 400 }
      );
    }

    const results = [];
    for (let i = 0; i < body.length; i++) {
      const item = body[i];
      const validation = validateSensorInput(item);
      if (!validation.valid) {
        return NextResponse.json(
          {
            detail: validation.errors.map((e) => ({
              ...e,
              loc: ["body", i, ...(e.loc.slice(1))],
            })),
          },
          { status: 422 }
        );
      }
      results.push(computePrediction(validation.data!, startTime));
    }

    return NextResponse.json(results, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Gagal memproses batch: ${err?.message}` },
      { status: 400 }
    );
  }
}
