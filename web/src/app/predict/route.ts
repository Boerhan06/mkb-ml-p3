import { NextRequest, NextResponse } from "next/server";
import { validateSensorInput, computePrediction } from "@/lib/serverPredictor";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const validation = validateSensorInput(body);

    if (!validation.valid) {
      return NextResponse.json(
        { detail: validation.errors },
        { status: 422 }
      );
    }

    const prediction = computePrediction(validation.data!, startTime);
    return NextResponse.json(prediction, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        detail: [
          {
            type: "json_invalid",
            loc: ["body"],
            msg: `Format JSON tidak valid: ${err?.message || "Unknown error"}`,
            input: null,
          },
        ],
      },
      { status: 422 }
    );
  }
}
