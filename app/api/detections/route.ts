import { translatePrediction } from "@/lib/ml/translatePrediction";
import { mlPredictionSchema } from "@/lib/vaildation/mlPrediction";
import { supabaseAdmin } from "@/lib/utils/supabse/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required in search params (?sessionId=UUID)",
        },
        { status: 400 },
      );
    }

    // 1. Validate active session state
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
        },
        { status: 404 },
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: "Session is not active",
        },
        { status: 409 },
      );
    }

    // 2. Validate request body against the central ML schema
    const body = await request.json();
    const validationResult = mlPredictionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = validationResult.data;
    const translated = translatePrediction(data.prediction);

    // 3. No presence detected
    if (!translated) {
      return NextResponse.json({
        success: true,
        detected: false,
        message: "No presence detected. Skipping insertion.",
      });
    }

    // 4. Save ML Detection
    const { data: insertedDetection, error } = await supabaseAdmin
      .from("detections")
      .insert({
        session_id: sessionId,
        timestamp: data.timestamp,
        zone: translated.zone,
        type: translated.type,
        presence_score: translated.presence_score,
        movement_score: translated.movement_score,
        survivor_probability: translated.survivor_probability,
        status: "UNVERIFIED",
        contributing_devices: [],
        environment_mode: data.environment_mode,
        activity: translated.activity,
        ml_confidence: translated.ml_confidence,
        alert_level: translated.alert_level,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert ML detection:", error);
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
      detected: true,
      detection: insertedDetection,
    });
  } catch (error) {
    console.error("POST detection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process detection payload",
      },
      { status: 500 },
    );
  }
}
