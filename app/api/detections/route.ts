import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/utils/supabse/server";
import { z } from "zod";
import { detectMovement } from "@/lib/detection/detection-engine";

const detectionRequestSchema = z.object({
  sessionId: z.string().uuid(),
  deviceId: z.string().uuid(),
  zone: z.string().min(1),
  telemetry: z.object({
    rssi: z.number().optional(),
    meanAmplitude: z.number().optional(),
    amplitudeStd: z.number().optional(),
    rmsAmplitude: z.number().optional(),
    frameDifference: z.number().optional(),
    rollingVariation: z.number().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate request body
    const result = detectionRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid detection request",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { sessionId, deviceId, zone, telemetry } = result.data;

    // 2. Check session status
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 },
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Session is not active" },
        { status: 409 },
      );
    }

    // 3. Check device
    const { data: device, error: deviceError } = await supabaseAdmin
      .from("devices")
      .select("id, device_id, status")
      .eq("id", deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { success: false, error: "Device not found" },
        { status: 404 },
      );
    }

    // 4. Update device heartbeat
    await supabaseAdmin
      .from("devices")
      .update({
        status: "ONLINE",
        last_seen: new Date().toISOString(),
      })
      .eq("id", deviceId);

    // 5. Run detection engine
    const detection = detectMovement(telemetry);

    if (!detection.detected) {
      return NextResponse.json({
        success: true,
        detected: false,
        detection,
      });
    }

    // 6. Save detection with array of device UUIDs
    const { data, error } = await supabaseAdmin
      .from("detections")
      .insert({
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        zone,
        type: detection.type,
        presence_score: detection.presenceScore,
        movement_score: detection.movementScore,
        survivor_probability: detection.survivorProbability,
        status: "UNVERIFIED",
        contributing_devices: [deviceId],
      })
      .select()
      .single();

    if (error) {
      console.error("Detection insert error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save detection",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      detected: true,
      detection: data,
      analysis: {
        movementScore: detection.movementScore,
        presenceScore: detection.presenceScore,
        survivorProbability: detection.survivorProbability,
        reason: detection.reason,
      },
    });
  } catch (error) {
    console.error("POST /api/detections error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
