import { detectMovement } from "@/lib/detection/detection-engine";
import { supabaseClient } from "@/lib/utils/supabse/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { sessionId, zone, telemetry } = body;

    if (!sessionId || !zone || !telemetry) {
      return NextResponse.json(
        {
          success: false,
          error: "sessionId, zone and telemetry are required",
        },
        { status: 400 },
      );
    }

    // 👇 ADD IT HERE
    const detection = detectMovement({
      rssi: telemetry.rssi,

      meanAmplitude: telemetry.meanAmplitude,
      amplitudeStd: telemetry.amplitudeStd,
      rmsAmplitude: telemetry.rmsAmplitude,
      frameDifference: telemetry.frameDifference,
      rollingVariation: telemetry.rollingVariation,
    });

    console.log("Detection analysis:", detection);

    // Then save detection to Supabase
    const { data, error } = await supabaseClient
      .from("detections")
      .insert({
        session_id: sessionId,
        zone,

        type: detection.type,
        presence_score: detection.presenceScore,
        movement_score: detection.movementScore,
        survivor_probability: detection.survivorProbability,
        status: "UNVERIFIED",
      })
      .select()
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      detected: detection.survivorProbability > 0.5,

      detection: data,

      analysis: {
        movementScore: detection.movementScore,
        presenceScore: detection.presenceScore,
        survivorProbability: detection.survivorProbability,
        reason: detection.reason,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Detection processing failed",
      },
      { status: 500 },
    );
  }
}
